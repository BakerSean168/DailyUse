/**
 * @dailyuse/contracts
 * 统一契约导出 - 根入口
 *
 * 🎨 子路径导出架构
 *
 * 使用方式：
 * ```typescript
 * // 方式 1: 从根路径导入常用类型（便捷）
 * import { ApiResponse, GoalStatus, TaskType } from '@dailyuse/contracts';
 *
 * // 方式 2: 从子路径导入完整模块（推荐，极致 Tree-Shaking）
 * import { GoalServerDTO, GoalClientDTO } from '@dailyuse/contracts/goal';
 * import { TaskTemplateServer } from '@dailyuse/contracts/task';
 * import { AccountDTO } from '@dailyuse/contracts/account';
 *
 * // 方式 3: 导入整个模块命名空间（避免命名冲突）
 * import * as GoalContracts from '@dailyuse/contracts/goal';
 * import * as TaskContracts from '@dailyuse/contracts/task';
 * ```
 *
 * 子路径列表：
 * - @dailyuse/contracts/task
 * - @dailyuse/contracts/goal
 * - @dailyuse/contracts/reminder
 * - @dailyuse/contracts/editor
 * - @dailyuse/contracts/repository
 * - @dailyuse/contracts/account
 * - @dailyuse/contracts/authentication
 * - @dailyuse/contracts/schedule
 * - @dailyuse/contracts/setting
 * - @dailyuse/contracts/notification
 * - @dailyuse/contracts/document
 * - @dailyuse/contracts/ai
 * - @dailyuse/contracts/dashboard
 * - @dailyuse/contracts/response
 * - @dailyuse/contracts/shared
 */

// ============================================================
// 响应系统（最常用）
// ============================================================
export {
  ResponseCode,
  ResponseStatus,
  ResponseSeverity,
  ResponseBuilder,
  createResponseBuilder,
  getHttpStatusCode,
  isClientError,
  isServerError,
} from './response';

export type {
  ErrorDetail,
  PaginationInfo,
  BaseResponse,
  SuccessResponse,
  ErrorResponse,
  ApiErrorResponse,
  ApiResponse,
  TResponse,
  ResponseBuilderOptions,
  ListResponse,
  BatchResponse,
} from './response';

// ============================================================
// 共享基础类型
// ============================================================
export { ImportanceLevel } from './shared/importance';
export { UrgencyLevel } from './shared/urgency';

// ============================================================
// 通用调度生命周期事件（跨模块使用）
// ============================================================
export {
  ScheduleLifecycleAction,
  buildScheduleEventType,
  createScheduleLifecycleEvent,
  isScheduleLifecycleEvent,
  parseScheduleEventType,
} from './modules/common/schedule-lifecycle-events';

export type {
  IUnifiedEvent,
  EntityScheduleLifecyclePayload,
  EntityCreatedForScheduleEvent,
  EntityPausedForScheduleEvent,
  EntityResumedForScheduleEvent,
  EntityDeletedForScheduleEvent,
  EntityScheduleChangedEvent,
  ScheduleLifecycleEvent,
  ScheduleLifecycleActionType,
} from './modules/common/schedule-lifecycle-events';

// ============================================================
// Reminder 模块常量和工具函数（运行时值，需直接导出）
// ============================================================
export {
  ROOT_GROUP_CONFIG,
  isRootGroup,
  getRootGroupUuid,
  isOnDesktop,
} from './modules/reminder/constants';

// ============================================================
// 常用枚举（便捷访问，无需子路径导入）
// ============================================================

// Schedule
export {
  ScheduleTaskStatus,
  ExecutionStatus,
  TaskPriority,
  SourceModule,
  Timezone,
} from './modules/schedule/enums';
export { TaskPriority as SchedulePriority } from './modules/schedule/enums';

// Goal
export { GoalStatus, KeyResultValueType, ReviewType, FolderType } from './modules/goal/enums';

// AI
export {
  ConversationStatus,
  MessageRole,
  GenerationTaskType,
  TaskStatus,
  AIProvider,
  AIProviderType,
  AIModel,
  MetricType,
  QuotaResetPeriod,
  KnowledgeDocumentTemplateType,
} from './modules/ai/enums';

// Notification
export {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
  ChannelStatus,
  NotificationActionType,
  ContentType,
} from './modules/notification/enums';

// Repository
export {
  ResourceType,
  ResourceStatus,
  RepositoryStatus,
  RepositoryType,
} from './modules/repository/enums';

// Setting
export {
  SettingValueType,
  SettingScope,
  UIInputType,
  OperatorType,
  AppEnvironment,
  ThemeMode,
  FontSize,
  DateFormat,
  TimeFormat,
  TaskViewType,
  GoalViewType,
  ScheduleViewType,
  ProfileVisibility,
} from './modules/setting/enums';

// Dashboard
export { WidgetSize, WidgetSizeText } from './modules/dashboard/enums';

// Task
export {
  TaskTemplateStatus,
  TaskInstanceStatus,
  TaskType,
  TimeType,
  TaskScheduleMode,
  RecurrenceFrequency,
  RecurrenceEndConditionType,
  DayOfWeek,
  ReminderType,
  ReminderTimeUnit,
} from './modules/task/enums';
export { TimeType as TaskTimeType } from './modules/task/enums';

// Account
export {
  AccountStatus,
  Gender,
  ThemeType,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  StorageQuotaType,
} from './modules/account/enums';

// Authentication
export {
  CredentialType,
  CredentialStatus,
  TwoFactorMethod,
  BiometricType,
  SessionStatus,
  ApiKeyStatus,
  PasswordAlgorithm,
  RememberMeTokenStatus,
  DeviceType,
} from './modules/authentication/enums';

// ============================================================
// 模块命名空间导出（向后兼容 + 避免命名冲突）
// 推荐：使用子路径导入 import * as GoalContracts from '@dailyuse/contracts/goal'
// ============================================================
export * as TaskContracts from './modules/task';
export * as GoalContracts from './modules/goal';
export * as ReminderContracts from './modules/reminder';
export * as EditorContracts from './modules/editor';
export * as RepositoryContracts from './modules/repository';
export * as AccountContracts from './modules/account';
export * as AuthenticationContracts from './modules/authentication';
export * as ScheduleContracts from './modules/schedule';
export * as SettingContracts from './modules/setting';
export * as NotificationContracts from './modules/notification';
export * as DocumentContracts from './document.contracts';
export * as AIContracts from './modules/ai';
export * as DashboardContracts from './modules/dashboard';
export * as sharedContracts from './shared/index';
