import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { initialSync, manualSync, restoreFromCloud, scheduleDebouncedPush, hasPendingSync, ALL_KEYS, LOCAL_UPDATED_KEY } from '@/services/cloudSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isSyncSuppressed } from '@/services/syncFlags';
import React from 'react';

// ─── Custom event name for sync triggers ────────────────────
const SYNC_EVENT = 'rebirth-data-changed';

// Flag to suppress events during cloud restore
export { suppressSyncEvents } from '@/services/syncFlags';

// ─── Monkey-patch localStorage to detect writes to rebirth keys ─
const SYNC_META_KEYS = new Set(['rebirth_last_sync_time', 'rebirth_last_cloud_updated_at', LOCAL_UPDATED_KEY]);
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

localStorage.setItem = function (key: string, value: string) {
  originalSetItem(key, value);
  if (!isSyncSuppressed() && !SYNC_META_KEYS.has(key) && (ALL_KEYS.includes(key) || key.startsWith('rebirth_session_'))) {
    console.log('[CloudSync] localStorage.setItem intercepted:', key);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
  }
};

localStorage.removeItem = function (key: string) {
  originalRemoveItem(key);
  if (!isSyncSuppressed() && !SYNC_META_KEYS.has(key) && (ALL_KEYS.includes(key) || key.startsWith('rebirth_session_'))) {
    console.log('[CloudSync] localStorage.removeItem intercepted:', key);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
  }
};

// ─── Snapshot for polling-based change detection ────────────
function takeSnapshot(): string {
  return ALL_KEYS.map(k => localStorage.getItem(k) ?? '').join('|');
}

// ─── Types ──────────────────────────────────────────────────
export type SyncStatusLabel = 'idle' | 'syncing' | 'synced' | 'pending' | 'failed' | 'disabled';

interface CloudSyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastCloudUpdatedAt: string | null;
  syncStatus: SyncStatusLabel;
  syncPending: boolean;
  syncNow: () => Promise<void>;
  restoreNow: () => Promise<void>;
  scheduleSync: () => void;
}

const defaultState: CloudSyncState = {
  isSyncing: false,
  lastSyncedAt: null,
  lastCloudUpdatedAt: null,
  syncStatus: 'disabled',
  syncPending: false,
  syncNow: async () => {},
  restoreNow: async () => {},
  scheduleSync: () => {},
};

const CloudSyncContext = createContext<CloudSyncState>(defaultState);

// ─── Provider (single instance in App) ──────────────────────
export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => localStorage.getItem('rebirth_last_sync_time')
  );
  const [lastCloudUpdatedAt, setLastCloudUpdatedAt] = useState<string | null>(
    () => localStorage.getItem('rebirth_last_cloud_updated_at')
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatusLabel>(
    isSupabaseConfigured ? 'idle' : 'disabled'
  );
  const [syncPending, setSyncPending] = useState(false);
  const mountedRef = useRef(true);
  const lastSnapshotRef = useRef<string>(takeSnapshot());

  // ─── Schedule a debounced push (called on every data change) ─
  const scheduleSync = useCallback(() => {
    if (!isSupabaseConfigured) return;
    setSyncPending(true);
    setSyncStatus('pending');

    scheduleDebouncedPush().then((success) => {
      if (!mountedRef.current) return;
      setSyncPending(hasPendingSync());
      if (success) {
        const now = localStorage.getItem('rebirth_last_sync_time');
        setLastSyncedAt(now);
        setLastCloudUpdatedAt(now);
        setSyncStatus('synced');
        // Update snapshot so polling doesn't re-trigger
        lastSnapshotRef.current = takeSnapshot();
      } else {
        setSyncStatus('failed');
      }
    });
  }, []);

  // ─── Manual Sync (Sync Now button) ───────────────────────
  const syncNow = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSyncStatus('disabled');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const result = await manualSync();
      if (!mountedRef.current) return;

      if (result.success) {
        setLastSyncedAt(result.cloudUpdatedAt);
        setLastCloudUpdatedAt(result.cloudUpdatedAt);
        setSyncStatus('synced');
        setSyncPending(false);
        lastSnapshotRef.current = takeSnapshot();
        // If we restored from cloud (local was empty), reload
        if (result.direction === 'restore') {
          window.location.reload();
        }
      } else {
        setSyncStatus('failed');
      }
    } catch (e) {
      console.error('[CloudSync] syncNow error:', e);
      if (mountedRef.current) setSyncStatus('failed');
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, []);

  // ─── Restore From Cloud (manual recovery) ───────────────
  const restoreNow = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSyncStatus('disabled');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const result = await restoreFromCloud();
      if (!mountedRef.current) return;

      if (result.success) {
        setLastSyncedAt(result.cloudUpdatedAt);
        setLastCloudUpdatedAt(result.cloudUpdatedAt);
        setSyncStatus('synced');
        setSyncPending(false);
        window.location.reload();
      } else {
        setSyncStatus('failed');
      }
    } catch (e) {
      console.error('[CloudSync] restoreNow error:', e);
      if (mountedRef.current) setSyncStatus('failed');
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, []);

  // ─── Initial sync on app start ───────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (!isSupabaseConfigured) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    initialSync().then((result) => {
      if (!mountedRef.current) return;

      if (result.success) {
        setLastSyncedAt(result.cloudUpdatedAt);
        setLastCloudUpdatedAt(result.cloudUpdatedAt);
        if (result.cloudUpdatedAt) {
          localStorage.setItem('rebirth_last_sync_time', result.cloudUpdatedAt);
          localStorage.setItem('rebirth_last_cloud_updated_at', result.cloudUpdatedAt);
        }
        setSyncStatus('synced');

        // If cloud was newer and we restored, reload to pick up new state
        if (result.direction === 'cloud-to-local') {
          window.location.reload();
        }
      } else {
        setSyncStatus('failed');
      }
      setIsSyncing(false);
    });

    return () => { mountedRef.current = false; };
  }, []);

  // ─── Auto-sync: listen for any rebirth data change ───────
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const handler = () => {
      console.log('[CloudSync] Event-based: data change detected');
      scheduleSync();
    };

    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [scheduleSync]);

  // ─── Polling fallback: check every 5s for localStorage changes ─
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const interval = setInterval(() => {
      if (isSyncSuppressed()) return; // skip during cloud restore
      const current = takeSnapshot();
      if (current !== lastSnapshotRef.current) {
        console.log('[CloudSync] Polling: local data changed, scheduling sync');
        lastSnapshotRef.current = current;
        scheduleSync();
      }
    }, 5_000);

    return () => clearInterval(interval);
  }, [scheduleSync]);

  const value: CloudSyncState = {
    isSyncing,
    lastSyncedAt,
    lastCloudUpdatedAt,
    syncStatus,
    syncPending,
    syncNow,
    restoreNow,
    scheduleSync,
  };

  return React.createElement(CloudSyncContext.Provider, { value }, children);
}

// ─── Hook (consumers) ──────────────────────────────────────
export function useCloudSync(): CloudSyncState {
  return useContext(CloudSyncContext);
}
