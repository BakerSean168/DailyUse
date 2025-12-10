/**
 * Authentication Module Initialization
 *
 * Registers Authentication module initialization tasks:
 * - IPC handler setup
 * - Authentication service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'authentication-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Authentication Module] Initializing Authentication module...');
      try {
        // Authentication IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Authentication Module] Authentication module initialized');
      } catch (error) {
        console.error('[Authentication Module] Authentication module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Authentication Module] Cleaning up Authentication module...');
    },
  });
}
