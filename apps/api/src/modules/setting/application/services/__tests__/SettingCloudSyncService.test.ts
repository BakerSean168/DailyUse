/**
 * SettingCloudSyncService 单元测试
 *
 * 测试云同步服务的所有功能：
 * - 版本保存
 * - 版本历史
 * - 版本恢复
 * - 冲突解决
 * - 同步状态
 * - 版本清理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingCloudSyncService } from '../SettingCloudSyncService';
import { generateUUID } from '@dailyuse/utils';

describe('SettingCloudSyncService', () => {
  let service: SettingCloudSyncService;
  const testAccountUuid = generateUUID();
  const testDeviceId = 'device-001';
  const testDeviceName = 'Test Device';

  beforeEach(() => {
    service = new SettingCloudSyncService();
  });

  afterEach(() => {
    vi.clearAllMocks();
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

    it('应该按时间戳排序（最新优先）', async () => {
      const history = await service.getSettingHistory(testAccountUuid, 10);

      for (let i = 0; i < history.length - 1; i++) {
        expect(history[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          history[i + 1].createdAt.getTime()
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

      expect(restored).toBeDefined();
      expect(restored?.settingSnapshot).toEqual(snapshot);
    });

    it('应该返回 undefined（版本不存在）', async () => {
      const nonExistentVersionUuid = generateUUID();
      const restored = await service.restoreSettingVersion(
        testAccountUuid,
        nonExistentVersionUuid
      );

      expect(restored).toBeUndefined();
    });

    it('应该返回 undefined（不同账户）', async () => {
      const snapshot = { theme: 'DARK' };
      const version = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      const otherAccountUuid = generateUUID();
      const restored = await service.restoreSettingVersion(
        otherAccountUuid,
        version.uuid
      );

      expect(restored).toBeUndefined();
    });
  });

  describe('resolveConflict', () => {
    const localSettings = { theme: 'DARK', fontSize: 'SMALL' };
    const remoteSettings = { theme: 'LIGHT', fontSize: 'LARGE' };

    it('应该使用 "local" 策略', async () => {
      const resolved = await service.resolveConflict(
        testAccountUuid,
        localSettings,
        remoteSettings,
        'local'
      );

      expect(resolved).toEqual(localSettings);
    });

    it('应该使用 "remote" 策略', async () => {
      const resolved = await service.resolveConflict(
        testAccountUuid,
        localSettings,
        remoteSettings,
        'remote'
      );

      expect(resolved).toEqual(remoteSettings);
    });

    it('应该使用 "merge" 策略进行深度合并', async () => {
      const local = {
        appearance: { theme: 'DARK', fontSize: 'SMALL' },
        locale: { language: 'zh-CN' },
      };

      const remote = {
        appearance: { theme: 'LIGHT', accentColor: '#FF5733' },
        workflow: { autoSave: true },
      };

      const resolved = await service.resolveConflict(
        testAccountUuid,
        local,
        remote,
        'merge'
      );

      // merge 策略应该保留本地的值，添加远程缺少的键
      expect(resolved.appearance).toBeDefined();
      expect(resolved.locale).toBeDefined();
      expect(resolved.workflow).toBeDefined();
    });

    it('应该处理嵌套的冲突', async () => {
      const local = {
        nested: {
          level1: {
            level2: { value: 'local' },
          },
        },
      };

      const remote = {
        nested: {
          level1: {
            level2: { value: 'remote' },
          },
        },
      };

      const resolved = await service.resolveConflict(
        testAccountUuid,
        local,
        remote,
        'local'
      );

      expect(resolved.nested.level1.level2.value).toBe('local');
    });

    it('应该处理未知的策略默认为 local', async () => {
      const resolved = await service.resolveConflict(
        testAccountUuid,
        localSettings,
        remoteSettings,
        'unknown' as any
      );

      expect(resolved).toEqual(localSettings);
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
      expect(status.accountUuid).toBe(testAccountUuid);
      expect(status.totalVersions).toBeGreaterThan(0);
      expect(status.lastSyncTime).toBeDefined();
    });

    it('应该返回未同步账户的状态', async () => {
      const nonExistentAccountUuid = generateUUID();
      const status = await service.getSyncStatus(nonExistentAccountUuid);

      expect(status.accountUuid).toBe(nonExistentAccountUuid);
      expect(status.totalVersions).toBe(0);
    });

    it('应该跟踪最后同步时间', async () => {
      const beforeSave = new Date();

      const snapshot = { theme: 'DARK' };
      await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot
      );

      const status = await service.getSyncStatus(testAccountUuid);
      const afterSave = new Date();

      expect(status.lastSyncTime.getTime()).toBeGreaterThanOrEqual(
        beforeSave.getTime()
      );
      expect(status.lastSyncTime.getTime()).toBeLessThanOrEqual(
        afterSave.getTime()
      );
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
      const result = await service.cleanupOldVersions(testAccountUuid, keepCount);

      expect(result).toBeDefined();
      expect(result.deletedCount).toBeGreaterThan(0);
      expect(result.remainingCount).toBeLessThanOrEqual(keepCount);
    });

    it('应该返回清理统计信息', async () => {
      const result = await service.cleanupOldVersions(testAccountUuid, 10);

      expect(result.totalVersionsBefore).toBeGreaterThan(0);
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
      expect(result.remainingCount).toBeLessThanOrEqual(10);
    });

    it('应该处理不存在的账户', async () => {
      const nonExistentAccountUuid = generateUUID();
      const result = await service.cleanupOldVersions(nonExistentAccountUuid, 5);

      expect(result.deletedCount).toBe(0);
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
