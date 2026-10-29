'use client';

import { useState } from 'react';
import { RefreshCw, Check, AlertCircle, Cloud } from 'lucide-react';
import { syncAll, getLastSyncDisplay } from '../lib/sync-engine';

interface SyncButtonProps {
  onSyncComplete?: () => void;
  compact?: boolean;
}

export default function SyncButton({ onSyncComplete, compact = false }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [resultMessage, setResultMessage] = useState('');

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setResult(null);
    setResultMessage('');

    try {
      const results = await syncAll();
      
      const pushed = Object.values(results).filter(r => r.direction === 'pushed').length;
      const pulled = Object.values(results).filter(r => r.direction === 'pulled').length;
      const errors = Object.values(results).filter(r => r.direction === 'error');

      if (errors.length > 0) {
        setResult('error');
        setResultMessage(errors[0].error || 'Erreur Google Sheets');
      } else {
        setResult('success');
        if (pushed > 0 && pulled > 0) {
          setResultMessage(`↑${pushed} envoyés • ↓${pulled} reçus`);
        } else if (pushed > 0) {
          setResultMessage(`Sauvegardé sur Google Sheets (${pushed})`);
        } else if (pulled > 0) {
          setResultMessage(`Données reçues (${pulled}) ! Actualisation...`);
        } else {
          setResultMessage('Tout est déjà synchronisé');
        }

        // Si des données ont été rafraîchies depuis le cloud, recharger doucement la page
        if (pulled > 0) {
          setTimeout(() => {
            if (onSyncComplete) {
              onSyncComplete();
            } else {
              window.location.reload();
            }
          }, 1200);
        }
      }

      setTimeout(() => {
        setResult(null);
        setResultMessage('');
      }, 5000);
    } catch (error: any) {
      setResult('error');
      setResultMessage(error.message || 'Erreur de connexion');
      setTimeout(() => {
        setResult(null);
        setResultMessage('');
      }, 5000);
    } finally {
      setSyncing(false);
    }
  };

  const lastSync = getLastSyncDisplay();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        type="button"
        className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-sm cursor-pointer ${
          result === 'success'
            ? 'bg-emerald-600 text-white shadow-emerald-200'
            : result === 'error'
            ? 'bg-red-600 text-white shadow-red-200'
            : syncing
            ? 'bg-blue-500 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
        } disabled:opacity-75`}
        title={lastSync ? `Dernière synchronisation: ${lastSync}` : 'Synchroniser les données avec Google Sheets'}
      >
        {syncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>Synchronisation...</span>
          </>
        ) : result === 'success' ? (
          <>
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{resultMessage}</span>
          </>
        ) : result === 'error' ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="max-w-[180px] truncate">{resultMessage}</span>
          </>
        ) : (
          <>
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            <span>Synchroniser</span>
          </>
        )}
      </button>

      {lastSync && !result && !syncing && (
        <span className="text-[10px] text-gray-400 hidden lg:inline-block">
          Sync : {lastSync}
        </span>
      )}
    </div>
  );
}
