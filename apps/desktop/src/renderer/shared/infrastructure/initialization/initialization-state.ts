/**
 * Initialization State - 初始化状态管理
 * 
 * @module renderer/shared/infrastructure/initialization
 */

import type { ModuleState, InitializationProgressEvent, InitializationCompleteEvent } from './module-initializer';
import { InitializationStatus, InitializationPriority } from './module-initializer';

// ============ State Store ============

type StateListener = () => void;

/**
 * 初始化状态存储
 */
class InitializationStateStore {
  private modules: Map<string, ModuleState> = new Map();
  private listeners: Set<StateListener> = new Set();
  private progressListeners: Set<(event: InitializationProgressEvent) => void> = new Set();
  private completeListeners: Set<(event: InitializationCompleteEvent) => void> = new Set();

  /**
   * 注册模块
   */
  registerModule(
    name: string,
    priority: InitializationPriority,
    dependencies: string[] = [],
    lazy = false
  ): void {
    this.modules.set(name, {
      name,
      status: InitializationStatus.Pending,
      priority,
      dependencies,
      lazy,
    });
    this.notifyListeners();
  }

  /**
   * 更新模块状态
   */
  updateModuleStatus(
    name: string,
    status: InitializationStatus,
    error?: Error,
    initTime?: number
  ): void {
    const module = this.modules.get(name);
    if (module) {
      module.status = status;
      module.error = error;
      module.initTime = initTime;
      this.notifyListeners();
      this.notifyProgress(name, status, error);
    }
  }

  /**
   * 获取模块状态
   */
  getModuleState(name: string): ModuleState | undefined {
    return this.modules.get(name);
  }

  /**
   * 获取所有模块状态
   */
  getAllModuleStates(): ModuleState[] {
    return Array.from(this.modules.values());
  }

  /**
   * 检查是否所有模块都已初始化
   */
  isAllInitialized(): boolean {
    for (const module of this.modules.values()) {
      if (!module.lazy && module.status !== InitializationStatus.Initialized) {
        return false;
      }
    }
    return true;
  }

  /**
   * 检查是否有模块初始化失败
   */
  hasFailures(): boolean {
    for (const module of this.modules.values()) {
      if (module.status === InitializationStatus.Failed) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取失败的模块
   */
  getFailedModules(): ModuleState[] {
    return Array.from(this.modules.values()).filter(
      m => m.status === InitializationStatus.Failed
    );
  }

  /**
   * 获取已初始化的模块
   */
  getInitializedModules(): ModuleState[] {
    return Array.from(this.modules.values()).filter(
      m => m.status === InitializationStatus.Initialized
    );
  }

  /**
   * 获取待初始化的模块（按优先级排序）
   */
  getPendingModules(): ModuleState[] {
    return Array.from(this.modules.values())
      .filter(m => m.status === InitializationStatus.Pending && !m.lazy)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * 获取初始化进度
   */
  getProgress(): { current: number; total: number; percentage: number } {
    const nonLazyModules = Array.from(this.modules.values()).filter(m => !m.lazy);
    const total = nonLazyModules.length;
    const current = nonLazyModules.filter(
      m => m.status === InitializationStatus.Initialized || m.status === InitializationStatus.Failed
    ).length;
    
    return {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 100,
    };
  }

  /**
   * 重置所有状态
   */
  reset(): void {
    for (const module of this.modules.values()) {
      module.status = InitializationStatus.Pending;
      module.error = undefined;
      module.initTime = undefined;
    }
    this.notifyListeners();
  }

  /**
   * 清除所有模块
   */
  clear(): void {
    this.modules.clear();
    this.notifyListeners();
  }

  // ============ Subscription ============

  /**
   * 订阅状态变化
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 订阅进度事件
   */
  onProgress(listener: (event: InitializationProgressEvent) => void): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  /**
   * 订阅完成事件
   */
  onComplete(listener: (event: InitializationCompleteEvent) => void): () => void {
    this.completeListeners.add(listener);
    return () => this.completeListeners.delete(listener);
  }

  /**
   * 触发完成事件
   */
  emitComplete(duration: number): void {
    const failed = this.getFailedModules().map(m => m.name);
    const initialized = this.getInitializedModules().map(m => m.name);
    
    const event: InitializationCompleteEvent = {
      success: failed.length === 0,
      duration,
      failed,
      initialized,
    };

    for (const listener of this.completeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[InitializationState] Complete listener error:', error);
      }
    }
  }

  // ============ Private ============

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('[InitializationState] Listener error:', error);
      }
    }
  }

  private notifyProgress(name: string, status: InitializationStatus, error?: Error): void {
    const progress = this.getProgress();
    const event: InitializationProgressEvent = {
      module: name,
      status,
      current: progress.current,
      total: progress.total,
      error,
    };

    for (const listener of this.progressListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[InitializationState] Progress listener error:', err);
      }
    }
  }
}

// ============ Singleton Export ============

export const initializationState = new InitializationStateStore();

// ============ React Integration ============

/**
 * 获取状态快照（用于 useSyncExternalStore）
 */
export function getInitializationSnapshot(): {
  isReady: boolean;
  hasFailures: boolean;
  progress: { current: number; total: number; percentage: number };
  modules: ModuleState[];
} {
  return {
    isReady: initializationState.isAllInitialized(),
    hasFailures: initializationState.hasFailures(),
    progress: initializationState.getProgress(),
    modules: initializationState.getAllModuleStates(),
  };
}

/**
 * 订阅初始化状态（用于 useSyncExternalStore）
 */
export function subscribeToInitialization(callback: () => void): () => void {
  return initializationState.subscribe(callback);
}
