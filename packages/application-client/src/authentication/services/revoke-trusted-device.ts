/**
 * Revoke Trusted Device Use Case
 *
 * 取消设备信任用例
 */

import type { RevokeTrustedDeviceRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '../AuthenticationContainer';

export interface RevokeTrustedDeviceInput extends RevokeTrustedDeviceRequest {}

/**
 * Revoke Trusted Device Use Case
 */
export class RevokeTrustedDevice {
  private static instance: RevokeTrustedDevice;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): RevokeTrustedDevice {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    RevokeTrustedDevice.instance = new RevokeTrustedDevice(client);
    return RevokeTrustedDevice.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeTrustedDevice {
    if (!RevokeTrustedDevice.instance) {
      RevokeTrustedDevice.instance = RevokeTrustedDevice.createInstance();
    }
    return RevokeTrustedDevice.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeTrustedDevice.instance = undefined as unknown as RevokeTrustedDevice;
  }

  /**
   * 执行用例
   */
  async execute(input: RevokeTrustedDeviceInput): Promise<void> {
    return this.apiClient.revokeTrustedDevice(input);
  }
}

/**
 * 便捷函数
 */
export const revokeTrustedDevice = (input: RevokeTrustedDeviceInput): Promise<void> =>
  RevokeTrustedDevice.getInstance().execute(input);
