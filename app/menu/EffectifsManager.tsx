'use client';

import { useState, useRef } from 'react';
import { 
  Users, Upload, Download, FileSpreadsheet, Trash2, Plus, 
  CheckCircle2, AlertCircle, Calendar, Sparkles, Search, Edit2
} from 'lucide-react';
import { 
  DailyHeadcount, getHeadcounts, saveHeadcounts, 
  parseHeadcountsFromText, parseHeadcountsFromExcelBuffer, 
  downloadSampleCSV, formatDateDisplay, formatDateLongFR, normalizeDate 
} from '../lib/effectifs-utils';

interface EffectifsManagerProps {
  onHeadcountsUpdated?: () => void;
}

export default function EffectifsManager({ onHeadcountsUpdated }: EffectifsManagerProps) {
  const [headcounts, setHeadcounts] = useState<DailyHeadcount[]>(() => getHeadcounts());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Single entry form state
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualTotal, setManualTotal] = useState<number | ''>('');
  const [manualMat, setManualMat] = useState<number | ''>('');
  const [manualElem, setManualElem] = useState<number | ''>('');
  const [manualAdu, setManualAdu] = useState<number | ''>('');
  const [manualNotes, setManualNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    const list = getHeadcounts();
    setHeadcounts(list);
    if (onHeadcountsUpdated) onHeadcountsUpdated();
  };

  // Traitement fichier Excel ou CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const fileName = file.name.toLowerCase();
      let imported: DailyHeadcount[] = [];

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        imported = await parseHeadcountsFromExcelBuffer(buffer);
      } else {
        const text = await file.text();
        imported = parseHeadcountsFromText(text);
      }

      if (imported.length === 0) {
        setUploadMessage({
          type: 'error',
          text: "Aucun effectif valide n'a été détecté dans le fichier. Vérifiez qu'il contient au moins une colonne de date et une colonne avec les effectifs."
        });
      } else {
        // Fusionner avec les effectifs existants
        const existing = getHeadcounts();
        const mergedMap = new Map<string, DailyHeadcount>();
        existing.forEach(h => mergedMap.set(h.date, h));
        imported.forEach(h => mergedMap.set(h.date, h));
        const mergedList = Array.from(mergedMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        saveHeadcounts(mergedList);
        refreshData();
        setUploadMessage({
          type: 'success',
          text: `Succès : ${imported.length} journée(s) d'effectifs importée(s) ou mise(s) à jour !`
        });
      }
    } catch (err: any) {
      console.error(err);
      setUploadMessage({
        type: 'error',
        text: err?.message || "Erreur lors de la lecture du fichier."
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Traitement texte collé
  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;

    try {
      const imported = parseHeadcountsFromText(pastedText);
      if (imported.length === 0) {
        setUploadMessage({
          type: 'error',
          text: "Impossible de reconnaître des dates et des effectifs dans le texte collé."
        });
        return;
      }

      const existing = getHeadcounts();
      const mergedMap = new Map<string, DailyHeadcount>();
      existing.forEach(h => mergedMap.set(h.date, h));
      imported.forEach(h => mergedMap.set(h.date, h));
      const mergedList = Array.from(mergedMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      saveHeadcounts(mergedList);
      refreshData();
      setPastedText('');
      setShowPasteArea(false);
      setUploadMessage({
        type: 'success',
        text: `Succès : ${imported.length} journée(s) d'effectifs ajoutée(s) !`
      });
    } catch (e: any) {
      setUploadMessage({
        type: 'error',
        text: "Erreur lors de l'analyse du texte collé."
      });
    }
  };

  // Ajout manuel d'une date unique
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDate = normalizeDate(manualDate);
    if (!cleanDate) {
      alert("Veuillez sélectionner une date valide.");
      return;
    }

    let total = typeof manualTotal === 'number' ? manualTotal : 0;
    const mat = typeof manualMat === 'number' ? manualMat : undefined;
    const elem = typeof manualElem === 'number' ? manualElem : undefined;
    const adu = typeof manualAdu === 'number' ? manualAdu : undefined;

    if (total === 0 && ((mat || 0) + (elem || 0) + (adu || 0) > 0)) {
      total = (mat || 0) + (elem || 0) + (adu || 0);
    }

    if (total <= 0) {
      alert("Veuillez renseigner un effectif total ou des effectifs par catégorie supérieurs à 0.");
      return;
    }

    const newItem: DailyHeadcount = {
      id: `hc-${cleanDate}-${crypto.randomUUID().slice(0, 6)}`,
      date: cleanDate,
      total,
      maternelle: mat,
      elementaire: elem,
      adultes: adu,
      notes: manualNotes.trim() || undefined
    };

    const existing = getHeadcounts();
    const updated = existing.filter(h => h.date !== cleanDate);
    updated.push(newItem);
    updated.sort((a, b) => a.date.localeCompare(b.date));

    saveHeadcounts(updated);
    refreshData();

    setManualTotal('');
    setManualMat('');
    setManualElem('');
    setManualAdu('');
    setManualNotes('');
    setUploadMessage({
      type: 'success',
      text: `Effectif pour le ${formatDateDisplay(cleanDate)} enregistré (${total} repas) !`
    });
  };

  // Supprimer une date
  const handleDeleteDate = (date: string) => {
    if (confirm(`Supprimer l'effectif du ${formatDateDisplay(date)} ?`)) {
      const filtered = headcounts.filter(h => h.date !== date);
      saveHeadcounts(filtered);
      refreshData();
    }
  };

  // Vider toute la base
  const handleClearAll = () => {
    if (headcounts.length === 0) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer tous les effectifs enregistrés ? Cette action est irréversible.")) {
      saveHeadcounts([]);
      refreshData();
      setUploadMessage({
        type: 'success',
        text: "La base d'effectifs a été réinitialisée."
      });
    }
  };

  // Filtrage
  const filteredHeadcounts = headcounts.filter(h => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const frDate = formatDateDisplay(h.date);
    const longFr = formatDateLongFR(h.date).toLowerCase();
    const notes = (h.notes || '').toLowerCase();
    return h.date.includes(term) || frDate.includes(term) || longFr.includes(term) || notes.includes(term);
  });

  // Calcul des statistiques globales
  const totalRepas = headcounts.reduce((sum, h) => sum + h.total, 0);
  const moyenneParJour = headcounts.length > 0 ? Math.round(totalRepas / headcounts.length) : 0;
  const maxRepas = headcounts.length > 0 ? Math.max(...headcounts.map(h => h.total)) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/20 backdrop-blur-md rounded-xl inline-block">
                <Users className="w-6 h-6 text-white" />
              </span>
              <h2 className="text-2xl font-black tracking-tight">Base de Données d'Effectifs Datés</h2>
            </div>
            <p className="text-orange-100 text-sm max-w-2xl">
              Importez vos prévisions d'effectifs de cantine (Excel ou CSV) pour chaque jour de l'année. 
              Le planificateur de menu s'adaptera automatiquement à ces chiffres pour calculer les repas produits, 
              les ingrédients au gramme près et les coûts de revient.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadSampleCSV}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Modèle CSV d'exemple
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-orange-600 hover:bg-orange-50 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Téléverser un Fichier (Excel / CSV)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv, .xlsx, .xls, .tsv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
            />
          </div>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-[11px] font-bold text-orange-100 uppercase">Jours Enregistrés</div>
            <div className="text-2xl font-black mt-0.5">{headcounts.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-[11px] font-bold text-orange-100 uppercase">Total Repas Prévus</div>
            <div className="text-2xl font-black mt-0.5">{totalRepas.toLocaleString('fr-FR')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-[11px] font-bold text-orange-100 uppercase">Moyenne / Jour</div>
            <div className="text-2xl font-black mt-0.5">{moyenneParJour}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-[11px] font-bold text-orange-100 uppercase">Pic d'Affluence</div>
            <div className="text-2xl font-black mt-0.5">{maxRepas}</div>
          </div>
        </div>
      </div>

      {/* Upload Feedback Message */}
      {uploadMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold border ${
          uploadMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {uploadMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{uploadMessage.text}</span>
          </div>
          <button 
            onClick={() => setUploadMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Section Copier-Coller & Ajout Rapide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Import & Copier-Coller */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-800 text-sm">Import par Téléchargement / Copier-Coller</h3>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 leading-relaxed">
            Vous pouvez glisser-déposer un fichier Excel (avec colonnes Date et Effectif), ou copier-coller 
            directement les lignes depuis votre tableur ou logiciel de gestion.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Lecture en cours..." : "Téléverser fichier .xlsx ou .csv"}
            </button>

            <button
              onClick={() => setShowPasteArea(!showPasteArea)}
              className="w-full py-2 px-3 text-gray-600 hover:text-gray-900 font-semibold text-xs rounded-lg hover:bg-gray-100 transition-all text-center"
            >
              {showPasteArea ? "Masquer la zone de copier-coller" : "📋 Ou copier-coller directement un tableau"}
            </button>

            {showPasteArea && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Date\tTotal\tMaternelle\tElémentaire\n2026-11-02\t145\t45\t85\n2026-11-03\t150\t47\t88`}
                  rows={4}
                  className="w-full p-2.5 text-xs font-mono border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handlePasteSubmit}
                  className="w-full py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all"
                >
                  Importer le texte collé
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Saisie Manuelle d'une Date */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-800 text-sm">Ajouter ou Modifier une Journée</h3>
          </div>

          <form onSubmit={handleManualAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs font-semibold border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Total Convives</label>
                <input
                  type="number"
                  min="1"
                  placeholder="ex: 150"
                  value={manualTotal}
                  onChange={(e) => setManualTotal(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-1.5 text-xs font-extrabold text-orange-600 border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Maternelle</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Optionnel"
                  value={manualMat}
                  onChange={(e) => setManualMat(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-1.5 text-xs border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Élémentaire</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Optionnel"
                  value={manualElem}
                  onChange={(e) => setManualElem(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-1.5 text-xs border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Adultes / Personnel</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Optionnel"
                  value={manualAdu}
                  onChange={(e) => setManualAdu(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-1.5 text-xs border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Notes / Événement</label>
                <input
                  type="text"
                  placeholder="ex: Sortie scolaire, Repas fête..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Enregistrer la date
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900 text-base">
              Calendrier des Effectifs Prévus ({filteredHeadcounts.length} date{filteredHeadcounts.length > 1 ? 's' : ''})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une date ou note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-250 rounded-xl focus:outline-none focus:border-orange-500 w-56"
              />
            </div>
            {headcounts.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"
                title="Supprimer toutes les dates"
              >
                Vider la base
              </button>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Jour</th>
                <th className="py-3 px-4 text-center">Effectif Total (Repas)</th>
                <th className="py-3 px-4 text-center text-gray-400">Maternelle</th>
                <th className="py-3 px-4 text-center text-gray-400">Élémentaire</th>
                <th className="py-3 px-4 text-center text-gray-400">Adultes</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHeadcounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    Aucun effectif enregistré pour le moment.
                    <p className="text-[11px] text-gray-400 mt-1">
                      Téléversez un fichier Excel/CSV ou saisissez une date ci-dessus.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHeadcounts.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {formatDateDisplay(item.date)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 capitalize">
                        {formatDateLongFR(item.date).split(' ')[0]}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-800">
                          {item.total} repas
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 font-medium">
                        {item.maternelle !== undefined ? item.maternelle : '—'}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 font-medium">
                        {item.elementaire !== undefined ? item.elementaire : '—'}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 font-medium">
                        {item.adultes !== undefined ? item.adultes : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate">
                        {item.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteDate(item.date)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
