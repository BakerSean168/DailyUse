import type { GoalContracts } from '@dailyuse/contracts';
import { Goal } from '@dailyuse/domain-client';
import { goalApiClient, goalFolderApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Goal Sync Application Service
 * 目标数据同步应用服务 - 负责 Goal 和 GoalFolder 的数据同步
 */
export class GoalSyncApplicationService {
  private static instance: GoalSyncApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  static getInstance(): GoalSyncApplicationService {
    if (!GoalSyncApplicationService.instance) {
      GoalSyncApplicationService.instance = new GoalSyncApplicationService();
    }
    return GoalSyncApplicationService.instance;
  }

  /**
   * 懒加载获取 Goal Store
   */
  private get goalStore() {
    return getGoalStore();
  }

  /**
   * 同步所有目标和文件夹数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllGoalsAndFolders(): Promise<{
    goalsCount: number;
    foldersCount: number;
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // 并行获取所有目标和文件夹数据
      console.log('📡 开始发起 API 请求（同步所有数据）...');
      const [goalsData, foldersData] = await Promise.all([
        goalApiClient.getGoals({ limit: 1000, includeChildren: true }),
        goalFolderApiClient.getGoalFolders({ limit: 1000 }),
      ]);

      console.log('🔍 API 响应数据:', {
        goalsDataStructure: goalsData ? Object.keys(goalsData) : 'null/undefined',
        foldersDataStructure: foldersData ? Object.keys(foldersData) : 'null/undefined',
      });

      // 转换为客户端实体
      const goals = (goalsData?.goals || []).map((goalData: any) => Goal.fromClientDTO(goalData));
      const { GoalFolder } = await import('@dailyuse/domain-client');
      const folders = (foldersData?.folders || []).map((folderData: any) =>
        GoalFolder.fromClientDTO(folderData),
      );

      // 批量同步到 store
      this.goalStore.setGoals(goals);
      this.goalStore.setGoalFolders(folders);

      // 更新分页信息（如果有）
      if (goalsData?.page) {
        this.goalStore.setPagination({
          page: goalsData.page,
          limit: goalsData.pageSize,
          total: goalsData.total,
        });
      }

      console.log(`✅ 成功同步数据: ${goals.length} 个目标, ${folders.length} 个文件夹`);

      return {
        goalsCount: goals.length,
        foldersCount: folders.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步数据失败';
      this.goalStore.setError(errorMessage);
      console.error('❌ 同步数据失败:', error);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 刷新所有数据
   */
  async refreshAll(): Promise<void> {
    try {
      console.log('🔄 开始刷新所有数据...');
      await this.syncAllGoalsAndFolders();
      console.log('✅ 所有数据刷新完成');
    } catch (error) {
      console.error('❌ 刷新数据失败:', error);
      throw error;
    }
  }
}

export const goalSyncApplicationService = GoalSyncApplicationService.getInstance();
