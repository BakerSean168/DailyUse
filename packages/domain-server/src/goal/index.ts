/**
 * Goal Module - Domain Server Layer
 *
 * 导出领域层的所有公共接口和实现
 */

// ===== 聚合根 =====
export { Goal } from './aggregates/Goal';
export { GoalFolder } from './aggregates/GoalFolder';
export { GoalStatistics } from './aggregates/GoalStatistics';
export { FocusSession } from './aggregates/FocusSession';

// ===== 实体 =====
export { GoalRecord } from './entities/GoalRecord';
export { GoalReview } from './entities/GoalReview';
export { KeyResult } from './entities/KeyResult';

// ===== 值对象 =====
export { FocusMode } from './value-objects/FocusMode';
export { GoalMetadata } from './value-objects/GoalMetadata';
export { GoalReminderConfig } from './value-objects/GoalReminderConfig';
export { GoalTimeRange } from './value-objects/GoalTimeRange';
export { KeyResultProgress } from './value-objects/KeyResultProgress';
export { KeyResultSnapshot } from './value-objects/KeyResultSnapshot';
export { KeyResultWeightSnapshot } from './value-objects/KeyResultWeightSnapshot';

// ===== 领域服务 =====
export * from './services';

// ===== 仓储接口 =====
export type { IFocusModeRepository } from './repositories/IFocusModeRepository';
export type { IGoalRepository } from './repositories/IGoalRepository';
export type { IGoalFolderRepository } from './repositories/IGoalFolderRepository';
export type { IGoalStatisticsRepository } from './repositories/IGoalStatisticsRepository';
export type { IFocusSessionRepository } from './repositories/IFocusSessionRepository';
export type {
  IWeightSnapshotRepository,
  SnapshotQueryResult,
} from './repositories/IWeightSnapshotRepository';

// ===== 基础设施层 =====
// export {
//   PrismaGoalRepository,
//   GoalMapper,
//   PrismaGoalFolderRepository,
//   GoalFolderMapper,
//   PrismaGoalStatisticsRepository,
//   GoalStatisticsMapper,
// } from './infrastructure';

// export type {
//   PrismaGoal,
//   PrismaGoalWithRelations,
//   PrismaGoalFolder,
//   PrismaGoalFolderWithRelations,
//   PrismaGoalStatistics,
// } from './infrastructure';

// ===== 类型导出（从 contracts 重新导出，方便使用） =====
// import type { GoalContracts } from '@dailyuse/contracts';

// export type GoalStatus = GoalContracts.GoalStatus;
// export type ImportanceLevel = GoalContracts.ImportanceLevel;
// export type UrgencyLevel = GoalContracts.UrgencyLevel;
// export type KeyResultValueType = GoalContracts.KeyResultValueType;
// export type AggregationMethod = GoalContracts.AggregationMethod;
// export type ReviewType = GoalContracts.ReviewType;
// export type FolderType = GoalContracts.FolderType;

// ===== 导出所有聚合根和实体 =====
export * from './aggregates/Goal';
export * from './aggregates/GoalStatistics';
export * from './entities/KeyResult';
export * from './entities/GoalReview';
export * from './repositories/IGoalRepository';
export * from './services/GoalDomainService';
