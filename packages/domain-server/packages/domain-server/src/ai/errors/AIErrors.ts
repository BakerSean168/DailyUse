/**
 * AI Module Error Classes
 * AI 模块错误类
 */

/**
 * AI 生成超时错误
 */
export class AIGenerationTimeoutError extends Error {
  constructor(message = 'AI generation timeout after 10 seconds') {
    super(message);
    this.name = 'AIGenerationTimeoutError';
  }
}

/**
 * AI 配额超限错误
 */
export class AIQuotaExceededError extends Error {
  constructor(
    public readonly quotaLimit: number,
    public readonly currentUsage: number,
    public readonly resetAt: number
  ) {
    super(
      `AI quota exceeded. Used ${currentUsage}/${quotaLimit}. Resets at ${new Date(resetAt).toISOString()}`
    );
    this.name = 'AIQuotaExceededError';
  }
}

/**
 * AI Provider 错误
 */
export class AIProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'AIProviderError';
  }
}

/**
 * AI 内容验证错误
 */
export class AIValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors?: unknown
  ) {
    super(message);
    this.name = 'AIValidationError';
  }
}
