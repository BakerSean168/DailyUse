/**
 * Get Active Sessions Service
 *
 * 获取活跃会话列表应用服务
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { AuthSessionClientDTO } from '@dailyuse/contracts/authentication';
import { AuthContainer } from '../AuthContainer';

/**
 * Get Active Sessions Input
 */
export interface GetActiveSessionsInput {
  accountUuid: string;
  skip?: number;
  take?: number;
}

/**
 * Get Active Sessions Output
 */
export interface GetActiveSessionsOutput {
  sessions: AuthSessionClientDTO[];
  total: number;
}

/**
 * Get Active Sessions Service
 */
export class GetActiveSessions {
  private static instance: GetActiveSessions;

  private constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 创建服务实例
   */
  static createInstance(sessionRepository?: IAuthSessionRepository): GetActiveSessions {
    const container = AuthContainer.getInstance();
    const repo = sessionRepository || container.getSessionRepository();
    GetActiveSessions.instance = new GetActiveSessions(repo);
    return GetActiveSessions.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetActiveSessions {
    if (!GetActiveSessions.instance) {
      GetActiveSessions.instance = GetActiveSessions.createInstance();
    }
    return GetActiveSessions.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetActiveSessions.instance = undefined as unknown as GetActiveSessions;
  }

  /**
   * 执行获取活跃会话
   */
  async execute(input: GetActiveSessionsInput): Promise<GetActiveSessionsOutput> {
    // 1. 查找会话
    const sessions = await this.sessionRepository.findByAccountUuid(
      input.accountUuid,
      { skip: input.skip, take: input.take },
    );

    // 2. 过滤活跃会话（status === 'ACTIVE' 且未过期）
    const activeSessions = sessions.filter(s => s.status === 'ACTIVE' && s.isValid());

    // 3. 转换为 DTO
    const sessionDTOs = activeSessions.map(s => s.toClientDTO());

    return {
      sessions: sessionDTOs,
      total: activeSessions.length,
    };
  }
}

/**
 * 便捷函数
 */
export const getActiveSessions = (input: GetActiveSessionsInput): Promise<GetActiveSessionsOutput> =>
  GetActiveSessions.getInstance().execute(input);
