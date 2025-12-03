import { ref, computed } from 'vue';
import type {
  FocusModeClientDTO,
  ActivateFocusModeRequest,
} from '@dailyuse/contracts/goal';
import { focusModeApplicationService } from '../../application/services';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

/**
 * FocusMode Composable
 * 专注周期模式业务逻辑
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和状态管理
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
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
  const { success: showSuccess, error: showError } = getGlobalMessage();

  // ===== 响应式状态 =====
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const activeFocusMode = ref<FocusModeClientDTO | null>(null);
  const focusModeHistory = ref<FocusModeClientDTO[]>([]);

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
   */
  const activate = async (request: ActivateFocusModeRequest): Promise<FocusModeClientDTO> => {
    try {
      isLoading.value = true;
      error.value = null;

      const focusMode = await focusModeApplicationService.activateFocusMode(request);
      activeFocusMode.value = focusMode;

      showSuccess('专注模式已启用');
      return focusMode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '启用专注模式失败';
      error.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 关闭专注模式（手动失效）
   */
  const deactivate = async (uuid?: string): Promise<FocusModeClientDTO> => {
    const targetUuid = uuid || activeFocusMode.value?.uuid;
    if (!targetUuid) {
      const errorMessage = '没有活跃的专注周期';
      error.value = errorMessage;
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      isLoading.value = true;
      error.value = null;

      const focusMode = await focusModeApplicationService.deactivateFocusMode(targetUuid);

      // 如果关闭的是当前活跃周期，清空状态
      if (activeFocusMode.value?.uuid === targetUuid) {
        activeFocusMode.value = null;
      }

      showSuccess('专注模式已关闭');
      return focusMode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '关闭专注模式失败';
      error.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 延期专注模式
   */
  const extend = async (newEndTime: number, uuid?: string): Promise<FocusModeClientDTO> => {
    const targetUuid = uuid || activeFocusMode.value?.uuid;
    if (!targetUuid) {
      const errorMessage = '没有活跃的专注周期';
      error.value = errorMessage;
      showError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      isLoading.value = true;
      error.value = null;

      const focusMode = await focusModeApplicationService.extendFocusMode(targetUuid, {
        newEndTime,
      });

      // 更新当前活跃周期
      if (activeFocusMode.value?.uuid === targetUuid) {
        activeFocusMode.value = focusMode;
      }

      showSuccess('专注周期已延期');
      return focusMode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '延期专注模式失败';
      error.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取当前活跃的专注周期
   */
  const fetchActive = async (forceRefresh = false): Promise<FocusModeClientDTO | null> => {
    // 如果有缓存且不强制刷新，直接返回
    if (!forceRefresh && activeFocusMode.value) {
      return activeFocusMode.value;
    }

    try {
      isLoading.value = true;
      error.value = null;

      const focusMode = await focusModeApplicationService.getActiveFocusMode();
      activeFocusMode.value = focusMode;

      return focusMode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取活跃专注周期失败';
      error.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取专注周期历史
   */
  const fetchHistory = async (forceRefresh = false): Promise<FocusModeClientDTO[]> => {
    // 如果有缓存且不强制刷新，直接返回
    if (!forceRefresh && focusModeHistory.value.length > 0) {
      return focusModeHistory.value;
    }

    try {
      isLoading.value = true;
      error.value = null;

      const history = await focusModeApplicationService.getFocusModeHistory();
      focusModeHistory.value = history;

      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取专注周期历史失败';
      error.value = errorMessage;
      showError(errorMessage);
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
    activateFocusMode: activate,
    deactivateFocusMode: deactivate,
    extendFocusMode: extend,
    fetchActiveFocusMode: fetchActive,
    fetchFocusModeHistory: fetchHistory,
    clearState,
  };
}

