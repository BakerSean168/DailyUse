/**
 * AI Module - Renderer
 *
 * AI 模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { AIApplicationService, aiApplicationService } from './application/services';

// ===== Presentation Layer =====
export {
  useAIConversation,
  useAIGeneration,
  useAIProvider,
  type AIConversationState,
  type UseAIConversationReturn,
  type AIGenerationState,
  type UseAIGenerationReturn,
  type AIProviderState,
  type UseAIProviderReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerAIModule, initializeAIModule } from './initialization';
