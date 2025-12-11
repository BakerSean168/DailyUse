/**
 * Dependency Injection (DI) Module
 *
 * Exports the main composition root for configuring dependencies and lazy module loading utilities.
 * Also re-exports all SQLite adapter implementations.
 *
 * @module di
 */

export {
  configureMainProcessDependencies,
  resetAllContainers,
  isDIConfigured,
} from './desktop-main.composition-root';

export {
  ensureModuleLoaded,
  isModuleLoaded,
  getLoadedModules,
  getLazyModuleStats,
  getModuleLoadTimes,
} from './lazy-module-loader';

export * from './sqlite-adapters';
