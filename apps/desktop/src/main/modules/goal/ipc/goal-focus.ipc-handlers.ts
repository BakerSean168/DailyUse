/**
 * Goal Focus IPC Handlers - 专注功能 IPC 处理器
 * 
 * @module main/modules/goal/ipc
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { GoalChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

interface FocusSession {
  uuid: string;
  goalUuid: string;
  accountUuid: string;
  startedAt: number;
  endedAt?: number;
  duration: number;
  elapsed: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  pausedAt?: number;
  pausedDuration: number;
  notes?: string;
}

interface FocusStatus {
  isActive: boolean;
  session?: FocusSession;
  goalTitle?: string;
  remainingTime?: number;
}

interface FocusHistory {
  sessions: FocusSession[];
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  completionRate: number;
}

// ============ Focus Manager ============

/**
 * Focus Session Manager
 * 管理专注会话状态
 */
class FocusSessionManager {
  private currentSession: FocusSession | null = null;
  private sessions: FocusSession[] = [];
  private timer: NodeJS.Timeout | null = null;

  /**
   * 开始专注会话
   */
  start(goalUuid: string, accountUuid: string, duration: number): FocusSession {
    // 如果有活跃会话，先停止
    if (this.currentSession && this.currentSession.status === 'active') {
      this.stop();
    }

    const session: FocusSession = {
      uuid: crypto.randomUUID(),
      goalUuid,
      accountUuid,
      startedAt: Date.now(),
      duration,
      elapsed: 0,
      status: 'active',
      pausedDuration: 0,
    };

    this.currentSession = session;
    this.startTimer();
    
    return session;
  }

  /**
   * 暂停会话
   */
  pause(): FocusSession | null {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      return null;
    }

    this.stopTimer();
    this.currentSession.status = 'paused';
    this.currentSession.pausedAt = Date.now();
    
