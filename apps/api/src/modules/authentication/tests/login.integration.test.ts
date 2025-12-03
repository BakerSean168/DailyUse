/**
 * 用户登录流程集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthenticationApplicationService } from '../application/services/AuthenticationApplicationService';
import type { LoginRequest } from '../application/services/AuthenticationApplicationService';
import { RegistrationApplicationService } from '../../account/application/services/RegistrationApplicationService';
import type { RegisterUserRequest } from '../../account/application/services/RegistrationApplicationService';
import { AuthenticationContainer } from '../infrastructure/di/AuthenticationContainer';
import { AccountContainer } from '../../account/infrastructure/di/AccountContainer';
import { prisma } from '@/config/prisma';

describe('用户登录集成测试', () => {
  let authService: AuthenticationApplicationService;
  let registrationService: RegistrationApplicationService;
  const testAccounts: string[] = [];
  const testSessions: string[] = [];

  // 测试用户信息
  let testUsername: string;
  let testEmail: string;
  let testPassword: string;
  let testAccountUuid: string;

  beforeAll(async () => {
    AuthenticationContainer.getInstance();
    AccountContainer.getInstance();
    authService = await AuthenticationApplicationService.createInstance();
    registrationService = await RegistrationApplicationService.createInstance();

    // 创建测试用户
    const uniqueSuffix = Date.now().toString().slice(-6); // 只取最后6位
    testUsername = `login${uniqueSuffix}`;
    testEmail = `login${uniqueSuffix}@example.com`;
    testPassword = 'Test@123456';

    const registerResult = await registrationService.registerUser({
      username: testUsername,
      email: testEmail,
      password: testPassword,
      profile: { nickname: 'Login Test User' },
    } as RegisterUserRequest);

    testAccountUuid = registerResult.account.uuid;
    testAccounts.push(testAccountUuid);
  });

  afterAll(async () => {
    // 清理测试会话
    for (const sessionUuid of testSessions) {
      try {
        await prisma.authSession.delete({ where: { uuid: sessionUuid } });
      } catch (error) {
        console.warn(`清理测试会话失败: ${sessionUuid}`);
      }
    }

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

  it('应该成功登录并创建会话', async () => {
    const loginRequest: LoginRequest = {
      username: testUsername,
      password: testPassword,
      deviceInfo: {
        deviceId: 'test-device-1',
        deviceName: 'Test Device',
        deviceType: 'WEB',
        platform: 'Windows',
        browser: 'Chrome',
      },
      ipAddress: '127.0.0.1',
      location: {
        country: 'China',
        city: 'Beijing',
      },
    };

    const result = await authService.login(loginRequest);

    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session.accessToken).toBeDefined();
    expect(result.session.refreshToken).toBeDefined();
    expect(result.session.sessionUuid).toBeDefined();
    expect(result.account.username).toBe(testUsername);

    testSessions.push(result.session.sessionUuid);

    // 验证数据库中的会话
    const dbSession = await prisma.authSession.findUnique({
      where: { uuid: result.session.sessionUuid },
    });

    expect(dbSession).toBeDefined();
    expect(dbSession?.accountUuid).toBe(testAccountUuid);

    // device 是 JSON 字段，需要解析
    const deviceInfo = JSON.parse(dbSession!.device);
    expect(deviceInfo.deviceName).toBe('Test Device');
    expect(dbSession?.ipAddress).toBe('127.0.0.1');
  });

  it('应该拒绝错误的密码', async () => {
    const loginRequest: LoginRequest = {
      username: testUsername,
      password: 'WrongPassword123!',
      deviceInfo: {
        deviceId: 'test-device-2',
        deviceName: 'Test Device',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    };

    await expect(authService.login(loginRequest)).rejects.toThrow();
  });

  it('应该拒绝不存在的用户名', async () => {
    const loginRequest: LoginRequest = {
      username: 'nonexistentuser123',
      password: testPassword,
      deviceInfo: {
        deviceId: 'test-device-3',
        deviceName: 'Test Device',
        deviceType: 'WEB',
        platform: 'Windows',
      },
      ipAddress: '127.0.0.1',
    };

    await expect(authService.login(loginRequest)).rejects.toThrow();
  });

  it('应该支持多设备登录', async () => {
    const devices = ['device-1', 'device-2', 'device-3'];
    const sessions = [];

    for (const deviceId of devices) {
      const loginRequest: LoginRequest = {
        username: testUsername,
        password: testPassword,
        deviceInfo: {
          deviceId,
          deviceName: `Test Device ${deviceId}`,
          deviceType: 'WEB',
          platform: 'Windows',
        },
        ipAddress: '127.0.0.1',
      };

      const result = await authService.login(loginRequest);
      sessions.push(result.session);
      testSessions.push(result.session.sessionUuid);
    }

    expect(sessions).toHaveLength(3);

    // 验证所有会话都在数据库中
    const dbSessions = await prisma.authSession.findMany({
      where: { accountUuid: testAccountUuid },
    });

    expect(dbSessions.length).toBeGreaterThanOrEqual(3);
  });

  it('应该记录设备和位置信息', async () => {
    const loginRequest: LoginRequest = {
      username: testUsername,
      password: testPassword,
      deviceInfo: {
        deviceId: 'test-device-location',
        deviceName: 'iPhone 13',
        deviceType: 'MOBILE',
        platform: 'iOS',
        browser: 'Safari',
        osVersion: '15.0',
      },
      ipAddress: '192.168.1.100',
      location: {
        country: 'USA',
        region: 'California',
        city: 'San Francisco',
        timezone: 'America/Los_Angeles',
      },
    };

    const result = await authService.login(loginRequest);
    testSessions.push(result.session.sessionUuid);

    const dbSession = await prisma.authSession.findUnique({
      where: { uuid: result.session.sessionUuid },
    });

    // device 是 JSON 字段，需要解析
    const deviceInfo = JSON.parse(dbSession!.device);
    expect(deviceInfo.deviceType).toBe('MOBILE');
    expect(deviceInfo.platform).toBe('iOS');
    expect(dbSession?.ipAddress).toBe('192.168.1.100');
  });
});
