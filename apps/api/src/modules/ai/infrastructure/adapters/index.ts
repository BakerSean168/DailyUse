/**
 * AI Adapters Index
 * AI 适配器统一导出
 */

export { BaseAIAdapter } from './BaseAIAdapter';
export type { AIGenerationRequest, AIGenerationResponse, AIStreamChunk } from './BaseAIAdapter';

export { OpenAIAdapter } from './OpenAIAdapter';
export { CustomOpenAICompatibleAdapter } from './CustomOpenAICompatibleAdapter';
export type { CustomProviderConfig } from './CustomOpenAICompatibleAdapter';

// 新增的专用适配器
export { OpenRouterAdapter } from './OpenRouterAdapter';
export type { OpenRouterConfig } from './OpenRouterAdapter';

export { GroqAdapter } from './GroqAdapter';
export type { GroqConfig } from './GroqAdapter';

export { DeepSeekAdapter } from './DeepSeekAdapter';
export type { DeepSeekConfig } from './DeepSeekAdapter';

export { SiliconFlowAdapter } from './SiliconFlowAdapter';
export type { SiliconFlowConfig } from './SiliconFlowAdapter';

export { AIAdapterFactory } from './AIAdapterFactory';
