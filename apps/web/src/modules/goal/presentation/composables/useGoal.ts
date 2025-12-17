/**
 * Goal 业务逻辑 Composable - 统一入口
 *
 * 这个 composable 聚合了所有 goal 相关的功能，提供向后兼容的 API
 *
 * 🔄 重构说明：
 * - 这是一个聚合版本，组合多个细粒度 composable
 * - 大部分操作委托给专门的 composable
 * - 保持向后兼容性
 *
 * 推荐使用方式：
 * - 如果只需要目标管理功能，使用 useGoalManagement()
 * - 如果只需要文件夹功能，使用 useGoalFolder()
 * - 如果只需要关键结果功能，使用 useKeyResult()
 * - 如果需要所有功能，使用 useGoal()（向后兼容）
 */

import { ref, computed, reactive, readonly } from 'vue';
import type {
  CreateGoalRequest,
  UpdateGoalRequest,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  ProgressBreakdown,
  CreateGoalRecordRequest,
  CreateGoalReviewRequest,
  UpdateGoalReviewRequest,
  CreateGoalFolderRequest,
  UpdateGoalFolderRequest,
} from '@dailyuse/contracts/goal';
import { useGoalManagement } from './useGoalManagement';
import { useGoalFolder } from './useGoalFolder';
import { useKeyResult } from './useKeyResult';
import {
  goalRecordApplicationService,
  goalReviewApplicationService,
  goalSyncApplicationService,
} from '../../application/services';
import { getGoalStore } from '../stores/goalStore';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

/**
 * Goal 业务逻辑 Composable - 聚合版本
 * 整合所有 goal 相关的功能
 */
