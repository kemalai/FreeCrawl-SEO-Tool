import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { LogsView } from './LogsView.js';
import './styles.css';

// The Logs popup window loads the same renderer bundle with `?logs=1` —
// we branch at the entry point so only the LogsView component mounts
// there (skipping the heavy main App, its stores, and IPC subscriptions).
const isLogsWindow =
  typeof window !== 'undefined' && /[?&]logs=1\b/.test(window.location.search);

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>{isLogsWindow ? <LogsView /> : <App />}</React.StrictMode>,
  );
}
