import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isServiceWorkerReady: false,
    installPrompt: null,
  });

  useEffect(() => {
    // Check if app is installed
    const checkIfInstalled = () => {
      const isInstalled = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setPwaState(prev => ({ ...prev, isInstalled }));
    };

    // Handle online/offline status
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });
          console.log('Service Worker registered successfully:', registration);
          
          setPwaState(prev => ({ ...prev, isServiceWorkerReady: true }));

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  console.log('New content available! Please refresh.');
                }
              });
            }
          });
        } catch (error) {
          console.error('Service Worker registration failed:', error);
          // Even if service worker fails, mark as ready for PWA functionality
          setPwaState(prev => ({ ...prev, isServiceWorkerReady: true }));
        }
      } else {
        // No service worker support, but still allow PWA functionality
        setPwaState(prev => ({ ...prev, isServiceWorkerReady: true }));
      }
    };

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({ 
        ...prev, 
        isInstallable: true, 
        installPrompt: e as BeforeInstallPromptEvent 
      }));
    };

    // Check installation status
    checkIfInstalled();

    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register service worker
    registerServiceWorker();

    // Check installability after a short delay to ensure everything is loaded
    setTimeout(checkInstallability, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Install the app
  const installApp = async (): Promise<boolean> => {
    if (pwaState.installPrompt) {
      try {
        await pwaState.installPrompt.prompt();
        const choiceResult = await pwaState.installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          setPwaState(prev => ({ 
            ...prev, 
            isInstallable: false, 
            installPrompt: null,
            isInstalled: true 
          }));
          return true;
        }
      } catch (error) {
        console.error('Failed to install app:', error);
      }
    }
    
    // Fallback: Show manual installation instructions
    return false;
  };

  // Check if app can be installed (even without beforeinstallprompt)
  const checkInstallability = () => {
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    const hasServiceWorker = pwaState.isServiceWorkerReady;
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    const hasIcons = document.querySelector('link[rel="icon"]') !== null;
    
    // Consider app installable if basic PWA requirements are met
    const canInstall = hasManifest && hasServiceWorker && isHTTPS && hasIcons;
    
    if (canInstall && !pwaState.isInstalled) {
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    }
  };

  // Request notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  // Send notification
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/Rebirth_icon.png',
        badge: '/Rebirth_icon.png',
        ...options
      });
    }
  };

  return {
    ...pwaState,
    installApp,
    requestNotificationPermission,
    sendNotification,
    checkInstallability,
  };
};
