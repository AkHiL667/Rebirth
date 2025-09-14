import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHapticFeedback } from './useHapticFeedback';

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

interface GestureNavigationOptions {
  threshold?: number;
  velocityThreshold?: number;
  enableSwipeNavigation?: boolean;
  enablePullToRefresh?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => void;
}

const DEFAULT_OPTIONS: Required<GestureNavigationOptions> = {
  threshold: 50,
  velocityThreshold: 0.3,
  enableSwipeNavigation: true,
  enablePullToRefresh: true,
  onSwipeLeft: () => {},
  onSwipeRight: () => {},
  onSwipeUp: () => {},
  onSwipeDown: () => {},
  onPullToRefresh: () => {},
};

export const useGestureNavigation = (options: GestureNavigationOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticSelection } = useHapticFeedback();
  
  const config = { ...DEFAULT_OPTIONS, ...options };
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isPullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  // Navigation routes in order
  const navigationRoutes = ['/', '/achievements', '/goals', '/profile'];
  
  const getCurrentRouteIndex = useCallback(() => {
    return navigationRoutes.findIndex(route => location.pathname === route);
  }, [location.pathname]);

  const navigateToRoute = useCallback((index: number) => {
    const targetIndex = Math.max(0, Math.min(navigationRoutes.length - 1, index));
    const targetRoute = navigationRoutes[targetIndex];
    
    if (targetRoute !== location.pathname) {
      hapticSelection();
      navigate(targetRoute);
    }
  }, [navigate, location.pathname, hapticSelection]);

  const handleSwipeLeft = useCallback(() => {
    if (!config.enableSwipeNavigation) return;
    
    const currentIndex = getCurrentRouteIndex();
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < navigationRoutes.length) {
      navigateToRoute(nextIndex);
    }
  }, [config.enableSwipeNavigation, getCurrentRouteIndex, navigateToRoute]);

  const handleSwipeRight = useCallback(() => {
    if (!config.enableSwipeNavigation) return;
    
    const currentIndex = getCurrentRouteIndex();
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      navigateToRoute(prevIndex);
    }
  }, [config.enableSwipeNavigation, getCurrentRouteIndex, navigateToRoute]);

  const handleSwipeUp = useCallback(() => {
    config.onSwipeUp();
  }, [config.onSwipeUp]);

  const handleSwipeDown = useCallback(() => {
    config.onSwipeDown();
  }, [config.onSwipeDown]);

  const handlePullToRefresh = useCallback(() => {
    if (config.enablePullToRefresh) {
      hapticMedium();
      config.onPullToRefresh();
    }
  }, [config.enablePullToRefresh, config.onPullToRefresh]);

  const processSwipeGesture = useCallback((gesture: SwipeGesture) => {
    const { direction, distance, velocity } = gesture;
    
    // Check if gesture meets thresholds
    if (distance < config.threshold || velocity < config.velocityThreshold) {
      return;
    }

    switch (direction) {
      case 'left':
        handleSwipeLeft();
        break;
      case 'right':
        handleSwipeRight();
        break;
      case 'up':
        handleSwipeUp();
        break;
      case 'down':
        handleSwipeDown();
        break;
    }
  }, [config.threshold, config.velocityThreshold, handleSwipeLeft, handleSwipeRight, handleSwipeUp, handleSwipeDown]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    
    // Reset pull distance
    pullDistanceRef.current = 0;
    isPullingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Check for pull-to-refresh (only at top of page)
    if (window.scrollY === 0 && deltaY > 0) {
      isPullingRef.current = true;
      pullDistanceRef.current = deltaY;
      
      // Add visual feedback for pull-to-refresh
      const pullDistance = Math.min(deltaY, 100);
      document.body.style.transform = `translateY(${pullDistance * 0.3}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Reset pull-to-refresh visual feedback
    document.body.style.transform = '';
    
    if (isPullingRef.current && pullDistanceRef.current > 100) {
      handlePullToRefresh();
      return;
    }

    // Calculate swipe gesture
    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    
    let direction: 'left' | 'right' | 'up' | 'down';
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const gesture: SwipeGesture = {
      direction,
      distance,
      velocity,
      duration: deltaTime,
    };

    processSwipeGesture(gesture);
    
    // Reset refs
    touchStartRef.current = null;
    touchEndRef.current = null;
    isPullingRef.current = false;
    pullDistanceRef.current = 0;
  }, [processSwipeGesture, handlePullToRefresh]);

  useEffect(() => {
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    navigateToRoute,
    getCurrentRouteIndex,
    navigationRoutes,
  };
};
