/**
 * useWeightSnapshot Composable
 * 权重快照管理的核心组合函数
 *
 * 提供权重快照的查询、更新和数据可视化功能
 * 使用 weightSnapshotWebApplicationService 协调业务逻辑
 */

import { ref, computed, watch } from 'vue';
import { weightSnapshotWebApplicationService } from '../services/WeightSnapshotWebApplicationService';
import { createLogger } from '@dailyuse/utils';
import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';

const logger = createLogger('useWeightSnapshot');

/**
 * 权重快照管理组合函数
 * 
 * 提供以下功能：
 * - 权重更新与快照创建
 * - Goal 和 KeyResult 的快照历史查询
 * - 权重趋势数据（用于 ECharts 图表）
 * - 权重对比分析（多时间点对比）
 * - 统一的加载状态和错误处理
 */
export function useWeightSnapshot() {
  // ===== 状态 =====

  /** Goal 的权重快照列表 */
  const goalSnapshots = ref<KeyResultWeightSnapshotServerDTO[]>([]);

  /** KeyResult 的权重快照历史 */
  const krSnapshots = ref<KeyResultWeightSnapshotServerDTO[]>([]);

  /** 权重趋势数据（用于图表） */
  const weightTrend = ref<{
    timePoints: number[];
    keyResults: Array<{
      uuid: string;
      title: string;
      data: Array<{ time: number; weight: number }>;
    }>;
  } | null>(null);

  /** 权重对比数据 */
  const weightComparison = ref<{
    keyResults: Array<{ uuid: string; title: string }>;
    timePoints: number[];
    comparisons: Record<string, number[]>;
    deltas: Record<string, number[]>;
  } | null>(null);

  /** 分页信息 */
  const pagination = ref<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  /** 最后更新的权重信息 */
  const lastWeightUpdate = ref<{
    keyResult: { uuid: string; title: string; oldWeight: number; newWeight: number };
    snapshot: { oldWeight: number; newWeight: number; delta: number };
    timestamp: number;
  } | null>(null);

  /** 加载状态 */
  const isLoading = ref(false);
  const isUpdating = ref(false);
  const isFetchingTrend = ref(false);
  const isFetchingComparison = ref(false);

  /** 错误信息 */
  const error = ref<string | null>(null);

  // ===== 计算属性 =====

  /** 是否有 Goal 快照数据 */
  const hasGoalSnapshots = computed(() => goalSnapshots.value.length > 0);

  /** 是否有 KR 快照数据 */
  const hasKRSnapshots = computed(() => krSnapshots.value.length > 0);

  /** 是否有趋势数据 */
  const hasWeightTrend = computed(() => weightTrend.value !== null);

  /** 是否有对比数据 */
  const hasWeightComparison = computed(() => weightComparison.value !== null);

  /** 是否有分页数据 */
  const hasPagination = computed(() => pagination.value !== null);

  /** 是否可以加载更多（下一页） */
  const canLoadMore = computed(() => {
    if (!pagination.value) return false;
    return pagination.value.page < pagination.value.totalPages;
  });

  // ===== 权重更新方法 =====

  /**
   * 更新 KeyResult 权重并创建快照
   * 
   * @param goalUuid - Goal UUID
   * @param krUuid - KeyResult UUID
   * @param newWeight - 新权重值 (1-10，权重占比由所有 KR 权重的总和计算)
   * @param reason - 调整原因（可选）
   * 
   * @example
   * ```typescript
   * const { updateKRWeight } = useWeightSnapshot();
   * 
   * await updateKRWeight('goal-123', 'kr-456', 7, '根据Q1反馈调整');
   * ```
   */
  async function updateKRWeight(
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
    isUpdating.value = true;
    error.value = null;

    try {
      logger.info('Updating KR weight', { goalUuid, krUuid, newWeight, reason });

      const result = await weightSnapshotWebApplicationService.updateKRWeight(
        goalUuid,
        krUuid,
        newWeight,
        reason,
      );

      // 保存最后更新信息
      lastWeightUpdate.value = {
        keyResult: result.keyResult,
        snapshot: { oldWeight: result.keyResult.oldWeight, newWeight: result.keyResult.newWeight, delta: result.keyResult.newWeight - result.keyResult.oldWeight },
        timestamp: Date.now(),
      };

      logger.info('KR weight updated successfully', {
        krUuid,
        oldWeight: result.keyResult.oldWeight,
        newWeight: result.keyResult.newWeight,
        delta: result.keyResult.newWeight - result.keyResult.oldWeight,
        weightInfo: result.weightInfo,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新权重失败';
      error.value = message;
      logger.error('Error updating KR weight', { error: err, goalUuid, krUuid });
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  // ===== 快照查询方法 =====

  /**
   * 查询 Goal 的所有权重快照
   * 
   * @param goalUuid - Goal UUID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量（默认 20，最大 100）
   * @param append - 是否追加到现有列表（用于滚动加载）
   * 
   * @example
   * ```typescript
   * const { fetchGoalSnapshots, goalSnapshots } = useWeightSnapshot();
   * 
   * // 加载第一页
   * await fetchGoalSnapshots('goal-123', 1, 20);
   * 
   * // 加载更多（追加到列表）
   * await fetchGoalSnapshots('goal-123', 2, 20, true);
   * ```
   */
  async function fetchGoalSnapshots(
    goalUuid: string,
    page: number = 1,
    pageSize: number = 20,
    append: boolean = false,
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Fetching goal snapshots', { goalUuid, page, pageSize });

      const result = await weightSnapshotWebApplicationService.getGoalSnapshots(
        goalUuid,
        page,
        pageSize,
      );

      // 更新快照列表
      if (append) {
        goalSnapshots.value = [...goalSnapshots.value, ...result.snapshots];
      } else {
        goalSnapshots.value = result.snapshots;
      }

      // 更新分页信息
      pagination.value = result.pagination;

      logger.info('Goal snapshots fetched successfully', {
        count: result.snapshots.length,
        total: result.pagination.total,
        page: result.pagination.page,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取快照列表失败';
      error.value = message;
      logger.error('Error fetching goal snapshots', { error: err, goalUuid });
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 查询 KeyResult 的权重快照历史
   * 
   * @param krUuid - KeyResult UUID
   * @param page - 页码
   * @param pageSize - 每页数量
   * @param append - 是否追加到现有列表
   */
  async function fetchKRSnapshots(
    krUuid: string,
    page: number = 1,
    pageSize: number = 20,
    append: boolean = false,
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Fetching KR snapshots', { krUuid, page, pageSize });

      const result = await weightSnapshotWebApplicationService.getKRSnapshots(
        krUuid,
        page,
        pageSize,
      );

      // 更新快照列表
      if (append) {
        krSnapshots.value = [...krSnapshots.value, ...result.snapshots];
      } else {
        krSnapshots.value = result.snapshots;
      }

      // 更新分页信息
      pagination.value = result.pagination;

      logger.info('KR snapshots fetched successfully', {
        count: result.snapshots.length,
        total: result.pagination.total,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取 KR 快照历史失败';
      error.value = message;
      logger.error('Error fetching KR snapshots', { error: err, krUuid });
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // ===== 数据可视化方法 =====

  /**
   * 获取权重趋势数据（用于 ECharts 图表）
   * 
   * @param goalUuid - Goal UUID
   * @param startTime - 开始时间戳（毫秒）
   * @param endTime - 结束时间戳（毫秒）
   * 
   * @example
   * ```typescript
   * const { fetchWeightTrend, weightTrend } = useWeightSnapshot();
   * 
   * // 获取最近 30 天的趋势数据
   * await fetchWeightTrend(
   *   'goal-123',
   *   Date.now() - 30 * 24 * 60 * 60 * 1000,
   *   Date.now()
   * );
   * 
   * // weightTrend.value 包含 ECharts 所需的数据结构
   * ```
   */
  async function fetchWeightTrend(
    goalUuid: string,
    startTime: number,
    endTime: number,
  ): Promise<void> {
    isFetchingTrend.value = true;
    error.value = null;

    try {
      logger.info('Fetching weight trend', { goalUuid, startTime, endTime });

      const result = await weightSnapshotWebApplicationService.getWeightTrend(
        goalUuid,
        startTime,
        endTime,
      );

      weightTrend.value = result;

      logger.info('Weight trend fetched successfully', {
        timePoints: result.timePoints.length,
        keyResults: result.keyResults.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取权重趋势数据失败';
      error.value = message;
      logger.error('Error fetching weight trend', { error: err, goalUuid });
      throw err;
    } finally {
      isFetchingTrend.value = false;
    }
  }

  /**
   * 对比多个时间点的权重分配
   * 
   * @param goalUuid - Goal UUID
   * @param timePoints - 时间点数组（最多 5 个）
   * 
   * @example
   * ```typescript
   * const { fetchWeightComparison, weightComparison } = useWeightSnapshot();
   * 
   * // 对比三个时间点的权重分配
   * await fetchWeightComparison('goal-123', [
   *   Date.now() - 60 * 24 * 60 * 60 * 1000, // 60天前
   *   Date.now() - 30 * 24 * 60 * 60 * 1000, // 30天前
   *   Date.now(), // 现在
   * ]);
   * ```
   */
  async function fetchWeightComparison(goalUuid: string, timePoints: number[]): Promise<void> {
    isFetchingComparison.value = true;
    error.value = null;

    try {
      // 验证时间点数量
      if (timePoints.length === 0) {
        throw new Error('至少需要提供 1 个时间点');
      }
      if (timePoints.length > 5) {
        throw new Error('最多支持对比 5 个时间点');
      }

      logger.info('Fetching weight comparison', { goalUuid, timePoints });

      const result = await weightSnapshotWebApplicationService.getWeightComparison(
        goalUuid,
        timePoints,
      );

      weightComparison.value = result;

      logger.info('Weight comparison fetched successfully', {
        keyResults: result.keyResults.length,
        timePoints: result.timePoints.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取权重对比数据失败';
      error.value = message;
      logger.error('Error fetching weight comparison', { error: err, goalUuid });
      throw err;
    } finally {
      isFetchingComparison.value = false;
    }
  }

  // ===== 辅助方法 =====

  /**
   * 清除 Goal 快照列表
   */
  function clearGoalSnapshots(): void {
    goalSnapshots.value = [];
    pagination.value = null;
  }

  /**
   * 清除 KR 快照列表
   */
  function clearKRSnapshots(): void {
    krSnapshots.value = [];
    pagination.value = null;
  }

  /**
   * 清除趋势数据
   */
  function clearWeightTrend(): void {
    weightTrend.value = null;
  }

  /**
   * 清除对比数据
   */
  function clearWeightComparison(): void {
    weightComparison.value = null;
  }

  /**
   * 清除所有数据
   */
  function clearAll(): void {
    clearGoalSnapshots();
    clearKRSnapshots();
    clearWeightTrend();
    clearWeightComparison();
    lastWeightUpdate.value = null;
  }

  /**
   * 清除错误信息
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * 重置所有状态
   */
  function reset(): void {
    clearAll();
    clearError();
    isLoading.value = false;
    isUpdating.value = false;
    isFetchingTrend.value = false;
    isFetchingComparison.value = false;
  }

  // ===== 监听器 =====

  /**
   * 监听 Goal 快照变化，自动清除 KR 快照
   * （避免显示不一致的数据）
   */
  watch(goalSnapshots, (newVal, oldVal) => {
    if (newVal !== oldVal && newVal.length === 0 && krSnapshots.value.length > 0) {
      logger.info('Goal snapshots cleared, clearing KR snapshots as well');
      clearKRSnapshots();
    }
  });

  return {
    // ===== 状态 =====
    goalSnapshots,
    krSnapshots,
    weightTrend,
    weightComparison,
    pagination,
    lastWeightUpdate,
    isLoading,
    isUpdating,
    isFetchingTrend,
    isFetchingComparison,
    error,

    // ===== 计算属性 =====
    hasGoalSnapshots,
    hasKRSnapshots,
    hasWeightTrend,
    hasWeightComparison,
    hasPagination,
    canLoadMore,

    // ===== 权重更新 =====
    updateKRWeight,

    // ===== 快照查询 =====
    fetchGoalSnapshots,
    fetchKRSnapshots,

    // ===== 数据可视化 =====
    fetchWeightTrend,
    fetchWeightComparison,

    // ===== 辅助方法 =====
    clearGoalSnapshots,
    clearKRSnapshots,
    clearWeightTrend,
    clearWeightComparison,
    clearAll,
    clearError,
    reset,
  };
}

