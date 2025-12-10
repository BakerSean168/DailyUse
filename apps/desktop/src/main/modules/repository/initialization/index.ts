/**
 * Repository Module Initialization
 *
 * Registers Repository module initialization tasks:
 * - IPC handler setup
 * - Repository service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerRepositoryInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'repository-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Repository Module] Initializing Repository module...');
      try {
        // Repository IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Repository Module] Repository module initialized');
      } catch (error) {
        console.error('[Repository Module] Repository module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Repository Module] Cleaning up Repository module...');
    },
  });
}
