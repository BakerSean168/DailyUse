/**
 * Setting Module Initialization
 *
 * Registers Setting module initialization tasks:
 * - IPC handler setup
 * - Setting service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerSettingInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'setting-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Setting Module] Initializing Setting module...');
      try {
        // Setting IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Setting Module] Setting module initialized');
      } catch (error) {
        console.error('[Setting Module] Setting module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Setting Module] Cleaning up Setting module...');
    },
  });
}
