// Utilitaires de gestion de la base de données d'effectifs datés par jour

export interface DailyHeadcount {
  id: string;
  date: string; // Format ISO YYYY-MM-DD
  total: number;
  maternelle?: number;
  elementaire?: number;
  adultes?: number;
  notes?: string;
}

const STORAGE_KEY = 'egalim_effectifs_db_v1';

// Normalisation des dates (ex: "22/10/2026", "22-10-2026", "2026-10-22" -> "2026-10-22")
export function normalizeDate(input: string | number | Date): string | null {
  if (!input) return null;

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    return input.toISOString().split('T')[0];
  }

  // Si c'est un serial number Excel (ex: 45220)
  if (typeof input === 'number') {
    const epoch = new Date(Math.round((input - 25569) * 86400 * 1000));
    if (!isNaN(epoch.getTime())) {
      return epoch.toISOString().split('T')[0];
    }
  }

  const str = String(input).trim();

  // YYYY-MM-DD ou YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // DD/MM/YYYY ou DD-MM-YYYY
  const frMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (frMatch) {
    const d = frMatch[1].padStart(2, '0');
    const m = frMatch[2].padStart(2, '0');
    const y = frMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Essai avec Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

// Formatage pour l'affichage français : "2026-10-22" -> "22/10/2026"
export function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

// Formatage étendu en français : "Jeudi 22 octobre 2026"
export function formatDateLongFR(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate + 'T12:00:00');
    if (isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
}

// Lecture depuis localStorage
export function getHeadcounts(): DailyHeadcount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Trier par date croissante
      return parsed.sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (e) {
    console.error('Erreur lecture effectifs:', e);
  }
  return [];
}

// Sauvegarde dans localStorage
export function saveHeadcounts(list: DailyHeadcount[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Éliminer les doublons de date (la dernière entrée prime)
    const map = new Map<string, DailyHeadcount>();
    list.forEach(item => {
      if (item.date && item.total >= 0) {
        map.set(item.date, item);
      }
    });
    const uniqueList = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueList));
  } catch (e) {
    console.error('Erreur sauvegarde effectifs:', e);
  }
}

// Recherche d'un effectif pour une date donnée
export function getHeadcountForDate(dateStr: string): DailyHeadcount | undefined {
  const normalized = normalizeDate(dateStr);
  if (!normalized) return undefined;
  const list = getHeadcounts();
  return list.find(h => h.date === normalized);
}

