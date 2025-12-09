/**
 * Desktop Main Process - Module Registry
 *
 * 统一注册所有模块
 *
 * Architecture & Priority Order:
 * ==============================
 * INFRASTRUCTURE (priority: 10)
 *   - infrastructure: Database, Container initialization
 *
 * CORE_SERVICES (priority: 40-50)
 *   - notification-module: 45
 *
 * FEATURE_MODULES (priority: 50-160)
 *   - goal-module: 50
 *   - task-module: 60
 *   - schedule-module: 70
 *   - reminder-module: 80
 *   - dashboard-module: 110
 *   - ai-module: 120
 *   - account-module: 130
 *   - repository-module: 140
 *   - setting-module: 150
 *   - editor-module: 160
 *
 * Total: 12 modules with 200+ IPC channels
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

// Infrastructure
import { initializeContainers, closeContainers } from './infrastructure';

// Core Services
import { registerAccountModule } from './account';
import { registerSettingModule } from './setting';
import { registerNotificationModule } from './notification';

// Feature Modules
import { registerGoalModule } from './goal';
import { registerTaskModule } from './task';
import { registerScheduleModule } from './schedule';
import { registerReminderModule } from './reminder';
import { registerAIModule } from './ai';
import { registerDashboardModule } from './dashboard';
import { registerRepositoryModule } from './repository';
import { registerEditorModule } from './editor';

const logger = createLogger('ModuleRegistry');

/**
 * 注册所有模块
 * 
 * 模块将按 InitializationPhase 和 priority 顺序初始化:
 * 1. INFRASTRUCTURE - 基础设施（数据库、Container）[priority: 10]
 * 2. CORE_SERVICES - 核心服务（Account, Setting, Notification）[priority: 50]
 * 3. FEATURE_MODULES - 功能模块（Goal, Task, Schedule 等）[priority: 100+]
 */
export function registerAllModules(): void {
  const manager = InitializationManager.getInstance();

  // ===== Phase 1: INFRASTRUCTURE =====
  manager.registerTask({
    name: 'infrastructure',
    phase: InitializationPhase.APP_STARTUP,
    priority: 10, // Highest priority
    initialize: async () => {
      logger.info('Initializing infrastructure...');
      await initializeContainers();
      logger.info('Infrastructure initialized');
    },
    cleanup: async () => {
      logger.info('Cleaning up infrastructure...');
      await closeContainers();
      logger.info('Infrastructure cleaned up');
    },
  });

  // ===== Phase 2: CORE_SERVICES =====
  registerAccountModule();
  registerSettingModule();
  registerNotificationModule();

  // ===== Phase 3: FEATURE_MODULES =====
  registerGoalModule();
  registerTaskModule();
  registerScheduleModule();
  registerReminderModule();
  registerAIModule();
  registerDashboardModule();
  registerRepositoryModule();
  registerEditorModule();

  logger.info('All modules registered');
}

/**
 * 初始化所有模块
 */
export async function initializeAllModules(): Promise<{
  success: boolean;
  failedModules: string[];
  duration: number;
}> {
  const startTime = Date.now();
  
  try {
    const manager = InitializationManager.getInstance();
    
    // Execute APP_STARTUP phase (contains all our modules)
    await manager.executePhase(InitializationPhase.APP_STARTUP);
    
    const duration = Date.now() - startTime;
    logger.info('All modules initialized successfully', { duration: `${duration}ms` });
    
    return {
      success: true,
      failedModules: [],
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Module initialization failed', error);
    
    return {
      success: false,
      failedModules: ['initialization-error'],
      duration,
    };
  }
}

/**
 * 关闭所有模块（优雅关闭）
 */
export async function shutdownAllModules(): Promise<void> {
  logger.info('Shutting down all modules...');
  
  const manager = InitializationManager.getInstance();
  
  // Cleanup APP_STARTUP phase (in reverse priority order)
  await manager.cleanupPhase(InitializationPhase.APP_STARTUP);
  
  logger.info('All modules shut down');
}
