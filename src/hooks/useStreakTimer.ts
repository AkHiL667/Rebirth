import { useState, useEffect } from 'react';

export interface StreakData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number; // For achievement calculations
  quitDate: Date;
}

const STORAGE_KEY = 'rebirth_quit_date';

export const useStreakTimer = () => {
  const [streakData, setStreakData] = useState<StreakData>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 0,
    quitDate: new Date()
  });

  // Initialize quit date from localStorage or set to now
  useEffect(() => {
    const savedQuitDate = localStorage.getItem(STORAGE_KEY);
    const quitDate = savedQuitDate ? new Date(savedQuitDate) : new Date();
    
    if (!savedQuitDate) {
      localStorage.setItem(STORAGE_KEY, quitDate.toISOString());
    }

    const updateStreak = () => {
      const now = new Date();
      const timeDiff = now.getTime() - quitDate.getTime();
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setStreakData({
        days,
        hours,
        minutes,
        seconds,
        totalDays: days,
        quitDate
      });
    };

    updateStreak();
    const interval = setInterval(updateStreak, 1000);

    return () => clearInterval(interval);
  }, []);

  const resetStreak = () => {
    const newQuitDate = new Date();
    localStorage.setItem(STORAGE_KEY, newQuitDate.toISOString());
    
    // Clear other data
    localStorage.removeItem('rebirth_unlocked_achievements');
    localStorage.removeItem('rebirth_user_goals');
    
    setStreakData({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      quitDate: newQuitDate
    });
  };

  return { streakData, resetStreak };
};