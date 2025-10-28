/**
 * Domain Client - 客户端领域层
 *
 * 此包包含所有领域模块的客户端实现
 */

// ============ 命名空间导出（用于需要完整模块访问的场景） ============
// 编辑器模块
export * as EditorDomain from './editor';

// 目标模块
export * as GoalDomain from './goal';

// 知识库模块
export * as RepositoryDomain from './repository';

// 日程模块
export * as ScheduleDomain from './schedule';

// 任务模块
export * as TaskDomain from './task';

// 设置模块
export * as SettingDomain from './setting';

// ============ Account 模块 ============
export * as AccountDomain from './account';

// ============ Authentication 模块 ============
export * as AuthenticationDomain from './authentication';

// ============ 直接导出（便于直接导入常用类型） ============

// Goal 模块 - 直接从实现导出
export { GoalClient } from './goal/aggregates/GoalClient';
export { GoalFolderClient } from './goal/aggregates/GoalFolderClient';
export { GoalStatisticsClient } from './goal/aggregates/GoalStatisticsClient';
export { KeyResultClient } from './goal/entities/KeyResultClient';
export { GoalRecordClient } from './goal/entities/GoalRecordClient';
export { GoalReviewClient } from './goal/entities/GoalReviewClient';

// Goal 模块 - 类型别名（为了向后兼容）
export type {
  Goal,
  GoalFolder,
  GoalStatistics,
  KeyResult,
  GoalRecord,
  GoalReview,
  GoalMetadata,
  GoalTimeRange,
  GoalReminderConfig,
  KeyResultProgress,
  KeyResultSnapshot,
} from './goal/types';

// Task 模块 - 直接从实现导出
export { TaskTemplateClient } from './task/aggregates/TaskTemplateClient';
export { TaskInstanceClient } from './task/aggregates/TaskInstanceClient';
export { TaskStatisticsClient } from './task/aggregates/TaskStatisticsClient';
export { TaskTemplateHistoryClient } from './task/entities/TaskTemplateHistoryClient';

// Task 模块 - 类型别名（为了向后兼容）
export type {
  TaskTemplate,
  TaskInstance,
  TaskStatistics,
  TaskTemplateHistory,
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
} from './task/types';

// Repository 模块 - 直接从实现导出
export { Repository } from './repository/aggregates/Repository';
export { Resource } from './repository/entities/Resource';
export { LinkedContent } from './repository/entities/LinkedContent';
export { ResourceReference } from './repository/entities/ResourceReference';
export { RepositoryExplorer } from './repository/entities/RepositoryExplorer';
export { RepositoryConfig } from './repository/value-objects/RepositoryConfig';
export { GitInfo } from './repository/value-objects/GitInfo';
export { SyncStatus } from './repository/value-objects/SyncStatus';
export { RepositoryStats } from './repository/value-objects/RepositoryStats';

// Repository 模块 - 类型别名（为了向后兼容）
export type {
  Repository as RepositoryType,
  Resource as ResourceType,
  LinkedContent as LinkedContentType,
  ResourceReference as ResourceReferenceType,
  RepositoryExplorer as RepositoryExplorerType,
  RepositoryConfig as RepositoryConfigType,
  GitInfo as GitInfoType,
  SyncStatus as SyncStatusType,
  RepositoryStats as RepositoryStatsType,
} from './repository';

// Account 模块 - 直接从实现导出
export { Account } from './account/aggregates/Account';
export { Subscription } from './account/entities/Subscription';
export { AccountHistory } from './account/entities/AccountHistory';

// Authentication 模块 - 直接从实现导出
export { AuthCredential } from './authentication/aggregates/AuthCredential';
export { AuthSession } from './authentication/aggregates/AuthSession';
export { PasswordCredential } from './authentication/entities/PasswordCredential';
export { ApiKeyCredential } from './authentication/entities/ApiKeyCredential';
export { RememberMeToken } from './authentication/entities/RememberMeToken';
export { RefreshToken } from './authentication/entities/RefreshToken';
export { CredentialHistory } from './authentication/entities/CredentialHistory';
export { SessionHistory } from './authentication/entities/SessionHistory';
export { DeviceInfo } from './authentication/value-objects/DeviceInfo';

// Reminder 模块 - 从 contracts 导出（domain-client 中暂无实现）
// 注意：这些是 DTO 类型，不是类实现
// 使用命名空间导入以避免冲突
import type { ReminderContracts } from '@dailyuse/contracts';

export type ReminderTemplate = ReminderContracts.ReminderTemplateClientDTO;
export type ReminderTemplateGroup = ReminderContracts.ReminderGroupClientDTO;

// TODO: ReminderInstance 类型不存在于 contracts，需要定义或移除相关引用
// 临时导出空类型以避免编译错误
export type ReminderInstance = any;

// Setting 模块 - 直接从实现导出
export { UserSetting } from './setting/aggregates/UserSetting';

// Setting 模块 - 类型别名（为了向后兼容）
export type { UserSetting as UserPreferences } from './setting';
