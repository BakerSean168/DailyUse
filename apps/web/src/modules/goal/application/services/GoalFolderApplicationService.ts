/**
 * Goal Folder Application Service
 * 目标文件夹应用服务 - 负责文件夹管理
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 *
 * 📝 错误处理说明：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Service 直接抛出错误，由 Composable 层统一处理
 */

import type {
  GoalFolderClientDTO,
  CreateGoalFolderRequest,
  UpdateGoalFolderRequest,
  GoalFoldersResponse,
} from '@dailyuse/contracts/goal';
import { GoalFolder } from '@dailyuse/domain-client/goal';
import { goalFolderApiClient } from '../../infrastructure/api/goalApiClient';

export class GoalFolderApplicationService {
  private static instance: GoalFolderApplicationService;

  private constructor() {}

  static getInstance(): GoalFolderApplicationService {
    if (!GoalFolderApplicationService.instance) {
      GoalFolderApplicationService.instance = new GoalFolderApplicationService();
    }
    return GoalFolderApplicationService.instance;
  }

  /**
   * 创建目标文件夹
   * @returns 返回创建的文件夹实体
   */
  async createGoalFolder(request: CreateGoalFolderRequest): Promise<GoalFolder> {
    const folderData = await goalFolderApiClient.createGoalFolder(request);
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
    const response = await goalFolderApiClient.getGoalFolders(params);
    return response.folders.map((folderData: GoalFolderClientDTO) =>
      GoalFolder.fromClientDTO(folderData),
    );
  }

  /**
   * 更新文件夹
   * @returns 返回更新后的文件夹实体
   */
  async updateGoalFolder(uuid: string, request: UpdateGoalFolderRequest): Promise<GoalFolder> {
    const data = await goalFolderApiClient.updateGoalFolder(uuid, request);
    return GoalFolder.fromClientDTO(data);
  }

  /**
   * 删除文件夹
   */
  async deleteGoalFolder(uuid: string): Promise<void> {
    await goalFolderApiClient.deleteGoalFolder(uuid);
  }
}

export const goalFolderApplicationService = GoalFolderApplicationService.getInstance();

