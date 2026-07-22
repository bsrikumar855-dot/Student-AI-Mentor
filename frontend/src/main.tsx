import React from 'react';
import ReactDOM from 'react-dom/client';

// 1. Apple system font stack — no external font files needed
// SF Pro / SF Mono are loaded natively on macOS/iOS; Helvetica Neue is the graceful fallback
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
// 2. Custom Tailwind CSS v4 directives + design tokens
import './design/tokens.css';

import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';

// 3. Asynchronously spin up MSW mock worker if environment flag is set
async function prepareApp() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    });
  }
  return Promise.resolve();
}

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </React.StrictMode>
  );
});
