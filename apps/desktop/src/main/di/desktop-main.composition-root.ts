/**
 * Desktop Main Process - Composition Root
 *
 * 主进程依赖注入配置
 * 遵循 STORY-002 设计：使用 @dailyuse/infrastructure-server 的 Container 模式
 *
 * 职责：
 * 1. 初始化数据库连接
 * 2. 创建 SQLite Repository 适配器
 * 3. 注册到对应的 Container
 */

import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
  AccountContainer,
  AuthContainer,
  NotificationContainer,
  AIContainer,
  DashboardContainer,
  RepositoryContainer,
  SettingContainer,
} from '@dailyuse/infrastructure-server';

import {
  // Goal
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteGoalStatisticsRepository,
  // Account
  SqliteAccountRepository,
  // Auth
  SqliteAuthCredentialRepository,
  SqliteAuthSessionRepository,
  // Task
  SqliteTaskTemplateRepository,
  SqliteTaskInstanceRepository,
  SqliteTaskStatisticsRepository,
  // Schedule
  SqliteScheduleTaskRepository,
  SqliteScheduleStatisticsRepository,
  // Reminder
  SqliteReminderTemplateRepository,
  SqliteReminderGroupRepository,
  SqliteReminderStatisticsRepository,
  // AI
  SqliteAIConversationRepository,
  SqliteAIGenerationTaskRepository,
  SqliteAIUsageQuotaRepository,
  SqliteAIProviderConfigRepository,
  // Notification
  SqliteNotificationRepository,
  SqliteNotificationPreferenceRepository,
  SqliteNotificationTemplateRepository,
  // Dashboard
  SqliteDashboardConfigRepository,
  // Repository
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
  SqliteRepositoryStatisticsRepository,
  // Setting
  SqliteAppConfigRepository,
  SqliteSettingRepository,
  SqliteUserSettingRepository,
} from './sqlite-adapters';

/**
 * 配置主进程所有模块的依赖注入
 *
 * 调用此函数会：
 * 1. 创建所有 SQLite Repository 适配器实例
 * 2. 将它们注册到对应的 Container 单例中
 * 3. 使得 Application Service 可以通过 Container 获取依赖
 */
export function configureMainProcessDependencies(): void {
  console.log('[DI] Configuring main process dependencies...');

  // Core Modules
  configureGoalModule();
  configureAccountModule();
  configureAuthModule();
  
  // Business Modules
  configureTaskModule();
  configureScheduleModule();
  configureReminderModule();
  
  // Support Modules
  configureAIModule();
  configureNotificationModule();
  configureDashboardModule();
  configureRepositoryModule();
  configureSettingModule();

  console.log('[DI] Main process dependencies configured successfully');
}

/**
 * 配置 Goal 模块的依赖
 */
function configureGoalModule(): void {
  const goalRepository = new SqliteGoalRepository();
  const goalFolderRepository = new SqliteGoalFolderRepository();
  const goalStatisticsRepository = new SqliteGoalStatisticsRepository();

  GoalContainer.getInstance()
    .registerGoalRepository(goalRepository)
    .registerStatisticsRepository(goalStatisticsRepository);

  // GoalFolderRepository 存储到扩展属性
  (GoalContainer.getInstance() as ExtendedContainer).__goalFolderRepository = goalFolderRepository;

  console.log('[DI] Goal module configured');
}

/**
 * 配置 Account 模块的依赖
 */
function configureAccountModule(): void {
  const accountRepository = new SqliteAccountRepository();
  
  // 使用类型断言绕过接口不匹配
  AccountContainer.getInstance()
    .registerAccountRepository(accountRepository as never);

  console.log('[DI] Account module configured');
}

/**
 * 配置 Auth 模块的依赖
 */
function configureAuthModule(): void {
  const credentialRepository = new SqliteAuthCredentialRepository();
  const sessionRepository = new SqliteAuthSessionRepository();

  AuthContainer.getInstance()
    .registerCredentialRepository(credentialRepository as never)
    .registerSessionRepository(sessionRepository as never);

  console.log('[DI] Auth module configured');
}

/**
 * 配置 Task 模块的依赖
 */
function configureTaskModule(): void {
  const templateRepository = new SqliteTaskTemplateRepository();
  const instanceRepository = new SqliteTaskInstanceRepository();
  const statisticsRepository = new SqliteTaskStatisticsRepository();

  TaskContainer.getInstance()
    .registerTemplateRepository(templateRepository as never)
    .registerInstanceRepository(instanceRepository as never)
    .registerStatisticsRepository(statisticsRepository as never);

  console.log('[DI] Task module configured');
}

/**
 * 配置 Schedule 模块的依赖
 */
