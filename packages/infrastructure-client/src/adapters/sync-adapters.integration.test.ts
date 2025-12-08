/**
 * @fileoverview 同步适配器集成测试
 * @module @dailyuse/infrastructure-client/adapters
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type {
  ISyncAdapter,
  AdapterCredentials,
  EncryptedSyncData,
} from '@dailyuse/application-client/sync';
import { GitHubSyncAdapter } from './GitHubSyncAdapter';
import { NutstoreSyncAdapter } from './NutstoreSyncAdapter';
import { DropboxSyncAdapter } from './DropboxSyncAdapter';
import { SelfHostedServerAdapter } from './SelfHostedServerAdapter';
import { EncryptionService } from '../encryption/EncryptionService';

/**
 * 测试工具函数
 */
function createTestEntity(type: 'goal' | 'task' | 'reminder', overrides?: any) {
  const base = {
    id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  switch (type) {
    case 'goal':
      return {
        ...base,
        title: 'Test Goal',
        description: 'Test Description',
        status: 'in-progress',
        ...overrides,
      };
    case 'task':
      return {
        ...base,
        title: 'Test Task',
        completed: false,
        priority: 'medium',
        ...overrides,
      };
    case 'reminder':
      return {
        ...base,
        title: 'Test Reminder',
        dueDate: Date.now() + 86400000,
        repeat: 'none',
        ...overrides,
      };
  }
}

/**
 * 通用适配器测试套件
 */
function runAdapterIntegrationTests(
  adapterName: string,
  createAdapter: () => ISyncAdapter,
  skipRealTests = true
) {
  describe(`${adapterName} - Integration Tests`, () => {
    let adapter: ISyncAdapter;
    let encryptionService: EncryptionService;

    beforeEach(() => {
      adapter = createAdapter();
      encryptionService = new EncryptionService('test-password-12345', 'test-salt');
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    describe('基础连接', () => {
      it('应该能够初始化适配器', () => {
        expect(adapter).toBeDefined();
      });

      it('应该返回健康状态', async () => {
        const health = await adapter.checkHealth();
        expect(health).toHaveProperty('connected');
        expect(health).toHaveProperty('authenticated');
      });
    });

    describe('推送和拉取 (Mock)', () => {
      it('应该能够推送加密数据', async () => {
        const goal = createTestEntity('goal');
        const plaintext = JSON.stringify(goal);
        const encrypted = encryptionService.encrypt(plaintext);

        const result = await adapter.push('goal', goal.id, encrypted, 1);

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('version');
        expect(result).toHaveProperty('timestamp');
      });

      it('应该能够拉取数据', async () => {
        const result = await adapter.pull('goal', 0);

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('items');
        expect(result).toHaveProperty('cursor');
        expect(Array.isArray(result.items)).toBe(true);
      });
    });

    describe('批量操作', () => {
      it('应该支持批量推送', async () => {
        const items = [
          createTestEntity('goal'),
          createTestEntity('task'),
          createTestEntity('reminder'),
        ];

        const batchItems = items.map(item => ({
          entityType: item.id.includes('goal') ? 'goal' : item.id.includes('task') ? 'task' : 'reminder',
          entityId: item.id,
          data: encryptionService.encrypt(JSON.stringify(item)),
          version: 1,
        }));

        const result = await adapter.batchPush(batchItems);

        expect(result).toHaveProperty('succeeded');
        expect(result).toHaveProperty('failed');
        expect(result).toHaveProperty('conflicts');
        expect(typeof result.succeeded).toBe('number');
      });
    });

    describe('游标管理', () => {
      it('应该能够获取游标', async () => {
        const cursor = await adapter.getCursor('goal');

        expect(cursor).toHaveProperty('entityType');
        expect(cursor).toHaveProperty('lastSyncTimestamp');
        expect(cursor.entityType).toBe('goal');
      });

      it('应该能够更新游标', async () => {
        const newCursor = {
          entityType: 'goal',
          lastSyncTimestamp: Date.now(),
          lastSyncVersion: 5,
          createdAt: Date.now(),
        };

        await expect(adapter.updateCursor('goal', newCursor)).resolves.not.toThrow();
      });
    });

    describe('配额信息', () => {
      it('应该返回配额信息', async () => {
        const quota = await adapter.getQuota();

        expect(quota).toHaveProperty('used');
        expect(quota).toHaveProperty('total');
        expect(quota).toHaveProperty('available');
        expect(quota).toHaveProperty('usagePercent');
        expect(typeof quota.used).toBe('number');
        expect(typeof quota.total).toBe('number');
      });
    });

    describe('配置管理', () => {
      it('应该能够设置配置', async () => {
        const config = {
          retryCount: 5,
          timeout: 60000,
          enableCache: true,
        };

        await expect(adapter.setConfig(config)).resolves.not.toThrow();
      });

      it('应该能够获取配置', async () => {
        const config = await adapter.getConfig();

        expect(config).toHaveProperty('retryCount');
        expect(config).toHaveProperty('timeout');
        expect(config).toHaveProperty('enableCache');
      });
    });

    describe('导出和导入', () => {
      it('应该支持数据导出', async () => {
        const exported = await adapter.exportAll();

        expect(exported).toHaveProperty('version');
        expect(exported).toHaveProperty('exportedAt');
        expect(exported).toHaveProperty('items');
        expect(Array.isArray(exported.items)).toBe(true);
      });

      it('应该支持数据导入', async () => {
        const data = {
          version: 1,
          exportedAt: Date.now(),
          checksum: 'test-checksum',
          items: [],
          metadata: {},
        };

        await expect(adapter.importData(data)).resolves.not.toThrow();
      });
    });

    describe('缓存清理', () => {
      it('应该能够清空缓存', async () => {
        await expect(adapter.clearCache()).resolves.not.toThrow();
      });
    });

    // 真实测试（需要配置环境变量）
    if (!skipRealTests) {
      describe('真实 API 测试', () => {
        it.skip('应该能够完整的推送-拉取流程', async () => {
          // 此测试需要真实的 API credentials
          const goal = createTestEntity('goal');
          const plaintext = JSON.stringify(goal);
          const encrypted = encryptionService.encrypt(plaintext);

          // 推送
          const pushResult = await adapter.push('goal', goal.id, encrypted, 1);
          expect(pushResult.success).toBe(true);

          // 拉取
          const pullResult = await adapter.pull('goal', 0);
          expect(pullResult.success).toBe(true);

          // 查找我们推送的数据
          const item = pullResult.items.find(i => i.entityId === goal.id);
          expect(item).toBeDefined();

          // 解密并验证
          const decrypted = encryptionService.decrypt(item!.data);
          const parsed = JSON.parse(decrypted);
          expect(parsed).toEqual(goal);
        });
      });
    }
  });
}

// 运行所有适配器的测试
describe('All Sync Adapters - Integration Tests', () => {
  // GitHub 适配器
  runAdapterIntegrationTests(
    'GitHubSyncAdapter',
    () =>
      new GitHubSyncAdapter({
        provider: 'github',
        token: process.env.GITHUB_TEST_TOKEN || 'mock-token',
        repoPath: process.env.GITHUB_TEST_REPO || 'test-user/dailyuse-test',
        encryptionKey: 'test-password-12345',
      }),
    !process.env.GITHUB_TEST_TOKEN // 如果没有真实 token，跳过真实测试
  );

  // Nutstore 适配器
  runAdapterIntegrationTests(
    'NutstoreSyncAdapter',
    () =>
      new NutstoreSyncAdapter({
        provider: 'nutstore',
        username: process.env.NUTSTORE_TEST_EMAIL || 'test@example.com',
        token: process.env.NUTSTORE_TEST_PASSWORD || 'mock-password',
        encryptionKey: 'test-password-12345',
      }),
    !process.env.NUTSTORE_TEST_EMAIL
  );

  // Dropbox 适配器
  runAdapterIntegrationTests(
    'DropboxSyncAdapter',
    () =>
      new DropboxSyncAdapter({
        provider: 'dropbox',
        token: process.env.DROPBOX_TEST_TOKEN || 'mock-token',
        encryptionKey: 'test-password-12345',
      }),
    !process.env.DROPBOX_TEST_TOKEN
  );

  // Self-Hosted 适配器
  runAdapterIntegrationTests(
    'SelfHostedServerAdapter',
    () =>
      new SelfHostedServerAdapter({
        provider: 'self-hosted',
        serverUrl: process.env.WEBDAV_TEST_URL || 'http://localhost:8080/webdav',
        username: process.env.WEBDAV_TEST_USER || 'test-user',
        token: process.env.WEBDAV_TEST_PASSWORD || 'mock-password',
        encryptionKey: 'test-password-12345',
      }),
    !process.env.WEBDAV_TEST_URL
  );
});

/**
 * 跨适配器一致性测试
 */
describe('Cross-Adapter Consistency Tests', () => {
  const adapters: Array<{ name: string; adapter: ISyncAdapter }> = [
    {
      name: 'GitHub',
      adapter: new GitHubSyncAdapter({
        provider: 'github',
        token: 'mock-token',
        repoPath: 'test/test',
        encryptionKey: 'test-password-12345',
      }),
    },
    {
      name: 'Nutstore',
      adapter: new NutstoreSyncAdapter({
        provider: 'nutstore',
        username: 'test@test.com',
        token: 'mock-password',
        encryptionKey: 'test-password-12345',
      }),
    },
    {
      name: 'Dropbox',
      adapter: new DropboxSyncAdapter({
        provider: 'dropbox',
        token: 'mock-token',
        encryptionKey: 'test-password-12345',
      }),
    },
    {
      name: 'Self-Hosted',
      adapter: new SelfHostedServerAdapter({
        provider: 'self-hosted',
        serverUrl: 'http://localhost/webdav',
        username: 'test',
        token: 'test',
        encryptionKey: 'test-password-12345',
      }),
    },
  ];

  it('所有适配器应该实现相同的接口', () => {
    adapters.forEach(({ name, adapter }) => {
      expect(adapter.authenticate, `${name}.authenticate`).toBeDefined();
      expect(adapter.push, `${name}.push`).toBeDefined();
      expect(adapter.pull, `${name}.pull`).toBeDefined();
      expect(adapter.batchPush, `${name}.batchPush`).toBeDefined();
      expect(adapter.checkHealth, `${name}.checkHealth`).toBeDefined();
      expect(adapter.getQuota, `${name}.getQuota`).toBeDefined();
      expect(adapter.disconnect, `${name}.disconnect`).toBeDefined();
    });
  });

  it('所有适配器的 push 方法应该返回相同结构', async () => {
    const encryptionService = new EncryptionService('test-password-12345', 'test-salt');
    const testData = createTestEntity('goal');
    const encrypted = encryptionService.encrypt(JSON.stringify(testData));

    for (const { name, adapter } of adapters) {
      const result = await adapter.push('goal', testData.id, encrypted, 1);

      expect(result, `${name} push result`).toHaveProperty('success');
      expect(result, `${name} push result`).toHaveProperty('version');
      expect(result, `${name} push result`).toHaveProperty('timestamp');
      expect(typeof result.success, `${name}.success type`).toBe('boolean');
      expect(typeof result.version, `${name}.version type`).toBe('number');
      expect(typeof result.timestamp, `${name}.timestamp type`).toBe('number');
    }
  });

  it('所有适配器的 pull 方法应该返回相同结构', async () => {
    for (const { name, adapter } of adapters) {
      const result = await adapter.pull('goal', 0);

      expect(result, `${name} pull result`).toHaveProperty('success');
      expect(result, `${name} pull result`).toHaveProperty('items');
      expect(result, `${name} pull result`).toHaveProperty('cursor');
      expect(Array.isArray(result.items), `${name}.items is array`).toBe(true);
    }
  });

  it('所有适配器应该能够处理相同的加密数据', async () => {
    const encryptionService = new EncryptionService('test-password-12345', 'test-salt');
    const testData = createTestEntity('goal');
    const plaintext = JSON.stringify(testData);
    const encrypted = encryptionService.encrypt(plaintext);

    // 验证加密数据结构
    expect(encrypted).toHaveProperty('encryptedPayload');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('authTag');
    expect(encrypted).toHaveProperty('keyVersion');
    expect(encrypted).toHaveProperty('checksum');

    // 所有适配器都应该能够接受这个格式
    for (const { name, adapter } of adapters) {
      await expect(
        adapter.push('goal', testData.id, encrypted, 1),
        `${name} should accept encrypted data`
      ).resolves.toBeDefined();
    }
  });
});
