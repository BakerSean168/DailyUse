/**
 * Task Dashboard Composable
 * 任务仪表板组合式函数
 *
 * 职责：
 * - 提供仪表板数据
 * - 统计数据计算
 * - 自动刷新机制
 */

import { ref, computed, readonly, onMounted, onUnmounted } from 'vue';
import type { TaskDashboardResponse } from '@dailyuse/contracts/task';


/**
 * 任务仪表板 Composable
 */
export function useTaskDashboard() {
  // ===== 本地状态 =====
  const dashboardData = ref<TaskDashboardResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<number | null>(null);

  // 自动刷新定时器
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  // ===== 计算属性 =====

  /**
   * 今日任务数量
   */
  const todayTasksCount = computed(() => dashboardData.value?.todayTasks.length ?? 0);

  /**
   * 逾期任务数量
   */
  const overdueTasksCount = computed(() => dashboardData.value?.overdueTasks.length ?? 0);

  /**
   * 即将到期任务数量
   */
  const upcomingTasksCount = computed(
    () => dashboardData.value?.upcomingTasks.length ?? 0,
  );

  /**
   * 高优先级任务数量
   */
  const highPriorityTasksCount = computed(
    () => dashboardData.value?.highPriorityTasks.length ?? 0,
  );

  /**
   * 总任务数
   */
  const totalTasksCount = computed(() => dashboardData.value?.summary.totalTasks ?? 0);

  /**
   * 今日完成数
   */
  const completedTodayCount = computed(
    () => dashboardData.value?.summary.completedToday ?? 0,
  );

  /**
   * 完成率
   */
  const completionRate = computed(() => {
    const summary = dashboardData.value?.summary;
    if (!summary || summary.totalTasks === 0) return 0;
    return Math.round((summary.completedToday / summary.totalTasks) * 100);
  });

  /**
   * 是否有逾期任务
   */
  const hasOverdueTasks = computed(() => overdueTasksCount.value > 0);

  /**
   * 是否有高优先级任务
   */
  const hasHighPriorityTasks = computed(() => highPriorityTasksCount.value > 0);

  /**
   * 仪表板状态摘要
   */
  const statusSummary = computed(() => ({
    today: todayTasksCount.value,
    overdue: overdueTasksCount.value,
    upcoming: upcomingTasksCount.value,
    highPriority: highPriorityTasksCount.value,
    total: totalTasksCount.value,
    completedToday: completedTodayCount.value,
    completionRate: completionRate.value,
  }));

  /**
   * 是否需要关注（有逾期或高优先级任务）
   */
  const needsAttention = computed(
    () => hasOverdueTasks.value || hasHighPriorityTasks.value,
  );

  /**
   * 数据是否已加载
   */
  const isDataLoaded = computed(() => dashboardData.value !== null);

  /**
   * 距离上次更新的时间（秒）
   */
  const secondsSinceUpdate = computed(() => {
    if (!lastUpdated.value) return null;
    return Math.floor((Date.now() - lastUpdated.value) / 1000);
  });

  // ===== 数据加载 =====

  /**
   * 加载仪表板数据
   */
  async function loadDashboard(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      // TODO: 实现仪表板数据加载
      // 需要后端 API 支持 task dashboard endpoint
      console.warn('仪表板数据加载功能待实现');
      dashboardData.value = null;
      lastUpdated.value = Date.now();
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载仪表板数据失败';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 刷新仪表板数据
   */
  async function refresh(): Promise<void> {
    return loadDashboard();
  }

  /**
   * 清除错误
   */
  function clearError(): void {
    error.value = null;
  }

  // ===== 自动刷新 =====

  /**
   * 启动自动刷新
   * @param intervalSeconds 刷新间隔（秒），默认 60 秒
   */
  function startAutoRefresh(intervalSeconds: number = 60): void {
    stopAutoRefresh(); // 先停止已有的定时器

    refreshTimer = setInterval(() => {
      if (!isLoading.value) {
        loadDashboard().catch((err) => {
          console.error('Auto refresh failed:', err);
        });
      }
    }, intervalSeconds * 1000);
  }

  /**
   * 停止自动刷新
   */
  function stopAutoRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // ===== 生命周期钩子 =====

  /**
   * 组件挂载时自动加载数据
   */
  onMounted(() => {
    loadDashboard();
  });

  /**
   * 组件卸载时清理定时器
   */
  onUnmounted(() => {
    stopAutoRefresh();
  });

  // ===== UI 便捷属性 =====

  /**
   * 统计信息（用于仪表盘组件）
   */
  const statistics = computed(() => ({
    total: totalTasksCount.value,
    completed: completedTodayCount.value,
    pending: 0, // TODO: calculate from task list
    inProgress: 0, // TODO: calculate from task list
    overdue: overdueTasksCount.value,
    completionRate: completionRate.value,
  }));

  /**
   * 优先级分布（用于仪表盘组件）
   */
  const priorityDistribution = computed(() => {
    const data = dashboardData.value;
    if (!data) return [];

    // Calculate from actual task lists
    const highPriorityCount = data.highPriorityTasks?.length ?? 0;

    return [
      { priority: 'CRITICAL', count: 0, color: 'error' }, // TODO: filter from high priority
      { priority: 'HIGH', count: highPriorityCount, color: 'warning' },
      { priority: 'MEDIUM', count: 0, color: 'info' }, // TODO: calculate
      { priority: 'LOW', count: 0, color: 'success' }, // TODO: calculate
    ];
  });

  /**
   * 状态分布（用于仪表盘组件）
   */
  const statusDistribution = computed(() => {
    const data = dashboardData.value;
    if (!data) return [];

    const blockedCount = data.blockedTasks?.length ?? 0;

    return [
      { status: 'PENDING', count: 0, color: 'grey' }, // TODO: calculate
      { status: 'IN_PROGRESS', count: 0, color: 'primary' }, // TODO: calculate
      { status: 'COMPLETED', count: completedTodayCount.value, color: 'success' },
      { status: 'BLOCKED', count: blockedCount, color: 'warning' },
      { status: 'CANCELLED', count: 0, color: 'error' }, // TODO: calculate
    ];
  });

  /**
   * 逾期任务列表（用于仪表盘组件）
   */
  const overdueTasks = computed(() => dashboardData.value?.overdueTasks ?? []);

  /**
   * 即将到期任务列表（用于仪表盘组件）
   */
  const upcomingTasks = computed(() => dashboardData.value?.upcomingTasks ?? []);

  /**
   * 最近完成的任务（用于仪表盘组件）
   * TODO: Implement recentCompleted in API response
   */
  const recentCompleted = computed(() => []);

  /**
   * 刷新仪表盘（别名，用于 UI）
   */
  const refreshDashboard = refresh;

  // ===== 返回 API =====

  return {
    // 原始数据
    dashboardData: readonly(dashboardData),

    // 计算属性
    todayTasksCount: readonly(todayTasksCount),
    overdueTasksCount: readonly(overdueTasksCount),
    upcomingTasksCount: readonly(upcomingTasksCount),
    highPriorityTasksCount: readonly(highPriorityTasksCount),
    totalTasksCount: readonly(totalTasksCount),
    completedTodayCount: readonly(completedTodayCount),
    completionRate: readonly(completionRate),
    statusSummary: readonly(statusSummary),
    hasOverdueTasks: readonly(hasOverdueTasks),
    hasHighPriorityTasks: readonly(hasHighPriorityTasks),
    needsAttention: readonly(needsAttention),
    isDataLoaded: readonly(isDataLoaded),
    secondsSinceUpdate: readonly(secondsSinceUpdate),

    // UI 便捷属性（推荐使用）
    statistics: readonly(statistics),
    priorityDistribution: readonly(priorityDistribution),
    statusDistribution: readonly(statusDistribution),
    overdueTasks: readonly(overdueTasks),
    upcomingTasks: readonly(upcomingTasks),
    recentCompleted: readonly(recentCompleted),

    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),

    // 操作方法
    loadDashboard,
    refresh,
    refreshDashboard,
    clearError,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

