'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Minus, Trash2, Save, UtensilsCrossed, 
  CheckCircle2, Calendar, ArrowRight, Download, RefreshCw, BookOpen, 
  Users, ChevronDown, Copy, Edit3, PlusCircle
} from 'lucide-react';
import { StockItem } from '../lib/types';
import { getStock, deductFromStock } from '../lib/stock-utils';

// Interfaces for Technical Sheets
interface RecipeIngredient {
  produit: string; // Matching name in stock
  quantiteBase: number; // Base quantity
  est_bio?: boolean;
  label?: string;
  unite?: 'kilo' | 'pièce';
  prix_unitaire?: number;
}

interface FicheTechnique {
  id: string;
  nom: string;
  portionsBase: number; // e.g., for 100 people
  miseEnOeuvre: string; // Steps
  ingredients: RecipeIngredient[];
}

interface CourseSelection {
  ficheId: string; // Link to FicheTechnique
  intitule: string; // custom title if no fiche selected
  ingredientsCustom: {
    id: string;
    produit: string;
    quantite_utilisee: number;
    est_bio?: boolean;
    label?: string;
    unite?: 'kilo' | 'pièce';
    prix_unitaire?: number;
  }[];
}

interface DailyMenu {
  entree: CourseSelection;
  plat: CourseSelection;
  accompagnement: CourseSelection;
  dessert: CourseSelection;
  valide: boolean;
  convives?: number;
}

interface WeeklyPlan {
  [day: string]: DailyMenu;
}

interface WeeklyTemplate {
  id: string;
  nom: string;
  plan: WeeklyPlan;
  convives: number;
}

interface SavedWeek {
  id: string;
  nom: string;
  plan: WeeklyPlan;
  fiches?: FicheTechnique[];
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const emptyCourseSelection = (): CourseSelection => ({
  ficheId: '',
  intitule: '',
  ingredientsCustom: []
});

const emptyDailyMenu = (): DailyMenu => ({
  entree: emptyCourseSelection(),
  plat: emptyCourseSelection(),
  accompagnement: emptyCourseSelection(),
  dessert: emptyCourseSelection(),
  valide: false
});

// Default recipes (Fiches Techniques) to populate the library initially
const DEFAULT_FICHES: FicheTechnique[] = [
  {
    id: 'fiche-concombre',
    nom: 'Concombre à la crème',
    portionsBase: 100,
    miseEnOeuvre: "1. Laver, éplucher et émincer les concombres en rondelles fines.\n2. Saupoudrer de sel et laisser dégorger pendant 15 minutes.\n3. Dans un grand récipient, mélanger la crème fraîche, le sel et le poivre.\n4. Rincer les concombres, les égoutter soigneusement.\n5. Incorporer les concombres dans la crème, mélanger délicatement et réserver au frais avant de servir.",
    ingredients: [
      { produit: 'Concombre', quantiteBase: 15, est_bio: false },
      { produit: 'Creme fraiche', quantiteBase: 3, est_bio: false }
    ]
  },
  {
    id: 'fiche-poulet',
    nom: 'Poulet rôti à la crème',
    portionsBase: 100,
    miseEnOeuvre: "1. Préchauffer le four à 180°C.\n2. Disposer les cuisses de poulet dans les plaques de cuisson, assaisonner de sel et de poivre.\n3. Ajouter des noisettes de beurre et enfourner pour 45 minutes de cuisson.\n4. Retirer le poulet. Récupérer le jus de cuisson et le lier avec la crème fraîche à feu doux.\n5. Napper le poulet de sauce et servir chaud.",
    ingredients: [
      { produit: 'Poulet cuisse', quantiteBase: 100, est_bio: false },
      { produit: 'Creme fraiche', quantiteBase: 5, est_bio: false },
      { produit: 'Beurre', quantiteBase: 1, est_bio: false }
    ]
  },
  {
    id: 'fiche-puree',
    nom: 'Purée de pommes de terre',
    portionsBase: 100,
    miseEnOeuvre: "1. Éplucher les pommes de terre et les laver.\n2. Cuire dans un grand volume d'eau salée pendant 25 minutes.\n3. Passer les pommes de terre chaudes au presse-purée.\n4. Incorporer le beurre en morceaux, puis verser le lait chaud progressivement pour assouplir la texture.\n5. Assaisonner avec une pincée de noix de muscade et mélanger vigoureusement.",
    ingredients: [
      { produit: 'Pommes de terre', quantiteBase: 20, est_bio: false },
      { produit: 'Beurre', quantiteBase: 2, est_bio: false },
      { produit: 'Lait', quantiteBase: 3, est_bio: false }
    ]
  },
  {
    id: 'fiche-peche',
    nom: 'Pêche et camembert',
    portionsBase: 100,
    miseEnOeuvre: "1. Laver les pêches fraîches.\n2. Couper les camemberts en 8 portions égales.\n3. Dresser sur des assiettes individuelles : une pêche entière et une portion de camembert par convive.\n4. Servir avec du pain frais.",
    ingredients: [
      { produit: 'Peches', quantiteBase: 100, est_bio: true },
      { produit: 'Camembert', quantiteBase: 13, est_bio: false }
    ]
  }
];

export default function AdvancedMenuPlanner() {
  const [activeTab, setActiveTab] = useState<'PLANNER' | 'RECIPES' | 'TEMPLATES'>('PLANNER');
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({
    Lundi: emptyDailyMenu(),
    Mardi: emptyDailyMenu(),
    Mercredi: emptyDailyMenu(),
    Jeudi: emptyDailyMenu(),
    Vendredi: emptyDailyMenu()
  });
  const [activeDay, setActiveDay] = useState('Lundi');
  const [convives, setConvives] = useState(100);
  const [stock, setStock] = useState<StockItem[]>([]);
  
  // Fiches Techniques Library State
  const [fiches, setFiches] = useState<FicheTechnique[]>([]);
  const [editingFiche, setEditingFiche] = useState<FicheTechnique | null>(null);

  // Weekly templates state
  const [templates, setTemplates] = useState<WeeklyTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [savedWeeks, setSavedWeeks] = useState<SavedWeek[]>([]);
  const [activeWeekId, setActiveWeekId] = useState<string>('');

  // Search/Add custom ingredients state
  const [addingCustomIngredientTo, setAddingCustomIngredientTo] = useState<'entree' | 'plat' | 'accompagnement' | 'dessert' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load everything on mount
  useEffect(() => {
    setStock(getStock());
    
    // Load Global Fiches Techniques (Fallback)
    const storedFiches = localStorage.getItem('egalim_fiches_v1');
    let fallbackFiches = DEFAULT_FICHES;
    if (storedFiches) {
      try {
        fallbackFiches = JSON.parse(storedFiches);
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem('egalim_fiches_v1', JSON.stringify(DEFAULT_FICHES));
    }

    // Load Saved Weeks list
    const storedWeeks = localStorage.getItem('egalim_saved_weeks_v1');
    let loadedWeeks: SavedWeek[] = [];
    if (storedWeeks) {
      try {
        loadedWeeks = JSON.parse(storedWeeks);
      } catch (e) {
        console.error("Error loading saved weeks", e);
      }
    }

    // If empty, initialize with default week matching current calendar week
    if (loadedWeeks.length === 0) {
      const defaultWeekId = crypto.randomUUID();
      const today = new Date();
      const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
      
      // Calculate Monday of current week
      const distanceToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMon);
      
      // Calculate Friday of current week
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      
      const formatDate = (d: Date) => {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      };
      
      const defaultName = `Semaine du ${formatDate(monday)} au ${formatDate(friday)}`;
      
      loadedWeeks = [{
        id: defaultWeekId,
        nom: defaultName,
        plan: {
          Lundi: emptyDailyMenu(),
          Mardi: emptyDailyMenu(),
          Mercredi: emptyDailyMenu(),
          Jeudi: emptyDailyMenu(),
          Vendredi: emptyDailyMenu()
        },
        fiches: JSON.parse(JSON.stringify(fallbackFiches))
      }];
      localStorage.setItem('egalim_saved_weeks_v1', JSON.stringify(loadedWeeks));
    }

    setSavedWeeks(loadedWeeks);
    
    // Set active week ID
    const activeId = localStorage.getItem('egalim_active_week_id_v1') || loadedWeeks[0].id;
    const activeWeekObj = loadedWeeks.find(w => w.id === activeId) || loadedWeeks[0];
    setActiveWeekId(activeWeekObj.id);
    localStorage.setItem('egalim_active_week_id_v1', activeWeekObj.id);
    setWeeklyPlan(activeWeekObj.plan);
    setFiches(activeWeekObj.fiches || fallbackFiches);

    // Load Convives
    const storedConvives = localStorage.getItem('egalim_convives_v1');
    if (storedConvives) {
      setConvives(parseInt(storedConvives) || 100);
    }

    // Load Templates
    const storedTemplates = localStorage.getItem('egalim_templates_v1');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }
  }, []);

