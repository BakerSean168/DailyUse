/**
 * useTaskInstance Hook
 *
 * 任务实例管理 Hook
 */

import { useState, useCallback } from 'react';
import { taskApplicationService } from '../../application/services';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

// ===== Types =====

export interface TaskInstanceState {
  instances: TaskInstanceClientDTO[];
  todayInstances: TaskInstanceClientDTO[];
  loading: boolean;
  error: string | null;
}

export interface UseTaskInstanceReturn extends TaskInstanceState {
  // Query
  loadInstances: () => Promise<void>;
  loadTodayInstances: () => Promise<void>;
  loadInstancesByDateRange: (templateUuid: string, startDate: Date, endDate: Date) => Promise<TaskInstanceClientDTO[]>;
  getInstance: (id: string) => Promise<TaskInstanceClientDTO | null>;
  
  // Actions
  startInstance: (id: string) => Promise<void>;
  completeInstance: (id: string) => Promise<void>;
  skipInstance: (id: string) => Promise<void>;
  deleteInstance: (id: string) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useTaskInstance(): UseTaskInstanceReturn {
  const [state, setState] = useState<TaskInstanceState>({
    instances: [],
    todayInstances: [],
    loading: false,
    error: null,
  });

  // ===== Query =====

  const loadInstances = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const instances = await taskApplicationService.listInstances();
      setState((prev) => ({ ...prev, instances, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载任务实例失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const loadTodayInstances = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 加载所有实例，然后过滤今日的
      const instances = await taskApplicationService.listInstances();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayInstances = instances.filter((i) => {
        const instanceDate = new Date(i.instanceDate);
        return instanceDate >= today && instanceDate < tomorrow;
      });

      setState((prev) => ({ ...prev, todayInstances, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载今日任务失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const loadInstancesByDateRange = useCallback(async (templateUuid: string, startDate: Date, endDate: Date) => {
    return taskApplicationService.getInstancesByDateRange({
      templateUuid,
      from: startDate.getTime(),
      to: endDate.getTime(),
    });
  }, []);

  const getInstance = useCallback(async (id: string) => {
    return taskApplicationService.getInstance(id);
  }, []);

  // ===== Actions =====

  const startInstance = useCallback(async (id: string) => {
    try {
      const instance = await taskApplicationService.startInstance(id);
      setState((prev) => ({
        ...prev,
        instances: prev.instances.map((i) => (i.uuid === id ? instance : i)),
        todayInstances: prev.todayInstances.map((i) => (i.uuid === id ? instance : i)),
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '开始任务失败';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw e;
    }
  }, []);

  const completeInstance = useCallback(async (id: string) => {
    try {
      const instance = await taskApplicationService.completeInstance(id);
      setState((prev) => ({
        ...prev,
        instances: prev.instances.map((i) => (i.uuid === id ? instance : i)),
        todayInstances: prev.todayInstances.map((i) => (i.uuid === id ? instance : i)),
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '完成任务失败';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw e;
    }
  }, []);

  const skipInstance = useCallback(async (id: string) => {
    try {
      const instance = await taskApplicationService.skipInstance(id);
      setState((prev) => ({
        ...prev,
        instances: prev.instances.map((i) => (i.uuid === id ? instance : i)),
        todayInstances: prev.todayInstances.map((i) => (i.uuid === id ? instance : i)),
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '跳过任务失败';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteInstance = useCallback(async (id: string) => {
    try {
      await taskApplicationService.deleteInstance(id);
      setState((prev) => ({
        ...prev,
        instances: prev.instances.filter((i) => i.uuid !== id),
        todayInstances: prev.todayInstances.filter((i) => i.uuid !== id),
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除任务实例失败';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadInstances(), loadTodayInstances()]);
  }, [loadInstances, loadTodayInstances]);

  // ===== Return =====

  return {
    // State
    instances: state.instances,
    todayInstances: state.todayInstances,
    loading: state.loading,
    error: state.error,
    // Query
    loadInstances,
    loadTodayInstances,
    loadInstancesByDateRange,
    getInstance,
    // Actions
    startInstance,
    completeInstance,
    skipInstance,
    deleteInstance,
    // Utilities
    clearError,
    refresh,
  };
}

export default useTaskInstance;
