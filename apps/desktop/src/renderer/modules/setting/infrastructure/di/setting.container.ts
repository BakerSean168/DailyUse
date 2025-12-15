/**
 * Setting DI Container - 设置模块依赖注入容器
 * 
 * @module renderer/modules/setting/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  SettingIPCClient,
  settingIPCClient,
} from '../ipc/setting.ipc-client';

// ============ Service Tokens ============

export const SettingTokens = {
  SettingIPCClient: createServiceToken<SettingIPCClient>('setting:ipc-client'),
} as const;

// ============ Container ============

/**
 * Setting Container - 设置模块容器
 */
export class SettingContainer extends RendererContainer {
  readonly moduleName = ModuleName.Setting;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(SettingTokens.SettingIPCClient, settingIPCClient);
  }

  // ============ Service Accessors ============

  get settingIPCClient(): SettingIPCClient {
    return this.get(SettingTokens.SettingIPCClient);
  }
}