  // Sync everything in real-time when storage changes or window gains focus
  useEffect(() => {
    const handleSync = () => {
      setStock(getStock());
      
      const storedWeeks = localStorage.getItem('egalim_saved_weeks_v1');
      if (storedWeeks) {
        try {
          const parsedWeeks = JSON.parse(storedWeeks) as SavedWeek[];
          setSavedWeeks(parsedWeeks);
          
          const activeId = localStorage.getItem('egalim_active_week_id_v1') || (parsedWeeks.length > 0 ? parsedWeeks[0].id : '');
          if (activeId) {
            setActiveWeekId(activeId);
            const activeWeekObj = parsedWeeks.find(w => w.id === activeId);
            if (activeWeekObj) {
              setWeeklyPlan(activeWeekObj.plan);
              
              // Sync convives count of active day
              const dayConvives = activeWeekObj.plan[activeDay]?.convives || 100;
              setConvives(dayConvives);
            }
          }
        } catch (e) {
          console.error("Error syncing weekly plan", e);
        }
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [activeDay]);

  // Save helpers
  const savePlan = (newPlan: WeeklyPlan) => {
    localStorage.setItem('egalim_weekly_plan_v2', JSON.stringify(newPlan));
    setWeeklyPlan(newPlan);

    // Save inside active week plan
    if (activeWeekId) {
      const updatedWeeks = savedWeeks.map(w => 
        w.id === activeWeekId ? { ...w, plan: newPlan } : w
      );
      setSavedWeeks(updatedWeeks);
      localStorage.setItem('egalim_saved_weeks_v1', JSON.stringify(updatedWeeks));
    }
  };

  const saveConvives = (value: number) => {
    localStorage.setItem('egalim_convives_v1', String(value));
    setConvives(value);

    // Update active day menu convives count
    const newPlan = { ...weeklyPlan };
    if (newPlan[activeDay]) {
      newPlan[activeDay].convives = value;
      savePlan(newPlan);
    }
  };

  const saveFiches = (newFiches: FicheTechnique[]) => {
    localStorage.setItem('egalim_fiches_v1', JSON.stringify(newFiches));
    setFiches(newFiches);

    // Save inside active week fiches library
    if (activeWeekId) {
      const updatedWeeks = savedWeeks.map(w => 
        w.id === activeWeekId ? { ...w, fiches: newFiches } : w
      );
      setSavedWeeks(updatedWeeks);
      localStorage.setItem('egalim_saved_weeks_v1', JSON.stringify(updatedWeeks));
    }
  };

  const saveTemplates = (newTemplates: WeeklyTemplate[]) => {
    localStorage.setItem('egalim_templates_v1', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const createNewWeek = () => {
    // Attempt to calculate next week suggested name
    let suggestedName = "Semaine du ... au ... 2026";
    if (savedWeeks.length > 0) {
      // Find the last saved week and try to shift it
      const lastWeek = savedWeeks[savedWeeks.length - 1];
      const match = lastWeek.nom.match(/Semaine du (\d{2}) ([^ ]+) au (\d{2}) ([^ ]+) (\d{4})/i);
      if (match) {
        try {
          // Parse month name to index
          const months: { [key: string]: number } = {
            'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
            'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
          };
          const year = parseInt(match[5]);
          const startDay = parseInt(match[1]);
          const startMonth = months[match[2].toLowerCase()] || 0;
          
          const lastMonday = new Date(year, startMonth, startDay);
          const nextMonday = new Date(lastMonday);
          nextMonday.setDate(lastMonday.getDate() + 7);
          
          const nextFriday = new Date(nextMonday);
          nextFriday.setDate(nextMonday.getDate() + 4);
          
          const formatDate = (d: Date) => {
            return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
          };
          suggestedName = `Semaine du ${formatDate(nextMonday)} au ${formatDate(nextFriday)}`;
        } catch (e) {
          console.error(e);
        }
      }
    }

    const name = prompt("Entrez le nom de la nouvelle semaine planifiée :", suggestedName);
    if (!name || !name.trim()) return;
    
    const newWeekId = crypto.randomUUID();
    const newWeek: SavedWeek = {
      id: newWeekId,
      nom: name.trim(),
      plan: {
        Lundi: emptyDailyMenu(),
        Mardi: emptyDailyMenu(),
        Mercredi: emptyDailyMenu(),
        Jeudi: emptyDailyMenu(),
        Vendredi: emptyDailyMenu()
      },
      // Copy active week's fiches so they don't have to start from scratch, but they can edit independently
      fiches: JSON.parse(JSON.stringify(fiches))
    };
    
    const updated = [...savedWeeks, newWeek];
    setSavedWeeks(updated);
    localStorage.setItem('egalim_saved_weeks_v1', JSON.stringify(updated));
    
    // Auto select newly created week
    setActiveWeekId(newWeekId);
    localStorage.setItem('egalim_active_week_id_v1', newWeekId);
    setWeeklyPlan(newWeek.plan);
    setFiches(newWeek.fiches || DEFAULT_FICHES);
    setConvives(100);
  };

  const renameWeek = () => {
    const activeWeek = savedWeeks.find(w => w.id === activeWeekId);
    if (!activeWeek) return;
    const newName = prompt("Modifier le nom de la semaine :", activeWeek.nom);
    if (!newName || !newName.trim()) return;
    
    const updated = savedWeeks.map(w => 
      w.id === activeWeekId ? { ...w, nom: newName.trim() } : w
    );
    setSavedWeeks(updated);
    localStorage.setItem('egalim_saved_weeks_v1', JSON.stringify(updated));
  };

  const deleteWeek = () => {
    if (savedWeeks.length <= 1) {
      alert("Vous devez conserver au moins une semaine dans votre planificateur.");
      return;
    }
    const activeWeek = savedWeeks.find(w => w.id === activeWeekId);
    if (!activeWeek) return;
    if (confirm(`Supprimer définitivement la semaine "${activeWeek.nom}" et tous ses menus planifiés ?`)) {
      const updated = savedWeeks.filter(w => w.id !== activeWeekId);
      setSavedWeeks(updated);
      localStorage.setItem('egalim_saved_weeks_v1', JSON.stringify(updated));
      
      // Load the first remaining week
      const nextWeek = updated[0];
      setActiveWeekId(nextWeek.id);
      localStorage.setItem('egalim_active_week_id_v1', nextWeek.id);
      setWeeklyPlan(nextWeek.plan);
      setConvives(nextWeek.plan[activeDay]?.convives || 100);
    }
  };

  // Match recipe ingredient to active stock item by name
  const findStockItem = (productName: string): StockItem | undefined => {
    if (!productName || !stock) return undefined;
    const cleanSearch = productName.toLowerCase().replace('[bio] ', '').trim();
    return stock.find(item => 
      item && item.produit && item.produit.toLowerCase().replace('[bio] ', '').trim() === cleanSearch
    );
  };

  // Get single product unit price from stock or scan history
  const getProductUnitPrice = (productName: string): number => {
    const stockItem = findStockItem(productName);
    if (stockItem) {
      return stockItem.prix_unitaire || 0;
    }
    // If not in stock, look at recent scan history
    const historyStr = localStorage.getItem('egalim_invoice_history_v1');
    if (historyStr) {
      try {
        const history = JSON.parse(historyStr);
        if (Array.isArray(history)) {
          const cleanSearch = productName.toLowerCase().replace('[bio] ', '').trim();
          // Find most recent match in invoice scans
          const match = [...history].reverse().find(line => 
            line && line.produit && line.produit.toLowerCase().replace('[bio] ', '').trim() === cleanSearch
          );
          if (match) return match.prix_unitaire || 0;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return 0;
  };

  // Calculate course total cost
  const calculateCourseCost = (course: CourseSelection, dayConvives: number) => {
    let totalCost = 0;

    // 1. Ingredients from linked Fiche
    if (course.ficheId) {
      const fiche = fiches.find(f => f.id === course.ficheId);
      if (fiche && fiche.ingredients) {
        fiche.ingredients.forEach(ing => {
          const qty = calculateQuantity(ing.quantiteBase, fiche.portionsBase, dayConvives);
          const price = ing.prix_unitaire !== undefined ? ing.prix_unitaire : getProductUnitPrice(ing.produit);
          totalCost += qty * price;
        });
      }
    }

    // 2. Custom additions
    if (course.ingredientsCustom) {
      course.ingredientsCustom.forEach(ing => {
        const price = ing.prix_unitaire !== undefined ? ing.prix_unitaire : getProductUnitPrice(ing.produit);
        totalCost += ing.quantite_utilisee * price;
      });
    }

    return totalCost;
  };

  // Calculate scaled quantity
  const calculateQuantity = (baseQty: number, basePortions: number, dayConvives: number): number => {
    const qty = (baseQty * dayConvives) / basePortions;
    return Number(qty.toFixed(2));
  };

  // Change Fiche Selection for a Course
  const handleFicheSelect = (
    courseKey: 'entree' | 'plat' | 'accompagnement' | 'dessert', 
    ficheId: string
  ) => {
    const newPlan = { ...weeklyPlan };
    const selection = newPlan[activeDay][courseKey];
    selection.ficheId = ficheId;

    if (ficheId) {
      const selectedFiche = fiches.find(f => f.id === ficheId);
      selection.intitule = selectedFiche ? selectedFiche.nom : '';
    } else {
      selection.intitule = '';
    }

    savePlan(newPlan);
  };

  // Custom Title Change (if no Fiche is selected)
  const handleCustomTitleChange = (
    courseKey: 'entree' | 'plat' | 'accompagnement' | 'dessert', 
    title: string
  ) => {
    const newPlan = { ...weeklyPlan };
    newPlan[activeDay][courseKey].intitule = title;
    savePlan(newPlan);
  };

  // Add Custom Ingredient
  const handleAddCustomIngredient = (
    courseKey: 'entree' | 'plat' | 'accompagnement' | 'dessert', 
    itemOrName: StockItem | string,
    customLabel?: string,
    customUnit?: 'kilo' | 'pièce',
    customPrice?: number
  ) => {
    const newPlan = { ...weeklyPlan };
    const selection = newPlan[activeDay][courseKey];
    
    if (typeof itemOrName === 'string') {
      const name = itemOrName.trim();
      if (selection.ingredientsCustom.some(ing => ing.produit === name)) {
        setAddingCustomIngredientTo(null);
        return;
      }
      
      selection.ingredientsCustom.push({
        id: `custom-${crypto.randomUUID()}`,
        produit: name,
        quantite_utilisee: 1,
        est_bio: customLabel === 'BIO',
        label: customLabel || 'STANDARD',
        unite: customUnit || 'kilo',
        prix_unitaire: customPrice
      });

      // Save price to history so getProductUnitPrice can find it later
      if (customPrice !== undefined) {
        try {
          const historyStr = localStorage.getItem('egalim_invoice_history_v1');
          const history = historyStr ? JSON.parse(historyStr) : [];
          if (Array.isArray(history)) {
            history.push({
              id: `history-custom-${crypto.randomUUID()}`,
              produit: name,
              prix_unitaire: customPrice,
              quantite: 0,
              total_ht: 0,
              est_bio: customLabel === 'BIO',
              label: customLabel || 'STANDARD'
            });
            localStorage.setItem('egalim_invoice_history_v1', JSON.stringify(history));
          }
        } catch (e) {
          console.error("Error saving custom price to history", e);
        }
      }
    } else {
      if (selection.ingredientsCustom.some(ing => ing.id === itemOrName.id)) {
        setAddingCustomIngredientTo(null);
        return;
      }

      selection.ingredientsCustom.push({
        id: itemOrName.id,
        produit: itemOrName.produit,
        quantite_utilisee: 1,
        est_bio: itemOrName.est_bio,
        label: itemOrName.label || (itemOrName.est_bio ? 'BIO' : 'STANDARD'),
        unite: 'kilo' // Default unit for items from stock is kilo
      });
    }

    savePlan(newPlan);
    setAddingCustomIngredientTo(null);
    setSearchTerm('');
  };

  // Adjust Custom Ingredient Quantity
  const handleCustomQtyChange = (
    courseKey: 'entree' | 'plat' | 'accompagnement' | 'dessert', 
    id: string, 
    delta: number
  ) => {
    const newPlan = { ...weeklyPlan };
    const selection = newPlan[activeDay][courseKey];
    selection.ingredientsCustom = selection.ingredientsCustom.map(ing => {
      if (ing.id === id) {
        return { ...ing, quantite_utilisee: Math.max(0.1, Number((ing.quantite_utilisee + delta).toFixed(2))) };
      }
      return ing;
    });
    savePlan(newPlan);
  };

  // Remove Custom Ingredient
  const handleRemoveCustomIngredient = (
    courseKey: 'entree' | 'plat' | 'accompagnement' | 'dessert', 
    id: string
  ) => {
    const newPlan = { ...weeklyPlan };
    const selection = newPlan[activeDay][courseKey];
    selection.ingredientsCustom = selection.ingredientsCustom.filter(ing => ing.id !== id);
    savePlan(newPlan);
  };

  // Get all active ingredients for a day (both from Fiches and Customs) with scaled quantities
  const getDayIngredients = (dayMenu: DailyMenu) => {
    const list: { id: string; produit: string; quantite: number; est_bio: boolean; label?: string; unite?: 'kilo' | 'pièce'; source: string }[] = [];
    const courses: ('entree' | 'plat' | 'accompagnement' | 'dessert')[] = ['entree', 'plat', 'accompagnement', 'dessert'];

    if (!dayMenu) return list;

    courses.forEach(c => {
      const course = dayMenu[c];
      if (!course) return;
      
      // 1. Gather from linked Fiche
      if (course.ficheId) {
        const fiche = fiches.find(f => f.id === course.ficheId);
        if (fiche && fiche.ingredients) {
          fiche.ingredients.forEach(ing => {
            const stockItem = findStockItem(ing.produit);
            list.push({
              id: stockItem ? stockItem.id : `recipe-${ing.produit}`,
              produit: stockItem ? stockItem.produit : ing.produit,
              quantite: calculateQuantity(ing.quantiteBase, fiche.portionsBase, dayMenu.convives || 100),
              est_bio: ing.est_bio || false,
              label: ing.label || (ing.est_bio ? 'BIO' : 'STANDARD'),
              unite: ing.unite || 'kilo',
              source: `Fiche: ${fiche.nom}`
            });
          });
        }
      }

      // 2. Gather from custom additions
      if (course.ingredientsCustom) {
        course.ingredientsCustom.forEach(ing => {
          list.push({
            id: ing.id,
            produit: ing.produit,
            quantite: ing.quantite_utilisee,
            est_bio: ing.est_bio || false,
            label: ing.label || (ing.est_bio ? 'BIO' : 'STANDARD'),
            unite: ing.unite || 'kilo',
            source: 'Ajout Manuel'
          });
        });
      }
    });

    return list;
  };

  const getDayStockStatus = (dayName: string) => {
    const dayMenu = weeklyPlan[dayName];
    if (!dayMenu) return { status: 'EMPTY', missing: [] };
    
    const ingredients = getDayIngredients(dayMenu);
    if (!ingredients || ingredients.length === 0) return { status: 'EMPTY', missing: [] };
    
    const missing: { produit: string; requis: number; stock: number }[] = [];
    
    ingredients.forEach(ing => {
      const stockItem = findStockItem(ing.produit);
      const stockQty = stockItem ? stockItem.quantite : 0;
      if (stockQty < ing.quantite) {
        missing.push({
          produit: ing.produit.replace('[BIO] ', ''),
          requis: ing.quantite,
          stock: stockQty
        });
      }
    });
    
    return {
      status: missing.length === 0 ? 'READY' : 'MISSING',
      missing
    };
  };

  // Validate Menu (Deduct from Stock)
  const handleValidateDay = () => {
    const dayMenu = weeklyPlan[activeDay];
    if (dayMenu.valide) {
      alert("Ce jour a déjà été validé.");
      return;
    }

    const dayIngredients = getDayIngredients(dayMenu);
    if (dayIngredients.length === 0) {
      alert("Veuillez planifier des plats et ajouter des ingrédients avant de valider.");
      return;
    }

    // Verify stock availability
    let missingInfo = '';
    dayIngredients.forEach(ing => {
      const stockItem = stock.find(s => s.id === ing.id);
      if (!stockItem) {
        missingInfo += `- ${ing.produit} (Non disponible en stock)\n`;
      } else if (stockItem.quantite < ing.quantite) {
        missingInfo += `- ${ing.produit} (Stock: ${stockItem.quantite}, Requis: ${ing.quantite})\n`;
      }
    });

    if (missingInfo) {
      if (!confirm(`Attention ! Certains ingrédients sont manquants ou insuffisants en stock :\n${missingInfo}\nVoulez-vous tout de même forcer la validation ?`)) {
        return;
      }
    }

    if (confirm(`Valider le menu de ${activeDay} pour ${dayMenu.convives || 100} convives et déduire les ingrédients du stock ?`)) {
      // Deduct from stock
      dayIngredients.forEach(ing => {
        // Only deduct if it matches an actual stock item
        if (!ing.id.startsWith('recipe-')) {
          deductFromStock(ing.id, ing.quantite);
        }
      });

      // Mark day as validated
      const newPlan = { ...weeklyPlan };
      newPlan[activeDay].valide = true;
      savePlan(newPlan);

      setStock(getStock());
      alert(`Menu du ${activeDay} validé avec succès pour ${convives} convives !`);
    }
  };

  // Save current week plan as Template
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) {
      alert("Veuillez saisir un nom pour le modèle.");
      return;
    }

    const newTemplate: WeeklyTemplate = {
      id: crypto.randomUUID(),
      nom: newTemplateName.trim(),
      plan: JSON.parse(JSON.stringify(weeklyPlan)), // Deep copy
      convives: convives
    };

    saveTemplates([...templates, newTemplate]);
    setNewTemplateName('');
    alert("Modèle enregistré avec succès !");
  };

  // Load template
  const handleLoadTemplate = (template: WeeklyTemplate) => {
    if (confirm(`Charger le modèle "${template.nom}" ? Cela remplacera votre planning de la semaine en cours.`)) {
      savePlan(template.plan);
      saveConvives(template.convives);
      alert("Modèle chargé !");
      setActiveTab('PLANNER');
    }
  };

  // Delete template
  const handleDeleteTemplate = (id: string) => {
    if (confirm("Supprimer ce modèle de semaine ?")) {
      saveTemplates(templates.filter(t => t.id !== id));
    }
  };

  // Recipe Fiche Technique management
  const handleCreateFiche = () => {
    setEditingFiche({
      id: crypto.randomUUID(),
      nom: 'Nouvelle Recette',
      portionsBase: 100,
      miseEnOeuvre: '',
      ingredients: []
    });
  };

  const handleSaveFiche = () => {
    if (!editingFiche) return;
    if (!editingFiche.nom.trim()) {
      alert("Veuillez saisir le nom de la recette.");
      return;
    }

    const exists = fiches.some(f => f.id === editingFiche.id);
    let newFiches = [];
    if (exists) {
      newFiches = fiches.map(f => f.id === editingFiche.id ? editingFiche : f);
    } else {
      newFiches = [...fiches, editingFiche];
    }

    saveFiches(newFiches);
    setEditingFiche(null);
    alert("Fiche Technique sauvegardée !");
  };

  const handleDeleteFiche = (id: string) => {
    if (confirm("Supprimer cette fiche technique définitivement ?")) {
      saveFiches(fiches.filter(f => f.id !== id));
    }
  };

  const handleAddFicheIngredient = (
    productName: string, 
    customBio?: boolean, 
    customLabel?: string, 
    customUnit?: 'kilo' | 'pièce',
    customPrice?: number
  ) => {
    if (!editingFiche) return;
    if (editingFiche.ingredients.some(i => i.produit === productName)) return;
    
    const stockItem = findStockItem(productName);
    const isBio = customBio !== undefined ? customBio : (stockItem ? stockItem.est_bio : false);
    const label = customLabel !== undefined ? customLabel : (stockItem ? stockItem.label : (isBio ? 'BIO' : 'STANDARD'));
    const unit = customUnit || 'kilo';
    
    editingFiche.ingredients.push({
      produit: productName,
      quantiteBase: 1,
      est_bio: isBio,
      label: label,
      unite: unit,
      prix_unitaire: customPrice
    });
    
    // Save to history if custom price provided
    if (customPrice !== undefined) {
      try {
        const historyStr = localStorage.getItem('egalim_invoice_history_v1');
        const history = historyStr ? JSON.parse(historyStr) : [];
        if (Array.isArray(history)) {
          history.push({
            id: `history-custom-${crypto.randomUUID()}`,
            produit: productName,
            prix_unitaire: customPrice,
            quantite: 0,
            total_ht: 0,
            est_bio: isBio,
            label: label
          });
          localStorage.setItem('egalim_invoice_history_v1', JSON.stringify(history));
        }
      } catch (e) {}
    }
    setEditingFiche({ ...editingFiche });
  };

  const handleRemoveFicheIngredient = (index: number) => {
    if (!editingFiche) return;
    editingFiche.ingredients.splice(index, 1);
    setEditingFiche({ ...editingFiche });
  };

  const handleFicheIngredientQty = (index: number, val: number) => {
    if (!editingFiche) return;
    editingFiche.ingredients[index].quantiteBase = Math.max(0.1, Number((editingFiche.ingredients[index].quantiteBase + val).toFixed(2)));
    setEditingFiche({ ...editingFiche });
  };

  // Export week plan to CSV
  const handleExportCSV = () => {
    const headers = ['Jour', 'Convives du Jour', 'Type Repas', 'Plat/Recette', 'Ingrédient', 'Quantité Requise', 'Label / Est Bio', 'Origine'];
    const rows = [headers.join(';')];

    DAYS.forEach(day => {
      const dayData = weeklyPlan[day];
      const dayIngredients = getDayIngredients(dayData);
      const dayConvives = dayData.convives || 100;
      
      const courses: { key: 'entree' | 'plat' | 'accompagnement' | 'dessert'; label: string }[] = [
        { key: 'entree', label: 'Entrée' },
        { key: 'plat', label: 'Plat' },
        { key: 'accompagnement', label: 'Accompagnement' },
        { key: 'dessert', label: 'Dessert' }
      ];

      courses.forEach(c => {
        const course = dayData[c.key];
        if (course.intitule) {
          // List ingredients for this course
          const courseIngs = dayIngredients.filter(ing => 
            course.ficheId 
              ? ing.source.includes(course.intitule) 
              : ing.source === 'Ajout Manuel'
          );

          if (courseIngs.length === 0) {
            rows.push([day, dayConvives, c.label, `"${course.intitule}"`, '', '', '', ''].join(';'));
          } else {
            courseIngs.forEach(ing => {
              rows.push([
                day,
                dayConvives,
                c.label,
                `"${course.intitule}"`,
                `"${ing.produit.replace('[BIO] ', '')}"`,
                `"${ing.quantite} ${ing.unite === 'pièce' ? 'pc' : 'kg'}"`,
                ing.label || (ing.est_bio ? 'BIO' : 'Standard'),
                ing.source
              ].join(';'));
            });
          }
        }
      });
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fiche_cuisine_semaine_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStock = (stock || []).filter(item =>
    item && item.produit && item.produit.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const courseIcons = { entree: '🥗', plat: '🍗', accompagnement: '🥔', dessert: '🍰' };
  const courseLabels = { entree: 'Entrée', plat: 'Plat Principal', accompagnement: 'Accompagnement', dessert: 'Dessert' };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      
      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-8 h-8 text-orange-500" />
            Gestion des Menus & Recettes
          </h1>
          <p className="text-gray-500">Planification intelligente, fiches techniques et calcul automatique de portions</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm">
          <button
            onClick={() => setActiveTab('PLANNER')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'PLANNER' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Planificateur
          </button>
          <button
            onClick={() => setActiveTab('RECIPES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'RECIPES' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Fiches Techniques
          </button>
          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'TEMPLATES' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Copy className="w-4 h-4" />
            Modèles
          </button>
        </div>
      </div>

      {/* TAB 1: PLANNER */}
      {activeTab === 'PLANNER' && (
        <div className="space-y-6">
          {/* Week Selector Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Semaine Active</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="font-extrabold text-gray-800 text-lg">
                  {savedWeeks.find(w => w.id === activeWeekId)?.nom || "Semaine active"}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={activeWeekId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedWeek = savedWeeks.find(w => w.id === selectedId);
                  if (selectedWeek) {
                    setActiveWeekId(selectedId);
                    localStorage.setItem('egalim_active_week_id_v1', selectedId);
                    setWeeklyPlan(selectedWeek.plan);
                    setConvives(selectedWeek.plan[activeDay]?.convives || 100);
                    // Load fiches specific to newly active week
                    setFiches(selectedWeek.fiches || DEFAULT_FICHES);
                  }
                }}
                className="flex-1 lg:flex-initial bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all shadow-sm min-w-[240px]"
              >
                {savedWeeks.map(w => (
                  <option key={w.id} value={w.id}>{w.nom}</option>
                ))}
              </select>

              <button
                onClick={createNewWeek}
                className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl transition-all font-bold text-xs flex items-center gap-1 border border-orange-100 shadow-sm"
                title="Créer une nouvelle semaine planifiée"
              >
                <Plus className="w-4 h-4" />
                Nouveau
              </button>

              <button
                onClick={renameWeek}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all font-bold text-xs flex items-center gap-1 border border-gray-200 shadow-sm"
                title="Renommer cette semaine"
              >
                <Edit3 className="w-4 h-4" />
                Renommer
              </button>

              <button
                onClick={deleteWeek}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all font-bold text-xs flex items-center gap-1 border border-red-100 shadow-sm"
                title="Supprimer cette semaine"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
          {/* Guest Count Selector Bar */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nombre de Convives</label>
                <div className="flex items-center gap-2 mt-1">
                  <button 
                    onClick={() => saveConvives(Math.max(1, convives - 10))}
                    className="p-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    className="w-20 text-center font-extrabold text-lg text-gray-800 focus:outline-none border-b border-dashed border-gray-300"
                    value={convives}
                    onChange={(e) => saveConvives(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button 
                    onClick={() => saveConvives(convives + 10)}
                    className="p-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs shadow-sm"
              >
                <Download className="w-4 h-4" />
                Fiche de Cuisine (CSV)
              </button>
            </div>
          </div>

          {/* Day Cost Summary Card */}
          {(() => {
            const dayMenu = weeklyPlan[activeDay];
            const dayConvives = dayMenu.convives || 100;
            const entreeCost = calculateCourseCost(dayMenu.entree, dayConvives);
            const platCost = calculateCourseCost(dayMenu.plat, dayConvives);
            const accCost = calculateCourseCost(dayMenu.accompagnement, dayConvives);
            const dessertCost = calculateCourseCost(dayMenu.dessert, dayConvives);
            const totalCost = entreeCost + platCost + accCost + dessertCost;
            const perPerson = dayConvives > 0 ? totalCost / dayConvives : 0;

            return (
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider opacity-90">Analyse Financière du Menu ({activeDay})</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold">{totalCost.toFixed(2)} €</span>
                    <span className="text-sm opacity-90">total HT pour {dayConvives} convives</span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-right">
                  <span className="text-xs block opacity-85">Coût moyen par repas</span>
                  <span className="text-2xl font-black">{perPerson.toFixed(2)} € <span className="text-xs font-normal">/ repas</span></span>
                </div>
              </div>
            );
          })()}

          {/* Day selection tabs */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-1">
            {DAYS.map(day => {
              const isValidated = weeklyPlan[day].valide;
              const { status } = getDayStockStatus(day);
              
              return (
                <button
                  key={day}
                  onClick={() => {
                    setActiveDay(day);
                    setAddingCustomIngredientTo(null);
                    setConvives(weeklyPlan[day].convives || 100);
                  }}
                  className={`flex-1 min-w-[90px] py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                    activeDay === day
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{day}</span>
                  <div className="flex gap-1">
                    {isValidated ? (
                      <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-extrabold">✓ Déduit</span>
                    ) : status === 'READY' ? (
                      <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-extrabold">🟢 Prêt</span>
                    ) : status === 'MISSING' ? (
                      <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-extrabold">🟡 En attente</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Status Bar with Stock Alerts */}
          {(() => {
            const dayMenu = weeklyPlan[activeDay];
            const { status, missing } = getDayStockStatus(activeDay);
            
            return (
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                dayMenu.valide 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : status === 'READY'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : status === 'MISSING'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                  : 'bg-orange-50 border-orange-100 text-orange-800'
              }`}>
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">📅</span>
                    <span className="font-extrabold text-gray-800 text-lg">Menu du {activeDay}</span>
                    {dayMenu.valide ? (
                      <span className="px-2.5 py-1 rounded-full bg-green-200 text-green-900 text-xs font-extrabold">
                        ✓ Validé (Stock déduit)
                      </span>
                    ) : status === 'READY' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 text-xs font-extrabold">
                        🟢 Prêt à valider (Stock suffisant)
                      </span>
                    ) : status === 'MISSING' ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold">
                        🟡 En attente d'ingrédients
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-extrabold">
                        Menu vide / Brouillon
                      </span>
                    )}
                  </div>
                  
                  {/* Missing items display list */}
                  {!dayMenu.valide && status === 'MISSING' && (
                    <div className="text-xs text-amber-700 font-semibold space-y-1 pt-1.5">
                      <span>⚠️ Ingrédients insuffisants pour {dayMenu.convives || 100} convives :</span>
                      <ul className="list-disc list-inside pl-2 space-y-0.5">
                        {missing.map((item, idx) => (
                          <li key={idx} className="text-gray-700">
                            {item.produit} : besoin de <b className="text-orange-600">{item.requis}</b>, en stock : <span className="text-red-500 font-bold">{item.stock}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {!dayMenu.valide && status === 'READY' && (
                    <p className="text-xs text-emerald-700 font-medium pt-1">
                      🎉 Tous les ingrédients requis sont disponibles en stock.
                    </p>
                  )}

                  {!dayMenu.valide && status === 'EMPTY' && (
                    <p className="text-xs text-gray-500 font-medium pt-1">
                      Aucun plat planifié pour ce jour. Sélectionnez une fiche technique ou tapez un titre.
                    </p>
                  )}
                </div>
                
                {!dayMenu.valide && status !== 'EMPTY' && (
                  <button
                    onClick={handleValidateDay}
                    className={`px-6 py-3 rounded-xl font-bold text-white transition-all text-xs shadow-md shrink-0 ${
                      status === 'READY'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 hover:scale-105 active:scale-95'
                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-100 hover:scale-105 active:scale-95'
                    }`}
                  >
                    Valider & Déduire du Stock
                  </button>
                )}
              </div>
            );
          })()}

          {/* Active Day Menu Editor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['entree', 'plat', 'accompagnement', 'dessert'] as const).map(courseKey => {
              const selection = weeklyPlan[activeDay][courseKey];
              const isSearching = addingCustomIngredientTo === courseKey;
              
              // Load active recipe details if linked to a Fiche Technique
              const linkedFiche = fiches.find(f => f.id === selection.ficheId);
              
              return (
                <div key={courseKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Course Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{courseIcons[courseKey]}</span>
                        <span className="font-bold text-gray-800 text-lg">{courseLabels[courseKey]}</span>
                      </div>
                      {(() => {
                        const dayConvives = weeklyPlan[activeDay].convives || 100;
                        const cost = calculateCourseCost(selection, dayConvives);
                        const perPerson = dayConvives > 0 ? cost / dayConvives : 0;
                        return (
                          <span className="text-[11px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg border border-orange-100/50 font-bold shrink-0">
                            {cost.toFixed(2)} € ({perPerson.toFixed(2)} €/repas)
                          </span>
                        );
                      })()}
                    </div>

                    {/* Fiche Selection Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Fiche Technique (Recette)</label>
                      <select
                        value={selection.ficheId}
                        onChange={(e) => handleFicheSelect(courseKey, e.target.value)}
                        disabled={weeklyPlan[activeDay].valide}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-gray-700"
                      >
                        <option value="">-- Plat personnalisé (Saisie libre) --</option>
                        {fiches.map(f => (
                          <option key={f.id} value={f.id}>{f.nom}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dish Title (Custom if no Fiche) */}
                    {!selection.ficheId ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Intitulé du plat</label>
                        <input
                          type="text"
                          placeholder="ex: Salade verte"
                          className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none text-sm font-medium text-gray-800"
                          value={selection.intitule}
                          onChange={(e) => handleCustomTitleChange(courseKey, e.target.value)}
                          disabled={weeklyPlan[activeDay].valide}
                        />
                      </div>
                    ) : (
                      linkedFiche && (
                        <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100/30 space-y-1.5">
                          <span className="text-xs font-bold text-orange-600 block">Recette : {linkedFiche.nom}</span>
                          <p className="text-xs text-gray-500 line-clamp-3 whitespace-pre-line leading-relaxed">
                            {linkedFiche.miseEnOeuvre}
                          </p>
                        </div>
                      )
                    )}

                    {/* Ingredients List */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ingrédients requis</span>
                      
                      <div className="space-y-1.5">
                        {/* 1. Show recipe ingredients scaled to convives */}
                        {linkedFiche && linkedFiche.ingredients.map((ing, idx) => {
                          const stockItem = findStockItem(ing.produit);
                          const requiredQty = calculateQuantity(ing.quantiteBase, linkedFiche.portionsBase, weeklyPlan[activeDay].convives || 100);
                          const isAvailable = stockItem && stockItem.quantite >= requiredQty;
                          
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                              <div>
                                <span className="font-semibold text-gray-800">{ing.produit}</span>
                                {ing.est_bio && <span className="ml-1 text-[8px] bg-green-100 text-green-700 px-1 rounded font-bold">BIO</span>}
                                <span className="text-[10px] text-gray-400 block">Basé sur la fiche ({ing.quantiteBase} {ing.unite === 'pièce' ? 'pc' : 'kg'} pour {linkedFiche.portionsBase})</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-gray-900 block">{requiredQty} {ing.unite === 'pièce' ? 'pc' : 'kg'}</span>
                                <span className={`text-[9px] font-semibold block ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                                  {stockItem ? `Stock: ${stockItem.quantite} kg` : 'Non en stock'}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* 2. Show manually added ingredients */}
                        {selection.ingredientsCustom.map(ing => {
                          const stockItem = stock.find(s => s.id === ing.id);
                          const isAvailable = stockItem && stockItem.quantite >= ing.quantite_utilisee;
                          
                          return (
                            <div key={ing.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/50 border border-orange-100/30 text-xs">
                              <div className="space-y-1">
                                <span className="font-semibold text-gray-800">{ing.produit.replace('[BIO] ', '')}</span>
                                <span className="text-[9px] text-orange-600 block">Ajout Manuel</span>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap justify-end">
                                <select
                                  disabled={weeklyPlan[activeDay].valide}
                                  value={ing.label || (ing.est_bio ? 'BIO' : 'STANDARD')}
                                  onChange={(e) => {
                                    const newLabel = e.target.value;
                                    const newPlan = { ...weeklyPlan };
                                    newPlan[activeDay][courseKey].ingredientsCustom = newPlan[activeDay][courseKey].ingredientsCustom.map(cIng => {
                                      if (cIng.id === ing.id) {
                                        return { ...cIng, label: newLabel, est_bio: newLabel === 'BIO' };
                                      }
                                      return cIng;
                                    });
                                    savePlan(newPlan);
                                  }}
                                  className="bg-transparent border border-orange-200 rounded text-[10px] py-0.5 px-1 focus:outline-none font-semibold text-orange-700"
                                >
                                  <option value="STANDARD">Standard</option>
                                  <option value="BIO">BIO</option>
                                  <option value="LABEL_ROUGE">Label Rouge</option>
                                  <option value="HVE">HVE</option>
                                  <option value="IGP">IGP</option>
                                  <option value="STG">STG</option>
                                  <option value="AOP">AOP</option>
                                  <option value="AOG">AOG</option>
                                  <option value="FERMIER">Fermier</option>
                                  <option value="PECHE_DURABLE">Pêche Durable</option>
                                </select>

                                <button
                                  disabled={weeklyPlan[activeDay].valide}
                                  onClick={() => handleCustomQtyChange(courseKey, ing.id, -1)}
                                  className="p-0.5 hover:bg-orange-100 rounded text-orange-600"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-bold text-gray-900">{ing.quantite_utilisee}</span>
                                <button
                                  disabled={weeklyPlan[activeDay].valide}
                                  onClick={() => handleCustomQtyChange(courseKey, ing.id, 1)}
                                  className="p-0.5 hover:bg-orange-100 rounded text-orange-600"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <select
                                  disabled={weeklyPlan[activeDay].valide}
                                  value={ing.unite || 'kilo'}
                                  onChange={(e) => {
                                    const newUnit = e.target.value as 'kilo' | 'pièce';
                                    const newPlan = { ...weeklyPlan };
                                    newPlan[activeDay][courseKey].ingredientsCustom = newPlan[activeDay][courseKey].ingredientsCustom.map(cIng => {
                                      if (cIng.id === ing.id) {
                                        return { ...cIng, unite: newUnit };
                                      }
                                      return cIng;
                                    });
                                    savePlan(newPlan);
                                  }}
                                  className="bg-transparent border border-orange-200 rounded text-[10px] py-0.5 px-1 focus:outline-none font-semibold text-orange-700"
                                >
                                  <option value="kilo">kg</option>
                                  <option value="pièce">pc</option>
                                </select>
                                <button
                                  disabled={weeklyPlan[activeDay].valide}
                                  onClick={() => handleRemoveCustomIngredient(courseKey, ing.id)}
                                  className="ml-1 p-0.5 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Empty state */}
                        {!linkedFiche && selection.ingredientsCustom.length === 0 && (
                          <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl text-xs text-gray-400">
                            Aucun ingrédient associé.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add manual ingredient selector */}
                  {!weeklyPlan[activeDay].valide && (
                    <div className="pt-4 mt-4 border-t border-gray-100">
                      {isSearching ? (
                        <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Rechercher ou saisir un produit..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              autoFocus
                            />
                          </div>

                          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                            {filteredStock.length === 0 ? (
                              <div className="text-center py-3 text-gray-400">Aucun produit</div>
                            ) : (
                              filteredStock.map(item => {
                                const isAdded = selection.ingredientsCustom.some(i => i.id === item.id);
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => !isAdded && handleAddCustomIngredient(courseKey, item)}
                                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                      isAdded ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-orange-50/50 cursor-pointer'
                                    }`}
                                  >
                                    <div className="font-semibold">{item.produit.replace('[BIO] ', '')}</div>
                                    <div className="flex items-center gap-1.5">
                                      {item.est_bio && <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded font-bold">BIO</span>}
                                      <div className="text-[10px] text-gray-400">Stock: {item.quantite}</div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Manual add input for Planner custom ingredients */}
                          {searchTerm.trim() && (
                            <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50 space-y-2 text-xs">
                              <div className="font-bold text-orange-850">Pas en stock ? Saisir manuellement :</div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <select
                                    id={`manual-planner-label-${courseKey}`}
                                    className="w-1/2 bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-700"
                                  >
                                    <option value="STANDARD">Standard</option>
                                    <option value="BIO">BIO</option>
                                    <option value="LABEL_ROUGE">Label Rouge</option>
                                    <option value="HVE">HVE</option>
                                    <option value="IGP">IGP</option>
                                    <option value="STG">STG</option>
                                    <option value="AOP">AOP</option>
                                    <option value="AOG">AOG</option>
                                    <option value="FERMIER">Fermier</option>
                                    <option value="PECHE_DURABLE">Pêche Durable</option>
                                  </select>
                                  <select
                                    id={`manual-planner-unit-${courseKey}`}
                                    className="w-1/2 bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-700"
                                  >
                                    <option value="kilo">Kilo (kg)</option>
                                    <option value="pièce">Pièce (pc)</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-bold text-gray-400 block uppercase">Prix unitaire (€)</label>
                                  <input
                                    id={`manual-planner-price-${courseKey}`}
                                    type="number"
                                    step="0.01"
                                    placeholder="ex: 3.50 (facultatif)"
                                    className="w-full bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-750"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const selectEl = document.getElementById(`manual-planner-label-${courseKey}`) as HTMLSelectElement;
                                    const selectUnit = document.getElementById(`manual-planner-unit-${courseKey}`) as HTMLSelectElement;
                                    const priceEl = document.getElementById(`manual-planner-price-${courseKey}`) as HTMLInputElement;
                                    const customLabel = selectEl ? selectEl.value : 'STANDARD';
                                    const customUnit = selectUnit ? selectUnit.value as 'kilo' | 'pièce' : 'kilo';
                                    const customPrice = priceEl && priceEl.value ? parseFloat(priceEl.value) : undefined;
                                    handleAddCustomIngredient(courseKey, searchTerm.trim(), customLabel, customUnit, customPrice);
                                  }}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 shadow-sm"
                                >
                                  <Plus className="w-3 h-3" />
                                  Ajouter "{searchTerm.trim()}"
                                </button>
                              </div>
                            </div>
                          )}

                          <button onClick={() => setAddingCustomIngredientTo(null)} className="w-full text-center text-xs text-gray-500">
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingCustomIngredientTo(courseKey);
                            setSearchTerm('');
                          }}
                          className="w-full py-2 border border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:text-orange-500 hover:border-orange-300 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Ajouter un ingrédient supplémentaire
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RECIPES (FICHES TECHNIQUES) */}
      {activeTab === 'RECIPES' && (
        <div className="space-y-6">
          {editingFiche ? (
            /* Recipe Editor View */
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-orange-500" />
                  Modifier la Fiche Technique
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingFiche(null)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleSaveFiche}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer la Fiche
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Form fields */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nom du Plat</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      value={editingFiche.nom}
                      onChange={(e) => setEditingFiche({ ...editingFiche, nom: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Portions de Base (Nombre de personnes)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      value={editingFiche.portionsBase}
                      onChange={(e) => setEditingFiche({ ...editingFiche, portionsBase: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Mise en œuvre (Procédure et étapes de préparation)</label>
                    <textarea
                      rows={6}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-sans"
                      placeholder="Indiquez les étapes étape par étape..."
                      value={editingFiche.miseEnOeuvre}
                      onChange={(e) => setEditingFiche({ ...editingFiche, miseEnOeuvre: e.target.value })}
                    />
                  </div>
                </div>

                {/* Recipe ingredients section */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider block">Ingrédients de la Recette</span>
                  
                  {/* List ingredients in recipe */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {editingFiche.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-gray-800">{ing.produit}</span>
                            <select
                              value={ing.label || (ing.est_bio ? 'BIO' : 'STANDARD')}
                              onChange={(e) => {
                                const newLabel = e.target.value;
                                editingFiche.ingredients[idx].label = newLabel;
                                editingFiche.ingredients[idx].est_bio = newLabel === 'BIO';
                                setEditingFiche({ ...editingFiche });
                              }}
                              className="bg-transparent border border-gray-200 rounded text-[9px] py-0.5 px-1 focus:outline-none font-semibold text-gray-600"
                            >
                              <option value="STANDARD">Standard</option>
                              <option value="BIO">BIO</option>
                              <option value="LABEL_ROUGE">Label Rouge</option>
                              <option value="HVE">HVE</option>
                              <option value="IGP">IGP</option>
                              <option value="STG">STG</option>
                              <option value="AOP">AOP</option>
                              <option value="AOG">AOG</option>
                              <option value="FERMIER">Fermier</option>
                              <option value="PECHE_DURABLE">Pêche Durable</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleFicheIngredientQty(idx, -0.5)} className="p-0.5 hover:bg-gray-100 rounded">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold w-10 text-center">{ing.quantiteBase}</span>
                          <button onClick={() => handleFicheIngredientQty(idx, 0.5)} className="p-0.5 hover:bg-gray-100 rounded">
                            <Plus className="w-3 h-3" />
                          </button>

                          <select
                            value={ing.unite || 'kilo'}
                            onChange={(e) => {
                              editingFiche.ingredients[idx].unite = e.target.value as 'kilo' | 'pièce';
                              setEditingFiche({ ...editingFiche });
                            }}
                            className="bg-gray-50 border border-gray-200 rounded text-[9px] py-0.5 px-1 focus:outline-none font-semibold text-gray-600"
                          >
                            <option value="kilo">kg</option>
                            <option value="pièce">pc</option>
                          </select>

                          <input
                            type="number"
                            step="0.01"
                            placeholder="Prix u. (€)"
                            value={ing.prix_unitaire !== undefined ? ing.prix_unitaire : ''}
                            onChange={(e) => {
                              editingFiche.ingredients[idx].prix_unitaire = e.target.value ? parseFloat(e.target.value) : undefined;
                              setEditingFiche({ ...editingFiche });
                            }}
                            className="w-16 bg-gray-50 border border-gray-200 rounded text-[9px] py-0.5 px-1 focus:outline-none font-semibold text-gray-600"
                          />

                          <button onClick={() => handleRemoveFicheIngredient(idx)} className="p-0.5 text-red-500 hover:bg-red-50 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {editingFiche.ingredients.length === 0 && (
                      <div className="text-center py-6 text-gray-400 text-xs">Aucun ingrédient. Sélectionnez-en un ci-dessous.</div>
                    )}
                  </div>

                  {/* Add stock item or manual input to recipe list */}
                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ajouter un ingrédient</span>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher ou saisir un produit..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                      {filteredStock.slice(0, 10).map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            handleAddFicheIngredient(item.produit.replace('[BIO] ', ''), item.est_bio, item.label, 'kilo');
                            setSearchTerm('');
                          }}
                          className="p-1.5 bg-white rounded border border-gray-100 hover:border-orange-200 cursor-pointer flex justify-between items-center"
                        >
                          <span className="font-medium">{item.produit.replace('[BIO] ', '')}</span>
                          <div className="flex items-center gap-1.5">
                            {item.est_bio && <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded font-bold">BIO</span>}
                            <PlusCircle className="w-4 h-4 text-orange-500" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Manual add input */}
                    {searchTerm.trim() && (
                      <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50 space-y-2 text-xs">
                        <div className="font-bold text-orange-850">Ajout Manuel :</div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <select
                              id="manual-fiche-label"
                              className="w-1/2 bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-700"
                            >
                              <option value="STANDARD">Standard</option>
                              <option value="BIO">BIO</option>
                              <option value="LABEL_ROUGE">Label Rouge</option>
                              <option value="HVE">HVE</option>
                              <option value="IGP">IGP</option>
                              <option value="STG">STG</option>
                              <option value="AOP">AOP</option>
                              <option value="AOG">AOG</option>
                              <option value="FERMIER">Fermier</option>
                              <option value="PECHE_DURABLE">Pêche Durable</option>
                            </select>
                            <select
                              id="manual-fiche-unite"
                              className="w-1/2 bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-700"
                            >
                              <option value="kilo">Kilo (kg)</option>
                              <option value="pièce">Pièce (pc)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-gray-400 block uppercase">Prix unitaire (€)</label>
                            <input
                              id="manual-fiche-price"
                              type="number"
                              step="0.01"
                              placeholder="ex: 3.50 (facultatif)"
                              className="w-full bg-white border border-gray-250 rounded text-[10px] py-1 px-1.5 focus:outline-none font-semibold text-gray-750"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const selectEl = document.getElementById('manual-fiche-label') as HTMLSelectElement;
                              const selectUnit = document.getElementById('manual-fiche-unite') as HTMLSelectElement;
                              const priceEl = document.getElementById('manual-fiche-price') as HTMLInputElement;
                              const customLabel = selectEl ? selectEl.value : 'STANDARD';
                              const customUnit = selectUnit ? selectUnit.value as 'kilo' | 'pièce' : 'kilo';
                              const customPrice = priceEl && priceEl.value ? parseFloat(priceEl.value) : undefined;
                              handleAddFicheIngredient(searchTerm.trim(), customLabel === 'BIO', customLabel, customUnit, customPrice);
                              setSearchTerm('');
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                            Ajouter "{searchTerm.trim()}"
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Recipes Grid View */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Bibliothèque de fiches techniques ({fiches.length} recettes)</span>
                <button
                  onClick={handleCreateFiche}
                  className="flex items-center gap-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Créer une Fiche Technique
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fiches.map(fiche => (
                  <div key={fiche.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{fiche.nom}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-bold">
                          Pour {fiche.portionsBase} pers.
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ingrédients :</span>
                        <div className="flex flex-wrap gap-1">
                          {fiche.ingredients.map((ing, idx) => {
                            const showLabel = ing.label && ing.label !== 'STANDARD';
                            return (
                              <span key={idx} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md font-semibold border border-orange-100/30 flex items-center gap-1">
                                <span>{ing.produit} ({ing.quantiteBase})</span>
                                {showLabel && (
                                  <span className="text-[8px] bg-orange-100 text-orange-850 px-1 rounded font-extrabold uppercase">
                                    {ing.label?.replace('_', ' ')}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mise en œuvre :</span>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic">
                          {fiche.miseEnOeuvre || 'Aucune étape définie.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => setEditingFiche(JSON.parse(JSON.stringify(fiche)))}
                        className="flex-1 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-bold transition-all"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteFiche(fiche.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEMPLATES (MODÈLES HEBDOMADAIRES) */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-6">
          {/* Save template bar */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Save className="w-5 h-5 text-gray-400" />
              Sauvegarder la semaine en cours comme Modèle
            </h2>
            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                placeholder="Nom du modèle (ex: Semaine Automne - Menu A)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-medium"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <button
                onClick={handleSaveAsTemplate}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-sm"
              >
                Sauvegarder
              </button>
            </div>
          </div>

          {/* Templates list */}
          <div className="space-y-4">
            <h3 className="text-sm text-gray-500">Vos Modèles de Semaines sauvegardés ({templates.length})</h3>
            
            {templates.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
                Aucun modèle de semaine en mémoire.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map(template => (
                  <div key={template.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800 text-lg leading-tight">{template.nom}</h4>
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded font-extrabold">
                          {template.convives} Convives
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {DAYS.map(day => {
                          const dayData = template.plan[day];
                          const entrees = dayData.entree.intitule || 'Saisie vide';
                          const plats = dayData.plat.intitule || 'Saisie vide';
                          return (
                            <div key={day} className="flex justify-between gap-2 border-b border-gray-200/50 last:border-0 pb-1 last:pb-0">
                              <span className="font-bold text-gray-700 min-w-[50px]">{day}</span>
                              <span className="truncate text-right max-w-[200px] text-gray-500" title={`${entrees} / ${plats}`}>
                                {plats}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="flex-1 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Charger cette Semaine
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
