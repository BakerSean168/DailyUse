/**
 * Dashboard Container
 *
 * Dashboard 模块的依赖容器
 *
 * @example
 * ```ts
 * // 注册依赖
 * DashboardContainer.getInstance()
 *   .registerApiClient(new DashboardHttpAdapter(httpClient));
 *
 * // 获取依赖
 * const api = DashboardContainer.getInstance().getApiClient();
 * ```
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { IDashboardApiClient } from './ports/dashboard-api-client.port';

/**
 * Dashboard 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('DashboardApiClient'),
} as const;

/**
 * Dashboard 模块依赖容器
 */
export class DashboardContainer extends ModuleContainerBase {
  private static instance: DashboardContainer;

  private constructor() {
    super();
  }

  /**
   * 获取容器单例
   */
  static getInstance(): DashboardContainer {
    if (!DashboardContainer.instance) {
      DashboardContainer.instance = new DashboardContainer();
    }
    return DashboardContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    DashboardContainer.instance = undefined as unknown as DashboardContainer;
  }

  // ============ API Client ============

  /**
   * 注册 Dashboard API Client
   */
  registerApiClient(client: IDashboardApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  /**
   * 获取 Dashboard API Client
   */
  getApiClient(): IDashboardApiClient {
    return this.container.resolve<IDashboardApiClient>(KEYS.API_CLIENT);
  }

  /**
   * 检查 API Client 是否已注册
   */
  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ 通用方法 ============

  /**
   * 检查容器是否已配置
   */
  isConfigured(): boolean {
    return this.hasApiClient();
  }

  /**
   * 清空所有已注册的依赖
   */
  clear(): void {
    this.container.unregister(KEYS.API_CLIENT);
  }
}

export { KEYS as DashboardDependencyKeys };
