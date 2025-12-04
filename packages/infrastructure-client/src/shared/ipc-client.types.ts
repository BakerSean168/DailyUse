/**
 * IPC Client Types
 *
 * Type definitions for Electron IPC communication.
 */

/**
 * Electron API exposed via contextBridge
 */
export interface ElectronAPI {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  on(channel: string, callback: (...args: unknown[]) => void): void;
  off(channel: string, callback: (...args: unknown[]) => void): void;
}

/**
 * IPC Client Interface
 *
 * Wrapper around Electron's IPC for type-safe communication.
 */
export interface IpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

/**
 * Get Electron API from window
 */
export function getElectronAPI(): ElectronAPI | undefined {
  // @ts-expect-error - Electron's contextBridge exposes this
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

/**
 * Create IPC Client
 */
export function createIpcClient(): IpcClient {
  const api = getElectronAPI();
  
  return {
    invoke: async <T>(channel: string, ...args: unknown[]): Promise<T> => {
      if (!api) {
        throw new Error('Electron API not available. Are you running in Electron?');
      }
      return api.invoke<T>(channel, ...args);
    },
  };
}
