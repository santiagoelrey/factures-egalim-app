'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, TrendingUp, Info, HelpCircle, 
  Trash2, RefreshCw, ChevronRight, Award, CheckCircle, ShieldAlert, Loader2, FileText, X 
} from 'lucide-react';

interface HistoricalLine {
  produit: string;
  quantite: number;
  prix_unitaire: number;
  total_ht: number;
  tva: number;
  ttc: number;
  est_bio: boolean;
  label?: string;
  date_scan: string;
}

const LABELS_CONFIG = {
  BIO: { label: 'Bio / AB', color: 'bg-emerald-500 text-emerald-700 bg-emerald-50 border-emerald-100', isEgalim: true },
  AOP: { label: 'AOP / AOC', color: 'bg-purple-500 text-purple-700 bg-purple-50 border-purple-100', isEgalim: true },
  IGP: { label: 'IGP', color: 'bg-indigo-500 text-indigo-700 bg-indigo-50 border-indigo-100', isEgalim: true },
  LABEL_ROUGE: { label: 'Label Rouge', color: 'bg-rose-500 text-rose-700 bg-rose-50 border-rose-100', isEgalim: true },
  HVE: { label: 'HVE (Haute Valeur Env.)', color: 'bg-teal-500 text-teal-700 bg-teal-50 border-teal-100', isEgalim: true },
  STG: { label: 'STG', color: 'bg-cyan-500 text-cyan-700 bg-cyan-50 border-cyan-100', isEgalim: true },
  AOG: { label: 'AOG', color: 'bg-violet-500 text-violet-700 bg-violet-50 border-violet-100', isEgalim: true },
  FERMIER: { label: 'Fermier', color: 'bg-amber-500 text-amber-700 bg-amber-50 border-amber-100', isEgalim: true },
  PECHE_DURABLE: { label: 'Pêche Durable (MSC)', color: 'bg-sky-500 text-sky-700 bg-sky-50 border-sky-100', isEgalim: true },
  STANDARD: { label: 'Standard / Autre', color: 'bg-gray-400 text-gray-500 bg-gray-50 border-gray-100', isEgalim: false }
};

