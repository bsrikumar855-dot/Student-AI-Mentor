import React from 'react';
import ReactDOM from 'react-dom/client';

// 1. Apple system font stack — no external font files needed
// SF Pro / SF Mono are loaded natively on macOS/iOS; Helvetica Neue is the graceful fallback
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
// 2. Custom Tailwind CSS v4 directives + design tokens
import './design/tokens.css';

import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>
);
