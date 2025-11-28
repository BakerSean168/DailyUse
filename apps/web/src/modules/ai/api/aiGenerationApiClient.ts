/**
 * AI Generation API Client
 * AI 生成功能 API 客户端
 *
 * 职责：
 * - 封装 AI 生成相关的 HTTP 请求
 * - 处理请求参数和响应数据
 * - 返回类型安全的 DTO
 */

import { apiClient } from '@/shared/api/instances';
import type { AIProviderConfigClientDTO, AIUsageQuotaClientDTO, GeneratedGoalDraft } from '@dailyuse/contracts/ai';

// 类型别名
type AIUsageQuotaClientDTO = AIUsageQuotaClientDTO;

/**
 * AI Generation API Client
 */
export class AIGenerationApiClient {
  private readonly baseUrl = '/ai';

  /**
   * 生成关键结果（Key Results）
   */
  async generateKeyResults(request: {
    goalTitle: string;
    goalDescription?: string;
    category?: string;
    importance?: string;
    urgency?: string;
  }): Promise<{
    keyResults: any[];
    quota: AIUsageQuotaClientDTO;
    taskUuid: string;
  }> {
    const data = await apiClient.post(`${this.baseUrl}/generate/key-results`, request);
    return data;
  }

  /**
   * 生成任务模板（Task Templates）
   */
  async generateTaskTemplate(request: {
    krTitle: string;
    krDescription?: string;
    targetValue?: number;
    unit?: string;
  }): Promise<any> {
    const data = await apiClient.post(`${this.baseUrl}/generate/task-template`, request);
    return data;
  }

  /**
   * 生成知识文档（Knowledge Documents）
   */
  async generateKnowledgeDocument(request: {
    topic: string;
    context?: string;
    templateType: string;
  }): Promise<any> {
    const data = await apiClient.post(`${this.baseUrl}/generate/knowledge-document`, request);
    return data;
  }

  /**
   * 获取用户配额状态
   */
  async getQuotaStatus(): Promise<AIUsageQuotaClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/quota`);
    return data;
  }
}

/**
 * 导出单例实例
 */
export const aiGenerationApiClient = new AIGenerationApiClient();

