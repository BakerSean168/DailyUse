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

// ============ Events ============
export { GoalEvents } from './events';
export type {
  GoalAggregateRefreshEvent,
  GoalAggregateRefreshReason,
  GoalEventType,
} from './events';

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

// KeyResultWeightSnapshot 和 SnapshotTrigger
export type {
  SnapshotTrigger,
  KeyResultWeightSnapshotServerDTO,
  KeyResultWeightSnapshotClientDTO,
  KeyResultWeightSnapshotPersistenceDTO,
} from './value-objects/KeyResultWeightSnapshot';

// ProgressBreakdown
export type {
  ProgressBreakdown,
  ProgressBreakdownResponse,
} from './value-objects/ProgressBreakdown';

// ============ Entities (Server) ============
export type {
  GoalRecordServerDTO,
  GoalRecordPersistenceDTO,
  GoalRecordServer,
  GoalRecordServerStatic,
} from './entities/GoalRecordServer';

export type {
  KeyResultServerDTO,
  KeyResultPersistenceDTO,
  KeyResultServer,
  KeyResultServerStatic,
} from './entities/KeyResultServer';

export type {
  GoalReviewServerDTO,
  GoalReviewPersistenceDTO,
  GoalReviewServer,
  GoalReviewServerStatic,
} from './entities/GoalReviewServer';

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

// ============ Aggregates (Server) ============
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
  TrendType,
  ChartData,
  TimelineData,
  GoalStatisticsServerDTO,
  GoalStatisticsPersistenceDTO,
  GoalStatisticsRecalculatedEvent,
  GoalStatisticsServer,
  GoalStatisticsServerStatic,
} from './aggregates/GoalStatisticsServer';

export type {
  FocusSessionServerDTO,
  FocusSessionPersistenceDTO,
  FocusSessionServer,
  FocusSessionStartedEvent,
  FocusSessionPausedEvent,
  FocusSessionResumedEvent,
  FocusSessionCompletedEvent,
  FocusSessionCancelledEvent,
} from './aggregates/FocusSessionServer';

// ============ Aggregates (Client) ============
export type { FocusSessionClientDTO, FocusSessionClient } from './aggregates/FocusSessionClient';

export type {
  GoalClientDTO,
  GoalClient,
  GoalClientStatic,
  GoalClientInstance,
  GoalTimeRangeSummary,
} from './aggregates/GoalClient';

export type {
  GoalFolderClientDTO,
  GoalFolderClient,
  GoalFolderClientStatic,
} from './aggregates/GoalFolderClient';

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

// ============ Task Decomposition ============
export type {
  DecomposedTask,
  DecompositionTimeline,
  RiskItem,
  DecompositionResult,
  DecompositionRequest,
  DecompositionOptions,
} from './task-decomposition.types';

// ============ Time Estimation ============
export type {
  TimeEstimationRequest,
  TimeEstimate,
  BatchTimeEstimationResult,
  TimeEstimationHistory,
  UserEstimationPattern,
  EstimationAccuracyAnalysis,
} from './time-estimation.types';
