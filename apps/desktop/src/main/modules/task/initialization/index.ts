/**
 * Task Module Initialization
 *
 * Registers Task module initialization tasks:
 * - IPC handler setup
 * - Task service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'task-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Task Module] Initializing Task module...');
      try {
        // Task IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Task Module] Task module initialized');
      } catch (error) {
        console.error('[Task Module] Task module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Task Module] Cleaning up Task module...');
    },
  });
}
