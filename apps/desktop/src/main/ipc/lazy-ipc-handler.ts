/**
 * Lazy IPC Handler Wrapper
 * 
 * Provides utilities to create IPC handlers that trigger module loading on demand.
 * This supports the application's lazy loading strategy by ensuring modules are only
 * initialized when their IPC channels are accessed.
 *
 * @module ipc/lazy-ipc-handler
 */

import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { ensureModuleLoaded, isModuleLoaded } from '../di/lazy-module-loader';

/**
 * Type definition for a standard Electron IPC handler function.
 *
 * @template T The return type of the handler.
 */
type IpcHandler<T = unknown> = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<T>;

/**
 * Registers an IPC handler that lazily loads its associated module upon the first invocation.
 *
 * @template T The expected return type.
 * @param {string} channel - The IPC channel name.
 * @param {string} moduleName - The name of the module that owns this handler (must match a registered lazy module).
 * @param {IpcHandler<T>} handler - The actual handler function to execute.
 */
export function lazyHandle<T>(
  channel: string,
  moduleName: string,
  handler: IpcHandler<T>
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    // Ensure module is loaded
    if (!isModuleLoaded(moduleName)) {
      const startTime = performance.now();
      await ensureModuleLoaded(moduleName);
      console.log(
        `[LazyIPC] Module '${moduleName}' loaded on first call to '${channel}' (${(performance.now() - startTime).toFixed(2)}ms)`
      );
    }
    
    // Execute actual handler
    return handler(event, ...args);
  });
}

/**
 * Registers multiple lazy IPC handlers for a single module at once.
 *
 * @param {string} moduleName - The name of the module.
 * @param {Record<string, IpcHandler>} handlers - A map of channel names to handler functions.
 */
export function registerLazyHandlers(
  moduleName: string,
  handlers: Record<string, IpcHandler>
): void {
  for (const [channel, handler] of Object.entries(handlers)) {
    lazyHandle(channel, moduleName, handler);
  }
}

/**
 * Creates a registry object scoped to a specific module for defining lazy handlers.
 *
 * @param {string} moduleName - The name of the module.
 * @returns {Object} An object with methods to register single or multiple handlers for the module.
 */
export function createLazyModule(moduleName: string) {
  return {
    /**
     * Registers a single lazy handler.
     *
     * @param {string} channel - IPC channel.
     * @param {IpcHandler<T>} handler - Handler function.
     */
    handle<T>(channel: string, handler: IpcHandler<T>): void {
      lazyHandle(channel, moduleName, handler);
    },
    
    /**
     * Registers multiple handlers in batch.
     *
     * @param {Record<string, IpcHandler>} handlers - Map of handlers.
     */
    registerAll(handlers: Record<string, IpcHandler>): void {
      registerLazyHandlers(moduleName, handlers);
    },
  };
}
