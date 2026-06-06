import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { suppressSyncEvents } from '@/services/syncFlags';

// ─── Constants ──────────────────────────────────────────────
const RECORD_ID = 'akhil';
const DEBOUNCE_MS = 5_000; // 5-second debounce for auto-sync
const LOCAL_UPDATED_KEY = 'rebirth_local_updated_at'; // persistent timestamp of last real local change

const ALL_KEYS = [
  'rebirth_quit_date',
  'rebirth_daily_checkins',
  'rebirth_daily_scores',
  'rebirth_user_goals',
  'rebirth_custom_stats',
  'rebirth_user_name',
  'rebirth_unlocked_achievements',
  'rebirth_rank_seen',
  'rebirth_expenses',
  'notification-settings',
];

// Keys that contain real user-generated data (not auto-initialized defaults)
const MEANINGFUL_KEYS = [
  'rebirth_daily_scores',
  'rebirth_daily_checkins',
  'rebirth_user_goals',
  'rebirth_user_name',
  'rebirth_expenses',
  'rebirth_unlocked_achievements',
  'rebirth_custom_stats',
];

// ─── Types ──────────────────────────────────────────────────
export interface RebirthAppState {
  [key: string]: unknown;
  updatedAt: string;
}

// ─── Check if local state has real user data ────────────────
export function isLocalMeaningful(): boolean {
  for (const key of MEANINGFUL_KEYS) {
    const val = localStorage.getItem(key);
    if (val && val !== 'null' && val !== '[]' && val !== '{}') {
      return true;
    }
  }
  return false;
}

// ─── Mark local state as updated (call after real user actions) ─
export function markLocalUpdated(): void {
  localStorage.setItem(LOCAL_UPDATED_KEY, new Date().toISOString());
}

// ─── Get the stored local updated timestamp ─────────────────
function getLocalUpdatedAt(): string | null {
  return localStorage.getItem(LOCAL_UPDATED_KEY);
}

// ─── Gather local state ─────────────────────────────────────
export function gatherLocalState(): RebirthAppState {
  console.log('[CloudSync] Loading local state');
  const state: Record<string, unknown> = {};

  for (const key of ALL_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try { state[key] = JSON.parse(val); } catch { state[key] = val; }
    } else {
      state[key] = null;
    }
  }

  // Include archived sessions (rebirth_session_1, rebirth_session_2, ...)
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('rebirth_session_')) {
      const val = localStorage.getItem(k);
      if (val !== null) {
        try { state[k] = JSON.parse(val); } catch { state[k] = val; }
      }
    }
  }

  // Use stored timestamp — NOT a freshly generated one
  const storedUpdatedAt = getLocalUpdatedAt();
  state.updatedAt = storedUpdatedAt || new Date(0).toISOString(); // epoch if never set
  const nonNullKeys = Object.keys(state).filter(k => state[k] !== null);
  console.log('[CloudSync] Local state loaded. updatedAt:', state.updatedAt, '| Keys:', nonNullKeys.join(', '));
  return state as RebirthAppState;
}

// ─── Apply cloud state to local storage ─────────────────────
export function applyStateToLocal(state: RebirthAppState): void {
  console.log('[CloudSync] Applying cloud state to local storage');
  suppressSyncEvents(true); // Prevent triggering sync during restore
  try {
    for (const key of ALL_KEYS) {
      if (key in state && state[key] !== null && state[key] !== undefined) {
        const val = typeof state[key] === 'string' ? state[key] as string : JSON.stringify(state[key]);
        localStorage.setItem(key, val);
      }
    }

    // Restore archived sessions
    for (const [key, value] of Object.entries(state)) {
      if (key.startsWith('rebirth_session_') && value !== null) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }

    // Set local updated timestamp to match cloud so future comparisons are correct
    if (state.updatedAt) {
      localStorage.setItem(LOCAL_UPDATED_KEY, state.updatedAt);
    }

    console.log('[CloudSync] Local state restored from cloud');
  } finally {
    suppressSyncEvents(false);
  }
}

// ─── Load cloud state from Supabase ─────────────────────────
export async function loadCloudData(): Promise<{ state: RebirthAppState | null; cloudUpdatedAt: string | null }> {
  console.log('[CloudSync] Loading cloud state');
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[CloudSync] Supabase not configured, skipping cloud load');
    return { state: null, cloudUpdatedAt: null };
  }

  try {
    const { data, error } = await supabase
      .from('rebirth_data')
      .select('data, updated_at')
      .eq('id', RECORD_ID)
      .maybeSingle();

    if (error) {
      console.error('[CloudSync] Load error:', error.message);
      return { state: null, cloudUpdatedAt: null };
    }

    if (!data) {
      console.log('[CloudSync] No cloud record found');
      return { state: null, cloudUpdatedAt: null };
    }

    console.log('[CloudSync] Cloud state loaded, updated_at:', data.updated_at);
    return {
      state: data.data as RebirthAppState,
      cloudUpdatedAt: data.updated_at as string,
    };
  } catch (err) {
    console.error('[CloudSync] Cloud load failed:', err);
    return { state: null, cloudUpdatedAt: null };
  }
}

