import { useState, useEffect } from 'react';

export interface CustomStats {
  customCigarettesPerDay: number;
  costPerCigarette: number;
}

const STORAGE_KEY = 'rebirth_custom_stats';

export const useCustomStats = () => {
  const [customStats, setCustomStats] = useState<CustomStats>({
    customCigarettesPerDay: 10, // Default cigarettes per day
    costPerCigarette: 15, // Default cost per cigarette in rupees
  });

  // Initialize custom stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem(STORAGE_KEY);
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setCustomStats(parsedStats);
      } catch (error) {
        console.error('Error parsing saved custom stats:', error);
      }
    }
  }, []);

  const saveCustomStats = (newStats: CustomStats) => {
    setCustomStats(newStats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  };

  const updateCigarettesPerDay = (cigarettesPerDay: number) => {
    const newStats = { ...customStats, customCigarettesPerDay: cigarettesPerDay };
    saveCustomStats(newStats);
  };

  const updateCostPerCigarette = (costPerCigarette: number) => {
    const newStats = { ...customStats, costPerCigarette: costPerCigarette };
    saveCustomStats(newStats);
  };

  const resetToDefaults = () => {
    const defaultStats: CustomStats = {
      customCigarettesPerDay: 10,
      costPerCigarette: 15,
    };
    saveCustomStats(defaultStats);
  };

  // Calculate cigarettes avoided based on streak days
  const getCigarettesAvoided = (streakDays: number) => {
    return streakDays * customStats.customCigarettesPerDay;
  };

  // Calculate money saved based on streak days
  const getMoneySaved = (streakDays: number) => {
    return streakDays * customStats.customCigarettesPerDay * customStats.costPerCigarette;
  };

  return {
    customStats,
    updateCigarettesPerDay,
    updateCostPerCigarette,
    resetToDefaults,
    getCigarettesAvoided,
    getMoneySaved,
  };
};
