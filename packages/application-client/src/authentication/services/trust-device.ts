/**
 * Trust Device Use Case
 *
 * 信任当前设备用例
 */

import type { TrustDeviceRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '@dailyuse/infrastructure-client';

export interface TrustDeviceInput extends TrustDeviceRequest {}

/**
 * Trust Device Use Case
 */
export class TrustDevice {
  private static instance: TrustDevice;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): TrustDevice {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    TrustDevice.instance = new TrustDevice(client);
    return TrustDevice.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): TrustDevice {
    if (!TrustDevice.instance) {
      TrustDevice.instance = TrustDevice.createInstance();
    }
    return TrustDevice.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    TrustDevice.instance = undefined as unknown as TrustDevice;
  }

  /**
   * 执行用例
   */
  async execute(input: TrustDeviceInput): Promise<void> {
    return this.apiClient.trustDevice(input);
  }
}

/**
 * 便捷函数
 */
export const trustDevice = (input: TrustDeviceInput): Promise<void> =>
  TrustDevice.getInstance().execute(input);
