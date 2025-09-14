import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopBar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border z-50">
      <div className="flex justify-between items-center h-16 px-4">
        <h1 className="text-xl font-bold text-primary">Breathe Free</h1>
        <Link
          to="/profile"
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <User size={24} className="text-primary" />
        </Link>
      </div>
    </header>
  );
};

export default TopBar;