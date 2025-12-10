import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import type { InitializationTask } from '@dailyuse/utils';
import { initializeDatabase, getDatabase } from '../infrastructure';
import { configureMainProcessDependencies } from '../infrastructure';

/**
 * Register infrastructure initialization tasks
 *
 * These tasks initialize the core infrastructure layer:
 * 1. Database - SQLite connection and schema setup
 * 2. DI Container - Service/repository dependency injection
 * 3. IPC System - Electron IPC handlers registration
 *
 * Each task has defined dependencies to ensure proper initialization order
 */
export function registerInfrastructureInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  /**
   * Task 1: Database Initialization
   *
   * Initializes SQLite connection with performance optimizations:
   * - WAL mode for better concurrency
   * - Page cache for reduced I/O
   * - Memory-mapped I/O for faster reads
   * - Proper journal mode
   *
   * Priority: 5 (very high, no dependencies)
   * Phase: APP_STARTUP (critical path)
   */
  manager.registerTask({
    name: 'database-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 5,
    dependencies: [],
    initialize: async () => {
      console.log('[Infrastructure] Initializing database...');
      const startTime = performance.now();

      try {
        const db = initializeDatabase();
        const duration = performance.now() - startTime;

        console.log(
          `[Infrastructure] Database initialized successfully in ${duration.toFixed(2)}ms`
        );
      } catch (error) {
        console.error('[Infrastructure] Database initialization failed:', error);
        throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    cleanup: async () => {
      console.log('[Infrastructure] Cleaning up database connection...');
      try {
        // Note: closeDatabase is called elsewhere in app lifecycle
        // This is just a placeholder for any cleanup if needed
      } catch (error) {
        console.error('[Infrastructure] Database cleanup failed:', error);
      }
    },
  });

  /**
   * Task 2: DI Container Configuration
   *
   * Sets up the dependency injection container with:
   * - Repository instances
   * - Service instances
   * - Factory functions
   *
   * Depends on: database-initialization (needs DB connection for repositories)
   * Priority: 10 (high, after database)
   * Phase: APP_STARTUP
   */
  manager.registerTask({
    name: 'di-container-configuration',
    phase: InitializationPhase.APP_STARTUP,
    priority: 10,
    dependencies: ['database-initialization'],
    initialize: async () => {
      console.log('[Infrastructure] Configuring DI container...');
      const startTime = performance.now();

      try {
        configureMainProcessDependencies();
        const duration = performance.now() - startTime;

        console.log(
          `[Infrastructure] DI container configured successfully in ${duration.toFixed(2)}ms`
        );
      } catch (error) {
        console.error('[Infrastructure] DI container configuration failed:', error);
        throw new Error(`DI configuration failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    cleanup: async () => {
      console.log('[Infrastructure] Cleaning up DI container...');
      // DI cleanup can be handled by container itself if needed
    },
  });

  /**
   * Task 3: IPC System Initialization
   *
   * Registers all IPC handlers for:
   * - AI, Task, Goal, Schedule modules
   * - Notification, Repository, Dashboard modules
   * - Account, Authentication, Settings modules
   *
   * Depends on: di-container-configuration (needs services available)
   * Priority: 15 (medium-high, after DI)
   * Phase: APP_STARTUP
   */
  manager.registerTask({
    name: 'ipc-system-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 15,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Infrastructure] Initializing IPC system...');
      const startTime = performance.now();

      try {
        // Import and initialize all module IPC handlers
        const { initializeIPCHandlers } = await import('../../main/modules/ipc-registry');
        initializeIPCHandlers();

        const duration = performance.now() - startTime;

        console.log(
          `[Infrastructure] IPC system initialized successfully in ${duration.toFixed(2)}ms`
        );
      } catch (error) {
        console.error('[Infrastructure] IPC system initialization failed:', error);
        throw new Error(`IPC initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    cleanup: async () => {
      console.log('[Infrastructure] Cleaning up IPC system...');
      // IPC handlers cleanup (close channels, remove listeners)
    },
  });
}
