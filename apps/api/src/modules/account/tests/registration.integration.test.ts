/**
 * 事件驱动用户注册流程测试
 *
 * 测试目标：
 * 1. Account 模块创建账户并发布事件
 * 2. Authentication 模块接收事件并创建凭证
 * 3. 验证最终一致性
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { eventBus } from '@dailyuse/utils';
import { RegistrationApplicationService } from '../application/services/RegistrationApplicationService';
import type { RegisterUserRequest } from '../application/services/RegistrationApplicationService';
import { AccountContainer } from '../infrastructure/di/AccountContainer';
import { AuthenticationContainer } from '../../authentication/infrastructure/di/AuthenticationContainer';
import { AccountCreatedHandler } from '../../authentication/application/event-handlers/AccountCreatedHandler';
import { prisma } from '@/shared/infrastructure/config/prisma';

describe('Event-Driven Registration Flow', () => {
  let registrationService: RegistrationApplicationService;
  let accountCreatedHandler: AccountCreatedHandler;
  let accountContainer: AccountContainer;
  let authContainer: AuthenticationContainer;

  beforeAll(async () => {
    // 初始化容器
    accountContainer = AccountContainer.getInstance();
    authContainer = AuthenticationContainer.getInstance();

    // 初始化服务
    registrationService = await RegistrationApplicationService.createInstance();
    accountCreatedHandler = AccountCreatedHandler.getInstance();

    // 注册事件处理器
    eventBus.on('account:created', async (event) => {
      await accountCreatedHandler.handle(event);
    });
  });

  afterAll(async () => {
    // 清理事件监听器
    eventBus.off('account:created');
  });

  it('should create account and credential via event bus', async () => {
    // Arrange: 准备测试数据
    const uniqueSuffix = Date.now().toString().slice(-6); // 只取最后6位
    const request: RegisterUserRequest = {
      username: `test${uniqueSuffix}`,
      email: `test${uniqueSuffix}@example.com`,
      password: 'Test@123456',
      profile: {
        nickname: 'Test User',
      },
    };

    // 监听 credential:created 事件
    let credentialCreatedEventReceived = false;
    let createdCredentialUuid: string | undefined;

    const credentialCreatedPromise = new Promise<void>((resolve) => {
      const handler = (event: any) => {
        credentialCreatedEventReceived = true;
        createdCredentialUuid = event.payload.credentialUuid;
        eventBus.off('credential:created', handler);
        resolve();
      };
      eventBus.on('credential:created', handler);

      // 设置超时（2秒后自动完成）
      setTimeout(() => {
        eventBus.off('credential:created', handler);
        resolve();
      }, 2000);
    });

    // Act: 调用注册服务
    const result = await registrationService.registerUser(request);

    // Assert: 验证 Account 创建成功
    expect(result.success).toBe(true);
    expect(result.account).toBeDefined();
    expect(result.account.username).toBe(request.username);
    expect(result.account.email).toBe(request.email);

    // 等待 credential:created 事件
    await credentialCreatedPromise;

    // 验证事件已触发
    expect(credentialCreatedEventReceived).toBe(true);
    expect(createdCredentialUuid).toBeDefined();

    // 清理测试数据
    if (createdCredentialUuid) {
      await prisma.authCredential
        .delete({
          where: { uuid: createdCredentialUuid },
        })
        .catch(() => {
          /* ignore */
        });
    }
    await prisma.account
      .delete({
        where: { uuid: result.account.uuid },
      })
      .catch(() => {
        /* ignore */
      });
  });

  it('should reject duplicate username', async () => {
    const uniqueSuffix = Date.now().toString().slice(-6); // 只取最后6位
    const firstRequest: RegisterUserRequest = {
      username: `dup${uniqueSuffix}`,
      email: `uniq${uniqueSuffix}@example.com`,
      password: 'Test@123456',
    };

    const firstResult = await registrationService.registerUser(firstRequest);

    const secondRequest: RegisterUserRequest = {
      username: `dup${uniqueSuffix}`,
      email: `other${uniqueSuffix}@example.com`,
      password: 'Test@123456',
    };

    await expect(registrationService.registerUser(secondRequest)).rejects.toThrow();

    // 清理测试数据
    await prisma.authCredential.deleteMany({
      where: { accountUuid: firstResult.account.uuid },
    });
    await prisma.account.delete({
      where: { uuid: firstResult.account.uuid },
    });
  });

  it('should reject duplicate email', async () => {
    const uniqueSuffix = Date.now().toString().slice(-6); // 只取最后6位
    const firstRequest: RegisterUserRequest = {
      username: `uniq${uniqueSuffix}`,
      email: `dup${uniqueSuffix}@example.com`,
      password: 'Test@123456',
    };

    const firstResult = await registrationService.registerUser(firstRequest);

    const secondRequest: RegisterUserRequest = {
      username: `other${uniqueSuffix}`,
      email: `dup${uniqueSuffix}@example.com`,
      password: 'Test@123456',
    };

    await expect(registrationService.registerUser(secondRequest)).rejects.toThrow();

    // 清理测试数据
    await prisma.authCredential.deleteMany({
      where: { accountUuid: firstResult.account.uuid },
    });
    await prisma.account.delete({
      where: { uuid: firstResult.account.uuid },
    });
  });
});
