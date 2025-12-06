/**
 * Electron API Type Declarations
 *
 * 为渲染进程提供类型安全的 electronAPI 访问
 */

import type { ElectronAPI } from '../preload/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
