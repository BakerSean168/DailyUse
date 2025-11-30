/**
 * Base AI Adapter - Abstract Class
 * AI 适配器基类
 */

import type {
  AIProvider,
  AIModel,
  GenerationTaskType,
  TokenUsageServerDTO,
} from '@dailyuse/contracts/ai';

/**
 * AI 生成请求参数
 */
export interface AIGenerationRequest {
  taskType: GenerationTaskType;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  contextData?: Record<string, unknown>;
}

/**
 * AI 生成响应
 */
export interface AIGenerationResponse<T = unknown> {
  content: string;
  parsedContent?: T;
  tokenUsage: TokenUsageServerDTO;
  generatedAt: number;
  model: string;
}

/**
 * AI 流式生成块
 */
export interface AIStreamChunk {
  delta: string;
  fullText: string;
  isDone: boolean;
  tokenUsage?: TokenUsageServerDTO;
}

/**
 * Base AI Adapter 抽象类
 * 
 * 所有 AI Provider 适配器都必须继承此类
 */
export abstract class BaseAIAdapter {
  protected readonly provider: AIProvider;
  protected readonly defaultModel: AIModel;
  protected readonly timeout: number = 10000; // 10 秒超时

  constructor(provider: AIProvider, defaultModel: AIModel) {
    this.provider = provider;
    this.defaultModel = defaultModel;
  }

  /**
   * 生成文本（一次性返回完整结果）
   */
  abstract generateText<T = unknown>(
    request: AIGenerationRequest,
    model?: AIModel
  ): Promise<AIGenerationResponse<T>>;

  /**
   * 流式生成文本（返回 AsyncGenerator）
   */
  abstract streamText(
    request: AIGenerationRequest,
    model?: AIModel
  ): AsyncGenerator<AIStreamChunk, void, unknown>;

  /**
   * 获取 Provider 名称
   */
  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * 获取默认模型
   */
  getDefaultModel(): AIModel {
    return this.defaultModel;
  }

  /**
   * 检查健康状态
   */
  abstract healthCheck(): Promise<boolean>;
}
