/**
 * PomodoroService - Pomodoro Timer Management
 * 
 * Implements the Pomodoro Technique (25/5/15 minute cycles)
 * with customizable durations, auto-cycle, and event notifications.
 */

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';
export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  phase: PomodoroPhase;
  duration: number; // seconds
  remainingTime: number; // seconds
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
  status: SessionStatus;
  pomodoro_number: number; // which pomodoro in the cycle (1-4)
}

export interface PomodoroSettings {
  workDuration: number; // default 1500 (25 min)
  shortBreakDuration: number; // default 300 (5 min)
  longBreakDuration: number; // default 900 (15 min)
  longBreakInterval: number; // default 4 (every 4 pomodoros)
  autoStartBreak: boolean; // auto-start break after work
  autoStartWork: boolean; // auto-start work after break
  notificationSound: boolean;
  globalHotkey: string; // 'Alt+P' or similar
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * PomodoroService - Singleton service for pomodoro timer management
 */
export class PomodoroService {
  private static instance: PomodoroService;
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  private settings: PomodoroSettings = {
    workDuration: 25 * 60, // 25 minutes
    shortBreakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    longBreakInterval: 4,
    autoStartBreak: false,
    autoStartWork: false,
    notificationSound: true,
    globalHotkey: 'Alt+P',
  };

  private currentSession: PomodoroSession | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private completedPomodoros: number = 0;
  private sessions: PomodoroSession[] = [];

  // Events
  onTick: (remainingSeconds: number, phase: PomodoroPhase) => void = () => {};
  onPhaseComplete: (phase: PomodoroPhase, nextPhase?: PomodoroPhase) => void = () => {};
  onSessionComplete: (session: PomodoroSession) => void = () => {};
  onSessionStart: (session: PomodoroSession) => void = () => {};
  onSessionPause: (session: PomodoroSession) => void = () => {};
  onSessionResume: (session: PomodoroSession) => void = () => {};

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): PomodoroService {
    if (!PomodoroService.instance) {
      PomodoroService.instance = new PomodoroService();
    }
    return PomodoroService.instance;
  }

  /**
   * Start a new pomodoro session
   */
  public start(phase: PomodoroPhase = 'work', taskId?: string): void {
    // Stop existing timer if running
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const duration = this.getDurationForPhase(phase);
    
    this.currentSession = {
      id: this.generateSessionId(),
      taskId,
      phase,
      duration,
      remainingTime: duration,
      startedAt: new Date(),
      status: 'active',
      pomodoro_number: phase === 'work' ? (this.completedPomodoros % this.settings.longBreakInterval) + 1 : 0,
    };

    this.sessions.push(this.currentSession);
    this.onSessionStart(this.currentSession);
    this.startTimer();
  }

  /**
   * Pause the current session
   */
  public pause(): void {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      return;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.currentSession.status = 'paused';
    this.currentSession.pausedAt = new Date();
    this.onSessionPause(this.currentSession);
  }

  /**
   * Resume the current paused session
   */
  public resume(): void {
    if (!this.currentSession || this.currentSession.status !== 'paused') {
      return;
    }

    this.currentSession.status = 'active';
    this.currentSession.pausedAt = undefined;
    this.onSessionResume(this.currentSession);
    this.startTimer();
  }

  /**
   * Skip to next phase
   */
  public skip(): void {
    if (!this.currentSession) {
      return;
    }

    const currentPhase = this.currentSession.phase;
    this.currentSession.status = 'completed';
    this.currentSession.completedAt = new Date();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Update pomodoro count if work phase
    if (currentPhase === 'work') {
      this.completedPomodoros++;
    }

    // Determine next phase
    const nextPhase = this.getNextPhase(currentPhase);
    this.onPhaseComplete(currentPhase, nextPhase);

    // Auto-start next phase if configured
    if (
      (nextPhase === 'work' && this.settings.autoStartWork) ||
      ((nextPhase === 'shortBreak' || nextPhase === 'longBreak') && this.settings.autoStartBreak)
    ) {
      this.start(nextPhase, this.currentSession.taskId);
    } else {
      this.currentSession = null;
    }
  }

