import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, GoalFolder } from '@dailyuse/domain-client';
import { goalApiClient, goalFolderApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { eventBus, GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/utils';

/**
 * Goal Sync Application Service
 * 目标数据同步应用服务 - 负责 Goal 和 GoalFolder 的数据同步
 * 
 * 核心职责：
 * 1. 初始化时同步所有数据
 * 2. 监听事件总线上的 Goal 刷新事件
 * 3. 当事件触发时，从服务器刷新对应的 Goal 数据
 * 4. 更新 Pinia store
 * 
 * 事件驱动架构：
 * - KeyResult/GoalRecord 更新 → 发布 GoalAggregateRefreshEvent
 * - GoalSyncApplicationService 监听此事件
 * - 自动从服务器刷新 Goal 数据
 * - Store 更新 → UI 自动响应
 */
export class GoalSyncApplicationService {
  private static instance: GoalSyncApplicationService;
  private unsubscribeFunctions: Map<string, () => void> = new Map();
  private isInitialized = false;

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
   * 初始化事件监听
   * 应在应用启动时调用一次
   */
  initializeEventListeners(): void {
    if (this.isInitialized) {
      console.warn('⚠️ [GoalSyncApplicationService] 事件监听已初始化');
      return;
    }

    console.log('🎧 [GoalSyncApplicationService] 初始化事件监听...');

    // 监听 Goal 聚合根刷新事件
    const handler = (event: GoalAggregateRefreshEvent) => this.handleGoalRefreshEvent(event);
    eventBus.on(GoalEvents.AGGREGATE_REFRESH, handler);

    // 保存 unsubscribe 函数
    const unsubscribe = () => eventBus.off(GoalEvents.AGGREGATE_REFRESH, handler);
    this.unsubscribeFunctions.set(GoalEvents.AGGREGATE_REFRESH, unsubscribe);
    this.isInitialized = true;

    console.log('✅ [GoalSyncApplicationService] 事件监听初始化完成');
  }

  /**
   * 处理 Goal 刷新事件
   * @param event 刷新事件
   */
  private async handleGoalRefreshEvent(event: GoalAggregateRefreshEvent): Promise<void> {
    try {
      console.log('[GoalSyncApplicationService] 收到 Goal 刷新事件:', {
        goalUuid: event.goalUuid,
        reason: event.reason,
        timestamp: new Date(event.timestamp).toISOString(),
      });

      // 从服务器刷新该 Goal 的完整数据（包括 KeyResults 和 Records）
      const goalDto = await goalApiClient.getGoalById(event.goalUuid, true);

      if (!goalDto) {
        console.warn(`❌ [GoalSyncApplicationService] Goal 不存在: ${event.goalUuid}`);
        return;
      }

      // 转换为客户端实体
      const goal = Goal.fromClientDTO(goalDto);

      // 更新 store
      this.goalStore.addOrUpdateGoal(goal);

      console.log(
        `✅ [GoalSyncApplicationService] Goal 已更新到 store:`,
        {
          uuid: goal.uuid,
          title: goal.title,
          keyResultCount: goal.keyResultCount,
          reason: event.reason,
        }
      );
    } catch (error) {
      console.error(
        `❌ [GoalSyncApplicationService] 刷新 Goal 失败: ${event.goalUuid}`,
        error
      );
    }
  }

  /**
   * 清理事件监听
   * 应在应用卸载时调用
   */
  cleanup(): void {
    console.log('🧹 [GoalSyncApplicationService] 清理事件监听...');

    // 取消所有订阅
    this.unsubscribeFunctions.forEach((unsubscribe, eventName) => {
      unsubscribe();
      console.log(`  - 取消监听: ${eventName}`);
    });

    this.unsubscribeFunctions.clear();
    this.isInitialized = false;

    console.log('✅ [GoalSyncApplicationService] 事件监听清理完成');
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
      const folders = (foldersData?.folders || []).map((folderData: any) =>
        GoalFolder.fromClientDTO(folderData),
      );
      console.log("tongbuqian ========= goal ", goals)
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
