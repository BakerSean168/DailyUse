/**
 * AI Adapter Factory
 *
 * Factory for creating AI adapter instances based on configuration.
 * Supports dynamic provider selection via environment variables.
 */

import { BaseAIAdapter } from './BaseAIAdapter';
import { MockAIAdapter } from './MockAIAdapter';
import { OpenAIAdapter } from './OpenAIAdapter';

export type AIProvider = 'openai' | 'mock';

export interface AIAdapterConfig {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
  timeout?: number;
}

export class AIAdapterFactory {
  private static defaultProvider: AIProvider = 'mock';

  /**
   * Create an AI adapter based on configuration
   */
  static createAdapter(config?: AIAdapterConfig): BaseAIAdapter {
    const provider = config?.provider || this.getProviderFromEnv();

    switch (provider) {
      case 'openai':
        return this.createOpenAIAdapter(config);

      case 'mock':
        return this.createMockAdapter(config);

      default:
        console.warn(`Unknown AI provider: ${provider}, falling back to mock adapter`);
        return this.createMockAdapter(config);
    }
  }

  /**
   * Create OpenAI adapter with proper configuration
   */
  private static createOpenAIAdapter(config?: AIAdapterConfig): OpenAIAdapter {
    const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key is required. Set OPENAI_API_KEY environment variable or provide apiKey in config.',
      );
    }

    return new OpenAIAdapter({
      apiKey,
      model: config?.model || process.env.OPENAI_MODEL,
      timeout: config?.timeout,
    });
  }

  /**
   * Create mock adapter for development/testing
   */
  private static createMockAdapter(config?: AIAdapterConfig): MockAIAdapter {
    return new MockAIAdapter({
      delayMs: config?.timeout ? config.timeout / 10 : undefined,
    });
  }

  /**
   * Get provider from environment variables
   */
  private static getProviderFromEnv(): AIProvider {
    const envProvider = process.env.AI_PROVIDER?.toLowerCase();

    if (envProvider === 'openai') {
      return 'openai';
    }

    // Default to mock in development, openai in production
    if (process.env.NODE_ENV === 'production') {
      return 'openai';
    }

    return this.defaultProvider;
  }

  /**
   * Set the default provider (useful for testing)
   */
  static setDefaultProvider(provider: AIProvider): void {
    this.defaultProvider = provider;
  }

  /**
   * Validate a provider configuration
   */
  static async validateConfig(config?: AIAdapterConfig): Promise<boolean> {
    try {
      const adapter = this.createAdapter(config);
      return await adapter.validate();
    } catch {
      return false;
    }
  }
}
