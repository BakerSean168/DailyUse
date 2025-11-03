/**
 * Goal Module - Domain Server Layer
 *
 * 导出领域层的所有公共接口和实现
 */

// 值对象
export {
  FocusMode,
  GoalMetadata,
  GoalReminderConfig,
  GoalTimeRange,
  KeyResultProgress,
  KeyResultSnapshot,
  KeyResultWeightSnapshot,
} from './value-objects';

// 实体
export {
  GoalRecord,
  GoalReview,
  KeyResult,
} from './entities';

// 聚合根
export {
  Goal,
  GoalFolder,
  GoalStatistics,
  FocusSession,
} from './aggregates';

// 仓储接口
export type {
  IFocusModeRepository,
  IGoalRepository,
  IGoalFolderRepository,
  IGoalStatisticsRepository,
  IFocusSessionRepository,
  IWeightSnapshotRepository,
  SnapshotQueryResult,
} from './repositories';

// 领域服务
export {
  GoalDomainService,
  GoalFolderDomainService,
  GoalStatisticsDomainService,
  FocusSessionDomainService,
} from './services';
