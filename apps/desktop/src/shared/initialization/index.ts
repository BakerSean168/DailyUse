/**
 * Shared Initialization Module
 *
 * Centralizes all initialization tasks and patterns for the Desktop application
 * All modules should follow this pattern to register their initialization tasks
 */

export { registerInfrastructureInitializationTasks } from './infraInitialization';

/**
 * Import and register all initialization tasks from modules
 * This will be called from main.ts on app startup
 */
export function registerAllInitializationTasks(): void {
  console.log('[Initialization] Registering all application initialization tasks...');

  // Infrastructure initialization (database, DI, IPC)
  const { registerInfrastructureInitializationTasks } = require('./infraInitialization');
  registerInfrastructureInitializationTasks();

  // Module-specific initialization tasks
  const { registerAIInitializationTasks } = require('../../main/modules/ai/initialization');
  registerAIInitializationTasks();

  const { registerTaskInitializationTasks } = require('../../main/modules/task/initialization');
  registerTaskInitializationTasks();

  const { registerGoalInitializationTasks } = require('../../main/modules/goal/initialization');
  registerGoalInitializationTasks();

  const { registerScheduleInitializationTasks } = require('../../main/modules/schedule/initialization');
  registerScheduleInitializationTasks();

  const { registerNotificationInitializationTasks } = require('../../main/modules/notification/initialization');
  registerNotificationInitializationTasks();

  const { registerRepositoryInitializationTasks } = require('../../main/modules/repository/initialization');
  registerRepositoryInitializationTasks();

  const { registerDashboardInitializationTasks } = require('../../main/modules/dashboard/initialization');
  registerDashboardInitializationTasks();

  const { registerAccountInitializationTasks } = require('../../main/modules/account/initialization');
  registerAccountInitializationTasks();

  const { registerAuthenticationInitializationTasks } = require('../../main/modules/authentication/initialization');
  registerAuthenticationInitializationTasks();

  const { registerSettingInitializationTasks } = require('../../main/modules/setting/initialization');
  registerSettingInitializationTasks();

  console.log('[Initialization] All initialization tasks registered');
}

