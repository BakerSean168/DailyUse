import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Goal Review Application Service
 * 目标复盘应用服务 - 负责 GoalReview 的 CRUD 和管理
 */
export class GoalReviewApplicationService {
  private static instance: GoalReviewApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  static getInstance(): GoalReviewApplicationService {
    if (!GoalReviewApplicationService.instance) {
      GoalReviewApplicationService.instance = new GoalReviewApplicationService();
    }
    return GoalReviewApplicationService.instance;
  }

  /**
   * 懒加载获取 Goal Store
   */
  private get goalStore() {
    return getGoalStore();
  }

  /**
   * 创建目标复盘
   */
  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewRequest,
  ): Promise<GoalReviewClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.createGoalReview(goalUuid, request);

      // 更新关联的Goal实体
      await this.refreshGoalWithReviews(goalUuid);

      this.snackbar.showSuccess('目标复盘创建成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建目标复盘失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 获取目标的所有复盘
   */
  async getGoalReviewsByGoal(goalUuid: string): Promise<GoalReviewsResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getGoalReviewsByGoal(goalUuid);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标复盘失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 更新目标复盘
   */
  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<GoalReviewClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.updateGoalReview(goalUuid, reviewUuid, request);

      // 更新关联的Goal实体
      await this.refreshGoalWithReviews(goalUuid);

      this.snackbar.showSuccess('目标复盘更新成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新目标复盘失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 删除目标复盘
   */
  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalApiClient.deleteGoalReview(goalUuid, reviewUuid);

      // 更新关联的Goal实体
      await this.refreshGoalWithReviews(goalUuid);

      this.snackbar.showSuccess('目标复盘删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除目标复盘失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 辅助方法 =====

  /**
   * 刷新Goal及其Reviews
   */
  private async refreshGoalWithReviews(goalUuid: string): Promise<void> {
    try {
      console.log('[GoalReviewApplicationService] 🔄 开始刷新Goal及其Reviews:', goalUuid);
      const goalResponse = await goalApiClient.getGoalById(goalUuid, true);
      console.log('[GoalReviewApplicationService] 📥 获取到Goal数据:', {
        uuid: goalResponse.uuid,
        title: goalResponse.title,
        reviewsCount: goalResponse.reviews?.length || 0,
        reviews: goalResponse.reviews,
      });
      
      const goal = Goal.fromClientDTO(goalResponse);
      console.log('[GoalReviewApplicationService] 🔨 Goal实体创建完成:', {
        uuid: goal.uuid,
        title: goal.title,
        reviewsCount: goal.reviews?.length || 0,
        reviews: goal.reviews?.map(r => ({
          uuid: r.uuid,
          rating: r.rating,
          type: r.type,
        })) || [],
      });
      
      this.goalStore.addOrUpdateGoal(goal);
      
      console.log('[GoalReviewApplicationService] ✅ Goal已更新到store');
      
      // 验证 store 中的数据
      const storedGoal = this.goalStore.getGoalByUuid(goalUuid);
      console.log('[GoalReviewApplicationService] 🔍 验证store中的Goal:', {
        uuid: storedGoal?.uuid,
        title: storedGoal?.title,
        reviewsCount: storedGoal?.reviews?.length || 0,
        reviews: storedGoal?.reviews,
      });
    } catch (error) {
      console.error('❌ [GoalReviewApplicationService] 刷新Goal和Reviews失败:', error);
    }
  }
}

export const goalReviewApplicationService = GoalReviewApplicationService.getInstance();

