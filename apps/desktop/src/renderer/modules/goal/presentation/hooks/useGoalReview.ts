/**
 * useGoalReview Hook
 *
 * 目标复盘管理 Hook - 处理复盘记录的 CRUD 操作
 */

import { useState, useCallback } from 'react';
import type { 
  GoalReviewClientDTO,
  CreateGoalReviewRequest,
  UpdateGoalReviewRequest,
} from '@dailyuse/contracts/goal';
import { goalApplicationService } from '../../application/services';

// ===== Types =====

// 使用 contracts 类型别名，保持向后兼容
export type CreateReviewInput = CreateGoalReviewRequest;
export type UpdateReviewInput = UpdateGoalReviewRequest;

export interface GoalReviewState {
  reviews: GoalReviewClientDTO[];
  loading: boolean;
  error: string | null;
  editingReview: GoalReviewClientDTO | null;
}

export interface UseGoalReviewReturn extends GoalReviewState {
  // Query
  loadReviews: (goalUuid: string) => Promise<GoalReviewClientDTO[]>;

  // Mutations
  createReview: (goalUuid: string, data: CreateReviewInput) => Promise<GoalReviewClientDTO>;
  updateReview: (goalUuid: string, reviewUuid: string, data: UpdateReviewInput) => Promise<GoalReviewClientDTO>;
  deleteReview: (goalUuid: string, reviewUuid: string) => Promise<void>;

  // Editing State
  setEditingReview: (review: GoalReviewClientDTO | null) => void;

  // Utilities
  clearError: () => void;
  clearReviews: () => void;
}

// ===== Hook Implementation =====

export function useGoalReview(): UseGoalReviewReturn {
  const [state, setState] = useState<GoalReviewState>({
    reviews: [],
    loading: false,
    error: null,
    editingReview: null,
  });

  // ===== Query =====

  const loadReviews = useCallback(async (goalUuid: string): Promise<GoalReviewClientDTO[]> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const reviews = await goalApplicationService.getReviews(goalUuid);
      
      setState((prev) => ({
        ...prev,
        reviews,
        loading: false,
      }));
      
      return reviews;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载复盘记录失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Mutations =====

  const createReview = useCallback(async (
    goalUuid: string,
    data: CreateReviewInput
  ): Promise<GoalReviewClientDTO> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 直接传递 CreateGoalReviewRequest，不做字段转换
      // data 已经是符合 CreateGoalReviewRequest 结构的对象
      const review = await goalApplicationService.createReview(goalUuid, data);
      
      setState((prev) => ({
        ...prev,
        reviews: [...prev.reviews, review],
        loading: false,
      }));
      
      return review;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '创建复盘失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const updateReview = useCallback(async (
    goalUuid: string,
    reviewUuid: string,
    data: UpdateReviewInput
  ): Promise<GoalReviewClientDTO> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const review = await goalApplicationService.updateReview(goalUuid, reviewUuid, data);
      
      setState((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) => (r.uuid === reviewUuid ? review : r)),
        editingReview: null,
        loading: false,
      }));
      
      return review;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新复盘失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const deleteReview = useCallback(async (
    goalUuid: string,
    reviewUuid: string
  ): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await goalApplicationService.deleteReview(goalUuid, reviewUuid);
      
      setState((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r.uuid !== reviewUuid),
        loading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除复盘失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Editing State =====

  const setEditingReview = useCallback((review: GoalReviewClientDTO | null) => {
    setState((prev) => ({ ...prev, editingReview: review }));
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearReviews = useCallback(() => {
    setState((prev) => ({ ...prev, reviews: [] }));
  }, []);

  return {
    // State
    ...state,

    // Query
    loadReviews,

    // Mutations
    createReview,
    updateReview,
    deleteReview,

    // Editing State
    setEditingReview,

    // Utilities
    clearError,
    clearReviews,
  };
}

export default useGoalReview;
