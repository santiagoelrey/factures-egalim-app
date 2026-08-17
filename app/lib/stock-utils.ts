import { StockItem, InvoiceLine } from './types';

const STOCK_KEY = 'egalim_stock_v1';

export const getStock = (): StockItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STOCK_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error("Erreur lors de la lecture du stock", e);
        return [];
    }
};

export const saveStock = (stock: StockItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
};

export const generateStockId = (produit: string, estBio: boolean) => {
    return btoa(`${produit}-${estBio}`).replace(/[^a-zA-Z0-9]/g, '');
};

export const addLinesToStock = (lines: InvoiceLine[]): number => {
    const stockItems = getStock();
    let addedCount = 0;

    lines.forEach(line => {
        const id = generateStockId(line.produit, line.est_bio);
        const existingIdx = stockItems.findIndex((item) => item.id === id);

        if (existingIdx >= 0) {
            stockItems[existingIdx].quantite += Number(line.quantite);
            stockItems[existingIdx].total_ht += Number(line.total_ht);
            stockItems[existingIdx].prix_unitaire = Number(line.prix_unitaire);
            stockItems[existingIdx].dernier_mouvement = new Date().toISOString();
        } else {
            stockItems.push({
                ...line,
                id,
                date_ajout: new Date().toISOString(),
                dernier_mouvement: new Date().toISOString()
            });
        }
        addedCount++;
    });

    saveStock(stockItems);
    return addedCount;
};

export const deductFromStock = (id: string, quantity: number): boolean => {
    const stockItems = getStock();
    const itemIdx = stockItems.findIndex(item => item.id === id);

    if (itemIdx >= 0) {
        stockItems[itemIdx].quantite = Math.max(0, stockItems[itemIdx].quantite - quantity);
        stockItems[itemIdx].dernier_mouvement = new Date().toISOString();
        saveStock(stockItems);
        return true;
    }
    return false;
};

export const updateStockQuantity = (id: string, delta: number) => {
    const stockItems = getStock();
    const itemIdx = stockItems.findIndex(item => item.id === id);

    if (itemIdx >= 0) {
        stockItems[itemIdx].quantite = Math.max(0, stockItems[itemIdx].quantite + delta);
        stockItems[itemIdx].dernier_mouvement = new Date().toISOString();
        saveStock(stockItems);
        return stockItems;
    }
    return stockItems;
};