  /**
   * Reset current session and clear all state
   */
  public reset(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.currentSession = null;
    this.completedPomodoros = 0;
    this.sessions = [];
  }

  /**
   * Get current session
   */
  public getCurrentSession(): PomodoroSession | null {
    return this.currentSession;
  }

  /**
   * Get remaining time in seconds
   */
  public getRemainingTime(): number {
    return this.currentSession?.remainingTime ?? 0;
  }

  /**
   * Get completed pomodoros today
   */
  public getCompletedPomodoros(): number {
    return this.completedPomodoros;
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<PomodoroSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
    this.clearCache('settings');
  }

  /**
   * Get current settings
   */
  public getSettings(): PomodoroSettings {
    return { ...this.settings };
  }

  /**
   * Get all sessions
   */
  public getSessions(): PomodoroSession[] {
    return [...this.sessions];
  }

  /**
   * Get sessions for a specific date
   */
  public getSessionsByDate(date: Date): PomodoroSession[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.sessions.filter(
      (session) =>
        session.startedAt >= startOfDay && session.startedAt <= endOfDay
    );
  }

  /**
   * Calculate total focus time for a period
   */
  public calculateTotalFocusTime(startDate: Date, endDate: Date): number {
    return this.sessions
      .filter(
        (session) =>
          session.phase === 'work' &&
          session.status === 'completed' &&
          session.completedAt &&
          session.completedAt >= startDate &&
          session.completedAt <= endDate
      )
      .reduce((total, session) => total + session.duration, 0);
  }

  /**
   * Get pomodoro completion rate
   */
  public getCompletionRate(startDate: Date, endDate: Date): number {
    const workSessions = this.sessions.filter(
      (session) =>
        session.phase === 'work' &&
        session.startedAt >= startDate &&
        session.startedAt <= endDate
    );

    if (workSessions.length === 0) return 0;

    const completedCount = workSessions.filter(
      (s) => s.status === 'completed'
    ).length;

    return Math.round((completedCount / workSessions.length) * 100);
  }

  /**
   * Clear cache
   */
  public clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Set cache expiry time (in minutes)
   */
  public setCacheExpiry(minutes: number): void {
    this.cacheExpiry = minutes * 60 * 1000;
  }

  // ==================== Private Methods ====================

  private startTimer(): void {
    if (!this.currentSession) return;

    this.timerInterval = setInterval(() => {
      if (!this.currentSession || this.currentSession.status !== 'active') {
        return;
      }

      this.currentSession.remainingTime--;
      this.onTick(this.currentSession.remainingTime, this.currentSession.phase);

      if (this.currentSession.remainingTime <= 0) {
        this.skip();
      }
    }, 1000);
  }

  private getDurationForPhase(phase: PomodoroPhase): number {
    switch (phase) {
      case 'work':
        return this.settings.workDuration;
      case 'shortBreak':
        return this.settings.shortBreakDuration;
      case 'longBreak':
        return this.settings.longBreakDuration;
      default:
        return this.settings.workDuration;
    }
  }

  private getNextPhase(currentPhase: PomodoroPhase): PomodoroPhase {
    if (currentPhase === 'work') {
      // Check if we need a long break
      if (this.completedPomodoros % this.settings.longBreakInterval === 0) {
        return 'longBreak';
      }
      return 'shortBreak';
    }
    return 'work';
  }

  private generateSessionId(): string {
    return `pomodoro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadSettings(): void {
    // In a real implementation, load from localStorage or database
    // For now, use defaults
  }

  private saveSettings(): void {
    // In a real implementation, save to localStorage or database
    // For now, keep in memory
  }
}

export const pomodoroService = PomodoroService.getInstance();
