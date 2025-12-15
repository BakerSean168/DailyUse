/**
 * useFocus Hook
 *
 * 专注模式状态管理 Hook
 * Story 11-7: Advanced Features
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// Types
export interface FocusSession {
  id: string;
  date: Date;
  duration: number; // minutes
  taskId?: string;
  taskName?: string;
  completed: boolean;
  type: 'work' | 'break';
}

export interface FocusSettings {
  workDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

export interface FocusState {
  isActive: boolean;
  isPaused: boolean;
  currentPhase: 'idle' | 'work' | 'short_break' | 'long_break';
  timeRemaining: number; // seconds
  totalTime: number; // seconds
  sessionsCompleted: number;
  currentTaskId?: string;
  currentTaskName?: string;
}

export interface UseFocusOptions {
  onSessionComplete?: (session: FocusSession) => void;
  onPhaseChange?: (phase: FocusState['currentPhase']) => void;
  onTimerTick?: (remaining: number, total: number) => void;
  initialSettings?: Partial<FocusSettings>;
}

export interface UseFocusReturn {
  // State
  state: FocusState;
  settings: FocusSettings;
  sessions: FocusSession[];

  // Actions
  start: (taskId?: string, taskName?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: () => void;
  reset: () => void;

  // Settings
  updateSettings: (settings: Partial<FocusSettings>) => void;

  // Computed
  progress: number;
  todayStats: { totalMinutes: number; sessionsCount: number };
}

// Default settings
const defaultSettings: FocusSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  notificationEnabled: true,
};

// Generate unique ID
function generateId(): string {
  return `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if same day
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function useFocus(options: UseFocusOptions = {}): UseFocusReturn {
  const { onSessionComplete, onPhaseChange, onTimerTick, initialSettings } = options;

  // Settings
  const [settings, setSettings] = useState<FocusSettings>({
    ...defaultSettings,
    ...initialSettings,
  });

  // Focus state
  const [state, setState] = useState<FocusState>({
    isActive: false,
    isPaused: false,
    currentPhase: 'idle',
    timeRemaining: settings.workDuration * 60,
    totalTime: settings.workDuration * 60,
    sessionsCompleted: 0,
    currentTaskId: undefined,
    currentTaskName: undefined,
  });

  // Sessions history
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const sessionStartRef = useRef<Date | undefined>(undefined);

  // Get phase duration
  const getPhaseDuration = useCallback(
    (phase: FocusState['currentPhase']): number => {
      switch (phase) {
        case 'work':
          return settings.workDuration * 60;
        case 'short_break':
          return settings.shortBreakDuration * 60;
        case 'long_break':
          return settings.longBreakDuration * 60;
        default:
          return settings.workDuration * 60;
      }
    },
    [settings]
  );

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const audio = new Audio('/sounds/timer-complete.mp3');
      audio.play().catch(console.error);
    } catch {
      console.log('Focus timer completed');
    }
  }, [settings.soundEnabled]);

  // Show notification
  const showNotification = useCallback(
    (title: string, body: string) => {
      if (!settings.notificationEnabled) return;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    },
    [settings.notificationEnabled]
  );

  // Complete current session
  const completeSession = useCallback(
    (completed: boolean) => {
      if (!sessionStartRef.current) return;

      const duration = Math.round(
        (Date.now() - sessionStartRef.current.getTime()) / 1000 / 60
      );

      const session: FocusSession = {
        id: generateId(),
        date: new Date(),
        duration: duration > 0 ? duration : 1,
        taskId: state.currentTaskId,
        taskName: state.currentTaskName,
        completed,
        type: state.currentPhase === 'work' ? 'work' : 'break',
      };

      setSessions((prev) => [session, ...prev]);
      onSessionComplete?.(session);

      sessionStartRef.current = undefined;
    },
    [state.currentTaskId, state.currentTaskName, state.currentPhase, onSessionComplete]
  );

  // Handle phase completion
  const handlePhaseComplete = useCallback(() => {
    playNotificationSound();

    if (state.currentPhase === 'work') {
      completeSession(true);
      showNotification('专注完成! 🎉', '休息一下吧');

      const newSessionCount = state.sessionsCompleted + 1;
      const nextPhase =
        newSessionCount % settings.sessionsUntilLongBreak === 0 ? 'long_break' : 'short_break';

      setState((prev) => ({
        ...prev,
        currentPhase: nextPhase,
        sessionsCompleted: newSessionCount,
        timeRemaining: getPhaseDuration(nextPhase),
        totalTime: getPhaseDuration(nextPhase),
        isActive: settings.autoStartBreaks,
        isPaused: !settings.autoStartBreaks,
      }));

      onPhaseChange?.(nextPhase);

      if (settings.autoStartBreaks) {
        sessionStartRef.current = new Date();
      }
    } else {
      completeSession(true);
      showNotification('休息结束', '准备开始下一个专注');

      setState((prev) => ({
        ...prev,
        currentPhase: 'work',
        timeRemaining: getPhaseDuration('work'),
        totalTime: getPhaseDuration('work'),
        isActive: settings.autoStartWork,
        isPaused: !settings.autoStartWork,
      }));

      onPhaseChange?.('work');

      if (settings.autoStartWork) {
        sessionStartRef.current = new Date();
      }
    }
  }, [
    state.currentPhase,
    state.sessionsCompleted,
    settings,
    getPhaseDuration,
    playNotificationSound,
    completeSession,
    showNotification,
    onPhaseChange,
  ]);

  // Timer tick effect
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          const newRemaining = prev.timeRemaining - 1;
          onTimerTick?.(newRemaining, prev.totalTime);

          if (newRemaining <= 0) {
            clearInterval(timerRef.current);
            handlePhaseComplete();
            return prev;
          }

          return { ...prev, timeRemaining: newRemaining };
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [state.isActive, state.isPaused, handlePhaseComplete, onTimerTick]);

  // Actions
  const start = useCallback(
    (taskId?: string, taskName?: string) => {
      sessionStartRef.current = new Date();
      setState((prev) => ({
        ...prev,
        isActive: true,
        isPaused: false,
        currentPhase: 'work',
        timeRemaining: getPhaseDuration('work'),
        totalTime: getPhaseDuration('work'),
        currentTaskId: taskId,
        currentTaskName: taskName,
      }));
      onPhaseChange?.('work');
    },
    [getPhaseDuration, onPhaseChange]
  );

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const stop = useCallback(() => {
    completeSession(false);
    setState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      currentPhase: 'idle',
      timeRemaining: getPhaseDuration('work'),
      totalTime: getPhaseDuration('work'),
    }));
    onPhaseChange?.('idle');
  }, [completeSession, getPhaseDuration, onPhaseChange]);

  const skip = useCallback(() => {
    handlePhaseComplete();
  }, [handlePhaseComplete]);

  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    sessionStartRef.current = undefined;
    setState({
      isActive: false,
      isPaused: false,
      currentPhase: 'idle',
      timeRemaining: settings.workDuration * 60,
      totalTime: settings.workDuration * 60,
      sessionsCompleted: 0,
      currentTaskId: undefined,
      currentTaskName: undefined,
    });
    onPhaseChange?.('idle');
  }, [settings.workDuration, onPhaseChange]);

  const updateSettings = useCallback((newSettings: Partial<FocusSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      // Update time if not active
      if (!state.isActive) {
        setState((s) => ({
          ...s,
          timeRemaining: updated.workDuration * 60,
          totalTime: updated.workDuration * 60,
        }));
      }
      return updated;
    });
  }, [state.isActive]);

  // Computed values
  const progress = state.totalTime > 0
    ? ((state.totalTime - state.timeRemaining) / state.totalTime) * 100
    : 0;

  const todayStats = sessions.reduce(
    (acc, session) => {
      if (isSameDay(session.date, new Date()) && session.type === 'work') {
        return {
          totalMinutes: acc.totalMinutes + session.duration,
          sessionsCount: acc.sessionsCount + 1,
        };
      }
      return acc;
    },
    { totalMinutes: 0, sessionsCount: 0 }
  );

  return {
    state,
    settings,
    sessions,
    start,
    pause,
    resume,
    stop,
    skip,
    reset,
    updateSettings,
    progress,
    todayStats,
  };
}

export default useFocus;