// ─── Push local state to Supabase ───────────────────────────
export async function pushToCloud(appState: RebirthAppState): Promise<{ success: boolean; updatedAt: string | null }> {
  console.log('[CloudSync] Saving to cloud');
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[CloudSync] Supabase not configured, skipping cloud save');
    return { success: false, updatedAt: null };
  }

  try {
    const now = new Date().toISOString();
    // Stamp the state with the current time for the cloud record
    const stateToSave = { ...appState, updatedAt: now };
    const payload = {
      id: RECORD_ID,
      data: stateToSave,
      updated_at: now,
    };
    console.log('[CloudSync] Upserting, payload size:', JSON.stringify(payload).length, 'bytes');

    const { error } = await supabase
      .from('rebirth_data')
      .upsert(payload);

    if (error) {
      console.error('[CloudSync] Save failed:', error.message, error.details, error.hint);
      return { success: false, updatedAt: null };
    }

    // Update local timestamp to match what we just pushed
    localStorage.setItem(LOCAL_UPDATED_KEY, now);
    console.log('[CloudSync] Save success, updated_at:', now);
    return { success: true, updatedAt: now };
  } catch (err) {
    console.error('[CloudSync] Save failed with exception:', err);
    return { success: false, updatedAt: null };
  }
}

// ─── App Start: Compare timestamps and reconcile ────────────
export async function initialSync(): Promise<{
  direction: 'cloud-to-local' | 'local-to-cloud' | 'cloud-created' | 'none';
  success: boolean;
  cloudUpdatedAt: string | null;
}> {
  console.log('[CloudSync] ─── Initial sync starting ───');

  if (!isSupabaseConfigured) {
    console.warn('[CloudSync] Supabase not configured');
    return { direction: 'none', success: false, cloudUpdatedAt: null };
  }

  try {
    // Step 1: Check local state
    const localUpdatedAt = getLocalUpdatedAt();
    const localHasMeaningfulData = isLocalMeaningful();
    console.log('[CloudSync] Local timestamp:', localUpdatedAt || '(none — fresh device)');
    console.log('[CloudSync] Local has meaningful data:', localHasMeaningfulData);

    // Step 2: Load cloud state
    const { state: cloudState, cloudUpdatedAt } = await loadCloudData();
    console.log('[CloudSync] Cloud timestamp:', cloudUpdatedAt || '(no cloud record)');

    // Step 3: Reconcile
    if (!cloudState) {
      if (localHasMeaningfulData) {
        // No cloud data — create initial cloud record from local
        console.log('[CloudSync] No cloud data. Creating initial cloud record');
        const localState = gatherLocalState();
        const result = await pushToCloud(localState);
        return { direction: 'cloud-created', success: result.success, cloudUpdatedAt: result.updatedAt };
      }
      console.log('[CloudSync] No cloud or meaningful local data');
      return { direction: 'none', success: true, cloudUpdatedAt: null };
    }

    // Cloud exists — should we restore from it?
    if (!localUpdatedAt || !localHasMeaningfulData) {
      // Fresh device OR empty local → always restore from cloud
      console.log('[CloudSync] Cloud newer (fresh device / empty local). Restoring from cloud');
      console.log('[CloudSync] Applying cloud state');
      applyStateToLocal(cloudState);
      console.log('[CloudSync] Restore complete');
      return { direction: 'cloud-to-local', success: true, cloudUpdatedAt };
    }

    // Both exist with meaningful data — compare timestamps
    console.log('[CloudSync] Comparing timestamps');
    const localTime = new Date(localUpdatedAt).getTime();
    const cloudTime = cloudState.updatedAt ? new Date(cloudState.updatedAt).getTime() : 0;
    console.log('[CloudSync] Local:', localUpdatedAt, '| Cloud:', cloudState.updatedAt);

    if (cloudTime > localTime) {
      console.log('[CloudSync] Cloud newer. Replacing local with cloud');
      console.log('[CloudSync] Applying cloud state');
      applyStateToLocal(cloudState);
      console.log('[CloudSync] Restore complete');
      return { direction: 'cloud-to-local', success: true, cloudUpdatedAt };
    } else {
      console.log('[CloudSync] Local newer. Pushing to cloud');
      const localState = gatherLocalState();
      const result = await pushToCloud(localState);
      return { direction: 'local-to-cloud', success: result.success, cloudUpdatedAt: result.updatedAt };
    }
  } catch (err) {
    console.error('[CloudSync] Initial sync failed:', err);
    return { direction: 'none', success: false, cloudUpdatedAt: null };
  }
}

