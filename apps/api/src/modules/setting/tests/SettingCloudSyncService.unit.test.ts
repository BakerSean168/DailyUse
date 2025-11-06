// @ts-nocheck
/**
 * SettingCloudSyncService 单元测试
 *
 * 测试云同步服务的核心功能：
 * - 版本快照保存
 * - 版本历史查询
 * - 版本恢复
 * - 冲突解决（本地/远程/合并策略）
 * - 同步状态查询
 * - 旧版本清理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingCloudSyncService } from '../application/services/SettingCloudSyncService';

describe('SettingCloudSyncService 单元测试', () => {
  let service: SettingCloudSyncService;
  const testAccountUuid = 'test-account-123';
  const testDeviceId = 'device-001';
  const testDeviceName = 'Test Device';

  const mockSnapshot = {
    appearance: {
      theme: 'DARK',
      fontSize: 'MEDIUM',
      accentColor: '#FF5733',
    },
    locale: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
    },
    workflow: {
      autoSave: true,
    },
  };

  beforeEach(() => {
    service = new SettingCloudSyncService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveSettingVersion', () => {
    it('应该成功保存设置版本快照', async () => {
      // Act
      const result = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.versionUuid).toBeDefined();
      expect(result.accountUuid).toBe(testAccountUuid);
      expect(result.deviceId).toBe(testDeviceId);
      expect(result.deviceName).toBe(testDeviceName);
      expect(result.settingSnapshot).toEqual(mockSnapshot);
      expect(result.versionNumber).toBe(1);
      expect(result.createdAt).toBeDefined();
    });

    it('应该为连续保存生成递增的版本号', async () => {
      // Act
      const version1 = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      const modifiedSnapshot = { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: 'LIGHT' } };
      const version2 = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        modifiedSnapshot,
      );

      // Assert
      expect(version2.versionNumber).toBe(version1.versionNumber + 1);
      expect(version1.versionUuid).not.toBe(version2.versionUuid);
    });

    it('应该保存不同设备的版本', async () => {
      // Act
      const device1Version = await service.saveSettingVersion(
        testAccountUuid,
        'device-001',
        'Device 1',
        mockSnapshot,
      );

      const device2Version = await service.saveSettingVersion(
        testAccountUuid,
        'device-002',
        'Device 2',
        mockSnapshot,
      );

      // Assert
      expect(device1Version.deviceId).toBe('device-001');
      expect(device2Version.deviceId).toBe('device-002');
      expect(device1Version.versionUuid).not.toBe(device2Version.versionUuid);
    });

    it('应该生成有效的 UUID', async () => {
      // Act
      const result = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      // Assert - UUID v4 format check
      const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidv4Regex.test(result.versionUuid)).toBe(true);
    });
  });

  describe('getSettingHistory', () => {
    it('应该返回用户的版本历史', async () => {
      // Arrange - 创建多个版本
      await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      const snapshot2 = { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: 'LIGHT' } };
      await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        snapshot2,
      );

      // Act
      const history = await service.getSettingHistory(testAccountUuid);

      // Assert
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);
      expect(history[0].versionNumber).toBeLessThan(history[1].versionNumber);
    });

    it('应该支持历史记录限制', async () => {
      // Arrange - 创建5个版本
      for (let i = 0; i < 5; i++) {
        const snapshot = { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: `variant-${i}` } };
        await service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          snapshot,
        );
      }

      // Act
      const limitedHistory = await service.getSettingHistory(testAccountUuid, 2);

      // Assert
      expect(limitedHistory.length).toBeLessThanOrEqual(2);
    });

    it('应该为不存在的用户返回空数组', async () => {
      // Act
      const history = await service.getSettingHistory('non-existent-user');

      // Assert
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    it('应该按创建时间倒序返回', async () => {
      // Arrange
      const v1 = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 100));

      const v2 = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      // Act
      const history = await service.getSettingHistory(testAccountUuid);

      // Assert - 最新的应该在最前面
      expect(history[0].createdAt.getTime()).toBeGreaterThanOrEqual(history[1].createdAt.getTime());
    });
  });

  describe('restoreSettingVersion', () => {
    it('应该成功恢复指定版本', async () => {
      // Arrange
      const saved = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      // Act
      const restored = await service.restoreSettingVersion(
        testAccountUuid,
        saved.versionUuid,
      );

      // Assert
      expect(restored).toBeDefined();
      expect(restored.settingSnapshot).toEqual(mockSnapshot);
      expect(restored.restoredAt).toBeDefined();
    });

    it('应该为不存在的版本 UUID 抛出错误', async () => {
      // Act & Assert
      await expect(
        service.restoreSettingVersion(testAccountUuid, 'invalid-uuid'),
      ).rejects.toThrow();
    });

    it('应该验证版本属于正确的用户', async () => {
      // Arrange
      const saved = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      // Act & Assert - 用不同用户尝试恢复
      await expect(
        service.restoreSettingVersion('other-user', saved.versionUuid),
      ).rejects.toThrow();
    });

    it('应该保留原始快照数据', async () => {
      // Arrange
      const complexSnapshot = {
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
        },
        workflow: {
          autoSave: false,
          autoSaveInterval: 10000,
        },
      };

      const saved = await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        complexSnapshot as any,
      );

      // Act
      const restored = await service.restoreSettingVersion(
        testAccountUuid,
        saved.versionUuid,
      );

      // Assert
      expect(restored.settingSnapshot).toEqual(complexSnapshot);
    });
  });

  describe('resolveConflict', () => {
    const localSettings = { appearance: { theme: 'DARK' } };
    const remoteSettings = { appearance: { theme: 'LIGHT' } };

    it('应该使用 local 策略保留本地版本', async () => {
      // Act
      const result = await service.resolveConflict(
        testAccountUuid,
        localSettings,
        remoteSettings,
        'local',
      );

      // Assert
      expect(result.resolvedSettings.appearance.theme).toBe('DARK');
      expect(result.strategy).toBe('local');
    });

    it('应该使用 remote 策略使用远程版本', async () => {
      // Act
      const result = await service.resolveConflict(
        testAccountUuid,
        localSettings,
        remoteSettings,
        'remote',
      );

      // Assert
      expect(result.resolvedSettings.appearance.theme).toBe('LIGHT');
      expect(result.strategy).toBe('remote');
    });

    it('应该使用 merge 策略深度合并', async () => {
      // Arrange
      const local = {
        appearance: { theme: 'DARK', fontSize: 'MEDIUM' },
        locale: { language: 'zh-CN' },
      };

      const remote = {
        appearance: { theme: 'LIGHT' },
        locale: { language: 'en-US', timezone: 'UTC' },
      };

      // Act
      const result = await service.resolveConflict(
        testAccountUuid,
        local,
        remote,
        'merge',
      );

      // Assert
      expect(result.resolvedSettings.appearance.theme).toBe('LIGHT'); // Remote wins
      expect(result.resolvedSettings.appearance.fontSize).toBe('MEDIUM'); // Local preserved
      expect(result.resolvedSettings.locale.language).toBe('en-US'); // Remote wins
      expect(result.resolvedSettings.locale.timezone).toBe('UTC'); // Remote preserved
      expect(result.strategy).toBe('merge');
    });

    it('应该返回冲突元数据', async () => {
      // Act
      const result = await service.resolveConflict(
        testAccountUuid,
        localSettings,
        remoteSettings,
        'local',
      );

      // Assert
      expect(result.conflictId).toBeDefined();
      expect(result.accountUuid).toBe(testAccountUuid);
      expect(result.resolvedAt).toBeDefined();
      expect(result.localSnapshot).toEqual(localSettings);
      expect(result.remoteSnapshot).toEqual(remoteSettings);
    });

    it('应该处理复杂的嵌套对象合并', async () => {
      // Arrange
      const local = {
        appearance: {
          theme: 'DARK',
          accentColor: '#FF0000',
          fontSize: 'MEDIUM',
        },
        workflow: {
          autoSave: true,
          confirmBeforeDelete: true,
        },
      };

      const remote = {
        appearance: {
          theme: 'LIGHT',
          fontSize: 'LARGE',
          fontFamily: 'Roboto',
        },
        privacy: {
          profileVisibility: 'PUBLIC',
        },
      };

      // Act
      const result = await service.resolveConflict(
        testAccountUuid,
        local,
        remote,
        'merge',
      );

      // Assert
      expect(result.resolvedSettings.appearance.theme).toBe('LIGHT');
      expect(result.resolvedSettings.appearance.fontSize).toBe('LARGE');
      expect(result.resolvedSettings.appearance.fontFamily).toBe('Roboto');
      expect(result.resolvedSettings.workflow.autoSave).toBe(true);
      expect(result.resolvedSettings.privacy.profileVisibility).toBe('PUBLIC');
    });
  });

  describe('getSyncStatus', () => {
    it('应该返回同步状态信息', async () => {
      // Arrange
      await service.saveSettingVersion(
        testAccountUuid,
        testDeviceId,
        testDeviceName,
        mockSnapshot,
      );

      // Act
      const status = await service.getSyncStatus(testAccountUuid);

      // Assert
      expect(status).toBeDefined();
      expect(status.accountUuid).toBe(testAccountUuid);
      expect(status.totalVersions).toBeGreaterThanOrEqual(1);
      expect(status.lastSyncAt).toBeDefined();
      expect(status.syncedDevices).toBeDefined();
      expect(Array.isArray(status.syncedDevices)).toBe(true);
    });

    it('应该包含同步设备信息', async () => {
      // Arrange
      await service.saveSettingVersion(
        testAccountUuid,
        'device-001',
        'Device 1',
        mockSnapshot,
      );

      await service.saveSettingVersion(
        testAccountUuid,
        'device-002',
        'Device 2',
        mockSnapshot,
      );

      // Act
      const status = await service.getSyncStatus(testAccountUuid);

      // Assert
      expect(status.syncedDevices).toHaveLength(2);
      const deviceIds = status.syncedDevices.map((d: any) => d.deviceId);
      expect(deviceIds).toContain('device-001');
      expect(deviceIds).toContain('device-002');
    });

    it('应该为未同步用户返回默认状态', async () => {
      // Act
      const status = await service.getSyncStatus('non-existent-user');

      // Assert
      expect(status.accountUuid).toBe('non-existent-user');
      expect(status.totalVersions).toBe(0);
      expect(status.syncedDevices).toEqual([]);
    });
  });

  describe('cleanupOldVersions', () => {
    it('应该删除旧版本保留最新版本', async () => {
      // Arrange - 创建5个版本
      for (let i = 0; i < 5; i++) {
        const snapshot = { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: `variant-${i}` } };
        await service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          snapshot,
        );
        // 小延迟以确保不同的时间戳
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const historyBefore = await service.getSettingHistory(testAccountUuid);
      expect(historyBefore.length).toBe(5);

      // Act - 保留最新3个
      const result = await service.cleanupOldVersions(testAccountUuid, 3);

      // Assert
      const historyAfter = await service.getSettingHistory(testAccountUuid);
      expect(historyAfter.length).toBeLessThanOrEqual(3);
      expect(result.deletedCount).toBeGreaterThanOrEqual(2);
      expect(result.remainingCount).toBeLessThanOrEqual(3);
    });

    it('应该为空历史返回 0 删除计数', async () => {
      // Act
      const result = await service.cleanupOldVersions('non-existent-user', 5);

      // Assert
      expect(result.deletedCount).toBe(0);
      expect(result.remainingCount).toBe(0);
    });

    it('应该在 keepCount 等于历史大小时不删除任何内容', async () => {
      // Arrange - 创建3个版本
      for (let i = 0; i < 3; i++) {
        const snapshot = { ...mockSnapshot };
        await service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          snapshot,
        );
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Act - 保留3个（等于当前数量）
      const result = await service.cleanupOldVersions(testAccountUuid, 3);

      // Assert
      expect(result.deletedCount).toBe(0);
      const history = await service.getSettingHistory(testAccountUuid);
      expect(history.length).toBe(3);
    });
  });

  describe('并发操作', () => {
    it('应该处理并发版本保存', async () => {
      // Act - 并发保存
      const promises = Array(5).fill(null).map((_, i) =>
        service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: `variant-${i}` } },
        ),
      );

      const results = await Promise.all(promises);

      // Assert
      expect(results.length).toBe(5);
      expect(new Set(results.map(r => r.versionUuid)).size).toBe(5); // 所有 UUID 唯一
    });

    it('应该在并发操作中保持版本号连续性', async () => {
      // Act
      const promises = Array(10).fill(null).map(() =>
        service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          mockSnapshot,
        ),
      );

      const results = await Promise.all(promises);

      // Assert
      const versionNumbers = results.map(r => r.versionNumber).sort((a, b) => a - b);
      for (let i = 0; i < versionNumbers.length - 1; i++) {
        expect(versionNumbers[i] + 1).toBe(versionNumbers[i + 1]);
      }
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的 JSON 快照', async () => {
      // Act & Assert
      await expect(
        service.saveSettingVersion(
          testAccountUuid,
          testDeviceId,
          testDeviceName,
          null as any,
        ),
      ).rejects.toThrow();
    });

    it('应该验证冲突解决策略', async () => {
      // Act & Assert
      await expect(
        service.resolveConflict(
          testAccountUuid,
          mockSnapshot,
          mockSnapshot,
          'invalid-strategy' as any,
        ),
      ).rejects.toThrow();
    });

    it('应该处理清理操作中的无效 keepCount', async () => {
      // Act & Assert
      await expect(
        service.cleanupOldVersions(testAccountUuid, -1),
      ).rejects.toThrow();
    });
  });
});
