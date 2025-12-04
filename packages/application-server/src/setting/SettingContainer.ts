/**
 * Setting Module DI Container
 *
 * 依赖注入容器，管理 Setting 模块的所有仓储实例
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';

export class SettingContainer {
  private static instance: SettingContainer;

  private userSettingRepository?: IUserSettingRepository;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): SettingContainer {
    if (!SettingContainer.instance) {
      SettingContainer.instance = new SettingContainer();
    }
    return SettingContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    SettingContainer.instance = undefined as unknown as SettingContainer;
  }

  // ===== User Setting Repository =====

  registerUserSettingRepository(repository: IUserSettingRepository): void {
    this.userSettingRepository = repository;
  }

  getUserSettingRepository(): IUserSettingRepository {
    if (!this.userSettingRepository) {
      throw new Error(
        'UserSettingRepository not registered. Call registerUserSettingRepository() first.',
      );
    }
    return this.userSettingRepository;
  }

  /**
   * 重置所有仓储（用于测试）
   */
  reset(): void {
    this.userSettingRepository = undefined;
  }
}
