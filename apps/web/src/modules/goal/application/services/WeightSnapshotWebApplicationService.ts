import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest, KeyResultWeightSnapshotServerDTO } from '@dailyuse/contracts/goal';
import { weightSnapshotApiClient } from '../../infrastructure/api/weightSnapshotApiClient';
import { CrossPlatformEventBus } from '@dailyuse/utils';

/**
 * Weight Snapshot Web 应用服务
 * 负责协调 Web 端的权重快照相关操作
 *
 * 🔄 重构说明（Pattern A）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不操作 Store
 * - 不操作 Snackbar
 * - 触发跨平台事件（WEIGHT_UPDATED）
 * - Composable 层负责 Store 更新和用户通知
 */
export class WeightSnapshotWebApplicationService {
  private eventBus = new CrossPlatformEventBus();

  // ===== 权重更新 =====

  /**
   * 更新 KeyResult 权重并创建快照
   *
   * @param goalUuid - Goal UUID
   * @param krUuid - KeyResult UUID
   * @param newWeight - 新权重值 (1-10)
   * @param reason - 调整原因（可选）
   *
   * @example
   * ```typescript
   * await service.updateKRWeight('goal-123', 'kr-456', 7, '根据Q1反馈调整');
   * ```
   */
  async updateKRWeight(
    goalUuid: string,
    krUuid: string,
    newWeight: number,
    reason?: string,
  ): Promise<{
    keyResult: { uuid: string; title: string; oldWeight: number; newWeight: number };
    weightInfo: {
      totalWeight: number;
      keyResults: Array<{ uuid: string; title: string; weight: number; percentage: number }>;
    };
  }> {
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
      delta: result.keyResult.newWeight - result.keyResult.oldWeight,
      timestamp: Date.now(),
    });

    return result;
  }

  // ===== 快照查询 =====

  /**
   * 查询 Goal 的所有权重快照
   */
  async getGoalSnapshots(
    goalUuid: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    snapshots: KeyResultWeightSnapshotServerDTO[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    return await weightSnapshotApiClient.getGoalSnapshots(goalUuid, page, pageSize);
  }

  /**
   * 查询 KeyResult 的权重快照历史
   */
  async getKRSnapshots(
    krUuid: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    snapshots: KeyResultWeightSnapshotServerDTO[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    return await weightSnapshotApiClient.getKRSnapshots(krUuid, page, pageSize);
  }

  // ===== 数据可视化 =====

  /**
   * 获取权重趋势数据（用于 ECharts 图表）
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
    return await weightSnapshotApiClient.getWeightTrend(goalUuid, startTime, endTime);
  }

  /**
   * 对比多个时间点的权重分配
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
    // 验证时间点数量
    if (timePoints.length > 5) {
      throw new Error('最多支持对比 5 个时间点');
    }

    return await weightSnapshotApiClient.getWeightComparison(goalUuid, timePoints);
  }
}

/**
 * Weight Snapshot Web Application Service 单例
 */
export const weightSnapshotWebApplicationService = new WeightSnapshotWebApplicationService();

