import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────
export interface RebirthAppState {
  rebirth_quit_date: string | null;
  rebirth_daily_checkins: unknown;
  rebirth_daily_scores: unknown;
  rebirth_user_goals: unknown;
  rebirth_custom_stats: unknown;
  rebirth_user_name: string | null;
  rebirth_unlocked_achievements: unknown;
  rebirth_rank_seen: string | null;
  rebirth_expenses: unknown;
  'notification-settings': unknown;
  // Archived sessions
  [key: string]: unknown;
  updatedAt: string;
}

const RECORD_ID = 'akhil';

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

// ─── Gather local state ─────────────────────────────────────
export function gatherLocalState(): RebirthAppState {
  console.log('[CloudSync] Gathering local state...');
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

  state.updatedAt = new Date().toISOString();
  const keys = Object.keys(state).filter(k => state[k] !== null);
  console.log('[CloudSync] Gathered keys with data:', keys.join(', '));
  return state as RebirthAppState;
}

// ─── Apply cloud state to local ─────────────────────────────
export function applyStateToLocal(state: RebirthAppState): void {
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
}

// ─── Load from Supabase ─────────────────────────────────────
export async function loadCloudData(): Promise<RebirthAppState | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[CloudSync] Supabase not configured, skipping cloud load.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('rebirth_data')
      .select('data, updated_at')
      .eq('id', RECORD_ID)
      .maybeSingle();

    if (error) {
      console.error('[CloudSync] Load error:', error.message);
      return null;
    }

    if (!data) {
      console.log('[CloudSync] No cloud record found.');
      return null;
    }

    return data.data as RebirthAppState;
  } catch (err) {
    console.error('[CloudSync] Load failed:', err);
    return null;
  }
}

// ─── Save to Supabase ───────────────────────────────────────
export async function saveCloudData(appState: RebirthAppState): Promise<boolean> {
  console.log('[CloudSync] saveCloudData called, isConfigured:', isSupabaseConfigured, 'supabase:', !!supabase);
  if (!isSupabaseConfigured || !supabase) {
    console.log('[CloudSync] Supabase not configured, skipping cloud save.');
    return false;
  }

  try {
    const payload = {
      id: RECORD_ID,
      data: appState,
      updated_at: new Date().toISOString(),
    };
    console.log('[CloudSync] Upserting to DB, payload size:', JSON.stringify(payload).length, 'bytes');
    const { data, error } = await supabase
      .from('rebirth_data')
      .upsert(payload)
      .select();

    if (error) {
      console.error('[CloudSync] Save error:', error.message, error.details, error.hint);
      return false;
    }

    console.log('[CloudSync] Saved to cloud successfully! Response:', JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('[CloudSync] Save failed with exception:', err);
    return false;
  }
}

// ─── Sync: local is always source of truth ─────────────────
// Only pulls cloud→local if there's NO local data (fresh install / cleared storage)
export async function syncData(): Promise<{ synced: boolean; direction: 'cloud-to-local' | 'local-to-cloud' | 'none' }> {
  console.log('[CloudSync] syncData() called, isConfigured:', isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    console.warn('[CloudSync] Supabase NOT configured — sync skipped');
    return { synced: false, direction: 'none' };
  }

  try {
    const localState = gatherLocalState();
    const hasLocalData = !!localStorage.getItem('rebirth_quit_date');
    console.log('[CloudSync] hasLocalData:', hasLocalData, 'quit_date:', localStorage.getItem('rebirth_quit_date'));

    if (!hasLocalData) {
      // Fresh install or cleared data — try to restore from cloud
      console.log('[CloudSync] No local data, trying cloud restore...');
      const cloudState = await loadCloudData();
      if (cloudState) {
        applyStateToLocal(cloudState);
        localStorage.setItem('rebirth_last_sync_time', cloudState.updatedAt);
        console.log('[CloudSync] Restored from cloud (no local data).');
        return { synced: true, direction: 'cloud-to-local' };
      }
    }

    // Always push local → cloud
    console.log('[CloudSync] Pushing local → cloud...');
    const saved = await saveCloudData(localState);
    console.log('[CloudSync] Push result:', saved);
    if (saved) {
      localStorage.setItem('rebirth_last_sync_time', localState.updatedAt);
    }
    return { synced: saved, direction: 'local-to-cloud' };
  } catch (err) {
    console.error('[CloudSync] Sync failed with exception:', err);
    return { synced: false, direction: 'none' };
  }
}
