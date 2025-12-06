/**
 * SQLite Adapters Index
 *
 * 导出所有 SQLite Repository 适配器
 */

// Goal Module
export { SqliteGoalRepository } from './goal.sqlite-repository';
export { SqliteGoalFolderRepository } from './goal-folder.sqlite-repository';
export { SqliteGoalStatisticsRepository } from './goal-statistics.sqlite-repository';

// Account Module
export { SqliteAccountRepository } from './account.sqlite-repository';

// Auth Module
export { SqliteAuthCredentialRepository } from './auth-credential.sqlite-repository';
export { SqliteAuthSessionRepository } from './auth-session.sqlite-repository';

// Task Module
export { SqliteTaskTemplateRepository } from './task-template.sqlite-repository';
export { SqliteTaskInstanceRepository } from './task-instance.sqlite-repository';
export { SqliteTaskStatisticsRepository } from './task-statistics.sqlite-repository';

// Schedule Module
export { SqliteScheduleTaskRepository } from './schedule-task.sqlite-repository';
export { SqliteScheduleStatisticsRepository } from './schedule-statistics.sqlite-repository';

// Reminder Module
export { SqliteReminderTemplateRepository } from './reminder-template.sqlite-repository';
export { SqliteReminderGroupRepository } from './reminder-group.sqlite-repository';
export { SqliteReminderStatisticsRepository } from './reminder-statistics.sqlite-repository';

// AI Module
export { SqliteAIConversationRepository } from './ai-conversation.sqlite-repository';
export { SqliteAIGenerationTaskRepository } from './ai-generation-task.sqlite-repository';
export { SqliteAIUsageQuotaRepository } from './ai-usage-quota.sqlite-repository';
export { SqliteAIProviderConfigRepository } from './ai-provider-config.sqlite-repository';

// Notification Module
export { SqliteNotificationRepository } from './notification.sqlite-repository';
export { SqliteNotificationPreferenceRepository } from './notification-preference.sqlite-repository';
export { SqliteNotificationTemplateRepository } from './notification-template.sqlite-repository';

// Dashboard Module
export { SqliteDashboardConfigRepository } from './dashboard-config.sqlite-repository';

// Repository Module
export { SqliteRepositoryRepository } from './repository.sqlite-repository';
export { SqliteResourceRepository } from './resource.sqlite-repository';
export { SqliteFolderRepository } from './folder.sqlite-repository';
export { SqliteRepositoryStatisticsRepository } from './repository-statistics.sqlite-repository';

// Setting Module
export { SqliteAppConfigRepository } from './app-config.sqlite-repository';
export { SqliteSettingRepository } from './setting.sqlite-repository';
export { SqliteUserSettingRepository } from './user-setting.sqlite-repository';
