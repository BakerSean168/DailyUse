/**
 * 跨模块查询 API Client（前端）
 * 为任务模块提供访问目标模块数据的接口
 */

import { apiClient } from './instances';

/**
 * 目标绑定选项（前端）
 */
export interface GoalBindingOption {
  uuid: string;
  title: string;
  description?: string | null;
  status: string;
  targetDate?: number | null;
  progress?: number;
}

/**
 * 关键结果绑定选项（前端）
 */
export interface KeyResultBindingOption {
  uuid: string;
  title: string;
  description?: string | null;
  goalUuid: string;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  weight: number;
}

/**
 * 跨模块查询 API Client
 */
export class CrossModuleAPIClient {
  /**
   * 获取可关联的目标列表（供任务模块使用）
   */
  static async getGoalsForTaskBinding(params?: {
    accountUuid?: string;
    status?: string[];
  }): Promise<GoalBindingOption[]> {
    // apiClient 会自动提取 response.data（extractData 方法）
    return await apiClient.get<GoalBindingOption[]>('/cross-module/goals/for-task-binding', {
      params: {
        accountUuid: params?.accountUuid,
        status: params?.status?.join(','),
      },
    });
  }

  /**
   * 获取目标的关键结果列表（供任务模块使用）
   */
  static async getKeyResultsForTaskBinding(
    goalUuid: string,
  ): Promise<KeyResultBindingOption[]> {
    // apiClient 会自动提取 response.data（extractData 方法）
    return await apiClient.get<KeyResultBindingOption[]>(
      `/cross-module/goals/${goalUuid}/key-results/for-task-binding`
    );
  }

  /**
   * 验证目标和关键结果的绑定是否有效
   */
  static async validateGoalBinding(params: {
    goalUuid: string;
    keyResultUuid: string;
  }): Promise<{ valid: boolean; error?: string }> {
    try {
      // apiClient 会自动提取 response.data（extractData 方法）
      const result = await apiClient.post<{ valid: boolean }>(
        '/cross-module/goals/validate-binding',
        params
      );
      return { valid: result.valid };
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.data?.message || error.message || 'Validation failed',
      };
    }
  }
}
