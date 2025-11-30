// @ts-nocheck
/**
 * SettingApplicationService 集成测试
 *
 * 使用真实数据库测试完整的 Setting 模块流程：
 * - 获取用户设置（新用户创建默认设置）
 * - 更新用户设置
 * - 重置为默认设置
 * - 获取默认设置
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingApplicationService } from '../application/services/SettingApplicationService';
import { PrismaUserSettingRepository } from '../infrastructure/repositories/PrismaUserSettingRepository';
import { PrismaClient } from '@prisma/client';
import { UserSettingServer as UserSetting } from '@dailyuse/domain-server/setting';
import { getPrismaClient } from '../../test/setup-database';

describe('SettingApplicationService 集成测试', () => {
  let service: SettingApplicationService;
  let prisma: PrismaClient;
  const testAccountUuid = `test-account-${Date.now()}`;

  beforeEach(async () => {
    // 获取真实的 Prisma 客户端（由 setup-database.ts 初始化）
    prisma = getPrismaClient();

    // 创建测试账户
    try {
      await prisma.account.create({
        data: {
          uuid: testAccountUuid,
          username: `testuser-${Date.now()}`,
          email: `test-${Date.now()}@example.com`,
          emailVerified: true,
          phoneVerified: false,
          status: 'ACTIVE',
          profile: JSON.stringify({}),
          preferences: JSON.stringify({}),
          subscription: null,
          storage: JSON.stringify({}),
          security: JSON.stringify({}),
          history: JSON.stringify({}),
          stats: JSON.stringify({}),
        },
      });
    } catch (error) {
      // Account may already exist
    }

    // 创建真实的仓储
    const repository = new PrismaUserSettingRepository(prisma);

    // 创建服务实例
    service = await SettingApplicationService.createInstance(repository);
  });

  afterEach(async () => {
    // 测试数据由 setup-database.ts 的 cleanDatabase() 在 beforeEach 自动清理
    // 无需手动清理
  });

  describe('getUserSetting', () => {
    it('应该为新用户创建并返回默认设置', async () => {
      // Act
      const result = await service.getUserSetting(testAccountUuid);

      // Assert
      expect(result).toBeDefined();
      expect(result.accountUuid).toBe(testAccountUuid);
      expect(result.appearance).toBeDefined();
      expect(result.locale).toBeDefined();
      expect(result.workflow).toBeDefined();
      expect(result.locale.language).toBe('zh-CN'); // 默认语言
      expect(result.appearance.theme).toBe('AUTO'); // 默认主题
    });

    it('应该返回现有用户的设置', async () => {
      // Arrange - 第一次调用创建
      const firstResult = await service.getUserSetting(testAccountUuid);
      expect(firstResult).toBeDefined();

      // Act - 第二次调用应该返回相同的设置
      const secondResult = await service.getUserSetting(testAccountUuid);

      // Assert
      expect(secondResult.accountUuid).toBe(firstResult.accountUuid);
      expect(secondResult.id).toBe(firstResult.id); // 应该是同一条记录
    });
  });

  describe('updateUserSetting', () => {
    it('应该成功更新用户设置', async () => {
      // Arrange - 先创建一个设置
      const initial = await service.getUserSetting(testAccountUuid);
      expect(initial.appearance.theme).toBe('AUTO');
      expect(initial.locale.language).toBe('zh-CN');

      // Act - 更新设置
      const updated = await service.updateUserSetting(testAccountUuid, {
        appearance: {
          theme: 'DARK',
        },
        locale: {
          language: 'en-US',
        },
      });

      // Assert
      expect(updated.appearance.theme).toBe('DARK');
      expect(updated.locale.language).toBe('en-US');
      expect(updated.appearance.fontSize).toBe('MEDIUM'); // 未改动的字段保持原值
    });

    it('应该支持部分更新', async () => {
      // Arrange
      await service.getUserSetting(testAccountUuid);

      // Act - 只更新主题
      const updated = await service.updateUserSetting(testAccountUuid, {
        appearance: {
          theme: 'LIGHT',
        },
      });

      // Assert
      expect(updated.appearance.theme).toBe('LIGHT');
      expect(updated.locale.language).toBe('zh-CN'); // 保持默认
    });

    it('应该为不存在的用户创建设置后更新', async () => {
      // Act - 直接更新不存在的用户
      const result = await service.updateUserSetting(testAccountUuid, {
        workflow: {
          autoSave: false,
        },
      });

      // Assert
      expect(result.accountUuid).toBe(testAccountUuid);
      expect(result.workflow.autoSave).toBe(false);
      expect(result.appearance.theme).toBe('AUTO'); // 其他字段为默认值
    });
  });

  describe('resetUserSetting', () => {
    it('应该将用户设置重置为默认值', async () => {
      // Arrange - 修改设置
      await service.updateUserSetting(testAccountUuid, {
        appearance: { theme: 'DARK', fontSize: 'LARGE' },
        locale: { language: 'ja-JP' },
        workflow: { autoSave: false },
      });

      // Act - 重置
      const reset = await service.resetUserSetting(testAccountUuid);

      // Assert
      expect(reset.appearance.theme).toBe('AUTO'); // 恢复默认
      expect(reset.appearance.fontSize).toBe('MEDIUM'); // 恢复默认
      expect(reset.locale.language).toBe('zh-CN'); // 恢复默认
      expect(reset.workflow.autoSave).toBe(true); // 恢复默认
    });

    it('应该在用户不存在时抛出错误', async () => {
      // Act & Assert
      await expect(
        service.resetUserSetting('non-existent-user'),
      ).rejects.toThrow('User setting not found');
    });
  });

  describe('getDefaultSettings', () => {
    it('应该返回默认设置 DTO', async () => {
      // Act
      const defaults = await service.getDefaultSettings();

      // Assert
      expect(defaults).toBeDefined();
      expect(defaults.accountUuid).toBe('temp-uuid');
      expect(defaults.appearance.theme).toBe('AUTO');
      expect(defaults.appearance.fontSize).toBe('MEDIUM');
      expect(defaults.locale.language).toBe('zh-CN');
      expect(defaults.locale.timezone).toBe('Asia/Shanghai');
      expect(defaults.workflow.autoSave).toBe(true);
      expect(defaults.privacy.profileVisibility).toBe('PRIVATE');
    });
  });

  describe('完整流程测试', () => {
    it('应该支持完整的 CRUD 流程', async () => {
      // 1. 获取默认设置
      const initial = await service.getUserSetting(testAccountUuid);
      expect(initial.appearance.theme).toBe('AUTO');

      // 2. 更新设置
      const updated = await service.updateUserSetting(testAccountUuid, {
        appearance: { theme: 'DARK' },
        locale: { language: 'en-US' },
      });
      expect(updated.appearance.theme).toBe('DARK');
      expect(updated.locale.language).toBe('en-US');

      // 3. 再次获取验证持久化
      const fetched = await service.getUserSetting(testAccountUuid);
      expect(fetched.appearance.theme).toBe('DARK');
      expect(fetched.locale.language).toBe('en-US');

      // 4. 重置为默认
      const reset = await service.resetUserSetting(testAccountUuid);
      expect(reset.appearance.theme).toBe('AUTO');
      expect(reset.locale.language).toBe('zh-CN');

      // 5. 再次验证重置
      const finalFetch = await service.getUserSetting(testAccountUuid);
      expect(finalFetch.appearance.theme).toBe('AUTO');
      expect(finalFetch.locale.language).toBe('zh-CN');
    });

    it('应该正确处理多个用户的设置隔离', async () => {
      const user1 = `user-1-${Date.now()}`;
      const user2 = `user-2-${Date.now()}`;

      // 创建测试账户
      try {
        await prisma.account.createMany({
          data: [
            {
              uuid: user1,
              username: `testuser1-${Date.now()}`,
              email: `test1-${Date.now()}@example.com`,
              emailVerified: true,
              phoneVerified: false,
              status: 'ACTIVE',
              profile: JSON.stringify({}),
              preferences: JSON.stringify({}),
              subscription: null,
              storage: JSON.stringify({}),
              security: JSON.stringify({}),
              history: JSON.stringify({}),
              stats: JSON.stringify({}),
            },
            {
              uuid: user2,
              username: `testuser2-${Date.now()}`,
              email: `test2-${Date.now()}@example.com`,
              emailVerified: true,
              phoneVerified: false,
              status: 'ACTIVE',
              profile: JSON.stringify({}),
              preferences: JSON.stringify({}),
              subscription: null,
              storage: JSON.stringify({}),
              security: JSON.stringify({}),
              history: JSON.stringify({}),
              stats: JSON.stringify({}),
            },
          ],
        });
      } catch (error) {
        // Accounts may already exist
      }

      // 创建用户1的设置
      const settings1 = await service.updateUserSetting(user1, {
        appearance: { theme: 'DARK' },
      });
      expect(settings1.appearance.theme).toBe('DARK');

      // 创建用户2的设置
      const settings2 = await service.updateUserSetting(user2, {
        appearance: { theme: 'LIGHT' },
      });
      expect(settings2.appearance.theme).toBe('LIGHT');

      // 验证隔离
      const user1Check = await service.getUserSetting(user1);
      expect(user1Check.appearance.theme).toBe('DARK');

      const user2Check = await service.getUserSetting(user2);
      expect(user2Check.appearance.theme).toBe('LIGHT');

      // 清理
      await prisma.userSetting.deleteMany({
        where: { accountUuid: { in: [user1, user2] } },
      });
      await prisma.account.deleteMany({
        where: { uuid: { in: [user1, user2] } },
      });
    });
  });

  describe('数据持久化测试', () => {
    it('应该将所有设置字段正确保存到数据库', async () => {
      // 创建并更新复杂设置
      const complexSettings = {
        appearance: {
          theme: 'DARK',
          accentColor: '#FF5733',
          fontSize: 'LARGE',
          fontFamily: 'Roboto',
          compactMode: true,
        },
        locale: {
          language: 'en-US',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          weekStartsOn: 0,
          currency: 'USD',
        },
        workflow: {
          defaultTaskView: 'LIST',
          defaultGoalView: 'PROGRESS',
          autoSave: true,
          autoSaveInterval: 5000,
          confirmBeforeDelete: true,
        },
        privacy: {
          profileVisibility: 'PUBLIC',
          showOnlineStatus: false,
          allowSearchByEmail: true,
          shareUsageData: false,
        },
      };

      // Act
      const updated = await service.updateUserSetting(
        testAccountUuid,
        complexSettings as any,
      );

      // Assert - 验证所有字段
      expect(updated.appearance.theme).toBe('DARK');
      expect(updated.appearance.accentColor).toBe('#FF5733');
      expect(updated.appearance.fontSize).toBe('LARGE');
      expect(updated.locale.language).toBe('en-US');
      expect(updated.locale.timezone).toBe('America/New_York');
      expect(updated.workflow.autoSave).toBe(true);
      expect(updated.privacy.profileVisibility).toBe('PUBLIC');
      expect(updated.privacy.showOnlineStatus).toBe(false);

      // 验证数据库中确实保存了
      const fromDb = await prisma.userSetting.findUnique({
        where: { accountUuid: testAccountUuid },
      });
      expect(fromDb).toBeDefined();
      expect(fromDb?.accountUuid).toBe(testAccountUuid);
    });
  });
});
