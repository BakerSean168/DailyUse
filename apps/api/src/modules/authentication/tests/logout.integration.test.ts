/**
 * 用户登出流程集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthenticationApplicationService } from '../application/services/AuthenticationApplicationService';
import { SessionManagementApplicationService } from '../application/services/SessionManagementApplicationService';
import type { LoginRequest } from '../application/services/AuthenticationApplicationService';
import type { TerminateSessionRequest } from '../application/services/SessionManagementApplicationService';
import { RegistrationApplicationService } from '../../account/application/services/RegistrationApplicationService';
import type { RegisterUserRequest } from '../../account/application/services/RegistrationApplicationService';
import { AuthenticationContainer } from '../infrastructure/di/AuthenticationContainer';
import { AccountContainer } from '../../account/infrastructure/di/AccountContainer';
import { prisma } from '@/config/prisma';

describe('用户登出集成测试', () => {
  let authService: AuthenticationApplicationService;
  let sessionService: SessionManagementApplicationService;
  let registrationService: RegistrationApplicationService;
  const testAccounts: string[] = [];

  // 测试用户信息
  let testUsername: string;
  let testPassword: string;
  let testAccountUuid: string;

  beforeAll(async () => {
    AuthenticationContainer.getInstance();
    AccountContainer.getInstance();
    authService = await AuthenticationApplicationService.createInstance();
    sessionService = await SessionManagementApplicationService.createInstance();
    registrationService = await RegistrationApplicationService.createInstance();

    // 创建测试用户
    const uniqueSuffix = Date.now();
    testUsername = `logouttest${uniqueSuffix}`;
    testPassword = 'Test@123456';

    const registerResult = await registrationService.registerUser({
      username: testUsername,
      email: `logouttest${uniqueSuffix}@example.com`,
      password: testPassword,
      profile: { nickname: 'Logout Test User' },
    } as RegisterUserRequest);

    testAccountUuid = registerResult.account.uuid;
    testAccounts.push(testAccountUuid);
  });

  afterAll(async () => {
    // 清理测试账户
    for (const accountUuid of testAccounts) {
      try {
        await prisma.authCredential.deleteMany({ where: { accountUuid } });
        await prisma.authSession.deleteMany({ where: { accountUuid } });
        await prisma.account.delete({ where: { uuid: accountUuid } });
      } catch (error) {
        console.warn(`清理测试账户失败: ${accountUuid}`);
      }
    }
  });

  it('应该成功登出并终止会话', async () => {
    // 先登录
    const loginRequest: LoginRequest = {
      username: testUsername,
      password: testPassword,
      deviceInfo: {
        deviceId: 'logout-test-device-1',
        deviceName: 'Test Device',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    };

    const loginResult = await authService.login(loginRequest);
    const sessionUuid = loginResult.session.sessionUuid;

    // 验证会话存在
    let dbSession = await prisma.authSession.findUnique({
      where: { uuid: sessionUuid },
    });
    expect(dbSession).toBeDefined();
    expect(dbSession?.status).toBe('ACTIVE');

    // 执行登出
    const logoutRequest: TerminateSessionRequest = {
      sessionUuid,
      accountUuid: testAccountUuid,
    };

    await sessionService.terminateSession(logoutRequest);

    // 验证会话已终止
    dbSession = await prisma.authSession.findUnique({
      where: { uuid: sessionUuid },
    });
    expect(dbSession?.status).toBe('TERMINATED');
  });

  it('应该支持终止单个会话而保留其他会话', async () => {
    // 创建多个会话
    const sessions = [];
    for (let i = 0; i < 3; i++) {
      const loginRequest: LoginRequest = {
        username: testUsername,
        password: testPassword,
        deviceInfo: {
          deviceId: `logout-multi-device-${i}`,
          deviceName: `Test Device ${i}`,
          deviceType: 'WEB',
          platform: 'Windows',
        },
        ipAddress: '127.0.0.1',
      };

      const loginResult = await authService.login(loginRequest);
      sessions.push(loginResult.session);
    }

    // 终止第一个会话
    const logoutRequest: TerminateSessionRequest = {
      sessionUuid: sessions[0].sessionUuid,
      accountUuid: testAccountUuid,
    };

    await sessionService.terminateSession(logoutRequest);

    // 验证第一个会话已终止
    const terminatedSession = await prisma.authSession.findUnique({
      where: { uuid: sessions[0].sessionUuid },
    });
    expect(terminatedSession?.status).toBe('TERMINATED');

    // 验证其他会话仍然活跃
    const activeSession1 = await prisma.authSession.findUnique({
      where: { uuid: sessions[1].sessionUuid },
    });
    const activeSession2 = await prisma.authSession.findUnique({
      where: { uuid: sessions[2].sessionUuid },
    });

    expect(activeSession1?.status).toBe('ACTIVE');
    expect(activeSession2?.status).toBe('ACTIVE');
  });

  it('应该支持终止所有会话', async () => {
    // 创建多个会话
    const sessions = [];
    for (let i = 0; i < 3; i++) {
      const loginRequest: LoginRequest = {
        username: testUsername,
        password: testPassword,
        deviceInfo: {
          deviceId: `logout-all-device-${i}`,
          deviceName: `Test Device ${i}`,
          deviceType: 'WEB',
          platform: 'Windows',
        },
        ipAddress: '127.0.0.1',
      };

      const loginResult = await authService.login(loginRequest);
      sessions.push(loginResult.session);
    }

    // 终止所有会话
    await sessionService.terminateAllSessions({
      accountUuid: testAccountUuid,
    });

    // 验证所有会话都已终止
    const allSessions = await prisma.authSession.findMany({
      where: { accountUuid: testAccountUuid },
    });

    const activeSessions = allSessions.filter((s: any) => s.status === 'ACTIVE');
    expect(activeSessions).toHaveLength(0);
  });

  it('应该支持终止所有会话但保留当前会话', async () => {
    // 创建多个会话
    const sessions = [];
    for (let i = 0; i < 3; i++) {
      const loginRequest: LoginRequest = {
        username: testUsername,
        password: testPassword,
        deviceInfo: {
          deviceId: `logout-except-device-${i}`,
          deviceName: `Test Device ${i}`,
          deviceType: 'WEB',
          platform: 'Windows',
        },
        ipAddress: '127.0.0.1',
      };

      const loginResult = await authService.login(loginRequest);
      sessions.push(loginResult.session);
    }

    // 终止除第一个会话外的所有会话
    await sessionService.terminateAllSessions({
      accountUuid: testAccountUuid,
      exceptSessionUuid: sessions[0].sessionUuid,
    });

    // 验证第一个会话仍然活跃
    const currentSession = await prisma.authSession.findUnique({
      where: { uuid: sessions[0].sessionUuid },
    });
    expect(currentSession?.status).toBe('ACTIVE');

    // 验证其他会话已终止
    const otherSessions = await prisma.authSession.findMany({
      where: {
        accountUuid: testAccountUuid,
        uuid: { not: sessions[0].sessionUuid },
      },
    });

    const activeSessions = otherSessions.filter((s: any) => s.status === 'ACTIVE');
    expect(activeSessions).toHaveLength(0);
  });

  it('应该拒绝终止不存在的会话', async () => {
    const logoutRequest: TerminateSessionRequest = {
      sessionUuid: 'nonexistent-session-uuid',
      accountUuid: testAccountUuid,
    };

    await expect(sessionService.terminateSession(logoutRequest)).rejects.toThrow();
  });
});
