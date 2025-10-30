import { ref, computed } from 'vue';
import { ScheduleContracts } from '@dailyuse/contracts';
import {
  scheduleEventApiClient,
  type CreateScheduleEventRequest,
  type UpdateScheduleEventRequest,
  type GetSchedulesByTimeRangeRequest,
} from '../../infrastructure/api/scheduleEventApiClient';
import { useSnackbarNotification } from '@/composables/useSnackbarNotification';

/**
 * Schedule Event Composable
 * 日程事件状态管理
 * 
 * Story 4-1: Schedule Event CRUD
 */

/**
 * Schedule Event Store (module-level singleton)
 */
const schedules = ref<Map<string, ScheduleContracts.ScheduleClientDTO>>(new Map());
const activeScheduleUuid = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<Error | null>(null);

/**
 * useScheduleEvent Composable
 */
export function useScheduleEvent() {
  const { showSuccess, showError, showWarning } = useSnackbarNotification();

  // ============ Computed ============

  const activeSchedule = computed(() => {
    if (!activeScheduleUuid.value) return null;
    return schedules.value.get(activeScheduleUuid.value) || null;
  });

  const schedulesList = computed(() => {
    return Array.from(schedules.value.values());
  });

  const schedulesCount = computed(() => {
    return schedules.value.size;
  });

  // ============ Actions ============

  /**
   * 创建日程事件
   */
  async function createSchedule(data: CreateScheduleEventRequest): Promise<ScheduleContracts.ScheduleClientDTO | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const schedule = await scheduleEventApiClient.createSchedule(data);
      schedules.value.set(schedule.uuid, schedule);
      showSuccess('日程创建成功');
      return schedule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取日程事件详情
   */
  async function getSchedule(uuid: string, forceRefresh = false): Promise<ScheduleContracts.ScheduleClientDTO | null> {
    // Cache-first strategy
    if (!forceRefresh && schedules.value.has(uuid)) {
      const cached = schedules.value.get(uuid);
      if (cached) {
        activeScheduleUuid.value = uuid;
        return cached;
      }
    }

    isLoading.value = true;
    error.value = null;

    try {
      const schedule = await scheduleEventApiClient.getSchedule(uuid);
      schedules.value.set(schedule.uuid, schedule);
      activeScheduleUuid.value = uuid;
      return schedule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取日程详情失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取账户的所有日程事件
   */
  async function getSchedulesByAccount(forceRefresh = false): Promise<ScheduleContracts.ScheduleClientDTO[]> {
    // Cache-first strategy
    if (!forceRefresh && schedules.value.size > 0) {
      return schedulesList.value;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const fetchedSchedules = await scheduleEventApiClient.getSchedulesByAccount();
      // Clear old cache and update
      schedules.value.clear();
      fetchedSchedules.forEach((schedule) => {
        schedules.value.set(schedule.uuid, schedule);
      });
      return fetchedSchedules;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取日程列表失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取指定时间范围内的日程事件
   */
  async function getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest
  ): Promise<ScheduleContracts.ScheduleClientDTO[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const fetchedSchedules = await scheduleEventApiClient.getSchedulesByTimeRange(params);
      // Update cache (merge with existing)
      fetchedSchedules.forEach((schedule) => {
        schedules.value.set(schedule.uuid, schedule);
      });
      return fetchedSchedules;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取日程列表失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 更新日程事件
   */
  async function updateSchedule(
    uuid: string,
    data: UpdateScheduleEventRequest
  ): Promise<ScheduleContracts.ScheduleClientDTO | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const updatedSchedule = await scheduleEventApiClient.updateSchedule(uuid, data);
      schedules.value.set(updatedSchedule.uuid, updatedSchedule);
      showSuccess('日程更新成功');
      return updatedSchedule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 删除日程事件
   */
  async function deleteSchedule(uuid: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      await scheduleEventApiClient.deleteSchedule(uuid);
      schedules.value.delete(uuid);
      if (activeScheduleUuid.value === uuid) {
        activeScheduleUuid.value = null;
      }
      showSuccess('日程删除成功');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 设置活动日程
   */
  function setActiveSchedule(uuid: string | null) {
    if (uuid && !schedules.value.has(uuid)) {
      showWarning('日程不存在');
      return;
    }
    activeScheduleUuid.value = uuid;
  }

  /**
   * 加载指定时间范围的日程（简化版，用于周视图）
   * Story 4-4: Week View Calendar
   */
  async function loadSchedulesByTimeRange(
    startTime: number,
    endTime: number
  ): Promise<ScheduleContracts.ScheduleClientDTO[]> {
    return getSchedulesByTimeRange({ startTime, endTime });
  }

  /**
   * 清空缓存
   */
  function clearCache() {
    schedules.value.clear();
    activeScheduleUuid.value = null;
    error.value = null;
  }

  return {
    // State
    schedules: schedulesList,
    activeSchedule,
    schedulesCount,
    isLoading,
    error,

    // Actions
    createSchedule,
    getSchedule,
    getSchedulesByAccount,
    getSchedulesByTimeRange,
    loadSchedulesByTimeRange,
    updateSchedule,
    deleteSchedule,
    setActiveSchedule,
    clearCache,
  };
}
