/**
 * Task Sync Composable
 * 任务数据同步相关的组合式函数
 * 
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和 Store
 * - Service 直接返回数据或抛出错误
 * - Composable 使用 try/catch 处理错误 + 全局通知
 * 
 * ⚠️ 特殊说明：
 * - TaskSyncApplicationService 是特殊的，需要直接操作 Store 进行批量同步
 * - 因此 Composable 主要负责调用 Service + 通知用户
 */

import { ref, computed, readonly, onMounted, onBeforeUnmount } from 'vue';
import { taskSyncApplicationService } from '../../application/services';
import { useTaskStore } from '../stores/taskStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * 任务数据同步 Composable
 */
export function useTaskSync() {
  // ===== 服务和存储 =====
  const taskStore = useTaskStore();
  const { showSuccess, showError, showInfo } = useSnackbar();

  // ===== 本地状态 =====
  const isSyncing = ref(false);
  const syncError = ref<string | null>(null);
  const lastSyncTime = ref<Date | null>(null);

  // ===== 计算属性 =====

  /**
   * 是否正在加载
   */
  const isLoading = computed(() => taskStore.isLoading || isSyncing.value);

  /**
   * 错误信息
   */
  const error = computed(() => taskStore.error || syncError.value);

  /**
   * 是否已初始化
   */
  const isInitialized = computed(() => taskStore.isInitialized);

  /**
   * 缓存是否需要刷新
   */
  const shouldRefresh = computed(() => taskStore.shouldRefreshCache());

  // ===== 同步方法 =====

  /**
   * 同步所有任务数据
   * 从服务器获取所有任务数据并更新到 store
   */
  async function syncAllTaskData() {
    try {
      isSyncing.value = true;
      syncError.value = null;

      const result = await taskSyncApplicationService.syncAllTaskData();
      lastSyncTime.value = new Date();

      console.log(
        `✅ [useTaskSync] 同步完成: ${result.templatesCount} 个模板, ${result.instancesCount} 个实例`,
      );
      
      // ✅ 全局通知
      showSuccess(`同步完成: ${result.templatesCount} 个模板, ${result.instancesCount} 个实例`);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '同步任务数据失败';
      syncError.value = errorMessage;
      console.error('❌ [useTaskSync] 同步失败:', err);
      // ✅ 全局通知
      showError(errorMessage);
      throw err;
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * 检查是否需要同步数据
   */
  function shouldSyncData(): boolean {
    return taskSyncApplicationService.shouldSyncData();
  }

  /**
   * 强制重新同步所有数据
   */
  async function forceSync() {
    try {
      isSyncing.value = true;
      syncError.value = null;

      console.log('🔄 [useTaskSync] 强制同步开始...');
      await taskSyncApplicationService.forceSync();
      lastSyncTime.value = new Date();

      console.log('✅ [useTaskSync] 强制同步完成');
      // ✅ 全局通知
      showSuccess('🔄 数据同步完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '强制同步失败';
      syncError.value = errorMessage;
      console.error('❌ [useTaskSync] 强制同步失败:', err);
      // ✅ 全局通知
      showError(errorMessage);
      throw err;
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * 智能同步数据 - 只在需要时同步
   */
  async function smartSync() {
    try {
      isSyncing.value = true;
      syncError.value = null;

      const result = await taskSyncApplicationService.smartSync();

      if (result.synced) {
        lastSyncTime.value = new Date();
        console.log('✅ [useTaskSync] 智能同步完成:', result.reason);
        // ✅ 全局通知（静默，不打扰用户）
      } else {
        console.log('⏭️ [useTaskSync] 跳过同步:', result.reason);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '智能同步失败';
      syncError.value = errorMessage;
      console.error('❌ [useTaskSync] 智能同步失败:', err);
      // ✅ 全局通知
      showError(errorMessage);
      throw err;
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * 检查并刷新过期数据
   */
  async function refreshIfNeeded() {
    try {
      isSyncing.value = true;
      syncError.value = null;

      const didRefresh = await taskSyncApplicationService.refreshIfNeeded();

      if (didRefresh) {
        lastSyncTime.value = new Date();
        console.log('✅ [useTaskSync] 缓存已刷新');
        // ✅ 静默刷新，不通知用户
      } else {
        console.log('✅ [useTaskSync] 缓存仍然有效');
      }

      return didRefresh;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新数据失败';
      syncError.value = errorMessage;
      console.error('❌ [useTaskSync] 刷新失败:', err);
      // 静默失败，不打扰用户
      return false;
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * 初始化模块
   * 只初始化 store（加载本地缓存），不进行网络同步
   */
  async function initializeModule() {
    try {
      isSyncing.value = true;
      syncError.value = null;

      console.log('[useTaskSync] 初始化模块（仅本地缓存）...');
      await taskSyncApplicationService.initializeModule();
      console.log('✅ [useTaskSync] 模块初始化完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化模块失败';
      syncError.value = errorMessage;
      console.error('❌ [useTaskSync] 初始化失败:', err);
      throw err;
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * 完整初始化（包含数据同步）
   */
  async function initialize() {
    try {
      isSyncing.value = true;
      syncError.value = null;

      console.log('[useTaskSync] 完整初始化开始（含数据同步）...');
      await taskSyncApplicationService.initialize();
      lastSyncTime.value = new Date();
      console.log('✅ [useTaskSync] 完整初始化完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化失败';
      syncError.value = errorMessage;
      console.error('❌ [useTaskSync] 初始化失败:', err);
      // ✅ 初始化失败时通知用户
      showError('任务数据加载失败，请刷新页面重试');
      throw err;
    } finally {
      isSyncing.value = false;
    }
  }

  // ===== 工具方法 =====

  /**
   * 清除错误状态
   */
  function clearError() {
    syncError.value = null;
    taskStore.setError(null);
  }

  /**
   * 清除所有本地数据
   */
  function clearLocalData() {
    taskStore.setTaskTemplates([]);
    taskStore.setTaskInstances([]);
    taskStore.setError(null);
    taskStore.setInitialized(false);
    lastSyncTime.value = null;
    console.log('🗑️ [useTaskSync] 本地数据已清除');
  }

  /**
   * 重置同步状态
   */
  function resetSyncState() {
    isSyncing.value = false;
    syncError.value = null;
    lastSyncTime.value = null;
  }

  // ===== 生命周期管理 =====

  /**
   * 自动初始化配置
   */
  const autoInitialize = ref(false);

  /**
   * 自动刷新配置
   */
  const autoRefresh = ref(false);
  const autoRefreshInterval = ref(5 * 60 * 1000); // 默认 5 分钟
  let refreshTimer: NodeJS.Timeout | null = null;

  /**
   * 启动自动刷新
   */
  function startAutoRefresh(interval?: number) {
    if (interval) {
      autoRefreshInterval.value = interval;
    }

    autoRefresh.value = true;

    refreshTimer = setInterval(async () => {
      if (shouldRefresh.value) {
        console.log('[useTaskSync] 自动刷新触发...');
        await refreshIfNeeded();
      }
    }, autoRefreshInterval.value);

    console.log(`🔄 [useTaskSync] 自动刷新已启动 (间隔: ${autoRefreshInterval.value}ms)`);
  }

  /**
   * 停止自动刷新
   */
  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
      autoRefresh.value = false;
      console.log('⏹️ [useTaskSync] 自动刷新已停止');
    }
  }

  onMounted(async () => {
    if (autoInitialize.value) {
      try {
        await initialize();
      } catch (error) {
        console.error('[useTaskSync] 自动初始化失败:', error);
      }
    }
  });

  onBeforeUnmount(() => {
    stopAutoRefresh();
    clearError();
  });

  // ===== 返回接口 =====

  return {
    // 状态
    isLoading: readonly(isLoading),
    isSyncing: readonly(isSyncing),
    error: readonly(error),
    syncError: readonly(syncError),
    isInitialized: readonly(isInitialized),
    shouldRefresh: readonly(shouldRefresh),
    lastSyncTime: readonly(lastSyncTime),

    // 同步方法
    syncAllTaskData,
    shouldSyncData,
    forceSync,
    smartSync,
    refreshIfNeeded,
    initializeModule,
    initialize,

    // 工具方法
    clearError,
    clearLocalData,
    resetSyncState,

    // 自动刷新
    autoRefresh: readonly(autoRefresh),
    autoRefreshInterval: readonly(autoRefreshInterval),
    startAutoRefresh,
    stopAutoRefresh,

    // 配置
    autoInitialize,
  };
}

/**
 * 轻量级同步状态访问
 * 只提供状态查询，不执行同步操作
 */
export function useTaskSyncStatus() {
  const taskStore = useTaskStore();

  return {
    // 状态
    isLoading: computed(() => taskStore.isLoading),
    error: computed(() => taskStore.error),
    isInitialized: computed(() => taskStore.isInitialized),
    shouldRefresh: computed(() => taskStore.shouldRefreshCache()),

    // 缓存信息
    cacheExpiry: computed(() => taskStore.cacheExpiry),
    lastSyncTime: computed(() => taskStore.lastSyncTime),
  };
}
