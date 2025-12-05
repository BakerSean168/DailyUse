/**
 * Revoke All Sessions Service
 *
 * 撤销所有会话应用服务
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { RevokeAllSessionsRequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Revoke All Sessions Input
 */
export interface RevokeAllSessionsInput extends RevokeAllSessionsRequest {
  accountUuid: string;
  currentSessionUuid?: string; // 可选保留当前会话
}

/**
 * Revoke All Sessions Service
 */
export class RevokeAllSessions {
  private static instance: RevokeAllSessions;

  private constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 创建服务实例
   */
  static createInstance(sessionRepository?: IAuthSessionRepository): RevokeAllSessions {
    const container = AuthContainer.getInstance();
    const repo = sessionRepository || container.getSessionRepository();
    RevokeAllSessions.instance = new RevokeAllSessions(repo);
    return RevokeAllSessions.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeAllSessions {
    if (!RevokeAllSessions.instance) {
      RevokeAllSessions.instance = RevokeAllSessions.createInstance();
    }
    return RevokeAllSessions.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeAllSessions.instance = undefined as unknown as RevokeAllSessions;
  }

  /**
   * 执行撤销所有会话
   */
  async execute(input: RevokeAllSessionsInput): Promise<number> {
    // 1. 查找所有会话
    const sessions = await this.sessionRepository.findByAccountUuid(input.accountUuid);

    // 2. 撤销除当前会话外的所有会话
    let revokedCount = 0;
    for (const session of sessions) {
      if (input.currentSessionUuid && session.uuid === input.currentSessionUuid) {
        continue; // 跳过当前会话
      }
      if (session.status === 'ACTIVE') {
        session.revoke();
        await this.sessionRepository.save(session);
        revokedCount++;
      }
    }

    // 3. 发布事件
    await eventBus.emit('AllSessionsRevoked', {
      accountUuid: input.accountUuid,
      revokedCount,
      excludedSessionUuid: input.currentSessionUuid,
    });

    return revokedCount;
  }
}

/**
 * 便捷函数
 */
export const revokeAllSessions = (input: RevokeAllSessionsInput): Promise<number> =>
  RevokeAllSessions.getInstance().execute(input);
