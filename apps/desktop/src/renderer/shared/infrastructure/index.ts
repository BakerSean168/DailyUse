/**
 * Infrastructure Layer - 统一导出
 * 
 * @module renderer/shared/infrastructure
 */

// IPC Client
export * from './ipc';

// Dependency Injection
export * from './di';

// Initialization
export * from './initialization';

// Module Registry - export actual functions
export {
  registerAllModules,
  initializeAllModules,
  disposeAllModules,
  getModuleContainer,
  isModuleInitialized,
  waitForModule,
  ModuleName,
  InitializationPriority,
} from './module-registry';
