/**
 * Module Initializer - 模块初始化接口定义
 * 
 * @module renderer/shared/infrastructure/initialization
 */

// ============ Types ============

/**
 * 初始化状态枚举
 */
export enum InitializationStatus {
  Pending = 'pending',
  Initializing = 'initializing',
  Initialized = 'initialized',
  Failed = 'failed',
}

/**
 * 初始化优先级
 */
export enum InitializationPriority {
  /** 最高优先级，核心基础设施 */
  Critical = 0,
  /** 高优先级，核心业务模块 */
  High = 1,
  /** 普通优先级 */
  Normal = 2,
  /** 低优先级，辅助模块 */
  Low = 3,
  /** 最低优先级，可延迟初始化 */
  Lazy = 4,
}

/**
 * 模块初始化器接口
 */
export interface IModuleInitializer {
  /** 模块名称 */
  readonly name: string;
  
  /** 初始化优先级 */
  readonly priority: InitializationPriority;
  
  /** 依赖的其他模块 */
  readonly dependencies?: string[];
  
  /** 是否支持延迟初始化 */
  readonly lazy?: boolean;
  
  /**
   * 初始化模块
   */
  initialize(): Promise<void>;
  
  /**
   * 销毁模块
   */
  dispose(): Promise<void> | void;
  
  /**
   * 获取当前状态
   */
  getStatus(): InitializationStatus;
}

/**
 * 初始化配置
 */
export interface InitializationConfig {
  /** 模块名称 */
  name: string;
  /** 优先级 */
  priority?: InitializationPriority;
  /** 依赖模块 */
  dependencies?: string[];
  /** 是否延迟初始化 */
  lazy?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 初始化函数 */
  initialize: () => Promise<void>;
  /** 销毁函数 */
  dispose?: () => Promise<void> | void;
}

/**
 * 模块状态信息
 */
export interface ModuleState {
  name: string;
  status: InitializationStatus;
  priority: InitializationPriority;
  dependencies: string[];
  error?: Error;
  initTime?: number;
  lazy: boolean;
}

/**
 * 初始化进度事件
 */
export interface InitializationProgressEvent {
  module: string;
  status: InitializationStatus;
  current: number;
  total: number;
  error?: Error;
}

/**
 * 初始化完成事件
 */
export interface InitializationCompleteEvent {
  success: boolean;
  duration: number;
  failed: string[];
  initialized: string[];
}

// ============ Base Implementation ============

/**
 * 模块初始化器基类
 */
export abstract class BaseModuleInitializer implements IModuleInitializer {
  protected status: InitializationStatus = InitializationStatus.Pending;

  abstract readonly name: string;
  abstract readonly priority: InitializationPriority;
  readonly dependencies?: string[];
  readonly lazy?: boolean;

  constructor(config?: { dependencies?: string[]; lazy?: boolean }) {
    this.dependencies = config?.dependencies;
    this.lazy = config?.lazy ?? false;
  }

  async initialize(): Promise<void> {
    if (this.status === InitializationStatus.Initialized) {
      return;
    }

    this.status = InitializationStatus.Initializing;

    try {
      await this.onInitialize();
      this.status = InitializationStatus.Initialized;
    } catch (error) {
      this.status = InitializationStatus.Failed;
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.status === InitializationStatus.Pending) {
      return;
    }

    try {
      await this.onDispose();
    } finally {
      this.status = InitializationStatus.Pending;
    }
  }

  getStatus(): InitializationStatus {
    return this.status;
  }

  /**
   * 子类实现的初始化逻辑
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * 子类实现的销毁逻辑
   */
  protected onDispose(): Promise<void> | void {
    // 默认空实现
  }
}

/**
 * 简单模块初始化器（通过配置创建）
 */
export class SimpleModuleInitializer implements IModuleInitializer {
  readonly name: string;
  readonly priority: InitializationPriority;
  readonly dependencies?: string[];
  readonly lazy?: boolean;
  
  private status: InitializationStatus = InitializationStatus.Pending;
  private readonly config: InitializationConfig;

  constructor(config: InitializationConfig) {
    this.config = config;
    this.name = config.name;
    this.priority = config.priority ?? InitializationPriority.Normal;
    this.dependencies = config.dependencies;
    this.lazy = config.lazy ?? false;
  }

  async initialize(): Promise<void> {
    if (this.status === InitializationStatus.Initialized) {
      return;
    }

    this.status = InitializationStatus.Initializing;

    try {
      await this.config.initialize();
      this.status = InitializationStatus.Initialized;
    } catch (error) {
      this.status = InitializationStatus.Failed;
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.status === InitializationStatus.Pending) {
      return;
    }

    try {
      await this.config.dispose?.();
    } finally {
      this.status = InitializationStatus.Pending;
    }
  }

  getStatus(): InitializationStatus {
    return this.status;
  }
}

/**
 * 创建模块初始化器的工厂函数
 */
export function createModuleInitializer(config: InitializationConfig): IModuleInitializer {
  return new SimpleModuleInitializer(config);
}
