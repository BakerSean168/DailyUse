/**
 * Renderer Container - 渲染进程 DI 容器基类
 * 
 * @module renderer/shared/infrastructure/di
 */

import type {
  ServiceIdentifier,
  ServiceProvider,
  ServiceRegistration,
  IModuleContainer,
} from './types';

/**
 * 容器错误
 */
export class ContainerError extends Error {
  constructor(message: string, public readonly serviceId?: ServiceIdentifier) {
    super(message);
    this.name = 'ContainerError';
  }
}

/**
 * 渲染进程模块容器基类
 */
export abstract class RendererContainer implements IModuleContainer {
  private services: Map<ServiceIdentifier, ServiceRegistration> = new Map();
  private _isInitialized = false;

  /**
   * 模块名称（子类实现）
   */
  abstract readonly moduleName: string;

  /**
   * 是否已初始化
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 注册服务
   */
  register<T>(id: ServiceIdentifier<T>, provider: ServiceProvider<T>): void {
    if (this.services.has(id)) {
      console.warn(`[${this.moduleName}] Service ${String(id)} already registered, overwriting...`);
    }

    const registration: ServiceRegistration<T> = {
      factory: provider.factory,
      singleton: provider.singleton ?? true,
      initialized: false,
    };

    // 如果不是延迟加载且是单例，立即创建实例
    if (!provider.lazy && provider.singleton) {
      registration.instance = provider.factory();
      registration.initialized = true;
    }

    this.services.set(id, registration as ServiceRegistration);
  }

  /**
   * 注册单例服务
   */
  registerSingleton<T>(id: ServiceIdentifier<T>, factory: () => T, lazy = false): void {
    this.register(id, { id, factory, singleton: true, lazy });
  }

  /**
   * 注册瞬态服务（每次获取都创建新实例）
   */
  registerTransient<T>(id: ServiceIdentifier<T>, factory: () => T): void {
    this.register(id, { id, factory, singleton: false });
  }

  /**
   * 注册已存在的实例
   */
  registerInstance<T>(id: ServiceIdentifier<T>, instance: T): void {
    this.services.set(id, {
      instance,
      singleton: true,
      initialized: true,
    });
  }

  /**
   * 获取服务
   */
  get<T>(id: ServiceIdentifier<T>): T {
    const registration = this.services.get(id);
    
    if (!registration) {
      throw new ContainerError(
        `Service ${String(id)} not found in container [${this.moduleName}]`,
        id
      );
    }

    // 单例模式
    if (registration.singleton) {
      if (!registration.initialized && registration.factory) {
        registration.instance = registration.factory();
        registration.initialized = true;
      }
      return registration.instance as T;
    }

    // 瞬态模式 - 每次创建新实例
    if (registration.factory) {
      return registration.factory() as T;
    }

    throw new ContainerError(
      `Service ${String(id)} has no factory and no instance`,
      id
    );
  }

  /**
   * 尝试获取服务（不抛出异常）
   */
  tryGet<T>(id: ServiceIdentifier<T>): T | undefined {
    try {
      return this.get(id);
    } catch {
      return undefined;
    }
  }

  /**
   * 检查服务是否存在
   */
  has(id: ServiceIdentifier): boolean {
    return this.services.has(id);
  }

  /**
   * 初始化容器
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    try {
      // 调用子类的注册方法
      await this.registerServices();
      
      // 调用子类的初始化方法
      await this.onInitialize();
      
      this._isInitialized = true;
      
      if (import.meta.env.DEV) {
        console.log(`[DI] Container [${this.moduleName}] initialized`);
      }
    } catch (error) {
      console.error(`[DI] Container [${this.moduleName}] initialization failed:`, error);
      throw error;
    }
  }

  /**
   * 销毁容器
   */
  dispose(): void {
    // 调用子类的销毁方法
    this.onDispose();
    
    // 清理所有服务
    for (const [id, registration] of this.services) {
      if (registration.instance && typeof (registration.instance as { dispose?: () => void }).dispose === 'function') {
        try {
          (registration.instance as { dispose: () => void }).dispose();
        } catch (error) {
          console.error(`[DI] Error disposing service ${String(id)}:`, error);
        }
      }
    }

    this.services.clear();
    this._isInitialized = false;
    
    if (import.meta.env.DEV) {
      console.log(`[DI] Container [${this.moduleName}] disposed`);
    }
  }

  /**
   * 获取所有已注册的服务 ID
   */
  getServiceIds(): ServiceIdentifier[] {
    return Array.from(this.services.keys());
  }

  // ============ 子类实现的方法 ============

  /**
   * 注册服务（子类实现）
   */
  protected abstract registerServices(): Promise<void> | void;

  /**
   * 初始化钩子（子类可选实现）
   */
  protected onInitialize(): Promise<void> | void {
    // 默认空实现
  }

  /**
   * 销毁钩子（子类可选实现）
   */
  protected onDispose(): void {
    // 默认空实现
  }
}
