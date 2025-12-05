/**
 * Create API Key Use Case
 *
 * 创建 API Key 用例
 */

import type { CreateApiKeyRequest, CreateApiKeyResponseDTO } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '@dailyuse/infrastructure-client';

export interface CreateApiKeyInput extends CreateApiKeyRequest {}

/**
 * Create API Key Use Case
 */
export class CreateApiKey {
  private static instance: CreateApiKey;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): CreateApiKey {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    CreateApiKey.instance = new CreateApiKey(client);
    return CreateApiKey.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateApiKey {
    if (!CreateApiKey.instance) {
      CreateApiKey.instance = CreateApiKey.createInstance();
    }
    return CreateApiKey.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateApiKey.instance = undefined as unknown as CreateApiKey;
  }

  /**
   * 执行用例
   */
  async execute(input: CreateApiKeyInput): Promise<CreateApiKeyResponseDTO> {
    return this.apiClient.createApiKey(input);
  }
}

/**
 * 便捷函数
 */
export const createApiKey = (input: CreateApiKeyInput): Promise<CreateApiKeyResponseDTO> =>
  CreateApiKey.getInstance().execute(input);
