import { getRandomNotification } from '@/data/notifications';

// ─── localStorage keys ──────────────────────────────────────
const NOTIF_ENABLED_KEY = 'rebirth_motivational_enabled';
const NOTIF_INTERVAL_KEY = 'rebirth_motivational_interval_hours';
const NOTIF_LAST_SENT_KEY = 'rebirth_motivational_last_sent';

// ─── Defaults ───────────────────────────────────────────────
const DEFAULT_INTERVAL_HOURS = 5;

// ─── Settings helpers ───────────────────────────────────────
export function isMotivationalEnabled(): boolean {
  return localStorage.getItem(NOTIF_ENABLED_KEY) !== 'false'; // default true
}

export function setMotivationalEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
}

export function getIntervalHours(): number {
  const stored = localStorage.getItem(NOTIF_INTERVAL_KEY);
  return stored ? parseInt(stored, 10) : DEFAULT_INTERVAL_HOURS;
}

export function setIntervalHours(hours: number): void {
  localStorage.setItem(NOTIF_INTERVAL_KEY, String(hours));
}

export function getLastSentTimestamp(): number {
  const stored = localStorage.getItem(NOTIF_LAST_SENT_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function markSent(): void {
  localStorage.setItem(NOTIF_LAST_SENT_KEY, String(Date.now()));
}

// ─── Permission ─────────────────────────────────────────────
export async function requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ─── Show a motivational notification ───────────────────────
export function showMotivationalNotification(): void {
  if (Notification.permission !== 'granted') return;

  const msg = getRandomNotification();

  // Try service worker notification first (works when app is in background)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      data: {
        title: '🔥 Rebirth',
        body: msg.text,
        tag: 'rebirth-motivational',
        requireInteraction: false,
        delay: 0,
      },
    });
  } else {
    // Fallback: direct Notification API
    new Notification('🔥 Rebirth', {
      body: msg.text,
      tag: 'rebirth-motivational',
      icon: '/Rebirth_icon.png',
      badge: '/Rebirth_icon.png',
    });
  }

  markSent();
}

// ─── Check if a notification is due ─────────────────────────
export function isNotificationDue(): boolean {
  if (!isMotivationalEnabled()) return false;
  const intervalMs = getIntervalHours() * 60 * 60 * 1000;
  const elapsed = Date.now() - getLastSentTimestamp();
  return elapsed >= intervalMs;
}

// ─── Scheduler (setInterval-based, runs while app is open) ──
let schedulerTimer: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  stopScheduler();

  // Check immediately on start (handles "missed" notifications)
  if (isNotificationDue()) {
    showMotivationalNotification();
  }

  // Check every 60 seconds
  schedulerTimer = setInterval(() => {
    if (isNotificationDue()) {
      showMotivationalNotification();
    }
  }, 60_000);
}

export function stopScheduler(): void {
  if (schedulerTimer !== null) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
