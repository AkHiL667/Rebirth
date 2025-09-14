import { useStreakTimer } from '@/hooks/useStreakTimer';
import { useUserName } from '@/hooks/useUserName';

const StreakDisplay = () => {
  const { streakData } = useStreakTimer();
  const { userName } = useUserName();

  return (
    <div className="text-center p-6 bg-card rounded-2xl shadow-lg border border-border/50 mx-4 mb-6">
      {userName && (
        <p className="text-lg text-muted-foreground mb-3">
          Hey <span className="font-semibold text-primary">{userName}</span>! 👋
        </p>
      )}
      <div className="mb-4">
        <p className="text-lg text-muted-foreground mb-2">
          You are{' '}
          <span className="streak-highlight">{streakData.days}</span> days,{' '}
          <span className="streak-highlight">{streakData.hours}</span> hours, and{' '}
          <span className="streak-highlight">{streakData.minutes}</span> minutes
        </p>
        <p className="text-2xl font-bold text-primary">smoke-free!</p>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Your journey began on:{' '}
        <span className="font-medium text-foreground">
          {streakData.quitDate.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default StreakDisplay;