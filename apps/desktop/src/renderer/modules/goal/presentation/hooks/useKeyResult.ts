/**
 * useKeyResult Hook
 *
 * 关键结果管理 Hook - 处理关键结果的 CRUD 操作
 */

import { useState, useCallback } from 'react';
import type {
  KeyResultClientDTO,
  GoalRecordClientDTO,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  CreateGoalRecordRequest,
} from '@dailyuse/contracts/goal';
import { KeyResultValueType, AggregationMethod } from '@dailyuse/contracts/goal';
import { goalApplicationService } from '../../application/services';

// ===== Types =====

// 使用 contracts 类型别名，保持向后兼容
export type CreateKeyResultInput = AddKeyResultRequest;
export type UpdateKeyResultInput = UpdateKeyResultRequest;
export type CreateRecordInput = CreateGoalRecordRequest;

export interface KeyResultState {
  loading: boolean;
  error: string | null;
  editingKeyResult: KeyResultClientDTO | null;
}

export interface UseKeyResultReturn extends KeyResultState {
  // CRUD Operations
  createKeyResult: (goalUuid: string, data: CreateKeyResultInput) => Promise<KeyResultClientDTO>;
  updateKeyResult: (goalUuid: string, keyResultUuid: string, data: UpdateKeyResultInput) => Promise<KeyResultClientDTO>;
  deleteKeyResult: (goalUuid: string, keyResultUuid: string) => Promise<void>;

  // Record Operations
  createRecord: (goalUuid: string, keyResultUuid: string, data: CreateRecordInput) => Promise<GoalRecordClientDTO>;
  deleteRecord: (goalUuid: string, keyResultUuid: string, recordUuid: string) => Promise<void>;

  // Editing State
  setEditingKeyResult: (keyResult: KeyResultClientDTO | null) => void;

  // Utilities
  clearError: () => void;
}

// ===== Hook Implementation =====

export function useKeyResult(): UseKeyResultReturn {
  const [state, setState] = useState<KeyResultState>({
    loading: false,
    error: null,
    editingKeyResult: null,
  });

  // ===== CRUD Operations =====

  const createKeyResult = useCallback(async (
    goalUuid: string,
    data: CreateKeyResultInput
  ): Promise<KeyResultClientDTO> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const request = {
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        currentValue: data.currentValue ?? 0,
        unit: data.unit,
        weight: data.weight,
        valueType: data.valueType ?? KeyResultValueType.INCREMENTAL,
        aggregationMethod: data.aggregationMethod ?? AggregationMethod.SUM,
      };

      const result = await goalApplicationService.createKeyResult(goalUuid, request);
      
      setState((prev) => ({ ...prev, loading: false }));
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建关键结果失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const updateKeyResult = useCallback(async (
    goalUuid: string,
    keyResultUuid: string,
    data: UpdateKeyResultInput
  ): Promise<KeyResultClientDTO> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await goalApplicationService.updateKeyResult(goalUuid, keyResultUuid, data);
      
      setState((prev) => ({ 
        ...prev, 
        loading: false,
        editingKeyResult: null,
      }));
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新关键结果失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteKeyResult = useCallback(async (
    goalUuid: string,
    keyResultUuid: string
  ): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await goalApplicationService.deleteKeyResult(goalUuid, keyResultUuid);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除关键结果失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Record Operations =====

  const createRecord = useCallback(async (
    goalUuid: string,
    keyResultUuid: string,
    data: CreateRecordInput
  ): Promise<GoalRecordClientDTO> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const request = {
        value: data.value,
        note: data.note,
        recordedAt: data.recordedAt ?? Date.now(),
      };

      const result = await goalApplicationService.createRecord(goalUuid, keyResultUuid, request);
      
      setState((prev) => ({ ...prev, loading: false }));
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建记录失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteRecord = useCallback(async (
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string
  ): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await goalApplicationService.deleteRecord(goalUuid, keyResultUuid, recordUuid);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除记录失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Editing State =====

  const setEditingKeyResult = useCallback((keyResult: KeyResultClientDTO | null) => {
    setState((prev) => ({ ...prev, editingKeyResult: keyResult }));
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,

    // CRUD Operations
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,

    // Record Operations
    createRecord,
    deleteRecord,

    // Editing State
    setEditingKeyResult,

    // Utilities
    clearError,
  };
}

export default useKeyResult;
