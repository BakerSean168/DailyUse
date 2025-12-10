/**
 * Shared DI Container Infrastructure Adapter
 *
 * Re-exports DI container initialization from main process
 * Centralizes all dependency injection infrastructure for the shared layer
 */

export {
  configureMainProcessDependencies,
  resetAllContainers,
  isDIConfigured,
} from '../../main/di';

export {
  ensureModuleLoaded,
  isModuleLoaded,
  getLoadedModules,
  getLazyModuleStats,
  getModuleLoadTimes,
} from '../../main/di';

export * from '../../main/di/sqlite-adapters';
