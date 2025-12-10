/**
 * Account Module Initialization
 *
 * Registers Account module initialization tasks:
 * - IPC handler setup
 * - Account service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'account-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Account Module] Initializing Account module...');
      try {
        // Account IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Account Module] Account module initialized');
      } catch (error) {
        console.error('[Account Module] Account module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Account Module] Cleaning up Account module...');
    },
  });
}
