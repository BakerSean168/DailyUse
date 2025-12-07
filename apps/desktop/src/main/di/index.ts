/**
 * Desktop Main Process - DI Module
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
