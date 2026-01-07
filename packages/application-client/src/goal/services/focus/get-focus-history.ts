/**
 * Get Focus History
 *
 * 获取专注历史用例
 */

import type { IGoalFocusApiClient } from '@dailyuse/infrastructure-client';
import type { FocusHistoryDTO, GetFocusHistoryRequest } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Focus History Input
 */
export type GetFocusHistoryInput = GetFocusHistoryRequest;

/**
 * Get Focus History Use Case
 */
export class GetFocusHistory {
  private static instance: GetFocusHistory;

  private constructor(private readonly apiClient: IGoalFocusApiClient) {}

  static createInstance(apiClient?: IGoalFocusApiClient): GetFocusHistory {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFocusApiClient();
    GetFocusHistory.instance = new GetFocusHistory(client);
    return GetFocusHistory.instance;
  }

  static getInstance(): GetFocusHistory {
    if (!GetFocusHistory.instance) {
      GetFocusHistory.instance = GetFocusHistory.createInstance();
    }
    return GetFocusHistory.instance;
  }

  static resetInstance(): void {
    GetFocusHistory.instance = undefined as unknown as GetFocusHistory;
  }

  async execute(input?: GetFocusHistoryInput): Promise<FocusHistoryDTO> {
    return this.apiClient.getHistory(input || {});
  }

  /**
   * 获取今日历史
   */
  async getTodayHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    return this.apiClient.getTodayHistory(goalUuid);
  }

  /**
   * 获取本周历史
   */
  async getWeekHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
    return this.apiClient.getWeekHistory(goalUuid);
  }
}

/**
 * Convenience functions
 */
export async function getFocusHistory(input?: GetFocusHistoryInput): Promise<FocusHistoryDTO> {
  return GetFocusHistory.getInstance().execute(input);
}

export async function getTodayFocusHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
  return GetFocusHistory.getInstance().getTodayHistory(goalUuid);
}

export async function getWeekFocusHistory(goalUuid?: string): Promise<FocusHistoryDTO> {
  return GetFocusHistory.getInstance().getWeekHistory(goalUuid);
}
