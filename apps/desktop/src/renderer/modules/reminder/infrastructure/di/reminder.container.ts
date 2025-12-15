/**
 * Reminder DI Container - 提醒模块依赖注入容器
 * 
 * @module renderer/modules/reminder/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  ReminderIPCClient,
  reminderIPCClient,
} from '../ipc/reminder.ipc-client';

// ============ Service Tokens ============

export const ReminderTokens = {
  ReminderIPCClient: createServiceToken<ReminderIPCClient>('reminder:ipc-client'),
} as const;

// ============ Container ============

/**
 * Reminder Container - 提醒模块容器
 */
export class ReminderContainer extends RendererContainer {
  readonly moduleName = ModuleName.Reminder;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(ReminderTokens.ReminderIPCClient, reminderIPCClient);
  }

  // ============ Service Accessors ============

  get reminderIPCClient(): ReminderIPCClient {
    return this.get(ReminderTokens.ReminderIPCClient);
  }
}
