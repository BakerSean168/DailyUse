/**
 * Focus Store - Zustand 状态管理
 * 
 * 管理专注功能的所有状态
 * 
 * @module goal/presentation/stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { goalContainer } from '../../infrastructure/di';
import type {
  FocusSessionDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
} from '../../infrastructure/ipc/goal-focus.ipc-client';

// ============ State Interface ============
export interface FocusState {
  // 当前会话
  currentSession: FocusSessionDTO | null;
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

// ============ Actions Interface ============
export interface FocusActions {
  // 会话操作
  startFocus: (goalUuid: string, duration?: number) => Promise<FocusSessionDTO>;
  pauseFocus: () => Promise<void>;
  resumeFocus: () => Promise<void>;
  stopFocus: (notes?: string) => Promise<FocusSessionDTO | null>;
  
  // 状态操作
  refreshStatus: () => Promise<void>;
  setCurrentSession: (session: FocusSessionDTO | null) => void;
  setRemainingTime: (time: number | null) => void;
  
  // 历史操作
  fetchTodayHistory: (goalUuid?: string) => Promise<void>;
  fetchWeekHistory: (goalUuid?: string) => Promise<void>;
  
  // 配置操作
  setDefaultDuration: (duration: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 生命周期
  initialize: () => Promise<void>;
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
export const useFocusStore = create<FocusState & FocusActions & FocusSelectors>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ========== Session Actions ==========
      startFocus: async (goalUuid, duration) => {
        const { setLoading, setError, defaultDuration } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const focusClient = goalContainer.focusClient;
          const session = await focusClient.start({
            goalUuid,
            duration: duration ?? defaultDuration,
          });
          
          set({
            currentSession: session,
            isActive: true,
            isPaused: false,
            remainingTime: session.duration * 60,
          });
          
          return session;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to start focus session';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      pauseFocus: async () => {
        const { setLoading, setError, currentSession } = get();
        if (!currentSession) return;
        
        try {
          setLoading(true);
          
          const focusClient = goalContainer.focusClient;
          const session = await focusClient.pause();
          
          if (session) {
            set({
              currentSession: session,
              isPaused: true,
            });
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to pause focus session');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      resumeFocus: async () => {
        const { setLoading, setError, currentSession } = get();
        if (!currentSession) return;
        
        try {
          setLoading(true);
          
          const focusClient = goalContainer.focusClient;
          const session = await focusClient.resume();
          
          if (session) {
            set({
              currentSession: session,
              isPaused: false,
            });
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to resume focus session');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      stopFocus: async (notes) => {
        const { setLoading, setError, fetchTodayHistory, fetchWeekHistory, currentSession } = get();
        if (!currentSession) return null;
        
        try {
          setLoading(true);
          
          const focusClient = goalContainer.focusClient;
          const session = await focusClient.stop(notes);
          
          set({
            currentSession: null,
            isActive: false,
            isPaused: false,
            remainingTime: null,
          });
          
          // 刷新历史
          await Promise.all([
            fetchTodayHistory(),
            fetchWeekHistory(),
          ]);
          
          return session;
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to stop focus session');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      // ========== Status Actions ==========
      refreshStatus: async () => {
        const { setError } = get();
        
        try {
          const focusClient = goalContainer.focusClient;
          const status = await focusClient.getStatus();
          
          set({
            currentSession: status.session ?? null,
            isActive: status.isActive,
            isPaused: status.session?.status === 'paused',
            remainingTime: status.remainingTime ?? null,
          });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to refresh focus status');
        }
      },
      
      setCurrentSession: (session) => set({ currentSession: session }),
      setRemainingTime: (remainingTime) => set({ remainingTime }),
      
      // ========== History Actions ==========
      fetchTodayHistory: async (goalUuid) => {
        const { setLoading, setError } = get();
        
        try {
          setLoading(true);
          
          const focusClient = goalContainer.focusClient;
          const history = await focusClient.getTodayHistory(goalUuid);
          
          set({ todayHistory: history });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch today history');
        } finally {
          setLoading(false);
        }
      },
      
      fetchWeekHistory: async (goalUuid) => {
        const { setLoading, setError } = get();
        
        try {
          setLoading(true);
          
          const focusClient = goalContainer.focusClient;
          const history = await focusClient.getWeekHistory(goalUuid);
          
          set({ weekHistory: history });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch week history');
        } finally {
          setLoading(false);
        }
      },
      
      // ========== Config Actions ==========
      setDefaultDuration: (defaultDuration) => set({ defaultDuration }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setNotificationEnabled: (notificationEnabled) => set({ notificationEnabled }),
      
      // ========== Status Actions ==========
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // ========== Lifecycle ==========
      initialize: async () => {
        const { refreshStatus, fetchTodayHistory, fetchWeekHistory, setError } = get();
        
        try {
          await refreshStatus();
          await Promise.all([
            fetchTodayHistory(),
            fetchWeekHistory(),
          ]);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to initialize focus');
        }
      },
      
      reset: () => set(initialState),
      
      // ========== Selectors ==========
      getElapsedTime: () => {
        const { currentSession } = get();
        return currentSession?.elapsed ?? 0;
      },
      
      getProgress: () => {
        const { currentSession, remainingTime } = get();
        if (!currentSession || remainingTime === null) return 0;
        
        const totalSeconds = currentSession.duration * 60;
        const elapsed = totalSeconds - remainingTime;
        return Math.min(100, Math.round((elapsed / totalSeconds) * 100));
      },
      
      getTodayDuration: () => {
        const { todayHistory } = get();
        return todayHistory?.totalDuration ?? 0;
      },
      
      getWeekDuration: () => {
        const { weekHistory } = get();
        return weekHistory?.totalDuration ?? 0;
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
