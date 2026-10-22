// Utilitaires Réglementaires : Allergènes INCO (Règlement UE n° 1169/2011) & Plan Alimentaire GEM-RCN 2.0

export interface IncoAllergen {
  id: string;
  nom: string;
  description: string;
  keywords: string[];
}

export const INCO_ALLERGENS_LIST: IncoAllergen[] = [
  {
    id: 'gluten',
    nom: 'Gluten (blé)',
    description: 'Céréales contenant du gluten (blé, seigle, orge, avoine, épeautre, kamut)',
    keywords: ['blé', 'ble', 'pain', 'baguette', 'pâte', 'pate', 'pâtes', 'pates', 'farine', 'semoule', 'couscous', 'boulgour', 'chapelure', 'croûton', 'crouton', 'biscuit', 'crêpe', 'crepe', 'macaroni', 'spaghetti', 'nouille', 'tarte', 'quiche', 'pané', 'pane', 'nugget', 'nuggets', 'beignet', 'panure', 'vermicelle', 'pizza']
  },
  {
    id: 'lait',
    nom: 'Lait',
    description: 'Lait et produits laitiers (y compris lactose)',
    keywords: ['lait', 'crème', 'creme', 'beurre', 'fromage', 'yaourt', 'yogourt', 'feta', 'comté', 'comte', 'emmental', 'mozzarella', 'parmesan', 'camembert', 'chèvre', 'chevre', 'petit suisse', 'bechamel', 'béchamel', 'flamby', 'flan', 'gratin', 'gouda', 'cantal', 'brie', 'roquefort']
  },
  {
    id: 'oeufs',
    nom: 'Œufs',
    description: 'Œufs et produits à base d’œufs',
    keywords: ['oeuf', 'œuf', 'oeufs', 'œufs', 'mayonnaise', 'quiche', 'crêpe', 'crepe', 'omelette', 'meringue', 'tarte', 'biscuit', 'gâteau', 'gateau', 'panure', 'quenelle', 'dorure']
  },
  {
    id: 'poissons',
    nom: 'Poisson',
    description: 'Poissons et produits à base de poissons',
    keywords: ['poisson', 'saumon', 'colin', 'cabillaud', 'thon', 'merlu', 'lieu', 'sardine', 'maquereau', 'truite', 'anchois', 'bar', 'dorade', 'flétan', 'fletan']
  },
  {
    id: 'crustaces',
    nom: 'Crustacés',
    description: 'Crustacés et produits à base de crustacés',
    keywords: ['crevette', 'crabe', 'homard', 'langouste', 'écrevisse', 'ecrevisse', 'gambas']
  },
  {
    id: 'soja',
    nom: 'Soja',
    description: 'Soja et produits à base de soja',
    keywords: ['soja', 'tofu', 'lécithine de soja', 'lecithine', 'protéine de soja', 'proteine de soja', 'edamame']
  },
  {
    id: 'fruits_coque',
    nom: 'Fruits à coque',
    description: 'Amandes, noisettes, noix, noix de cajou, pécan, pistaches...',
    keywords: ['noix', 'noisette', 'amande', 'cajou', 'pistache', 'pécan', 'pecan', 'macadamia', 'pignon']
  },
  {
    id: 'sesame',
    nom: 'Sésame',
    description: 'Graines de sésame et produits à base de sésame',
    keywords: ['sésame', 'sesame', 'tahini', 'tahin', 'houmous', 'graine de sésame']
  },
  {
    id: 'moutarde',
    nom: 'Moutarde',
    description: 'Moutarde et produits à base de moutarde',
    keywords: ['moutarde', 'vinaigrette', 'mayonnaise', 'sauce moutarde', 'condiment']
  },
  {
    id: 'celeri',
    nom: 'Céleri',
    description: 'Céleri et produits à base de céleri',
    keywords: ['céleri', 'celeri', 'bouillon', 'fond de sauce', 'sauce curry', 'mirepoix', 'potage', 'soupe']
  },
  {
    id: 'sulfites',
    nom: 'Sulfites',
    description: 'Anhydride sulfureux et sulfites (> 10 mg/kg ou 10 mg/l)',
    keywords: ['vinaigre', 'vinaigrette', 'vin', 'lardon', 'lardons', 'charcuterie', 'sauce curry', 'fruits secs', 'raisin sec', 'abricot sec']
  },
  {
    id: 'arachides',
    nom: 'Arachides',
    description: 'Arachides et produits à base d’arachides',
    keywords: ['arachide', 'cacahuète', 'cacahuete', 'huile d\'arachide']
  },
  {
    id: 'lupin',
    nom: 'Lupin',
    description: 'Lupin et produits à base de lupin',
    keywords: ['lupin', 'farine de lupin']
  },
  {
    id: 'mollusques',
    nom: 'Mollusques',
    description: 'Mollusques et produits à base de mollusques',
    keywords: ['moule', 'huître', 'huitre', 'calmar', 'calamar', 'seiche', 'poulpe', 'escargot', 'coquille saint-jacques']
  }
];

