/**
 * Session Management Application Service
 * 会话管理应用服务 - 负责会话和设备管理相关的用例
 *
 * 🔄 包提取版本：
 * - 使用依赖注入的 IAuthApiClient
 * - 不依赖 Store（Store 操作由调用层负责）
 */

import type {
  GetActiveSessionsRequest,
  ActiveSessionsResponseDTO,
  RevokeSessionRequest,
  RevokeAllSessionsRequest,
  TrustedDevicesResponseDTO,
  TrustDeviceRequest,
  RevokeTrustedDeviceRequest,
} from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';

export class SessionApplicationService {
  constructor(private readonly authApiClient: IAuthApiClient) {}

  // ============ 会话管理 ============

  /**
   * 获取活跃会话列表
   */
  async getActiveSessions(request?: GetActiveSessionsRequest): Promise<ActiveSessionsResponseDTO> {
    return this.authApiClient.getActiveSessions(request);
  }

  /**
   * 撤销指定会话
   */
  async revokeSession(request: RevokeSessionRequest): Promise<void> {
    return this.authApiClient.revokeSession(request);
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(request?: RevokeAllSessionsRequest): Promise<void> {
    return this.authApiClient.revokeAllSessions(request);
  }

  // ============ 设备管理 ============

  /**
   * 获取受信任设备列表
   */
  async getTrustedDevices(): Promise<TrustedDevicesResponseDTO> {
    return this.authApiClient.getTrustedDevices();
  }

  /**
   * 信任当前设备
   */
  async trustDevice(request: TrustDeviceRequest): Promise<void> {
    return this.authApiClient.trustDevice(request);
  }

  /**
   * 取消设备信任
   */
  async revokeTrustedDevice(request: RevokeTrustedDeviceRequest): Promise<void> {
    return this.authApiClient.revokeTrustedDevice(request);
  }
}

/**
 * 工厂函数 - 创建会话应用服务实例
 */
export function createSessionApplicationService(
  authApiClient: IAuthApiClient,
): SessionApplicationService {
  return new SessionApplicationService(authApiClient);
}
