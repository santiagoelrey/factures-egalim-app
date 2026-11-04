'use client';

import { useState, useEffect } from 'react';
import { InvoiceLine, StockItem } from '../lib/types';
import { generateStockId, safeNumber, getStock, saveStock } from '../lib/stock-utils';

export function useStock() {
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            setStock(getStock());
        } catch (e) {
            console.error("Failed to load stock", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save to localStorage when stock changes
    useEffect(() => {
        if (!loading) {
            saveStock(stock);
        }
    }, [stock, loading]);

    const addToStock = (line: InvoiceLine) => {
        const id = generateStockId(line.produit, line.est_bio);
        const now = new Date().toISOString();
        const incomingQty = safeNumber(line.quantite, 0);
        const incomingPu = safeNumber(line.prix_unitaire, 0);
        const incomingTotal = safeNumber(line.total_ht, Math.round(incomingQty * incomingPu * 100) / 100);

        setStock(prev => {
            const existingIndex = prev.findIndex(item => item.id === id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                const current = updated[existingIndex];
                const newQty = Math.max(0, Math.round((current.quantite + incomingQty) * 1000) / 1000);
                const finalPu = incomingPu > 0 ? incomingPu : current.prix_unitaire;
                const newTotal = Math.round(newQty * finalPu * 100) / 100;

                updated[existingIndex] = {
                    ...current,
                    quantite: newQty,
                    prix_unitaire: finalPu,
                    total_ht: newTotal,
                    tva: Math.round(newTotal * 0.055 * 100) / 100,
                    ttc: Math.round(newTotal * 1.055 * 100) / 100,
                    dernier_mouvement: now,
                };
                return updated;
            } else {
                const newItem: StockItem = {
                    ...line,
                    id,
                    quantite: incomingQty,
                    prix_unitaire: incomingPu,
                    total_ht: incomingTotal,
                    tva: safeNumber(line.tva, Math.round(incomingTotal * 0.055 * 100) / 100),
                    ttc: safeNumber(line.ttc, Math.round(incomingTotal * 1.055 * 100) / 100),
                    date_ajout: now,
                    dernier_mouvement: now
                };
                return [...prev, newItem];
            }
        });
    };

    const updateQuantity = (id: string, newQuantity: number) => {
        const qty = safeNumber(newQuantity, 0);
        setStock(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const newQty = Math.max(0, qty);
                    const total = Math.round(newQty * (item.prix_unitaire || 0) * 100) / 100;
                    return { 
                        ...item, 
                        quantite: newQty, 
                        total_ht: total,
                        dernier_mouvement: new Date().toISOString() 
                    };
                }
                return item;
            });
        });
    };

    const removeFromStock = (id: string, amount: number) => {
        const amt = safeNumber(amount, 0);
        setStock(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const newQty = Math.max(0, Math.round((item.quantite - amt) * 1000) / 1000);
                    const total = Math.round(newQty * (item.prix_unitaire || 0) * 100) / 100;
                    return { 
                        ...item, 
                        quantite: newQty, 
                        total_ht: total,
                        dernier_mouvement: new Date().toISOString() 
                    };
                }
                return item;
            });
        });
    };

    const clearStock = () => {
        if (confirm("Êtes-vous sûr de vouloir vider tout le stock ?")) {
            setStock([]);
        }
    };

    return {
        stock,
        loading,
        addToStock,
        updateQuantity,
        removeFromStock,
        clearStock,
    };
}
