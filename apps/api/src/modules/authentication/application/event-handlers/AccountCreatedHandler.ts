/**
 * AccountCreated Event Handler
 * 监听 account:created 事件，创建对应的 AuthCredential
 *
 * 事件驱动架构职责：
 * - 监听来自 Account 模块的 account:created 事件
 * - 提取明文密码并进行加密
 * - 创建 AuthCredential 聚合根
 * - 持久化 AuthCredential
 * - 发布 credential:created 事件
 *
 * 优势：
 * - 模块解耦：Authentication 模块不依赖 Account 模块
 * - 异步处理：不阻塞用户注册流程
 * - 易于扩展：可以添加更多事件监听器
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server';
import { AuthenticationDomainService } from '@dailyuse/domain-server';
import { AuthenticationContainer } from '../../infrastructure/di/AuthenticationContainer';
import { createLogger } from '@dailyuse/utils';
import bcrypt from 'bcryptjs';

const logger = createLogger('AccountCreatedHandler');

/**
 * AccountCreated 事件 Payload
 */
interface AccountCreatedPayload {
  accountUuid: string;
  username: string;
  email: string;
  plainPassword: string; // 明文密码，仅传递一次
  displayName: string;
}

/**
 * AccountCreated Event Handler
 */
export class AccountCreatedHandler {
  private static instance: AccountCreatedHandler;
  private credentialRepository: IAuthCredentialRepository;
  private authDomainService: AuthenticationDomainService;

  private constructor(credentialRepository: IAuthCredentialRepository) {
    this.credentialRepository = credentialRepository;
    this.authDomainService = new AuthenticationDomainService();
  }

  /**
   * 获取处理器单例
   */
  static getInstance(): AccountCreatedHandler {
    if (!AccountCreatedHandler.instance) {
      const container = AuthenticationContainer.getInstance();
      const credRepo = container.getAuthCredentialRepository();
      AccountCreatedHandler.instance = new AccountCreatedHandler(credRepo);
    }
    return AccountCreatedHandler.instance;
  }

  /**
   * 处理 account:created 事件
   */
  async handle(event: { payload: AccountCreatedPayload }): Promise<void> {
    const { accountUuid, username, email, plainPassword } = event.payload;

    logger.info('[AccountCreatedHandler] Handling account:created event', {
      accountUuid,
      username,
      email,
    });

    try {
      // 1. 密码加密（bcrypt，12 salt rounds）
      const hashedPassword = await this.hashPassword(plainPassword);

      // 2. 创建 AuthCredential 聚合根
      const credential = await this.authDomainService.createPasswordCredential({
        accountUuid,
        hashedPassword,
      });

      logger.info('[AccountCreatedHandler] AuthCredential created successfully', {
        credentialUuid: credential.uuid,
        accountUuid,
      });

      // 3. 发布 credential:created 事件（可选，用于其他服务）
      // 注意：这里不需要再发布事件，因为已经在 DomainService 中处理
    } catch (error) {
      logger.error('[AccountCreatedHandler] Failed to create AuthCredential', {
        accountUuid,
        username,
        error: error instanceof Error ? error.message : String(error),
      });

      // ⚠️ 重要：这里可以选择：
      // 1. 抛出错误，让事件总线重试（如果支持重试机制）
      // 2. 记录失败日志，通过补偿机制处理（推荐）
      // 3. 发送告警通知运维人员

      // 这里采用方案 2：记录错误但不阻塞流程
      // 可以通过定时任务检查未创建凭证的账户并补偿
      throw error; // 如果事件总线支持重试，可以抛出错误
    }
  }

  /**
   * 密码加密（bcrypt，12 salt rounds）
   */
  private async hashPassword(plainPassword: string): Promise<string> {
    const SALT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    logger.debug('[AccountCreatedHandler] Password hashed successfully');
    return hashedPassword;
  }
}
