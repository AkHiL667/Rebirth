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
    setCustomStats(prevStats => {
      const newStats = { ...prevStats, customCigarettesPerDay: cigarettesPerDay };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      return newStats;
    });
  };

  const updateCostPerCigarette = (costPerCigarette: number) => {
    setCustomStats(prevStats => {
      const newStats = { ...prevStats, costPerCigarette: costPerCigarette };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      return newStats;
    });
  };

  const updateBothStats = (cigarettesPerDay: number, costPerCigarette: number) => {
    console.log('updateBothStats called with:', { cigarettesPerDay, costPerCigarette });
    setCustomStats(prevStats => {
      const newStats = { 
        ...prevStats, 
        customCigarettesPerDay: cigarettesPerDay,
        costPerCigarette: costPerCigarette
      };
      console.log('Updating stats from:', prevStats, 'to:', newStats);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      return newStats;
    });
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
    updateBothStats,
    resetToDefaults,
    getCigarettesAvoided,
    getMoneySaved,
  };
};
