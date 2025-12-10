/**
 * Shared Database Infrastructure Adapter
 *
 * Re-exports database initialization from main process
 * Centralizes all database infrastructure for the shared layer
 */

export {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  isDatabaseInitialized,
  getDatabaseStats,
  enableDetailedLogging,
} from '../../main/database';

export type { DatabaseStatistics, DatabaseHealthMetrics } from '../../main/database';
