/**
 * Renderer Modules Initialization
 *
 * 渲染进程模块统一初始化
 */

import { createLogger } from '@dailyuse/utils';

// Module registration imports
import { registerAccountModule, initializeAccountModule } from '../account';
import { registerAuthModule, initializeAuthModule } from '../authentication';
import { registerTaskModule, initializeTaskModule } from '../task';
import { registerGoalModule, initializeGoalModule } from '../goal';
import { registerScheduleModule, initializeScheduleModule } from '../schedule';
import { registerReminderModule, initializeReminderModule } from '../reminder';
import { registerDashboardModule, initializeDashboardModule } from '../dashboard';
import { registerAIModule, initializeAIModule } from '../ai';
import { registerNotificationModule, initializeNotificationModule } from '../notification';
import { registerRepositoryModule, initializeRepositoryModule } from '../repository';
import { registerSettingModule, initializeSettingModule } from '../setting';

const logger = createLogger('ModulesInit:Renderer');

export interface ModuleInitializationResult {
  success: boolean;
  duration: number;
  failedModules: string[];
}

/**
 * 注册所有渲染进程模块
 */
export function registerAllModules(): void {
  logger.info('Registering renderer modules...');

  // Core modules
  registerAccountModule();
  registerAuthModule();

  // Feature modules
  registerTaskModule();
  registerGoalModule();
  registerScheduleModule();
  registerReminderModule();
  registerDashboardModule();
  registerAIModule();
  registerNotificationModule();
  registerRepositoryModule();
  registerSettingModule();

  logger.info('All renderer modules registered');
}

/**
 * 初始化所有渲染进程模块
 */
export async function initializeModules(): Promise<ModuleInitializationResult> {
  const startTime = Date.now();
  const failedModules: string[] = [];

  logger.info('Initializing renderer modules...');

  try {
    // 先注册所有模块
    registerAllModules();

    // 按优先级初始化模块
    // Phase 1: Core modules (Account & Authentication)
    await Promise.all([
      initializeAccountModule().catch((e: unknown) => {
        logger.error('Account module init failed', e);
        failedModules.push('account');
      }),
      initializeAuthModule().catch((e: unknown) => {
        logger.error('Auth module init failed', e);
        failedModules.push('authentication');
      }),
    ]);

    // Phase 2: Feature modules (parallel)
    await Promise.all([
      initializeTaskModule().catch((e: unknown) => {
        logger.error('Task module init failed', e);
        failedModules.push('task');
      }),
      initializeGoalModule().catch((e: unknown) => {
        logger.error('Goal module init failed', e);
        failedModules.push('goal');
      }),
      initializeScheduleModule().catch((e: unknown) => {
        logger.error('Schedule module init failed', e);
        failedModules.push('schedule');
      }),
      initializeReminderModule().catch((e: unknown) => {
        logger.error('Reminder module init failed', e);
        failedModules.push('reminder');
      }),
      initializeDashboardModule().catch((e: unknown) => {
        logger.error('Dashboard module init failed', e);
        failedModules.push('dashboard');
      }),
      initializeAIModule().catch((e: unknown) => {
        logger.error('AI module init failed', e);
        failedModules.push('ai');
      }),
      initializeNotificationModule().catch((e: unknown) => {
        logger.error('Notification module init failed', e);
        failedModules.push('notification');
      }),
      initializeRepositoryModule().catch((e: unknown) => {
        logger.error('Repository module init failed', e);
        failedModules.push('repository');
      }),
      initializeSettingModule().catch((e: unknown) => {
        logger.error('Setting module init failed', e);
        failedModules.push('setting');
      }),
    ]);

    const duration = Date.now() - startTime;
    const success = failedModules.length === 0;

    if (success) {
      logger.info(`All renderer modules initialized in ${duration}ms`);
    } else {
      logger.warn(`Renderer modules initialized with ${failedModules.length} failures in ${duration}ms`);
    }

    return {
      success,
      duration,
      failedModules,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Module initialization failed', error);

    return {
      success: false,
      duration,
      failedModules: ['initialization-error'],
    };
  }
}