// Catégories GEM-RCN avec code couleur standard officiel
export type GemrcnCategory = 
  | 'PROTEINES' 
  | 'SANS_VIANDE' 
  | 'FECULENTS' 
  | 'CRUDITES_FRUITS' 
  | 'LEGUMES_CUITS' 
  | 'PRODUITS_LAITIERS' 
  | 'MATIERES_GRASSES' 
  | 'SUCRE';

export interface GemrcnCategoryInfo {
  label: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
}

export const GEMRCN_CONFIG: Record<GemrcnCategory, GemrcnCategoryInfo> = {
  PROTEINES: {
    label: 'PROTÉINES',
    colorHex: '#dc2626',
    bgClass: 'bg-red-500',
    textClass: 'text-red-700 font-bold'
  },
  SANS_VIANDE: {
    label: 'sans viande (alternative)',
    colorHex: '#16a34a',
    bgClass: 'bg-green-600',
    textClass: 'text-green-700 font-bold'
  },
  FECULENTS: {
    label: 'FÉCULENTS',
    colorHex: '#854d0e',
    bgClass: 'bg-amber-800',
    textClass: 'text-amber-800 font-bold'
  },
  CRUDITES_FRUITS: {
    label: 'CRUDITÉS & FRUITS',
    colorHex: '#10b981',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 font-bold'
  },
  LEGUMES_CUITS: {
    label: 'LÉGUMES CUITS',
    colorHex: '#047857',
    bgClass: 'bg-emerald-700',
    textClass: 'text-emerald-800 font-bold'
  },
  PRODUITS_LAITIERS: {
    label: 'PRODUITS LAITIERS',
    colorHex: '#0284c7',
    bgClass: 'bg-sky-600',
    textClass: 'text-sky-700 font-bold'
  },
  MATIERES_GRASSES: {
    label: 'MATIÈRES GRASSES',
    colorHex: '#ea580c',
    bgClass: 'bg-orange-600',
    textClass: 'text-orange-700 font-bold'
  },
  SUCRE: {
    label: 'SUCRE',
    colorHex: '#06b6d4',
    bgClass: 'bg-cyan-500',
    textClass: 'text-cyan-700 font-bold'
  }
};

// Grammages de référence GEM-RCN (en grammes bruts / portion recommandée)
export interface GemrcnGrammageRef {
  mat: number;   // Maternelle (3-6 ans)
  prim: number;  // Primaire / Élémentaire (6-11 ans)
  collAdu: number; // Collège, Lycée & Adultes (11+ ans)
}

export const GEMRCN_PORTIONS_GRAMMES: Record<GemrcnCategory, GemrcnGrammageRef> = {
  PROTEINES: { mat: 60, prim: 80, collAdu: 110 },
  SANS_VIANDE: { mat: 60, prim: 80, collAdu: 110 },
  FECULENTS: { mat: 120, prim: 170, collAdu: 230 },
  CRUDITES_FRUITS: { mat: 60, prim: 90, collAdu: 120 },
  LEGUMES_CUITS: { mat: 100, prim: 150, collAdu: 200 },
  PRODUITS_LAITIERS: { mat: 40, prim: 60, collAdu: 80 },
  MATIERES_GRASSES: { mat: 10, prim: 15, collAdu: 20 },
  SUCRE: { mat: 60, prim: 80, collAdu: 100 }
};

