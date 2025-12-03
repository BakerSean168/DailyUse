/**
 * Goal Folder Application Service
 *
 * Handles GoalFolder CRUD operations.
 * Framework-agnostic - can be used in Web or Desktop.
 */

import type { IGoalFolderApiClient } from '@dailyuse/infrastructure-client';
import type {
  GoalFolderClientDTO,
  CreateGoalFolderRequest,
  UpdateGoalFolderRequest,
} from '@dailyuse/contracts/goal';
import { GoalFolder } from '@dailyuse/domain-client/goal';

/**
 * GoalFolder Application Service
 */
export class GoalFolderApplicationService {
  constructor(private readonly goalFolderApiClient: IGoalFolderApiClient) {}

  /**
   * 创建目标文件夹
   * @returns 返回创建的文件夹实体
   */
  async createGoalFolder(request: CreateGoalFolderRequest): Promise<GoalFolder> {
    const folderData = await this.goalFolderApiClient.createGoalFolder(request);
    return GoalFolder.fromClientDTO(folderData);
  }

  /**
   * 获取文件夹列表
   * @returns 返回文件夹实体数组
   */
  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    parentUuid?: string | null;
  }): Promise<GoalFolder[]> {
    const response = await this.goalFolderApiClient.getGoalFolders(params);
    return response.folders.map((folderData: GoalFolderClientDTO) =>
      GoalFolder.fromClientDTO(folderData),
    );
  }

  /**
   * 获取文件夹详情
   * @returns 返回文件夹实体
   */
  async getGoalFolderById(uuid: string): Promise<GoalFolder> {
    const data = await this.goalFolderApiClient.getGoalFolderById(uuid);
    return GoalFolder.fromClientDTO(data);
  }

  /**
   * 更新文件夹
   * @returns 返回更新后的文件夹实体
   */
  async updateGoalFolder(uuid: string, request: UpdateGoalFolderRequest): Promise<GoalFolder> {
    const data = await this.goalFolderApiClient.updateGoalFolder(uuid, request);
    return GoalFolder.fromClientDTO(data);
  }

  /**
   * 删除文件夹
   */
  async deleteGoalFolder(uuid: string): Promise<void> {
    await this.goalFolderApiClient.deleteGoalFolder(uuid);
  }
}

/**
 * Factory function to create GoalFolderApplicationService
 */
export function createGoalFolderService(
  goalFolderApiClient: IGoalFolderApiClient,
): GoalFolderApplicationService {
  return new GoalFolderApplicationService(goalFolderApiClient);
}