export default function ReportingPage() {
  const [history, setHistory] = useState<HistoricalLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'MONTH' | 'YEAR'>('ALL');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setLoading(true);
    const stored = localStorage.getItem('egalim_invoice_history_v1');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading invoice history", e);
      }
    }
    setLoading(false);
  };

  const handleClearHistory = () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser tout l'historique d'achats ? Cette action effacera les données de reporting mais ne supprimera pas vos stocks.")) {
      localStorage.removeItem('egalim_invoice_history_v1');
      setHistory([]);
    }
  };

  // Filter history based on time period
  const filteredHistory = history.filter(item => {
    if (timeFilter === 'ALL') return true;
    const scanDate = new Date(item.date_scan);
    const now = new Date();
    
    if (timeFilter === 'MONTH') {
      return scanDate.getMonth() === now.getMonth() && scanDate.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'YEAR') {
      return scanDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  
  const generateOfficialReport = async () => {
    setReportGenerating(true);
    setReportContent(null);
    try {
      const response = await fetch('/api/gemini-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: {
            totalPurchases,
            totalEgalim,
            totalBio,
            egalimPercent,
            bioPercent,
            labelBreakdown
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur inconnue");
      setReportContent(data.report);
    } catch (err: any) {
      alert("Impossible de générer le rapport: " + err.message);
    } finally {
      setReportGenerating(false);
    }
  };

  // Calculate stats
  const totalPurchases = filteredHistory.reduce((acc, item) => acc + (item.total_ht || 0), 0);

  // Egalim = any item where label !== 'STANDARD' and label exists
  const totalEgalim = filteredHistory.reduce((acc, item) => {
    const labelKey = (item.label || (item.est_bio ? 'BIO' : 'STANDARD')) as keyof typeof LABELS_CONFIG;
    const isEgalim = LABELS_CONFIG[labelKey]?.isEgalim || false;
    return isEgalim ? acc + (item.total_ht || 0) : acc;
  }, 0);

  const totalBio = filteredHistory.reduce((acc, item) => {
    const labelKey = (item.label || (item.est_bio ? 'BIO' : 'STANDARD')) as keyof typeof LABELS_CONFIG;
    return labelKey === 'BIO' ? acc + (item.total_ht || 0) : acc;
  }, 0);

  const egalimPercent = totalPurchases > 0 ? (totalEgalim / totalPurchases) * 100 : 0;
  const bioPercent = totalPurchases > 0 ? (totalBio / totalPurchases) * 100 : 0;

  // Breakdown by label
  const labelBreakdown = Object.keys(LABELS_CONFIG).reduce((acc, key) => {
    acc[key] = { cost: 0, percent: 0 };
    return acc;
  }, {} as Record<string, { cost: number; percent: number }>);

  filteredHistory.forEach(item => {
    let key = item.label || (item.est_bio ? 'BIO' : 'STANDARD');
    if (!LABELS_CONFIG[key as keyof typeof LABELS_CONFIG]) {
      key = 'STANDARD';
    }
    labelBreakdown[key].cost += (item.total_ht || 0);
  });

  Object.keys(labelBreakdown).forEach(key => {
    labelBreakdown[key].percent = totalPurchases > 0 ? (labelBreakdown[key].cost / totalPurchases) * 100 : 0;
  });

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement du reporting...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Statistiques & Indicateurs EGALIM
          </h1>
          <p className="text-gray-500">
            Analyse et calcul automatique des pourcentages d'achats de qualité et durables
          </p>
        </div>

        <div className="flex gap-2">
          {/* Time Filter Tabs */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm">
            {(['ALL', 'YEAR', 'MONTH'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f === 'ALL' ? 'Tout' : f === 'YEAR' ? 'Cette Année' : 'Ce Mois'}
              </button>
            ))}
          </div>

          <button
            onClick={generateOfficialReport}
            disabled={reportGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            title="Générer un Rapport Officiel avec Gemini"
          >
            {reportGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span className="hidden sm:inline">Rapport Officiel</span>
          </button>
          
          <button
            onClick={handleClearHistory}
            className="p-2 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Effacer tout l'historique d'analyse"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Aucune donnée comptabilisée</h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            Pour voir les statistiques EGALIM, commencez à scanner des factures (Bons de Livraison) sur la page d'accueil et cliquez sur <b>"Ajouter au Stock"</b> pour les enregistrer dans l'historique d'achats.
          </p>
        </div>
      ) : (
        <>
          {/* Targets Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EGALIM 50% target */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Objectif EGALIM Global</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-blue-600">{egalimPercent.toFixed(1)}%</span>
                    <span className="text-sm text-gray-400">sur 50% requis</span>
                  </div>
                </div>
                {egalimPercent >= 50 ? (
                  <CheckCircle className="w-8 h-8 text-green-500 stroke-[2.5]" />
                ) : (
                  <Award className="w-8 h-8 text-blue-500" />
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (egalimPercent / 50) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>0%</span>
                  <span>SEUIL REQUIS : 50%</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl text-xs text-blue-700 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Regroupe tous les produits sous label qualité ou durable (Bio, AOP, IGP, Label Rouge, HVE, etc.).
                </span>
              </div>
            </div>

            {/* BIO 20% target */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Objectif Agriculture Biologique</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600">{bioPercent.toFixed(1)}%</span>
                    <span className="text-sm text-gray-400">sur 20% requis</span>
                  </div>
                </div>
                {bioPercent >= 20 ? (
                  <CheckCircle className="w-8 h-8 text-green-500 stroke-[2.5]" />
                ) : (
                  <Award className="w-8 h-8 text-emerald-500" />
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (bioPercent / 20) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>0%</span>
                  <span>SEUIL REQUIS : 20%</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl text-xs text-emerald-700 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Regroupe uniquement les produits issus de l'Agriculture Biologique (certifiés AB / Eurofeuille).
                </span>
              </div>
            </div>
          </div>

          {/* Core Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Total Achats (HT)</span>
              <span className="text-2xl font-bold text-gray-900">{totalPurchases.toFixed(2)} €</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Total Qualité / EGALIM (HT)</span>
              <span className="text-2xl font-bold text-blue-600">{totalEgalim.toFixed(2)} €</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Total Produits BIO (HT)</span>
              <span className="text-2xl font-bold text-emerald-600">{totalBio.toFixed(2)} €</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Labels Breakdown List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                Répartition Détaillée par Label
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3 text-right">Montant HT</th>
                      <th className="px-4 py-3 text-right">Pourcentage d'achats</th>
                      <th className="px-4 py-3 text-center">Type EGALIM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(LABELS_CONFIG).map(([key, config]) => {
                      const data = labelBreakdown[key] || { cost: 0, percent: 0 };
                      if (data.cost === 0) return null; // Hide labels with no purchases to keep it clean
                      return (
                        <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 font-semibold">
                            {data.cost.toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 font-bold">
                            {data.percent.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            {config.isEgalim ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" title="Éligible EGALIM" />
                            ) : (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-200" title="Non éligible" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* General Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                Qu'est-ce que l'EGALIM ?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                La loi EGALIM impose aux cantines et à la restauration collective d'intégrer au moins <b>50% de produits durables et de qualité</b> dans leurs approvisionnements (AOP, AOC, Label Rouge, HVE, etc.), dont au moins <b>20% de produits certifiés issus de l'Agriculture Biologique (BIO)</b>.
              </p>
              
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Labels pris en compte :</h4>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(LABELS_CONFIG)
                    .filter(([k]) => k !== 'STANDARD')
                    .map(([key, config]) => (
                      <span key={key} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-semibold transition-colors">
                        {config.label.split(' ')[0]}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Historical Log list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Historique des lignes d'achats comptabilisées (Les 15 derniers articles)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date Scan</th>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3 text-right">Qté</th>
                    <th className="px-4 py-3 text-right">Prix U. HT</th>
                    <th className="px-4 py-3 text-right">Total HT</th>
                    <th className="px-4 py-3 text-center">Label Qualité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHistory
                    .slice(-15)
                    .reverse()
                    .map((item, index) => {
                      const labelKey = (item.label || (item.est_bio ? 'BIO' : 'STANDARD')) as keyof typeof LABELS_CONFIG;
                      const labelInfo = LABELS_CONFIG[labelKey] || LABELS_CONFIG.STANDARD;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                            {new Date(item.date_scan).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {item.produit.replace('[BIO] ', '')}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 font-medium">
                            {item.quantite}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {item.prix_unitaire.toFixed(4)} €
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {(item.total_ht || (item.quantite * item.prix_unitaire)).toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${labelInfo.color}`}>
                              {labelInfo.label.split(' ')[0]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Report Modal */}
      {reportContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Rapport Officiel de Cuisine (IA Gemini)
              </h2>
              <button 
                onClick={() => setReportContent(null)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 prose prose-sm max-w-none prose-indigo">
              {reportContent.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
                if (line.trim() === '') return <br key={i} />;
                // Handle bold inline
                const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                  }
                  return part;
                });
                return <p key={i} className="my-2 leading-relaxed text-gray-700">{formattedLine}</p>;
              })}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setReportContent(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
