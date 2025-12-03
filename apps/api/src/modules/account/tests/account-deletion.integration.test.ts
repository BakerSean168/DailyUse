/**
 * 账号注销流程集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AccountDeletionApplicationService } from '../../account/application/services/AccountDeletionApplicationService';
import type { DeleteAccountRequest } from '../../account/application/services/AccountDeletionApplicationService';
import { RegistrationApplicationService } from '../../account/application/services/RegistrationApplicationService';
import type { RegisterUserRequest } from '../../account/application/services/RegistrationApplicationService';
import { AuthenticationApplicationService } from '../../authentication/application/services/AuthenticationApplicationService';
import type { LoginRequest } from '../../authentication/application/services/AuthenticationApplicationService';
import { AuthenticationContainer } from '../../authentication/infrastructure/di/AuthenticationContainer';
import { AccountContainer } from '../../account/infrastructure/di/AccountContainer';
import { prisma } from '@/config/prisma';

describe('账号注销集成测试', () => {
  let deletionService: AccountDeletionApplicationService;
  let registrationService: RegistrationApplicationService;
  let authService: AuthenticationApplicationService;
  const remainingAccounts: string[] = [];

  beforeAll(async () => {
    AuthenticationContainer.getInstance();
    AccountContainer.getInstance();
    deletionService = await AccountDeletionApplicationService.createInstance();
    registrationService = await RegistrationApplicationService.createInstance();
    authService = await AuthenticationApplicationService.createInstance();
  });

  afterAll(async () => {
    // 清理未成功删除的测试账户
    for (const accountUuid of remainingAccounts) {
      try {
        await prisma.authCredential.deleteMany({ where: { accountUuid } });
        await prisma.authSession.deleteMany({ where: { accountUuid } });
        await prisma.account.delete({ where: { uuid: accountUuid } });
      } catch (error) {
        console.warn(`清理测试账户失败: ${accountUuid}`);
      }
    }
  });

  it('应该成功注销账号并清理所有相关数据', async () => {
    // 创建测试用户
    const uniqueSuffix = Date.now();
    const testPassword = 'Test@123456';

    const registerResult = await registrationService.registerUser({
      username: `deletetest${uniqueSuffix}`,
      email: `deletetest${uniqueSuffix}@example.com`,
      password: testPassword,
      profile: { nickname: 'Delete Test User' },
    } as RegisterUserRequest);

    const accountUuid = registerResult.account.uuid;

    // 创建一些会话
    for (let i = 0; i < 2; i++) {
      const loginRequest: LoginRequest = {
        username: `deletetest${uniqueSuffix}`,
        password: testPassword,
        deviceInfo: {
          deviceId: `delete-test-device-${i}`,
          deviceName: `Test Device ${i}`,
          deviceType: 'WEB',
          platform: 'Windows',
        },
        ipAddress: '127.0.0.1',
      };

      await authService.login(loginRequest);
    }

    // 验证数据存在
    const accountBefore = await prisma.account.findUnique({
      where: { uuid: accountUuid },
    });
    expect(accountBefore).toBeDefined();

    const sessionsBefore = await prisma.authSession.findMany({
      where: { accountUuid },
    });
    expect(sessionsBefore.length).toBeGreaterThan(0);

    // 执行账号注销
    const deleteRequest: DeleteAccountRequest = {
      accountUuid,
      password: testPassword,
      reason: 'Testing account deletion',
      confirmationText: 'DELETE',
    };

    const result = await deletionService.deleteAccount(deleteRequest);

    expect(result.success).toBe(true);
    expect(result.accountUuid).toBe(accountUuid);

    // 验证账户已软删除
    const accountAfter = await prisma.account.findUnique({
      where: { uuid: accountUuid },
    });
    expect(accountAfter?.status).toBe('DELETED');

    // 验证所有会话已终止
    const sessionsAfter = await prisma.authSession.findMany({
      where: { accountUuid },
    });
    const activeSessions = sessionsAfter.filter((s: any) => s.status === 'ACTIVE');
    expect(activeSessions).toHaveLength(0);

    // 清理测试数据（因为是软删除，仍需手动清理）
    await prisma.authCredential.deleteMany({ where: { accountUuid } });
    await prisma.authSession.deleteMany({ where: { accountUuid } });
    await prisma.account.delete({ where: { uuid: accountUuid } });
  });

  it('应该验证密码后才允许注销', async () => {
    // 创建测试用户
    const uniqueSuffix = Date.now();
    const testPassword = 'Test@123456';

    const registerResult = await registrationService.registerUser({
      username: `pwdtest${uniqueSuffix}`,
      email: `pwdtest${uniqueSuffix}@example.com`,
      password: testPassword,
      profile: { nickname: 'Password Test User' },
    } as RegisterUserRequest);

    const accountUuid = registerResult.account.uuid;
    remainingAccounts.push(accountUuid);

    // 尝试使用错误密码注销
    const deleteRequest: DeleteAccountRequest = {
      accountUuid,
      password: 'WrongPassword123!',
      confirmationText: 'DELETE',
    };

    await expect(deletionService.deleteAccount(deleteRequest)).rejects.toThrow();

    // 验证账户仍然活跃
    const account = await prisma.account.findUnique({
      where: { uuid: accountUuid },
    });
    expect(account?.status).toBe('ACTIVE');
  });

  it('应该拒绝注销已删除的账号', async () => {
    // 创建测试用户
    const uniqueSuffix = Date.now();
    const testPassword = 'Test@123456';

    const registerResult = await registrationService.registerUser({
      username: `doubletest${uniqueSuffix}`,
      email: `doubletest${uniqueSuffix}@example.com`,
      password: testPassword,
      profile: { nickname: 'Double Delete Test' },
    } as RegisterUserRequest);

    const accountUuid = registerResult.account.uuid;

    // 第一次注销
    const deleteRequest: DeleteAccountRequest = {
      accountUuid,
      password: testPassword,
      confirmationText: 'DELETE',
    };

    await deletionService.deleteAccount(deleteRequest);

    // 尝试第二次注销
    await expect(deletionService.deleteAccount(deleteRequest)).rejects.toThrow();

    // 清理测试数据
    await prisma.authCredential.deleteMany({ where: { accountUuid } });
    await prisma.authSession.deleteMany({ where: { accountUuid } });
    await prisma.account.delete({ where: { uuid: accountUuid } });
  });

  it('应该支持提供注销原因和反馈', async () => {
    // 创建测试用户
    const uniqueSuffix = Date.now();
    const testPassword = 'Test@123456';

    const registerResult = await registrationService.registerUser({
      username: `feedbacktest${uniqueSuffix}`,
      email: `feedbacktest${uniqueSuffix}@example.com`,
      password: testPassword,
      profile: { nickname: 'Feedback Test User' },
    } as RegisterUserRequest);

    const accountUuid = registerResult.account.uuid;

    // 注销并提供原因
    const deleteRequest: DeleteAccountRequest = {
      accountUuid,
      password: testPassword,
      reason: 'No longer need the service',
      feedback: 'The app is great but I am switching to another platform.',
      confirmationText: 'DELETE',
    };

    const result = await deletionService.deleteAccount(deleteRequest);

    expect(result.success).toBe(true);

    // 清理测试数据
    await prisma.authCredential.deleteMany({ where: { accountUuid } });
    await prisma.authSession.deleteMany({ where: { accountUuid } });
    await prisma.account.delete({ where: { uuid: accountUuid } });
  });

  it('应该在注销后无法登录', async () => {
    // 创建测试用户
    const uniqueSuffix = Date.now();
    const testUsername = `nologintest${uniqueSuffix}`;
    const testPassword = 'Test@123456';

    const registerResult = await registrationService.registerUser({
      username: testUsername,
      email: `nologintest${uniqueSuffix}@example.com`,
      password: testPassword,
      profile: { nickname: 'No Login Test User' },
    } as RegisterUserRequest);

    const accountUuid = registerResult.account.uuid;

    // 注销账号
    const deleteRequest: DeleteAccountRequest = {
      accountUuid,
      password: testPassword,
      confirmationText: 'DELETE',
    };

    await deletionService.deleteAccount(deleteRequest);

    // 尝试登录
    const loginRequest: LoginRequest = {
      username: testUsername,
      password: testPassword,
      deviceInfo: {
        deviceId: 'nologin-test-device',
        deviceName: 'Test Device',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    };

    await expect(authService.login(loginRequest)).rejects.toThrow();

    // 清理测试数据
    await prisma.authCredential.deleteMany({ where: { accountUuid } });
    await prisma.authSession.deleteMany({ where: { accountUuid } });
    await prisma.account.delete({ where: { uuid: accountUuid } });
  });
});
