/**
 * Account Deletion Application Service
 * 账户注销应用服务 - 负责账户删除流程编排
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 用户账户注销
 * - 密码二次验证
 * - 数据清理协调
 * - 事务管理
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 */

import type {
  IAccountRepository,
  Account,
} from '@dailyuse/domain-server/account';
import type {
  IAuthCredentialRepository,
  IAuthSessionRepository,
  AuthCredential,
  AuthSession,
} from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { AccountContainer } from '../../infrastructure/di/AccountContainer';
import { AuthenticationContainer } from '../../../authentication/infrastructure/di/AuthenticationContainer';
import { eventBus, createLogger } from '@dailyuse/utils';
import { prisma } from '@/config/prisma';
import bcrypt from 'bcryptjs';

const logger = createLogger('AccountDeletionApplicationService');

/**
 * 账户注销请求接口
 */
export interface DeleteAccountRequest {
  accountUuid: string;
  password: string; // 二次验证密码
  reason?: string; // 注销原因
  feedback?: string; // 用户反馈
  confirmationText?: string; // 确认文本（如"DELETE"）
}

/**
 * 账户注销响应接口
 */
export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletedAt: number;
  accountUuid: string;
}

/**
 * Account Deletion Application Service
 * 负责账户注销流程的核心业务逻辑编排
 */
export class AccountDeletionApplicationService {
  private static instance: AccountDeletionApplicationService;

  private accountRepository: IAccountRepository;
  private credentialRepository: IAuthCredentialRepository;
  private sessionRepository: IAuthSessionRepository;
  private authenticationDomainService: AuthenticationDomainService;

  private constructor(
    accountRepository: IAccountRepository,
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
  ) {
    this.accountRepository = accountRepository;
    this.credentialRepository = credentialRepository;
    this.sessionRepository = sessionRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    accountRepository?: IAccountRepository,
    credentialRepository?: IAuthCredentialRepository,
    sessionRepository?: IAuthSessionRepository,
  ): Promise<AccountDeletionApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthenticationContainer.getInstance();

    const accRepo = accountRepository || accountContainer.getAccountRepository();
    const credRepo = credentialRepository || authContainer.getAuthCredentialRepository();
    const sessRepo = sessionRepository || authContainer.getAuthSessionRepository();

    AccountDeletionApplicationService.instance = new AccountDeletionApplicationService(
      accRepo,
      credRepo,
      sessRepo,
    );
    return AccountDeletionApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<AccountDeletionApplicationService> {
    if (!AccountDeletionApplicationService.instance) {
      AccountDeletionApplicationService.instance =
        await AccountDeletionApplicationService.createInstance();
    }
    return AccountDeletionApplicationService.instance;
  }

  /**
   * 账户注销主流程（使用 Saga 模式保证一致性）
   *
   * 步骤：
   * 1. 验证输入（确认文本、密码）
   * 2. 查询账户
   * 3. 检查账户状态（不能已删除）
   * 4. 查询凭证并验证密码（二次验证）
   * 5. 开启事务：
   *    a. 软删除账户
   *    b. 注销凭证
   *    c. 注销所有会话
   * 6. 发布账户删除事件
   * 7. 返回删除结果
   */
  async deleteAccount(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    logger.info('[AccountDeletionApplicationService] Starting account deletion', {
      accountUuid: request.accountUuid,
      reason: request.reason,
    });

    try {
      // ===== 步骤 1: 验证输入 =====
      this.validateInput(request);

      // ===== 步骤 2: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error('Account not found');
      }

      // ===== 步骤 3: 检查账户状态 =====
      if (account.status === 'DELETED') {
        throw new Error('Account already deleted');
      }

      // ===== 步骤 4: 查询凭证并验证密码 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      const hashedPassword = await bcrypt.hash(request.password, 12);
      const isPasswordValid = this.authenticationDomainService.verifyPassword(
        credential,
        hashedPassword,
      );

      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // ===== 步骤 5: 事务操作（Saga 模式） =====
      const result = await prisma.$transaction(async (tx: any) => {
        // 5a. 软删除账户
        account.softDelete();
        await this.accountRepository.save(account, tx);

        logger.info('[AccountDeletionApplicationService] Account marked as deleted', {
          accountUuid: account.uuid,
        });

        // 5b. 注销凭证
        credential.revoke();
        await this.credentialRepository.save(credential, tx);

        logger.info('[AccountDeletionApplicationService] Credential revoked', {
          accountUuid: account.uuid,
        });

        // 5c. 注销所有会话
        const sessions = await this.sessionRepository.findActiveSessionsByAccountUuid(
          request.accountUuid,
          tx,
        );

        for (const session of sessions) {
          session.revoke();
          await this.sessionRepository.save(session, tx);
        }

        logger.info('[AccountDeletionApplicationService] All sessions revoked', {
          accountUuid: account.uuid,
          sessionsCount: sessions.length,
        });

        return { account, credential, sessions };
      });

      // ===== 步骤 6: 发布账户删除事件（事务外） =====
      await this.publishAccountDeletedEvent(result.account, request.reason);

      logger.info('[AccountDeletionApplicationService] Account deletion successful', {
        accountUuid: request.accountUuid,
      });

      return {
        success: true,
        message: 'Account deleted successfully',
        deletedAt: result.account.deletedAt!,
        accountUuid: result.account.uuid,
      };
    } catch (error) {
      logger.error('[AccountDeletionApplicationService] Account deletion failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 验证输入
   */
  private validateInput(request: DeleteAccountRequest): void {
    if (!request.accountUuid) {
      throw new Error('Account UUID is required');
    }

    if (!request.password) {
      throw new Error('Password is required for verification');
    }

    // 验证确认文本（如果提供）
    if (request.confirmationText && request.confirmationText !== 'DELETE') {
      throw new Error('Confirmation text must be "DELETE"');
    }
  }

  /**
   * 发布账户删除事件
   */
  private async publishAccountDeletedEvent(account: Account, reason?: string): Promise<void> {
    eventBus.publish({
      eventType: 'account:deleted',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        email: account.email,
        deletedAt: account.deletedAt,
        reason,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountDeletionApplicationService] Account deleted event published', {
      accountUuid: account.uuid,
    });
  }
}
