/**
 * Goal Focus IPC Client - Goal 专注功能 IPC 客户端
 * 
 * @module renderer/modules/goal/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { GoalChannels } from '@/shared/types/ipc-channels';
import type { GoalPayloads } from '@/shared/types/ipc-payloads';

// ============ Types ============

export interface FocusSessionDTO {
  uuid: string;
  goalUuid: string;
  accountUuid: string;
  startedAt: number;
  endedAt?: number;
  duration: number; // 计划时长（分钟）
  elapsed: number;  // 实际时长（秒）
  status: FocusSessionStatus;
  pausedAt?: number;
  pausedDuration: number; // 暂停总时长（秒）
  notes?: string;
}

export type FocusSessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface FocusStatusDTO {
  isActive: boolean;
  session?: FocusSessionDTO;
  goalTitle?: string;
  remainingTime?: number; // 秒
}

export interface FocusHistoryDTO {
  sessions: FocusSessionDTO[];
  totalSessions: number;
  totalDuration: number; // 分钟
  averageDuration: number;
  completionRate: number;
}

export interface FocusStatisticsDTO {
  todayDuration: number; // 分钟
  weekDuration: number;
  monthDuration: number;
  totalSessions: number;
  completedSessions: number;
  averageSessionDuration: number;
  longestStreak: number;
  currentStreak: number;
}

export interface PomodoroConfigDTO {
  focusDuration: number;  // 分钟
  shortBreak: number;     // 分钟
  longBreak: number;      // 分钟
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

// ============ Goal Focus IPC Client ============

/**
 * Goal Focus IPC Client
 */
export class GoalFocusIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Session Management ============

  /**
   * 开始专注会话
   */
  async start(params: GoalPayloads.FocusStartRequest): Promise<FocusSessionDTO> {
    return this.client.invoke<FocusSessionDTO>(
      GoalChannels.FOCUS_START,
      params
    );
  }

  /**
   * 暂停专注会话
   */
  async pause(): Promise<FocusSessionDTO> {
    return this.client.invoke<FocusSessionDTO>(
      GoalChannels.FOCUS_PAUSE,
      {}
    );
  }

  /**
   * 恢复专注会话
   */
  async resume(): Promise<FocusSessionDTO> {
    return this.client.invoke<FocusSessionDTO>(
      GoalChannels.FOCUS_RESUME,
      {}
    );
  }

  /**
   * 停止专注会话
   */
  async stop(notes?: string): Promise<FocusSessionDTO> {
    return this.client.invoke<FocusSessionDTO>(
      GoalChannels.FOCUS_STOP,
      { notes }
    );
  }

  // ============ Status ============

  /**
   * 获取当前专注状态
   */
  async getStatus(): Promise<FocusStatusDTO> {
    return this.client.invoke<FocusStatusDTO>(
      GoalChannels.FOCUS_GET_STATUS,
      {}
    );
  }

  /**
   * 获取专注历史
   */
  async getHistory(params: GoalPayloads.FocusHistoryRequest): Promise<FocusHistoryDTO> {
    return this.client.invoke<FocusHistoryDTO>(
      GoalChannels.FOCUS_GET_HISTORY,
      params
    );
  }

  // ============ Convenience Methods ============

  /**
   * 开始番茄钟（默认25分钟）
   */
  async startPomodoro(goalUuid: string, duration = 25): Promise<FocusSessionDTO> {
    return this.start({ goalUuid, duration });
  }

  /**
   * 获取今日专注历史
   */
  async getTodayHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return this.getHistory({
      goalUuid,
      startDate: startOfDay,
      endDate: endOfDay,
    });
  }

  /**
   * 获取本周专注历史
   */
  async getWeekHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    return this.getHistory({
      goalUuid,
      startDate: startOfWeek,
      endDate: endOfWeek,
    });
  }

  /**
   * 检查是否有活跃的专注会话
   */
  async isActive(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isActive;
  }

  /**
   * 获取当前会话剩余时间（秒）
   */
  async getRemainingTime(): Promise<number | null> {
    const status = await this.getStatus();
    return status.remainingTime ?? null;
  }
}

// ============ Singleton Export ============

export const goalFocusIPCClient = new GoalFocusIPCClient();
