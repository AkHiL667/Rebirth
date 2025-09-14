import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Show banner if app is installable and not already installed
    if (isInstallable && !isInstalled) {
      // Check if user has previously dismissed the banner
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to install app:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="glass-card rounded-2xl p-4 border border-primary/20 shadow-2xl">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Install Rebirth
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get quick access and a better experience on your home screen
            </p>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                size="sm"
                className="flex-1 bg-primary hover:bg-primary-light text-primary-foreground text-xs"
              >
                {isInstalling ? (
                  <>
                    <div className="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 mr-1" />
                    Install
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
