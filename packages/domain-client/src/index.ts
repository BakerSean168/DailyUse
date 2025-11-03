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
export { Goal } from './goal/aggregates/Goal';
export { GoalFolder } from './goal/aggregates/GoalFolder';
export { GoalStatistics } from './goal/aggregates/GoalStatistics';
export { KeyResult } from './goal/entities/KeyResult';
export { GoalRecord } from './goal/entities/GoalRecord';
export { GoalReview } from './goal/entities/GoalReview';

// Goal 模块 - 类型别名（只导出值对象类型）
export type {
  GoalMetadata,
  GoalTimeRange,
  GoalReminderConfig,
  KeyResultProgress,
  KeyResultSnapshot,
} from './goal/types';

// Task 模块 - 直接从实现导出（已移除 Client 后缀）
export { TaskTemplate } from './task/aggregates/TaskTemplate';
export { TaskInstance } from './task/aggregates/TaskInstance';
export { TaskStatistics } from './task/aggregates/TaskStatistics';
export { TaskTemplateHistory } from './task/entities/TaskTemplateHistory';

// Task 模块 - 类型导出（只导出类型别名，不导出已有的实现类）
export type {
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

// Reminder 模块 - 直接从实现导出（已移除 Client 后缀）
export { ReminderTemplate } from './reminder/aggregates/ReminderTemplate';
export { ReminderGroup } from './reminder/aggregates/ReminderGroup';

// Reminder 模块 - 类型导出
import type { ReminderContracts } from '@dailyuse/contracts';
export type ReminderTemplateDTO = ReminderContracts.ReminderTemplateClientDTO;
export type ReminderGroupDTO = ReminderContracts.ReminderGroupClientDTO;
export type ReminderInstance = any; // TODO: 定义或移除

// Setting 模块 - 直接从实现导出
export { UserSetting } from './setting/aggregates/UserSetting';

// Setting 模块 - 类型别名（为了向后兼容）
export type { UserSetting as UserPreferences } from './setting';
