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

import { GoalContainer } from '@dailyuse/infrastructure-server';
import {
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteGoalStatisticsRepository,
} from './sqlite-adapters';

/**
 * 配置主进程所有模块的依赖注入
 *
 * 调用此函数会：
 * 1. 创建所有 SQLite Repository 适配器实例
 * 2. 将它们注册到对应的 Container 单例中
 * 3. 使得 Application Service 可以通过 Container 获取依赖
 *
 * @example
 * ```typescript
 * // 在 main.ts 或 appInitializer.ts 中调用
 * initializeDatabase();
 * configureMainProcessDependencies();
 *
 * // 之后可以通过 Container 获取 repository
 * const goalRepo = GoalContainer.getInstance().getGoalRepository();
 * ```
 */
export function configureMainProcessDependencies(): void {
  console.log('[DI] Configuring main process dependencies...');

  // ========== Goal Module ==========
  configureGoalModule();

  // ========== Task Module ==========
  // TODO: 在后续 Story 中实现
  // configureTaskModule();

  // ========== Schedule Module ==========
  // TODO: 在后续 Story 中实现
  // configureScheduleModule();

  // ========== Reminder Module ==========
  // TODO: 在后续 Story 中实现
  // configureReminderModule();

  // ========== Account Module ==========
  // TODO: 在后续 Story 中实现
  // configureAccountModule();

  // ========== Auth Module ==========
  // TODO: 在后续 Story 中实现
  // configureAuthModule();

  // ========== Notification Module ==========
  // TODO: 在后续 Story 中实现
  // configureNotificationModule();

  // ========== AI Module ==========
  // TODO: 在后续 Story 中实现
  // configureAIModule();

  // ========== Dashboard Module ==========
  // TODO: 在后续 Story 中实现
  // configureDashboardModule();

  // ========== Repository Module ==========
  // TODO: 在后续 Story 中实现
  // configureRepositoryModule();

  // ========== Setting Module ==========
  // TODO: 在后续 Story 中实现
  // configureSettingModule();

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

  // 注意：GoalFolderRepository 需要单独注册
  // 这里先存储引用，等 Container 支持后再注册
  (GoalContainer.getInstance() as ExtendedGoalContainer).__goalFolderRepository =
    goalFolderRepository;

  console.log('[DI] Goal module configured');
}

/**
 * 重置所有 Container（用于测试）
 */
export function resetAllContainers(): void {
  GoalContainer.resetInstance();
  // TODO: 重置其他 Container
  console.log('[DI] All containers reset');
}

/**
 * 检查 DI 是否已配置
 */
export function isDIConfigured(): boolean {
  return GoalContainer.getInstance().isConfigured();
}

// 扩展类型以支持 GoalFolderRepository
interface ExtendedGoalContainer {
  __goalFolderRepository?: unknown;
}
