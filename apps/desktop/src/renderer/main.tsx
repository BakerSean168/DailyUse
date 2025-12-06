/**
 * Renderer Process Entry Point
 *
 * React 渲染进程入口
 * 初始化 DI 配置后挂载应用
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureDesktopDependencies } from '@dailyuse/infrastructure-client';
import App from './App';
import './styles.css';

// 初始化渲染进程 DI 配置
// 使用 preload 脚本暴露的 electronAPI
if (window.electronAPI) {
  configureDesktopDependencies(window.electronAPI);
  console.log('[Renderer] DI configured with ElectronAPI');
} else {
  console.warn('[Renderer] ElectronAPI not available, running in browser mode');
}

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