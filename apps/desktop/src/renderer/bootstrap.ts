/**
 * App Bootstrap - 应用启动入口
 * 
 * 负责初始化所有模块和基础设施
 * 
 * @module renderer/bootstrap
 */

import {
  registerAllModules,
  initializeAllModules,
  disposeAllModules,
  initializationManager,
} from './shared/infrastructure';

import { initializationState } from './shared/infrastructure/initialization';
import type { ModuleState } from './shared/infrastructure/initialization';

/**
 * 初始化状态类型
 */
export interface InitializationState {
  isInitializing: boolean;
  isCompleted: boolean;
  progress: number;
  modules: Record<string, ModuleState>;
  totalDuration?: number;
}

/**
 * 启动配置选项
 */
export interface BootstrapOptions {
  /**
   * 初始化超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 是否在开发模式下启用详细日志
   */
  verbose?: boolean;

  /**
   * 初始化进度回调
   */
  onProgress?: (progress: number) => void;

  /**
   * 模块初始化完成回调
   */
  onModuleInitialized?: (moduleName: string) => void;

  /**
   * 初始化错误回调
   */
  onError?: (error: Error, moduleName?: string) => void;
}

/**
 * 应用启动结果
 */
export interface BootstrapResult {
  success: boolean;
  duration: number;
  modulesInitialized: string[];
  errors?: Array<{ module: string; error: Error }>;
}

/**
 * 启动应用
 * 
 * @param options - 启动配置
 * @returns 启动结果
 */
export async function bootstrap(options: BootstrapOptions = {}): Promise<BootstrapResult> {
  const {
    timeout = 30000,
    verbose = import.meta.env.DEV,
    onProgress,
    onModuleInitialized,
    onError,
  } = options;

  const startTime = Date.now();
  const modulesInitialized: string[] = [];
  const errors: Array<{ module: string; error: Error }> = [];

  if (verbose) {
    console.log('[Bootstrap] Starting application initialization...');
  }

  try {
    // Step 1: Register all modules
    if (verbose) {
      console.log('[Bootstrap] Step 1: Registering modules...');
    }
    registerAllModules();

    // Step 2: Initialize all modules with timeout
    if (verbose) {
      console.log('[Bootstrap] Step 2: Initializing modules...');
    }

    const initPromise = initializeAllModules();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Initialization timeout')), timeout);
    });

    await Promise.race([initPromise, timeoutPromise]);

    // Collect initialized modules
    const moduleStates = initializationState.getAllModuleStates();
    for (const moduleState of moduleStates) {
      if (moduleState.status === 'initialized') {
        modulesInitialized.push(moduleState.name);
        onModuleInitialized?.(moduleState.name);
      } else if (moduleState.status === 'failed' && moduleState.error) {
        errors.push({ module: moduleState.name, error: moduleState.error });
        onError?.(moduleState.error, moduleState.name);
      }
    }

    const duration = Date.now() - startTime;
    onProgress?.(100);

    if (verbose) {
      console.log(`[Bootstrap] Initialization completed in ${duration}ms`);
      console.log(`[Bootstrap] Modules initialized: ${modulesInitialized.length}`);
      if (errors.length > 0) {
        console.warn(`[Bootstrap] Modules with errors: ${errors.length}`);
      }
    }

    return {
      success: errors.length === 0,
      duration,
      modulesInitialized,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);

    if (verbose) {
      console.error('[Bootstrap] Initialization failed:', err);
    }

    return {
      success: false,
      duration: Date.now() - startTime,
      modulesInitialized,
      errors: [...errors, { module: 'bootstrap', error: err }],
    };
  }
}

/**
 * 关闭应用
 */
export async function shutdown(): Promise<void> {
  console.log('[Bootstrap] Shutting down application...');

  try {
    await disposeAllModules();
    console.log('[Bootstrap] Application shutdown complete');
  } catch (error) {
    console.error('[Bootstrap] Shutdown error:', error);
    throw error;
  }
}

/**
 * 检查应用是否已初始化
 */
export function isBootstrapped(): boolean {
  return initializationManager.isInitialized;
}

// Export types
export type { ModuleState };
