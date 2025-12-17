/**
 * Module Registry - 统一模块注册入口
 * 
 * 这个文件负责注册所有模块的 Container 到 ContainerRegistry
 * 并设置模块间的依赖关系
 * 
 * @module renderer/shared/infrastructure/module-registry
 */

import { containerRegistry, ModuleName } from './di';
import { initializationManager, InitializationPriority } from './initialization';

// Import all module containers
import { TaskContainer } from '@/renderer/modules/task/infrastructure';
import { GoalContainer } from '@/renderer/modules/goal/infrastructure';
import { ScheduleContainer } from '@/renderer/modules/schedule/infrastructure';
import { ReminderContainer } from '@/renderer/modules/reminder/infrastructure';
import { RepositoryContainer } from '@/renderer/modules/repository/infrastructure';
import { EditorContainer } from '@/renderer/modules/editor/infrastructure';
import { AccountContainer } from '@/renderer/modules/account/infrastructure';
import { AuthContainer } from '@/renderer/modules/auth/infrastructure';
import { SettingContainer } from '@/renderer/modules/setting/infrastructure';
import { DashboardContainer } from '@/renderer/modules/dashboard/infrastructure';
import { AIContainer } from '@/renderer/modules/ai/infrastructure';
import { NotificationContainer } from '@/renderer/modules/notification/infrastructure';

/**
 * 模块注册配置
 */
interface ModuleConfig {
  name: ModuleName;
  container: new () => InstanceType<typeof TaskContainer>;
  priority: InitializationPriority;
  dependencies?: ModuleName[];
}

/**
 * 所有模块配置
 * 按优先级排序，Critical > High > Normal > Low
 */
const MODULE_CONFIGS: ModuleConfig[] = [
  // Critical Priority - 系统核心模块，必须最先初始化
  {
    name: ModuleName.Auth,
    container: AuthContainer as any,
    priority: InitializationPriority.Critical,
    dependencies: [],
  },
  {
    name: ModuleName.Account,
    container: AccountContainer as any,
    priority: InitializationPriority.Critical,
    dependencies: [ModuleName.Auth],
  },
  {
    name: ModuleName.Setting,
    container: SettingContainer as any,
    priority: InitializationPriority.Critical,
    dependencies: [ModuleName.Auth],
  },
  
  // High Priority - 核心业务模块
  {
    name: ModuleName.Task,
    container: TaskContainer as any,
    priority: InitializationPriority.High,
    dependencies: [ModuleName.Account],
  },
  {
    name: ModuleName.Goal,
    container: GoalContainer as any,
    priority: InitializationPriority.High,
    dependencies: [ModuleName.Account],
  },
  {
    name: ModuleName.Schedule,
    container: ScheduleContainer as any,
    priority: InitializationPriority.High,
    dependencies: [ModuleName.Account],
  },
  {
    name: ModuleName.Reminder,
    container: ReminderContainer as any,
    priority: InitializationPriority.High,
    dependencies: [ModuleName.Account, ModuleName.Notification],
  },
  
  // Normal Priority - 辅助功能模块
  {
    name: ModuleName.Notification,
    container: NotificationContainer as any,
    priority: InitializationPriority.Normal,
    dependencies: [ModuleName.Setting],
  },
  {
    name: ModuleName.Dashboard,
    container: DashboardContainer as any,
    priority: InitializationPriority.Normal,
    dependencies: [ModuleName.Account, ModuleName.Task, ModuleName.Goal],
  },
  {
    name: ModuleName.Repository,
    container: RepositoryContainer as any,
    priority: InitializationPriority.Normal,
    dependencies: [ModuleName.Account],
  },
  {
    name: ModuleName.Editor,
    container: EditorContainer as any,
    priority: InitializationPriority.Normal,
    dependencies: [ModuleName.Account],
  },
  
  // Low Priority - 可延迟加载模块
  {
    name: ModuleName.AI,
    container: AIContainer as any,
    priority: InitializationPriority.Low,
    dependencies: [ModuleName.Account, ModuleName.Setting],
  },
];

/**
 * 注册所有模块
 */
export function registerAllModules(): void {
  console.log('[ModuleRegistry] Registering all modules...');

  for (const config of MODULE_CONFIGS) {
    // Create container instance
    const container = new config.container();

    // Register to container registry
    containerRegistry.registerModule(container);

    // Register to initialization manager
    initializationManager.registerConfig({
      name: config.name,
      priority: config.priority,
      dependencies: config.dependencies || [],
      initialize: async () => {
        await container.initialize();
      },
      dispose: async () => {
        await container.dispose();
      },
    });

    console.log(`[ModuleRegistry] Registered: ${config.name}`);
  }

  console.log(`[ModuleRegistry] ${MODULE_CONFIGS.length} modules registered`);
}

/**
 * 初始化所有模块
 */
export async function initializeAllModules(): Promise<void> {
  console.log('[ModuleRegistry] Initializing all modules...');

  try {
    await initializationManager.initializeAll();
    console.log('[ModuleRegistry] All modules initialized successfully');
  } catch (error) {
    console.error('[ModuleRegistry] Failed to initialize modules:', error);
    throw error;
  }
}

/**
 * 销毁所有模块
 */
export async function disposeAllModules(): Promise<void> {
  console.log('[ModuleRegistry] Disposing all modules...');

  try {
    await initializationManager.disposeAll();
    containerRegistry.disposeAll();
    console.log('[ModuleRegistry] All modules disposed');
  } catch (error) {
    console.error('[ModuleRegistry] Failed to dispose modules:', error);
    throw error;
  }
}

/**
 * 获取模块容器
 */
export function getModuleContainer<T>(name: ModuleName): T {
  return containerRegistry.getModule(name) as T;
}

/**
 * 检查模块是否已初始化
 */
export function isModuleInitialized(name: ModuleName): boolean {
  return initializationManager.isInitialized;
}

/**
 * 等待模块初始化完成
 */
export async function waitForModule(name: ModuleName): Promise<void> {
  // Wait for the module-specific initialization
  // Currently uses global init status - TODO: implement module-specific waiting
  if (!initializationManager.isInitialized) {
    await initializationManager.initializeAll();
  }
}

// Export for convenience
export { ModuleName } from './di';
export { InitializationPriority } from './initialization';
