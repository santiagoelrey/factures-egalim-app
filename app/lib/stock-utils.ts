import { StockItem, InvoiceLine } from './types';
import { markLocalModified } from './sync-engine';

const STOCK_KEY = 'egalim_stock_v1';

export const safeNumber = (val: any, fallback = 0): number => {
    if (typeof val === 'number') {
        return isNaN(val) ? fallback : val;
    }
    if (!val) return fallback;
    const cleaned = String(val).replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : num;
};

export const normalizeProductName = (name: string): string => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/^\[bio\]\s*/i, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
};

export const generateStockId = (produit: string, estBio: boolean = false): string => {
    const norm = normalizeProductName(produit);
    const bioKey = estBio ? 'bio' : 'std';
    const slug = norm.replace(/\s+/g, '-').slice(0, 40) || 'prod';
    
    let hash = 0;
    const fullStr = `${norm}-${bioKey}`;
    for (let i = 0; i < fullStr.length; i++) {
        hash = ((hash << 5) - hash) + fullStr.charCodeAt(i);
        hash |= 0;
    }
    return `${slug}-${bioKey}-${Math.abs(hash).toString(36)}`;
};

export const getStock = (): StockItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STOCK_KEY);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        // Sanitize existing items to avoid NaN contamination
        return parsed.map((item: any) => {
            const qty = safeNumber(item.quantite, 0);
            const pu = safeNumber(item.prix_unitaire, 0);
            return {
                ...item,
                quantite: Math.round(qty * 1000) / 1000,
                prix_unitaire: pu,
                total_ht: Math.round((qty * pu) * 100) / 100,
                tva: safeNumber(item.tva, Math.round(qty * pu * 0.055 * 100) / 100),
                ttc: safeNumber(item.ttc, Math.round(qty * pu * 1.055 * 100) / 100),
            };
        });
    } catch (e) {
        console.error("Erreur lors de la lecture du stock", e);
        return [];
    }
};

export const saveStock = (stock: StockItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
    markLocalModified('stock');
    // Dispatch event so other components / tabs react immediately
    window.dispatchEvent(new Event('egalim_sync_completed'));
};

export const addLinesToStock = (lines: InvoiceLine[]): number => {
    const stockItems = getStock();
    let processedCount = 0;

    lines.forEach(line => {
        const trimmedProduct = (line.produit || '').trim();
        if (!trimmedProduct) return;

        const quantite = safeNumber(line.quantite, 0);
        let prix_unitaire = safeNumber(line.prix_unitaire, 0);
        let total_ht = safeNumber(line.total_ht, 0);

        // Auto-correction of math if one component is missing
        if (total_ht === 0 && quantite > 0 && prix_unitaire > 0) {
            total_ht = Math.round(quantite * prix_unitaire * 100) / 100;
        } else if (prix_unitaire === 0 && quantite > 0 && total_ht > 0) {
            prix_unitaire = Math.round((total_ht / quantite) * 10000) / 10000;
        }

        const estBio = Boolean(line.est_bio);
        const normName = normalizeProductName(trimmedProduct);
        const targetId = generateStockId(trimmedProduct, estBio);

        // Match either by targetId or by normalized name + bio status
        let existingIdx = stockItems.findIndex(item => item.id === targetId);
        if (existingIdx === -1) {
            existingIdx = stockItems.findIndex(item => 
                normalizeProductName(item.produit) === normName && Boolean(item.est_bio) === estBio
            );
        }

        const now = new Date().toISOString();

        if (existingIdx >= 0) {
            const currentItem = stockItems[existingIdx];
            const currentQty = safeNumber(currentItem.quantite, 0);
            const currentPu = safeNumber(currentItem.prix_unitaire, 0);

            // New quantity is sum
            const newQty = Math.max(0, Math.round((currentQty + quantite) * 1000) / 1000);

            // Price: keep incoming price if provided (> 0), otherwise preserve current unit price
            const finalPu = prix_unitaire > 0 ? prix_unitaire : currentPu;

            currentItem.ancien_prix_unitaire = currentPu;
            currentItem.prix_unitaire = finalPu;
            currentItem.quantite = newQty;
            currentItem.total_ht = Math.round((newQty * finalPu) * 100) / 100;
            currentItem.tva = Math.round(currentItem.total_ht * 0.055 * 100) / 100;
            currentItem.ttc = Math.round((currentItem.total_ht + currentItem.tva) * 100) / 100;
            currentItem.dernier_mouvement = now;
            
            if (line.label && (!currentItem.label || currentItem.label === 'STANDARD')) {
                currentItem.label = line.label;
            }
        } else {
            const finalTotal = total_ht > 0 ? total_ht : Math.round((quantite * prix_unitaire) * 100) / 100;
            const finalTva = Math.round(finalTotal * 0.055 * 100) / 100;
            const finalTtc = Math.round((finalTotal + finalTva) * 100) / 100;

            stockItems.push({
                ...line,
                id: targetId,
                produit: trimmedProduct,
                est_bio: estBio,
                label: line.label || (estBio ? 'BIO' : 'STANDARD'),
                quantite: Math.round(quantite * 1000) / 1000,
                prix_unitaire,
                total_ht: finalTotal,
                tva: finalTva,
                ttc: finalTtc,
                date_ajout: now,
                dernier_mouvement: now
            });
        }
        processedCount++;
    });

    saveStock(stockItems);
    return processedCount;
};

export const deductFromStock = (id: string, quantity: number): boolean => {
    const stockItems = getStock();
    const qtyToDeduct = safeNumber(quantity, 0);
    if (qtyToDeduct <= 0) return false;

    const itemIdx = stockItems.findIndex(item => item.id === id);

    if (itemIdx >= 0) {
        const currentQty = safeNumber(stockItems[itemIdx].quantite, 0);
        const newQty = Math.max(0, Math.round((currentQty - qtyToDeduct) * 1000) / 1000);
        const pu = safeNumber(stockItems[itemIdx].prix_unitaire, 0);

        stockItems[itemIdx].quantite = newQty;
        stockItems[itemIdx].total_ht = Math.round((newQty * pu) * 100) / 100;
        stockItems[itemIdx].tva = Math.round(stockItems[itemIdx].total_ht * 0.055 * 100) / 100;
        stockItems[itemIdx].ttc = Math.round((stockItems[itemIdx].total_ht + stockItems[itemIdx].tva) * 100) / 100;
        stockItems[itemIdx].dernier_mouvement = new Date().toISOString();

        saveStock(stockItems);
        return true;
    }
    return false;
};

export const updateStockQuantity = (id: string, delta: number) => {
    const stockItems = getStock();
    const deltaNum = safeNumber(delta, 0);
    const itemIdx = stockItems.findIndex(item => item.id === id);

    if (itemIdx >= 0) {
        const currentQty = safeNumber(stockItems[itemIdx].quantite, 0);
        const newQty = Math.max(0, Math.round((currentQty + deltaNum) * 1000) / 1000);
        const pu = safeNumber(stockItems[itemIdx].prix_unitaire, 0);

        stockItems[itemIdx].quantite = newQty;
        stockItems[itemIdx].total_ht = Math.round((newQty * pu) * 100) / 100;
        stockItems[itemIdx].tva = Math.round(stockItems[itemIdx].total_ht * 0.055 * 100) / 100;
        stockItems[itemIdx].ttc = Math.round((stockItems[itemIdx].total_ht + stockItems[itemIdx].tva) * 100) / 100;
        stockItems[itemIdx].dernier_mouvement = new Date().toISOString();

        saveStock(stockItems);
        return stockItems;
    }
    return stockItems;
};
