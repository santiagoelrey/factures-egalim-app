// Utilitaires de mémorisation permanente des menus et cumul des dépenses (Semaine / Mois / Année)

export interface CourseDetail {
  intitule: string;
  ficheId?: string;
  coutTotal: number;
  coutParRepas: number;
}

export interface ArchivedMenuDay {
  id: string;
  date: string; // ISO YYYY-MM-DD
  jourSemaine: string; // Lundi, Mardi...
  weekNom?: string;
  convives: number;
  maternelle?: number;
  elementaire?: number;
  adultes?: number;
  entree: CourseDetail;
  plat: CourseDetail;
  accompagnement: CourseDetail;
  dessert: CourseDetail;
  sans_viande?: string;
  badge_jour?: string;
  notes_jour?: string;
  coutTotalJour: number;
  coutParRepasJour: number;
  menu_valide: boolean;
  stock_deduit: boolean;
  date_validation_menu?: string;
  date_deduction_stock?: string;
}

const ARCHIVE_STORAGE_KEY = 'egalim_menu_archive_v1';

// Récupérer tous les menus archivés
export function getArchivedMenus(): ArchivedMenuDay[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list.sort((a, b) => b.date.localeCompare(a.date)); // Du plus récent au plus ancien
    }
  } catch (e) {
    console.error('Erreur lecture archive menus:', e);
  }
  return [];
}

// Enregistrer ou mettre à jour un menu dans l'archive permanente
export function saveArchivedMenu(menu: ArchivedMenuDay): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getArchivedMenus();
    const index = list.findIndex(m => m.date === menu.date || m.id === menu.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...menu };
    } else {
      list.push(menu);
    }
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erreur sauvegarde archive menu:', e);
  }
}

// Supprimer un menu de l'archive
export function deleteArchivedMenu(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getArchivedMenus().filter(m => m.id !== id);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erreur suppression menu archivé:', e);
  }
}

// Synthèses financières par Période (Semaine / Mois / Année)
export interface PeriodExpenseSummary {
  periodKey: string; // Ex: "2026-W45", "Novembre 2026", "2026-2027"
  label: string;
  startDate?: string;
  endDate?: string;
  totalRepas: number;
  totalDepenseHT: number;
  coutMoyenRepas: number;
  nbMenusValides: number;
  nbMenusStockDeduit: number;
  jours: ArchivedMenuDay[];
}

// Cumul par Semaine
export function groupExpensesByWeek(menus: ArchivedMenuDay[]): PeriodExpenseSummary[] {
  const map = new Map<string, ArchivedMenuDay[]>();

  menus.forEach(m => {
    if (!m.date) return;
    const d = new Date(m.date + 'T12:00:00');
    if (isNaN(d.getTime())) return;

    // Calcul du numéro de semaine ISO
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-S${String(weekNum).padStart(2, '0')}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  });

  const summaries: PeriodExpenseSummary[] = [];

  map.forEach((days, key) => {
    days.sort((a, b) => a.date.localeCompare(b.date));
    const totalRepas = days.reduce((sum, d) => sum + d.convives, 0);
    const totalDepenseHT = days.reduce((sum, d) => sum + d.coutTotalJour, 0);
    const coutMoyenRepas = totalRepas > 0 ? totalDepenseHT / totalRepas : 0;
    const nbMenusValides = days.filter(d => d.menu_valide).length;
    const nbMenusStockDeduit = days.filter(d => d.stock_deduit).length;

    const start = days[0]?.date;
    const end = days[days.length - 1]?.date;

    summaries.push({
      periodKey: key,
      label: `Semaine ${key.split('-S')[1]} (${days[0]?.weekNom || 'Semaine'})`,
      startDate: start,
      endDate: end,
      totalRepas,
      totalDepenseHT: Number(totalDepenseHT.toFixed(2)),
      coutMoyenRepas: Number(coutMoyenRepas.toFixed(2)),
      nbMenusValides,
      nbMenusStockDeduit,
      jours: days
    });
  });

  return summaries.sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

// Cumul par Mois
export function groupExpensesByMonth(menus: ArchivedMenuDay[]): PeriodExpenseSummary[] {
  const map = new Map<string, ArchivedMenuDay[]>();
  const monthsNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  menus.forEach(m => {
    if (!m.date) return;
    const d = new Date(m.date + 'T12:00:00');
    if (isNaN(d.getTime())) return;

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  });

  const summaries: PeriodExpenseSummary[] = [];

  map.forEach((days, key) => {
    const [yearStr, monthStr] = key.split('-');
    const monthIdx = parseInt(monthStr, 10) - 1;
    const monthName = monthsNames[monthIdx] || monthStr;

    const totalRepas = days.reduce((sum, d) => sum + d.convives, 0);
    const totalDepenseHT = days.reduce((sum, d) => sum + d.coutTotalJour, 0);
    const coutMoyenRepas = totalRepas > 0 ? totalDepenseHT / totalRepas : 0;
    const nbMenusValides = days.filter(d => d.menu_valide).length;
    const nbMenusStockDeduit = days.filter(d => d.stock_deduit).length;

    summaries.push({
      periodKey: key,
      label: `${monthName} ${yearStr}`,
      totalRepas,
      totalDepenseHT: Number(totalDepenseHT.toFixed(2)),
      coutMoyenRepas: Number(coutMoyenRepas.toFixed(2)),
      nbMenusValides,
      nbMenusStockDeduit,
      jours: days
    });
  });

  return summaries.sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

// Cumul par Année (Année Scolaire Septembre -> Août)
export function groupExpensesBySchoolYear(menus: ArchivedMenuDay[]): PeriodExpenseSummary[] {
  const map = new Map<string, ArchivedMenuDay[]>();

  menus.forEach(m => {
    if (!m.date) return;
    const d = new Date(m.date + 'T12:00:00');
    if (isNaN(d.getTime())) return;

    const year = d.getFullYear();
    const month = d.getMonth(); // 0 = Jan, 8 = Sept
    // Année scolaire : si mois >= 8 (Septembre), année X / X+1. Sinon X-1 / X.
    const startYear = month >= 8 ? year : year - 1;
    const key = `Année Scolaire ${startYear}-${startYear + 1}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  });

  const summaries: PeriodExpenseSummary[] = [];

  map.forEach((days, key) => {
    const totalRepas = days.reduce((sum, d) => sum + d.convives, 0);
    const totalDepenseHT = days.reduce((sum, d) => sum + d.coutTotalJour, 0);
    const coutMoyenRepas = totalRepas > 0 ? totalDepenseHT / totalRepas : 0;
    const nbMenusValides = days.filter(d => d.menu_valide).length;
    const nbMenusStockDeduit = days.filter(d => d.stock_deduit).length;

    summaries.push({
      periodKey: key,
      label: key,
      totalRepas,
      totalDepenseHT: Number(totalDepenseHT.toFixed(2)),
      coutMoyenRepas: Number(coutMoyenRepas.toFixed(2)),
      nbMenusValides,
      nbMenusStockDeduit,
      jours: days
    });
  });

  return summaries.sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}
