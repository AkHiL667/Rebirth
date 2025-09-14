import { useStreakTimer } from '@/hooks/useStreakTimer';
import { getNextAchievement } from '@/data/achievements';
import { Trophy, Clock, Target, Zap } from 'lucide-react';
import ProgressRing from './ProgressRing';

const NextMilestone = () => {
  const { streakData } = useStreakTimer();
  const nextAchievement = getNextAchievement(streakData.totalDays);

  if (!nextAchievement) {
    return (
      <div className="mx-4 mb-6">
        <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="shimmer absolute inset-0 pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-achievement to-achievement-glow rounded-full flex items-center justify-center animate-pulse-glow">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-achievement mb-3 font-display">
              🎉 Congratulations! 🎉
            </h3>
            <p className="text-muted-foreground text-lg">
              You've achieved all available milestones. You're absolutely incredible!
            </p>
            <div className="mt-6 inline-flex items-center space-x-2 bg-achievement/10 rounded-full px-4 py-2">
              <Zap className="w-4 h-4 text-achievement" />
              <span className="text-achievement font-semibold">Ultimate Champion</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = nextAchievement.day - streakData.totalDays;
  const hoursInCurrentDay = 24 - streakData.hours;
  const progressPercentage = Math.min((streakData.totalDays / nextAchievement.day) * 100, 100);
  
  return (
    <div className="mx-4 mb-6">
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden hover-lift">
        <div className="shimmer absolute inset-0 pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-primary to-primary-light rounded-xl shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground font-display">
                  Next Milestone
                </h3>
                <p className="text-sm text-muted-foreground">
                  Day {nextAchievement.day}
                </p>
              </div>
            </div>
            
            {/* Mini progress ring */}
            <ProgressRing percentage={progressPercentage} size={60} strokeWidth={6}>
              <div className="text-xs font-bold text-primary">
                {Math.round(progressPercentage)}%
              </div>
            </ProgressRing>
          </div>

          {/* Achievement details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold text-primary mb-2 font-display">
                {nextAchievement.title}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {nextAchievement.description}
              </p>
            </div>

            {/* Time remaining */}
            <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="font-semibold text-foreground">
                    {daysRemaining > 0
                      ? `${daysRemaining} days, ${hoursInCurrentDay} hours`
                      : `${hoursInCurrentDay} hours`}
                  </p>
                  <p className="text-sm text-muted-foreground">to unlock</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary font-display">
                  {nextAchievement.day - streakData.totalDays}
                </div>
                <div className="text-xs text-muted-foreground">days left</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextMilestone;