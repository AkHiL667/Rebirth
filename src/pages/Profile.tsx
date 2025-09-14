import { useState } from 'react';
import { useStreakTimer } from '@/hooks/useStreakTimer';
import { User, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Profile = () => {
  const { streakData, resetStreak } = useStreakTimer();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      resetStreak();
      setIsResetting(false);
    }, 500);
  };

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Profile</h2>
          <p className="text-muted-foreground">Smoke-free warrior</p>
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
              <p className="text-sm text-muted-foreground">
                Journey started: {streakData.quitDate.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="p-6 bg-card rounded-2xl shadow-soft border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Impact</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cigarettes avoided</span>
                <span className="font-semibold text-foreground">
                  {Math.max(0, streakData.days * 20)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Money saved (₹20/pack)</span>
                <span className="font-semibold text-success">
                  ₹{Math.max(0, streakData.days * 20)}
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

          {/* Reset Section */}
          <div className="p-6 bg-card rounded-2xl shadow-soft border border-destructive/20">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Start Over</h3>
                <p className="text-sm text-muted-foreground">
                  Reset your streak and begin a new journey. This will erase all progress and goals.
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
                    This will permanently erase all your progress, achievements, and goals. 
                    Your streak will reset to 0 and your quit date will be set to today.
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