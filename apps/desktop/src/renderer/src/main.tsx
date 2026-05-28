import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { LogsView } from './LogsView.js';
import { VisualizationView } from './VisualizationView.js';
import './styles.css';
import './i18n/index.js';

// Popup windows load the same renderer bundle with a query flag so the
// entry point branches on which top-level component to mount. Keeps the
// heavy main App (its stores + IPC subscriptions) off the popups.
const search = typeof window !== 'undefined' ? window.location.search : '';
const isLogsWindow = /[?&]logs=1\b/.test(search);
const isVisualizationWindow = /[?&]visualization=1\b/.test(search);

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      {isLogsWindow ? (
        <LogsView />
      ) : isVisualizationWindow ? (
        <VisualizationView />
      ) : (
        <App />
      )}
    </React.StrictMode>,
  );
}
