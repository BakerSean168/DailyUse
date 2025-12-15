/**
 * Initialization Manager - 统一模块初始化管理器
 * 
 * @module renderer/shared/infrastructure/initialization
 */

import type {
  IModuleInitializer,
  InitializationConfig,
  ModuleState,
} from './module-initializer';

import {
  InitializationStatus,
  InitializationPriority,
  SimpleModuleInitializer,
} from './module-initializer';

import { initializationState } from './initialization-state';

// ============ Types ============

interface InitializationManagerConfig {
  /** 默认超时时间（毫秒） */
  defaultTimeout?: number;
  /** 是否并行初始化同优先级模块 */
  parallelSamePriority?: boolean;
  /** 是否在开发模式下输出日志 */
  logging?: boolean;
}

// ============ Manager Implementation ============

/**
 * 初始化管理器
 */
class InitializationManagerImpl {
  private initializers: Map<string, IModuleInitializer> = new Map();
  private config: Required<InitializationManagerConfig>;
  private _isInitializing = false;
  private _isInitialized = false;

  constructor(config?: InitializationManagerConfig) {
    this.config = {
      defaultTimeout: config?.defaultTimeout ?? 30000,
      parallelSamePriority: config?.parallelSamePriority ?? true,
      logging: config?.logging ?? import.meta.env.DEV,
    };
  }

  /**
   * 注册模块初始化器
   */
  register(initializer: IModuleInitializer): void {
    const name = initializer.name;
    
    if (this.initializers.has(name)) {
      this.log(`Module '${name}' already registered, overwriting...`, 'warn');
    }

    this.initializers.set(name, initializer);
    
    // 注册到状态存储
    initializationState.registerModule(
      name,
      initializer.priority,
      initializer.dependencies ?? [],
      initializer.lazy ?? false
    );

    this.log(`Module '${name}' registered (priority: ${InitializationPriority[initializer.priority]})`);
  }

  /**
   * 通过配置注册模块
   */
  registerConfig(config: InitializationConfig): void {
    this.register(new SimpleModuleInitializer(config));
  }

  /**
   * 批量注册模块
   */
  registerAll(initializers: IModuleInitializer[]): void {
    for (const initializer of initializers) {
      this.register(initializer);
    }
  }

  /**
   * 初始化所有模块
   */
  async initializeAll(): Promise<void> {
    if (this._isInitializing) {
      this.log('Initialization already in progress', 'warn');
      return;
    }

    if (this._isInitialized) {
      this.log('All modules already initialized');
      return;
    }

    this._isInitializing = true;
    const startTime = performance.now();

    try {
      // 按优先级分组
      const priorityGroups = this.groupByPriority();
      
      // 按优先级顺序初始化
      for (const [priority, modules] of priorityGroups) {
        this.log(`Initializing priority ${InitializationPriority[priority]} modules: ${modules.map(m => m.name).join(', ')}`);
        
        if (this.config.parallelSamePriority) {
          // 并行初始化同优先级模块
          await this.initializeParallel(modules);
        } else {
          // 顺序初始化
          await this.initializeSequential(modules);
        }
      }

      this._isInitialized = true;
      const duration = performance.now() - startTime;
      
      this.log(`All modules initialized in ${duration.toFixed(1)}ms`);
      initializationState.emitComplete(duration);
      
    } catch (error) {
      this.log(`Initialization failed: ${error}`, 'error');
      throw error;
    } finally {
      this._isInitializing = false;
    }
  }

  /**
   * 初始化指定模块
   */
  async initializeModule(name: string): Promise<void> {
    const initializer = this.initializers.get(name);
    if (!initializer) {
      throw new Error(`Module '${name}' not found`);
    }

    // 先初始化依赖
    if (initializer.dependencies) {
      for (const dep of initializer.dependencies) {
        const depInitializer = this.initializers.get(dep);
        if (depInitializer && depInitializer.getStatus() !== InitializationStatus.Initialized) {
          await this.initializeModule(dep);
        }
      }
    }

    // 初始化当前模块
    if (initializer.getStatus() !== InitializationStatus.Initialized) {
      await this.initializeSingle(initializer);
    }
  }

  /**
   * 延迟初始化模块
   */
  async initializeLazy(name: string): Promise<void> {
    const initializer = this.initializers.get(name);
    if (!initializer) {
      throw new Error(`Module '${name}' not found`);
    }

    if (!initializer.lazy) {
      this.log(`Module '${name}' is not marked as lazy`, 'warn');
    }

    await this.initializeModule(name);
  }

  /**
   * 销毁所有模块
   */
  async disposeAll(): Promise<void> {
    // 逆序销毁（按优先级从低到高）
    const priorityGroups = this.groupByPriority();
    const reversedPriorities = Array.from(priorityGroups.keys()).reverse();

    for (const priority of reversedPriorities) {
      const modules = priorityGroups.get(priority) ?? [];
      for (const initializer of modules.reverse()) {
        try {
          await initializer.dispose();
          initializationState.updateModuleStatus(
            initializer.name,
            InitializationStatus.Pending
          );
          this.log(`Module '${initializer.name}' disposed`);
        } catch (error) {
          this.log(`Failed to dispose module '${initializer.name}': ${error}`, 'error');
        }
      }
    }

    this._isInitialized = false;
    this.log('All modules disposed');
  }

