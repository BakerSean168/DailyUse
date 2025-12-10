/**
 * Infrastructure Module - Desktop Main Process
 * 
 * Handles the initialization of Dependency Injection containers and database connections.
 * This module serves as the bootstrap for the backend infrastructure within the desktop app.
 *
 * @module modules/infrastructure
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
 * Initializes all Dependency Injection Containers.
 *
 * Sets up the database connection path and prepares the containers for use.
 * NOTE: This is currently a placeholder and will be fully implemented when the Prisma integration is complete.
 * 
 * @returns {Promise<void>} Resolves when initialization is complete.
 */
export async function initializeContainers(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'dailyuse.db');

  logger.info('Initializing containers', { dbPath });

  try {
    // TODO: Initialize Prisma client
    // const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });
    
    // TODO: Create and register all repositories
    // GoalContainer.getInstance()
    //   .registerGoalRepository(new GoalPrismaRepository(prisma))
    //   .registerKeyResultRepository(new KeyResultPrismaRepository(prisma));
    
    // TaskContainer.getInstance()
    //   .registerTemplateRepository(new TaskTemplatePrismaRepository(prisma))
    //   .registerInstanceRepository(new TaskInstancePrismaRepository(prisma));
    
    // etc...

    logger.info('Container initialization placeholder - TODO: implement with Prisma');
  } catch (error) {
    logger.error('Failed to initialize containers', error);
    throw error;
  }
}

/**
 * Closes all container resources, specifically database connections.
 *
 * Should be called during application shutdown to ensure a graceful exit.
 *
 * @returns {Promise<void>} Resolves when all containers are closed.
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
