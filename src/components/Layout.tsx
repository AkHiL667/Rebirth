import { ReactNode } from 'react';
import TopBar from './TopBar';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="relative">{children}</main>
      <Navigation />
    </div>
  );
};

export default Layout;