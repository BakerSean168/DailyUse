/**
 * Desktop 应用基础设施初始化
 * Infrastructure Initialization Tasks
 * 
 * 负责初始化：
 * - 数据库连接和容器
 * - IPC 系统
 * - 其他基础设施
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  createLogger,
} from '@dailyuse/utils';
import { initializeDatabase, closeDatabase } from '../../database';
import { configureMainProcessDependencies, isDIConfigured } from '../../di';

const logger = createLogger('InfrastructureInit:Desktop');

/**
 * 数据库初始化任务
 */
const databaseInitTask: InitializationTask = {
  name: 'database',
  phase: InitializationPhase.APP_STARTUP,
  priority: 5, // 最高优先级，最先初始化
  initialize: async () => {
    logger.info('Initializing database...');
    try {
      await initializeDatabase();
      logger.info('✅ Database initialized successfully');
    } catch (error) {
      logger.error('❌ Database initialization failed', error);
      throw error;
    }
  },
  cleanup: async () => {
    logger.info('Cleaning up database...');
    try {
      await closeDatabase();
      logger.info('✅ Database cleanup complete');
    } catch (error) {
      logger.error('❌ Database cleanup failed', error);
    }
  },
};

/**
 * DI Container 初始化任务
 */
const diContainerInitTask: InitializationTask = {
  name: 'di-container',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10, // 在数据库之后
  dependencies: ['database'],
  initialize: async () => {
    logger.info('Initializing DI containers...');
    try {
      configureMainProcessDependencies();
      logger.info('✅ DI containers initialized successfully');
    } catch (error) {
      logger.error('❌ DI container initialization failed', error);
      throw error;
    }
  },
  cleanup: async () => {
    logger.info('Cleaning up DI containers...');
    try {
      // DI cleanup is handled by module shutdown
      logger.info('✅ DI containers cleanup complete');
    } catch (error) {
      logger.error('❌ DI containers cleanup failed', error);
    }
  },
};

/**
 * IPC 系统初始化任务
 */
const ipcInitTask: InitializationTask = {
  name: 'ipc-system',
  phase: InitializationPhase.APP_STARTUP,
  priority: 15,
  dependencies: ['di-container'],
  initialize: async () => {
    logger.info('Initializing IPC system...');
    try {
      // IPC 处理器将在各模块初始化时注册
      logger.info('✅ IPC system ready for module handlers');
    } catch (error) {
      logger.error('❌ IPC system initialization failed', error);
      throw error;
    }
  },
};

/**
 * 注册基础设施的所有初始化任务
 */
export function registerInfrastructureInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask(databaseInitTask);
  manager.registerTask(diContainerInitTask);
  manager.registerTask(ipcInitTask);

  logger.info('📦 Infrastructure initialization tasks registered (3 tasks)');
}
