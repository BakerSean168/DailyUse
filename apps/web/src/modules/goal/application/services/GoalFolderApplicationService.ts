import type { GoalContracts } from '@dailyuse/contracts';
import { GoalFolderClient } from '@dailyuse/domain-client';
import { goalFolderApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Goal Folder Application Service
 * 目标文件夹应用服务 - 负责文件夹管理
 */
export class GoalFolderApplicationService {
  private static instance: GoalFolderApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  static getInstance(): GoalFolderApplicationService {
    if (!GoalFolderApplicationService.instance) {
      GoalFolderApplicationService.instance = new GoalFolderApplicationService();
    }
    return GoalFolderApplicationService.instance;
  }

  private get goalStore() {
    return getGoalStore();
  }

  /**
   * 创建目标文件夹
   */
  async createGoalFolder(
    request: GoalContracts.CreateGoalFolderRequest,
  ): Promise<GoalContracts.GoalFolderClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const folderData = await goalFolderApiClient.createGoalFolder(request);

      // 创建客户端实体并同步到 store
      const folder = GoalFolderClient.fromClientDTO(folderData);
      this.goalStore.addOrUpdateGoalFolder(folder);

      this.snackbar.showSuccess('文件夹创建成功');
      return folderData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建文件夹失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 获取文件夹列表
   */
  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    parentUuid?: string | null;
  }): Promise<GoalContracts.GoalFoldersResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalFolderApiClient.getGoalFolders(params);

      // 批量创建客户端实体并同步到 store
      const folders = response.folders.map((folderData: any) => GoalFolderClient.fromClientDTO(folderData));
      this.goalStore.setGoalFolders(folders);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取文件夹列表失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 更新文件夹
   */
  async updateGoalFolder(
    uuid: string,
    request: GoalContracts.UpdateGoalFolderRequest,
  ): Promise<GoalContracts.GoalFolderClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalFolderApiClient.updateGoalFolder(uuid, request);

      // 更新客户端实体并同步到 store
      const folder = GoalFolderClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoalFolder(folder);

      this.snackbar.showSuccess('文件夹更新成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新文件夹失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 删除文件夹
   */
  async deleteGoalFolder(uuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalFolderApiClient.deleteGoalFolder(uuid);

      // 从 store 中移除
      this.goalStore.removeGoalFolder(uuid);

      this.snackbar.showSuccess('文件夹删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除文件夹失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }
}

export const goalFolderApplicationService = GoalFolderApplicationService.getInstance();
