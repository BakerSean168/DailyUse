/**
 * AI DI Container - AI 模块依赖注入容器
 * 
 * @module renderer/modules/ai/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  AIIPCClient,
  aiIPCClient,
} from '../ipc/ai.ipc-client';

// ============ Service Tokens ============

export const AITokens = {
  AIIPCClient: createServiceToken<AIIPCClient>('ai:ipc-client'),
} as const;

// ============ Container ============

/**
 * AI Container - AI 模块容器
 */
export class AIContainer extends RendererContainer {
  readonly moduleName = ModuleName.AI;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(AITokens.AIIPCClient, aiIPCClient);
  }

  // ============ Service Accessors ============

  get aiClient(): AIIPCClient {
    return this.get(AITokens.AIIPCClient);
  }

  get aiIPCClient(): AIIPCClient {
    return this.get(AITokens.AIIPCClient);
  }
}

// ============ Singleton Export ============
export const aiContainer = new AIContainer();
