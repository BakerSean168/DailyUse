/**
 * Goal Container - Goal 模块 DI 容器
 * 
 * @module renderer/modules/goal/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  GoalIPCClient,
  goalIPCClient,
  GoalFocusIPCClient,
  goalFocusIPCClient,
} from '../ipc';

// ============ Service Tokens ============

export const GoalTokens = {
  GoalClient: createServiceToken<GoalIPCClient>('goal:client'),
  FocusClient: createServiceToken<GoalFocusIPCClient>('goal:focus-client'),
} as const;

// ============ Goal Container ============

/**
 * Goal 模块容器
 */
export class GoalContainer extends RendererContainer {
  readonly moduleName = ModuleName.Goal;

  protected registerServices(): void {
    // 注册 IPC Clients
    this.registerInstance(GoalTokens.GoalClient, goalIPCClient);
    this.registerInstance(GoalTokens.FocusClient, goalFocusIPCClient);
  }

  // ============ Convenience Getters ============

  /**
   * 获取 Goal Client
   */
  get goalClient(): GoalIPCClient {
    return this.get(GoalTokens.GoalClient);
  }

  /**
   * 获取 Focus Client
   */
  get focusClient(): GoalFocusIPCClient {
    return this.get(GoalTokens.FocusClient);
  }
}

// ============ Singleton Export ============

export const goalContainer = new GoalContainer();
