/**
 * Revoke Session Use Case
 *
 * 撤销指定会话用例
 */

import type { RevokeSessionRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '@dailyuse/infrastructure-client';

export interface RevokeSessionInput extends RevokeSessionRequest {}

/**
 * Revoke Session Use Case
 */
export class RevokeSession {
  private static instance: RevokeSession;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): RevokeSession {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    RevokeSession.instance = new RevokeSession(client);
    return RevokeSession.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeSession {
    if (!RevokeSession.instance) {
      RevokeSession.instance = RevokeSession.createInstance();
    }
    return RevokeSession.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeSession.instance = undefined as unknown as RevokeSession;
  }

  /**
   * 执行用例
   */
  async execute(input: RevokeSessionInput): Promise<void> {
    return this.apiClient.revokeSession(input);
  }
}

/**
 * 便捷函数
 */
export const revokeSession = (input: RevokeSessionInput): Promise<void> =>
  RevokeSession.getInstance().execute(input);
