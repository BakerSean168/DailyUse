import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

// 每个模块的初始化任务

import { registerAccountInitializationTasks } from '../../modules/account';
import { registerAuthenticationInitializationTasks } from '../../modules/authentication';
import { registerGoalInitializationTasks } from '../../modules/goal';
import { initializeUnifiedEventHandlers } from '../events/unifiedEventSystem';
// import { registerTaskInitializationTasks } from '../../modules/Task/initialization/taskInitialization';
// import { registerGoalInitializationTasks } from '../../modules/goal/initialization/goalInitialization';
// import { registerSessionLoggingInitializationTasks } from '../../modules/SessionLogging/initialization/sessionLoggingInitialization';
// import { registerRepositoryInitializationTasks } from '../../modules/Repository/initialization/repositoryInitialization';
// import { registerReminderInitializationTasks } from '../../modules/Reminder/initialization/reminderInitialization';
// import { registerInitializationEventsTask } from './application/events/initializationEventHandlers';

/**
 * 基础设施模块的初始化任务
 */
// 数据库初始化
// const databaseInitTask: InitializationTask = {
//   name: 'database',
//   phase: InitializationPhase.APP_STARTUP,
//   priority: 5,
//   initialize: async () => {
//     await initializeDatabase();
//     console.log('✓ Database initialized');
//   }
// };

const eventSystemInitTask: InitializationTask = {
  name: 'eventSystem',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  initialize: async () => {
    await initializeUnifiedEventHandlers();
    console.log('✓ Event system initialized');
  },
};

/**
 * 注册所有模块的初始化任务
 */
export function registerAllInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(eventSystemInitTask);

  // 注册各模块的任务
  registerAccountInitializationTasks();
  registerAuthenticationInitializationTasks();
  registerGoalInitializationTasks();

  console.log('All initialization tasks registered');
}

/**
 * 应用启动时的初始化
 */
export async function initializeApp(): Promise<void> {
  console.log('Starting application initialization...');
  console.log('💫 [Debug] initializeApp() 调用堆栈:', new Error().stack);

  // 注册所有初始化任务
  registerAllInitializationTasks();

  // 执行应用启动阶段的初始化
  const manager = InitializationManager.getInstance();
  await manager.executePhase(InitializationPhase.APP_STARTUP);

  console.log('✓ Application initialization completed');
}

/**
 * 用户登录时的初始化
 */
export async function initializeUserSession(accountUuid: string): Promise<void> {
  console.log(`Initializing user session for: ${accountUuid}`);

  const manager = InitializationManager.getInstance();

  // 执行用户登录阶段的初始化
  await manager.executePhase(InitializationPhase.USER_LOGIN, { accountUuid });

  console.log(`✓ User session initialized for: ${accountUuid}`);
}

/**
 * 用户登出时的清理
 */
export async function cleanupUserSession(): Promise<void> {
  console.log('Cleaning up user session...');

  const manager = InitializationManager.getInstance();

  // 执行用户登出阶段的清理
  await manager.cleanupPhase(InitializationPhase.USER_LOGIN);

  console.log('✓ User session cleaned up');
}

/**
 * 应用关闭时的清理
 */
export async function cleanupApp(): Promise<void> {
  console.log('Cleaning up application...');

  const manager = InitializationManager.getInstance();

  // 清理所有阶段
  await manager.cleanupPhase(InitializationPhase.USER_LOGIN);
  await manager.cleanupPhase(InitializationPhase.APP_STARTUP);

  console.log('✓ Application cleanup completed');
}

// /**
//  * 获取初始化状态
//  */
// export function getInitializationStatus() {
//   const manager = InitializationManager.getInstance();
//   return manager.getStatus();
// }

/**
 * 检查特定任务是否已完成
 */
export function isTaskCompleted(taskName: string): boolean {
  const manager = InitializationManager.getInstance();
  return manager.isTaskCompleted(taskName);
}
