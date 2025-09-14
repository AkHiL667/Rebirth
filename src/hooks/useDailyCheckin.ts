import { useState, useEffect } from 'react';

export interface CheckinData {
  date: string; // YYYY-MM-DD format
  checkedIn: boolean;
  mood?: number; // 1-5 scale
  notes?: string;
  timestamp: number;
}

const STORAGE_KEY = 'rebirth_daily_checkins';

export const useDailyCheckin = () => {
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Initialize check-ins from localStorage
  useEffect(() => {
    const savedCheckins = localStorage.getItem(STORAGE_KEY);
    if (savedCheckins) {
      try {
        const parsedCheckins = JSON.parse(savedCheckins);
        setCheckins(parsedCheckins);
        
        // Check if user has checked in today
        const today = getTodayString();
        const todayCheckin = parsedCheckins.find(c => c.date === today);
        setTodayCheckedIn(!!todayCheckin?.checkedIn);
      } catch (error) {
        console.error('Error parsing saved check-ins:', error);
        setCheckins([]);
      }
    }
    setIsLoading(false);
  }, []);

  // Save check-ins to localStorage
  const saveCheckins = (newCheckins: CheckinData[]) => {
    setCheckins(newCheckins);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCheckins));
  };

  // Check in for today
  const checkInToday = (mood?: number, notes?: string) => {
    const today = getTodayString();
    const now = Date.now();
    
    // Remove any existing check-in for today
    const filteredCheckins = checkins.filter(c => c.date !== today);
    
    // Add new check-in
    const newCheckin: CheckinData = {
      date: today,
      checkedIn: true,
      mood,
      notes,
      timestamp: now
    };
    
    const updatedCheckins = [...filteredCheckins, newCheckin];
    saveCheckins(updatedCheckins);
    setTodayCheckedIn(true);
    
    return newCheckin;
  };

  // Get check-in streak (consecutive days)
  const getCheckinStreak = () => {
    if (checkins.length === 0) return 0;
    
    // Sort checkins by date (newest first)
    const sortedCheckins = [...checkins]
      .filter(c => c.checkedIn)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (sortedCheckins.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sortedCheckins.length; i++) {
      const checkinDate = new Date(sortedCheckins[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      // Check if this check-in is for the expected date
      if (checkinDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Get total check-ins
  const getTotalCheckins = () => {
    return checkins.filter(c => c.checkedIn).length;
  };

  // Get check-in for a specific date
  const getCheckinForDate = (date: string) => {
    return checkins.find(c => c.date === date);
  };

  // Get recent check-ins (last 7 days)
  const getRecentCheckins = (days = 7) => {
    const today = new Date();
    const recentCheckins = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const checkin = getCheckinForDate(dateString);
      recentCheckins.push({
        date: dateString,
        checkedIn: !!checkin?.checkedIn,
        mood: checkin?.mood,
        notes: checkin?.notes
      });
    }
    
    return recentCheckins;
  };

  // Get check-in statistics
  const getCheckinStats = () => {
    const totalCheckins = getTotalCheckins();
    const streak = getCheckinStreak();
    const recentCheckins = getRecentCheckins(30);
    const checkinRate = recentCheckins.length > 0 
      ? (recentCheckins.filter(c => c.checkedIn).length / recentCheckins.length) * 100 
      : 0;
    
    return {
      totalCheckins,
      streak,
      checkinRate: Math.round(checkinRate),
      recentCheckins
    };
  };

  return {
    checkins,
    todayCheckedIn,
    isLoading,
    checkInToday,
    getCheckinStreak,
    getTotalCheckins,
    getCheckinForDate,
    getRecentCheckins,
    getCheckinStats
  };
};
