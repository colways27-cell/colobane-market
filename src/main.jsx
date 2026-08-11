import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

// Auto-recovery for stale dynamic module imports & PWA cache mismatches
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('Loading chunk') || e.message.includes('Importing a module script failed') || e.message.includes('errorMsg'))) {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          for (let r of regs) r.unregister();
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (let k of keys) caches.delete(k);
        });
      }
    } catch (_err) {}
  }
});

const rootElement = document.getElementById('root') || (() => {
  const el = document.createElement('div');
  el.id = 'root';
  document.body.appendChild(el);
  return el;
})();

if (!window.__react_root__) {
  window.__react_root__ = createRoot(rootElement);
}

window.__react_root__.render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
