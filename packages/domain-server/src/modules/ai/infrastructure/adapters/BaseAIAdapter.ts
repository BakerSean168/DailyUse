/**
 * Base AI Adapter
 *
 * Abstract base class for all AI provider adapters.
 * Provides a unified interface for text generation and streaming.
 */

import type { AIContracts } from '@dailyuse/contracts';

type GenerationInputServerDTO = AIContracts.GenerationInputServerDTO;
type TokenUsageServerDTO = AIContracts.TokenUsageServerDTO;

export interface AIGenerationResult {
  content: string;
  tokenUsage?: TokenUsageServerDTO;
  finishReason?: string;
  metadata?: Record<string, unknown>;
}

export interface AIStreamCallback {
  onStart?: () => void;
  onChunk: (chunk: string) => void;
  onComplete: (result: AIGenerationResult) => void;
  onError: (error: Error) => void;
}

export abstract class BaseAIAdapter {
  protected readonly apiKey?: string;
  protected readonly model: string;
  protected readonly timeout: number = 10000; // 10 seconds

  constructor(config: { apiKey?: string; model?: string; timeout?: number }) {
    this.apiKey = config.apiKey;
    this.model = config.model || this.getDefaultModel();
    if (config.timeout) {
      this.timeout = config.timeout;
    }
  }

  /**
   * Get the default model for this adapter
   */
  protected abstract getDefaultModel(): string;

  /**
   * Generate text synchronously
   */
  abstract generateText(input: GenerationInputServerDTO): Promise<AIGenerationResult>;

  /**
   * Generate text with streaming
   */
  abstract generateStream(
    input: GenerationInputServerDTO,
    callback: AIStreamCallback,
  ): Promise<void>;

  /**
   * Validate the adapter is properly configured
   */
  abstract validate(): Promise<boolean>;

  /**
   * Get adapter name for logging/debugging
   */
  abstract getAdapterName(): string;
}
