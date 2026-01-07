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

// Import local module containers (Editor 尚未提取到 packages)
import { EditorContainer } from '@/renderer/modules/editor/infrastructure';

// Import packages containers (singleton pattern)
import {
  TaskContainer,
  GoalContainer,
  ReminderContainer,
  RepositoryContainer,
  AccountContainer,
  AuthContainer,
  SettingContainer,
  DashboardContainer,
  AIContainer,
  NotificationContainer,
  ScheduleContainer,
} from '@dailyuse/infrastructure-client';

/**
 * Container 类型：支持构造函数或单例模式
 */
type ContainerFactory =
  | { type: 'class'; container: new () => any }
  | { type: 'singleton'; getInstance: () => any };

/**
 * 模块注册配置
 */
interface ModuleConfig {
  name: ModuleName;
  factory: ContainerFactory;
  priority: InitializationPriority;
  dependencies?: ModuleName[];
}

/**
 * 所有模块配置
 * 按优先级排序，Critical > High > Normal > Low
 * 
 * factory 类型:
 * - { type: 'class', container: XXXContainer } - 传统类实例化（仅用于未迁移的模块）
 * - { type: 'singleton', getInstance: () => XXXContainer.getInstance() } - 单例模式（packages）
 */
const MODULE_CONFIGS: ModuleConfig[] = [
  // Critical Priority - 系统核心模块，必须最先初始化
  {
    name: ModuleName.Auth,
    factory: { type: 'singleton', getInstance: () => AuthContainer.getInstance() },
    priority: InitializationPriority.Critical,
    dependencies: [],
  },
  {
    name: ModuleName.Account,
    factory: { type: 'singleton', getInstance: () => AccountContainer.getInstance() },
    priority: InitializationPriority.Critical,
    dependencies: [ModuleName.Auth],
  },
  {
    name: ModuleName.Setting,
    factory: { type: 'singleton', getInstance: () => SettingContainer.getInstance() },
    priority: InitializationPriority.Critical,
    dependencies: [ModuleName.Auth],
  },
  
  // High Priority - 核心业务模块
  {
    name: ModuleName.Task,
    factory: { type: 'singleton', getInstance: () => TaskContainer.getInstance() },
    priority: InitializationPriority.High,
    dependencies: [ModuleName.Account],
  },
  {
    name: ModuleName.Goal,
    factory: { type: 'singleton', getInstance: () => GoalContainer.getInstance() },
    priority: InitializationPriority.High,
    dependencies: [ModuleName.Account],
  },
  {
    name: ModuleName.Schedule,
    factory: { type: 'singleton', getInstance: () => ScheduleContainer.getInstance() },
    priority: InitializationPriority.High,
    dependencies: [ModuleName.Account],
  },
  {
    name: ModuleName.Reminder,
    factory: { type: 'singleton', getInstance: () => ReminderContainer.getInstance() },
    priority: InitializationPriority.High,
    dependencies: [ModuleName.Account, ModuleName.Notification],
  },
  
  // Normal Priority - 辅助功能模块
  {
    name: ModuleName.Notification,
    factory: { type: 'singleton', getInstance: () => NotificationContainer.getInstance() },
    priority: InitializationPriority.Normal,
    dependencies: [ModuleName.Setting],
  },
  {
    name: ModuleName.Dashboard,
    factory: { type: 'singleton', getInstance: () => DashboardContainer.getInstance() },
    priority: InitializationPriority.Normal,
    dependencies: [ModuleName.Account, ModuleName.Task, ModuleName.Goal],
  },
  {
    name: ModuleName.Repository,
    factory: { type: 'singleton', getInstance: () => RepositoryContainer.getInstance() },
    priority: InitializationPriority.Normal,
    dependencies: [ModuleName.Account],
  },
  {
    // Editor 模块尚未提取到 packages，保留本地实现
    name: ModuleName.Editor,
    factory: { type: 'class', container: EditorContainer as any },
    priority: InitializationPriority.Normal,
    dependencies: [ModuleName.Account],
  },
  
  // Low Priority - 可延迟加载模块
  {
    name: ModuleName.AI,
    factory: { type: 'singleton', getInstance: () => AIContainer.getInstance() },
    priority: InitializationPriority.Low,
    dependencies: [ModuleName.Account, ModuleName.Setting],
  },
];

/**
 * 创建 Container 实例
 */
function createContainer(factory: ContainerFactory): any {
  if (factory.type === 'singleton') {
    return factory.getInstance();
  }
  return new factory.container();
}

/**
 * 注册所有模块
 */
export function registerAllModules(): void {
  console.log('[ModuleRegistry] Registering all modules...');

  for (const config of MODULE_CONFIGS) {
    // Create container instance (supports both class and singleton patterns)
    const container = createContainer(config.factory);

    // Register to container registry
    containerRegistry.registerModule(container);

    // Register to initialization manager
    // Note: Singleton containers may not have initialize/dispose methods
    initializationManager.registerConfig({
      name: config.name,
      priority: config.priority,
      dependencies: config.dependencies || [],
      initialize: async () => {
        if (typeof container.initialize === 'function') {
          await container.initialize();
        }
      },
      dispose: async () => {
        if (typeof container.dispose === 'function') {
          await container.dispose();
        }
      },
    });

    console.log(`[ModuleRegistry] Registered: ${config.name} (${config.factory.type})`);
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
