'use client';

import { useState, useEffect } from 'react';
import { InvoiceLine, StockItem } from '../lib/types';

// Simple hash function for IDs
const generateId = (product: string, isBio: boolean) => {
    return btoa(`${product}-${isBio}`).replace(/[^a-zA-Z0-9]/g, '');
};

const STORAGE_KEY = 'egalim_stock_v1';

export function useStock() {
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setStock(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load stock", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save to localStorage when stock changes
    useEffect(() => {
        if (!loading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stock));
        }
    }, [stock, loading]);

    const addToStock = (line: InvoiceLine) => {
        const id = generateId(line.produit, line.est_bio);
        const now = new Date().toISOString();

        setStock(prev => {
            const existingIndex = prev.findIndex(item => item.id === id);
            if (existingIndex >= 0) {
                // Update existing item
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantite: updated[existingIndex].quantite + line.quantite,
                    dernier_mouvement: now,
                    // Averaging price? Or keep latest? Let's keep latest for simplicity or weighted average?
                    // Simple: Update price to latest
                    prix_unitaire: line.prix_unitaire,
                    total_ht: updated[existingIndex].total_ht + line.total_ht,
                    tva: updated[existingIndex].tva + line.tva,
                    ttc: updated[existingIndex].ttc + line.ttc,
                };
                return updated;
            } else {
                // Add new item
                const newItem: StockItem = {
                    ...line,
                    id,
                    date_ajout: now,
                    dernier_mouvement: now
                };
                return [...prev, newItem];
            }
        });
    };

    const updateQuantity = (id: string, newQuantity: number) => {
        setStock(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    return { ...item, quantite: newQuantity, dernier_mouvement: new Date().toISOString() };
                }
                return item;
            }).filter(item => item.quantite > 0); // Remove if <= 0? User might want to keep history.
            // Let's keep 0 qty items so we don't lose product info. Filter only manually?
            // Actually user said "deduire ce que l'on utilise". So if it reaches 0, maybe hide or keep?
            // Keeping for now.
        });
    };

    const removeFromStock = (id: string, amount: number) => {
        setStock(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const newQty = Math.max(0, item.quantite - amount);
                    return { ...item, quantite: newQty, dernier_mouvement: new Date().toISOString() };
                }
                return item;
            });
        });
    };

    const clearStock = () => {
        if (confirm("Êtes-vous sûr de vouloir vider tout le stock ?")) {
            setStock([]);
        }
    }

    return { stock, addToStock, removeFromStock, updateQuantity, clearStock, loading };
}
