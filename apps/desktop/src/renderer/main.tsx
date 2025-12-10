/**
 * Renderer Process Entry Point
 *
 * Bootstraps the React application in the Electron renderer process.
 * Configures Dependency Injection (DI) using the exposed Electron API and mounts the root component.
 *
 * @module renderer/main
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureDesktopDependencies } from '@dailyuse/infrastructure-client';
import App from './App';
import './styles.css';

// Initialize DI configuration for the renderer process
// Uses the `electronAPI` exposed via the preload script (contextBridge)
if (window.electronAPI) {
  configureDesktopDependencies(window.electronAPI);
  console.log('[Renderer] DI configured with ElectronAPI');
} else {
  // Fallback or development mode behavior
  console.warn('[Renderer] ElectronAPI not available, running in browser mode');
}

// Ensure the root DOM element exists
const container = document.getElementById('app');
if (!container) {
  throw new Error('Root element #app not found');
}

// Mount the React application
const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
