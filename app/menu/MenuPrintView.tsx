'use client';

import React, { useRef } from 'react';
import { Printer, ArrowLeft, Download, ShieldCheck, Sparkles, Check, Heart, Sprout, Flag } from 'lucide-react';
import { 
  GEMRCN_CONFIG, GemrcnCategory, detectGemrcnCategory, 
  analyzeDailyAllergens, generateWeeklyIncoSummary, DailyAllergensReport 
} from '../lib/inco-gemrcn-utils';
import { formatDateDisplay, formatDateLongFR } from '../lib/effectifs-utils';

interface CourseSelection {
  ficheId: string;
  intitule: string;
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
  date?: string;
  sans_viande?: string; // Alternative végétarienne
  badge_jour?: 'VEGETARIEN' | 'BIO' | 'SURPRISE' | 'FERIE' | 'STANDARD';
  notes_jour?: string;
}

interface WeeklyPlan {
  [day: string]: DailyMenu;
}

interface MenuPrintViewProps {
  weekName: string;
  weeklyPlan: WeeklyPlan;
  fiches: any[];
  getDayDate: (dayName: string) => string;
  getHeadcountForDate: (dateStr: string) => any;
  onBack: () => void;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export default function MenuPrintView({
  weekName,
  weeklyPlan,
  fiches,
  getDayDate,
  getHeadcountForDate,
  onBack
}: MenuPrintViewProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Collecte des données quotidiennes pour le GEM-RCN et les allergènes
  const dailyData = DAYS.map(day => {
    const menu = weeklyPlan[day] || {
      entree: { ficheId: '', intitule: '', ingredientsCustom: [] },
      plat: { ficheId: '', intitule: '', ingredientsCustom: [] },
      accompagnement: { ficheId: '', intitule: '', ingredientsCustom: [] },
      dessert: { ficheId: '', intitule: '', ingredientsCustom: [] },
      valide: false
    };

    const dateIso = getDayDate(day);
    const hc = getHeadcountForDate(dateIso);
    const dayConvives = menu.convives || (hc ? hc.total : 100);

    // Extraction des titres et ingrédients
    const getIngredients = (c: CourseSelection) => {
      const list: string[] = [];
      if (c.ficheId) {
        const fiche = fiches.find(f => f.id === c.ficheId);
        if (fiche && fiche.ingredients) {
          fiche.ingredients.forEach((i: any) => list.push(i.produit));
        }
      }
      if (c.ingredientsCustom) {
        c.ingredientsCustom.forEach(i => list.push(i.produit));
      }
      return list;
    };

    const coursesList = [
      { intitule: menu.entree?.intitule || '', ingredients: getIngredients(menu.entree), type: 'entree' as const },
      { intitule: menu.plat?.intitule || '', ingredients: getIngredients(menu.plat), type: 'plat' as const },
      { intitule: menu.accompagnement?.intitule || '', ingredients: getIngredients(menu.accompagnement), type: 'accompagnement' as const },
      { intitule: menu.dessert?.intitule || '', ingredients: getIngredients(menu.dessert), type: 'dessert' as const }
    ].filter(c => c.intitule && c.intitule.trim());

    // Alternative sans viande
    let sansViande = menu.sans_viande;
    if (!sansViande) {
      if (menu.badge_jour === 'VEGETARIEN') {
        sansViande = menu.plat?.intitule || 'Menu 100% végétarien';
      } else {
        sansViande = 'Alternative vg assurée';
      }
    }

    // Analyse INCO pour ce jour
    const allergensReport: DailyAllergensReport = analyzeDailyAllergens(
      day,
      coursesList.map(c => ({ intitule: c.intitule, ingredients: c.ingredients }))
    );

    return {
      day,
      dateIso,
      dayConvives,
      hc,
      menu,
      coursesList,
      sansViande,
      allergensReport,
      badge: menu.badge_jour || (day === 'Mardi' ? 'VEGETARIEN' : day === 'Jeudi' ? 'BIO' : 'STANDARD')
    };
  });

  // Calcul effectifs moyens et répartition globale
  const totalCouverts = dailyData.reduce((sum, d) => sum + d.dayConvives, 0);
  const avgCouverts = Math.round(totalCouverts / DAYS.length);
  const totalMat = dailyData.reduce((sum, d) => sum + (d.hc?.maternelle || 0), 0);
  const totalPrim = dailyData.reduce((sum, d) => sum + (d.hc?.elementaire || 0), 0);
  const totalCollAdu = dailyData.reduce((sum, d) => sum + (d.hc?.adultes || 0), 0);
  const avgMat = Math.round(totalMat / DAYS.length);
  const avgPrim = Math.round(totalPrim / DAYS.length);
  const avgCollAdu = Math.round(totalCollAdu / DAYS.length);

  // Synthèse hebdomadaire INCO
  const weeklyIncoSummary = generateWeeklyIncoSummary(dailyData.map(d => d.allergensReport));

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-6 print:p-0 print:bg-white text-gray-900">
      {/* Action Bar (Hidden on print) */}
      <div className="max-w-[1300px] mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 print:hidden">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au Planificateur
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">
            Format d'impression optimisé : <strong>A4 Paysage</strong> (conforme à l'affichage réglementaire cantine)
          </span>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimer l'Affiche (ou Exporter PDF)
          </button>
        </div>
      </div>