// Détection de la catégorie GEM-RCN d'un plat ou ingrédient
export function detectGemrcnCategory(text: string, courseType?: 'entree' | 'plat' | 'accompagnement' | 'dessert'): GemrcnCategory {
  const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Protéines végétales / Sans viande explicite
  if (clean.includes('sans viande') || clean.includes('vegetarien') || clean.includes('tofu') || clean.includes('soja') || clean.includes('galet vg')) {
    return 'SANS_VIANDE';
  }

  // Protéines (VPO)
  if (
    clean.includes('poulet') || clean.includes('boeuf') || clean.includes('veau') || 
    clean.includes('porc') || clean.includes('saumon') || clean.includes('colin') || 
    clean.includes('poisson') || clean.includes('nugget') || clean.includes('quenelle') ||
    clean.includes('viande') || clean.includes('escalope') || clean.includes('boulette') ||
    clean.includes('jambon') || clean.includes('steak') || clean.includes('cabillaud') ||
    clean.includes('thon') || clean.includes('dinde')
  ) {
    return 'PROTEINES';
  }

  // Produits Laitiers
  if (
    clean.includes('fromage') || clean.includes('yaourt') || clean.includes('comte') || 
    clean.includes('feta') || clean.includes('petit suisse') || clean.includes('camembert') ||
    clean.includes('cantal') || clean.includes('gouda') || clean.includes('mozzarella') ||
    clean.includes('emmental') || clean.includes('laitier')
  ) {
    return 'PRODUITS_LAITIERS';
  }

  // Crudités & Fruits
  if (
    clean.includes('salade') || clean.includes('carotte rapee') || clean.includes('concombre') || 
    clean.includes('tomate') || clean.includes('pomme') || clean.includes('poire') || 
    clean.includes('banane') || clean.includes('orange') || clean.includes('peche') || 
    clean.includes('ananas') || clean.includes('kiwi') || clean.includes('pasteque') ||
    clean.includes('melon') || clean.includes('radis') || clean.includes('betterave') ||
    clean.includes('endive') || clean.includes('taboule')
  ) {
    return 'CRUDITES_FRUITS';
  }

  // Légumes Cuits
  if (
    clean.includes('brocoli') || clean.includes('haricot vert') || clean.includes('courgette') || 
    clean.includes('chou') || clean.includes('poireau') || clean.includes('epinard') || 
    clean.includes('petit pois') || clean.includes('soupe de legume') || clean.includes('potage') ||
    clean.includes('ratatouille')
  ) {
    return 'LEGUMES_CUITS';
  }

  // Féculents
  if (
    clean.includes('riz') || clean.includes('pate') || clean.includes('pomme de terre') || 
    clean.includes('pdt') || clean.includes('puree') || clean.includes('frite') || 
    clean.includes('semoule') || clean.includes('lentille') || clean.includes('ble') ||
    clean.includes('macaroni') || clean.includes('quinoa') || clean.includes('polenta')
  ) {
    return 'FECULENTS';
  }

  // Desserts sucrés / Pâtisseries
  if (
    clean.includes('crepe') || clean.includes('tarte') || clean.includes('gateau') || 
    clean.includes('chocolat') || clean.includes('biscuit') || clean.includes('flamby') || 
    clean.includes('eclair') || clean.includes('beignet') || clean.includes('glace') ||
    clean.includes('sucre')
  ) {
    return 'SUCRE';
  }

  // Par défaut selon le type de plat
  if (courseType === 'entree') return 'CRUDITES_FRUITS';
  if (courseType === 'plat') return 'PROTEINES';
  if (courseType === 'accompagnement') return 'LEGUMES_CUITS';
  if (courseType === 'dessert') return 'SUCRE';

  return 'CRUDITES_FRUITS';
}

