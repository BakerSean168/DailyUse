/**
 * AI Module Exports
 * AI模块 - 显式导出
 */

// ============ Enums ============
export {
  ConversationStatus,
  MessageRole,
  GenerationTaskType,
  TaskStatus,
  AIProvider,
  AIProviderType,
  AIModel,
  KnowledgeDocumentTemplateType,
  MetricType,
  QuotaResetPeriod,
} from './enums';

// ============ Aggregates ============
export type {
  AIConversationClientDTO,
  AIConversationClient,
  AIConversationClientStatic,
  AIConversationClientInstance,
} from './aggregates/AIConversationClient';

export type {
  AIConversationServerDTO,
  AIConversationPersistenceDTO,
  AIConversationCreatedEvent,
  AIConversationUpdatedEvent,
  AIMessageAddedEvent,
  AIConversationDeletedEvent,
  AIConversationServer,
  AIConversationServerStatic,
} from './aggregates/AIConversationServer';

export type {
  AIGenerationTaskClientDTO,
  AIGenerationTaskClient,
  AIGenerationTaskClientStatic,
  AIGenerationTaskClientInstance,
} from './aggregates/AIGenerationTaskClient';

export type {
  AIGenerationTaskServerDTO,
  AIGenerationTaskPersistenceDTO,
  AIGenerationTaskCreatedEvent,
  AIGenerationTaskStatusChangedEvent,
  AIGenerationTaskCompletedEvent,
  AIGenerationTaskFailedEvent,
  AIGenerationTaskRetriedEvent,
  AIGenerationTaskServer,
  AIGenerationTaskServerStatic,
} from './aggregates/AIGenerationTaskServer';

export type {
  AIUsageQuotaClientDTO,
  AIUsageQuotaClient,
  AIUsageQuotaClientStatic,
} from './aggregates/AIUsageQuotaClient';

export type {
  AIUsageQuotaServerDTO,
  AIUsageQuotaPersistenceDTO,
  AIUsageQuotaCreatedEvent,
  AIUsageQuotaConsumedEvent,
  AIUsageQuotaResetEvent,
  AIUsageQuotaExceededEvent,
  AIUsageQuotaLimitUpdatedEvent,
  AIUsageQuotaServer,
  AIUsageQuotaServerStatic,
} from './aggregates/AIUsageQuotaServer';

export type {
  AIProviderConfigClientDTO,
  AIModelInfo,
  AIProviderConfigSummary,
} from './aggregates/AIProviderConfigClient';

export type { AIProviderConfigServerDTO } from './aggregates/AIProviderConfigServer';

// ============ Entities ============
export type {
  MessageClientDTO,
  MessageClient,
  MessageClientStatic,
} from './entities/MessageClient';

export type {
  MessageServerDTO,
  MessagePersistenceDTO,
  MessageServer,
  MessageServerStatic,
} from './entities/MessageServer';

// ============ Value Objects ============
export type {
  GenerationInputClientDTO,
  GenerationInputServerDTO,
  GenerationInputPersistenceDTO,
} from './value-objects/GenerationInput';

export type {
  GenerationResultClientDTO,
  GenerationResultServerDTO,
  GenerationResultPersistenceDTO,
} from './value-objects/GenerationResult';

export type {
  TokenUsageClientDTO,
  TokenUsageServerDTO,
  TokenUsagePersistenceDTO,
} from './value-objects/TokenUsage';

// ============ API Requests & Responses ============
export type {
  CreateConversationRequest,
  UpdateConversationRequest,
  ConversationResponse,
  ConversationListResponse,
  SendMessageRequest,
  MessageResponse,
  MessageListResponse,
  CreateGenerationTaskRequest,
  GenerationTaskResponse,
  GenerationTaskListResponse,
  ChatStreamRequest,
  ChatStreamChunk,
  QuotaResponse,
  UpdateQuotaLimitRequest,
  ListRequest,
} from './api-requests';

export type {
  GeneratedGoalDraft,
  GenerateGoalResponse,
  GenerateGoalWithKRsResponse,
} from './api-responses/GenerateGoalResponse';

export type { SummarizationResultDTO } from './api-responses/SummarizationResultDTO';