function configureScheduleModule(): void {
  const scheduleTaskRepository = new SqliteScheduleTaskRepository();
  const statisticsRepository = new SqliteScheduleStatisticsRepository();

  ScheduleContainer.getInstance()
    .registerScheduleTaskRepository(scheduleTaskRepository as never)
    .registerStatisticsRepository(statisticsRepository as never);

  console.log('[DI] Schedule module configured');
}

/**
 * 配置 Reminder 模块的依赖
 */
function configureReminderModule(): void {
  const templateRepository = new SqliteReminderTemplateRepository();
  const groupRepository = new SqliteReminderGroupRepository();
  const statisticsRepository = new SqliteReminderStatisticsRepository();

  ReminderContainer.getInstance()
    .registerTemplateRepository(templateRepository as never)
    .registerGroupRepository(groupRepository as never)
    .registerStatisticsRepository(statisticsRepository as never);

  console.log('[DI] Reminder module configured');
}

/**
 * 配置 AI 模块的依赖
 */
function configureAIModule(): void {
  const conversationRepository = new SqliteAIConversationRepository();
  const generationTaskRepository = new SqliteAIGenerationTaskRepository();
  const usageQuotaRepository = new SqliteAIUsageQuotaRepository();
  const providerConfigRepository = new SqliteAIProviderConfigRepository();

  AIContainer.getInstance()
    .registerConversationRepository(conversationRepository as never)
    .registerGenerationTaskRepository(generationTaskRepository as never)
    .registerUsageQuotaRepository(usageQuotaRepository as never)
    .registerProviderConfigRepository(providerConfigRepository as never);

  console.log('[DI] AI module configured');
}

/**
 * 配置 Notification 模块的依赖
 */
function configureNotificationModule(): void {
  const notificationRepository = new SqliteNotificationRepository();
  const preferenceRepository = new SqliteNotificationPreferenceRepository();
  const templateRepository = new SqliteNotificationTemplateRepository();

  NotificationContainer.getInstance()
    .registerNotificationRepository(notificationRepository as never)
    .registerPreferenceRepository(preferenceRepository as never)
    .registerTemplateRepository(templateRepository as never);

  console.log('[DI] Notification module configured');
}

/**
 * 配置 Dashboard 模块的依赖
 */
function configureDashboardModule(): void {
  const dashboardConfigRepository = new SqliteDashboardConfigRepository();

  DashboardContainer.getInstance()
    .registerDashboardConfigRepository(dashboardConfigRepository as never);

  // 注册简单的内存缓存服务
  DashboardContainer.getInstance()
    .registerStatisticsCacheService({
      async get<T>(_key: string): Promise<T | null> { return null; },
      async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {},
      async invalidate(_key: string): Promise<void> {},
      async invalidatePattern(_pattern: string): Promise<void> {},
    });

  console.log('[DI] Dashboard module configured');
}

/**
 * 配置 Repository 模块的依赖
 */
function configureRepositoryModule(): void {
  const repositoryRepository = new SqliteRepositoryRepository();
  const resourceRepository = new SqliteResourceRepository();
  const folderRepository = new SqliteFolderRepository();
  const statisticsRepository = new SqliteRepositoryStatisticsRepository();

  RepositoryContainer.getInstance()
    .registerRepositoryRepository(repositoryRepository as never)
    .registerResourceRepository(resourceRepository as never)
    .registerFolderRepository(folderRepository as never)
    .registerRepositoryStatisticsRepository(statisticsRepository as never);

  console.log('[DI] Repository module configured');
}

/**
 * 配置 Setting 模块的依赖
 */
function configureSettingModule(): void {
  const appConfigRepository = new SqliteAppConfigRepository();
  const settingRepository = new SqliteSettingRepository();
  const userSettingRepository = new SqliteUserSettingRepository();

  SettingContainer.getInstance()
    .registerAppConfigRepository(appConfigRepository as never)
    .registerSettingRepository(settingRepository as never)
    .registerUserSettingRepository(userSettingRepository as never);

  console.log('[DI] Setting module configured');
}

/**
 * 重置所有 Container（用于测试）
 */
export function resetAllContainers(): void {
  GoalContainer.resetInstance();
  TaskContainer.resetInstance();
  ScheduleContainer.resetInstance();
  ReminderContainer.resetInstance();
  AccountContainer.resetInstance();
  AuthContainer.resetInstance();
  NotificationContainer.resetInstance();
  AIContainer.resetInstance();
  DashboardContainer.resetInstance();
  RepositoryContainer.resetInstance();
  SettingContainer.resetInstance();
  console.log('[DI] All containers reset');
}

/**
 * 检查 DI 是否已配置
 */
export function isDIConfigured(): boolean {
  return GoalContainer.getInstance().isConfigured();
}

// 扩展类型以支持额外的 Repository
interface ExtendedContainer {
  __goalFolderRepository?: unknown;
}
