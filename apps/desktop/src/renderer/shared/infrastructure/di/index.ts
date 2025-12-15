/**
 * DI Infrastructure - 统一导出
 * 
 * @module renderer/shared/infrastructure/di
 */

// Types
export type {
  ServiceIdentifier,
  ServiceFactory,
  ServiceProvider,
  ServiceRegistration,
  IContainer,
  IModuleContainer,
  IContainerRegistry,
  UseContainerResult,
  UseServiceResult,
} from './types';

export { ModuleName, ServiceTokens, createServiceToken } from './types';

// Container
export { RendererContainer, ContainerError } from './renderer-container';

// Registry
export { containerRegistry, getModuleContainer } from './container-registry';

// Hooks
export {
  useContainer,
  useService,
  useServices,
  useContainerReady,
  useServiceFactory,
  notifyRegistryChange,
} from './container-hooks';
