'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Building2, User, Percent, Table } from 'lucide-react';

interface AppSettings {
    etablissement: string;
    responsable: string;
    tvaDefault: number;
    spreadsheetId: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    etablissement: 'Cuisine Centrale',
    responsable: '',
    tvaDefault: 5.5,
    spreadsheetId: '1hPDlmz0lA0H_bn6vguQ8H68EQemwwM5EXxbCFONnHgA'
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('egalim_settings_v1');
        if (stored) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            } catch (e) {
                console.error("Error loading settings", e);
            }
        }
        setLoading(false);
    }, []);

    const handleChange = (key: keyof AppSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        try {
            localStorage.setItem('egalim_settings_v1', JSON.stringify(settings));
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la sauvegarde des paramètres");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Chargement des paramètres...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-8 h-8 text-gray-500" />
                    Configuration & Profil
                </h1>
                <p className="text-gray-500">Personnalisez votre application pour la rendre nominative</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                
                {/* Section Etablissement */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Building2 className="w-5 h-5 text-blue-500" />
                        Identité de la Cuisine
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Nom de l'établissement</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="ex: Ecole de la Source"
                                value={settings.etablissement}
                                onChange={(e) => handleChange('etablissement', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Responsable / Gestionnaire</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Nom Prénom"
                                    value={settings.responsable}
                                    onChange={(e) => handleChange('responsable', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Facturation */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Percent className="w-5 h-5 text-green-500" />
                        Paramètres Comptabilité (TVA)
                    </h2>
                    
                    <div className="space-y-2 max-w-xs">
                        <label className="text-sm font-medium text-gray-600">Taux TVA par défaut (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={settings.tvaDefault}
                            onChange={(e) => handleChange('tvaDefault', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>

                {/* Section Google Sheets */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Table className="w-5 h-5 text-emerald-500" />
                        Liaison Google Sheets
                    </h2>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">ID du Classeur Google Sheets (Spreadsheet ID)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm bg-gray-50 focus:bg-white"
                            placeholder="ex: 1hPDlmz0lA0H_bn6vguQ8H..."
                            value={settings.spreadsheetId}
                            onChange={(e) => handleChange('spreadsheetId', e.target.value)}
                        />
                        <p className="text-xs text-gray-400">
                            C'est l'identifiant présent dans l'URL de votre fichier Google Sheets (après "/d/").
                        </p>
                    </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="pt-6 border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                            saveSuccess ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100'
                        } disabled:opacity-50 disabled:shadow-none`}
                    >
                        {isSaving ? 'Sauvegarde...' : saveSuccess ? (
                            <><CheckCircle2 className="w-5 h-5" /> Paramètres enregistrés !</>
                        ) : (
                            <><Save className="w-5 h-5" /> Sauvegarder les paramètres</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
