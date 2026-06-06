import { useEffect, useCallback, useState } from 'react';
import {
  isMotivationalEnabled,
  setMotivationalEnabled,
  getIntervalHours,
  setIntervalHours as persistInterval,
  requestNotifPermission,
  startScheduler,
  stopScheduler,
  showMotivationalNotification,
} from '@/services/notificationService';

export function useMotivationalNotifications() {
  const [enabled, setEnabled] = useState(isMotivationalEnabled);
  const [intervalHours, setIntervalHoursState] = useState(getIntervalHours);

  // Start / stop scheduler based on enabled state
  useEffect(() => {
    if (enabled && Notification.permission === 'granted') {
      startScheduler();
    } else {
      stopScheduler();
    }
    return () => stopScheduler();
  }, [enabled, intervalHours]);

  // Handle visibility change — fire missed notification when app becomes active
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        // Restart scheduler which checks immediately if a notification is due
        startScheduler();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enabled]);

  const toggle = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await requestNotifPermission();
      if (!granted) return;
    }
    setMotivationalEnabled(value);
    setEnabled(value);
  }, []);

  const changeInterval = useCallback((hours: number) => {
    persistInterval(hours);
    setIntervalHoursState(hours);
  }, []);

  const sendTestNotification = useCallback(() => {
    showMotivationalNotification();
  }, []);

  return {
    enabled,
    intervalHours,
    toggle,
    changeInterval,
    sendTestNotification,
  };
}
