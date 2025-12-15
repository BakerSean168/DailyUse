/**
 * Notification DI Container - 通知模块依赖注入容器
 * 
 * @module renderer/modules/notification/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  NotificationIPCClient,
  notificationIPCClient,
} from '../ipc/notification.ipc-client';

// ============ Service Tokens ============

export const NotificationTokens = {
  NotificationIPCClient: createServiceToken<NotificationIPCClient>('notification:ipc-client'),
} as const;

// ============ Container ============

/**
 * Notification Container - 通知模块容器
 */
export class NotificationContainer extends RendererContainer {
  readonly moduleName = ModuleName.Notification;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(NotificationTokens.NotificationIPCClient, notificationIPCClient);
  }

  // ============ Service Accessors ============

  get notificationIPCClient(): NotificationIPCClient {
    return this.get(NotificationTokens.NotificationIPCClient);
  }
}