export function useGoal() {
  const goalStore = getGoalStore();
  const { success: showSuccess, error: showError, info: showInfo } = getGlobalMessage();

  // 使用拆分后的 composables
  const goalManagement = useGoalManagement();
  const goalFolder = useGoalFolder();
  const keyResult = useKeyResult();

  // ===== 响应式状态 =====
  const isLoading = computed(() => goalStore.isLoading);
  const error = computed(() => goalStore.error);
  const goals = computed(() => goalStore.getAllGoals);
  const GoalFolders = computed(() => goalStore.getAllGoalFolders);
  const currentGoal = computed(() => goalStore.getSelectedGoal);

  // ===== 本地状态 =====
  const editingGoal = ref<any | null>(null);
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const searchQuery = ref('');
  const filters = reactive({
    status: '',
    dirUuid: '',
    startDate: '',
    endDate: '',
  });

  // ===== 缓存优先的数据获取方法 =====

  /**
   * 获取目标列表 - 委托给 useGoalManagement
   */
  const fetchGoals = goalManagement.fetchGoals;

  /**
   * 获取目标目录列表 - 委托给 useGoalFolder
   */
  const fetchGoalFolders = goalFolder.fetchFolders;

  /**
   * 获取目标详情 - 委托给 useGoalManagement
   */
  const fetchGoalById = goalManagement.fetchGoalByUuid;

  /**
   * 初始化数据 - 委托给 useGoalManagement
   */
  const initializeData = goalManagement.initializeData;

  // ===== Goal CRUD 操作 - 委托给 useGoalManagement =====
  const createGoal = goalManagement.createGoal;
  const updateGoal = goalManagement.updateGoal;
  const deleteGoal = goalManagement.deleteGoal;

  // ===== Goal 状态管理 - 委托给 useGoalManagement =====
  const activateGoal = goalManagement.activateGoal;
  const pauseGoal = goalManagement.pauseGoal;
  const completeGoal = goalManagement.completeGoal;
  const archiveGoal = goalManagement.archiveGoal;

  // ===== Goal 聚合视图 - 委托给 useGoalManagement =====
  const getGoalAggregateView = goalManagement.getGoalAggregateView;

  // ===== GoalFolder 操作 - 委托给 useGoalFolder =====
  const createGoalFolder = goalFolder.createFolder;
  const updateGoalFolder = goalFolder.updateFolder;
  const deleteGoalFolder = goalFolder.deleteFolder;

  // ===== 搜索和筛选 =====

  /**
   * 搜索目标
   */
  const searchGoals = async (
    query: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      dirUuid?: string;
    },
  ) => {
    // TODO: 可以添加到 useGoalManagement
    return goalManagement.fetchGoals(true, {
      ...options,
    });
  };

  /**
   * 应用筛选器
   */
  const applyFilters = async () => {
    const params = {
      ...filters,
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== '')),
    };

    await goalManagement.fetchGoals(true, params);
  };

  /**
   * 清除筛选器
   */
  const clearFilters = async () => {
    Object.assign(filters, {
      status: '',
      dirUuid: '',
      startDate: '',
      endDate: '',
    });
    await goalManagement.fetchGoals(true);
  };

  // ===== UI 交互方法 =====

  const openCreateDialog = () => {
    editingGoal.value = null;
    showCreateDialog.value = true;
  };

  const openEditDialog = (goal: any) => {
    editingGoal.value = goal;
    showEditDialog.value = true;
  };

  const closeDialogs = () => {
    showCreateDialog.value = false;
    showEditDialog.value = false;
    editingGoal.value = null;
  };

  const selectGoal = (goal: any) => {
    goalStore.setSelectedGoal(goal.uuid);
  };

  const toggleGoalSelection = (goal: any) => {
    if (currentGoal.value?.uuid === goal.uuid) {
      goalStore.setSelectedGoal(null);
    } else {
      goalStore.setSelectedGoal(goal.uuid);
    }
  };

  const clearSelection = () => {
    goalStore.setSelectedGoal(null);
  };

  // ===== DDD聚合根控制：KeyResult管理 - 委托给 useKeyResult =====
  const createKeyResultForGoal = keyResult.createKeyResult;
  const getKeyResultsByGoal = keyResult.fetchKeyResultsByGoal;
  const updateKeyResultForGoal = keyResult.updateKeyResult;
  const deleteKeyResultForGoal = keyResult.deleteKeyResult;
  const batchUpdateKeyResultWeights = keyResult.batchUpdateWeights;
  const fetchProgressBreakdown = keyResult.fetchProgressBreakdown;

  // ===== DDD聚合根控制：GoalRecord管理 =====

  /**
   * 通过KeyResult创建目标记录
   */
  const createGoalRecord = async (
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ) => {
    try {
      const response = await goalRecordApplicationService.createGoalRecord(
        goalUuid,
        keyResultUuid,
        request,
      );

      showSuccess('目标记录创建成功');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建目标记录失败';
      showError(errorMessage);
      throw err;
    }
  };

  /**
   * 获取关键结果的所有记录
   */
  const getGoalRecordsByKeyResult = async (
    goalUuid: string,
    keyResultUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ) => {
    try {
      return await goalRecordApplicationService.getGoalRecordsByKeyResult(
        goalUuid,
        keyResultUuid,
        params,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取关键结果记录失败';
      showError(errorMessage);
      throw err;
    }
  };

  /**
   * 获取目标的所有记录
   */
  const getGoalRecordsByGoal = async (
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ) => {
    try {
      return await goalRecordApplicationService.getGoalRecordsByGoal(goalUuid, params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取目标所有记录失败';
      showError(errorMessage);
      throw err;
    }
  };

  // ===== DDD聚合根控制：GoalReview管理 =====

  /**
   * 通过Goal聚合根创建目标复盘
   */
  const createGoalReview = async (goalUuid: string, request: CreateGoalReviewRequest) => {
    try {
      const response = await goalReviewApplicationService.createGoalReview(goalUuid, request);
      showSuccess('目标复盘创建成功');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建目标复盘失败';
      showError(errorMessage);
      throw err;
    }
  };

  /**
   * 获取目标的所有复盘
   */
  const getGoalReviewsByGoal = async (goalUuid: string) => {
    try {
      return await goalReviewApplicationService.getGoalReviewsByGoal(goalUuid);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取目标复盘失败';
      showError(errorMessage);
      throw err;
    }
  };

  /**
   * 通过Goal聚合根更新目标复盘
   */
  const updateGoalReview = async (
    goalUuid: string,
    reviewUuid: string,
    request: Partial<UpdateGoalReviewRequest>,
  ) => {
    try {
      const response = await goalReviewApplicationService.updateGoalReview(
        goalUuid,
        reviewUuid,
        request,
      );
      showSuccess('目标复盘更新成功');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新目标复盘失败';
      showError(errorMessage);
      throw err;
    }
  };

  /**
   * 通过Goal聚合根删除目标复盘
   */
  const deleteGoalReview = async (goalUuid: string, reviewUuid: string) => {
    try {
      await goalReviewApplicationService.deleteGoalReview(goalUuid, reviewUuid);
      showSuccess('目标复盘删除成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除目标复盘失败';
      showError(errorMessage);
      throw err;
    }
  };

  // ===== 实体状态管理 =====

  const currentGoalKeyResults = ref<any[]>([]);
  const currentKeyResultRecords = ref<any[]>([]);
  const currentGoalReviews = ref<any[]>([]);

  const loadCurrentGoalKeyResults = async (goalUuid: string) => {
    try {
      const response = await getKeyResultsByGoal(goalUuid);
      currentGoalKeyResults.value = response.keyResults || [];
      return response;
    } catch (error) {
      currentGoalKeyResults.value = [];
      throw error;
    }
  };

  const loadCurrentKeyResultRecords = async (goalUuid: string, keyResultUuid: string) => {
    try {
      const response = await getGoalRecordsByKeyResult(goalUuid, keyResultUuid);
      currentKeyResultRecords.value = response.records || [];
      return response;
    } catch (error) {
      currentKeyResultRecords.value = [];
      throw error;
    }
  };

  const loadCurrentGoalReviews = async (goalUuid: string) => {
    try {
      const response = await getGoalReviewsByGoal(goalUuid);
      currentGoalReviews.value = response.reviews || [];
      return response;
    } catch (error) {
      currentGoalReviews.value = [];
      throw error;
    }
  };

  const clearCurrentEntityState = () => {
    currentGoalKeyResults.value = [];
    currentKeyResultRecords.value = [];
    currentGoalReviews.value = [];
  };

  // ===== 工具方法 =====

  const refresh = goalManagement.refresh;

  const initialize = async () => {
    try {
      await initializeData();
    } catch (error) {
      showError('初始化失败');
      throw error;
    }
  };

  // ===== 计算属性 =====

  const filteredGoals = computed(() => goalStore.getFilteredGoals);
  const goalStats = computed(() => goalStore.getGoalStatistics);
  const GoalFolderStats = computed(() => goalStore.getGoalFolderStatistics);
  const hasSelection = computed(() => !!currentGoal.value);

  // ===== 时间工具方法 =====
  const DAY_MS = 1000 * 60 * 60 * 24;
  const DEFAULT_DURATION = 30 * DAY_MS;

  const toTimestamp = (value?: number | string | Date | null) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    const date = new Date(value);
    const time = date.getTime();
    return Number.isNaN(time) ? null : time;
  };

  const resolveGoalTimeRange = (goal: any) => {
    if (!goal) return { start: null, end: null };

    const startCandidates = [goal.startDate, goal.startTime, goal.createdAt];
    const endCandidates = [
      goal.targetDate,
      goal.endDate,
      goal.endTime,
      goal.completedAt,
      goal.updatedAt,
    ];

    const start = startCandidates.map(toTimestamp).find((value) => value !== null) ?? null;
    let end = endCandidates.map(toTimestamp).find((value) => value !== null) ?? null;

    if (start && (!end || end <= start)) {
      end = start + DEFAULT_DURATION;
    }

    return { start, end };
  };

  const getTimeProgress = (goal: any) => {
    if (!goal) return 0;
    if (typeof goal.timeProgressRatio === 'number' && !Number.isNaN(goal.timeProgressRatio)) {
      return Math.min(Math.max(goal.timeProgressRatio, 0), 1);
    }
    if (
      typeof goal.timeProgressPercentage === 'number' &&
      !Number.isNaN(goal.timeProgressPercentage)
    ) {
      return Math.min(Math.max(goal.timeProgressPercentage / 100, 0), 1);
    }
    if (goal.timeRangeSummary?.elapsedDays !== undefined && goal.timeRangeSummary?.durationDays) {
      const ratio = goal.timeRangeSummary.elapsedDays / goal.timeRangeSummary.durationDays;
      return Math.min(Math.max(ratio, 0), 1);
    }
    const { start, end } = resolveGoalTimeRange(goal);
    if (!start || !end || end <= start) return 0;
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 1;
    return (now - start) / (end - start);
  };

  const getRemainingDays = (goal: any) => {
    if (!goal) return 0;
    const summaryRemaining = goal.timeRangeSummary?.remainingDays;
    if (summaryRemaining !== undefined && summaryRemaining !== null) {
      return summaryRemaining;
    }
    const { end } = resolveGoalTimeRange(goal);
    if (!end) return 0;
    const diff = end - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / DAY_MS);
  };

  return {
    // 响应式状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    goals: readonly(goals),
    GoalFolders: readonly(GoalFolders),
    currentGoal: readonly(currentGoal),
    filteredGoals: readonly(filteredGoals),
    goalStats: readonly(goalStats),
    GoalFolderStats: readonly(GoalFolderStats),
    hasSelection: readonly(hasSelection),

    // 本地状态
    editingGoal,
    showCreateDialog,
    showEditDialog,
    searchQuery,
    filters,

    // 数据获取方法（缓存优先）
    fetchGoals,
    fetchGoalFolders,
    fetchGoalById,
    initializeData,

    // Goal 操作
    createGoal,
    updateGoal,
    deleteGoal,

    // Goal 状态管理
    activateGoal,
    pauseGoal,
    completeGoal,
    archiveGoal,

    // Goal 聚合视图
    getGoalAggregateView,

    // GoalFolder 操作
    createGoalFolder,
    updateGoalFolder,
    deleteGoalFolder,

    // 搜索和筛选
    searchGoals,
    applyFilters,
    clearFilters,

    // UI 交互
    openCreateDialog,
    openEditDialog,
    closeDialogs,
    selectGoal,
    toggleGoalSelection,
    clearSelection,

    // 工具方法
    refresh,
    initialize,
    getTimeProgress,
    getRemainingDays,

    // DDD聚合根控制：KeyResult管理
    createKeyResultForGoal,
    getKeyResultsByGoal,
    updateKeyResultForGoal,
    deleteKeyResultForGoal,
    batchUpdateKeyResultWeights,
    fetchProgressBreakdown,

    // DDD聚合根控制：GoalRecord管理
    createGoalRecord,
    getGoalRecordsByKeyResult,
    getGoalRecordsByGoal,

    // DDD聚合根控制：GoalReview管理
    createGoalReview,
    getGoalReviewsByGoal,
    updateGoalReview,
    deleteGoalReview,

    // 实体状态管理
    currentGoalKeyResults,
    currentKeyResultRecords,
    currentGoalReviews,
    loadCurrentGoalKeyResults,
    loadCurrentKeyResultRecords,
    loadCurrentGoalReviews,
    clearCurrentEntityState,
  };
}




