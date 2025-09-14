import { useState, useEffect } from 'react';

export interface Goal {
  id: string;
  text: string;
  image: string;
  createdAt: Date;
}

const STORAGE_KEY = 'rebirth_user_goals';

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const savedGoals = localStorage.getItem(STORAGE_KEY);
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals).map((goal: any) => ({
          ...goal,
          createdAt: new Date(goal.createdAt)
        }));
        setGoals(parsedGoals);
      } catch (error) {
        console.error('Error parsing saved goals:', error);
        setGoals([]);
      }
    }
  }, []);

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
  };

  const addGoal = (text: string, image: string) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: text.trim(),
      image,
      createdAt: new Date()
    };
    
    const updatedGoals = [...goals, newGoal];
    saveGoals(updatedGoals);
  };

  const removeGoal = (id: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== id);
    saveGoals(updatedGoals);
  };

  return { goals, addGoal, removeGoal };
};