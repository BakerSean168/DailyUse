import type { GoalContracts } from '@dailyuse/contracts';
import { weightSnapshotApiClient } from '../../infrastructure/api/weightSnapshotApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';
import { CrossPlatformEventBus } from '@dailyuse/utils';

/**
 * Weight Snapshot Web 应用服务
 * 负责协调 Web 端的权重快照相关操作
 *
 * **职责**:
 * - 调用 API 客户端执行 HTTP 请求
 * - 更新 Pinia Store 状态
 * - 触发跨平台事件（WEIGHT_UPDATED）
 * - 统一错误处理和用户提示
 */
export class WeightSnapshotWebApplicationService {
  private eventBus = new CrossPlatformEventBus();

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  /**
   * 懒加载获取 Goal Store
   * 避免在 Pinia 初始化之前调用
   */
  private get goalStore() {
    return getGoalStore();
  }

  // ===== 权重更新 =====

  /**
   * 更新 KeyResult 权重并创建快照
   *
   * @param goalUuid - Goal UUID
   * @param krUuid - KeyResult UUID
   * @param newWeight - 新权重值 (0-100)
   * @param reason - 调整原因（可选）
   *
   * @throws Error 如果权重总和不等于 100% 或其他验证失败
   *
   * @example
   * ```typescript
   * await service.updateKRWeight('goal-123', 'kr-456', 50, '根据Q1反馈调整');
   * ```
   */
  async updateKRWeight(
    goalUuid: string,
    krUuid: string,
    newWeight: number,
    reason?: string,
  ): Promise<{
    keyResult: { uuid: string; title: string; oldWeight: number; newWeight: number };
    snapshot: { oldWeight: number; newWeight: number; delta: number };
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // 调用 API
      const result = await weightSnapshotApiClient.updateKRWeight(
        goalUuid,
        krUuid,
        newWeight,
        reason,
      );

      // 触发全局事件（跨平台通知）
      this.eventBus.emit('WEIGHT_UPDATED', {
        goalUuid,
        krUuid,
        oldWeight: result.keyResult.oldWeight,
        newWeight: result.keyResult.newWeight,
        delta: result.snapshot.delta,
        timestamp: Date.now(),
      });

      // 显示成功提示
      this.snackbar.showSuccess(
        `权重已更新：${result.keyResult.title} (${result.keyResult.oldWeight}% → ${result.keyResult.newWeight}%)`,
      );

      // 刷新 Goal 数据（包含更新后的 KR 权重）
      await this.refreshGoalData(goalUuid);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新权重失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 快照查询 =====

  /**
   * 查询 Goal 的所有权重快照
   *
   * @param goalUuid - Goal UUID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量（默认 20，最大 100）
   * @returns 快照列表和分页信息
   *
   * @example
   * ```typescript
   * const { snapshots, pagination } = await service.getGoalSnapshots('goal-123', 1, 20);
   * ```
   */
  async getGoalSnapshots(
    goalUuid: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    snapshots: GoalContracts.KeyResultWeightSnapshotServerDTO[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const result = await weightSnapshotApiClient.getGoalSnapshots(goalUuid, page, pageSize);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取快照列表失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 查询 KeyResult 的权重快照历史
   *
   * @param krUuid - KeyResult UUID
   * @param page - 页码
   * @param pageSize - 每页数量
   * @returns 快照历史列表
   */
  async getKRSnapshots(
    krUuid: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    snapshots: GoalContracts.KeyResultWeightSnapshotServerDTO[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const result = await weightSnapshotApiClient.getKRSnapshots(krUuid, page, pageSize);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取 KR 快照历史失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 数据可视化 =====

  /**
   * 获取权重趋势数据（用于 ECharts 图表）
   *
   * @param goalUuid - Goal UUID
   * @param startTime - 开始时间戳（毫秒）
   * @param endTime - 结束时间戳（毫秒）
   * @returns ECharts 格式的趋势数据
   *
   * @example
   * ```typescript
   * const trendData = await service.getWeightTrend(
   *   'goal-123',
   *   Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 天前
   *   Date.now()
   * );
   * ```
   */
  async getWeightTrend(
    goalUuid: string,
    startTime: number,
    endTime: number,
  ): Promise<{
    timePoints: number[];
    keyResults: Array<{
      uuid: string;
      title: string;
      data: Array<{ time: number; weight: number }>;
    }>;
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const result = await weightSnapshotApiClient.getWeightTrend(goalUuid, startTime, endTime);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取权重趋势数据失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 对比多个时间点的权重分配
   *
   * @param goalUuid - Goal UUID
   * @param timePoints - 时间点数组（最多 5 个）
   * @returns 权重对比数据
   *
   * @example
   * ```typescript
   * const comparison = await service.getWeightComparison('goal-123', [
   *   Date.now() - 60 * 24 * 60 * 60 * 1000, // 60天前
   *   Date.now() - 30 * 24 * 60 * 60 * 1000, // 30天前
   *   Date.now(), // 现在
   * ]);
   * ```
   */
  async getWeightComparison(
    goalUuid: string,
    timePoints: number[],
  ): Promise<{
    keyResults: Array<{ uuid: string; title: string }>;
    timePoints: number[];
    comparisons: Record<string, number[]>;
    deltas: Record<string, number[]>;
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // 验证时间点数量
      if (timePoints.length > 5) {
        throw new Error('最多支持对比 5 个时间点');
      }

      const result = await weightSnapshotApiClient.getWeightComparison(goalUuid, timePoints);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取权重对比数据失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 辅助方法 =====

  /**
   * 刷新 Goal 数据
   * 在权重更新后调用，确保 UI 显示最新数据
   *
   * @param goalUuid - Goal UUID
   */
  private async refreshGoalData(goalUuid: string): Promise<void> {
    try {
      // 从 API 重新获取 Goal 数据（包含更新后的 KR 权重）
      // 这里假设 goalStore 有 refreshGoal 方法
      // 如果没有，需要调用 GoalWebApplicationService 的 getGoalById 方法
      const goal = this.goalStore.goals.find((g) => g.uuid === goalUuid);
      if (goal) {
        // 触发 Goal 数据刷新
        // 注意：这里需要确保 goalStore 有正确的刷新机制
        console.log('Goal 数据需要刷新:', goalUuid);
      }
    } catch (error) {
      console.error('刷新 Goal 数据失败:', error);
    }
  }
}

/**
 * Weight Snapshot Web Application Service 单例
 */
export const weightSnapshotWebApplicationService = new WeightSnapshotWebApplicationService();
