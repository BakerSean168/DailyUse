/**
 * useTaskInstance Hook
 *
 * 任务实例管理 Hook
 * 
 * EPIC-015 重构: 与 Store 集成，使用 Entity 类型
 * - 使用 useTaskStore 作为唯一数据源
 * - 返回 Entity 类型（TaskInstance）
 * - 移除内部 useState，统一使用 Store 状态
 */

import { useCallback, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { taskApplicationService } from '../../application/services';
import type { TaskInstance } from '@dailyuse/domain-client/task';

// ===== Types =====

export interface UseTaskInstanceReturn {
  // State from Store
  instances: TaskInstance[];
  loading: boolean;
  error: string | null;
  
  // Query
  loadInstances: () => Promise<void>;
  getTodayInstances: () => TaskInstance[];
  getPendingInstances: () => TaskInstance[];
  getCompletedInstances: () => TaskInstance[];
  getInstancesByTemplate: (templateId: string) => TaskInstance[];
  getFilteredInstances: () => TaskInstance[];
  loadInstancesByDateRange: (templateUuid: string, startDate: Date, endDate: Date) => Promise<TaskInstance[]>;
  getInstance: (id: string) => Promise<TaskInstance | null>;
  
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
  // ===== Store State =====
  const instances = useTaskStore((state) => state.instances);
  const loading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);
  
  // ===== Store Actions =====
  const storeSetInstances = useTaskStore((state) => state.setInstances);
  const storeUpdateInstance = useTaskStore((state) => state.updateInstance);
  const storeRemoveInstance = useTaskStore((state) => state.removeInstance);
  const storeFetchInstances = useTaskStore((state) => state.fetchInstances);
  const storeCompleteInstance = useTaskStore((state) => state.completeInstance);
  const storeSkipInstance = useTaskStore((state) => state.skipInstance);
  const storeSetError = useTaskStore((state) => state.setError);
  
  // ===== Store Selectors =====
  const getTodayInstances = useTaskStore((state) => state.getTodayInstances);
  const getPendingInstances = useTaskStore((state) => state.getPendingInstances);
  const getCompletedInstances = useTaskStore((state) => state.getCompletedInstances);
  const getInstancesByTemplate = useTaskStore((state) => state.getInstancesByTemplate);
  const getFilteredInstances = useTaskStore((state) => state.getFilteredInstances);
  const getInstanceById = useTaskStore((state) => state.getInstanceById);

  // ===== Query =====

  const loadInstances = useCallback(async () => {
    await storeFetchInstances();
  }, [storeFetchInstances]);

  const loadInstancesByDateRange = useCallback(async (
    templateUuid: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<TaskInstance[]> => {
    return taskApplicationService.getInstancesByDateRange({
      templateUuid,
      from: startDate.getTime(),
      to: endDate.getTime(),
    });
  }, []);

  const getInstance = useCallback(async (id: string): Promise<TaskInstance | null> => {
    // 先从 Store 查找
    const cached = getInstanceById(id);
    if (cached) return cached;
    
    // Store 中没有则从 API 获取
    return taskApplicationService.getInstance(id);
  }, [getInstanceById]);

  // ===== Actions =====

  const startInstance = useCallback(async (id: string): Promise<void> => {
    try {
      const instance = await taskApplicationService.startInstance(id);
      storeUpdateInstance(instance.uuid, instance);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '开始任务失败';
      storeSetError(errorMessage);
      throw e;
    }
  }, [storeUpdateInstance, storeSetError]);

  const completeInstance = useCallback(async (id: string): Promise<void> => {
    await storeCompleteInstance(id);
  }, [storeCompleteInstance]);

  const skipInstance = useCallback(async (id: string): Promise<void> => {
    await storeSkipInstance(id);
  }, [storeSkipInstance]);

  const deleteInstance = useCallback(async (id: string): Promise<void> => {
    try {
      await taskApplicationService.deleteInstance(id);
      storeRemoveInstance(id);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除任务实例失败';
      storeSetError(errorMessage);
      throw e;
    }
  }, [storeRemoveInstance, storeSetError]);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    storeSetError(null);
  }, [storeSetError]);

  const refresh = useCallback(async () => {
    await loadInstances();
  }, [loadInstances]);

  // ===== Effects =====

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  // ===== Return =====

  return {
    // State from Store
    instances,
    loading,
    error,
    // Query
    loadInstances,
    getTodayInstances,
    getPendingInstances,
    getCompletedInstances,
    getInstancesByTemplate,
    getFilteredInstances,
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