    return { ...this.currentSession };
  }

  /**
   * 恢复会话
   */
  resume(): FocusSession | null {
    if (!this.currentSession || this.currentSession.status !== 'paused') {
      return null;
    }

    if (this.currentSession.pausedAt) {
      this.currentSession.pausedDuration += Date.now() - this.currentSession.pausedAt;
      this.currentSession.pausedAt = undefined;
    }
    
    this.currentSession.status = 'active';
    this.startTimer();
    
    return { ...this.currentSession };
  }

  /**
   * 停止会话
   */
  stop(notes?: string): FocusSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.stopTimer();
    
    const endedAt = Date.now();
    this.currentSession.endedAt = endedAt;
    this.currentSession.status = 'completed';
    this.currentSession.notes = notes;
    
    // 计算实际用时（减去暂停时间）
    let activeTime = endedAt - this.currentSession.startedAt - this.currentSession.pausedDuration;
    if (this.currentSession.pausedAt) {
      activeTime -= (endedAt - this.currentSession.pausedAt);
    }
    this.currentSession.elapsed = Math.floor(activeTime / 1000);
    
    const completedSession = { ...this.currentSession };
    this.sessions.push(completedSession);
    this.currentSession = null;
    
    return completedSession;
  }

  /**
   * 获取当前状态
   */
  getStatus(): FocusStatus {
    if (!this.currentSession) {
      return { isActive: false };
    }

    let remainingTime: number | undefined;
    if (this.currentSession.status === 'active') {
      const elapsed = Math.floor((Date.now() - this.currentSession.startedAt - this.currentSession.pausedDuration) / 1000);
      remainingTime = Math.max(0, this.currentSession.duration * 60 - elapsed);
    } else if (this.currentSession.status === 'paused' && this.currentSession.pausedAt) {
      const elapsed = Math.floor((this.currentSession.pausedAt - this.currentSession.startedAt - this.currentSession.pausedDuration) / 1000);
      remainingTime = Math.max(0, this.currentSession.duration * 60 - elapsed);
    }

    return {
      isActive: this.currentSession.status === 'active' || this.currentSession.status === 'paused',
      session: { ...this.currentSession },
      remainingTime,
    };
  }

  /**
   * 获取历史记录
   */
  getHistory(goalUuid?: string, startDate?: number, endDate?: number): FocusHistory {
    let filtered = this.sessions;

    if (goalUuid) {
      filtered = filtered.filter(s => s.goalUuid === goalUuid);
    }

    if (startDate) {
      filtered = filtered.filter(s => s.startedAt >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(s => s.startedAt <= endDate);
    }

    const completedSessions = filtered.filter(s => s.status === 'completed');
    const totalDuration = completedSessions.reduce((sum, s) => sum + Math.floor(s.elapsed / 60), 0);
    const averageDuration = completedSessions.length > 0 ? totalDuration / completedSessions.length : 0;

    return {
      sessions: filtered,
      totalSessions: filtered.length,
      totalDuration,
      averageDuration,
      completionRate: filtered.length > 0 ? completedSessions.length / filtered.length : 0,
    };
  }

  private startTimer(): void {
    this.stopTimer();
    
    // 每秒更新elapsed
    this.timer = setInterval(() => {
      if (this.currentSession && this.currentSession.status === 'active') {
        const elapsed = Math.floor((Date.now() - this.currentSession.startedAt - this.currentSession.pausedDuration) / 1000);
        this.currentSession.elapsed = elapsed;
        
        // 检查是否到达计划时间
        if (elapsed >= this.currentSession.duration * 60) {
          this.stop();
          // TODO: 发送通知
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// ============ Singleton ============
const focusManager = new FocusSessionManager();

// ============ IPC Handler ============

/**
 * Goal Focus IPC Handler
 */
export class GoalFocusIPCHandler extends BaseIPCHandler {
  constructor() {
    super('GoalFocusIPCHandler');
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 开始专注
    ipcMain.handle(GoalChannels.FOCUS_START, async (_event, params: { goalUuid: string; duration: number; accountUuid?: string }) => {
      return this.handleRequest(
        GoalChannels.FOCUS_START,
        () => focusManager.start(params.goalUuid, params.accountUuid ?? '', params.duration),
        { goalUuid: params.goalUuid },
      );
    });

    // 暂停专注
    ipcMain.handle(GoalChannels.FOCUS_PAUSE, async () => {
      return this.handleRequest(
        GoalChannels.FOCUS_PAUSE,
        () => focusManager.pause(),
      );
    });

    // 恢复专注
    ipcMain.handle(GoalChannels.FOCUS_RESUME, async () => {
      return this.handleRequest(
        GoalChannels.FOCUS_RESUME,
        () => focusManager.resume(),
      );
    });

    // 停止专注
    ipcMain.handle(GoalChannels.FOCUS_STOP, async (_event, params: { notes?: string }) => {
      return this.handleRequest(
        GoalChannels.FOCUS_STOP,
        () => focusManager.stop(params.notes),
      );
    });

    // 获取状态
    ipcMain.handle(GoalChannels.FOCUS_GET_STATUS, async () => {
      return this.handleRequest(
        GoalChannels.FOCUS_GET_STATUS,
        () => focusManager.getStatus(),
      );
    });

    // 获取历史
    ipcMain.handle(GoalChannels.FOCUS_GET_HISTORY, async (_event, params: { goalUuid?: string; startDate?: number; endDate?: number }) => {
      return this.handleRequest(
        GoalChannels.FOCUS_GET_HISTORY,
        () => focusManager.getHistory(params.goalUuid, params.startDate, params.endDate),
      );
    });
  }
}

// ============ Exports ============

export const goalFocusIPCHandler = new GoalFocusIPCHandler();

export function registerGoalFocusIpcHandlers(): void {
  // Handler 已在构造函数中注册
}

export function unregisterGoalFocusIpcHandlers(): void {
  ipcMain.removeHandler(GoalChannels.FOCUS_START);
  ipcMain.removeHandler(GoalChannels.FOCUS_PAUSE);
  ipcMain.removeHandler(GoalChannels.FOCUS_RESUME);
  ipcMain.removeHandler(GoalChannels.FOCUS_STOP);
  ipcMain.removeHandler(GoalChannels.FOCUS_GET_STATUS);
  ipcMain.removeHandler(GoalChannels.FOCUS_GET_HISTORY);
}
