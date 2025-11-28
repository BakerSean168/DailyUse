/**
 * Goal Module Exports
 * 目标模块 - 显式导出
 *
 * 使用方式：
 * ```typescript
 * import { GoalServerDTO, GoalStatus } from '@dailyuse/contracts/goal';
 * import * as GoalContracts from '@dailyuse/contracts/goal';
 * ```
 */

// ============ Enums ============
export {
  GoalStatus,
  KeyResultValueType,
  AggregationMethod,
  ReminderTriggerType,
  ReviewType,
  FolderType,
  FocusSessionStatus,
} from './enums';

// ============ Value Objects ============
export type {
  HiddenGoalsMode,
  FocusModeServerDTO,
  FocusModeClientDTO,
  ActivateFocusModeRequest,
  ExtendFocusModeRequest,
} from './value-objects/FocusMode';

export type {
  IGoalMetadataServer,
  IGoalMetadataClient,
  GoalMetadataServerDTO,
  GoalMetadataClientDTO,
  GoalMetadataPersistenceDTO,
  GoalMetadataServer,
  GoalMetadataClient,
} from './value-objects/GoalMetadata';

export type {
  ReminderTrigger,
  IGoalReminderConfigServer,
  IGoalReminderConfigClient,
  GoalReminderConfigServerDTO,
  GoalReminderConfigClientDTO,
  GoalReminderConfigPersistenceDTO,
  GoalReminderConfigServer,
  GoalReminderConfigClient,
} from './value-objects/GoalReminderConfig';

export type {
  IGoalTimeRangeServer,
  IGoalTimeRangeClient,
  GoalTimeRangeServerDTO,
  GoalTimeRangeClientDTO,
  GoalTimeRangePersistenceDTO,
  GoalTimeRangeServer,
  GoalTimeRangeClient,
} from './value-objects/GoalTimeRange';

export type {
  IKeyResultProgressServer,
  IKeyResultProgressClient,
  KeyResultProgressServerDTO,
  KeyResultProgressClientDTO,
  KeyResultProgressPersistenceDTO,
  KeyResultProgressServer,
  KeyResultProgressClient,
} from './value-objects/KeyResultProgress';

export type {
  IKeyResultSnapshotServer,
  IKeyResultSnapshotClient,
  KeyResultSnapshotServerDTO,
  KeyResultSnapshotClientDTO,
  KeyResultSnapshotPersistenceDTO,
  KeyResultSnapshotServer,
  KeyResultSnapshotClient,
} from './value-objects/KeyResultSnapshot';

// ============ Entities ============
export type { FocusSessionClientDTO, FocusSessionClient } from './aggregates/FocusSessionClient';

// ============ Aggregates ============
export type {
  GoalServerDTO,
  GoalPersistenceDTO,
  GoalCreatedEvent,
  GoalUpdatedEvent,
  GoalStatusChangedEvent,
  GoalCompletedEvent,
  GoalArchivedEvent,
  GoalDeletedEvent,
  KeyResultAddedEvent,
  KeyResultUpdatedEvent,
  GoalReviewAddedEvent,
  GoalServer,
  GoalServerStatic,
} from './aggregates/GoalServer';

export type {
  GoalClientDTO,
  GoalClient,
  GoalClientStatic,
  GoalClientInstance,
  GoalTimeRangeSummary,
} from './aggregates/GoalClient';

// ============ Entities (Client) ============
export type {
  GoalRecordClientDTO,
  GoalRecordClient,
  GoalRecordClientStatic,
} from './entities/GoalRecordClient';

export type {
  KeyResultClientDTO,
  KeyResultClient,
  KeyResultClientStatic,
} from './entities/KeyResultClient';

export type {
  GoalReviewClientDTO,
  GoalReviewClient,
  GoalReviewClientStatic,
} from './entities/GoalReviewClient';

export type {
  GoalFolderServerDTO,
  GoalFolderPersistenceDTO,
  GoalFolderCreatedEvent,
  GoalFolderUpdatedEvent,
  GoalFolderDeletedEvent,
  GoalFolderStatsUpdatedEvent,
  GoalFolderServer,
  GoalFolderServerStatic,
} from './aggregates/GoalFolderServer';

export type {
  GoalFolderClientDTO,
  GoalFolderClient,
  GoalFolderClientStatic,
} from './aggregates/GoalFolderClient';

export type {
  GoalStatisticsServerDTO,
  GoalStatisticsPersistenceDTO,
  GoalStatisticsRecalculatedEvent,
  GoalStatisticsServer,
  GoalStatisticsServerStatic,
} from './aggregates/GoalStatisticsServer';

export type {
  GoalStatisticsClientDTO,
  GoalStatisticsClient,
  GoalStatisticsClientStatic,
} from './aggregates/GoalStatisticsClient';

// ============ Rules (仅导出类型) ============
export type {
  RuleConditionType,
  RuleMetric,
  RuleOperator,
  RuleCondition,
  RuleAction,
  StatusRule,
  RuleExecutionResult,
  RuleSetConfig,
} from './rules/StatusRule';

// ============ API Requests/Responses ============
export type {
  // Goal CRUD
  CreateGoalRequest,
  UpdateGoalRequest,
  QueryGoalsRequest,
  GoalResponse,
  GoalsResponse,
  // KeyResult
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  UpdateKeyResultProgressRequest,
  KeyResultResponse,
  KeyResultsResponse,
  // GoalRecord
  CreateGoalRecordRequest,
  GoalRecordResponse,
  GoalRecordsResponse,
  // GoalReview
  CreateGoalReviewRequest,
  UpdateGoalReviewRequest,
  GoalReviewResponse,
  GoalReviewsResponse,
  // Aggregate View
  GoalAggregateViewResponse,
  // Folder
  CreateGoalFolderRequest,
  UpdateGoalFolderRequest,
  QueryGoalFoldersRequest,
  GoalFolderResponse,
  GoalFoldersResponse,
  GoalFolderListResponse,
  // Statistics
  GetGoalStatisticsRequest,
  GoalStatisticsResponse,
  GoalStatisticsUpdateEvent,
  RecalculateGoalStatisticsRequest,
  RecalculateGoalStatisticsResponse,
  InitializeGoalStatisticsRequest,
  InitializeGoalStatisticsResponse,
  // Batch Operations
  BatchUpdateGoalStatusRequest,
  BatchMoveGoalsRequest,
  BatchDeleteGoalsRequest,
  BatchOperationResponse,
  // Import/Export
  ExportGoalsRequest,
  ExportGoalsResponse,
  ImportGoalsRequest,
  ImportGoalsResponse,
} from './api-requests';
