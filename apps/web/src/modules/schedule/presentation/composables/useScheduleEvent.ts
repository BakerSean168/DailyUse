import { ref, computed } from 'vue';
import type { ScheduleClientDTO, CreateScheduleRequest, UpdateScheduleRequest, GetSchedulesByTimeRangeRequest } from '@dailyuse/contracts/schedule';
import { scheduleEventApiClient } from '../../infrastructure/api/scheduleEventApiClient';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Schedule Event Composable
 * 日程事件状态管理
 * 
 * Story 4-1: Schedule Event CRUD
 */

/**
 * Schedule Event Store (module-level singleton)
 */
const schedules = ref<Map<string, ScheduleClientDTO>>(new Map());
const activeScheduleUuid = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<Error | null>(null);

/**
 * useScheduleEvent Composable
 */
export function useScheduleEvent() {
  const snackbar = useSnackbar();

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
  async function createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const schedule = await scheduleEventApiClient.createSchedule(data);
      schedules.value.set(schedule.uuid, schedule);
      snackbar.showSuccess('日程创建成功');
      return schedule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      snackbar.showError(errorMsg);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取日程事件详情
   */
  async function getSchedule(uuid: string, forceRefresh = false): Promise<ScheduleClientDTO | null> {
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
      snackbar.showError(errorMsg);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取账户的所有日程事件
   */
  async function getSchedulesByAccount(forceRefresh = false): Promise<ScheduleClientDTO[]> {
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
      snackbar.showError(errorMsg);
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
  ): Promise<ScheduleClientDTO[]> {
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
      snackbar.showError(errorMsg);
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
    data: UpdateScheduleRequest
  ): Promise<ScheduleClientDTO | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const updatedSchedule = await scheduleEventApiClient.updateSchedule(uuid, data);
      schedules.value.set(updatedSchedule.uuid, updatedSchedule);
      snackbar.showSuccess('日程更新成功');
      return updatedSchedule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      snackbar.showError(errorMsg);
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
      snackbar.showSuccess('日程删除成功');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      snackbar.showError(errorMsg);
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
      snackbar.showWarning('日程不存在');
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
  ): Promise<ScheduleClientDTO[]> {
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

