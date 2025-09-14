import { useStreakTimer } from '@/hooks/useStreakTimer';
import { getNextAchievement } from '@/data/achievements';
import { Trophy, Clock } from 'lucide-react';

const NextMilestone = () => {
  const { streakData } = useStreakTimer();
  const nextAchievement = getNextAchievement(streakData.totalDays);

  if (!nextAchievement) {
    return (
      <div className="mx-4 mb-6 p-6 bg-card rounded-2xl shadow-soft border border-achievement/20">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-achievement mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-achievement mb-2">
            Congratulations!
          </h3>
          <p className="text-muted-foreground">
            You've achieved all available milestones. Keep up the amazing work!
          </p>
        </div>
      </div>
    );
  }

  const daysRemaining = nextAchievement.day - streakData.totalDays;
  const hoursInCurrentDay = 24 - streakData.hours;
  
  return (
    <div className="mx-4 mb-6 p-6 bg-card rounded-2xl shadow-soft border border-primary/20 hover-lift">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Next Milestone
          </h3>
          <h4 className="font-medium text-primary mb-2">
            Day {nextAchievement.day} - {nextAchievement.title}
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            {nextAchievement.description}
          </p>
          <div className="flex items-center space-x-2 text-sm text-primary">
            <Clock size={16} />
            <span className="font-medium">
              {daysRemaining > 0
                ? `${daysRemaining} days and ${hoursInCurrentDay} hours to go!`
                : `${hoursInCurrentDay} hours to go!`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextMilestone;