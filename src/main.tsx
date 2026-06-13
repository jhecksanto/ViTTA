import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Enforce UTC-03:00 (Brasília) Timezone and pt-BR locale for all JS Date localizations on client-side
const originalToLocaleString = Date.prototype.toLocaleString;
Date.prototype.toLocaleString = function(locales?: any, options?: any) {
  const opts = { timeZone: 'America/Sao_Paulo', ...options };
  return originalToLocaleString.call(this, locales || 'pt-BR', opts);
};

const originalToLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function(locales?: any, options?: any) {
  const opts = { timeZone: 'America/Sao_Paulo', ...options };
  return originalToLocaleDateString.call(this, locales || 'pt-BR', opts);
};

const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
Date.prototype.toLocaleTimeString = function(locales?: any, options?: any) {
  const opts = { timeZone: 'America/Sao_Paulo', ...options };
  return originalToLocaleTimeString.call(this, locales || 'pt-BR', opts);
};

import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { registerServiceWorker } from './lib/swRegistration';
import './index.css';

// Register Service Worker for PWA features
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
