/**
 * useFocus Hook
 *
 * 专注功能的 React Hook
 * 封装 FocusApplicationService 调用和 Store 状态管理
 *
 * EPIC-018: 遵循 Store → Hooks → ApplicationService → packages 架构
 */

import { useCallback } from 'react';
import { useFocusStore } from '../stores/focusStore';
import { focusApplicationService } from '../../application/services';
import type {
  FocusSessionClientDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
} from '@dailyuse/contracts/goal';

// ===== Types =====

export interface UseFocusReturn {
  // State from Store
  currentSession: FocusSessionClientDTO | null;
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number | null;
  todayHistory: FocusHistoryDTO | null;
  weekHistory: FocusHistoryDTO | null;
  loading: boolean;
  error: string | null;

  // Configuration
  defaultDuration: number;

  // Actions
  startFocus: (goalUuid: string, duration?: number) => Promise<FocusSessionClientDTO>;
  pauseFocus: () => Promise<void>;
  resumeFocus: () => Promise<void>;
  stopFocus: (notes?: string) => Promise<FocusSessionClientDTO | null>;
  refreshStatus: () => Promise<void>;
  fetchTodayHistory: (goalUuid?: string) => Promise<void>;
  fetchWeekHistory: (goalUuid?: string) => Promise<void>;

  // Utilities
  clearError: () => void;
}

// ===== Hook Implementation =====

export function useFocus(): UseFocusReturn {
  // ===== Store State =====
  const currentSession = useFocusStore((s) => s.currentSession);
  const isActive = useFocusStore((s) => s.isActive);
  const isPaused = useFocusStore((s) => s.isPaused);
  const remainingTime = useFocusStore((s) => s.remainingTime);
  const todayHistory = useFocusStore((s) => s.todayHistory);
  const weekHistory = useFocusStore((s) => s.weekHistory);
  const loading = useFocusStore((s) => s.isLoading);
  const error = useFocusStore((s) => s.error);
  const defaultDuration = useFocusStore((s) => s.defaultDuration);

  // ===== Store Actions =====
  const setCurrentSession = useFocusStore((s) => s.setCurrentSession);
  const setRemainingTime = useFocusStore((s) => s.setRemainingTime);
  const setTodayHistory = useFocusStore((s) => s.setTodayHistory);
  const setWeekHistory = useFocusStore((s) => s.setWeekHistory);
  const setLoading = useFocusStore((s) => s.setLoading);
  const setError = useFocusStore((s) => s.setError);

  // ===== Actions =====

  const startFocus = useCallback(
    async (goalUuid: string, duration?: number): Promise<FocusSessionClientDTO> => {
      setLoading(true);
      setError(null);

      try {
        const session = await focusApplicationService.startSession({
          goalUuid,
          durationMinutes: duration ?? defaultDuration,
        });

        setCurrentSession(session);
        setRemainingTime(session.durationMinutes * 60);

        return session;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to start focus';
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [defaultDuration, setCurrentSession, setRemainingTime, setLoading, setError]
  );

  const pauseFocus = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const session = await focusApplicationService.pauseSession();
      setCurrentSession(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to pause focus');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [setCurrentSession, setLoading, setError]);

  const resumeFocus = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const session = await focusApplicationService.resumeSession();
      setCurrentSession(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resume focus');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [setCurrentSession, setLoading, setError]);

  const stopFocus = useCallback(
    async (notes?: string): Promise<FocusSessionClientDTO | null> => {
      setLoading(true);

      try {
        const session = await focusApplicationService.stopSession(notes);
        setCurrentSession(null);
        setRemainingTime(null);
        return session;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to stop focus');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [setCurrentSession, setRemainingTime, setLoading, setError]
  );

  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      const status: FocusStatusDTO = await focusApplicationService.getStatus();

      if (status.session) {
        setCurrentSession(status.session);
        if (status.remainingSeconds !== undefined) {
          setRemainingTime(status.remainingSeconds);
        }
      } else {
        setCurrentSession(null);
        setRemainingTime(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh status');
    }
  }, [setCurrentSession, setRemainingTime, setError]);

  const fetchTodayHistory = useCallback(
    async (goalUuid?: string): Promise<void> => {
      try {
        const history = await focusApplicationService.getTodayHistory(goalUuid);
        setTodayHistory(history);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch today history');
      }
    },
    [setTodayHistory, setError]
  );

  const fetchWeekHistory = useCallback(
    async (goalUuid?: string): Promise<void> => {
      try {
        const history = await focusApplicationService.getWeekHistory(goalUuid);
        setWeekHistory(history);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch week history');
      }
    },
    [setWeekHistory, setError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    // State
    currentSession,
    isActive,
    isPaused,
    remainingTime,
    todayHistory,
    weekHistory,
    loading,
    error,
    defaultDuration,

    // Actions
    startFocus,
    pauseFocus,
    resumeFocus,
    stopFocus,
    refreshStatus,
    fetchTodayHistory,
    fetchWeekHistory,

    // Utilities
    clearError,
  };
}
