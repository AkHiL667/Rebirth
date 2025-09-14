import { useStreakTimer } from '@/hooks/useStreakTimer';
import { allAchievements, getUnlockedAchievements } from '@/data/achievements';
import { Trophy, Lock, CheckCircle, Heart } from 'lucide-react';

const Achievements = () => {
  const { streakData } = useStreakTimer();
  const unlockedAchievements = getUnlockedAchievements(streakData.totalDays);

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Journey</h2>
          <p className="text-muted-foreground">
            {unlockedAchievements.length} of {allAchievements.length} milestones achieved
          </p>
        </div>

        <div className="space-y-4">
          {allAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.some(a => a.day === achievement.day);
            
            return (
              <div
                key={achievement.day}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'achievement-unlocked hover-lift'
                    : 'achievement-locked'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    isUnlocked 
                      ? 'bg-white/20' 
                      : 'bg-muted'
                  }`}>
                    {isUnlocked ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        achievement.type === 'healing' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        Day {achievement.day}
                      </span>
                      {achievement.type === 'healing' && (
                        <Heart className="w-4 h-4 text-success" />
                      )}
                      {achievement.type === 'motivational' && (
                        <Trophy className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    
                    <h3 className={`font-semibold mb-1 ${
                      isUnlocked ? 'text-white' : 'text-foreground'
                    }`}>
                      {achievement.title}
                    </h3>
                    
                    {isUnlocked ? (
                      <p className="text-sm text-white/80">
                        {achievement.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Unlocks at Day {achievement.day}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Achievements;