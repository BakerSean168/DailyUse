/**
 * Renderer Process Entry Point
 *
 * React 渲染进程入口
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Root element #app not found');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);