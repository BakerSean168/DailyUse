/**
 * Repository DI Container - 仓库模块依赖注入容器
 * 
 * @module renderer/modules/repository/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  RepositoryIPCClient,
  repositoryIPCClient,
} from '../ipc/repository.ipc-client';

// ============ Service Tokens ============

export const RepositoryTokens = {
  RepositoryIPCClient: createServiceToken<RepositoryIPCClient>('repository:ipc-client'),
} as const;

// ============ Container ============

/**
 * Repository Container - 仓库模块容器
 */
export class RepositoryContainer extends RendererContainer {
  readonly moduleName = ModuleName.Repository;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(RepositoryTokens.RepositoryIPCClient, repositoryIPCClient);
  }

  // ============ Service Accessors ============

  get repositoryClient(): RepositoryIPCClient {
    return this.get(RepositoryTokens.RepositoryIPCClient);
  }

  get repositoryIPCClient(): RepositoryIPCClient {
    return this.get(RepositoryTokens.RepositoryIPCClient);
  }
}

// ============ Singleton Export ============
export const repositoryContainer = new RepositoryContainer();
