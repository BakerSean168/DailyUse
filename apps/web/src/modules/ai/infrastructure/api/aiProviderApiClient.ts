/**
 * AI Provider API Client
 * AI 服务提供商配置 API 客户端
 *
 * 职责：
 * - 封装 AI Provider 配置相关的 HTTP 请求
 * - Provider CRUD 操作
 * - 连接测试
 */

import { apiClient } from '@/shared/api/instances';
import type {
  AIProviderConfigClientDTO,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
} from '@dailyuse/contracts/ai';

/**
 * AI Provider API Response 类型
 */
export interface AIProviderListResponse {
  providers: AIProviderConfigClientDTO[];
  total: number;
}

export interface AIProviderResponse {
  provider: AIProviderConfigClientDTO;
}

export interface TestConnectionResponse {
  success: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * AI Provider API Client
 */
export class AIProviderApiClient {
  private readonly baseUrl = '/ai/providers';

  /**
   * 创建 AI Provider 配置
   */
  async createProvider(request: CreateAIProviderRequest): Promise<AIProviderResponse> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取用户的 AI Provider 列表
   */
  async getProviders(): Promise<AIProviderListResponse> {
    const data = await apiClient.get(this.baseUrl);
    return data;
  }

  /**
   * 获取特定 Provider 详情
   */
  async getProvider(uuid: string): Promise<AIProviderResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 更新 Provider 配置
   */
  async updateProvider(
    uuid: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderResponse> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除 Provider 配置
   */
  async deleteProvider(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  /**
   * 测试 Provider 连接
   */
  async testConnection(uuid: string): Promise<TestConnectionResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/test`);
    return data;
  }

  /**
   * 设为默认 Provider
   */
  async setDefaultProvider(uuid: string): Promise<AIProviderResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/set-default`);
    return data;
  }
}

/**
 * 导出单例实例
 */
export const aiProviderApiClient = new AIProviderApiClient();
