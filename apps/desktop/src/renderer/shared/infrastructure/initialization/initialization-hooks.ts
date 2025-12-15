/**
 * Initialization Hooks - 初始化相关 React Hooks
 * 
 * @module renderer/shared/infrastructure/initialization
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ModuleState, InitializationProgressEvent, InitializationCompleteEvent } from './module-initializer';
import { InitializationStatus } from './module-initializer';
import { initializationState, subscribeToInitialization, getInitializationSnapshot } from './initialization-state';
import { initializationManager } from './initialization-manager';

// ============ Hooks ============

/**
 * 获取初始化状态
 * 
 * @example
 * ```typescript
 * const { isReady, hasFailures, progress, modules } = useInitialization();
 * if (!isReady) return <LoadingScreen progress={progress.percentage} />;
 * ```
 */
export function useInitialization(): {
  isReady: boolean;
  hasFailures: boolean;
  progress: { current: number; total: number; percentage: number };
  modules: ModuleState[];
  isInitializing: boolean;
  retry: () => Promise<void>;
} {
  const snapshot = useSyncExternalStore(
    subscribeToInitialization,
    getInitializationSnapshot
  );

  const retry = useCallback(async () => {
    await initializationManager.retryFailed();
  }, []);

  return {
    ...snapshot,
    isInitializing: initializationManager.isInitializing,
    retry,
  };
}

/**
 * 获取单个模块的初始化状态
 * 
 * @example
 * ```typescript
 * const { isReady, error } = useModuleInitialization('task');
 * ```
 */
export function useModuleInitialization(moduleName: string): {
  isReady: boolean;
  status: InitializationStatus;
  error: Error | undefined;
  initTime: number | undefined;
  initializeLazy: () => Promise<void>;
} {
  const snapshot = useSyncExternalStore(
    subscribeToInitialization,
    () => initializationState.getModuleState(moduleName)
  );

  const initializeLazy = useCallback(async () => {
    await initializationManager.initializeLazy(moduleName);
  }, [moduleName]);

  return {
    isReady: snapshot?.status === InitializationStatus.Initialized,
    status: snapshot?.status ?? InitializationStatus.Pending,
    error: snapshot?.error,
    initTime: snapshot?.initTime,
    initializeLazy,
  };
}

/**
 * 监听初始化进度
 * 
 * @example
 * ```typescript
 * useInitializationProgress((event) => {
 *   console.log(`${event.module}: ${event.status} (${event.current}/${event.total})`);
 * });
 * ```
 */
export function useInitializationProgress(
  callback: (event: InitializationProgressEvent) => void
): void {
  useEffect(() => {
    return initializationState.onProgress(callback);
  }, [callback]);
}

/**
 * 监听初始化完成
 * 
 * @example
 * ```typescript
 * useInitializationComplete((event) => {
 *   if (event.success) {
 *     console.log(`All modules initialized in ${event.duration}ms`);
 *   } else {
 *     console.error('Failed modules:', event.failed);
 *   }
 * });
 * ```
 */
export function useInitializationComplete(
  callback: (event: InitializationCompleteEvent) => void
): void {
  useEffect(() => {
    return initializationState.onComplete(callback);
  }, [callback]);
}

/**
 * 等待初始化完成后执行操作
 * 
 * @example
 * ```typescript
 * useWhenReady(() => {
 *   // 初始化完成后执行
 *   fetchInitialData();
 * });
 * ```
 */
export function useWhenReady(callback: () => void | Promise<void>): void {
  const { isReady } = useInitialization();

  useEffect(() => {
    if (isReady) {
      callback();
    }
  }, [isReady, callback]);
}

/**
 * 等待特定模块初始化完成后执行操作
 * 
 * @example
 * ```typescript
 * useWhenModuleReady('task', () => {
 *   // Task 模块初始化完成后执行
 *   loadTasks();
 * });
 * ```
 */
export function useWhenModuleReady(
  moduleName: string,
  callback: () => void | Promise<void>
): void {
  const { isReady } = useModuleInitialization(moduleName);

  useEffect(() => {
    if (isReady) {
      callback();
    }
  }, [isReady, callback]);
}

/**
 * 初始化进度百分比
 */
export function useInitializationProgress_Percentage(): number {
  const { progress } = useInitialization();
  return progress.percentage;
}

/**
 * 获取失败的模块列表
 */
export function useFailedModules(): ModuleState[] {
  const { modules } = useInitialization();
  return useMemo(
    () => modules.filter(m => m.status === InitializationStatus.Failed),
    [modules]
  );
}
