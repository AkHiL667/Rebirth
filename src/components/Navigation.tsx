import { User, Home, Trophy, Target } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/achievements', icon: Trophy, label: 'Achievements' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-card border-0 border-t border-white/20 rounded-none">
        <div className="flex justify-around items-center h-20 px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex flex-col items-center justify-center space-y-1 py-3 px-4 rounded-2xl transition-all duration-300 relative group
                  ${isActive 
                    ? 'nav-active bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                  }
                `}
              >
                <Icon 
                  size={22} 
                  className={`transition-all duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`} 
                />
                <span className={`
                  text-xs font-medium transition-all duration-300
                  ${isActive ? 'font-semibold' : ''}
                `}>
                  {label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;