// ─── Manual Sync: Smart push — don't overwrite cloud with empty state ─
export async function manualSync(): Promise<{
  success: boolean;
  cloudUpdatedAt: string | null;
  verified: boolean;
  direction: 'push' | 'restore' | 'none';
}> {
  console.log('[CloudSync] ─── Manual sync starting ───');

  if (!isSupabaseConfigured || !supabase) {
    console.warn('[CloudSync] Supabase not configured');
    return { success: false, cloudUpdatedAt: null, verified: false, direction: 'none' };
  }

  try {
    const localMeaningful = isLocalMeaningful();
    console.log('[CloudSync] Manual sync: local has meaningful data:', localMeaningful);

    if (!localMeaningful) {
      // Local is empty/default — restore from cloud instead of pushing
      console.log('[CloudSync] Local state is empty. Restoring from cloud instead of pushing');
      const { state: cloudState, cloudUpdatedAt } = await loadCloudData();
      if (cloudState) {
        applyStateToLocal(cloudState);
        if (cloudUpdatedAt) {
          localStorage.setItem('rebirth_last_sync_time', cloudUpdatedAt);
          localStorage.setItem('rebirth_last_cloud_updated_at', cloudUpdatedAt);
        }
        console.log('[CloudSync] Restore complete');
        return { success: true, cloudUpdatedAt, verified: true, direction: 'restore' };
      }
      console.log('[CloudSync] No cloud data to restore');
      return { success: false, cloudUpdatedAt: null, verified: false, direction: 'none' };
    }

    // Step 1: Push local → cloud
    const localState = gatherLocalState();
    const pushResult = await pushToCloud(localState);
    if (!pushResult.success) {
      console.error('[CloudSync] Manual sync: push failed');
      return { success: false, cloudUpdatedAt: null, verified: false, direction: 'none' };
    }

    // Step 2: Read back & verify
    const { cloudUpdatedAt } = await loadCloudData();
    if (!cloudUpdatedAt) {
      console.error('[CloudSync] Manual sync: read-back failed');
      return { success: true, cloudUpdatedAt: pushResult.updatedAt, verified: false, direction: 'push' };
    }

    const pushTime = new Date(pushResult.updatedAt!).getTime();
    const cloudTime = new Date(cloudUpdatedAt).getTime();
    const verified = Math.abs(pushTime - cloudTime) < 5000;
    console.log('[CloudSync] Verified:', verified, '| Push:', pushResult.updatedAt, '| Cloud:', cloudUpdatedAt);

    if (verified) {
      localStorage.setItem('rebirth_last_sync_time', cloudUpdatedAt);
      localStorage.setItem('rebirth_last_cloud_updated_at', cloudUpdatedAt);
    }

    console.log('[CloudSync] Manual sync complete');
    return { success: true, cloudUpdatedAt, verified, direction: 'push' };
  } catch (err) {
    console.error('[CloudSync] Manual sync failed:', err);
    return { success: false, cloudUpdatedAt: null, verified: false, direction: 'none' };
  }
}

// ─── Restore From Cloud (manual recovery) ──────────────────
export async function restoreFromCloud(): Promise<{
  success: boolean;
  cloudUpdatedAt: string | null;
}> {
  console.log('[CloudSync] ─── Restore from cloud starting ───');

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, cloudUpdatedAt: null };
  }

  try {
    const { state: cloudState, cloudUpdatedAt } = await loadCloudData();
    if (!cloudState) {
      console.log('[CloudSync] No cloud data to restore');
      return { success: false, cloudUpdatedAt: null };
    }

    console.log('[CloudSync] Applying cloud state');
    applyStateToLocal(cloudState);
    if (cloudUpdatedAt) {
      localStorage.setItem('rebirth_last_sync_time', cloudUpdatedAt);
      localStorage.setItem('rebirth_last_cloud_updated_at', cloudUpdatedAt);
    }
    console.log('[CloudSync] Restore complete');
    console.log('[CloudSync] Reloading app');
    return { success: true, cloudUpdatedAt };
  } catch (err) {
    console.error('[CloudSync] Restore failed:', err);
    return { success: false, cloudUpdatedAt: null };
  }
}

// ─── Debounced push (module-level singleton) ────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingResolvers: Array<(result: boolean) => void> = [];

export function scheduleDebouncedPush(): Promise<boolean> {
  return new Promise((resolve) => {
    pendingResolvers.push(resolve);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      console.log('[CloudSync] Debounce: timer reset, waiting 5s');
    } else {
      console.log('[CloudSync] Debounce: scheduling push in 5s');
    }

    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      const resolvers = [...pendingResolvers];
      pendingResolvers = [];

      // Stamp local updated time NOW (the real user action happened)
      markLocalUpdated();

      console.log('[CloudSync] Debounce: 5s elapsed, pushing now');
      const state = gatherLocalState();
      const result = await pushToCloud(state);

      if (result.success) {
        localStorage.setItem('rebirth_last_sync_time', result.updatedAt!);
        localStorage.setItem('rebirth_last_cloud_updated_at', result.updatedAt!);
      }

      for (const r of resolvers) r(result.success);
    }, DEBOUNCE_MS);
  });
}

export function hasPendingSync(): boolean {
  return debounceTimer !== null;
}

export { ALL_KEYS, RECORD_ID, LOCAL_UPDATED_KEY };
