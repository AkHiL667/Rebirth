import { useState, useEffect } from 'react';

const STORAGE_KEY = 'rebirth_user_name';

export const useUserName = () => {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEY);
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  const updateUserName = (name: string) => {
    const trimmedName = name.trim();
    setUserName(trimmedName);
    if (trimmedName) {
      localStorage.setItem(STORAGE_KEY, trimmedName);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { userName, updateUserName };
};