'use client';

/**
 * Sync Engine — Moteur de synchronisation Google Sheets ↔ localStorage
 * 
 * Principe :
 * - localStorage reste le cache local ultra-rapide et offline
 * - Google Sheets est la base de données cloud partagée entre tous vos appareils (PC, téléphone, tablette)
 * - Le bouton "Synchroniser" dans la barre du haut permet de forcer la mise à jour à tout moment
 * - Au premier lancement sur un appareil (ex: téléphone), une synchronisation initiale automatique récupère les données
 */

// Types de données synchronisables
export type SyncType = 'stock' | 'settings' | 'invoice_history' | 'effectifs' | 'menus';

// Mapping type → clé localStorage
export const LOCAL_STORAGE_KEYS: Record<SyncType, string> = {
  stock: 'egalim_stock_v1',
  settings: 'egalim_settings_v1',
  invoice_history: 'egalim_invoice_history_v1',
  effectifs: 'egalim_effectifs_db_v1',
  menus: 'egalim_menus_v1',
};

// Clé pour stocker le dernier timestamp de modification locale par type
const LOCAL_MODIFIED_KEY = 'egalim_local_modified_timestamps';
// Clé pour stocker le dernier timestamp de synchronisation réussie
const LAST_SYNC_KEY = 'egalim_last_sync_timestamp';

interface Timestamps {
  [type: string]: string; // ISO date string
}

function getLocalModifiedTimestamps(): Timestamps {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_MODIFIED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markLocalModified(type: SyncType) {
  if (typeof window === 'undefined') return;
  const timestamps = getLocalModifiedTimestamps();
  timestamps[type] = new Date().toISOString();
  localStorage.setItem(LOCAL_MODIFIED_KEY, JSON.stringify(timestamps));
}

/**
 * Pull data from Google Sheets for a given type.
 * Returns the remote data and timestamp, or null if no remote data exists.
 */
export async function pullFromSheets(type: SyncType): Promise<{ data: any; timestamp: string | null } | null> {
  try {
    const response = await fetch(`/api/sync-data?type=${type}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur de lecture');
    }
    const result = await response.json();
    return {
      data: result.data,
      timestamp: result.timestamp,
    };
  } catch (error) {
    console.error(`[Sync] Erreur pull ${type}:`, error);
    throw error;
  }
}

/**
 * Push data to Google Sheets for a given type.
 */
export async function pushToSheets(type: SyncType, data: any): Promise<string> {
  try {
    const timestamp = new Date().toISOString();
    const response = await fetch('/api/sync-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Erreur d'écriture");
    }
    const result = await response.json();
    const savedTs = result.timestamp || timestamp;
    
    // Clear the modified flag after successful push
    const modified = getLocalModifiedTimestamps();
    delete modified[type];
    localStorage.setItem(LOCAL_MODIFIED_KEY, JSON.stringify(modified));

    return savedTs;
  } catch (error) {
    console.error(`[Sync] Erreur push ${type}:`, error);
    throw error;
  }
}

/**
 * Synchronise une catégorie spécifique :
 * Détermine s'il faut pousser (PC -> Google Sheets) ou tirer (Google Sheets -> Téléphone).
 */
export async function syncData(type: SyncType): Promise<{
  direction: 'pushed' | 'pulled' | 'none';
  data: any;
}> {
  if (typeof window === 'undefined') return { direction: 'none', data: null };

  const localKey = LOCAL_STORAGE_KEYS[type];
  const localRaw = localStorage.getItem(localKey);
  let localData: any = null;

  try {
    localData = localRaw ? JSON.parse(localRaw) : null;
  } catch {
    localData = null;
  }

  const modifiedTimestamps = getLocalModifiedTimestamps();
  const hasLocalModification = !!modifiedTimestamps[type];
  const localModDate = hasLocalModification ? new Date(modifiedTimestamps[type]).getTime() : 0;

  // Récupération de la version cloud Google Sheets
  const remote = await pullFromSheets(type);
  const remoteData = remote?.data ?? null;
  const remoteTimestamp = remote?.timestamp ?? null;
  const remoteDate = remoteTimestamp ? new Date(remoteTimestamp).getTime() : 0;

  const hasLocal = localData !== null && (
    Array.isArray(localData) ? localData.length > 0 : Object.keys(localData).length > 0
  );
  const hasRemote = remoteData !== null && (
    Array.isArray(remoteData) ? remoteData.length > 0 : Object.keys(remoteData).length > 0
  );

  // Cas 1: Aucune donnée nulle part
  if (!hasLocal && !hasRemote) {
    return { direction: 'none', data: null };
  }

  // Cas 2: Données locales uniquement (ex: premier sync sur le PC qui a déjà l'inventaire)
  if (hasLocal && !hasRemote) {
    await pushToSheets(type, localData);
    return { direction: 'pushed', data: localData };
  }

  // Cas 3: Données distantes uniquement (ex: téléphone qui vient d'ouvrir l'application)
  if (!hasLocal && hasRemote) {
    localStorage.setItem(localKey, JSON.stringify(remoteData));
    return { direction: 'pulled', data: remoteData };
  }

  // Cas 4: Les deux ont des données
  if (hasLocalModification && localModDate > remoteDate) {
    // La modification locale est plus récente -> envoyer au cloud
    await pushToSheets(type, localData);
    return { direction: 'pushed', data: localData };
  } else if (remoteDate > localModDate) {
    // Le cloud a été mis à jour par un autre appareil plus récemment -> récupérer
    localStorage.setItem(localKey, JSON.stringify(remoteData));
    return { direction: 'pulled', data: remoteData };
  } else {
    // Les deux sont à jour
    return { direction: 'none', data: localData };
  }
}

/**
 * Synchronise l'ensemble des données (Stock, Paramètres, Historique Factures, Effectifs).
 */
export async function syncAll(): Promise<Record<SyncType, {
  direction: 'pushed' | 'pulled' | 'none' | 'error';
  error?: string;
}>> {
  const types: SyncType[] = ['stock', 'settings', 'invoice_history', 'effectifs'];
  const results: any = {};

  const promises = types.map(async (type) => {
    try {
      const result = await syncData(type);
      results[type] = { direction: result.direction };
    } catch (error: any) {
      results[type] = { direction: 'error', error: error.message };
    }
  });

  await Promise.all(promises);

  // Sauvegarder la date du dernier sync
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    // Déclencher les événements pour que tous les composants React rechargent leurs données
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new CustomEvent('egalim_sync_completed', { detail: results }));
  }

  return results;
}

/**
 * Retourne la date de dernière synchronisation pour affichage
 */
export function getLastSyncDisplay(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  if (!raw) return null;
  try {
    return new Date(raw).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}
