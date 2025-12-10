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
 * 
 * TODO: 完整实现需要配置 Prisma client 并注册所有 repository
 * 目前是 placeholder，等待数据库层完善
 */
export async function initializeContainers(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'dailyuse.db');

  logger.info('Initializing containers', { dbPath });

  try {
    // TODO: 初始化 Prisma client
    // const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });
    
    // TODO: 创建并注册所有 repository
    // GoalContainer.getInstance()
    //   .registerGoalRepository(new GoalPrismaRepository(prisma))
    //   .registerKeyResultRepository(new KeyResultPrismaRepository(prisma));
    
    // TaskContainer.getInstance()
    //   .registerTemplateRepository(new TaskTemplatePrismaRepository(prisma))
    //   .registerInstanceRepository(new TaskInstancePrismaRepository(prisma));
    
    // 等等...

    logger.info('Container initialization placeholder - TODO: implement with Prisma');
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
