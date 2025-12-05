/**
 * Dependency Injection Container
 *
 * 核心依赖注入容器，提供类型安全的依赖注册和解析
 *
 * @example
 * ```ts
 * // 注册依赖
 * DIContainer.getInstance().register('API_CLIENT', new GoalHttpAdapter(httpClient));
 *
 * // 解析依赖
 * const client = DIContainer.getInstance().resolve<IGoalApiClient>('API_CLIENT');
 * ```
 */

type Constructor<T = unknown> = new (...args: unknown[]) => T;
type Factory<T = unknown> = () => T;
type Dependency<T = unknown> = T | Constructor<T> | Factory<T>;

/**
 * 依赖注入容器
 */
export class DIContainer {
  private static instance: DIContainer;
  private readonly dependencies = new Map<string, Dependency>();
  private readonly instances = new Map<string, unknown>();

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    DIContainer.instance = new DIContainer();
  }

  /**
   * 注册依赖
   *
   * @param key - 依赖键
   * @param dependency - 依赖实例、构造函数或工厂函数
   */
  register<T>(key: string, dependency: Dependency<T>): void {
    this.dependencies.set(key, dependency);
    // 如果是直接实例，也存入 instances
    if (typeof dependency !== 'function') {
      this.instances.set(key, dependency);
    }
  }

  /**
   * 解析依赖
   *
   * @param key - 依赖键
   * @returns 依赖实例
   * @throws 如果依赖未注册
   */
  resolve<T>(key: string): T {
    // 先检查已实例化的
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    const dependency = this.dependencies.get(key);
    if (!dependency) {
      throw new Error(`Dependency not found: ${key}`);
    }

    // 如果是函数，尝试实例化或调用
    if (typeof dependency === 'function') {
      const instance = this.isConstructor(dependency)
        ? new (dependency as Constructor<T>)()
        : (dependency as Factory<T>)();
      this.instances.set(key, instance);
      return instance as T;
    }

    return dependency as T;
  }

  /**
   * 检查依赖是否已注册
   */
  has(key: string): boolean {
    return this.dependencies.has(key);
  }

  /**
   * 注销依赖
   */
  unregister(key: string): void {
    this.dependencies.delete(key);
    this.instances.delete(key);
  }

  /**
   * 清空所有依赖
   */
  clear(): void {
    this.dependencies.clear();
    this.instances.clear();
  }

  /**
   * 判断是否为构造函数
   */
  private isConstructor(fn: unknown): boolean {
    try {
      Reflect.construct(String, [], fn as Constructor);
      return true;
    } catch {
      return false;
    }
  }
}
