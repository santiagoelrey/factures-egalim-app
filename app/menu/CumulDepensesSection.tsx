'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, TrendingUp, DollarSign, Users, CheckCircle2, 
  Package, Printer, Search, RefreshCw, ChevronDown, ChevronUp, 
  Layers, ArrowRight, ShieldCheck, Clock, Trash2, BookOpen
} from 'lucide-react';
import { 
  ArchivedMenuDay, PeriodExpenseSummary, getArchivedMenus, 
  groupExpensesByWeek, groupExpensesByMonth, groupExpensesBySchoolYear, 
  deleteArchivedMenu 
} from '../lib/menu-archive-utils';
import { formatDateDisplay, formatDateLongFR } from '../lib/effectifs-utils';

interface CumulDepensesSectionProps {
  onLoadArchivedMenu?: (menu: ArchivedMenuDay) => void;
}

export default function CumulDepensesSection({ onLoadArchivedMenu }: CumulDepensesSectionProps) {
  const [menus, setMenus] = useState<ArchivedMenuDay[]>([]);
  const [viewMode, setViewMode] = useState<'SEMAINE' | 'MOIS' | 'ANNEE' | 'HISTORIQUE'>('SEMAINE');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  const refreshData = () => {
    setMenus(getArchivedMenus());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const weeklySummaries = groupExpensesByWeek(menus);
  const monthlySummaries = groupExpensesByMonth(menus);
  const yearlySummaries = groupExpensesBySchoolYear(menus);

  // Totaux globaux
  const grandTotalRepas = menus.reduce((sum, m) => sum + m.convives, 0);
  const grandTotalDepenseHT = menus.reduce((sum, m) => sum + m.coutTotalJour, 0);
  const grandCoutMoyen = grandTotalRepas > 0 ? grandTotalDepenseHT / grandTotalRepas : 0;
  const nbMenusValides = menus.filter(m => m.menu_valide).length;
  const nbStockDeduit = menus.filter(m => m.stock_deduit).length;

  const filteredHistory = menus.filter(m => {
    const q = searchTerm.toLowerCase();
    return (
      (m.date && m.date.includes(q)) ||
      (m.jourSemaine && m.jourSemaine.toLowerCase().includes(q)) ||
      (m.plat?.intitule && m.plat.intitule.toLowerCase().includes(q)) ||
      (m.weekNom && m.weekNom.toLowerCase().includes(q))
    );
  });

  const handleDelete = (id: string, dateStr: string) => {
    if (confirm(`Supprimer définitivement l'archive du menu du ${formatDateDisplay(dateStr)} ?`)) {
      deleteArchivedMenu(id);
      refreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
              <DollarSign className="w-6 h-6" />
            </span>
            <h2 className="text-2xl font-black tracking-tight">Cumul des Dépenses & Historique des Menus</h2>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Suivi budgétaire consolidé des repas produits, calcul automatisé des coûts par repas et conservation permanente de tous les menus créés.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
            title="Imprimer ce rapport financier"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            Imprimer la Synthèse
          </button>
          <button
            type="button"
            onClick={refreshData}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Global Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Production Totale</span>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{grandTotalRepas.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-500">repas</span></div>
          <span className="text-[11px] text-gray-500 block">Sur {menus.length} journées de menu créées</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Budget Total Engagé</span>
          <div className="text-2xl sm:text-3xl font-black text-orange-600">{grandTotalDepenseHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € <span className="text-xs font-normal text-gray-500">HT</span></div>
          <span className="text-[11px] text-gray-500 block">Coût total des denrées alimentaires</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Coût Moyen par Repas</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{grandCoutMoyen.toFixed(2)} € <span className="text-xs font-normal text-gray-500">/ convive</span></div>
          <span className="text-[11px] text-gray-500 block">Moyenne pondérée tous services</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Statut des Menus</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-extrabold" title="Menus validés">
              ✓ {nbMenusValides} validés
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold" title="Stocks déduits">
              📦 {nbStockDeduit} servis
            </span>
          </div>
          <span className="text-[11px] text-gray-500 block pt-1">Suivi des étapes cuisine</span>
        </div>
      </div>

      {/* View Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="bg-gray-100 p-1 rounded-xl flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setViewMode('SEMAINE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'SEMAINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🗓️ Cumul par Semaine ({weeklySummaries.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('MOIS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'MOIS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Cumul par Mois ({monthlySummaries.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ANNEE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'ANNEE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏫 Cumul par Année Scolaire ({yearlySummaries.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('HISTORIQUE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'HISTORIQUE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Historique Détaillé ({menus.length})
          </button>
        </div>

        {viewMode === 'HISTORIQUE' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un plat, une date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>
        )}
      </div>

      {/* VUE 1 : CUMUL PAR SEMAINE */}
      {viewMode === 'SEMAINE' && (
        <div className="space-y-4">
          {weeklySummaries.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-gray-300" />
              <p className="font-semibold text-gray-600">Aucun menu hebdomadaire enregistré pour le moment.</p>
              <p className="text-xs">Créez et validez des menus dans le Planificateur pour voir apparaître le cumul automatique des semaines.</p>
            </div>
          ) : (
            weeklySummaries.map(week => {
              const isExpanded = expandedPeriod === week.periodKey;
              return (
                <div key={week.periodKey} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all">
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-base">{week.label}</span>
                        {week.startDate && week.endDate && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-semibold">
                            Du {formatDateDisplay(week.startDate)} au {formatDateDisplay(week.endDate)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{week.jours.length} jour(s) planifié(s)</span>
                        <span>•</span>
                        <span className="text-green-700 font-bold">{week.nbMenusValides} validé(s)</span>
                        <span>•</span>
                        <span className="text-blue-700 font-bold">{week.nbMenusStockDeduit} stock déduit</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Semaine</div>
                        <div className="text-xl font-black text-gray-900">{week.totalDepenseHT.toFixed(2)} € <span className="text-xs font-normal text-gray-500">HT</span></div>
                        <div className="text-xs text-orange-600 font-bold">
                          {week.coutMoyenRepas.toFixed(2)} € / repas ({week.totalRepas} repas)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedPeriod(isExpanded ? null : week.periodKey)}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all cursor-pointer"
                        title={isExpanded ? "Replier le détail" : "Voir le détail des jours"}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Détail accordéon des jours de la semaine */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/60 p-4 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {week.jours.map(jour => (
                          <div key={jour.id} className="bg-white p-3 rounded-xl border border-gray-200/70 space-y-2 text-xs flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center font-bold text-gray-800 pb-1 border-b border-gray-100">
                                <span>{jour.jourSemaine}</span>
                                <span className="text-[10px] text-gray-400">{formatDateDisplay(jour.date)}</span>
                              </div>
                              <div className="space-y-0.5 pt-1.5 text-gray-600 text-[11px]">
                                <div className="truncate font-semibold text-gray-900" title={jour.plat?.intitule}>
                                  🍗 {jour.plat?.intitule || 'Plat non renseigné'}
                                </div>
                                {jour.sans_viande && (
                                  <div className="truncate text-emerald-700 text-[10px]" title={jour.sans_viande}>
                                    🌱 {jour.sans_viande}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex justify-between items-end">
                              <div>
                                <span className="text-[10px] text-gray-400 block">{jour.convives} repas</span>
                                <span className="font-extrabold text-orange-600">{jour.coutParRepasJour.toFixed(2)} €/u</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-gray-900 block">{jour.coutTotalJour.toFixed(2)} €</span>
                                {jour.stock_deduit ? (
                                  <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-extrabold">Stock sorti</span>
                                ) : jour.menu_valide ? (
                                  <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded font-extrabold">Validé</span>
                                ) : (
                                  <span className="text-[8px] bg-gray-100 text-gray-500 px-1 rounded">Brouillon</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VUE 2 : CUMUL PAR MOIS */}
      {viewMode === 'MOIS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {monthlySummaries.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
              Aucun cumul mensuel disponible.
            </div>
          ) : (
            monthlySummaries.map(month => (
              <div key={month.periodKey} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{month.label}</h3>
                      <span className="text-xs text-gray-400 font-medium">{month.jours.length} journées enregistrées</span>
                    </div>
                    <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-black rounded-lg">
                      {month.totalRepas} repas
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-100">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Dépense denrées HT :</span>
                      <span className="font-black text-gray-900">{month.totalDepenseHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Coût moyen / convive :</span>
                      <span className="font-black text-emerald-600">{month.coutMoyenRepas.toFixed(2)} € / repas</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-200/50">
                      <span className="text-gray-500">Menus validés :</span>
                      <span className="font-bold text-gray-700">{month.nbMenusValides} / {month.jours.length}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                  Moyenne quotidienne : ~{(month.totalRepas / Math.max(1, month.jours.length)).toFixed(0)} repas/jour
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VUE 3 : CUMUL PAR ANNEE SCOLAIRE */}
      {viewMode === 'ANNEE' && (
        <div className="space-y-4">
          {yearlySummaries.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
              Aucun bilan annuel disponible.
            </div>
          ) : (
            yearlySummaries.map(year => (
              <div key={year.periodKey} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-gray-900 text-xl">{year.label}</h3>
                    <p className="text-xs text-gray-500">Synthèse consolidée des approvisionnements et de la restauration</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black">
                      {year.totalRepas.toLocaleString('fr-FR')} repas produits
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-orange-50/60 border border-orange-100 p-4 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-orange-600 uppercase">Budget Annuel Total</span>
                    <div className="text-2xl font-black text-orange-700">
                      {year.totalDepenseHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € <span className="text-xs font-normal">HT</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase">Coût Moyen Annuel</span>
                    <div className="text-2xl font-black text-emerald-700">
                      {year.coutMoyenRepas.toFixed(2)} € <span className="text-xs font-normal">/ repas</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-blue-600 uppercase">Nombre de Services</span>
                    <div className="text-2xl font-black text-blue-700">
                      {year.jours.length} <span className="text-xs font-normal">jours assurés</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VUE 4 : HISTORIQUE DETAILLE DES MENUS */}
      {viewMode === 'HISTORIQUE' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-semibold text-gray-600">Aucun menu ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Date & Jour</th>
                    <th className="px-4 py-3">Composition du Menu</th>
                    <th className="px-4 py-3 text-center">Effectif</th>
                    <th className="px-4 py-3 text-right">Coût Total</th>
                    <th className="px-4 py-3 text-right">Coût / Repas</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-4 py-3 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHistory.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        <div className="font-bold text-gray-900">{item.jourSemaine}</div>
                        <div className="text-[11px] text-gray-400">{formatDateDisplay(item.date)}</div>
                        {item.weekNom && <div className="text-[9px] text-gray-400 italic truncate max-w-[120px]">{item.weekNom}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 max-w-md">
                          <div className="truncate"><span className="text-gray-400">Entrée :</span> <span className="font-medium text-gray-800">{item.entree?.intitule || '—'}</span></div>
                          <div className="truncate"><span className="text-gray-400">Plat :</span> <span className="font-bold text-gray-900">{item.plat?.intitule || '—'}</span></div>
                          <div className="truncate"><span className="text-gray-400">Accomp. :</span> <span className="font-medium text-gray-800">{item.accompagnement?.intitule || '—'}</span></div>
                          <div className="truncate"><span className="text-gray-400">Dessert :</span> <span className="font-medium text-gray-800">{item.dessert?.intitule || '—'}</span></div>
                          {item.sans_viande && (
                            <div className="text-emerald-700 font-semibold truncate pt-0.5 text-[10px]">
                              🌱 Sans viande : {item.sans_viande}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="font-bold text-gray-900">{item.convives}</span>
                        {item.maternelle !== undefined && item.elementaire !== undefined && (
                          <div className="text-[9px] text-gray-400">
                            {item.maternelle}M / {item.elementaire}P / {item.adultes || 0}A
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-black text-gray-900">
                        {item.coutTotalJour.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-black text-orange-600">
                        {item.coutParRepasJour.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="space-y-1">
                          {item.menu_valide ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-extrabold">
                              ✓ Menu Validé
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
                              Brouillon
                            </span>
                          )}
                          <div>
                            {item.stock_deduit ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-bold">
                                📦 Stock Sorti
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold">
                                Stock réservé
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.date)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer cette archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
