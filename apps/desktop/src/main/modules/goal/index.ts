/**
 * Goal Module Registration
 *
 * Registers Goal module with InitializationManager
 * Implements: STORY-002 Goal Module
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';
import { registerGoalIpcHandlers } from './ipc/goal.ipc-handlers';
import { registerGoalFolderIpcHandlers } from './ipc/goal-folder.ipc-handlers';
import { registerGoalStatisticsIpcHandlers } from './ipc/goal-statistics.ipc-handlers';

const logger = createLogger('GoalModule');

export function registerGoalModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'goal',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50, // After infrastructure (priority 10)
    initialize: async () => {
      logger.info('[Goal] Initializing Goal module...');

      // Register all IPC handlers
      registerGoalIpcHandlers();
      registerGoalFolderIpcHandlers();
      registerGoalStatisticsIpcHandlers();

      logger.info('[Goal] Goal module initialized successfully');
    },
  });

  logger.info('[Goal] Goal module registered');
}
