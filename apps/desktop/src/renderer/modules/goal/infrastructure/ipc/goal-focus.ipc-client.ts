/**
 * Goal Focus IPC Client - Goal 涓撴敞鍔熻兘 IPC 瀹㈡埛绔? * 
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
  duration: number; // 璁″垝鏃堕暱锛堝垎閽燂級
  elapsed: number;  // 瀹為檯鏃堕暱锛堢锛?  status: FocusSessionStatus;
  pausedAt?: number;
  pausedDuration: number; // 鏆傚仠鎬绘椂闀匡紙绉掞級
  notes?: string;
}

export type FocusSessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface FocusStatusDTO {
  isActive: boolean;
  session?: FocusSessionDTO;
  goalTitle?: string;
  remainingTime?: number; // 绉?}

export interface FocusHistoryDTO {
  sessions: FocusSessionDTO[];
  totalSessions: number;
  totalDuration: number; // 鍒嗛挓
  averageDuration: number;
  completionRate: number;
}

export interface FocusStatisticsDTO {
  todayDuration: number; // 鍒嗛挓
  weekDuration: number;
  monthDuration: number;
  totalSessions: number;
  completedSessions: number;
  averageSessionDuration: number;
  longestStreak: number;
  currentStreak: number;
}

export interface PomodoroConfigDTO {
  focusDuration: number;  // 鍒嗛挓
  shortBreak: number;     // 鍒嗛挓
  longBreak: number;      // 鍒嗛挓
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
   * 寮€濮嬩笓娉ㄤ細璇?   */
  async start(params: GoalPayloads.FocusStartRequest): Promise<FocusSessionDTO> {
    return this.client.invoke<FocusSessionDTO>(
      GoalChannels.FOCUS_START,
      params
    );
  }

  /**
   * 鏆傚仠涓撴敞浼氳瘽
   */
  async pause(): Promise<FocusSessionDTO> {
    return this.client.invoke<FocusSessionDTO>(
      GoalChannels.FOCUS_PAUSE,
      {}
    );
  }

  /**
   * 鎭㈠涓撴敞浼氳瘽
   */
  async resume(): Promise<FocusSessionDTO> {
    return this.client.invoke<FocusSessionDTO>(
      GoalChannels.FOCUS_RESUME,
      {}
    );
  }

  /**
   * 鍋滄涓撴敞浼氳瘽
   */
  async stop(notes?: string): Promise<FocusSessionDTO> {
    return this.client.invoke<FocusSessionDTO>(
      GoalChannels.FOCUS_STOP,
      { notes }
    );
  }

  // ============ Status ============

  /**
   * 鑾峰彇褰撳墠涓撴敞鐘舵€?   */
  async getStatus(): Promise<FocusStatusDTO> {
    return this.client.invoke<FocusStatusDTO>(
      GoalChannels.FOCUS_GET_STATUS,
      {}
    );
  }

  /**
   * 鑾峰彇涓撴敞鍘嗗彶
   */
  async getHistory(params: GoalPayloads.FocusHistoryRequest): Promise<FocusHistoryDTO> {
    return this.client.invoke<FocusHistoryDTO>(
      GoalChannels.FOCUS_GET_HISTORY,
      params
    );
  }

  // ============ Convenience Methods ============

  /**
   * 寮€濮嬬暘鑼勯挓锛堥粯璁?5鍒嗛挓锛?   */
  async startPomodoro(goalUuid: string, duration = 25): Promise<FocusSessionDTO> {
    return this.start({ goalUuid, duration });
  }

  /**
   * 鑾峰彇浠婃棩涓撴敞鍘嗗彶
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
   * 鑾峰彇鏈懆涓撴敞鍘嗗彶
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
   * 妫€鏌ユ槸鍚︽湁娲昏穬鐨勪笓娉ㄤ細璇?   */
  async isActive(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isActive;
  }

  /**
   * 鑾峰彇褰撳墠浼氳瘽鍓╀綑鏃堕棿锛堢锛?   */
  async getRemainingTime(): Promise<number | null> {
    const status = await this.getStatus();
    return status.remainingTime ?? null;
  }
}

// ============ Singleton Export ============

export const goalFocusIPCClient = new GoalFocusIPCClient();