// Parseur de texte (CSV, TSV, copier-coller Excel)
export function parseHeadcountsFromText(rawText: string): DailyHeadcount[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const results: DailyHeadcount[] = [];

  // Détection du délimiteur le plus fréquent dans les premières lignes
  const sample = lines.slice(0, 5).join('\n');
  const counts = {
    ';': (sample.match(/;/g) || []).length,
    '\t': (sample.match(/\t/g) || []).length,
    ',': (sample.match(/,/g) || []).length,
  };
  let delim = ';';
  if (counts['\t'] > counts[';'] && counts['\t'] > counts[',']) delim = '\t';
  else if (counts[','] > counts[';']) delim = ',';

  // Recherche d'en-tête
  let headerRowIndex = -1;
  let dateCol = -1;
  let totalCol = -1;
  let matCol = -1;
  let elemCol = -1;
  let aduCol = -1;
  let notesCol = -1;

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const cells = lines[i].split(delim).map(c => c.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const dIdx = cells.findIndex(c => c.includes('date') || c.includes('jour'));
    const tIdx = cells.findIndex(c => c.includes('total') || c.includes('effectif') || c.includes('repas') || c.includes('convive') || c.includes('nbre'));
    
    if (dIdx !== -1) {
      headerRowIndex = i;
      dateCol = dIdx;
      totalCol = tIdx !== -1 ? tIdx : -1;
      matCol = cells.findIndex(c => c.includes('mat') || c.includes('maternelle'));
      elemCol = cells.findIndex(c => c.includes('elem') || c.includes('primaire'));
      aduCol = cells.findIndex(c => c.includes('adulte') || c.includes('perso') || c.includes('prof'));
      notesCol = cells.findIndex(c => c.includes('note') || c.includes('obs') || c.includes('comm'));
      break;
    }
  }

  const startLine = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const rawCells = lines[i].split(delim).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (rawCells.length === 0 || rawCells.every(c => !c)) continue;

    // Déterminer la cellule date
    let dateVal: string | null = null;
    let totalVal = 0;
    let matVal: number | undefined;
    let elemVal: number | undefined;
    let aduVal: number | undefined;
    let notesVal: string | undefined;

    if (dateCol !== -1 && rawCells[dateCol]) {
      dateVal = normalizeDate(rawCells[dateCol]);
    } else {
      // Chercher la première cellule ressemblant à une date
      for (const cell of rawCells) {
        const test = normalizeDate(cell);
        if (test) {
          dateVal = test;
          break;
        }
      }
    }

    if (!dateVal) continue;

    // Extraction des nombres
    const parseNum = (val: string | undefined): number | undefined => {
      if (!val) return undefined;
      const clean = val.replace(/\s+/g, '').replace(',', '.');
      const num = parseFloat(clean);
      return !isNaN(num) && num >= 0 ? Math.round(num) : undefined;
    };

    if (totalCol !== -1 && rawCells[totalCol]) {
      totalVal = parseNum(rawCells[totalCol]) || 0;
    }
    if (matCol !== -1) matVal = parseNum(rawCells[matCol]);
    if (elemCol !== -1) elemVal = parseNum(rawCells[elemCol]);
    if (aduCol !== -1) aduVal = parseNum(rawCells[aduCol]);
    if (notesCol !== -1) notesVal = rawCells[notesCol];

    // Si total n'a pas été trouvé dans la colonne dédiée, calcul par sous-totaux ou première valeur numérique trouvée
    if (totalVal === 0) {
      if ((matVal || 0) + (elemVal || 0) + (aduVal || 0) > 0) {
        totalVal = (matVal || 0) + (elemVal || 0) + (aduVal || 0);
      } else {
        // Prendre le premier nombre trouvé dans la ligne qui n'est pas la date
        for (const cell of rawCells) {
          if (normalizeDate(cell) === dateVal) continue;
          const n = parseNum(cell);
          if (n !== undefined && n > 0) {
            totalVal = n;
            break;
          }
        }
      }
    }

    if (dateVal && totalVal > 0) {
      results.push({
        id: `hc-${dateVal}-${crypto.randomUUID().slice(0, 8)}`,
        date: dateVal,
        total: totalVal,
        maternelle: matVal,
        elementaire: elemVal,
        adultes: aduVal,
        notes: notesVal
      });
    }
  }

  return results;
}

// Parseur de fichier Excel (nécessite xlsx importé dynamiquement)
export async function parseHeadcountsFromExcelBuffer(buffer: ArrayBuffer): Promise<DailyHeadcount[]> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convertir en tableau 2D
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
    if (!data || data.length === 0) return [];

    // Reconstituer en texte tabulé pour le parseur robuste
    const tsv = data.map(row => (Array.isArray(row) ? row.map(cell => (cell ?? '')).join('\t') : '')).join('\n');
    return parseHeadcountsFromText(tsv);
  } catch (e) {
    console.error('Erreur parsing Excel:', e);
    throw new Error("Impossible de lire ce fichier Excel. Assurez-vous qu'il contient des dates et des nombres valides.");
  }
}

// Téléchargement d'un modèle d'exemple CSV
export function downloadSampleCSV(): void {
  const content = `Date;Total Repas;Maternelle;Elementaire;Adultes;Notes
2026-11-02;145;45;85;15;Rentrée des vacances
2026-11-03;150;47;88;15;
2026-11-04;110;35;65;10;Mercredi
2026-11-05;152;48;89;15;Repas à thème
2026-11-06;148;46;87;15;Poisson frais
2026-11-09;145;45;85;15;
2026-11-10;150;47;88;15;
2026-11-12;152;48;89;15;
2026-11-13;147;45;87;15;
`;

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'modele_effectifs_cantine.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
