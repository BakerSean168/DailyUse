import { apiClient } from '@/shared/api/instances';
import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest, KeyResultWeightSnapshotServerDTO } from '@dailyuse/contracts/goal';

/**
 * Weight Snapshot API 客户端
 * 封装权重快照相关的 HTTP 请求
 */
export class WeightSnapshotApiClient {
  /**
   * 更新 KeyResult 权重并创建快照
   * @param goalUuid - Goal UUID
   * @param krUuid - KeyResult UUID
   * @param newWeight - 新权重值 (1-10，权重占比由所有 KR 权重的总和计算)
   * @param reason - 调整原因（可选）
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
    const data = await apiClient.post(`/goals/${goalUuid}/key-results/${krUuid}/weight`, {
      newWeight,
      reason,
    });
    return data;
  }

  /**
   * 查询 Goal 的所有权重快照
   * @param goalUuid - Goal UUID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量（最大 100）
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
    const data = await apiClient.get(`/goals/${goalUuid}/weight-snapshots`, {
      params: { page, pageSize },
    });
    return data;
  }

  /**
   * 查询 KeyResult 的权重快照历史
   * @param krUuid - KeyResult UUID
   * @param page - 页码
   * @param pageSize - 每页数量
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
    const data = await apiClient.get(`/key-results/${krUuid}/weight-snapshots`, {
      params: { page, pageSize },
    });
    return data;
  }

  /**
   * 获取权重趋势数据（用于 ECharts 图表）
   * @param goalUuid - Goal UUID
   * @param startTime - 开始时间戳（毫秒）
   * @param endTime - 结束时间戳（毫秒）
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
    const data = await apiClient.get(`/goals/${goalUuid}/weight-trend`, {
      params: { startTime, endTime },
    });
    return data;
  }

  /**
   * 对比多个时间点的权重分配
   * @param goalUuid - Goal UUID
   * @param timePoints - 时间点数组（最多 5 个）
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
    const data = await apiClient.get(`/goals/${goalUuid}/weight-comparison`, {
      params: { timePoints: timePoints.join(',') },
    });
    return data;
  }
}

/**
 * Weight Snapshot API Client 单例
 */
export const weightSnapshotApiClient = new WeightSnapshotApiClient();

