/**
 * Notification Module - Explicit Exports
 * 通知模块 - 显式导出
 *
 * ImportanceLevel 和 UrgencyLevel 从 @dailyuse/contracts/shared 导入
 */

// ============ Enums ============
export {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
  ChannelStatus,
  NotificationActionType,
  ContentType,
} from './enums';

// ============ Value Objects - Server ============
export type {
  INotificationActionServer,
  NotificationActionServerDTO,
  NotificationActionPersistenceDTO,
  NotificationActionServer,
} from './value-objects/NotificationActionServer';

export type {
  INotificationMetadataServer,
  NotificationMetadataServerDTO,
  NotificationMetadataPersistenceDTO,
  NotificationMetadataServer,
} from './value-objects/NotificationMetadataServer';

export type {
  ICategoryPreferenceServer,
  CategoryPreferenceServerDTO,
  CategoryPreferencePersistenceDTO,
  CategoryPreferenceServer,
  ChannelPreference,
} from './value-objects/CategoryPreferenceServer';

export type {
  IDoNotDisturbConfigServer,
  DoNotDisturbConfigServerDTO,
  DoNotDisturbConfigPersistenceDTO,
  DoNotDisturbConfigServer,
} from './value-objects/DoNotDisturbConfigServer';

export type {
  IRateLimitServer,
  RateLimitServerDTO,
  RateLimitPersistenceDTO,
  RateLimitServer,
} from './value-objects/RateLimitServer';

export type {
  IChannelErrorServer,
  ChannelErrorServerDTO,
  ChannelErrorPersistenceDTO,
  ChannelErrorServer,
} from './value-objects/ChannelErrorServer';

export type {
  IChannelResponseServer,
  ChannelResponseServerDTO,
  ChannelResponsePersistenceDTO,
  ChannelResponseServer,
} from './value-objects/ChannelResponseServer';

export type {
  INotificationTemplateConfigServer,
  NotificationTemplateConfigServerDTO,
  NotificationTemplateConfigPersistenceDTO,
  NotificationTemplateConfigServer,
  TemplateContent,
  EmailTemplateContent,
  PushTemplateContent,
  ChannelConfig,
} from './value-objects/NotificationTemplateServer';

// ============ Value Objects - Client ============
export type {
  INotificationActionClient,
  NotificationActionClientDTO,
  NotificationActionClient,
} from './value-objects/NotificationActionClient';

export type {
  INotificationMetadataClient,
  NotificationMetadataClientDTO,
  NotificationMetadataClient,
} from './value-objects/NotificationMetadataClient';

export type {
  ICategoryPreferenceClient,
  CategoryPreferenceClientDTO,
  CategoryPreferenceClient,
} from './value-objects/CategoryPreferenceClient';

export type {
  IRateLimitClient,
  RateLimitClientDTO,
  RateLimitClient,
} from './value-objects/RateLimitClient';

export type {
  IChannelErrorClient,
  ChannelErrorClientDTO,
  ChannelErrorClient,
} from './value-objects/ChannelErrorClient';

export type {
  IChannelResponseClient,
  ChannelResponseClientDTO,
  ChannelResponseClient,
} from './value-objects/ChannelResponseClient';

export type {
  INotificationTemplateConfigClient,
  NotificationTemplateConfigClientDTO,
  NotificationTemplateConfigClient,
} from './value-objects/NotificationTemplateClient';

// ============ Aggregates ============
export type {
  NotificationServerDTO,
  NotificationPersistenceDTO,
  NotificationCreatedEvent,
  NotificationSentEvent,
  NotificationReadEvent,
  NotificationDeletedEvent,
  NotificationStatusChangedEvent,
  NotificationDomainEvent,
  NotificationServer,
  NotificationServerStatic,
} from './aggregates/NotificationServer';

export type {
  NotificationClientDTO,
  NotificationClient,
  NotificationClientStatic,
} from './aggregates/NotificationClient';

export type {
  NotificationTemplateAggregateServerDTO,
  NotificationTemplateAggregatePersistenceDTO,
  NotificationTemplateCreatedEvent,
  NotificationTemplateUpdatedEvent,
  NotificationTemplateActivationChangedEvent,
  NotificationTemplateDomainEvent,
  NotificationTemplateServer,
  NotificationTemplateServerStatic,
} from './aggregates/NotificationTemplateServer';

export type {
  NotificationTemplateAggregateClientDTO,
  NotificationTemplateClient,
  NotificationTemplateClientStatic,
} from './aggregates/NotificationTemplateClient';

export type {
  NotificationPreferenceServerDTO,
  NotificationPreferencePersistenceDTO,
  NotificationPreferenceCreatedEvent,
  NotificationPreferenceUpdatedEvent,
  NotificationPreferenceDomainEvent,
  NotificationPreferenceServer,
  NotificationPreferenceServerStatic,
  ChannelPreferences,
  CategoryPreferences,
} from './aggregates/NotificationPreferenceServer';

export type {
  NotificationPreferenceClientDTO,
  NotificationPreferenceClient,
  NotificationPreferenceClientStatic,
} from './aggregates/NotificationPreferenceClient';

// ============ Entities ============
export type {
  NotificationChannelServerDTO,
  NotificationChannelPersistenceDTO,
  NotificationChannelServer,
  NotificationChannelServerStatic,
} from './entities/NotificationChannelServer';

export type {
  NotificationChannelClientDTO,
  NotificationChannelClient,
  NotificationChannelClientStatic,
} from './entities/NotificationChannelClient';

export type {
  NotificationHistoryServerDTO,
  NotificationHistoryPersistenceDTO,
  NotificationHistoryServer,
  NotificationHistoryServerStatic,
} from './entities/NotificationHistoryServer';

export type {
  NotificationHistoryClientDTO,
  NotificationHistoryClient,
  NotificationHistoryClientStatic,
} from './entities/NotificationHistoryClient';

// ============ API Requests ============
export type {
  NotificationDTO,
  NotificationListResponseDTO,
  NotificationStatsResponseDTO,
  NotificationChannelDTO,
  NotificationChannelListResponseDTO,
  NotificationTemplateDTO,
  NotificationTemplateListResponseDTO,
  NotificationPreferenceDTO,
  TemplateRenderResultDTO,
  TemplateValidationResultDTO,
  CreateNotificationRequestDTO,
  UpdateNotificationRequestDTO,
  NotificationQueryParamsDTO,
  MarkAsReadBatchRequestDTO,
  DeleteNotificationsBatchRequestDTO,
  CleanupOldNotificationsRequestDTO,
  CreateNotificationTemplateRequestDTO,
  UpdateNotificationTemplateRequestDTO,
  CreateNotificationFromTemplateRequestDTO,
  RenderTemplateRequestDTO,
  UpdateNotificationPreferenceRequestDTO,
  SendNotificationRequestDTO,
  RetryChannelRequestDTO,
  ExecuteNotificationActionRequestDTO,
} from './api-requests';
