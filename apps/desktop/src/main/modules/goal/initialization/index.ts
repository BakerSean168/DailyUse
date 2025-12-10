/**
 * Goal Module Initialization
 *
 * Registers Goal module initialization tasks:
 * - IPC handler setup
 * - Goal service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'goal-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Goal Module] Initializing Goal module...');
      try {
        // Goal IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Goal Module] Goal module initialized');
      } catch (error) {
        console.error('[Goal Module] Goal module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Goal Module] Cleaning up Goal module...');
    },
  });
}
