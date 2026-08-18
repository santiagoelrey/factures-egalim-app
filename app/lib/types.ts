export interface InvoiceLine {
  produit: string;
  quantite: number;
  prix_unitaire: number;
  total_ht: number;
  tva: number;
  ttc: number;
  est_bio: boolean;
  label?: string; // BIO, AOP, IGP, LABEL_ROUGE, HVE, STG, FERMIER, PECHE_DURABLE, STANDARD
  note?: string;
}

export interface DayData {
  jour: string; // "lundi 02 février"
  ligne_facture: InvoiceLine[];
}

export interface AnalysisResponse {
  data: DayData[];
  rawText?: string;
}

export interface StockItem extends InvoiceLine {
  ancien_prix_unitaire?: number;
  id: string; // Unique ID (e.g. hash of product name + bio status)
  date_ajout: string; // ISO date
  dernier_mouvement: string; // ISO date
}

export interface MenuItem {
  id: string; // ID du stock
  produit: string;
  quantite_utilisee: number;
}

export interface Menu {
  id: string;
  nom: string;
  date: string;
  ingredients: MenuItem[];
}
