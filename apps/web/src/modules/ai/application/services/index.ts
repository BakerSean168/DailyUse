/**
 * AI 模块 - 应用层服务索引
 * DDD Architecture: Application Services
 */

// Goal Generation Application Service
export {
  GoalGenerationApplicationService,
  goalGenerationApplicationService,
} from './GoalGenerationApplicationService';

// Knowledge Generation Application Service
export {
  KnowledgeGenerationApplicationService,
  knowledgeGenerationApplicationService,
  type GenerateKnowledgeRequest,
  type GenerateKnowledgeResponse,
  type GenerateGoalKnowledgeRequest,
} from './KnowledgeGenerationApplicationService';

// AI Generation Application Service (Tasks & Knowledge Documents)
export {
  AIGenerationApplicationService,
  aiGenerationApplicationService,
  type GenerateTaskTemplateRequest,
  type GenerateTasksRequest,
  type GenerateTasksResponse,
  type GenerateKnowledgeDocumentRequest,
} from './AIGenerationApplicationService';

// Document Summarizer Application Service
export {
  DocumentSummarizerApplicationService,
  documentSummarizerApplicationService,
} from './DocumentSummarizerApplicationService';

// AI Provider Application Service
export {
  AIProviderApplicationService,
  aiProviderApplicationService,
} from './AIProviderApplicationService';

// AI Conversation Application Service
export {
  AIConversationApplicationService,
  aiConversationApplicationService,
} from './AIConversationApplicationService';
