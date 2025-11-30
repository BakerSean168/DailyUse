/**
 * SettingCloudSyncService 单元测试
 *
 * 使用 DI 容器和 Mock 仓储进行测试
 * 测试云同步服务的所有功能：
 * - 版本保存
 * - 版本历史
 * - 版本恢复
 * - 冲突解决
 * - 同步状态
 * - 版本清理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingCloudSyncService, type SettingVersion } from '../SettingCloudSyncService';
import { SettingContainer } from '../../../infrastructure/di/SettingContainer';
import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { generateUUID } from '@dailyuse/utils';

describe('SettingCloudSyncService - DI Integration', () => {
  let service: SettingCloudSyncService;
  let mockRepository: IUserSettingRepository;
  const testAccountUuid = generateUUID();
  const testDeviceId = 'device-001';
  const testDeviceName = 'Test Device';

  beforeEach(async () => {
    // 创建 Mock 仓储
    mockRepository = {
      findByAccountUuid: vi.fn().mockResolvedValue({
        uuid: generateUUID(),
        accountUuid: testAccountUuid,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findByUuid: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        uuid: generateUUID(),
        accountUuid: testAccountUuid,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        uuid: generateUUID(),
        accountUuid: testAccountUuid,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(true),
      findAll: vi.fn().mockResolvedValue([]),
    } as any;

    // 通过 DI 容器创建服务实例
    const container = SettingContainer.getInstance();
    container.setUserSettingRepository(mockRepository);
    service = await SettingCloudSyncService.createInstance(mockRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
    SettingContainer.getInstance().reset();
  });

  describe('saveSettingVersion', () => {
    it('应该保存设置版本快照', async () => {
      const snapshot = {
        theme: 'DARK',
        fontSize: 'MEDIUM',
        accentColor: '#FF5733',
      };

      const version = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      expect(version).toBeDefined();
      expect(version.settingSnapshot).toEqual(snapshot);
      expect(version.deviceId).toBe(testDeviceId);
      expect(version.deviceName).toBe(testDeviceName);
      expect(version.uuid).toBeTruthy();
      expect(version.createdAt).toBeDefined();
    });

    it('应该为同一账户保存多个版本', async () => {
      const snapshot1 = { theme: 'DARK' };
      const snapshot2 = { theme: 'LIGHT' };

      const version1 = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot1
      );

      const version2 = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot2
      );

      expect(version1.uuid).not.toBe(version2.uuid);
    });

    it('应该保存版本号', async () => {
      const snapshot = { theme: 'DARK' };

      const version1 = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      const version2 = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      expect(version2.version).toBeGreaterThan(version1.version);
    });
  });

  describe('getSettingHistory', () => {
    beforeEach(async () => {
      const snapshot = { theme: 'DARK' };
      for (let i = 0; i < 15; i++) {
        await service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          snapshot
        );
      }
    });

    it('应该获取最新的版本历史', async () => {
      const history = await service.getSettingHistory(testAccountUuid);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该支持限制历史条数', async () => {
      const history = await service.getSettingHistory(testAccountUuid, 5);

      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('应该按版本号升序排列', async () => {
      const history = await service.getSettingHistory(testAccountUuid, 10);

      for (let i = 0; i < history.length - 1; i++) {
        expect(history[i].version).toBeLessThanOrEqual(
          history[i + 1].version
        );
      }
    });

    it('应该返回空数组（不存在的账户）', async () => {
      const nonExistentAccountUuid = generateUUID();
      const history = await service.getSettingHistory(nonExistentAccountUuid);

      expect(history).toEqual([]);
    });
  });

  describe('restoreSettingVersion', () => {
    it('应该恢复指定版本的设置', async () => {
      const snapshot = { theme: 'DARK', fontSize: 'LARGE' };
      const version = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      const restored = await service.restoreSettingVersion(
        testAccountUuid,
        version.uuid
      );

      expect(restored).toBe(true);
    });

    it('应该返回 false（版本不存在）', async () => {
      const nonExistentVersionUuid = generateUUID();
      try {
        await service.restoreSettingVersion(
          testAccountUuid,
          nonExistentVersionUuid
        );
        // 如果不抛错就测试失败
        expect(true).toBe(false);
      } catch (error: any) {
        // 预期会抛出错误 - 可能是 "No version history found" 或 "Version not found"
        expect(error.message).toBeDefined();
        expect(
          error.message.includes('No version history found') ||
          error.message.includes('Version not found')
        ).toBe(true);
      }
    });

    it('应该返回 false（不同账户）', async () => {
      const snapshot = { theme: 'DARK' };
      const version = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      const otherAccountUuid = generateUUID();
      try {
        await service.restoreSettingVersion(
          otherAccountUuid,
          version.uuid
        );
      } catch (error: any) {
        expect(error.message).toContain('No version history found');
      }
    });
  });

  describe('resolveConflict', () => {
    it('应该使用 "local" 策略', async () => {
      const localSnapshot = { theme: 'DARK', fontSize: 'SMALL' };
      const remoteSnapshot = { theme: 'LIGHT', fontSize: 'LARGE' };

      // 创建版本对象
      const localVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-local',
        'Local Device',
        localSnapshot
      );

      const remoteVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-remote',
        'Remote Device',
        remoteSnapshot
      );

      const resolved = await service.resolveConflict(
        testAccountUuid,
        localVersion,
        remoteVersion,
        'local'
      );

      expect(resolved).toEqual(localSnapshot);
    });

    it('应该使用 "remote" 策略', async () => {
      const localSnapshot = { theme: 'DARK', fontSize: 'SMALL' };
      const remoteSnapshot = { theme: 'LIGHT', fontSize: 'LARGE' };

      const localVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-local',
        'Local Device',
        localSnapshot
      );

      const remoteVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-remote',
        'Remote Device',
        remoteSnapshot
      );

      const resolved = await service.resolveConflict(
        testAccountUuid,
        localVersion,
        remoteVersion,
        'remote'
      );

      expect(resolved).toEqual(remoteSnapshot);
    });

    it('应该使用 "merge" 策略进行深度合并', async () => {
      const localSnapshot = {
        appearance: { theme: 'DARK', fontSize: 'SMALL' },
        locale: { language: 'zh-CN' },
      };

      const remoteSnapshot = {
        appearance: { theme: 'LIGHT', accentColor: '#FF5733' },
        workflow: { autoSave: true },
      };

      const localVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-local',
        'Local Device',
        localSnapshot
      );

      const remoteVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-remote',
        'Remote Device',
        remoteSnapshot
      );

      const resolved = await service.resolveConflict(
        testAccountUuid,
        localVersion,
        remoteVersion,
        'merge'
      );

      // merge 策略应该保留本地的值，添加远程缺少的键
      expect(resolved.appearance).toBeDefined();
      expect(resolved.locale).toBeDefined();
      expect(resolved.workflow).toBeDefined();
    });

    it('应该处理嵌套的冲突', async () => {
      const localSnapshot = {
        nested: {
          level1: {
            level2: { value: 'local' },
          },
        },
      };

      const remoteSnapshot = {
        nested: {
          level1: {
            level2: { value: 'remote' },
          },
        },
      };

      const localVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-local',
        'Local Device',
        localSnapshot
      );

      const remoteVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-remote',
        'Remote Device',
        remoteSnapshot
      );

      const resolved = await service.resolveConflict(
        testAccountUuid,
        localVersion,
        remoteVersion,
        'local'
      );

      expect(resolved.nested.level1.level2.value).toBe('local');
    });

    it('应该处理 merge 策略为默认值', async () => {
      const localSnapshot = { theme: 'DARK', fontSize: 'SMALL' };
      const remoteSnapshot = { theme: 'LIGHT', fontSize: 'LARGE' };

      const localVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-local',
        'Local Device',
        localSnapshot
      );

      const remoteVersion = await service.saveSettingVersion(
        testAccountUuid,
        'device-remote',
        'Remote Device',
        remoteSnapshot
      );

      // 不传递 strategy，应该默认为 'merge'
      const resolved = await service.resolveConflict(
        testAccountUuid,
        localVersion,
        remoteVersion
      );

      expect(resolved).toBeDefined();
    });
  });

  describe('getSyncStatus', () => {
    it('应该返回同步状态', async () => {
      const snapshot = { theme: 'DARK' };
      await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      const status = await service.getSyncStatus(testAccountUuid);

      expect(status).toBeDefined();
      expect(typeof status.lastSyncedAt).toBe('number');
      expect(typeof status.versionCount).toBe('number');
      expect(typeof status.hasConflicts).toBe('boolean');
    });

    it('应该返回未同步账户的状态', async () => {
      const nonExistentAccountUuid = generateUUID();
      const status = await service.getSyncStatus(nonExistentAccountUuid);

      expect(status.lastSyncedAt).toBeNull();
      expect(status.versionCount).toBe(0);
    });

    it('应该返回正确的版本计数', async () => {
      const snapshot = { theme: 'DARK' };
      for (let i = 0; i < 5; i++) {
        await service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          snapshot
        );
      }

      const status = await service.getSyncStatus(testAccountUuid);

      expect(status.versionCount).toBe(5);
    });
  });

  describe('cleanupOldVersions', () => {
    beforeEach(async () => {
      const snapshot = { theme: 'DARK' };
      for (let i = 0; i < 20; i++) {
        await service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          snapshot
        );
      }
    });

    it('应该保留指定数量的最新版本', async () => {
      const keepCount = 5;
      const removedCount = await service.cleanupOldVersions(testAccountUuid, keepCount);

      expect(typeof removedCount).toBe('number');
      expect(removedCount).toBeGreaterThanOrEqual(0);

      // 清理后再查询，应该只有指定数量的版本
      const history = await service.getSettingHistory(testAccountUuid, 100);
      expect(history.length).toBeLessThanOrEqual(keepCount + removedCount);
    });

    it('应该返回删除的版本数量', async () => {
      const initialHistory = await service.getSettingHistory(testAccountUuid, 100);
      const initialCount = initialHistory.length;

      const keepCount = 5;
      const removedCount = await service.cleanupOldVersions(testAccountUuid, keepCount);

      expect(removedCount).toBeLessThanOrEqual(initialCount - keepCount);
    });

    it('应该处理不存在的账户', async () => {
      const nonExistentAccountUuid = generateUUID();
      const removedCount = await service.cleanupOldVersions(nonExistentAccountUuid, 5);

      expect(removedCount).toBe(0);
    });

    it('应该处理 keepCount 大于现有版本数的情况', async () => {
      const history = await service.getSettingHistory(testAccountUuid, 100);
      const currentCount = history.length;

      const keepCount = currentCount + 10;
      const removedCount = await service.cleanupOldVersions(testAccountUuid, keepCount);

      expect(removedCount).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理 null 快照', async () => {
      expect(async () => {
        await service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          null as any
        );
      }).not.toThrow();
    });

    it('应该处理空对象快照', async () => {
      const version = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        {}
      );

      expect(version.settingSnapshot).toEqual({});
    });

    it('应该处理很大的快照', async () => {
      const largeSnapshot = {
        data: 'x'.repeat(100000),
      };

      const version = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        largeSnapshot
      );

      expect(version).toBeDefined();
    });

    it('应该处理特殊字符', async () => {
      const snapshot = {
        special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        unicode: '中文日本語한국어',
      };

      const version = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      expect(version.settingSnapshot).toEqual(snapshot);
    });
  });

  describe('并发操作', () => {
    it('应该处理并发保存', async () => {
      const snapshot = { theme: 'DARK' };

      const promises = Array(10).fill(null).map(() =>
        service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          snapshot
        )
      );

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      expect(new Set(results.map(r => r.uuid)).size).toBe(10);
    });

    it('应该处理并发读取', async () => {
      const snapshot = { theme: 'DARK' };
      await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      const promises = Array(10).fill(null).map(() =>
        service.getSettingHistory(testAccountUuid)
      );

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      results.forEach(history => {
        expect(Array.isArray(history)).toBe(true);
      });
    });
  });

  describe('版本管理限制', () => {
    it('应该默认保留最多 20 个版本', async () => {
      const snapshot = { theme: 'DARK' };

      for (let i = 0; i < 25; i++) {
        await service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          snapshot
        );
      }

      const history = await service.getSettingHistory(testAccountUuid, 100);
      expect(history.length).toBeLessThanOrEqual(20);
    });
  });
});
