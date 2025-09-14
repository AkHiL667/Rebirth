import { useStreakTimer } from '@/hooks/useStreakTimer';
import { useUserName } from '@/hooks/useUserName';
import AnimatedCounter from './AnimatedCounter';
import ProgressRing from './ProgressRing';
import { Sparkles, Calendar } from 'lucide-react';

const StreakDisplay = () => {
  const { streakData } = useStreakTimer();
  const { userName } = useUserName();

  // Calculate progress to next day (0-100%)
  const progressToNextDay = (streakData.hours * 60 + streakData.minutes) / (24 * 60) * 100;

  return (
    <div className="relative mx-4 mb-8">
      {/* Floating background elements */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-float" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-secondary/10 rounded-full blur-xl animate-float-delayed" />
      
      <div className="glass-card-intense rounded-3xl p-8 relative overflow-hidden">
        {/* Shimmer effect */}
        <div className="shimmer absolute inset-0 pointer-events-none" />
        
        {userName && (
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <p className="text-lg text-muted-foreground">
                Hey <span className="font-semibold text-primary font-display">{userName}</span>!
              </p>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
          </div>
        )}

        {/* Main streak display with progress ring */}
        <div className="flex flex-col items-center space-y-6">
          <ProgressRing percentage={progressToNextDay} size={160} strokeWidth={12}>
            <div className="text-center">
              <div className="text-display text-primary mb-1">
                Day
              </div>
              <div className="streak-highlight">
                <AnimatedCounter value={streakData.days} />
              </div>
            </div>
          </ProgressRing>

          {/* Time breakdown */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary font-display">
                <AnimatedCounter value={streakData.days} />
              </div>
              <div className="text-sm text-muted-foreground font-medium">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary font-display">
                <AnimatedCounter value={streakData.hours} />
              </div>
              <div className="text-sm text-muted-foreground font-medium">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-achievement font-display">
                <AnimatedCounter value={streakData.minutes} />
              </div>
              <div className="text-sm text-muted-foreground font-medium">Minutes</div>
            </div>
          </div>

          {/* Motivational text */}
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-2 font-display">
              Smoke-Free Journey! 🌟
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Started {streakData.quitDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;