import { ref, computed, reactive } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, GoalDir } from '@dailyuse/domain-client';
import { GoalWebApplicationService } from '../../application/services/GoalWebApplicationService';
import { getGoalStore } from '../stores/goalStore';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';

/**
 * Goal 业务逻辑 Composable - 新架构
 * 基于缓存优先的数据获取策略
 */
export function useGoal() {
  const goalService = new GoalWebApplicationService();
  const goalStore = getGoalStore();
  const snackbar = useSnackbar();

  // ===== 响应式状态 =====
  const isLoading = computed(() => goalStore.isLoading);
  const error = computed(() => goalStore.error);
  const goals = computed(() => goalStore.getAllGoals);
  const goalDirs = computed(() => goalStore.getAllGoalDirs);
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
   * 获取目标列表 - 缓存优先策略
   * @param forceRefresh 是否强制从API刷新
   * @param params 查询参数
   */
  const fetchGoals = async (
    forceRefresh = false,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      dirUuid?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => {
    try {
      // 检查是否需要刷新数据
      const needsRefresh =
        forceRefresh ||
        !goalStore.isInitialized ||
        goalStore.goals.length === 0 ||
        goalStore.shouldRefreshCache();

      if (needsRefresh) {
        // 从 API 获取数据时不需要用户提示，这是内部操作
        await goalService.getGoals(params);
      } else {
        // 使用缓存数据也不需要用户提示
      }

      return goalStore.getAllGoals;
    } catch (error) {
      snackbar.showError('获取目标列表失败');
      throw error;
    }
  };

  /**
   * 获取目标目录列表 - 缓存优先策略
   * @param forceRefresh 是否强制从API刷新
   * @param params 查询参数
   */
  const fetchGoalDirs = async (
    forceRefresh = false,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      parentUuid?: string;
    },
  ) => {
    try {
      // 检查是否需要刷新数据
      const needsRefresh =
        forceRefresh ||
        !goalStore.isInitialized ||
        goalStore.goalDirs.length === 0 ||
        goalStore.shouldRefreshCache();

      if (needsRefresh) {
        // 从 API 获取目录数据时不需要用户提示
        await goalService.getGoalDirs(params);
      } else {
        // 使用缓存的目录数据也不需要用户提示
      }

      return goalStore.getAllGoalDirs;
    } catch (error) {
      snackbar.showError('获取目标目录列表失败');
      throw error;
    }
  };

  /**
   * 获取目标详情 - 缓存优先策略
   * @param uuid 目标UUID
   * @param forceRefresh 是否强制从API刷新
   */
  const fetchGoalById = async (uuid: string, forceRefresh = false) => {
    try {
      // 先从缓存中查找
      const cachedGoal = goalStore.getGoalByUuid(uuid);

      if (cachedGoal && !forceRefresh) {
        // 使用缓存的目标详情，不需要用户提示
        goalStore.setSelectedGoal(uuid);
        return cachedGoal;
      }

      // 从API获取目标详情，不需要用户提示这是内部操作
      const response = await goalService.getGoalById(uuid);

      if (response) {
        goalStore.setSelectedGoal(uuid);
      }

      return response;
    } catch (error) {
      snackbar.showError('获取目标详情失败');
      throw error;
    }
  };

  /**
   * 初始化数据 - 加载所有必要的数据
   */
  const initializeData = async () => {
    try {
      // 使用 ApplicationService 的同步方法
      const result = await goalService.syncAllGoals();
      snackbar.showSuccess(
        `Goal 数据初始化完成: ${result.goalsCount} 个目标, ${result.goalDirsCount} 个目录`,
      );
    } catch (error) {
      snackbar.showError('Goal 数据初始化失败');
      throw error;
    }
  };

  // ===== Goal CRUD 操作 =====

  /**
   * 创建新目标
   */
  const createGoal = async (data: GoalContracts.CreateGoalRequest) => {
    try {
      const response = await goalService.createGoal(data);
      showCreateDialog.value = false;

      // 数据已经在 ApplicationService 中自动同步到 store
      snackbar.showSuccess('目标创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建目标失败');
      throw error;
    }
  };

  /**
   * 更新目标
   */
  const updateGoal = async (uuid: string, data: GoalContracts.UpdateGoalRequest) => {
    try {
      const response = await goalService.updateGoal(uuid, data);
      showEditDialog.value = false;
      editingGoal.value = null;

      snackbar.showSuccess('目标更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新目标失败');
      throw error;
    }
  };

  /**
   * 删除目标
   */
  const deleteGoal = async (uuid: string) => {
    try {
      await goalService.deleteGoal(uuid);

      // 如果删除的是当前目标，清除选中状态
      if (currentGoal.value?.uuid === uuid) {
        goalStore.setSelectedGoal(null);
      }

      snackbar.showSuccess('目标删除成功');
    } catch (error) {
      snackbar.showError('删除目标失败');
      throw error;
    }
  };

  // ===== Goal 状态管理 =====

  /**
   * 激活目标
   */
  const activateGoal = async (uuid: string) => {
    try {
      const result = await goalService.activateGoal(uuid);
      snackbar.showSuccess('目标激活成功');
      return result;
    } catch (error) {
      snackbar.showError('激活目标失败');
      throw error;
    }
  };

  /**
   * 暂停目标
   */
  const pauseGoal = async (uuid: string) => {
    try {
      const result = await goalService.pauseGoal(uuid);
      snackbar.showSuccess('目标暂停成功');
      return result;
    } catch (error) {
      snackbar.showError('暂停目标失败');
      throw error;
    }
  };

  /**
   * 完成目标
   */
  const completeGoal = async (uuid: string) => {
    try {
      const result = await goalService.completeGoal(uuid);
      snackbar.showSuccess('目标完成成功');
      return result;
    } catch (error) {
      snackbar.showError('完成目标失败');
      throw error;
    }
  };

  /**
   * 归档目标
   */
  const archiveGoal = async (uuid: string) => {
    try {
      const result = await goalService.archiveGoal(uuid);
      snackbar.showSuccess('目标归档成功');
      return result;
    } catch (error) {
      snackbar.showError('归档目标失败');
      throw error;
    }
  };

  // ===== GoalDir 操作 =====

  /**
   * 创建目标目录
   */
  const createGoalDir = async (data: GoalContracts.CreateGoalDirRequest) => {
    try {
      const response = await goalService.createGoalDir(data);
      snackbar.showSuccess('目标目录创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建目标目录失败');
      throw error;
    }
  };

  /**
   * 更新目标目录
   */
  const updateGoalDir = async (uuid: string, data: GoalContracts.UpdateGoalDirRequest) => {
    try {
      const response = await goalService.updateGoalDir(uuid, data);
      snackbar.showSuccess('目标目录更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新目标目录失败');
      throw error;
    }
  };

  /**
   * 删除目标目录
   */
  const deleteGoalDir = async (uuid: string) => {
    try {
      await goalService.deleteGoalDir(uuid);
      snackbar.showSuccess('目标目录删除成功');
    } catch (error) {
      snackbar.showError('删除目标目录失败');
      throw error;
    }
  };

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
    try {
      return await goalService.searchGoals({
        query,
        ...options,
      });
    } catch (error) {
      snackbar.showError('搜索目标失败');
      throw error;
    }
  };

  /**
   * 应用筛选器
   */
  const applyFilters = async () => {
    const params = {
      ...filters,
      // 移除空值
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== '')),
    };

    await fetchGoals(true, params); // 强制刷新以应用新的筛选条件
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
    await fetchGoals(true); // 强制刷新以清除筛选条件
  };

  // ===== UI 交互方法 =====

  /**
   * 打开创建对话框
   */
  const openCreateDialog = () => {
    editingGoal.value = null;
    showCreateDialog.value = true;
  };

  /**
   * 打开编辑对话框
   */
  const openEditDialog = (goal: any) => {
    editingGoal.value = goal;
    showEditDialog.value = true;
  };

  /**
   * 关闭对话框
   */
  const closeDialogs = () => {
    showCreateDialog.value = false;
    showEditDialog.value = false;
    editingGoal.value = null;
  };

  /**
   * 选择目标
   */
  const selectGoal = (goal: any) => {
    goalStore.setSelectedGoal(goal.uuid);
  };

  /**
   * 切换目标选中状态
   */
  const toggleGoalSelection = (goal: any) => {
    if (currentGoal.value?.uuid === goal.uuid) {
      goalStore.setSelectedGoal(null);
    } else {
      goalStore.setSelectedGoal(goal.uuid);
    }
  };

  /**
   * 清除所有选中
   */
  const clearSelection = () => {
    goalStore.setSelectedGoal(null);
  };

  // ===== DDD聚合根控制：KeyResult管理 =====

  /**
   * 通过Goal聚合根创建关键结果
   * 后面得在 contract 中添加 dto 类型定义
   */
  const createKeyResultForGoal = async (
    goalUuid: string,
    request: {
      name: string;
      description?: string;
      startValue: number;
      targetValue: number;
      currentValue?: number;
      unit: string;
      weight: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    },
  ) => {
    try {
      const response = await goalService.createKeyResultForGoal(goalUuid, request);
      snackbar.showSuccess('关键结果创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建关键结果失败');
      throw error;
    }
  };

  /**
   * 获取目标的所有关键结果
   */
  const getKeyResultsByGoal = async (goalUuid: string) => {
    try {
      const response = await goalService.getKeyResultsByGoal(goalUuid);
      return response;
    } catch (error) {
      snackbar.showError('获取关键结果列表失败');
      throw error;
    }
  };

  /**
   * 通过Goal聚合根更新关键结果
   */
  const updateKeyResultForGoal = async (
    goalUuid: string,
    keyResultUuid: string,
    request: GoalContracts.UpdateKeyResultRequest,
  ) => {
    try {
      const response = await goalService.updateKeyResultForGoal(goalUuid, keyResultUuid, request);
      snackbar.showSuccess('关键结果更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新关键结果失败');
      throw error;
    }
  };

  /**
   * 通过Goal聚合根删除关键结果
   */
  const deleteKeyResultForGoal = async (goalUuid: string, keyResultUuid: string) => {
    try {
      await goalService.deleteKeyResultForGoal(goalUuid, keyResultUuid);
      snackbar.showSuccess('关键结果删除成功');
    } catch (error) {
      snackbar.showError('删除关键结果失败');
      throw error;
    }
  };

  /**
   * 批量更新关键结果权重
   */
  const batchUpdateKeyResultWeights = async (
    goalUuid: string,
    updates: Array<{ keyResultUuid: string; weight: number }>,
  ) => {
    try {
      const response = await goalService.batchUpdateKeyResultWeights(goalUuid, { updates });
      snackbar.showSuccess('关键结果权重批量更新成功');
      return response;
    } catch (error) {
      snackbar.showError('批量更新关键结果权重失败');
      throw error;
    }
  };

  // ===== DDD聚合根控制：GoalRecord管理 =====

  /**
   * 通过KeyResult创建目标记录
   */
  const createGoalRecord = async (
    goalUuid: string,
    keyResultUuid: string,
    request: GoalContracts.CreateGoalRecordRequest,
  ) => {
    try {
      const response = await goalService.createGoalRecord(goalUuid, keyResultUuid, request);
      snackbar.showSuccess('目标记录创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建目标记录失败');
      throw error;
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
      const response = await goalService.getGoalRecordsByKeyResult(goalUuid, keyResultUuid, params);
      return response;
    } catch (error) {
      snackbar.showError('获取关键结果记录失败');
      throw error;
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
      const response = await goalService.getGoalRecordsByGoal(goalUuid, params);
      return response;
    } catch (error) {
      snackbar.showError('获取目标所有记录失败');
      throw error;
    }
  };

  // ===== DDD聚合根控制：GoalReview管理 =====

  /**
   * 通过Goal聚合根创建目标复盘
   */
  const createGoalReview = async (
    goalUuid: string,
    request: GoalContracts.CreateGoalReviewRequest,
  ) => {
    try {
      const response = await goalService.createGoalReview(goalUuid, request);
      snackbar.showSuccess('目标复盘创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建目标复盘失败');
      throw error;
    }
  };

  /**
   * 获取目标的所有复盘
   */
  const getGoalReviewsByGoal = async (goalUuid: string) => {
    try {
      const response = await goalService.getGoalReviewsByGoal(goalUuid);
      return response;
    } catch (error) {
      snackbar.showError('获取目标复盘失败');
      throw error;
    }
  };

  /**
   * 通过Goal聚合根更新目标复盘
   */
  const updateGoalReview = async (
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalContracts.GoalReviewDTO>,
  ) => {
    try {
      const response = await goalService.updateGoalReview(goalUuid, reviewUuid, request);
      snackbar.showSuccess('目标复盘更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新目标复盘失败');
      throw error;
    }
  };

  /**
   * 通过Goal聚合根删除目标复盘
   */
  const deleteGoalReview = async (goalUuid: string, reviewUuid: string) => {
    try {
      await goalService.deleteGoalReview(goalUuid, reviewUuid);
      snackbar.showSuccess('目标复盘删除成功');
    } catch (error) {
      snackbar.showError('删除目标复盘失败');
      throw error;
    }
  };

  // ===== DDD聚合根完整视图 =====

  /**
   * 获取Goal聚合根的完整视图
   * 包含目标、关键结果、记录、复盘等所有子实体
   */
  const getGoalAggregateView = async (goalUuid: string) => {
    try {
      const response = await goalService.getGoalAggregateView(goalUuid);
      // 获取聚合视图通常是数据加载操作，不需要成功提示
      // snackbar.showInfo('获取目标聚合视图成功');

      // 自动设置为当前选中的目标
      goalStore.setSelectedGoal(goalUuid);

      return response;
    } catch (error) {
      snackbar.showError('获取目标聚合视图失败');
      throw error;
    }
  };

  /**
   * 克隆Goal聚合根
   */
  const cloneGoal = async (
    goalUuid: string,
    options: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    } = {},
  ) => {
    try {
      const response = await goalService.cloneGoal(goalUuid, options);
      snackbar.showSuccess('目标克隆成功');
      return response;
    } catch (error) {
      snackbar.showError('克隆目标失败');
      throw error;
    }
  };

  // ===== 实体状态管理 =====

  /**
   * 当前选中目标的关键结果列表
   */
  const currentGoalKeyResults = ref<GoalContracts.KeyResultDTO[]>([]);

  /**
   * 当前选中关键结果的记录列表
   */
  const currentKeyResultRecords = ref<GoalContracts.GoalRecordDTO[]>([]);

  /**
   * 当前选中目标的复盘列表
   */
  const currentGoalReviews = ref<GoalContracts.GoalReviewDTO[]>([]);

  /**
   * 加载当前目标的关键结果
   */
  const loadCurrentGoalKeyResults = async (goalUuid: string) => {
    try {
      const response = await getKeyResultsByGoal(goalUuid);
      currentGoalKeyResults.value = response.data.map((kr) => kr); // 从 data 数组获取数据
      return response;
    } catch (error) {
      currentGoalKeyResults.value = [];
      throw error;
    }
  };

  /**
   * 加载当前关键结果的记录
   */
  const loadCurrentKeyResultRecords = async (goalUuid: string, keyResultUuid: string) => {
    try {
      const response = await getGoalRecordsByKeyResult(goalUuid, keyResultUuid);
      currentKeyResultRecords.value = response.data.map((record) => record); // 从 data 数组获取数据
      return response;
    } catch (error) {
      currentKeyResultRecords.value = [];
      throw error;
    }
  };

  /**
   * 加载当前目标的复盘
   */
  const loadCurrentGoalReviews = async (goalUuid: string) => {
    try {
      const response = await getGoalReviewsByGoal(goalUuid);
      currentGoalReviews.value = response.data; // 使用 data 字段
      return response;
    } catch (error) {
      currentGoalReviews.value = [];
      throw error;
    }
  };

  /**
   * 清除当前实体状态
   */
  const clearCurrentEntityState = () => {
    currentGoalKeyResults.value = [];
    currentKeyResultRecords.value = [];
    currentGoalReviews.value = [];
  };

  // ===== 工具方法 =====

  /**
   * 手动刷新所有数据
   */
  const refresh = async () => {
    await Promise.all([
      fetchGoals(true), // 强制刷新
      fetchGoalDirs(true), // 强制刷新
    ]);
    snackbar.showInfo('数据刷新完成');
  };

  /**
   * 初始化
   */
  const initialize = async () => {
    try {
      // 使用 ApplicationService 的初始化方法
      await goalService.initialize();
    } catch (error) {
      snackbar.showError('初始化失败');
      throw error;
    }
  };

  // ===== 计算属性 =====

  /**
   * 过滤后的目标列表
   */
  const filteredGoals = computed(() => {
    return goalStore.getFilteredGoals;
  });

  /**
   * 目标统计信息
   */
  const goalStats = computed(() => {
    return goalStore.getGoalStatistics;
  });

  /**
   * 目录统计信息
   */
  const goalDirStats = computed(() => {
    return goalStore.getGoalDirStatistics;
  });

  /**
   * 是否有选中的目标
   */
  const hasSelection = computed(() => !!currentGoal.value);

  // ===== 工具方法 =====
  /**
   * Goal 的时间进度
   * @param goal 目标实体
   * @returns 0 到 1 之间的数值，表示时间进度百分比
   */
  const getTimeProgress = (goal: Goal) => {
    const now = new Date();
    if (goal.startTime && goal.endTime) {
      const start = new Date(goal.startTime);
      const end = new Date(goal.endTime);
      if (now < start) return 0;
      if (now > end) return 1;
      return (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
    }
    return 0;
  };

  const getRemainingDays = (goal: Goal) => {
    if (goal.endTime) {
      const now = new Date();
      const end = new Date(goal.endTime);
      const diff = end.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 3600 * 24));
    }
    return 0;
  };

  return {
    // 响应式状态
    isLoading,
    error,
    goals,
    goalDirs,
    currentGoal,
    filteredGoals,
    goalStats,
    goalDirStats,
    hasSelection,

    // 本地状态
    editingGoal,
    showCreateDialog,
    showEditDialog,
    searchQuery,
    filters,

    // 数据获取方法（缓存优先）
    fetchGoals,
    fetchGoalDirs,
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

    // GoalDir 操作
    createGoalDir,
    updateGoalDir,
    deleteGoalDir,

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

    // ===== DDD聚合根控制：KeyResult管理 =====
    createKeyResultForGoal,
    getKeyResultsByGoal,
    updateKeyResultForGoal,
    deleteKeyResultForGoal,
    batchUpdateKeyResultWeights,

    // ===== DDD聚合根控制：GoalRecord管理 =====
    createGoalRecord,
    getGoalRecordsByKeyResult,
    getGoalRecordsByGoal,

    // ===== DDD聚合根控制：GoalReview管理 =====
    createGoalReview,
    getGoalReviewsByGoal,
    updateGoalReview,
    deleteGoalReview,

    // ===== DDD聚合根完整视图 =====
    getGoalAggregateView,
    cloneGoal,

    // ===== 实体状态管理 =====
    currentGoalKeyResults,
    currentKeyResultRecords,
    currentGoalReviews,
    loadCurrentGoalKeyResults,
    loadCurrentKeyResultRecords,
    loadCurrentGoalReviews,
    clearCurrentEntityState,
  };
}
