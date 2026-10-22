'use client';

import React, { useState } from 'react';
import { Package, X, Search, AlertTriangle, CheckCircle2, AlertCircle, Printer, RefreshCw, Layers } from 'lucide-react';
import { StockItem } from '../lib/types';
import { getStock } from '../lib/stock-utils';

interface RequiredItem {
  id: string;
  produit: string;
  quantite: number;
  est_bio?: boolean;
  unite?: string;
  source?: string;
}

interface InstantStockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  requiredItems: RequiredItem[];
  activeDay: string;
  convives: number;
}

export default function InstantStockDrawer({
  isOpen,
  onClose,
  requiredItems,
  activeDay,
  convives
}: InstantStockDrawerProps) {
  const [stock, setStock] = useState<StockItem[]>(() => getStock());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'MENU_ONLY' | 'ALL'>('MENU_ONLY');

  if (!isOpen) return null;

  const refreshStock = () => {
    setStock(getStock());
  };

  // Traitement et croisement entre stock réel et besoins
  const analysis = stock.map(item => {
    const cleanItemName = item.produit.toLowerCase().replace('[bio] ', '').trim();
    
    // Trouver si requis dans le menu
    const matchedRequired = requiredItems.filter(r => 
      r.produit.toLowerCase().replace('[bio] ', '').trim() === cleanItemName
    );

    const quantiteRequise = matchedRequired.reduce((sum, r) => sum + r.quantite, 0);
    const restant = item.quantite - quantiteRequise;

    let status: 'OK' | 'WARNING' | 'CRITICAL' | 'UNUSED' = 'UNUSED';
    if (quantiteRequise > 0) {
      if (restant < 0) status = 'CRITICAL';
      else if (restant <= item.quantite * 0.2) status = 'WARNING';
      else status = 'OK';
    }

    return {
      item,
      quantiteRequise,
      restant,
      status,
      isUsedInMenu: quantiteRequise > 0
    };
  });

  // Ajouter aussi les articles requis qui n'existent pas du tout dans le stock
  const missingFromStockEntirely = requiredItems.filter(r => {
    const cleanR = r.produit.toLowerCase().replace('[bio] ', '').trim();
    return !stock.some(s => s.produit.toLowerCase().replace('[bio] ', '').trim() === cleanR);
  });

  const filteredItems = analysis.filter(entry => {
    if (filterMode === 'MENU_ONLY' && !entry.isUsedInMenu) return false;
    if (searchTerm.trim()) {
      return entry.item.produit.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const totalUsedCount = analysis.filter(e => e.isUsedInMenu).length + missingFromStockEntirely.length;
  const criticalCount = analysis.filter(e => e.status === 'CRITICAL').length + missingFromStockEntirely.length;

  const handlePrintStock = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500 rounded-xl text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Stock à l'Instantané</h2>
              <p className="text-xs text-slate-300">
                Disponibilité en direct pour {activeDay} ({convives} repas)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshStock}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Rafraîchir les stocks"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrintStock}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Imprimer l'état des stocks"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Summary Alert */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Ingrédients Menu</span>
              <span className="text-lg font-extrabold text-gray-900">{totalUsedCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-gray-200">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">Disponibles</span>
              <span className="text-lg font-extrabold text-emerald-700">
                {analysis.filter(e => e.status === 'OK').length}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-rose-200 bg-rose-50/50">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">Manquants / Rupture</span>
              <span className="text-lg font-extrabold text-rose-700">{criticalCount}</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrer un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex bg-gray-200 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setFilterMode('MENU_ONLY')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterMode === 'MENU_ONLY' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Menu ({totalUsedCount})
              </button>
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterMode === 'ALL' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tout ({stock.length})
              </button>
            </div>
          </div>
        </div>

        {/* Stock Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs divide-y divide-gray-100">
          {/* Alerte pour les produits requis non en stock */}
          {missingFromStockEntirely.map(missing => (
            <div key={missing.id} className="pt-2 flex items-center justify-between p-3 bg-rose-50/80 rounded-xl border border-rose-200">
              <div>
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {missing.produit}
                </div>
                <div className="text-[10px] text-rose-700 mt-0.5">
                  Produit non référencé dans l'inventaire en stock
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-extrabold rounded-md text-[11px]">
                  Besoin : {missing.quantite} {missing.unite || 'kg'}
                </span>
                <div className="text-[10px] text-rose-600 font-bold mt-0.5">À commander d'urgence</div>
              </div>
            </div>
          ))}

          {filteredItems.map(entry => {
            const isBio = entry.item.est_bio;
            const unit = 'kg';

            return (
              <div key={entry.item.id} className="pt-2 flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-all">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-gray-900">{entry.item.produit.replace('[BIO] ', '')}</span>
                    {isBio && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black px-1.5 rounded">
                        BIO
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    Prix unitaire : {entry.item.prix_unitaire.toFixed(2)} € / {unit}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-gray-800">
                      Stock actuel : <strong>{entry.item.quantite} {unit}</strong>
                    </div>
                    {entry.isUsedInMenu && (
                      <div className="text-[10px] text-gray-500">
                        Requis : <strong className="text-orange-600">{entry.quantiteRequise.toFixed(1)} {unit}</strong>
                        {' → '}
                        Projeté : <strong className={entry.restant < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {entry.restant.toFixed(1)} {unit}
                        </strong>
                      </div>
                    )}
                  </div>

                  {entry.status === 'CRITICAL' && (
                    <span className="px-2 py-1 bg-rose-100 text-rose-800 font-black rounded-lg text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Rupture ({Math.abs(entry.restant).toFixed(1)})
                    </span>
                  )}
                  {entry.status === 'WARNING' && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px]">
                      Stock Juste
                    </span>
                  )}
                  {entry.status === 'OK' && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Prêt
                    </span>
                  )}
                  {entry.status === 'UNUSED' && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 font-medium rounded-lg text-[10px]">
                      Non utilisé
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Mise à jour en temps réel avec vos factures scannées.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Fermer le volet
          </button>
        </div>
      </div>
    </div>
  );
}
