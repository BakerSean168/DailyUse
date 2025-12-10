/**
 * Dashboard Module Initialization
 *
 * Registers Dashboard module initialization tasks:
 * - IPC handler setup
 * - Dashboard service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerDashboardInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'dashboard-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Dashboard Module] Initializing Dashboard module...');
      try {
        // Dashboard IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Dashboard Module] Dashboard module initialized');
      } catch (error) {
        console.error('[Dashboard Module] Dashboard module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Dashboard Module] Cleaning up Dashboard module...');
    },
  });
}