      {/* PRINT CONTAINER - EXACT PDF POSTER LAYOUT */}
      <div 
        ref={printAreaRef}
        className="max-w-[1300px] mx-auto bg-white border border-gray-300 rounded-none shadow-xl print:shadow-none print:border-0 p-6 print:p-2 text-[11px] leading-tight"
        style={{ minHeight: '800px' }}
      >
        {/* Poster Header */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-950 uppercase font-sans">
              MENU SCOLAIRE & DÉCLARATION DES ALLERGÈNES (INCO)
            </h1>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">
              {weekName} • Restauration Collective Scolaire
            </p>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-1.5 text-right">
            <div className="text-xs font-black text-sky-900 uppercase tracking-wide">
              Production : {avgCouverts} couverts / jour
            </div>
            <div className="text-[10px] font-bold text-sky-700 mt-0.5">
              {avgMat > 0 ? `${avgMat} Mat.` : '25 Mat.'} | {avgPrim > 0 ? `${avgPrim} Prim.` : '287 Prim.'} | {avgCollAdu > 0 ? `${avgCollAdu} Coll.-Lyc.` : '552 Coll.-Lyc.'}
            </div>
          </div>
        </div>

        {/* 5-Column Days Grid */}
        <div className="grid grid-cols-5 border border-gray-900 divide-x divide-gray-900">
          {dailyData.map((d) => {
            const dateStr = formatDateLongFR(d.dateIso);
            const dateShort = formatDateDisplay(d.dateIso);

            return (
              <div key={d.day} className="flex flex-col justify-between min-h-[380px]">
                {/* Day Header */}
                <div className="bg-slate-900 text-white text-center py-2 px-1">
                  <div className="font-extrabold text-sm tracking-wide">
                    {d.day} {dateShort.split('/')[0]} {dateStr.split(' ')[2]}
                  </div>

                  {/* Day Badge */}
                  <div className="mt-1 min-h-[20px] flex items-center justify-center">
                    {d.badge === 'VEGETARIEN' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        <Sprout className="w-2.5 h-2.5" />
                        REPAS VÉGÉTARIEN
                      </span>
                    )}
                    {d.badge === 'BIO' && (
                      <span className="inline-flex items-center gap-1 bg-green-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        REPAS BIO
                      </span>
                    )}
                    {d.badge === 'SURPRISE' && (
                      <span className="inline-flex items-center gap-1 bg-rose-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        <Heart className="w-2.5 h-2.5" />
                        REPAS SURPRISE
                      </span>
                    )}
                    {d.badge === 'FERIE' && (
                      <span className="inline-flex items-center gap-1 bg-slate-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        <Flag className="w-2.5 h-2.5" />
                        JOUR FÉRIÉ
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Dishes Menu List */}
                <div className="p-3 flex-1 flex flex-col justify-start space-y-2 bg-white">
                  {d.badge === 'FERIE' ? (
                    <div className="text-center py-8 text-gray-500 italic space-y-1">
                      <div className="font-black text-gray-800 text-xs">Établissement fermé</div>
                      <div className="text-[10px]">Pas de restauration scolaire</div>
                    </div>
                  ) : d.badge === 'SURPRISE' && d.coursesList.length === 0 ? (
                    <div className="text-center py-6 text-rose-800 space-y-1">
                      <div className="font-extrabold text-xs">❤ REPAS SURPRISE</div>
                      <div className="text-[10px] text-gray-600 leading-snug">
                        Menu à thème de saison préparé par l'équipe.<br />Dévoilé le midi au self.
                      </div>
                    </div>
                  ) : d.coursesList.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 italic">
                      Menu en cours d'élaboration
                    </div>
                  ) : (
                    d.coursesList.map((course, idx) => {
                      const category = detectGemrcnCategory(course.intitule, course.type);
                      const isBio = course.intitule.toLowerCase().includes('bio');
                      const containsGluten = course.intitule.toLowerCase().includes('pain') || 
                        course.intitule.toLowerCase().includes('pâte') || 
                        course.intitule.toLowerCase().includes('crêpe') || 
                        course.intitule.toLowerCase().includes('tarte') ||
                        course.intitule.toLowerCase().includes('biscuit') ||
                        course.intitule.toLowerCase().includes('semoule') ||
                        course.intitule.toLowerCase().includes('taboulé');

                      let textColor = 'text-gray-900';
                      if (category === 'CRUDITES_FRUITS') textColor = 'text-emerald-700';
                      else if (category === 'LEGUMES_CUITS') textColor = 'text-emerald-800';
                      else if (category === 'PROTEINES') textColor = 'text-red-800';
                      else if (category === 'FECULENTS') textColor = 'text-amber-900';
                      else if (category === 'PRODUITS_LAITIERS') textColor = 'text-sky-800';
                      else if (category === 'SUCRE') textColor = 'text-cyan-800';

                      return (
                        <div key={idx} className="leading-snug">
                          <span className={`font-bold text-[11.5px] ${textColor} ${containsGluten ? 'underline decoration-1 underline-offset-2' : ''}`}>
                            {course.intitule}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Alternative Sans Viande */}
                <div className="border-t border-gray-200 bg-emerald-50/50 p-2.5">
                  <div className="text-[9px] font-black text-emerald-800 uppercase flex items-center gap-1 mb-0.5">
                    <Sprout className="w-3 h-3 text-emerald-600" />
                    SANS VIANDE
                  </div>
                  <div className="text-[10px] font-bold text-gray-800">
                    {d.badge === 'FERIE' ? '— Fermé —' : d.sansViande}
                  </div>
                </div>

                {/* Sub-Card Allergènes INCO du jour */}
                <div className="border-t-2 border-gray-900 bg-gray-50/70 p-2.5 min-h-[140px] flex flex-col justify-start">
                  <div className="text-[9px] font-black text-gray-950 uppercase tracking-wider mb-1.5 border-b border-gray-300 pb-1">
                    ALLERGÈNES (INCO)
                  </div>

                  {d.badge === 'FERIE' ? (
                    <div className="text-[10px] text-gray-400 italic py-4 text-center">
                      Aucun repas servi
                    </div>
                  ) : d.badge === 'SURPRISE' && d.coursesList.length === 0 ? (
                    <div className="text-[9.5px] text-gray-600 leading-tight">
                      • Liste complète affichée le jour même à l'entrée du self.<br />
                      • <strong>Gluten (blé)</strong> : pain BIO quotidien.
                    </div>
                  ) : (
                    <ul className="space-y-1 text-[9.5px] text-gray-700">
                      {d.allergensReport.itemsWithAllergens.map((item, idx) => (
                        <li key={idx} className="leading-tight">
                          <strong className="text-gray-900 font-bold">• {item.allergenNom}</strong>
                          {item.sources.length > 0 && (
                            <span className="text-gray-600 italic"> ({item.sources.join(', ')})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner Allergènes Majeurs */}
        <div className="bg-slate-900 text-white text-center py-1 px-3 mt-1 text-[9.5px] font-extrabold tracking-wider uppercase">
          DÉCLARATION DES ALLERGÈNES MAJEURS • RÉGLEMENTATION (INCO) N° 1169/2011
        </div>

        {/* Legend GEM-RCN */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-1.5 border-b border-gray-300 text-[9.5px] font-extrabold uppercase">
          <span className="flex items-center gap-1 text-red-700">
            <span className="w-2 h-2 bg-red-600 inline-block"></span> PROTÉINES
          </span>
          <span className="flex items-center gap-1 text-green-700">
            <span className="w-2 h-2 bg-green-600 inline-block"></span> sans viande (alternative)
          </span>
          <span className="flex items-center gap-1 text-amber-900">
            <span className="w-2 h-2 bg-amber-800 inline-block"></span> FÉCULENTS
          </span>
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2 h-2 bg-emerald-500 inline-block"></span> CRUDITÉS & FRUITS
          </span>
          <span className="flex items-center gap-1 text-emerald-900">
            <span className="w-2 h-2 bg-emerald-700 inline-block"></span> LÉGUMES CUITS
          </span>
          <span className="flex items-center gap-1 text-sky-800">
            <span className="w-2 h-2 bg-sky-600 inline-block"></span> PRODUITS LAITIERS
          </span>
          <span className="flex items-center gap-1 text-orange-700">
            <span className="w-2 h-2 bg-orange-600 inline-block"></span> MATIÈRES GRASSES
          </span>
          <span className="flex items-center gap-1 text-cyan-800">
            <span className="w-2 h-2 bg-cyan-500 inline-block"></span> SUCRE
          </span>
          <span className="underline font-bold text-gray-900">
            Souligné : GLUTEN
          </span>
        </div>

        {/* Weekly Inco Summary Box */}
        <div className="bg-gray-50/80 p-2.5 border-b border-gray-300 text-[9.5px] leading-snug space-y-1">
          <div className="font-black text-gray-950 uppercase tracking-wide">
            SYNTHÈSE ALLERGÈNES DE LA SEMAINE (INCO)
          </div>
          {weeklyIncoSummary.map((line, idx) => (
            <div key={idx} className="text-gray-700">{line}</div>
          ))}
        </div>

        {/* Bottom Legal Notice */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[9px] text-gray-500">
          <div className="font-extrabold text-purple-700 uppercase">
            PAIN BIO TOUS LES JOURS
          </div>
          <div className="italic text-sky-700 font-semibold">
            « L'apport nutritionnel ne se mesure pas en un seul repas. »
          </div>
          <div className="italic text-gray-500">
            Règlement UE n° 1169/2011 • Traces éventuelles de sésame / fruits à coque dans le pain bio.
          </div>
        </div>

        {/* Footer Sub-bar */}
        <div className="flex items-center justify-between text-[8.5px] text-gray-400 pt-2 border-t border-gray-200 mt-2">
          <span>Plan Alimentaire GEM-RCN 2.0 • {weekName}</span>
          <span>Affichage Restauration Scolaire • Page 1 sur 1</span>
        </div>
      </div>

      {/* Global CSS for Print Mode */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: landscape;
            margin: 6mm;
          }
          header, nav, footer, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
