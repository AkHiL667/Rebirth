import { useStreakTimer } from '@/hooks/useStreakTimer';
import { allAchievements, getUnlockedAchievements } from '@/data/achievements';
import { Trophy, Lock, CheckCircle, Heart, Zap, Award, Calendar } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import { useState, useEffect } from 'react';

const Achievements = () => {
  const { streakData } = useStreakTimer();
  const unlockedAchievements = getUnlockedAchievements(streakData.totalDays);
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    // Trigger card animations on load
    setTimeout(() => setAnimateCards(true), 300);
  }, []);

  const getAchievementIcon = (type: string, isUnlocked: boolean) => {
    if (type === 'healing') {
      return isUnlocked ? <Heart className="w-6 h-6 text-white" /> : <Heart className="w-6 h-6 text-muted-foreground" />;
    }
    return isUnlocked ? <Trophy className="w-6 h-6 text-white" /> : <Trophy className="w-6 h-6 text-muted-foreground" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'healing' 
      ? 'from-success to-success-glow' 
      : 'from-primary to-primary-light';
  };

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-md mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-achievement to-achievement-glow rounded-full flex items-center justify-center animate-pulse-glow">
              <Award className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-hero mb-4">Your Journey</h2>
          
          {/* Progress overview */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-8">
              <ProgressRing 
                percentage={(unlockedAchievements.length / allAchievements.length) * 100} 
                size={100} 
                strokeWidth={8}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-primary font-display">
                    {unlockedAchievements.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    of {allAchievements.length}
                  </div>
                </div>
              </ProgressRing>
              
              <div className="text-left">
                <div className="text-2xl font-bold text-primary mb-1 font-display">
                  {Math.round((unlockedAchievements.length / allAchievements.length) * 100)}%
                </div>
                <p className="text-muted-foreground text-sm">
                  Milestones Achieved
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Day {streakData.totalDays}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Cards */}
        <div className="space-y-4">
          {allAchievements.map((achievement, index) => {
            const isUnlocked = unlockedAchievements.some(a => a.day === achievement.day);
            
            return (
              <div
                key={achievement.day}
                className={`
                  transition-all duration-500 ease-out
                  ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
                  ${isUnlocked ? 'achievement-unlocked animate-celebration' : 'achievement-locked hover-lift'}
                `}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`
                  rounded-3xl p-6 border-2 relative overflow-hidden
                  ${isUnlocked 
                    ? 'border-transparent shadow-2xl' 
                    : 'border-border/30 backdrop-blur-sm'
                  }
                `}>
                  {/* Shimmer effect for unlocked achievements */}
                  {isUnlocked && (
                    <div className="shimmer absolute inset-0 pointer-events-none" />
                  )}
                  
                  <div className="relative flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`
                      p-4 rounded-2xl flex-shrink-0 transition-all duration-300
                      ${isUnlocked 
                        ? `bg-gradient-to-br ${getTypeColor(achievement.type)} shadow-lg` 
                        : 'bg-muted/50'
                      }
                    `}>
                      {isUnlocked ? (
                        <div className="relative">
                          {getAchievementIcon(achievement.type, true)}
                          <CheckCircle className="absolute -top-2 -right-2 w-4 h-4 text-white bg-success rounded-full" />
                        </div>
                      ) : (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`
                          text-xs px-3 py-1 rounded-full font-semibold
                          ${achievement.type === 'healing' 
                            ? isUnlocked ? 'bg-white/20 text-white' : 'bg-success/10 text-success'
                            : isUnlocked ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }
                        `}>
                          Day {achievement.day}
                        </span>
                        
                        <div className={`
                          w-2 h-2 rounded-full
                          ${achievement.type === 'healing' ? 'bg-success' : 'bg-primary'}
                          ${isUnlocked ? 'animate-pulse' : ''}
                        `} />
                        
                        {achievement.type === 'healing' && (
                          <Zap className={`w-4 h-4 ${isUnlocked ? 'text-white' : 'text-success'}`} />
                        )}
                      </div>
                      
                      {/* Title */}
                      <h3 className={`
                        font-bold mb-2 font-display
                        ${isUnlocked ? 'text-white text-xl' : 'text-foreground text-lg'}
                      `}>
                        {achievement.title}
                      </h3>
                      
                      {/* Description */}
                      {isUnlocked ? (
                        <p className="text-white/90 text-sm leading-relaxed">
                          {achievement.description}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          🔒 Unlocks at Day {achievement.day}
                        </p>
                      )}
                      
                      {/* Unlock indicator */}
                      {isUnlocked && (
                        <div className="mt-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span className="text-white/80 text-xs font-medium">
                            Achieved!
                          </span>
                        </div>
                      )}
                    </div>
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