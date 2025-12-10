/**
 * Notification Module Initialization
 *
 * Registers Notification module initialization tasks:
 * - IPC handler setup
 * - Notification service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerNotificationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'notification-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Notification Module] Initializing Notification module...');
      try {
        // Notification IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Notification Module] Notification module initialized');
      } catch (error) {
        console.error('[Notification Module] Notification module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Notification Module] Cleaning up Notification module...');
    },
  });
}
