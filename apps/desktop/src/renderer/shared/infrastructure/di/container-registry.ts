/**
 * Container Registry - DI 容器中央注册表
 * 
 * @module renderer/shared/infrastructure/di
 */

import type { IContainerRegistry, IModuleContainer } from './types';
import { ContainerError } from './renderer-container';

/**
 * 容器注册表实现
 */
class ContainerRegistryImpl implements IContainerRegistry {
  private modules: Map<string, IModuleContainer> = new Map();
  private initializationOrder: string[] = [];
  private _isInitialized = false;

  /**
   * 注册模块容器
   */
  registerModule(container: IModuleContainer): void {
    const name = container.moduleName;
    
    if (this.modules.has(name)) {
      console.warn(`[ContainerRegistry] Module '${name}' already registered, overwriting...`);
    }

    this.modules.set(name, container);
    
    // 记录注册顺序
    if (!this.initializationOrder.includes(name)) {
      this.initializationOrder.push(name);
    }

    if (import.meta.env.DEV) {
      console.log(`[ContainerRegistry] Module '${name}' registered`);
    }
  }

  /**
   * 获取模块容器
   */
  getModule<T extends IModuleContainer>(name: string): T {
    const module = this.modules.get(name);
    
    if (!module) {
      throw new ContainerError(`Module '${name}' not found in registry`);
    }

    return module as T;
  }

  /**
   * 尝试获取模块容器（不抛出异常）
   */
  tryGetModule<T extends IModuleContainer>(name: string): T | undefined {
    return this.modules.get(name) as T | undefined;
  }

  /**
   * 检查模块是否存在
   */
  hasModule(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * 获取所有模块名称
   */
  getModuleNames(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * 设置初始化顺序
   */
  setInitializationOrder(order: string[]): void {
    this.initializationOrder = order;
  }

  /**
   * 初始化所有模块
   */
  async initializeAll(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    const startTime = performance.now();
    const errors: { module: string; error: Error }[] = [];

    // 按照注册顺序初始化
    for (const moduleName of this.initializationOrder) {
      const module = this.modules.get(moduleName);
      if (!module) continue;

      try {
        if (!module.isInitialized) {
          await module.initialize();
        }
      } catch (error) {
        errors.push({ 
          module: moduleName, 
          error: error instanceof Error ? error : new Error(String(error)) 
        });
        console.error(`[ContainerRegistry] Failed to initialize module '${moduleName}':`, error);
      }
    }

    this._isInitialized = true;

    const duration = performance.now() - startTime;
    if (import.meta.env.DEV) {
      console.log(`[ContainerRegistry] All modules initialized in ${duration.toFixed(1)}ms`);
      if (errors.length > 0) {
        console.warn(`[ContainerRegistry] ${errors.length} module(s) failed to initialize:`, 
          errors.map(e => e.module)
        );
      }
    }

    // 如果有错误，抛出聚合错误
    if (errors.length > 0) {
      const aggregateError = new Error(
        `${errors.length} module(s) failed to initialize: ${errors.map(e => e.module).join(', ')}`
      ) as Error & { errors: Error[] };
      aggregateError.errors = errors.map(e => e.error);
      throw aggregateError;
    }
  }

  /**
   * 初始化指定模块
   */
  async initializeModule(name: string): Promise<void> {
    const module = this.getModule(name);
    if (!module.isInitialized) {
      await module.initialize();
    }
  }

  /**
   * 销毁所有模块
   */
  disposeAll(): void {
    // 逆序销毁
    const reverseOrder = [...this.initializationOrder].reverse();
    
    for (const moduleName of reverseOrder) {
      const module = this.modules.get(moduleName);
      if (module) {
        try {
          module.dispose();
        } catch (error) {
          console.error(`[ContainerRegistry] Failed to dispose module '${moduleName}':`, error);
        }
      }
    }

    this.modules.clear();
    this.initializationOrder = [];
    this._isInitialized = false;

    if (import.meta.env.DEV) {
      console.log('[ContainerRegistry] All modules disposed');
    }
  }

  /**
   * 销毁指定模块
   */
  disposeModule(name: string): void {
    const module = this.modules.get(name);
    if (module) {
      module.dispose();
      this.modules.delete(name);
      this.initializationOrder = this.initializationOrder.filter(n => n !== name);
    }
  }

  /**
   * 获取初始化状态
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 获取各模块初始化状态
   */
  getInitializationStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name, module] of this.modules) {
      status[name] = module.isInitialized;
    }
    return status;
  }
}

// ============ Singleton Export ============

/**
 * 全局容器注册表实例
 */
export const containerRegistry = new ContainerRegistryImpl();

/**
 * 获取模块容器的便捷函数
 */
export function getModuleContainer<T extends IModuleContainer>(name: string): T {
  return containerRegistry.getModule<T>(name);
}
