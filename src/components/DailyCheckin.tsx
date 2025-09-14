import { useState, useEffect } from 'react';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { CheckCircle, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DailyCheckin = () => {
  const { todayCheckedIn, checkInToday, getCheckinStreak, getCheckinStats } = useDailyCheckin();
  const { hapticSuccess, hapticSelection } = useHapticFeedback();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const stats = getCheckinStats();
  const streak = getCheckinStreak();

  const handleCheckIn = async () => {
    hapticSelection();
    setIsCheckingIn(true);
    
    // Add a small delay for better UX
    setTimeout(() => {
      checkInToday();
      hapticSuccess();
      setIsCheckingIn(false);
      setJustCheckedIn(true);
      setShowConfetti(true);
      
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 2000);
    }, 500);
  };

  // Reset justCheckedIn after component re-renders
  useEffect(() => {
    if (justCheckedIn) {
      const timer = setTimeout(() => setJustCheckedIn(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [justCheckedIn]);

  if (todayCheckedIn) {
    return (
      <div className="mx-4 mb-6">
        <div className={`glass-card rounded-3xl p-6 text-center relative overflow-hidden ${justCheckedIn ? 'animate-checkin-success' : ''}`}>
          <div className="shimmer absolute inset-0 pointer-events-none" />
          
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-achievement rounded-full animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '50%',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${1 + Math.random() * 0.5}s`
                  }}
                />
              ))}
            </div>
          )}
          
          <div className="relative">
            <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-success to-success-glow rounded-full flex items-center justify-center ${justCheckedIn ? 'animate-bounce-in' : 'animate-pulse-glow'}`}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-success mb-2 font-display">
              ✅ Checked In Today!
            </h3>
            
            <p className="text-muted-foreground mb-4">
              You're staying strong on your smoke-free journey!
            </p>
            
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {streak} day streak
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-achievement" />
                <span className="font-semibold text-foreground">
                  {stats.totalCheckins} total
                </span>
              </div>
            </div>
            
            {justCheckedIn && (
              <div className="mt-4 flex items-center justify-center space-x-1 text-achievement">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Great job!</span>
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-6">
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden hover-lift">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2 font-display">
            Daily Check-in
          </h3>
          
          <p className="text-muted-foreground mb-4">
            Confirm you stayed smoke-free today
          </p>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary font-display">
                {streak}
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-achievement font-display">
                {stats.totalCheckins}
              </div>
              <div className="text-xs text-muted-foreground">Total Check-ins</div>
            </div>
          </div>
          
          <Button 
            onClick={handleCheckIn}
            disabled={isCheckingIn}
            className="w-full bg-primary hover:bg-primary-light text-primary-foreground"
            size="lg"
          >
            {isCheckingIn ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Check In Today
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckin;
