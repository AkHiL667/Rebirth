import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Achievements from "./pages/Achievements";
import Score from "./pages/Goals";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import PWAInstallBanner from "./components/PWAInstallBanner";
import { usePWA } from "./hooks/usePWA";
import { useGestureNavigation } from "./hooks/useGestureNavigation";
import { useNotifications } from "./hooks/useNotifications";
import { useMotivationalNotifications } from "./hooks/useMotivationalNotifications";
import { CloudSyncProvider } from './hooks/useCloudSync';
import { useEffect } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isOnline } = usePWA();
  const { requestPermission } = useNotifications();
  
  // Initialize motivational notifications
  useMotivationalNotifications();
  
  // Initialize gesture navigation
  useGestureNavigation({
    enableSwipeNavigation: false,
    enablePullToRefresh: true,
    onPullToRefresh: () => {
      // Handle pull-to-refresh
      window.location.reload();
    },
  });

  // Request notification permission on app start
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-indicator visible">
          You're offline - data saved locally
        </div>
      )}
      
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/score" element={<Score />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/profile" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CloudSyncProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CloudSyncProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
