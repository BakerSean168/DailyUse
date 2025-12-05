/**
 * List API Keys Service
 *
 * 获取 API Key 列表应用服务
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import type { ApiKeyCredentialClientDTO } from '@dailyuse/contracts/authentication';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * List API Keys Input
 */
export interface ListApiKeysInput {
  accountUuid: string;
}

/**
 * List API Keys Output
 */
export interface ListApiKeysOutput {
  apiKeys: Array<{
    keyId: string;
    name: string;
    lastUsedAt?: number;
    createdAt: number;
    expiresAt?: number;
    scopes: string[];
  }>;
}

/**
 * List API Keys Service
 */
export class ListApiKeys {
  private static instance: ListApiKeys;

  private constructor(private readonly credentialRepository: IAuthCredentialRepository) {}

  /**
   * 创建服务实例
   */
  static createInstance(credentialRepository?: IAuthCredentialRepository): ListApiKeys {
    const container = AuthContainer.getInstance();
    const repo = credentialRepository || container.getCredentialRepository();
    ListApiKeys.instance = new ListApiKeys(repo);
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
   * 执行获取 API Key 列表
   */
  async execute(input: ListApiKeysInput): Promise<ListApiKeysOutput> {
    // 1. 查找凭证
    const credential = await this.credentialRepository.findByAccountUuid(input.accountUuid);
    if (!credential) {
      return { apiKeys: [] };
    }

    // 2. 获取 API Keys（使用 apiKeyCredentials 属性）
    const apiKeys = credential.apiKeyCredentials;

    return {
      apiKeys: apiKeys.map(key => ({
        keyId: key.uuid,
        name: key.name,
        lastUsedAt: key.lastUsedAt ?? undefined,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt ?? undefined,
        scopes: [], // API Key 目前没有 scopes 属性
      })),
    };
  }
}

/**
 * 便捷函数
 */
export const listApiKeys = (input: ListApiKeysInput): Promise<ListApiKeysOutput> =>
  ListApiKeys.getInstance().execute(input);
