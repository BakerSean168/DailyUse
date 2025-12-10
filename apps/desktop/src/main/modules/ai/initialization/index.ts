/**
 * AI Module Initialization
 *
 * Registers AI module initialization tasks:
 * - IPC handler setup
 * - AI service initialization
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerAIInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'ai-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[AI Module] Initializing AI module...');
      try {
        // AI IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[AI Module] AI module initialized');
      } catch (error) {
        console.error('[AI Module] AI module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[AI Module] Cleaning up AI module...');
    },
  });
}
