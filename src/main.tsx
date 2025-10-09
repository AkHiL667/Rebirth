import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Ensure clients reload when a new service worker takes control to avoid stale app shell
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Avoid infinite reload loops: only reload once per change
    if ((window as any).__reloadingForSW__) return;
    (window as any).__reloadingForSW__ = true;
    window.location.reload();
  });
}