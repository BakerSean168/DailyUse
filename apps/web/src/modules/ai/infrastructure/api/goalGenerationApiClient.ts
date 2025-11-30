/**
 * Goal Generation API Client
 * 目标生成 API 客户端
 *
 * 职责：
 * - 封装 AI 生成目标相关的 HTTP 请求
 * - 从用户想法生成结构化 OKR 目标
 */

import { apiClient } from '@/shared/api/instances';
import type {
  GenerateGoalRequest,
  GenerateGoalResponse,
  GenerateGoalWithKRsRequest,
  GenerateGoalWithKRsResponse,
} from '@dailyuse/contracts/ai';

/**
 * Goal Generation API Client
 */
export class GoalGenerationApiClient {
  private readonly baseUrl = '/ai/generate';

  /**
   * 从用户想法生成目标
   *
   * @param request - 生成目标请求
   * @returns 生成的目标草稿和元数据
   */
  async generateGoal(request: GenerateGoalRequest): Promise<GenerateGoalResponse> {
    const data = await apiClient.post(`${this.baseUrl}/goal`, request);
    return data;
  }

  /**
   * 从用户想法生成目标 + 关键结果
   *
   * @param request - 生成目标 + KRs 请求
   * @returns 生成的目标草稿、KRs 预览和元数据
   */
  async generateGoalWithKRs(
    request: GenerateGoalWithKRsRequest,
  ): Promise<GenerateGoalWithKRsResponse> {
    const data = await apiClient.post(`${this.baseUrl}/goal-with-krs`, request);
    return data;
  }
}

/**
 * 导出单例实例
 */
export const goalGenerationApiClient = new GoalGenerationApiClient();
