/**
 * useGoal Hook
 *
 * 目标管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { goalApplicationService } from '../../application/services';
import type { GoalClientDTO, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import type { CreateGoalInput, SearchGoalsInput, CloneGoalInput } from '@dailyuse/application-client';

// ===== Types =====

export interface GoalState {
  goals: GoalClientDTO[];
  selectedGoal: GoalClientDTO | null;
  loading: boolean;
  error: string | null;
}

export interface UseGoalReturn extends GoalState {
  // Query
  loadGoals: () => Promise<void>;
  getGoal: (id: string) => Promise<GoalClientDTO | null>;
  searchGoals: (input: SearchGoalsInput) => Promise<void>;

  // Mutations
  createGoal: (input: CreateGoalInput) => Promise<GoalClientDTO>;
  updateGoal: (uuid: string, request: UpdateGoalRequest) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Status changes
  activateGoal: (id: string) => Promise<void>;
  pauseGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  archiveGoal: (id: string) => Promise<void>;
  cloneGoal: (input: CloneGoalInput) => Promise<void>;

  // Selection
  selectGoal: (goal: GoalClientDTO | null) => void;

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useGoal(): UseGoalReturn {
  const [state, setState] = useState<GoalState>({
    goals: [],
    selectedGoal: null,
    loading: false,
    error: null,
  });

  // ===== Query =====

  const loadGoals = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await goalApplicationService.listGoals();
      setState((prev) => ({ ...prev, goals: result.goals || [], loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载目标失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const getGoal = useCallback(async (id: string) => {
    return goalApplicationService.getGoal(id);
  }, []);

  const searchGoalsFn = useCallback(async (input: SearchGoalsInput) => {
    const result = await goalApplicationService.searchGoals(input);
    setState((prev) => ({ ...prev, goals: result.goals || [] }));
  }, []);

  // ===== Mutations =====

  const createGoal = useCallback(async (input: CreateGoalInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const goal = await goalApplicationService.createGoal(input);
      setState((prev) => ({
        ...prev,
        goals: [...prev.goals, goal],
        loading: false,
      }));
      return goal;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建目标失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const updateGoal = useCallback(async (uuid: string, request: UpdateGoalRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const goal = await goalApplicationService.updateGoal(uuid, request);
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.uuid === uuid ? { ...g, ...goal } as GoalClientDTO : g)),
        selectedGoal: prev.selectedGoal?.uuid === uuid ? { ...prev.selectedGoal, ...goal } as GoalClientDTO : prev.selectedGoal,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新目标失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await goalApplicationService.deleteGoal(id);
      setState((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.uuid !== id),
        selectedGoal: prev.selectedGoal?.uuid === id ? null : prev.selectedGoal,
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除目标失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Status Changes =====

  const updateGoalInState = useCallback((goal: GoalClientDTO) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.uuid === goal.uuid ? goal : g)),
    }));
  }, []);

  const activateGoal = useCallback(async (id: string) => {
    try {
      const goal = await goalApplicationService.activateGoal(id);
      updateGoalInState(goal);
    } catch (e) {
      setState((prev) => ({ ...prev, error: e instanceof Error ? e.message : '激活目标失败' }));
      throw e;
    }
  }, [updateGoalInState]);

  const pauseGoal = useCallback(async (id: string) => {
    try {
      const goal = await goalApplicationService.pauseGoal(id);
      updateGoalInState(goal);
    } catch (e) {
      setState((prev) => ({ ...prev, error: e instanceof Error ? e.message : '暂停目标失败' }));
      throw e;
    }
  }, [updateGoalInState]);

  const completeGoal = useCallback(async (id: string) => {
    try {
      const goal = await goalApplicationService.completeGoal(id);
      updateGoalInState(goal);
    } catch (e) {
      setState((prev) => ({ ...prev, error: e instanceof Error ? e.message : '完成目标失败' }));
      throw e;
    }
  }, [updateGoalInState]);

  const archiveGoal = useCallback(async (id: string) => {
    try {
      const goal = await goalApplicationService.archiveGoal(id);
      updateGoalInState(goal);
    } catch (e) {
      setState((prev) => ({ ...prev, error: e instanceof Error ? e.message : '归档目标失败' }));
      throw e;
    }
  }, [updateGoalInState]);

  const cloneGoal = useCallback(async (input: CloneGoalInput) => {
    try {
      const goal = await goalApplicationService.cloneGoal(input);
      setState((prev) => ({
        ...prev,
        goals: [...prev.goals, goal],
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, error: e instanceof Error ? e.message : '克隆目标失败' }));
      throw e;
    }
  }, []);

  // ===== Selection =====

  const selectGoal = useCallback((goal: GoalClientDTO | null) => {
    setState((prev) => ({ ...prev, selectedGoal: goal }));
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(async () => {
    await loadGoals();
  }, [loadGoals]);

  // ===== Effects =====

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // ===== Return =====

  return {
    goals: state.goals,
    selectedGoal: state.selectedGoal,
    loading: state.loading,
    error: state.error,
    loadGoals,
    getGoal,
    searchGoals: searchGoalsFn,
    createGoal,
    updateGoal,
    deleteGoal,
    activateGoal,
    pauseGoal,
    completeGoal,
    archiveGoal,
    cloneGoal,
    selectGoal,
    clearError,
    refresh,
  };
}

export default useGoal;
