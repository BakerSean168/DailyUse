/**
 * EPIC-003: Lazy IPC Handler Wrapper
 * 
 * 为懒加载模块创建 IPC handler 包装器
 * 在首次调用时自动加载模块
 */

import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { ensureModuleLoaded, isModuleLoaded } from '../di/lazy-module-loader';

type IpcHandler<T = unknown> = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<T>;

/**
 * 创建懒加载 IPC handler
 * 在首次调用时自动加载对应模块
 */
export function lazyHandle<T>(
  channel: string,
  moduleName: string,
  handler: IpcHandler<T>
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    // 确保模块已加载
    if (!isModuleLoaded(moduleName)) {
      const startTime = performance.now();
      await ensureModuleLoaded(moduleName);
      console.log(
        `[LazyIPC] Module '${moduleName}' loaded on first call to '${channel}' (${(performance.now() - startTime).toFixed(2)}ms)`
      );
    }
    
    // 执行实际 handler
    return handler(event, ...args);
  });
}

/**
 * 批量注册懒加载 IPC handlers
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
 * 创建模块感知的 IPC handler 注册器
 */
export function createLazyModule(moduleName: string) {
  return {
    /**
     * 注册单个懒加载 handler
     */
    handle<T>(channel: string, handler: IpcHandler<T>): void {
      lazyHandle(channel, moduleName, handler);
    },
    
    /**
     * 批量注册 handlers
     */
    registerAll(handlers: Record<string, IpcHandler>): void {
      registerLazyHandlers(moduleName, handlers);
    },
  };
}
