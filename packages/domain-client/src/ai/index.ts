/**
 * AI Module - Domain Client
 * AI 模块 - 客户端领域层
 */

// 聚合根
export { AIConversation } from './aggregates/AIConversation';

// 实体
export { AIMessage } from './entities/AIMessage';

// 仓储接口与实现
export type {
  AiConversationRepository,
  StreamEvent,
  StreamEventChunk,
  StreamEventError,
  StreamEventComplete,
} from './repositories/AiConversationRepository';
export { httpAiConversationRepository } from './repositories/HttpAiConversationRepository';
