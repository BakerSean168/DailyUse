/**
 * Account Email Application Service
 * 账户邮箱管理应用服务
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 更新邮箱地址
 * - 验证邮箱
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 检查邮箱唯一性
 * - 发布领域事件
 *
 * 架构说明：
 * - DomainService：纯领域逻辑，业务规则验证（无副作用）
 * - ApplicationService：编排层，负责持久化、唯一性检查、事件发布
 * - Repository：数据访问层，接收事务上下文 tx（待更新）
 */

import type { AccountServerDTO, CreateAccountRequest } from '@dailyuse/contracts/account';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AccountContainer } from '../../infrastructure/di/AccountContainer';
import prisma from '../../../../shared/db/prisma';
import { eventBus, createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountEmailApplicationService');

/**
 * 更新邮箱请求接口
 */
export interface UpdateEmailRequest {
  accountUuid: string;
  newEmail: string;
}

/**
 * 验证邮箱请求接口
 */
export interface VerifyEmailRequest {
  accountUuid: string;
}

/**
 * 响应接口
 */
export interface AccountResponse {
  success: boolean;
  account: AccountClientDTO;
  message: string;
}

/**
 * Account Email Application Service
 * 负责账户邮箱管理的核心业务逻辑编排
 */
export class AccountEmailApplicationService {
  private static instance: AccountEmailApplicationService;

  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;

  private constructor(accountRepository: IAccountRepository) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    accountRepository?: IAccountRepository,
  ): Promise<AccountEmailApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const accountRepo = accountRepository || accountContainer.getAccountRepository();

    AccountEmailApplicationService.instance = new AccountEmailApplicationService(accountRepo);
    return AccountEmailApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<AccountEmailApplicationService> {
    if (!AccountEmailApplicationService.instance) {
      AccountEmailApplicationService.instance =
        await AccountEmailApplicationService.createInstance();
    }
    return AccountEmailApplicationService.instance;
  }

  /**
   * 更新邮箱地址主流程
   *
   * 步骤：
   * 1. 查询账户（ApplicationService 负责）
   * 2. 检查新邮箱唯一性（ApplicationService 负责）
   * 3. 调用 DomainService 验证业务规则
   * 4. 修改聚合根
   * 5. 持久化（ApplicationService 负责）
   * 6. 发布领域事件
   * 7. 返回 AccountClientDTO
   */
  async updateEmail(request: UpdateEmailRequest): Promise<AccountResponse> {
    logger.info('[AccountEmailApplicationService] Starting email update', {
      accountUuid: request.accountUuid,
      newEmail: request.newEmail,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      // ===== 步骤 2: 检查新邮箱唯一性 =====
      await this.checkEmailUniqueness(request.newEmail);

      // ===== 步骤 3: DomainService 验证业务规则 =====
      this.accountDomainService.validateEmailUpdate(account, request.newEmail);

      // ===== 步骤 4: 修改聚合根 =====
      account.updateEmail(request.newEmail);

      logger.debug('[AccountEmailApplicationService] Email updated in aggregate', {
        accountUuid: account.uuid,
        newEmail: request.newEmail,
      });

      // ===== 步骤 5: 持久化 =====
      await this.accountRepository.save(account);

      logger.info('[AccountEmailApplicationService] Email persisted successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 6: 发布领域事件 =====
      await this.publishEmailUpdatedEvent(account);

      // ===== 步骤 7: 返回 AccountClientDTO =====
      const accountClientDTO = account.toClientDTO();

      return {
        success: true,
        account: accountClientDTO,
        message: 'Email updated successfully',
      };
    } catch (error) {
      logger.error('[AccountEmailApplicationService] Email update failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 验证邮箱主流程
   *
   * 步骤：
   * 1. 查询账户
   * 2. 调用聚合根方法验证邮箱
   * 3. 持久化
   * 4. 发布领域事件
   * 5. 返回 AccountClientDTO
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<AccountResponse> {
    logger.info('[AccountEmailApplicationService] Starting email verification', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      // ===== 步骤 2: 调用聚合根方法验证邮箱 =====
      account.verifyEmail();

      logger.debug('[AccountEmailApplicationService] Email verified in aggregate', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 3: 持久化 =====
      await this.accountRepository.save(account);

      logger.info('[AccountEmailApplicationService] Email verification persisted successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 4: 发布领域事件 =====
      await this.publishEmailVerifiedEvent(account);

      // ===== 步骤 5: 返回 AccountClientDTO =====
      const accountClientDTO = account.toClientDTO();

      return {
        success: true,
        account: accountClientDTO,
        message: 'Email verified successfully',
      };
    } catch (error) {
      logger.error('[AccountEmailApplicationService] Email verification failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 检查邮箱唯一性（ApplicationService 职责）
   */
  private async checkEmailUniqueness(email: string): Promise<void> {
    const existingAccount = await this.accountRepository.findByEmail(email);
    if (existingAccount) {
      throw new Error(`Email already exists: ${email}`);
    }
  }

  /**
   * 发布邮箱更新事件
   */
  private async publishEmailUpdatedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:email_updated',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        newEmail: account.email,
        emailVerified: account.emailVerified,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountEmailApplicationService] Email updated event published', {
      accountUuid: account.uuid,
    });
  }

  /**
   * 发布邮箱验证事件
   */
  private async publishEmailVerifiedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:email_verified',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        email: account.email,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountEmailApplicationService] Email verified event published', {
      accountUuid: account.uuid,
    });
  }
}

