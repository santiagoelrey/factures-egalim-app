'use client';

import { useState, useEffect } from 'react';
import { Upload, FileUp, Check, Loader2, Save, Package, Download, Plus, Trash2 } from 'lucide-react';
import { DayData, InvoiceLine } from './lib/types';
import { addLinesToStock } from './lib/stock-utils';
import { exportToCSV } from './lib/csv-utils';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<DayData[] | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [etablissement, setEtablissement] = useState('');

  // Persistence for current invoice data & settings load
  useEffect(() => {
    // Load from local storage on mount
    const savedData = localStorage.getItem('current_invoice_session');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && Array.isArray(parsed)) setData(parsed);
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }

    // Load settings from local storage
    const savedSettings = localStorage.getItem('egalim_settings_v1');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.etablissement) setEtablissement(parsed.etablissement);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save to local storage whenever data changes
    if (data) {
      localStorage.setItem('current_invoice_session', JSON.stringify(data));
    }
  }, [data]);

  const addToStock = () => {
    if (!data) return;

    const allLines = data.flatMap(day => day.ligne_facture);
    const addedCount = addLinesToStock(allLines);

    // Save to invoice history for EGALIM percentage calculations
    const historyStr = localStorage.getItem('egalim_invoice_history_v1');
    const history = historyStr ? JSON.parse(historyStr) : [];
    
    const datedLines = allLines.map(line => ({
      ...line,
      date_scan: new Date().toISOString(),
      label: line.label || (line.est_bio ? 'BIO' : 'STANDARD')
    }));

    localStorage.setItem('egalim_invoice_history_v1', JSON.stringify([...history, ...datedLines]));

    alert(`${addedCount} lignes ajoutées au stock avec succès !`);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const cleanName = etablissement.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'cuisine';
    exportToCSV(data, `facture_egalim_${cleanName}_${new Date().toISOString().split('T')[0]}.csv`);
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setData(null); // Reset previous data
        setSyncStatus(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setSyncStatus(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'analyse');

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error(error);
      alert('Erreur lors de l\'analyse de l\'image.');
    } finally {
      setAnalyzing(false);
    }
  };

  const syncToSheets = async () => {
    if (!data) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erreur de synchro');

      setSyncStatus({ success: true, message: 'Données envoyées avec succès vers Google Sheets !' });
    } catch (error: any) {
      setSyncStatus({ success: false, message: `Erreur: ${error.message}` });
    } finally {
      setSyncing(false);
    }
  };

  // Helper to update local state when user edits a cell
  const updateLine = (dayIndex: number, lineIndex: number, field: keyof InvoiceLine, value: any) => {
    if (!data) return;
    const newData = [...data];
    // @ts-ignore
    newData[dayIndex].ligne_facture[lineIndex][field] = value;

    // Recalculate totals if needed
    if (field === 'quantite' || field === 'prix_unitaire') {
      const q = Number(newData[dayIndex].ligne_facture[lineIndex].quantite);
      const p = Number(newData[dayIndex].ligne_facture[lineIndex].prix_unitaire);
      newData[dayIndex].ligne_facture[lineIndex].total_ht = Number((q * p).toFixed(4));
      // Recalcul TVA/TTC (assuming 5.5% default or existing rate)
      // Simple re-estimation for UI feedback:
      const tvaRate = 0.055;
      newData[dayIndex].ligne_facture[lineIndex].tva = Number((newData[dayIndex].ligne_facture[lineIndex].total_ht * tvaRate).toFixed(4));
      newData[dayIndex].ligne_facture[lineIndex].ttc = Number((newData[dayIndex].ligne_facture[lineIndex].total_ht * (1 + tvaRate)).toFixed(4));
    }

    setData(newData);
  };

  const addLine = (dayIndex: number) => {
    if (!data) return;
    const newData = [...data];
    newData[dayIndex].ligne_facture.push({
      produit: 'Nouveau Produit',
      quantite: 1,
      prix_unitaire: 0,
      total_ht: 0,
      tva: 0,
      ttc: 0,
      est_bio: false,
      label: 'STANDARD'
    });
    setData(newData);
  };

  const deleteLine = (dayIndex: number, lineIndex: number) => {
    if (!data) return;
    const newData = [...data];
    newData[dayIndex].ligne_facture.splice(lineIndex, 1);
    setData(newData);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">


        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analyse de Facture</h1>
          <p className="text-gray-500 font-medium text-blue-600">
            {etablissement ? `Cuisine : ${etablissement}` : 'Scanner vos factures pour analyse et mise en stock'}
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="flex flex-col items-center gap-4">
            <label htmlFor="image-upload" className="cursor-pointer group">
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-4 group-hover:border-blue-500 transition-colors bg-gray-50">
                {selectedImage ? (
                  <img src={selectedImage} alt="Preview" className="max-h-full object-contain" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-blue-500" />
                    <span className="text-sm text-gray-600">Cliquez pour prendre une photo ou uploader</span>
                  </>
                )}
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            {selectedImage && (
              <button
                onClick={analyzeImage}
                disabled={analyzing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                {analyzing ? 'Analyse en cours...' : 'Analyser la facture'}
              </button>
            )}

            {!selectedImage && (
              <button
                onClick={() => {
                  setData([
                    {
                      jour: `Saisie Manuelle - ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
                      ligne_facture: [
                        {
                          produit: 'Nouveau Produit',
                          quantite: 1,
                          prix_unitaire: 0,
                          total_ht: 0,
                          tva: 0,
                          ttc: 0,
                          est_bio: false,
                          label: 'STANDARD'
                        }
                      ]
                    }
                  ]);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 py-2 px-4 rounded-xl border border-dashed border-blue-200 hover:border-blue-300 bg-white shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Saisir manuellement les données
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        {data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {data.map((day, dIdx) => (
              <div key={dIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">{day.jour}</h3>
                </div>
                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Produit</th>
                        <th className="px-4 py-3 text-right font-semibold">Qté</th>
                        <th className="px-4 py-3 text-right w-28 font-semibold">Prix U. HT</th>
                        <th className="px-4 py-3 text-right font-semibold">Total HT</th>
                        <th className="px-4 py-3 text-left font-semibold w-40">Label Qualité</th>
                        <th className="px-4 py-3 text-center font-semibold w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {day.ligne_facture.map((line, lIdx) => (
                        <tr key={lIdx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-3">
                            <input
                              value={line.produit?.replace('[BIO] ', '')}
                              onChange={(e) => updateLine(dIdx, lIdx, 'produit', (line.est_bio ? '[BIO] ' : '') + e.target.value)}
                              className="w-full bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none py-1"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={line.quantite}
                              onChange={(e) => updateLine(dIdx, lIdx, 'quantite', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none py-1"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.0001"
                              value={line.prix_unitaire}
                              onChange={(e) => updateLine(dIdx, lIdx, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none py-1"
                            />
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-800">
                            {line.total_ht?.toFixed(2)} €
                          </td>
                          <td className="p-3">
                            <select
                              value={line.label || (line.est_bio ? 'BIO' : 'STANDARD')}
                              onChange={(e) => {
                                const newLabel = e.target.value;
                                const isBio = newLabel === 'BIO';
                                updateLine(dIdx, lIdx, 'label', newLabel);
                                updateLine(dIdx, lIdx, 'est_bio', isBio);
                                
                                let newName = line.produit.replace('[BIO] ', '');
                                if (isBio) newName = '[BIO] ' + newName;
                                updateLine(dIdx, lIdx, 'produit', newName);
                              }}
                              className="w-full bg-white border border-gray-200 rounded-lg text-xs py-1.5 px-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => deleteLine(dIdx, lIdx)}
                              className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                              title="Supprimer la ligne"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex justify-start">
                    <button
                      onClick={() => addLine(dIdx)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 py-1 px-3 rounded-lg border border-dashed border-blue-200 hover:border-blue-300 bg-white shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter un produit
                    </button>
                  </div>
                </div>
 
                {/* Mobile View (Cards) */}
                <div className="block md:hidden divide-y divide-gray-100">
                  {day.ligne_facture.map((line, lIdx) => (
                    <div 
                      key={lIdx} 
                      className={`p-4 space-y-3 transition-colors relative ${
                        line.est_bio ? 'bg-green-50/20' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Product Input */}
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">Produit</label>
                          <input
                            value={line.produit?.replace('[BIO] ', '')}
                            onChange={(e) => updateLine(dIdx, lIdx, 'produit', (line.est_bio ? '[BIO] ' : '') + e.target.value)}
                            className="w-full font-semibold text-gray-800 bg-transparent border-b border-dashed border-gray-200 focus:border-blue-400 focus:outline-none py-0.5"
                          />
                        </div>
                        {/* Label Select Dropdown */}
                        <div className="min-w-[120px]">
                          <select
                            value={line.label || (line.est_bio ? 'BIO' : 'STANDARD')}
                            onChange={(e) => {
                              const newLabel = e.target.value;
                              const isBio = newLabel === 'BIO';
                              updateLine(dIdx, lIdx, 'label', newLabel);
                              updateLine(dIdx, lIdx, 'est_bio', isBio);
                              
                              let newName = line.produit.replace('[BIO] ', '');
                              if (isBio) newName = '[BIO] ' + newName;
                              updateLine(dIdx, lIdx, 'produit', newName);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg text-xs py-1 px-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
 
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        {/* Quantity */}
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">Quantité</label>
                          <input
                            type="number"
                            value={line.quantite}
                            onChange={(e) => updateLine(dIdx, lIdx, 'quantite', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm font-medium bg-gray-50 rounded-lg border border-gray-100 focus:border-blue-400 focus:bg-white focus:outline-none px-2 py-1.5"
                          />
                        </div>
                        {/* Unit Price */}
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">Prix U. HT</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={line.prix_unitaire}
                            onChange={(e) => updateLine(dIdx, lIdx, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm font-medium bg-gray-50 rounded-lg border border-gray-100 focus:border-blue-400 focus:bg-white focus:outline-none px-2 py-1.5"
                          />
                        </div>
                        {/* Total HT */}
                        <div className="text-right flex flex-col justify-end">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">Total HT</span>
                          <span className="text-base font-bold text-gray-800 py-1.5">
                            {line.total_ht?.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => deleteLine(dIdx, lIdx)}
                          className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg border border-red-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-4 bg-gray-50/50 flex justify-center">
                    <button
                      onClick={() => addLine(dIdx)}
                      className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-blue-200 bg-white shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un produit
                    </button>
                  </div>
                </div>
              </div>
            ))}


            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 pb-20">
              <button
                onClick={addToStock}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-100 transition-all hover:scale-105"
              >
                <Package className="w-5 h-5" />
                Ajouter au Stock
              </button>

              <button
                onClick={syncToSheets}
                disabled={syncing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-green-100 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {syncing ? 'Envoi...' : 'Envoyer vers Google Sheets'}
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-slate-100 transition-all hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Télécharger CSV (Compta)
              </button>

              {syncStatus && (
                <div className={`w-full text-center text-sm px-4 py-2 rounded-lg ${syncStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {syncStatus.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
