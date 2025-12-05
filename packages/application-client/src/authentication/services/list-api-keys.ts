/**
 * List API Keys Use Case
 *
 * 获取 API Key 列表用例
 */

import type { ApiKeyListResponseDTO } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '@dailyuse/infrastructure-client';

/**
 * List API Keys Use Case
 */
export class ListApiKeys {
  private static instance: ListApiKeys;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): ListApiKeys {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    ListApiKeys.instance = new ListApiKeys(client);
    return ListApiKeys.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListApiKeys {
    if (!ListApiKeys.instance) {
      ListApiKeys.instance = ListApiKeys.createInstance();
    }
    return ListApiKeys.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListApiKeys.instance = undefined as unknown as ListApiKeys;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<ApiKeyListResponseDTO> {
    return this.apiClient.getApiKeys();
  }
}

/**
 * 便捷函数
 */
export const listApiKeys = (): Promise<ApiKeyListResponseDTO> =>
  ListApiKeys.getInstance().execute();
