/**
 * Goal Container
 *
 * Goal 模块的依赖容器
 */

import type { IGoalApiClient, IGoalFolderApiClient } from '../../goal';
import { DIContainer } from './DIContainer';
import { DependencyKeys } from './dependency-keys';

/**
 * Goal 依赖容器
 */
export class GoalContainer {
  private static instance: GoalContainer;

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
   * 重置容器
   */
  static resetInstance(): void {
    GoalContainer.instance = undefined as unknown as GoalContainer;
  }

  /**
   * 注册 Goal API Client
   */
  registerGoalApiClient(client: IGoalApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.GOAL_API_CLIENT, client);
  }

  /**
   * 获取 Goal API Client
   */
  getGoalApiClient(): IGoalApiClient {
    return DIContainer.getInstance().resolve<IGoalApiClient>(DependencyKeys.GOAL_API_CLIENT);
  }

  /**
   * 注册 Goal Folder API Client
   */
  registerGoalFolderApiClient(client: IGoalFolderApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.GOAL_FOLDER_API_CLIENT, client);
  }

  /**
   * 获取 Goal Folder API Client
   */
  getGoalFolderApiClient(): IGoalFolderApiClient {
    return DIContainer.getInstance().resolve<IGoalFolderApiClient>(DependencyKeys.GOAL_FOLDER_API_CLIENT);
  }
}
