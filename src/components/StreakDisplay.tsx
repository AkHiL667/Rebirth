import { useStreakTimer } from '@/hooks/useStreakTimer';

const StreakDisplay = () => {
  const { streakData } = useStreakTimer();

  return (
    <div className="text-center p-6 bg-card rounded-2xl shadow-soft border border-border/50 mx-4 mb-6">
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