/**
 * Goal Module - Domain Server Layer
 *
 * 导出领域层的所有公共接口和实现
 */

// ===== 聚合根 =====
export { Goal as GoalAggregate } from './aggregates/Goal';
export { GoalFolder as GoalFolderAggregate } from './aggregates/GoalFolder';
export { GoalStatistics as GoalStatisticsAggregate } from './aggregates/GoalStatistics';

// ===== 实体 =====
export { GoalRecord as GoalRecordEntity } from './entities/GoalRecord';
export { GoalReview as GoalReviewEntity } from './entities/GoalReview';
export { KeyResult as KeyResultEntity } from './entities/KeyResult';

// ===== 值对象 =====
export { GoalMetadata } from './value-objects/GoalMetadata';
export { GoalTimeRange } from './value-objects/GoalTimeRange';
export { KeyResultProgress } from './value-objects/KeyResultProgress';
export { KeyResultSnapshot } from './value-objects/KeyResultSnapshot';
// export { GoalReminderConfig } from './value-objects/GoalReminderConfig';

// ===== 领域服务 =====
export * from './services';

// ===== 仓储接口 =====
export type { IGoalRepository } from './repositories/IGoalRepository';
export type { IGoalFolderRepository } from './repositories/IGoalFolderRepository';
export type { IGoalStatisticsRepository } from './repositories/IGoalStatisticsRepository';

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
