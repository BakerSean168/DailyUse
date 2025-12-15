/**
 * DI Container Types - 依赖注入容器类型定义
 * 
 * @module renderer/shared/infrastructure/di
 */

// ============ Service Types ============

/**
 * 服务标识符
 */
export type ServiceIdentifier<T = unknown> = string | symbol;

/**
 * 服务工厂函数
 */
export type ServiceFactory<T> = () => T;

/**
 * 服务提供者
 */
export interface ServiceProvider<T = unknown> {
  /** 服务标识 */
  id: ServiceIdentifier<T>;
  /** 服务工厂 */
  factory: ServiceFactory<T>;
  /** 是否单例 */
  singleton?: boolean;
  /** 延迟初始化 */
  lazy?: boolean;
  /** 依赖的其他服务 */
  dependencies?: ServiceIdentifier[];
}

/**
 * 服务注册配置
 */
export interface ServiceRegistration<T = unknown> {
  /** 服务实例 */
  instance?: T;
  /** 服务工厂 */
  factory?: ServiceFactory<T>;
  /** 是否单例 */
  singleton: boolean;
  /** 是否已初始化 */
  initialized: boolean;
}

// ============ Container Types ============

/**
 * 容器接口
 */
export interface IContainer {
  /**
   * 注册服务
   */
  register<T>(id: ServiceIdentifier<T>, provider: ServiceProvider<T>): void;
  
  /**
   * 获取服务
   */
  get<T>(id: ServiceIdentifier<T>): T;
  
  /**
   * 检查服务是否存在
   */
  has(id: ServiceIdentifier): boolean;
  
  /**
   * 销毁容器
   */
  dispose(): void;
}

/**
 * 模块容器接口
 */
export interface IModuleContainer extends IContainer {
  /** 模块名称 */
  readonly moduleName: string;
  
  /**
   * 初始化容器
   */
  initialize(): Promise<void>;
  
  /**
   * 是否已初始化
   */
  readonly isInitialized: boolean;
}

/**
 * 容器注册表接口
 */
export interface IContainerRegistry {
  /**
   * 注册模块容器
   */
  registerModule(container: IModuleContainer): void;
  
  /**
   * 获取模块容器
   */
  getModule<T extends IModuleContainer>(name: string): T;
  
  /**
   * 检查模块是否存在
   */
  hasModule(name: string): boolean;
  
  /**
   * 获取所有模块名称
   */
  getModuleNames(): string[];
  
  /**
   * 初始化所有模块
   */
  initializeAll(): Promise<void>;
  
  /**
   * 销毁所有模块
   */
  disposeAll(): void;
}

// ============ Hook Types ============

/**
 * useContainer hook 返回类型
 */
export interface UseContainerResult<T extends IModuleContainer> {
  container: T;
  isInitialized: boolean;
}

/**
 * useService hook 返回类型
 */
export interface UseServiceResult<T> {
  service: T;
  isReady: boolean;
}

// ============ Module Names ============

/**
 * 模块名称枚举
 */
export enum ModuleName {
  Task = 'task',
  Goal = 'goal',
  Schedule = 'schedule',
  Reminder = 'reminder',
  Dashboard = 'dashboard',
  Account = 'account',
  Auth = 'auth',
  AI = 'ai',
  Notification = 'notification',
  Repository = 'repository',
  Setting = 'setting',
  Editor = 'editor',
}

// ============ Service Tokens ============

/**
 * 创建服务标识符
 */
export function createServiceToken<T>(name: string): ServiceIdentifier<T> {
  return Symbol.for(`service:${name}`);
}

/**
 * 通用服务标识符
 */
export const ServiceTokens = {
  // IPC Clients
  IPCClient: createServiceToken('ipc-client'),
  
  // Logger
  Logger: createServiceToken('logger'),
  
  // Configuration
  Config: createServiceToken('config'),
} as const;
