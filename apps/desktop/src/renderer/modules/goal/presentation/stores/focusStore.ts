/**
 * Focus Store - Zustand 状态管理
 *
 * 管理专注功能的所有状态
 *
 * EPIC-018 重构:
 * - 移除 Container 依赖
 * - 使用 @dailyuse/contracts 类型
 * - Store 仅管理状态，不调用服务
 * - 服务调用移至 useFocus Hook
 *
 * @module goal/presentation/stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  FocusSessionClientDTO,
  FocusHistoryDTO,
} from '@dailyuse/contracts/goal';
import { FocusSessionStatus } from '@dailyuse/contracts/goal';

// ============ State Interface ============
export interface FocusState {
  // 当前会话
  currentSession: FocusSessionClientDTO | null;
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number | null; // 秒

  // 历史记录
  todayHistory: FocusHistoryDTO | null;
  weekHistory: FocusHistoryDTO | null;

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // 配置
  defaultDuration: number; // 分钟
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

// ============ State Actions Interface ============
export interface FocusStateActions {
  // 会话状态更新
  setCurrentSession: (session: FocusSessionClientDTO | null) => void;
  setRemainingTime: (time: number | null) => void;
  setActive: (isActive: boolean) => void;
  setPaused: (isPaused: boolean) => void;

  // 历史状态更新
  setTodayHistory: (history: FocusHistoryDTO | null) => void;
  setWeekHistory: (history: FocusHistoryDTO | null) => void;

  // 加载状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 配置操作
  setDefaultDuration: (duration: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setNotificationEnabled: (enabled: boolean) => void;

  // 生命周期
  reset: () => void;
}

// ============ Selectors Interface ============
export interface FocusSelectors {
  getElapsedTime: () => number; // 秒
  getProgress: () => number; // 0-100
  getTodayDuration: () => number; // 分钟
  getWeekDuration: () => number; // 分钟
  getCompletionRate: () => number; // 0-1
}

// ============ Initial State ============
const initialState: FocusState = {
  currentSession: null,
  isActive: false,
  isPaused: false,
  remainingTime: null,
  todayHistory: null,
  weekHistory: null,
  isLoading: false,
  error: null,
  defaultDuration: 25, // 默认25分钟番茄钟
  soundEnabled: true,
  notificationEnabled: true,
};

// ============ Store ============
export const useFocusStore = create<FocusState & FocusStateActions & FocusSelectors>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== Session State Actions ==========
      setCurrentSession: (session) =>
        set({
          currentSession: session,
          isActive: session !== null && session.status === FocusSessionStatus.IN_PROGRESS,
          isPaused: session?.status === FocusSessionStatus.PAUSED,
        }),

      setRemainingTime: (remainingTime) => set({ remainingTime }),

      setActive: (isActive) => set({ isActive }),

      setPaused: (isPaused) => set({ isPaused }),

      // ========== History State Actions ==========
      setTodayHistory: (todayHistory) => set({ todayHistory }),

      setWeekHistory: (weekHistory) => set({ weekHistory }),

      // ========== Loading State Actions ==========
      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // ========== Config Actions ==========
      setDefaultDuration: (defaultDuration) => set({ defaultDuration }),

      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

      setNotificationEnabled: (notificationEnabled) => set({ notificationEnabled }),

      // ========== Lifecycle ==========
      reset: () => set(initialState),

      // ========== Selectors ==========
      getElapsedTime: () => {
        const { currentSession } = get();
        if (!currentSession) return 0;
        // 计算已用时间（分钟 -> 秒）
        return (currentSession.actualDurationMinutes ?? 0) * 60;
      },

      getProgress: () => {
        const { currentSession, remainingTime } = get();
        if (!currentSession || remainingTime === null) return 0;

        const totalSeconds = currentSession.durationMinutes * 60;
        const elapsed = totalSeconds - remainingTime;
        return Math.min(100, Math.round((elapsed / totalSeconds) * 100));
      },

      getTodayDuration: () => {
        const { todayHistory } = get();
        return todayHistory?.totalDurationMinutes ?? 0;
      },

      getWeekDuration: () => {
        const { weekHistory } = get();
        return weekHistory?.totalDurationMinutes ?? 0;
      },

      getCompletionRate: () => {
        const { todayHistory } = get();
        return todayHistory?.completionRate ?? 0;
      },
    }),
    {
      name: 'focus-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        defaultDuration: state.defaultDuration,
        soundEnabled: state.soundEnabled,
        notificationEnabled: state.notificationEnabled,
      }),
    }
  )
);

// ============ Convenience Hooks ============
export const useFocusActive = () => useFocusStore((state) => state.isActive);
export const useFocusPaused = () => useFocusStore((state) => state.isPaused);
export const useFocusSession = () => useFocusStore((state) => state.currentSession);
export const useFocusRemainingTime = () => useFocusStore((state) => state.remainingTime);
