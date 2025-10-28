/**
 * Goal Module - Type Aliases
 * 目标模块 - 类型别名
 *
 * 这个文件提供简短的类型别名，便于在应用中导入使用
 */

// 导出类实现（不是类型别名）
export { GoalClient } from './aggregates/GoalClient';
export { GoalFolderClient } from './aggregates/GoalFolderClient';
export { GoalStatisticsClient } from './aggregates/GoalStatisticsClient';
export { KeyResultClient } from './entities/KeyResultClient';
export { GoalRecordClient } from './entities/GoalRecordClient';
export { GoalReviewClient } from './entities/GoalReviewClient';

// 导出值对象类实现
export {
  GoalMetadataClient,
  GoalTimeRangeClient,
  GoalReminderConfigClient,
  KeyResultProgressClient,
  KeyResultSnapshotClient,
} from './value-objects';

// 类型别名（仅用于类型导入）
import type { GoalClient } from './aggregates/GoalClient';
import type { GoalFolderClient } from './aggregates/GoalFolderClient';
import type { GoalStatisticsClient } from './aggregates/GoalStatisticsClient';
import type { KeyResultClient } from './entities/KeyResultClient';
import type { GoalRecordClient } from './entities/GoalRecordClient';
import type { GoalReviewClient } from './entities/GoalReviewClient';
import type {
  GoalMetadataClient,
  GoalTimeRangeClient,
  GoalReminderConfigClient,
  KeyResultProgressClient,
  KeyResultSnapshotClient,
} from './value-objects';

export type Goal = GoalClient;
export type GoalFolder = GoalFolderClient;
export type GoalStatistics = GoalStatisticsClient;
export type KeyResult = KeyResultClient;
export type GoalRecord = GoalRecordClient;
export type GoalReview = GoalReviewClient;
export type GoalMetadata = GoalMetadataClient;
export type GoalTimeRange = GoalTimeRangeClient;
export type GoalReminderConfig = GoalReminderConfigClient;
export type KeyResultProgress = KeyResultProgressClient;
export type KeyResultSnapshot = KeyResultSnapshotClient;
