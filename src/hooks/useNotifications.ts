import { useState, useEffect, useCallback } from 'react';
import { usePWA } from './usePWA';

interface NotificationSettings {
  dailyCheckin: boolean;
  milestoneReminders: boolean;
  streakReminders: boolean;
  achievementUnlocks: boolean;
  checkinTime: string; // HH:MM format
  timezone: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyCheckin: true,
  milestoneReminders: true,
  streakReminders: true,
  achievementUnlocks: true,
  checkinTime: '20:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export const useNotifications = () => {
  const { requestNotificationPermission, sendNotification } = usePWA();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    // Get current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load saved settings
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
    }
    return granted;
  }, [requestNotificationPermission]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const scheduleDailyCheckin = useCallback(() => {
    if (!settings.dailyCheckin || permission !== 'granted') return;

    // Clear existing check-in notifications
    if ('serviceWorker' in navigator && 'getRegistrations' in navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.showNotification) {
            // This would be handled by the service worker
          }
        });
      });
    }

    // Schedule daily check-in notification
    const now = new Date();
    const [hours, minutes] = settings.checkinTime.split(':').map(Number);
    const checkinTime = new Date();
    checkinTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (checkinTime <= now) {
      checkinTime.setDate(checkinTime.getDate() + 1);
    }

    const timeUntilCheckin = checkinTime.getTime() - now.getTime();

    setTimeout(() => {
      sendNotification('Daily Check-in Reminder', {
        body: "Don't forget to check in and maintain your smoke-free streak! 🌟",
        tag: 'daily-checkin',
        requireInteraction: true
      });
    }, timeUntilCheckin);
  }, [settings.dailyCheckin, settings.checkinTime, permission, sendNotification]);

  const sendMilestoneNotification = useCallback((milestone: string, days: number) => {
    if (!settings.milestoneReminders || permission !== 'granted') return;

    sendNotification('Milestone Achieved! 🎉', {
      body: `Congratulations! You've reached ${milestone} - ${days} days smoke-free!`,
      tag: 'milestone',
      requireInteraction: true
    });
  }, [settings.milestoneReminders, permission, sendNotification]);

  const sendStreakReminder = useCallback((days: number) => {
    if (!settings.streakReminders || permission !== 'granted') return;

    const messages = [
      `Keep it up! You're ${days} days smoke-free! 💪`,
      `Amazing progress! ${days} days of clean air! 🌱`,
      `You're doing great! ${days} days strong! ⭐`,
      `Incredible! ${days} days smoke-free! 🚀`,
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    sendNotification('Streak Reminder', {
      body: randomMessage,
      tag: 'streak-reminder',
      requireInteraction: false,
    });
  }, [settings.streakReminders, permission, sendNotification]);

  const sendAchievementNotification = useCallback((achievement: string) => {
    if (!settings.achievementUnlocks || permission !== 'granted') return;

    sendNotification('New Achievement Unlocked! 🏆', {
      body: `You've unlocked: ${achievement}`,
      tag: 'achievement',
      requireInteraction: true
    });
  }, [settings.achievementUnlocks, permission, sendNotification]);

  const sendCustomNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    sendNotification(title, {
      body,
      ...options
    });
  }, [permission, sendNotification]);

  // Schedule notifications when settings change
  useEffect(() => {
    if (permission === 'granted') {
      scheduleDailyCheckin();
    }
  }, [permission, scheduleDailyCheckin]);

  return {
    isSupported,
    permission,
    settings,
    requestPermission,
    updateSettings,
    sendMilestoneNotification,
    sendStreakReminder,
    sendAchievementNotification,
    sendCustomNotification,
  };
};