  /**
   * 重新初始化失败的模块
   */
  async retryFailed(): Promise<void> {
    const failedModules = initializationState.getFailedModules();
    
    for (const moduleState of failedModules) {
      const initializer = this.initializers.get(moduleState.name);
      if (initializer) {
        this.log(`Retrying module '${moduleState.name}'`);
        await this.initializeSingle(initializer);
      }
    }
  }

  /**
   * 获取模块状态
   */
  getModuleState(name: string): ModuleState | undefined {
    return initializationState.getModuleState(name);
  }

  /**
   * 获取所有模块状态
   */
  getAllModuleStates(): ModuleState[] {
    return initializationState.getAllModuleStates();
  }

  /**
   * 是否正在初始化
   */
  get isInitializing(): boolean {
    return this._isInitializing;
  }

  /**
   * 是否已完成初始化
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 重置管理器
   */
  reset(): void {
    this.initializers.clear();
    initializationState.clear();
    this._isInitializing = false;
    this._isInitialized = false;
  }

  // ============ Private Methods ============

  private groupByPriority(): Map<InitializationPriority, IModuleInitializer[]> {
    const groups = new Map<InitializationPriority, IModuleInitializer[]>();
    
    for (const initializer of this.initializers.values()) {
      // 跳过懒加载模块
      if (initializer.lazy) continue;
      
      const priority = initializer.priority;
      if (!groups.has(priority)) {
        groups.set(priority, []);
      }
      groups.get(priority)!.push(initializer);
    }

    // 按优先级排序
    return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]));
  }

  private async initializeParallel(initializers: IModuleInitializer[]): Promise<void> {
    // 使用拓扑排序处理依赖
    const sorted = this.topologicalSort(initializers);
    
    // 分批并行执行（同一批内的模块没有相互依赖）
    const batches = this.createBatches(sorted);
    
    for (const batch of batches) {
      await Promise.all(batch.map(init => this.initializeSingle(init)));
    }
  }

  private async initializeSequential(initializers: IModuleInitializer[]): Promise<void> {
    const sorted = this.topologicalSort(initializers);
    for (const initializer of sorted) {
      await this.initializeSingle(initializer);
    }
  }

  private async initializeSingle(initializer: IModuleInitializer): Promise<void> {
    const name = initializer.name;
    const startTime = performance.now();

    initializationState.updateModuleStatus(name, InitializationStatus.Initializing);

    try {
      // 使用超时包装
      await this.withTimeout(
        initializer.initialize(),
        this.config.defaultTimeout,
        `Module '${name}' initialization timed out`
      );

      const duration = performance.now() - startTime;
      initializationState.updateModuleStatus(
        name,
        InitializationStatus.Initialized,
        undefined,
        duration
      );
      
      this.log(`Module '${name}' initialized in ${duration.toFixed(1)}ms`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      initializationState.updateModuleStatus(name, InitializationStatus.Failed, err);
      this.log(`Module '${name}' failed: ${err.message}`, 'error');
      throw err;
    }
  }

  private topologicalSort(initializers: IModuleInitializer[]): IModuleInitializer[] {
    const result: IModuleInitializer[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const initMap = new Map(initializers.map(i => [i.name, i]));

    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      const initializer = initMap.get(name);
      if (!initializer) return;

      visiting.add(name);

      for (const dep of initializer.dependencies ?? []) {
        if (initMap.has(dep)) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      result.push(initializer);
    };

    for (const initializer of initializers) {
      visit(initializer.name);
    }

    return result;
  }

  private createBatches(sorted: IModuleInitializer[]): IModuleInitializer[][] {
    const batches: IModuleInitializer[][] = [];
    const completed = new Set<string>();

    let remaining = [...sorted];

    while (remaining.length > 0) {
      const batch: IModuleInitializer[] = [];
      const nextRemaining: IModuleInitializer[] = [];

      for (const initializer of remaining) {
        const deps = initializer.dependencies ?? [];
        const depsComplete = deps.every(d => completed.has(d));

        if (depsComplete) {
          batch.push(initializer);
        } else {
          nextRemaining.push(initializer);
        }
      }

      if (batch.length === 0 && nextRemaining.length > 0) {
        // 无法继续，可能存在循环依赖或缺失依赖
        throw new Error(`Cannot resolve dependencies for: ${nextRemaining.map(i => i.name).join(', ')}`);
      }

      batches.push(batch);
      batch.forEach(i => completed.add(i.name));
      remaining = nextRemaining;
    }

    return batches;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    message: string
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeout);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.logging) return;

    const prefix = '[InitializationManager]';
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }
}

// ============ Singleton Export ============

export const initializationManager = new InitializationManagerImpl();

/**
 * 注册模块初始化器的便捷函数
 */
export function registerInitializer(initializer: IModuleInitializer): void {
  initializationManager.register(initializer);
}

/**
 * 通过配置注册模块的便捷函数
 */
export function registerInitializerConfig(config: InitializationConfig): void {
  initializationManager.registerConfig(config);
}
