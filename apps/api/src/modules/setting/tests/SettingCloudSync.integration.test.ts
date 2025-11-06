// @ts-nocheck
/**
 * Setting 云同步端点集成测试
 *
 * 测试完整的 HTTP 端点集成：
 * - 版本保存端点
 * - 历史查询端点
 * - 版本恢复端点
 * - 冲突解决端点
 * - 同步状态端点
 * - 版本清理端点
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../../../test/app-factory';
import { request } from 'supertest';
import type { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../../test/setup-database';

describe('Setting 云同步端点集成测试', () => {
  let app: Application;
  let prisma: PrismaClient;
  let authToken: string;
  const testAccountUuid = `test-account-${Date.now()}`;

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

  beforeEach(async () => {
    // 初始化应用和数据库
    app = await createApp();
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

    // 生成 JWT token（模拟认证）
    const payload = {
      accountUuid: testAccountUuid,
      username: 'testuser',
      email: `test-${Date.now()}@example.com`,
    };
    authToken = generateJWT(payload);
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.userSetting.deleteMany({
      where: { accountUuid: testAccountUuid },
    });
  });

  describe('POST /api/v1/settings/sync/save-version', () => {
    it('应该成功保存设置版本', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-001',
          deviceName: 'Test Device',
          snapshot: mockSnapshot,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.versionUuid).toBeDefined();
      expect(response.body.data.accountUuid).toBe(testAccountUuid);
      expect(response.body.data.deviceId).toBe('device-001');
      expect(response.body.data.settingSnapshot).toEqual(mockSnapshot);
    });

    it('应该在未认证时返回 401', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .send({
          deviceId: 'device-001',
          deviceName: 'Test Device',
          snapshot: mockSnapshot,
        });

      // Assert
      expect(response.status).toBe(401);
    });

    it('应该验证必需的请求字段', async () => {
      // Act - 缺少 snapshot
      const response = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-001',
          deviceName: 'Test Device',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/settings/sync/history', () => {
    beforeEach(async () => {
      // 创建测试版本
      for (let i = 0; i < 3; i++) {
        const snapshot = { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: `variant-${i}` } };
        await request(app)
          .post('/api/v1/settings/sync/save-version')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            deviceId: 'device-001',
            deviceName: 'Test Device',
            snapshot,
          });
      }
    });

    it('应该返回版本历史', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/settings/sync/history')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('应该支持历史记录限制查询参数', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/settings/sync/history?limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('应该在未认证时返回 401', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/settings/sync/history');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/settings/sync/restore', () => {
    let versionUuid: string;

    beforeEach(async () => {
      // 创建要恢复的版本
      const saveResponse = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-001',
          deviceName: 'Test Device',
          snapshot: mockSnapshot,
        });

      versionUuid = saveResponse.body.data.versionUuid;
    });

    it('应该成功恢复版本', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/restore')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ versionUuid });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.settingSnapshot).toEqual(mockSnapshot);
      expect(response.body.data.restoredAt).toBeDefined();
    });

    it('应该验证版本 UUID 格式', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/restore')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ versionUuid: 'invalid-uuid' });

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该为不存在的版本返回 404', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/restore')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ versionUuid: '00000000-0000-4000-8000-000000000000' });

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/settings/sync/resolve-conflict', () => {
    const localSettings = { appearance: { theme: 'DARK' } };
    const remoteSettings = { appearance: { theme: 'LIGHT' } };

    it('应该使用 local 策略解决冲突', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/resolve-conflict')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          local: localSettings,
          remote: remoteSettings,
          strategy: 'local',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.resolvedSettings.appearance.theme).toBe('DARK');
      expect(response.body.data.strategy).toBe('local');
    });

    it('应该使用 remote 策略解决冲突', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/resolve-conflict')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          local: localSettings,
          remote: remoteSettings,
          strategy: 'remote',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.resolvedSettings.appearance.theme).toBe('LIGHT');
    });

    it('应该使用 merge 策略进行深度合并', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/resolve-conflict')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          local: {
            appearance: { theme: 'DARK', fontSize: 'MEDIUM' },
            locale: { language: 'zh-CN' },
          },
          remote: {
            appearance: { theme: 'LIGHT' },
            locale: { language: 'en-US', timezone: 'UTC' },
          },
          strategy: 'merge',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.resolvedSettings.appearance.theme).toBe('LIGHT');
      expect(response.body.data.resolvedSettings.appearance.fontSize).toBe('MEDIUM');
      expect(response.body.data.resolvedSettings.locale.timezone).toBe('UTC');
    });

    it('应该验证策略参数', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/resolve-conflict')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          local: localSettings,
          remote: remoteSettings,
          strategy: 'invalid-strategy',
        });

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/settings/sync/status', () => {
    beforeEach(async () => {
      // 创建一些版本
      for (let i = 1; i <= 2; i++) {
        await request(app)
          .post('/api/v1/settings/sync/save-version')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            deviceId: `device-${i}`,
            deviceName: `Device ${i}`,
            snapshot: mockSnapshot,
          });
      }
    });

    it('应该返回同步状态', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/settings/sync/status')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.accountUuid).toBe(testAccountUuid);
      expect(response.body.data.totalVersions).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(response.body.data.syncedDevices)).toBe(true);
      expect(response.body.data.lastSyncAt).toBeDefined();
    });

    it('应该包含所有同步的设备', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/settings/sync/status')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      const deviceIds = response.body.data.syncedDevices.map((d: any) => d.deviceId);
      expect(deviceIds).toContain('device-1');
      expect(deviceIds).toContain('device-2');
    });

    it('应该在未认证时返回 401', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/settings/sync/status');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/settings/sync/cleanup', () => {
    beforeEach(async () => {
      // 创建多个版本用于清理
      for (let i = 0; i < 5; i++) {
        const snapshot = { ...mockSnapshot };
        await request(app)
          .post('/api/v1/settings/sync/save-version')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            deviceId: 'device-001',
            deviceName: 'Test Device',
            snapshot,
          });
      }
    });

    it('应该成功清理旧版本', async () => {
      // Act
      const response = await request(app)
        .delete('/api/v1/settings/sync/cleanup?keepCount=2')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.deletedCount).toBeGreaterThanOrEqual(0);
      expect(response.body.data.remainingCount).toBeLessThanOrEqual(2);
    });

    it('应该验证 keepCount 参数', async () => {
      // Act
      const response = await request(app)
        .delete('/api/v1/settings/sync/cleanup?keepCount=-1')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该为未认证用户返回 401', async () => {
      // Act
      const response = await request(app)
        .delete('/api/v1/settings/sync/cleanup?keepCount=2');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('完整的同步流程', () => {
    it('应该支持完整的版本管理流程', async () => {
      // 1. 保存初始版本
      const saveResponse1 = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-001',
          deviceName: 'Device 1',
          snapshot: mockSnapshot,
        });

      expect(saveResponse1.status).toBe(200);
      const version1 = saveResponse1.body.data.versionUuid;

      // 2. 修改并保存新版本
      const modifiedSnapshot = { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: 'LIGHT' } };
      const saveResponse2 = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-001',
          deviceName: 'Device 1',
          snapshot: modifiedSnapshot,
        });

      expect(saveResponse2.status).toBe(200);

      // 3. 查询历史
      const historyResponse = await request(app)
        .get('/api/v1/settings/sync/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.data.length).toBeGreaterThanOrEqual(2);

      // 4. 恢复到第一个版本
      const restoreResponse = await request(app)
        .post('/api/v1/settings/sync/restore')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ versionUuid: version1 });

      expect(restoreResponse.status).toBe(200);
      expect(restoreResponse.body.data.settingSnapshot).toEqual(mockSnapshot);

      // 5. 检查同步状态
      const statusResponse = await request(app)
        .get('/api/v1/settings/sync/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.totalVersions).toBeGreaterThanOrEqual(2);
    });

    it('应该处理多设备同步场景', async () => {
      // 设备1 保存版本
      const device1Response = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-001',
          deviceName: 'Laptop',
          snapshot: { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: 'DARK' } },
        });

      expect(device1Response.status).toBe(200);

      // 设备2 保存版本（冲突）
      const device2Response = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-002',
          deviceName: 'Desktop',
          snapshot: { ...mockSnapshot, appearance: { ...mockSnapshot.appearance, theme: 'LIGHT' } },
        });

      expect(device2Response.status).toBe(200);

      // 解决冲突
      const resolveResponse = await request(app)
        .post('/api/v1/settings/sync/resolve-conflict')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          local: device1Response.body.data.settingSnapshot,
          remote: device2Response.body.data.settingSnapshot,
          strategy: 'merge',
        });

      expect(resolveResponse.status).toBe(200);

      // 检查同步状态
      const statusResponse = await request(app)
        .get('/api/v1/settings/sync/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.syncedDevices.length).toBe(2);
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理无效的 JSON 快照', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-001',
          deviceName: 'Test Device',
          snapshot: null,
        });

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该处理过大的快照', async () => {
      // 创建过大的快照
      const largeSnapshot = {
        appearance: mockSnapshot.appearance,
        locale: mockSnapshot.locale,
        workflow: mockSnapshot.workflow,
        largeData: 'x'.repeat(10000000), // 10MB
      };

      // Act
      const response = await request(app)
        .post('/api/v1/settings/sync/save-version')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'device-001',
          deviceName: 'Test Device',
          snapshot: largeSnapshot,
        });

      // Assert - 应该被拒绝或返回错误
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该处理并发清理操作', async () => {
      // 创建版本
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/settings/sync/save-version')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            deviceId: 'device-001',
            deviceName: 'Test Device',
            snapshot: mockSnapshot,
          });
      }

      // Act - 并发清理
      const cleanupPromises = Array(3).fill(null).map(() =>
        request(app)
          .delete('/api/v1/settings/sync/cleanup?keepCount=2')
          .set('Authorization', `Bearer ${authToken}`),
      );

      const responses = await Promise.all(cleanupPromises);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

/**
 * Helper function to generate JWT token for testing
 */
function generateJWT(payload: any): string {
  // This is a simplified version - in real tests you should use your actual JWT generator
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from('test-signature').toString('base64');
  return `${header}.${body}.${signature}`;
}