// Détection automatique des allergènes INCO pour un texte (plat ou liste d'ingrédients)
export function detectAllergensInText(text: string): { allergen: IncoAllergen; matchedTerms: string[] }[] {
  if (!text) return [];
  const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const detected: { allergen: IncoAllergen; matchedTerms: string[] }[] = [];

  INCO_ALLERGENS_LIST.forEach(allergen => {
    const matches: string[] = [];
    allergen.keywords.forEach(kw => {
      const cleanKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const regex = new RegExp(`\\b${cleanKw}\\b`, 'i');
      if (regex.test(clean) || clean.includes(cleanKw)) {
        if (!matches.includes(kw)) matches.push(kw);
      }
    });

    if (matches.length > 0) {
      detected.push({ allergen, matchedTerms: matches });
    }
  });

  return detected;
}

// Analyse des allergènes d'une journée complète (plats + ingrédients)
export interface DailyAllergensReport {
  dayName: string;
  itemsWithAllergens: {
    allergenNom: string;
    sources: string[]; // Noms des plats/ingrédients sources
  }[];
  allDetectedIds: string[];
}

export function analyzeDailyAllergens(
  dayName: string,
  courses: { intitule: string; ingredients: string[] }[]
): DailyAllergensReport {
  const map = new Map<string, Set<string>>();
  const allIds = new Set<string>();

  // Le pain bio est servi quotidiennement et contient du gluten
  map.set('Gluten (blé)', new Set(['pain bio']));
  allIds.add('gluten');

  courses.forEach(course => {
    const fullText = `${course.intitule} ${course.ingredients.join(' ')}`;
    const results = detectAllergensInText(fullText);

    results.forEach(({ allergen }) => {
      allIds.add(allergen.id);
      if (!map.has(allergen.nom)) {
        map.set(allergen.nom, new Set());
      }
      const set = map.get(allergen.nom)!;
      // Nettoyer le nom du plat pour l'affichage concis
      const cleanTitle = course.intitule.toLowerCase().replace('[bio] ', '').trim();
      if (cleanTitle) set.add(cleanTitle);
    });
  });

  const itemsWithAllergens = Array.from(map.entries()).map(([allergenNom, sourcesSet]) => ({
    allergenNom,
    sources: Array.from(sourcesSet)
  }));

  return {
    dayName,
    itemsWithAllergens,
    allDetectedIds: Array.from(allIds)
  };
}

