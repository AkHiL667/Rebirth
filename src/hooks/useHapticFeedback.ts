import { useCallback } from 'react';

interface HapticPattern {
  light: number[];
  medium: number[];
  heavy: number[];
  success: number[];
  error: number[];
  warning: number[];
  selection: number[];
}

const HAPTIC_PATTERNS: HapticPattern = {
  light: [10],
  medium: [20],
  heavy: [50],
  success: [50, 50, 50],
  error: [100, 50, 100],
  warning: [50, 100, 50],
  selection: [10],
};

export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[]): boolean => {
    // Check if vibration is supported
    if (!('vibrate' in navigator)) {
      console.log('Vibration not supported on this device');
      return false;
    }

    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.error('Vibration failed:', error);
      return false;
    }
  }, []);

  const hapticLight = useCallback(() => {
    return vibrate(HAPTIC_PATTERNS.light);
  }, [vibrate]);

  const hapticMedium = useCallback(() => {
    return vibrate(HAPTIC_PATTERNS.medium);
  }, [vibrate]);

  const hapticHeavy = useCallback(() => {
    return vibrate(HAPTIC_PATTERNS.heavy);
  }, [vibrate]);

  const hapticSuccess = useCallback(() => {
    return vibrate(HAPTIC_PATTERNS.success);
  }, [vibrate]);

  const hapticError = useCallback(() => {
    return vibrate(HAPTIC_PATTERNS.error);
  }, [vibrate]);

  const hapticWarning = useCallback(() => {
    return vibrate(HAPTIC_PATTERNS.warning);
  }, [vibrate]);

  const hapticSelection = useCallback(() => {
    return vibrate(HAPTIC_PATTERNS.selection);
  }, [vibrate]);

  const hapticCustom = useCallback((pattern: number | number[]) => {
    return vibrate(pattern);
  }, [vibrate]);

  return {
    hapticLight,
    hapticMedium,
    hapticHeavy,
    hapticSuccess,
    hapticError,
    hapticWarning,
    hapticSelection,
    hapticCustom,
    isSupported: 'vibrate' in navigator,
  };
};
