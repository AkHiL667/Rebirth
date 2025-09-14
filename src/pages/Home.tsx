import StreakDisplay from '@/components/StreakDisplay';
import NextMilestone from '@/components/NextMilestone';
import DailyCheckin from '@/components/DailyCheckin';

const Home = () => {
  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-md mx-auto">
        <StreakDisplay />
        <DailyCheckin />
        <NextMilestone />
      </div>
    </div>
  );
};

export default Home;