// Génération de la synthèse hebdomadaire INCO (au bas de l'affiche)
export function generateWeeklyIncoSummary(dailyReports: DailyAllergensReport[]): string[] {
  const summary: string[] = [];

  // 1. Gluten
  const glutenSources: string[] = ['Pain BIO quotidien'];
  dailyReports.forEach(dr => {
    const item = dr.itemsWithAllergens.find(a => a.allergenNom.includes('Gluten'));
    if (item) {
      const others = item.sources.filter(s => s !== 'pain bio');
      if (others.length > 0) {
        glutenSources.push(`${others.join(', ')} (${dr.dayName.slice(0, 3)})`);
      }
    }
  });
  summary.push(`• Céréales contenant du Gluten (blé) : ${glutenSources.join(', ')}.`);

  // 2. Lait & Produits Laitiers
  const laitSources: string[] = [];
  dailyReports.forEach(dr => {
    const item = dr.itemsWithAllergens.find(a => a.allergenNom === 'Lait');
    if (item && item.sources.length > 0) {
      laitSources.push(`${item.sources.join(', ')} (${dr.dayName.slice(0, 3)})`);
    }
  });
  if (laitSources.length > 0) {
    summary.push(`• Lait & Produits Laitiers : ${laitSources.join(', ')}.`);
  }

  // 3. Œufs & Soja
  const oeufsSoja: string[] = [];
  dailyReports.forEach(dr => {
    const oeuf = dr.itemsWithAllergens.find(a => a.allergenNom === 'Œufs');
    const soja = dr.itemsWithAllergens.find(a => a.allergenNom === 'Soja');
    if (oeuf && oeuf.sources.length > 0) oeufsSoja.push(`Œufs dans ${oeuf.sources.join(', ')} (${dr.dayName.slice(0, 3)})`);
    if (soja && soja.sources.length > 0) oeufsSoja.push(`Soja dans ${soja.sources.join(', ')} (${dr.dayName.slice(0, 3)})`);
  });
  if (oeufsSoja.length > 0) {
    summary.push(`• Œufs & Soja : ${oeufsSoja.join(', ')}.`);
  }

  // 4. Poisson & Fruits de mer
  const poissonSources: string[] = [];
  dailyReports.forEach(dr => {
    const item = dr.itemsWithAllergens.find(a => a.allergenNom === 'Poisson');
    if (item && item.sources.length > 0) {
      poissonSources.push(`${item.sources.join(', ')} (${dr.dayName.slice(0, 3)})`);
    }
  });
  if (poissonSources.length > 0) {
    summary.push(`• Poisson : ${poissonSources.join(', ')}.`);
  }

  // 5. Fruits à coque & Sésame
  const coqueSesame: string[] = [];
  dailyReports.forEach(dr => {
    const fac = dr.itemsWithAllergens.find(a => a.allergenNom === 'Fruits à coque');
    const ses = dr.itemsWithAllergens.find(a => a.allergenNom === 'Sésame');
    if (fac && fac.sources.length > 0) coqueSesame.push(`Fruits à coque dans ${fac.sources.join(', ')} (${dr.dayName.slice(0, 3)})`);
    if (ses && ses.sources.length > 0) coqueSesame.push(`Sésame dans ${ses.sources.join(', ')} (${dr.dayName.slice(0, 3)})`);
  });
  if (coqueSesame.length > 0) {
    summary.push(`• Fruits à coque & Sésame (Vigilance PAI) : ${coqueSesame.join(', ')}.`);
  }

  // 6. Moutarde, Sulfites & Céleri
  const condiments: string[] = [];
  dailyReports.forEach(dr => {
    const m = dr.itemsWithAllergens.find(a => a.allergenNom === 'Moutarde');
    const s = dr.itemsWithAllergens.find(a => a.allergenNom === 'Sulfites');
    const c = dr.itemsWithAllergens.find(a => a.allergenNom === 'Céleri');
    const list = [...(m?.sources || []), ...(s?.sources || []), ...(c?.sources || [])];
    const unique = Array.from(new Set(list));
    if (unique.length > 0) {
      condiments.push(`${unique.join(', ')} (${dr.dayName.slice(0, 3)})`);
    }
  });
  if (condiments.length > 0) {
    summary.push(`• Moutarde, Céleri & Sulfites : Vinaigrettes d'assaisonnement et sauces (${condiments.join(', ')}).`);
  }

  return summary;
}

// Calcul des tonnages requis selon les grammages GEM-RCN et les effectifs
export function calculateGemrcnDayTonnage(
  category: GemrcnCategory,
  effectifs: { total: number; mat?: number; prim?: number; collAdu?: number }
): {
  totalKg: number;
  matKg: number;
  primKg: number;
  collAduKg: number;
  portionsRef: GemrcnGrammageRef;
} {
  const ref = GEMRCN_PORTIONS_GRAMMES[category] || { mat: 80, prim: 100, collAdu: 150 };

  const matCount = effectifs.mat || 0;
  const primCount = effectifs.prim || 0;
  const collAduCount = effectifs.collAdu || Math.max(0, effectifs.total - (matCount + primCount));

  // Si aucune ventilation détaillée n'est fournie, estimation standard cantine scolaire : 20% Mat, 40% Prim, 40% Collège/Adultes
  let effectiveMat = matCount;
  let effectivePrim = primCount;
  let effectiveCollAdu = collAduCount;

  if (matCount === 0 && primCount === 0 && collAduCount === 0 && effectifs.total > 0) {
    effectiveMat = Math.round(effectifs.total * 0.2);
    effectivePrim = Math.round(effectifs.total * 0.45);
    effectiveCollAdu = Math.max(0, effectifs.total - (effectiveMat + effectivePrim));
  }

  const matKg = Number(((effectiveMat * ref.mat) / 1000).toFixed(2));
  const primKg = Number(((effectivePrim * ref.prim) / 1000).toFixed(2));
  const collAduKg = Number(((effectiveCollAdu * ref.collAdu) / 1000).toFixed(2));
  const totalKg = Number((matKg + primKg + collAduKg).toFixed(2));

  return {
    totalKg,
    matKg,
    primKg,
    collAduKg,
    portionsRef: ref
  };
}
