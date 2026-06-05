import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { syncData, gatherLocalState, saveCloudData } from '@/services/cloudSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import React from 'react';

const AUTO_PUSH_INTERVAL = 30_000; // push to cloud every 30s if data changed

interface CloudSyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'failed' | 'disabled';
  syncNow: () => Promise<void>;
}

const defaultState: CloudSyncState = {
  isSyncing: false,
  lastSyncedAt: null,
  syncStatus: 'disabled',
  syncNow: async () => {},
};

const CloudSyncContext = createContext<CloudSyncState>(defaultState);

// Snapshot of localStorage to detect changes
function takeSnapshot(): string {
  const keys = [
    'rebirth_quit_date', 'rebirth_daily_checkins', 'rebirth_daily_scores',
    'rebirth_user_goals', 'rebirth_custom_stats', 'rebirth_user_name',
    'rebirth_unlocked_achievements', 'rebirth_rank_seen', 'rebirth_expenses',
    'notification-settings',
  ];
  return keys.map(k => localStorage.getItem(k) || '').join('|');
}

/** Wrap your app in this provider — creates a single sync instance */
export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => localStorage.getItem('rebirth_last_sync_time')
  );
  const [syncStatus, setSyncStatus] = useState<CloudSyncState['syncStatus']>(
    isSupabaseConfigured ? 'idle' : 'disabled'
  );
  const lastSnapshotRef = useRef<string>('');
  const mountedRef = useRef(true);

  // ─── Push local → cloud (always) ──────────────────────
  const pushToCloud = useCallback(async () => {
    console.log('[CloudSync] pushToCloud called');
    if (!isSupabaseConfigured) return false;
    try {
      const state = gatherLocalState();
      const saved = await saveCloudData(state);
      if (saved && mountedRef.current) {
        const now = new Date().toISOString();
        setLastSyncedAt(now);
        localStorage.setItem('rebirth_last_sync_time', now);
        setSyncStatus('synced');
        lastSnapshotRef.current = takeSnapshot();
      }
      return saved;
    } catch (e) {
      console.error('[CloudSync] pushToCloud error:', e);
      if (mountedRef.current) setSyncStatus('failed');
      return false;
    }
  }, []);

  // ─── Manual sync / Sync Now button ────────────────────
  const syncNow = useCallback(async () => {
    console.log('[CloudSync] syncNow() triggered');
    if (!isSupabaseConfigured) {
      console.warn('[CloudSync] Supabase not configured');
      setSyncStatus('disabled');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const result = await syncData();
      console.log('[CloudSync] syncData result:', JSON.stringify(result));
      if (result.synced && mountedRef.current) {
        const now = new Date().toISOString();
        setLastSyncedAt(now);
        localStorage.setItem('rebirth_last_sync_time', now);
        setSyncStatus('synced');
        lastSnapshotRef.current = takeSnapshot();
        if (result.direction === 'cloud-to-local') {
          window.location.reload();
        }
      } else if (mountedRef.current) {
        setSyncStatus('failed');
      }
    } catch (e) {
      console.error('[CloudSync] syncNow error:', e);
      if (mountedRef.current) setSyncStatus('failed');
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, []);

  // ─── Initial sync on mount ────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (!isSupabaseConfigured) return;
    lastSnapshotRef.current = takeSnapshot();
    syncNow();
    return () => { mountedRef.current = false; };
  }, [syncNow]);

  // ─── Auto-push: check for local changes every 30s ─────
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const interval = setInterval(() => {
      const current = takeSnapshot();
      if (current !== lastSnapshotRef.current) {
        console.log('[CloudSync] Auto-push: local data changed, pushing...');
        pushToCloud();
      }
    }, AUTO_PUSH_INTERVAL);

    return () => clearInterval(interval);
  }, [pushToCloud]);

  const value = { isSyncing, lastSyncedAt, syncStatus, syncNow };

  return React.createElement(CloudSyncContext.Provider, { value }, children);
}

/** Use this hook anywhere to access sync state + syncNow */
export function useCloudSync(): CloudSyncState {
  return useContext(CloudSyncContext);
}
