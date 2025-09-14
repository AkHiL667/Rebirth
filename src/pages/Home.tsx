import StreakDisplay from '@/components/StreakDisplay';
import NextMilestone from '@/components/NextMilestone';

const Home = () => {
  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-md mx-auto">
        <StreakDisplay />
        <NextMilestone />
      </div>
    </div>
  );
};

export default Home;