/**
 * Goal Container
 *
 * Goal 模块的依赖注入容器
 */

import type { IGoalApiClient, IGoalFolderApiClient } from '@dailyuse/infrastructure-client';

/**
 * Goal Container
 * 管理 Goal 模块的依赖注入
 */
export class GoalContainer {
  private static instance: GoalContainer;
  private goalApiClient: IGoalApiClient | null = null;
  private goalFolderApiClient: IGoalFolderApiClient | null = null;

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
    GoalContainer.instance = undefined as unknown as GoalContainer;
  }

  /**
   * 注册 Goal API Client
   */
  registerGoalApiClient(client: IGoalApiClient): void {
    this.goalApiClient = client;
  }

  /**
   * 获取 Goal API Client
   */
  getGoalApiClient(): IGoalApiClient {
    if (!this.goalApiClient) {
      throw new Error('GoalApiClient not registered. Call registerGoalApiClient() first.');
    }
    return this.goalApiClient;
  }

  /**
   * 注册 Goal Folder API Client
   */
  registerGoalFolderApiClient(client: IGoalFolderApiClient): void {
    this.goalFolderApiClient = client;
  }

  /**
   * 获取 Goal Folder API Client
   */
  getGoalFolderApiClient(): IGoalFolderApiClient {
    if (!this.goalFolderApiClient) {
      throw new Error('GoalFolderApiClient not registered. Call registerGoalFolderApiClient() first.');
    }
    return this.goalFolderApiClient;
  }
}
