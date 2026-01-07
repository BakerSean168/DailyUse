/**
 * Focus Application Service
 *
 * 专注功能的 Application Service (thin wrapper)
 * 封装 @dailyuse/application-client 的 Focus Use Cases
 *
 * @module goal/application/services
 */

import {
  startFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  stopFocusSession,
  getFocusStatus,
  getFocusHistory,
  getTodayFocusHistory,
  getWeekFocusHistory,
  getFocusStatistics,
} from '@dailyuse/application-client';
import type {
  FocusSessionClientDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
  FocusStatisticsDTO,
  StartFocusRequest,
  GetFocusHistoryRequest,
} from '@dailyuse/contracts/goal';

/**
 * Focus Application Service
 *
 * 提供专注功能的应用层服务
 */
export class FocusApplicationService {
  /**
   * 开始专注会话
   */
  async startSession(request: StartFocusRequest): Promise<FocusSessionClientDTO> {
    return startFocusSession(request);
  }

  /**
   * 暂停当前会话
   */
  async pauseSession(): Promise<FocusSessionClientDTO> {
    return pauseFocusSession();
  }

  /**
   * 恢复暂停的会话
   */
  async resumeSession(): Promise<FocusSessionClientDTO> {
    return resumeFocusSession();
  }

  /**
   * 停止当前会话
   */
  async stopSession(notes?: string): Promise<FocusSessionClientDTO | null> {
    return stopFocusSession({ notes });
  }

  /**
   * 获取当前专注状态
   */
  async getStatus(): Promise<FocusStatusDTO> {
    return getFocusStatus();
  }

  /**
   * 获取专注历史
   */
  async getHistory(request?: GetFocusHistoryRequest): Promise<FocusHistoryDTO> {
    return getFocusHistory(request);
  }

  /**
   * 获取今日专注历史
   */
  async getTodayHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    return getTodayFocusHistory(goalUuid);
  }

  /**
   * 获取本周专注历史
   */
  async getWeekHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    return getWeekFocusHistory(goalUuid);
  }

  /**
   * 获取专注统计
   */
  async getStatistics(goalUuid?: string): Promise<FocusStatisticsDTO> {
    return getFocusStatistics(goalUuid);
  }
}

/**
 * Focus Application Service 单例
 */
export const focusApplicationService = new FocusApplicationService();
