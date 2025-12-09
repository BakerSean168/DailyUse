/**
 * Task Module Registration
 *
 * Registers Task module with InitializationManager
 * Implements: STORY-003 Task Module
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';
import { registerTaskTemplateIpcHandlers } from './ipc/task-template.ipc-handlers';
import { registerTaskInstanceIpcHandlers } from './ipc/task-instance.ipc-handlers';
import { registerTaskDependencyIpcHandlers } from './ipc/task-dependency.ipc-handlers';
import { registerTaskStatisticsIpcHandlers } from './ipc/task-statistics.ipc-handlers';

const logger = createLogger('TaskModule');

export function registerTaskModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'task',
    phase: InitializationPhase.APP_STARTUP,
    priority: 60, // After goal module (priority 50)
    initialize: async () => {
      logger.info('[Task] Initializing Task module...');

      // Register all IPC handlers
      registerTaskTemplateIpcHandlers();
      registerTaskInstanceIpcHandlers();
      registerTaskDependencyIpcHandlers();
      registerTaskStatisticsIpcHandlers();

      logger.info('[Task] Task module initialized successfully');
    },
  });

  logger.info('[Task] Task module registered');
}
