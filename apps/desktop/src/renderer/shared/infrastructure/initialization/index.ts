/**
 * Initialization Infrastructure - 统一导出
 * 
 * @module renderer/shared/infrastructure/initialization
 */

// Types and interfaces
export type {
  IModuleInitializer,
  InitializationConfig,
  ModuleState,
  InitializationProgressEvent,
  InitializationCompleteEvent,
} from './module-initializer';

export {
  InitializationStatus,
  InitializationPriority,
  BaseModuleInitializer,
  SimpleModuleInitializer,
  createModuleInitializer,
} from './module-initializer';

// State management
export {
  initializationState,
  getInitializationSnapshot,
  subscribeToInitialization,
} from './initialization-state';

// Manager
export {
  initializationManager,
  registerInitializer,
  registerInitializerConfig,
} from './initialization-manager';

// Hooks
export {
  useInitialization,
  useModuleInitialization,
  useInitializationProgress,
  useInitializationComplete,
  useWhenReady,
  useWhenModuleReady,
  useInitializationProgress_Percentage,
  useFailedModules,
} from './initialization-hooks';
