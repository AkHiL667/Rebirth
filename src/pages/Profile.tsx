import { useState, useEffect } from 'react';
import { useStreakTimer } from '@/hooks/useStreakTimer';
import { useUserName } from '@/hooks/useUserName';
import { useCustomStats } from '@/hooks/useCustomStats';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';
import { User, RotateCcw, AlertTriangle, Edit2, Calendar, Check, Settings, Download, Smartphone, CheckCircle, Cloud, RefreshCw, CloudOff, AlertCircle, CloudDownload, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import NotificationSettings from '@/components/NotificationSettings';
import { useCloudSync } from '@/hooks/useCloudSync';
import { gatherLocalState } from '@/services/cloudSync';

function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const Profile = () => {
  const { streakData, resetStreak, setCustomQuitDate } = useStreakTimer();
  const { userName, updateUserName } = useUserName();
  const { customStats, updateCigarettesPerDay, updateCostPerCigarette, updateBothStats, getCigarettesAvoided, getMoneySaved } = useCustomStats();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { toast } = useToast();
  const { isSyncing, lastSyncedAt, syncStatus, syncPending, syncNow, restoreNow, scheduleSync } = useCloudSync();
  const [isResetting, setIsResetting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingQuitDate, setIsEditingQuitDate] = useState(false);
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempQuitDate, setTempQuitDate] = useState('');
  const [tempCigarettesPerDay, setTempCigarettesPerDay] = useState('');
  const [tempCostPerCigarette, setTempCostPerCigarette] = useState('');
  const [dateError, setDateError] = useState('');
  const [statsError, setStatsError] = useState('');

  // Debug: Log when custom stats change
  useEffect(() => {
    console.log('Custom stats changed:', customStats);
  }, [customStats]);

  const { clearCheckins } = useDailyCheckin();

  // ─── All localStorage keys used by Rebirth ─────────────
  const ALL_KEYS = [
    'rebirth_quit_date',
    'rebirth_daily_checkins',
    'rebirth_daily_scores',
    'rebirth_user_goals',
    'rebirth_custom_stats',
    'rebirth_user_name',
    'rebirth_unlocked_achievements',
    'rebirth_rank_seen',
    'rebirth_expenses',
    'notification-settings',
  ];

  // ─── Start Over: archive current session with serial number, then reset ─
  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      // Find next serial number
      let maxSerial = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('rebirth_session_')) {
          const num = parseInt(k.replace('rebirth_session_', ''), 10);
          if (num > maxSerial) maxSerial = num;
        }
      }
      const nextSerial = maxSerial + 1;

      // Snapshot all current data into a numbered session
      const snapshot: Record<string, unknown> = { archivedAt: new Date().toISOString(), serial: nextSerial };
      for (const key of ALL_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          try { snapshot[key] = JSON.parse(val); } catch { snapshot[key] = val; }
        }
      }
      localStorage.setItem(`rebirth_session_${nextSerial}`, JSON.stringify(snapshot));

      // Reset to fresh state
      resetStreak();
      clearCheckins();
      localStorage.removeItem('rebirth_daily_scores');
      localStorage.removeItem('rebirth_rank_seen');
      localStorage.removeItem('rebirth_unlocked_achievements');
      localStorage.removeItem('rebirth_user_goals');
      setIsResetting(false);

      // Push updated state (with archive) to cloud
      scheduleSync();
    }, 500);
  };

  const handleNameEdit = () => {
    setTempName(userName);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    updateUserName(tempName);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName('');
    setIsEditingName(false);
  };

  const handleQuitDateEdit = () => {
    // Set the current quit date as the default value
    const currentDate = streakData.quitDate.toISOString().split('T')[0];
    setTempQuitDate(currentDate);
    setDateError('');
    setIsEditingQuitDate(true);
  };

  const handleQuitDateSave = () => {
    try {
      const newQuitDate = new Date(tempQuitDate);
      setCustomQuitDate(newQuitDate);
      setDateError('');
      setIsEditingQuitDate(false);
    } catch (error) {
      setDateError(error instanceof Error ? error.message : 'Invalid date');
    }
  };

  const handleQuitDateCancel = () => {
    setTempQuitDate('');
    setDateError('');
    setIsEditingQuitDate(false);
  };

  const handleStatsEdit = () => {
    setTempCigarettesPerDay(customStats.customCigarettesPerDay.toString());
    setTempCostPerCigarette(customStats.costPerCigarette.toString());
    setStatsError('');
    setIsEditingStats(true);
  };

  const handleStatsSave = () => {
    try {
      const cigarettesPerDay = parseInt(tempCigarettesPerDay) || 10;
      const costPerCigarette = parseInt(tempCostPerCigarette) || 15;

      console.log('Saving stats:', { cigarettesPerDay, costPerCigarette });

      if (cigarettesPerDay < 0 || costPerCigarette < 0) {
        throw new Error('Values cannot be negative');
      }

      // Update both values at once to avoid state race conditions
      updateBothStats(cigarettesPerDay, costPerCigarette);
      setStatsError('');
      setIsEditingStats(false);
      
      console.log('Stats saved successfully');
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Invalid values');
    }
  };

  const handleStatsCancel = () => {
    setTempCigarettesPerDay('');
    setTempCostPerCigarette('');
    setStatsError('');
    setIsEditingStats(false);
  };

  const handleInstallApp = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        toast({
          title: "App Installed! 🎉",
          description: "Rebirth has been successfully installed on your device.",
        });
      } else {
        toast({
          title: "Install from browser menu",
          description: "Use your browser menu to Install App / Add to Home Screen.",
        });
      }
    } catch (error) {
      console.error('Failed to install app:', error);
      toast({
        title: "Installation Failed",
        description: "Unable to install the app. Please try again or install manually from your browser menu.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleExportData = () => {
    const state = gatherLocalState();
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebirth-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: 'Your data has been downloaded as JSON.' });
  };

  const handleRestoreFromCloud = async () => {
    await restoreNow();
  };

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          
          {isEditingName ? (
            <div className="space-y-3">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter your name"
                className="text-center max-w-xs mx-auto"
                autoFocus
              />
              <div className="flex justify-center space-x-2">
                <Button onClick={handleNameSave} size="sm" className="bg-primary hover:bg-primary-light text-primary-foreground">
                  Save
                </Button>
                <Button onClick={handleNameCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {userName || 'Welcome!'}
                </h2>
                <Button 
                  onClick={handleNameEdit} 
                  variant="ghost" 
                  size="sm"
                  className="p-1 h-auto"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              <p className="text-muted-foreground">
                {userName ? 'Smoke-free warrior' : 'Click to add your name'}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Streak Summary */}
          <div className="p-6 bg-card rounded-2xl shadow-soft border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Current Streak</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{streakData.days}</div>
                <div className="text-sm text-muted-foreground">Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{streakData.hours}</div>
                <div className="text-sm text-muted-foreground">Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{streakData.minutes}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Journey started: {streakData.quitDate.toLocaleDateString()}
                </p>
                <Button 
                  onClick={handleQuitDateEdit} 
                  variant="ghost" 
                  size="sm"
                  className="p-1 h-auto"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quit Date Editor */}
          {isEditingQuitDate && (
            <div className="p-6 bg-card rounded-2xl shadow-soft border border-primary/20">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Set Quit Date</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                If you've already been smoke-free for a while, set your actual quit date to get accurate tracking.
              </p>
              
              <div className="space-y-3">
                <div>
                  <Input
                    type="date"
                    value={tempQuitDate}
                    onChange={(e) => setTempQuitDate(e.target.value)}
                    className="w-full"
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  />
                  {dateError && (
                    <p className="text-sm text-destructive mt-1">{dateError}</p>
                  )}
                </div>
                
                <div className="flex justify-center space-x-2">
                  <Button 
                    onClick={handleQuitDateSave} 
                    size="sm" 
                    className="bg-primary hover:bg-primary-light text-primary-foreground"
                    disabled={!tempQuitDate}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Update
                  </Button>
                  <Button onClick={handleQuitDateCancel} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="p-6 bg-card rounded-2xl shadow-soft border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Your Impact</h3>
              <Button 
                onClick={handleStatsEdit} 
                variant="ghost" 
                size="sm"
                className="p-1 h-auto"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cigarettes avoided</span>
                <span className="font-semibold text-foreground">
                  {getCigarettesAvoided(streakData.totalDays)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Money saved (₹{customStats.costPerCigarette}/cigarette)</span>
                <span className="font-semibold text-success">
                  ₹{getMoneySaved(streakData.totalDays)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days of life gained</span>
                <span className="font-semibold text-primary">
                  {Math.max(0, Math.round(streakData.days * 0.25))}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Editor */}
          {isEditingStats && (
            <div className="p-6 bg-card rounded-2xl shadow-soft border border-primary/20">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Customize Your Stats</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Set your smoking habits to calculate accurate daily savings. Values update automatically based on your streak.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Cigarettes per Day
                    </label>
                    <Input
                      type="number"
                      value={tempCigarettesPerDay}
                      onChange={(e) => setTempCigarettesPerDay(e.target.value)}
                      placeholder="10"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How many cigarettes you used to smoke daily
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Cost per Cigarette (₹)
                    </label>
                    <Input
                      type="number"
                      value={tempCostPerCigarette}
                      onChange={(e) => setTempCostPerCigarette(e.target.value)}
                      placeholder="15"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Cost of one cigarette
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Daily Calculation</h4>
                  <p className="text-xs text-muted-foreground">
                    Cigarettes avoided: <span className="font-semibold">{tempCigarettesPerDay || customStats.customCigarettesPerDay}</span> per day
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Money saved: <span className="font-semibold">₹{(parseInt(tempCigarettesPerDay) || customStats.customCigarettesPerDay) * (parseInt(tempCostPerCigarette) || customStats.costPerCigarette)}</span> per day
                  </p>
                </div>

                {statsError && (
                  <p className="text-sm text-destructive">{statsError}</p>
                )}
                
                <div className="flex justify-center space-x-2">
                  <Button 
                    onClick={handleStatsSave} 
                    size="sm" 
                    className="bg-primary hover:bg-primary-light text-primary-foreground"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button onClick={handleStatsCancel} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          <div className="p-6 bg-card rounded-2xl shadow-soft border border-border/50 mb-6">
            <NotificationSettings />
          </div>

          {/* Download App Section */}
          <div className="p-6 bg-card rounded-2xl shadow-soft border border-border/50 mb-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">Download App</h3>
                <p className="text-sm text-muted-foreground">
                  Install Rebirth on your device for a better experience with offline access and notifications.
                </p>
              </div>
            </div>
            
            {isInstalled ? (
              <div className="flex items-center space-x-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-sm text-success font-medium">
                  App is installed on your device
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <Button 
                  onClick={handleInstallApp}
                  disabled={isInstalling}
                  className="w-full bg-primary hover:bg-primary-light text-primary-foreground"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Install Rebirth App
                    </>
                  )}
                </Button>
                <div className="text-xs text-muted-foreground text-center">
                  <p>If the install button doesn't work, try:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Look for the install icon in your browser's address bar</li>
                    <li>• Use the browser menu (⋮) → "Install app"</li>
                    <li>• On mobile: "Add to Home Screen" from browser menu</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Cloud Sync */}
          <div className="p-6 bg-card rounded-2xl shadow-soft border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Cloud className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Cloud Sync</h3>
              </div>
              {syncStatus === 'synced' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
              {syncStatus === 'pending' && <AlertCircle className="w-4 h-4 text-amber-500" />}
              {syncStatus === 'failed' && <CloudOff className="w-4 h-4 text-red-500" />}
              {syncStatus === 'disabled' && <CloudOff className="w-4 h-4 text-muted-foreground" />}
            </div>

            <div className="mb-4">
              {syncStatus === 'disabled' && (
                <p className="text-sm text-muted-foreground">Supabase not configured. Add credentials to .env to enable cloud sync.</p>
              )}
              {syncStatus === 'synced' && lastSyncedAt && (
                <p className="text-sm text-emerald-600">
                  ✅ Synced {getRelativeTime(lastSyncedAt)}
                </p>
              )}
              {syncStatus === 'syncing' && (
                <p className="text-sm text-primary">🔄 Syncing...</p>
              )}
              {syncStatus === 'pending' && (
                <p className="text-sm text-amber-600">⚠️ Pending Changes</p>
              )}
              {syncStatus === 'failed' && (
                <p className="text-sm text-red-500">❌ Sync Failed</p>
              )}
              {syncStatus === 'idle' && !lastSyncedAt && (
                <p className="text-sm text-muted-foreground">Not synced yet.</p>
              )}
              {syncStatus === 'idle' && lastSyncedAt && (
                <p className="text-sm text-muted-foreground">
                  Last synced: {getRelativeTime(lastSyncedAt)}
                </p>
              )}
            </div>

            {syncStatus !== 'disabled' && (
              <div className="space-y-2">
                <Button
                  onClick={syncNow}
                  disabled={isSyncing}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleRestoreFromCloud}
                    disabled={isSyncing}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <CloudDownload className="w-3.5 h-3.5 mr-1.5" />
                    Restore From Cloud
                  </Button>
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <FileDown className="w-3.5 h-3.5 mr-1.5" />
                    Export Data
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Reset Section */}
          <div className="p-6 bg-card rounded-2xl shadow-soft border border-destructive/20">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Start Over</h3>
                <p className="text-sm text-muted-foreground">
                  Archive your current journey and begin fresh. Your old data is saved and included in backups.
                </p>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={isResetting}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {isResetting ? 'Resetting...' : 'Start Over'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm mx-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your current progress will be archived (included in backups). 
                    Streak resets to 0 and quit date becomes today. Your expenses and profile are kept.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                    Yes, Start Over
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;