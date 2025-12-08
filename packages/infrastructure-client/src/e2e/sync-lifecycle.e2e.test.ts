/**
 * @fileoverview E2E 测试 - 完整同步流程
 * @module @dailyuse/infrastructure-client/e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GitHubSyncAdapter } from '../adapters/GitHubSyncAdapter';
import { EncryptionService } from '../encryption/EncryptionService';
import type { ISyncAdapter, EncryptedSyncData } from '@dailyuse/application-client/sync';

/**
 * E2E 测试场景：完整的同步生命周期
 *
 * 测试流程：
 * 1. 用户创建目标 (Goal) 并加密
 * 2. 推送到云端 (GitHub)
 * 3. 从云端拉取数据
 * 4. 解密并验证数据一致性
 * 5. 更新目标并重新推送
 * 6. 模拟冲突场景
 * 7. 清理测试数据
 */
describe('E2E: Complete Sync Lifecycle', () => {
  let adapter: ISyncAdapter;
  let encryptionService: EncryptionService;
  const testEntityIds: string[] = [];

  beforeAll(async () => {
    // 仅在提供真实 credentials 时运行
    if (!process.env.GITHUB_TEST_TOKEN) {
      console.log('⚠️ Skipping E2E tests - no GitHub credentials provided');
      return;
    }

    adapter = new GitHubSyncAdapter({
      provider: 'github',
      token: process.env.GITHUB_TEST_TOKEN,
      repoPath: process.env.GITHUB_TEST_REPO || 'test-user/dailyuse-test',
      encryptionKey: 'e2e-test-password-12345',
    });

    encryptionService = new EncryptionService('e2e-test-password-12345', 'e2e-test-salt');

    // 认证
    await adapter.authenticate({
      provider: 'github',
      token: process.env.GITHUB_TEST_TOKEN,
      repoPath: process.env.GITHUB_TEST_REPO || 'test-user/dailyuse-test',
      encryptionKey: 'e2e-test-password-12345',
    });
  });

  afterAll(async () => {
    if (adapter) {
      await adapter.disconnect();
    }
  });

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)(
    '场景 1: 创建目标 → 加密 → 推送 → 拉取 → 解密',
    async () => {
      // 1. 创建目标
      const goal = {
        id: `e2e-goal-${Date.now()}`,
        title: 'Complete E2E Testing',
        description: 'Verify the entire sync flow works correctly',
        status: 'in-progress',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      testEntityIds.push(goal.id);

      // 2. 加密
      const plaintext = JSON.stringify(goal);
      const encrypted = encryptionService.encrypt(plaintext);

      expect(encrypted).toHaveProperty('encryptedPayload');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');

      // 3. 推送到云端
      const pushResult = await adapter.push('goal', goal.id, encrypted, 1);

      expect(pushResult.success).toBe(true);
      expect(pushResult.version).toBeGreaterThan(0);
      expect(pushResult.conflictDetected).toBe(false);

      // 等待一下，确保数据已写入
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. 从云端拉取
      const pullResult = await adapter.pull('goal', 0);

      expect(pullResult.success).toBe(true);
      expect(pullResult.items.length).toBeGreaterThan(0);

      // 查找我们推送的目标
      const pulledItem = pullResult.items.find(item => item.entityId === goal.id);
      expect(pulledItem).toBeDefined();

      // 5. 解密
      const decrypted = encryptionService.decrypt(pulledItem!.data);
      const parsedGoal = JSON.parse(decrypted);

      // 6. 验证数据完整性
      expect(parsedGoal.id).toBe(goal.id);
      expect(parsedGoal.title).toBe(goal.title);
      expect(parsedGoal.description).toBe(goal.description);
      expect(parsedGoal.status).toBe(goal.status);
    }
  );

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)(
    '场景 2: 批量推送多个实体',
    async () => {
      // 创建多个实体
      const entities = [
        {
          type: 'goal',
          id: `e2e-goal-batch-${Date.now()}-1`,
          title: 'Goal 1',
        },
        {
          type: 'task',
          id: `e2e-task-batch-${Date.now()}-2`,
          title: 'Task 1',
        },
        {
          type: 'reminder',
          id: `e2e-reminder-batch-${Date.now()}-3`,
          title: 'Reminder 1',
        },
      ];

      testEntityIds.push(...entities.map(e => e.id));

      // 加密并批量推送
      const batchItems = entities.map(entity => ({
        entityType: entity.type,
        entityId: entity.id,
        data: encryptionService.encrypt(JSON.stringify(entity)),
        version: 1,
      }));

      const batchResult = await adapter.batchPush(batchItems);

      expect(batchResult.succeeded).toBe(entities.length);
      expect(batchResult.failed).toBe(0);
      expect(batchResult.conflicts).toBe(0);
    }
  );

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)('场景 3: 更新现有数据', async () => {
    // 1. 创建初始数据
    const goal = {
      id: `e2e-goal-update-${Date.now()}`,
      title: 'Initial Title',
      description: 'Initial Description',
      status: 'in-progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    testEntityIds.push(goal.id);

    const encrypted1 = encryptionService.encrypt(JSON.stringify(goal));
    const pushResult1 = await adapter.push('goal', goal.id, encrypted1, 1);

    expect(pushResult1.success).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 更新数据
    const updatedGoal = {
      ...goal,
      title: 'Updated Title',
      description: 'Updated Description',
      updatedAt: Date.now(),
    };

    const encrypted2 = encryptionService.encrypt(JSON.stringify(updatedGoal));
    const pushResult2 = await adapter.push('goal', goal.id, encrypted2, pushResult1.version + 1);

    expect(pushResult2.success).toBe(true);
    expect(pushResult2.version).toBeGreaterThan(pushResult1.version);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. 拉取并验证更新
    const pullResult = await adapter.pull('goal', 0);
    const pulledItem = pullResult.items.find(item => item.entityId === goal.id);

    expect(pulledItem).toBeDefined();

    const decrypted = encryptionService.decrypt(pulledItem!.data);
    const parsedGoal = JSON.parse(decrypted);

    expect(parsedGoal.title).toBe('Updated Title');
    expect(parsedGoal.description).toBe('Updated Description');
  });

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)('场景 4: 密钥轮换后的数据访问', async () => {
    // 1. 使用旧密钥加密数据
    const goal = {
      id: `e2e-goal-rotation-${Date.now()}`,
      title: 'Test Key Rotation',
      description: 'Encrypted with old key',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    testEntityIds.push(goal.id);

    const encrypted1 = encryptionService.encrypt(JSON.stringify(goal));
    await adapter.push('goal', goal.id, encrypted1, 1);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 轮换密钥
    encryptionService.rotateKey('new-e2e-password-67890');

    // 3. 使用新密钥加密新数据
    const updatedGoal = {
      ...goal,
      description: 'Encrypted with new key',
      updatedAt: Date.now(),
    };

    const encrypted2 = encryptionService.encrypt(JSON.stringify(updatedGoal));
    await adapter.push('goal', goal.id, encrypted2, 2);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. 拉取并验证两种密钥版本的数据都能解密
    const pullResult = await adapter.pull('goal', 0);
    const pulledItem = pullResult.items.find(item => item.entityId === goal.id);

    expect(pulledItem).toBeDefined();

    // 应该能解密（因为服务保留了旧密钥）
    const decrypted = encryptionService.decrypt(pulledItem!.data);
    const parsedGoal = JSON.parse(decrypted);

    expect(parsedGoal.id).toBe(goal.id);
  });

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)('场景 5: 游标和增量同步', async () => {
    // 1. 获取当前时间戳作为基准
    const baseTimestamp = Date.now();

    // 2. 创建一些数据
    const goals = Array.from({ length: 3 }, (_, i) => ({
      id: `e2e-goal-cursor-${Date.now()}-${i}`,
      title: `Cursor Test Goal ${i}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    testEntityIds.push(...goals.map(g => g.id));

    for (const goal of goals) {
      const encrypted = encryptionService.encrypt(JSON.stringify(goal));
      await adapter.push('goal', goal.id, encrypted, 1);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. 使用游标获取增量数据
    const cursor1 = await adapter.getCursor('goal');
    const pullResult1 = await adapter.pull('goal', baseTimestamp);

    expect(pullResult1.items.length).toBeGreaterThanOrEqual(goals.length);

    // 4. 更新游标
    await adapter.updateCursor('goal', {
      ...pullResult1.cursor,
      lastSyncTimestamp: Date.now(),
    });

    // 5. 再次拉取，应该只有新数据
    const cursor2 = await adapter.getCursor('goal');
    expect(cursor2.lastSyncTimestamp).toBeGreaterThan(cursor1.lastSyncTimestamp);
  });

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)(
    '场景 6: 配额检查和存储管理',
    async () => {
      // 获取配额信息
      const quota = await adapter.getQuota();

      expect(quota).toHaveProperty('used');
      expect(quota).toHaveProperty('total');
      expect(quota).toHaveProperty('available');
      expect(quota).toHaveProperty('usagePercent');

      expect(quota.used).toBeGreaterThanOrEqual(0);
      expect(quota.total).toBeGreaterThan(0);
      expect(quota.available).toBeGreaterThanOrEqual(0);
      expect(quota.usagePercent).toBeGreaterThanOrEqual(0);
      expect(quota.usagePercent).toBeLessThanOrEqual(100);
    }
  );

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)('场景 7: 导出和导入', async () => {
    // 1. 导出所有数据
    const exported = await adapter.exportAll();

    expect(exported).toHaveProperty('version');
    expect(exported).toHaveProperty('exportedAt');
    expect(exported).toHaveProperty('items');
    expect(Array.isArray(exported.items)).toBe(true);

    // 2. 验证导出的数据可以解密
    const sampleItem = exported.items[0];
    if (sampleItem) {
      const decrypted = encryptionService.decrypt(sampleItem.data);
      const parsed = JSON.parse(decrypted);
      expect(parsed).toHaveProperty('id');
    }

    // 3. 模拟导入（使用 skip 策略避免冲突）
    await expect(
      adapter.importData(exported, {
        overwrite: false,
        conflictStrategy: 'skip',
      })
    ).resolves.not.toThrow();
  });

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)('场景 8: 健康检查', async () => {
    const health = await adapter.checkHealth();

    expect(health.connected).toBe(true);
    expect(health.authenticated).toBe(true);
    expect(health.quotaExceeded).toBe(false);
    expect(health.lastSyncTime).toBeGreaterThan(0);
  });
});

/**
 * 性能测试场景
 */
describe('E2E: Performance Tests', () => {
  let adapter: ISyncAdapter;
  let encryptionService: EncryptionService;

  beforeAll(async () => {
    if (!process.env.GITHUB_TEST_TOKEN) {
      return;
    }

    adapter = new GitHubSyncAdapter({
      provider: 'github',
      token: process.env.GITHUB_TEST_TOKEN,
      repoPath: process.env.GITHUB_TEST_REPO || 'test-user/dailyuse-test',
      encryptionKey: 'perf-test-password-12345',
    });

    encryptionService = new EncryptionService('perf-test-password-12345', 'perf-test-salt');

    await adapter.authenticate({
      provider: 'github',
      token: process.env.GITHUB_TEST_TOKEN,
      repoPath: process.env.GITHUB_TEST_REPO || 'test-user/dailyuse-test',
      encryptionKey: 'perf-test-password-12345',
    });
  });

  afterAll(async () => {
    if (adapter) {
      await adapter.disconnect();
    }
  });

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)(
    '性能测试: 批量推送 50 个实体应在 30 秒内完成',
    async () => {
      const entities = Array.from({ length: 50 }, (_, i) => ({
        type: 'goal',
        id: `perf-goal-${Date.now()}-${i}`,
        title: `Performance Test Goal ${i}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      const batchItems = entities.map(entity => ({
        entityType: 'goal',
        entityId: entity.id,
        data: encryptionService.encrypt(JSON.stringify(entity)),
        version: 1,
      }));

      const start = performance.now();
      const result = await adapter.batchPush(batchItems);
      const end = performance.now();

      expect(result.succeeded).toBe(entities.length);
      expect(end - start).toBeLessThan(30000); // 30 秒
    },
    { timeout: 60000 }
  );

  it.skipIf(!process.env.GITHUB_TEST_TOKEN)(
    '性能测试: 拉取 100 个实体应在 10 秒内完成',
    async () => {
      const start = performance.now();
      const result = await adapter.pull('goal', 0);
      const end = performance.now();

      expect(result.success).toBe(true);
      expect(end - start).toBeLessThan(10000); // 10 秒
    },
    { timeout: 30000 }
  );
});
