/**
 * Schedule Module Initialization
 *
 * Registers Schedule module initialization tasks:
 * - IPC handler setup
 * - Schedule service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'schedule-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Schedule Module] Initializing Schedule module...');
      try {
        // Schedule IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Schedule Module] Schedule module initialized');
      } catch (error) {
        console.error('[Schedule Module] Schedule module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Schedule Module] Cleaning up Schedule module...');
    },
  });
}
