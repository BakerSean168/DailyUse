/**
 * Infrastructure Module - Desktop Main Process
 * 
 * 负责初始化所有 DI Container 和数据库连接
 * TODO: Implement in STORY-001
 */

import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
  AIContainer,
} from '@dailyuse/infrastructure-server';
import { createLogger } from '@dailyuse/utils';
import { app } from 'electron';
import * as path from 'path';

const logger = createLogger('Infrastructure');

/**
 * 初始化所有 Container
 */
export async function initializeContainers(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'dailyuse.db');

  logger.info('Initializing containers', { dbPath });

  try {
    // 初始化各模块的 Container
    // Container 内部会设置 SQLite adapter
    
    GoalContainer.initialize?.({ dbPath });
    logger.debug('GoalContainer initialized');

    TaskContainer.initialize?.({ dbPath });
    logger.debug('TaskContainer initialized');

    ScheduleContainer.initialize?.({ dbPath });
    logger.debug('ScheduleContainer initialized');

    ReminderContainer.initialize?.({ dbPath });
    logger.debug('ReminderContainer initialized');

    AIContainer.initialize?.({ dbPath });
    logger.debug('AIContainer initialized');

    logger.info('All containers initialized');
  } catch (error) {
    logger.error('Failed to initialize containers', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
export async function closeContainers(): Promise<void> {
  logger.info('Closing containers...');

  try {
    await (GoalContainer as any).close?.();
    await (TaskContainer as any).close?.();
    await (ScheduleContainer as any).close?.();
    await (ReminderContainer as any).close?.();
    await (AIContainer as any).close?.();
    
    logger.info('All containers closed');
  } catch (error) {
    logger.error('Error closing containers', error);
  }
}
