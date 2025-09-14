import { User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopBar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card border-0 border-b border-white/20 rounded-none">
        <div className="flex justify-between items-center h-16 px-6">
          {/* Logo with gradient text */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary font-display">
              Rebirth
            </h1>
          </div>
          
          {/* Profile button */}
          <Link
            to="/profile"
            className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 hover-bounce border border-white/20"
          >
            <User size={20} className="text-primary" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopBar;