/**
 * OpenAI Adapter
 *
 * Implements AI generation using OpenAI API via Vercel AI SDK.
 * Supports both text generation and streaming responses.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { AIContracts } from '@dailyuse/contracts';
import { BaseAIAdapter, type AIGenerationResult, type AIStreamCallback } from './BaseAIAdapter';

type GenerationInputServerDTO = AIContracts.GenerationInputServerDTO;

export class OpenAIAdapter extends BaseAIAdapter {
  private openaiProvider: ReturnType<typeof createOpenAI>;

  constructor(config: { apiKey: string; model?: string; timeout?: number }) {
    super(config);

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Create OpenAI provider instance with API key
    this.openaiProvider = createOpenAI({
      apiKey: this.apiKey,
    });
  }

  protected getDefaultModel(): string {
    return 'gpt-4-turbo-preview';
  }

  async generateText(input: GenerationInputServerDTO): Promise<AIGenerationResult> {
    try {
      const result = await generateText({
        model: this.openaiProvider(this.model),
        prompt: input.prompt,
        system: input.systemPrompt || undefined,
        temperature: input.temperature ?? undefined,
        ...(input.maxTokens && { maxTokens: input.maxTokens }),
        abortSignal: AbortSignal.timeout(this.timeout),
      });

      return {
        content: result.text,
        tokenUsage: {
          promptTokens: (result.usage as any).promptTokens || 0,
          completionTokens: (result.usage as any).completionTokens || 0,
          totalTokens: result.usage.totalTokens || 0,
        },
        finishReason: result.finishReason,
        metadata: {
          model: this.model,
          provider: 'openai',
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateStream(input: GenerationInputServerDTO, callback: AIStreamCallback): Promise<void> {
    callback.onStart?.();

    try {
      const result = await streamText({
        model: this.openaiProvider(this.model),
        prompt: input.prompt,
        system: input.systemPrompt || undefined,
        temperature: input.temperature ?? undefined,
        ...(input.maxTokens && { maxTokens: input.maxTokens }),
        abortSignal: AbortSignal.timeout(this.timeout),
      });

      let fullContent = '';

      for await (const chunk of result.textStream) {
        fullContent += chunk;
        callback.onChunk(chunk);
      }

      const usage = await result.usage;
      const finishReason = await result.finishReason;

      callback.onComplete({
        content: fullContent,
        tokenUsage: {
          promptTokens: (usage as any).promptTokens || 0,
          completionTokens: (usage as any).completionTokens || 0,
          totalTokens: usage.totalTokens || 0,
        },
        finishReason,
        metadata: {
          model: this.model,
          provider: 'openai',
        },
      });
    } catch (error) {
      callback.onError(this.handleError(error));
    }
  }

  async validate(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Make a minimal test call to validate the API key
      await generateText({
        model: this.openaiProvider(this.model),
        prompt: 'test',
        abortSignal: AbortSignal.timeout(5000),
      });
      return true;
    } catch {
      return false;
    }
  }

  getAdapterName(): string {
    return 'OpenAIAdapter';
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Check for timeout
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return new Error(`OpenAI API timeout after ${this.timeout}ms`);
      }

      // Check for API errors
      if (error.message.includes('401')) {
        return new Error('OpenAI API authentication failed. Check your API key.');
      }

      if (error.message.includes('429')) {
        return new Error('OpenAI API rate limit exceeded. Please try again later.');
      }

      if (error.message.includes('500') || error.message.includes('503')) {
        return new Error('OpenAI API service unavailable. Please try again later.');
      }

      return error;
    }

    return new Error('Unknown error occurred during OpenAI API call');
  }
}
