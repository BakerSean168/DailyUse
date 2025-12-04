/**
 * Goal Container
 *
 * 依赖注入容器，管理 Goal 模块的 repository 实例
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';

/**
 * Goal 模块依赖注入容器
 */
export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository: IGoalRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    GoalContainer.instance = new GoalContainer();
  }

  /**
   * 注册 GoalRepository
   */
  registerGoalRepository(repository: IGoalRepository): void {
    this.goalRepository = repository;
  }

  /**
   * 获取 GoalRepository
   */
  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      throw new Error('GoalRepository not registered. Call registerGoalRepository first.');
    }
    return this.goalRepository;
  }
}
