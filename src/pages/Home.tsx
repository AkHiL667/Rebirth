import { useRef, useCallback } from 'react';
import StreakDisplay from '@/components/StreakDisplay';
import NextMilestone from '@/components/NextMilestone';
import DailyCheckin from '@/components/DailyCheckin';
import { useProgressSnapshot } from '@/components/ProgressSnapshot';
import { useToast } from '@/hooks/use-toast';

const Home = () => {
  const { generateSnapshot } = useProgressSnapshot();
  const { toast } = useToast();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressStart = useCallback(() => {
    pressTimer.current = setTimeout(() => {
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
      toast({ title: '📸 Generating snapshot...', duration: 1500 });
      setTimeout(() => generateSnapshot(), 200);
    }, 600);
  }, [generateSnapshot, toast]);

  const handlePressEnd = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  return (
    <div
      className="pt-20 pb-24 min-h-screen"
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="max-w-md mx-auto">
        <StreakDisplay />
        <DailyCheckin />
        <NextMilestone />
      </div>
    </div>
  );
};

export default Home;