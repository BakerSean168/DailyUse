/**
 * Get Trusted Devices Use Case
 *
 * 获取受信任设备列表用例
 */

import type { TrustedDevicesResponseDTO } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Trusted Devices Use Case
 */
export class GetTrustedDevices {
  private static instance: GetTrustedDevices;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): GetTrustedDevices {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    GetTrustedDevices.instance = new GetTrustedDevices(client);
    return GetTrustedDevices.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTrustedDevices {
    if (!GetTrustedDevices.instance) {
      GetTrustedDevices.instance = GetTrustedDevices.createInstance();
    }
    return GetTrustedDevices.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTrustedDevices.instance = undefined as unknown as GetTrustedDevices;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<TrustedDevicesResponseDTO> {
    return this.apiClient.getTrustedDevices();
  }
}

/**
 * 便捷函数
 */
export const getTrustedDevices = (): Promise<TrustedDevicesResponseDTO> =>
  GetTrustedDevices.getInstance().execute();
