'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Minus, Plus, Trash2, ArrowDownCircle } from 'lucide-react';
import { StockItem } from '../lib/types';
import { updateStockQuantity, saveStock } from '../lib/stock-utils';
// We would ideally import useStock here but since this is client component in Next app folder structure,
// let's just use localStorage directly or duplicate the simple logic for now if hooks are problematic in SSR context
// but 'use client' handles it. Let's try to make a robust reusable hook later.
// For now, I'll inline the logic to ensure it works without complex context providers first.

export default function StockPage() {
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Load stock
    useEffect(() => {
        const stored = localStorage.getItem('egalim_stock_v1');
        if (stored) {
            try {
                setStock(JSON.parse(stored));
            } catch (e) {
                console.error("Error loading stock", e);
            }
        }
        setLoading(false);
    }, []);

    // Sync stock across tabs/pages when storage changes or page gains focus
    useEffect(() => {
        const handleSync = () => {
            const stored = localStorage.getItem('egalim_stock_v1');
            if (stored) {
                try {
                    setStock(JSON.parse(stored));
                } catch (e) {
                    console.error("Error syncing stock", e);
                }
            }
        };

        window.addEventListener('storage', handleSync);
        window.addEventListener('focus', handleSync);

        return () => {
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('focus', handleSync);
        };
    }, []);

    // Save stock whenever it changes
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('egalim_stock_v1', JSON.stringify(stock));
        }
    }, [stock, loading]);

    const updateQuantity = (id: string, delta: number) => {
        const newStock = updateStockQuantity(id, delta);
        setStock(newStock);
    };

    const removeItem = (id: string) => {
        if (confirm('Supprimer cet article du stock définitivement ?')) {
            setStock(prev => prev.filter(item => item.id !== id));
        }
    };

    const filteredStock = stock.filter(item =>
        item.produit.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalValue = stock.reduce((acc, item) => acc + (item.prix_unitaire * item.quantite), 0);

    if (loading) return <div className="p-8 text-center">Chargement du stock...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-8 h-8 text-blue-600" />
                        Gestion des Stocks
                    </h1>
                    <p className="text-gray-500">Suivez vos stocks et déduisez les consommations</p>
                </div>

                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-sm text-gray-500">Valeur totale du stock</span>
                    <div className="text-2xl font-bold text-gray-900">{totalValue.toFixed(2)} €</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Produit</th>
                                <th className="px-6 py-4 text-center">Type</th>
                                <th className="px-6 py-4 text-right">Prix U.</th>
                                <th className="px-6 py-4 text-center">Quantité (Stock)</th>
                                <th className="px-6 py-4 text-right">Valeur</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStock.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Aucun produit dans le stock pour le moment.
                                        <br />
                                        <span className="text-sm text-gray-400">Ajoutez des factures pour remplir votre stock.</span>
                                    </td>
                                </tr>
                            ) : (
                                filteredStock.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.produit.replace('[BIO] ', '')}
                                            {item.quantite < 1 && <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">Épuisé</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.est_bio ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    BIO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Standard
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={item.prix_unitaire}
                                                onChange={(e) => {
                                                    const price = parseFloat(e.target.value) || 0;
                                                    setStock(prev => prev.map(si => si.id === item.id ? { ...si, prix_unitaire: price } : si));
                                                }}
                                                className="w-20 text-right bg-transparent border-b border-dashed border-gray-200 focus:border-blue-400 focus:outline-none"
                                            /> €
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95 shadow-sm"
                                                    title="Consommer 1 unité"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>

                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.quantite}
                                                    onChange={(e) => {
                                                        const qty = parseFloat(e.target.value) || 0;
                                                        setStock(prev => prev.map(si => si.id === item.id ? { ...si, quantite: qty } : si));
                                                    }}
                                                    className="w-16 text-center font-bold text-base bg-transparent border-b border-dashed border-gray-200 focus:border-blue-400 focus:outline-none"
                                                />

                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all active:scale-95 shadow-sm"
                                                    title="Ajouter 1 unité"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {(item.quantite * item.prix_unitaire).toFixed(2)} €
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Supprimer la ligne"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
