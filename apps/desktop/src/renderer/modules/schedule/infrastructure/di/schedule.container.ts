/**
 * Schedule DI Container - 日程模块依赖注入容器
 * 
 * @module renderer/modules/schedule/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  ScheduleIPCClient,
  scheduleIPCClient,
} from '../ipc/schedule.ipc-client';

// ============ Service Tokens ============

export const ScheduleTokens = {
  ScheduleIPCClient: createServiceToken<ScheduleIPCClient>('schedule:ipc-client'),
} as const;

// ============ Container ============

/**
 * Schedule Container - 日程模块容器
 */
export class ScheduleContainer extends RendererContainer {
  readonly moduleName = ModuleName.Schedule;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(ScheduleTokens.ScheduleIPCClient, scheduleIPCClient);
  }

  // ============ Service Accessors ============

  get scheduleIPCClient(): ScheduleIPCClient {
    return this.get(ScheduleTokens.ScheduleIPCClient);
  }
}
