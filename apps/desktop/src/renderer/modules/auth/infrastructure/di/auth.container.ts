/**
 * Auth DI Container - 认证模块依赖注入容器
 * 
 * @module renderer/modules/auth/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  AuthIPCClient,
  authIPCClient,
} from '../ipc/auth.ipc-client';

// ============ Service Tokens ============

export const AuthTokens = {
  AuthIPCClient: createServiceToken<AuthIPCClient>('auth:ipc-client'),
} as const;

// ============ Container ============

/**
 * Auth Container - 认证模块容器
 */
export class AuthContainer extends RendererContainer {
  readonly moduleName = ModuleName.Auth;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(AuthTokens.AuthIPCClient, authIPCClient);
  }

  // ============ Service Accessors ============

  get authIPCClient(): AuthIPCClient {
    return this.get(AuthTokens.AuthIPCClient);
  }
}
