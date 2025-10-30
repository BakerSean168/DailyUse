import { ref, computed } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { focusModeApiClient } from '../../infrastructure/api/focusModeApiClient';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('useFocusMode');

/**
 * FocusMode Composable
 * 专注周期模式业务逻辑
 *
 * 职责：
 * - 封装 FocusMode 相关的业务逻辑
 * - 管理本地状态（加载、错误、当前专注周期）
 * - 提供用户友好的错误提示
 * - 处理异步操作
 *
 * 使用示例：
 * ```typescript
 * const { activeFocusMode, activateFocusMode, deactivateFocusMode } = useFocusMode();
 *
 * // 启用专注模式
 * await activateFocusMode({
 *   focusedGoalUuids: ['goal-1', 'goal-2'],
 *   startTime: Date.now(),
 *   endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天后
 *   hiddenGoalsMode: 'hide_all',
 * });
 * ```
 */
export function useFocusMode() {
  const snackbar = useSnackbar();

  // ===== 响应式状态 =====
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const activeFocusMode = ref<GoalContracts.FocusModeClientDTO | null>(null);
  const focusModeHistory = ref<GoalContracts.FocusModeClientDTO[]>([]);

  // ===== 计算属性 =====
  const hasActiveFocusMode = computed(() => activeFocusMode.value !== null);
  const isExpired = computed(() => {
    if (!activeFocusMode.value) return false;
    return Date.now() > activeFocusMode.value.endTime;
  });
  const remainingDays = computed(() => activeFocusMode.value?.remainingDays ?? 0);

  // ===== 业务方法 =====

  /**
   * 启用专注模式
   *
   * @param request - 启用专注模式请求参数
   * @returns 专注周期 DTO
   */
  const activateFocusMode = async (
    request: GoalContracts.ActivateFocusModeRequest,
  ): Promise<GoalContracts.FocusModeClientDTO> => {
    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Activating focus mode', { goalCount: request.focusedGoalUuids.length });

      const focusMode = await focusModeApiClient.activateFocusMode(request);
      activeFocusMode.value = focusMode;

      snackbar.showSuccess('专注模式已启用');
      logger.info('Focus mode activated', { uuid: focusMode.uuid });

      return focusMode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '启用专注模式失败';
      error.value = errorMessage;
      snackbar.showError(errorMessage);
      logger.error('Failed to activate focus mode', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 关闭专注模式（手动失效）
   *
   * @param uuid - 专注周期 UUID（可选，默认使用当前活跃周期）
   * @returns 失效后的专注周期 DTO
   */
  const deactivateFocusMode = async (uuid?: string): Promise<GoalContracts.FocusModeClientDTO> => {
    isLoading.value = true;
    error.value = null;

    const targetUuid = uuid || activeFocusMode.value?.uuid;
    if (!targetUuid) {
      const errorMessage = '没有活跃的专注周期';
      error.value = errorMessage;
      snackbar.showError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      logger.info('Deactivating focus mode', { uuid: targetUuid });

      const focusMode = await focusModeApiClient.deactivateFocusMode(targetUuid);
      
      // 如果关闭的是当前活跃周期，清空状态
      if (activeFocusMode.value?.uuid === targetUuid) {
        activeFocusMode.value = null;
      }

      snackbar.showSuccess('专注模式已关闭');
      logger.info('Focus mode deactivated', { uuid: targetUuid });

      return focusMode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '关闭专注模式失败';
      error.value = errorMessage;
      snackbar.showError(errorMessage);
      logger.error('Failed to deactivate focus mode', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 延期专注模式
   *
   * @param uuid - 专注周期 UUID（可选，默认使用当前活跃周期）
   * @param newEndTime - 新的结束时间戳
   * @returns 延期后的专注周期 DTO
   */
  const extendFocusMode = async (
    newEndTime: number,
    uuid?: string,
  ): Promise<GoalContracts.FocusModeClientDTO> => {
    isLoading.value = true;
    error.value = null;

    const targetUuid = uuid || activeFocusMode.value?.uuid;
    if (!targetUuid) {
      const errorMessage = '没有活跃的专注周期';
      error.value = errorMessage;
      snackbar.showError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      logger.info('Extending focus mode', { uuid: targetUuid, newEndTime });

      const focusMode = await focusModeApiClient.extendFocusMode(targetUuid, { newEndTime });
      
      // 更新当前活跃周期
      if (activeFocusMode.value?.uuid === targetUuid) {
        activeFocusMode.value = focusMode;
      }

      snackbar.showSuccess('专注周期已延期');
      logger.info('Focus mode extended', { uuid: targetUuid });

      return focusMode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '延期专注模式失败';
      error.value = errorMessage;
      snackbar.showError(errorMessage);
      logger.error('Failed to extend focus mode', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取当前活跃的专注周期
   *
   * @param forceRefresh - 是否强制刷新（默认 false，使用缓存）
   * @returns 活跃的专注周期 DTO，不存在则返回 null
   */
  const fetchActiveFocusMode = async (
    forceRefresh = false,
  ): Promise<GoalContracts.FocusModeClientDTO | null> => {
    // 如果有缓存且不强制刷新，直接返回
    if (!forceRefresh && activeFocusMode.value) {
      return activeFocusMode.value;
    }

    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Fetching active focus mode');

      const focusMode = await focusModeApiClient.getActiveFocusMode();
      activeFocusMode.value = focusMode;

      logger.info('Active focus mode fetched', { hasActive: focusMode !== null });

      return focusMode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取活跃专注周期失败';
      error.value = errorMessage;
      snackbar.showError(errorMessage);
      logger.error('Failed to fetch active focus mode', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取专注周期历史
   *
   * @param forceRefresh - 是否强制刷新（默认 false，使用缓存）
   * @returns 专注周期 DTO 列表
   */
  const fetchFocusModeHistory = async (
    forceRefresh = false,
  ): Promise<GoalContracts.FocusModeClientDTO[]> => {
    // 如果有缓存且不强制刷新，直接返回
    if (!forceRefresh && focusModeHistory.value.length > 0) {
      return focusModeHistory.value;
    }

    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Fetching focus mode history');

      const history = await focusModeApiClient.getFocusModeHistory();
      focusModeHistory.value = history;

      logger.info('Focus mode history fetched', { count: history.length });

      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取专注周期历史失败';
      error.value = errorMessage;
      snackbar.showError(errorMessage);
      logger.error('Failed to fetch focus mode history', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 清除当前状态
   */
  const clearState = () => {
    activeFocusMode.value = null;
    focusModeHistory.value = [];
    error.value = null;
  };

  return {
    // 状态
    isLoading,
    error,
    activeFocusMode,
    focusModeHistory,

    // 计算属性
    hasActiveFocusMode,
    isExpired,
    remainingDays,

    // 方法
    activateFocusMode,
    deactivateFocusMode,
    extendFocusMode,
    fetchActiveFocusMode,
    fetchFocusModeHistory,
    clearState,
  };
}
