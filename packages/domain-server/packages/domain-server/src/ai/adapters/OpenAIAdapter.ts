/**
 * OpenAI Adapter Implementation
 * OpenAI 适配器实现
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import type { AIProvider, AIModel } from '@dailyuse/contracts/ai';
import {
  BaseAIAdapter,
  type AIGenerationRequest,
  type AIGenerationResponse,
  type AIStreamChunk,
} from './BaseAIAdapter';
import {
  AIGenerationTimeoutError,
  AIProviderError,
} from '../errors/AIErrors';

/**
 * OpenAI Adapter
 * 
 * 使用 Vercel AI SDK 连接 OpenAI API
 */
export class OpenAIAdapter extends BaseAIAdapter {
  private readonly openai: ReturnType<typeof createOpenAI>;

  constructor(apiKey: string, defaultModel: AIModel = 'gpt-4') {
    super('openai' as AIProvider, defaultModel);

    // 创建 OpenAI 客户端
    this.openai = createOpenAI({
      apiKey,
      compatibility: 'strict', // 严格模式
    });
  }

  /**
   * 生成文本（一次性返回）
   */
  async generateText<T = unknown>(
    request: AIGenerationRequest,
    model?: AIModel
  ): Promise<AIGenerationResponse<T>> {
    const startTime = Date.now();

    try {
      // 创建超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIGenerationTimeoutError());
        }, this.timeout);
      });

      // 调用 AI SDK
      const generationPromise = generateText({
        model: this.openai(model || this.defaultModel),
        prompt: this.buildPrompt(request),
        temperature: request.temperature ?? 0.7,
        maxTokens: request.maxTokens ?? 2000,
      });

      // 竞速：生成 vs 超时
      const result = await Promise.race([generationPromise, timeoutPromise]);

      return {
        content: result.text,
        parsedContent: this.tryParseJSON<T>(result.text),
        tokenUsage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
        generatedAt: Date.now(),
        model: model || this.defaultModel,
      };
    } catch (error) {
      if (error instanceof AIGenerationTimeoutError) {
        throw error;
      }

      throw new AIProviderError(
        this.provider,
        `Failed to generate text: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * 流式生成文本
   */
  async *streamText(
    request: AIGenerationRequest,
    model?: AIModel
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    try {
      const result = await streamText({
        model: this.openai(model || this.defaultModel),
        prompt: this.buildPrompt(request),
        temperature: request.temperature ?? 0.7,
        maxTokens: request.maxTokens ?? 2000,
      });

      let fullText = '';

      // 流式输出每个文本块
      for await (const chunk of result.textStream) {
        fullText += chunk;

        yield {
          delta: chunk,
          fullText,
          isDone: false,
        };
      }

      // 最后一个块，包含 token 使用量
      const usage = await result.usage;

      yield {
        delta: '',
        fullText,
        isDone: true,
        tokenUsage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
        },
      };
    } catch (error) {
      throw new AIProviderError(
        this.provider,
        `Failed to stream text: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await generateText({
        model: this.openai('gpt-3.5-turbo'),
        prompt: 'Say "OK"',
        maxTokens: 10,
      });

      return result.text.trim().toLowerCase().includes('ok');
    } catch {
      return false;
    }
  }

  /**
   * 构建完整的 Prompt
   */
  private buildPrompt(request: AIGenerationRequest): string {
    const parts: string[] = [];

    // 系统提示词
    if (request.systemPrompt) {
      parts.push(`[SYSTEM]\n${request.systemPrompt}\n`);
    }

    // 上下文数据
    if (request.contextData) {
      parts.push(
        `[CONTEXT]\n${JSON.stringify(request.contextData, null, 2)}\n`
      );
    }

    // 用户提示词
    parts.push(`[USER]\n${request.prompt}`);

    return parts.join('\n');
  }

  /**
   * 尝试解析 JSON
   */
  private tryParseJSON<T>(text: string): T | undefined {
    try {
      // 尝试提取 JSON（AI 有时会在 JSON 前后加其他文字）
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      return JSON.parse(text) as T;
    } catch {
      return undefined;
    }
  }
}
