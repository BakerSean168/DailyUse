# STORY-055: 云同步集成测试与验证

## 📋 Story 概述

**Story ID**: STORY-055  
**Epic**: EPIC-009 (Cloud Sync Integration)  
**优先级**: P0 (质量保证)  
**预估工时**: 5 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-043 ~ STORY-054

---

## 🎯 用户故事

**作为** DailyUse 质量保证团队  
**我希望** 有完整的集成测试验证所有云同步功能  
**以便于** 确保多提供商同步的稳定性和数据安全性

---

## 📋 验收标准

### 单元测试覆盖率验收

- [ ] SyncAdapter 接口: 100% 覆盖
- [ ] EncryptionService: 100% 覆盖
- [ ] GitHubSyncAdapter: 90% 覆盖
- [ ] NutstoreSyncAdapter: 90% 覆盖
- [ ] DropboxSyncAdapter: 90% 覆盖
- [ ] 总体覆盖率 > 85%

### 集成测试验收

- [ ] 完整的同步流程测试 (所有提供商)
- [ ] 冲突检测和解决
- [ ] 密钥轮换
- [ ] 网络错误和重试
- [ ] 并发操作
- [ ] API 限流处理

### E2E 测试验收

- [ ] 应用启动到完整同步
- [ ] 多设备同步
- [ ] 加密数据完整性
- [ ] 用户界面流程

### 安全测试验收

- [ ] 密钥不泄露到日志
- [ ] 网络流量加密
- [ ] 认证令牌安全存储
- [ ] 数据完整性验证
- [ ] 权限检查

### 性能测试验收

- [ ] 小数据集 (< 100 项): < 2s
- [ ] 中等数据集 (100-1000 项): < 10s
- [ ] 大数据集 (> 1000 项): < 60s
- [ ] 内存使用 < 100MB
- [ ] CPU 使用 < 30%

### 兼容性测试验收

- [ ] 不同 Node.js 版本
- [ ] 不同操作系统 (Windows, macOS, Linux)
- [ ] 不同网络环境
- [ ] 离线-在线切换

---

## 🔧 技术方案

### 测试框架设置

```typescript
// packages/test-utils/src/sync-test-utils.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockAdapter } from './mocks/MockAdapter';
import { EncryptionService } from '@packages/infrastructure-client';

/**
 * 同步测试工具函数
 */

/**
 * 创建测试用 Adapter
 */
export function createTestAdapter(
  provider: string,
  credentials?: Partial<AdapterCredentials>
) {
  return new MockAdapter({
    provider,
    token: credentials?.token || 'test-token',
    encryptionKey: credentials?.encryptionKey || 'test-password-123',
    ...(credentials || {}),
  });
}

/**
 * 创建测试加密服务
 */
export function createTestEncryptionService() {
  return new EncryptionService('test-password-12345');
}

/**
 * 生成测试数据
 */
export function generateTestEntity(
  type: 'goal' | 'task' | 'reminder',
  overrides?: any
) {
  const base = {
    id: `test-${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  switch (type) {
    case 'goal':
      return {
        ...base,
        title: 'Test Goal',
        description: 'Test Description',
        ...overrides,
      };
    case 'task':
      return {
        ...base,
        title: 'Test Task',
        completed: false,
        ...overrides,
      };
    case 'reminder':
      return {
        ...base,
        title: 'Test Reminder',
        dueDate: Date.now() + 86400000,
        ...overrides,
      };
  }
}

/**
 * 比较加密/解密循环
 */
export async function testEncryptionCycle(
  encryptionService: EncryptionService,
  data: any
) {
  const plaintext = JSON.stringify(data);
  const encrypted = encryptionService.encrypt(plaintext);
  const decrypted = encryptionService.decrypt(encrypted as any);
  
  expect(decrypted).toBe(plaintext);
  expect(JSON.parse(decrypted)).toEqual(data);
}

/**
 * 测试数据完整性
 */
export async function verifyDataIntegrity(
  original: any,
  decrypted: string
) {
  const parsed = JSON.parse(decrypted);
  expect(parsed).toEqual(original);
}
```

### EncryptionService 单元测试

```typescript
// packages/infrastructure-client/src/encryption/EncryptionService.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from './EncryptionService';

describe('EncryptionService', () => {
  let service: EncryptionService;
  
  beforeEach(() => {
    service = new EncryptionService('test-password-12345', 'test-salt');
  });
  
  describe('基础加密', () => {
    it('应该加密和解密字符串数据', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted as any);
      
      expect(decrypted).toBe(plaintext);
    });
    
    it('应该加密和解密 JSON 数据', async () => {
      const data = { id: '123', name: 'Test', value: 42 };
      const plaintext = JSON.stringify(data);
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted as any);
      
      expect(JSON.parse(decrypted)).toEqual(data);
    });
    
    it('应该处理大数据', async () => {
      const largeData = 'x'.repeat(1000000); // 1MB
      const encrypted = service.encrypt(largeData);
      const decrypted = service.decrypt(encrypted as any);
      
      expect(decrypted).toBe(largeData);
    });
  });
  
  describe('IV 随机性', () => {
    it('相同数据应产生不同的加密结果', () => {
      const plaintext = 'Same data';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);
      
      // 加密内容应该不同 (因为 IV 不同)
      expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);
      
      // 但解密后应该相同
      const decrypted1 = service.decrypt(encrypted1 as any);
      const decrypted2 = service.decrypt(encrypted2 as any);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });
  });
  
  describe('认证标签', () => {
    it('篡改的数据应该无法解密', () => {
      const plaintext = 'Secret data';
      const encrypted = service.encrypt(plaintext);
      
      // 篡改加密数据
      const tampered = {
        ...encrypted,
        encryptedPayload: Buffer.from(
          Buffer.from(encrypted.encryptedPayload, 'base64').slice(0, -1)
        ).toString('base64'),
      };
      
      expect(() => {
        service.decrypt(tampered as any);
      }).toThrow('Decryption failed');
    });
    
    it('篡改的认证标签应该导致解密失败', () => {
      const plaintext = 'Secret data';
      const encrypted = service.encrypt(plaintext);
      
      const tampered = {
        ...encrypted,
        authTag: Buffer.from('0'.repeat(32), 'hex').toString('base64'),
      };
      
      expect(() => {
        service.decrypt(tampered as any);
      }).toThrow();
    });
  });
  
  describe('密钥派生', () => {
    it('相同密码应产生相同的密钥', () => {
      const service1 = new EncryptionService('password', 'same-salt');
      const service2 = new EncryptionService('password', 'same-salt');
      
      const plaintext = 'Test data';
      const encrypted = service1.encrypt(plaintext);
      
      // service2 应该能解密 service1 加密的数据
      const decrypted = service2.decrypt(encrypted as any);
      expect(decrypted).toBe(plaintext);
    });
    
    it('不同密码应产生不同的密钥', () => {
      const service1 = new EncryptionService('password1', 'salt');
      const service2 = new EncryptionService('password2', 'salt');
      
      const plaintext = 'Test data';
      const encrypted = service1.encrypt(plaintext);
      
      // service2 无法解密 service1 的数据
      expect(() => {
        service2.decrypt(encrypted as any);
      }).toThrow();
    });
    
    it('不同盐值应产生不同的密钥', () => {
      const service1 = new EncryptionService('password', 'salt1');
      const service2 = new EncryptionService('password', 'salt2');
      
      const plaintext = 'Test data';
      const encrypted = service1.encrypt(plaintext);
      
      // 不同盐值，即使密码相同，也应该无法解密
      expect(() => {
        service2.decrypt(encrypted as any);
      }).toThrow();
    });
  });
  
  describe('密钥轮换', () => {
    it('应该支持使用新密钥加密，旧密钥仍可解密', () => {
      const plaintext = 'Test data';
      
      // 初始加密
      const encrypted1 = service.encrypt(plaintext);
      expect(encrypted1.keyVersion).toBe(1);
      
      // 轮换密钥
      service.rotateKey('new-password-12345');
      
      // 新加密
      const encrypted2 = service.encrypt(plaintext);
      expect(encrypted2.keyVersion).toBe(2);
      
      // 旧数据仍可解密
      const decrypted1 = service.decrypt(encrypted1 as any);
      expect(decrypted1).toBe(plaintext);
      
      // 新数据也可解密
      const decrypted2 = service.decrypt(encrypted2 as any);
      expect(decrypted2).toBe(plaintext);
    });
  });
  
  describe('校验和验证', () => {
    it('应该验证数据完整性', () => {
      const plaintext = 'Important data';
      const encrypted = service.encrypt(plaintext);
      
      // 正确的数据应该验证通过
      expect(service.verifyChecksum(plaintext, encrypted as any)).toBe(true);
      
      // 修改数据后应该验证失败
      expect(service.verifyChecksum('Modified data', encrypted as any)).toBe(false);
    });
  });
  
  describe('性能', () => {
    it('加密 1MB 数据应该在 100ms 内完成', () => {
      const largeData = 'x'.repeat(1000000);
      const start = performance.now();
      service.encrypt(largeData);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100);
    });
    
    it('解密 1MB 数据应该在 100ms 内完成', () => {
      const largeData = 'x'.repeat(1000000);
      const encrypted = service.encrypt(largeData);
      
      const start = performance.now();
      service.decrypt(encrypted as any);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100);
    });
  });
});
```

### GitHub Adapter 集成测试

```typescript
// packages/infrastructure-client/src/adapters/GitHubSyncAdapter.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GitHubSyncAdapter } from './GitHubSyncAdapter';
import { createTestEntity, createTestEncryptionService } from '@packages/test-utils';

describe('GitHubSyncAdapter', () => {
  let adapter: GitHubSyncAdapter;
  let encryptionService: EncryptionService;
  
  beforeEach(() => {
    // 使用环境变量中的真实 token（用于 CI）或 mock
    const token = process.env.GITHUB_TEST_TOKEN || 'mock-token';
    const repoPath = process.env.GITHUB_TEST_REPO || 'test-user/dailyuse-sync-test';
    
    adapter = new GitHubSyncAdapter({
      provider: 'github',
      token,
      repoPath,
      encryptionKey: 'test-password-12345',
    });
    
    encryptionService = createTestEncryptionService();
  });
  
  afterEach(async () => {
    await adapter.disconnect();
  });
  
  describe('认证', () => {
    it('应该使用有效的 token 进行身份验证', async () => {
      // 跳过此测试如果未提供真实 token
      if (!process.env.GITHUB_TEST_TOKEN) {
        vi.skip();
      }
      
      await expect(adapter.authenticate({
        provider: 'github',
        token: process.env.GITHUB_TEST_TOKEN || '',
        repoPath: process.env.GITHUB_TEST_REPO || '',
        encryptionKey: 'test-password-12345',
      })).resolves.not.toThrow();
    });
    
    it('应该拒绝无效的 token', async () => {
      const invalidAdapter = new GitHubSyncAdapter({
        provider: 'github',
        token: 'invalid-token',
        repoPath: 'test-user/test-repo',
        encryptionKey: 'test-password-12345',
      });
      
      await expect(
        invalidAdapter.authenticate({
          provider: 'github',
          token: 'invalid-token',
          repoPath: 'test-user/test-repo',
          encryptionKey: 'test-password-12345',
        })
      ).rejects.toThrow('Invalid GitHub token');
    });
  });
  
  describe('推送和拉取', () => {
    it('应该推送和拉取单个实体', async () => {
      if (!process.env.GITHUB_TEST_TOKEN) vi.skip();
      
      const goal = createTestEntity('goal');
      const plaintext = JSON.stringify(goal);
      const encrypted = encryptionService.encrypt(plaintext);
      
      // 推送
      const pushResult = await adapter.push(
        'goals',
        goal.id,
        encrypted as any,
        0
      );
      
      expect(pushResult.success).toBe(true);
      expect(pushResult.version).toBe(1);
      
      // 拉取
      const pullResult = await adapter.pull('goals', 0);
      
      expect(pullResult.success).toBe(true);
      expect(pullResult.items.length).toBeGreaterThan(0);
      
      const item = pullResult.items.find(i => i.entityId === goal.id);
      expect(item).toBeDefined();
      
      // 解密并验证
      const decrypted = encryptionService.decrypt(item!.data as any);
      const parsed = JSON.parse(decrypted);
      expect(parsed).toEqual(goal);
    });
    
    it('应该处理批量推送', async () => {
      if (!process.env.GITHUB_TEST_TOKEN) vi.skip();
      
      const items = [
        createTestEntity('goal'),
        createTestEntity('task'),
        createTestEntity('reminder'),
      ];
      
      const batchItems = items.map(item => ({
        entityType: item.type,
        entityId: item.id,
        data: encryptionService.encrypt(JSON.stringify(item)) as any,
        version: 0,
      }));
      
      const result = await adapter.batchPush(batchItems);
      
      expect(result.succeeded).toBe(items.length);
      expect(result.failed).toBe(0);
      expect(result.conflicts).toBe(0);
    });
  });
  
  describe('冲突检测', () => {
    it('应该检测版本冲突', async () => {
      if (!process.env.GITHUB_TEST_TOKEN) vi.skip();
      
      const goal = createTestEntity('goal');
      const encrypted = encryptionService.encrypt(JSON.stringify(goal)) as any;
      
      // 首次推送
      await adapter.push('goals', goal.id, encrypted, 0);
      
      // 试图以旧版本推送
      const result = await adapter.push('goals', goal.id, encrypted, 0);
      
      expect(result.conflictDetected).toBe(true);
      expect(result.conflict).toBeDefined();
      expect(result.conflict!.localVersion).toBe(0);
      expect(result.conflict!.remoteVersion).toBeGreaterThan(0);
    });
  });
  
  describe('健康检查', () => {
    it('应该报告健康状态', async () => {
      if (!process.env.GITHUB_TEST_TOKEN) vi.skip();
      
      const health = await adapter.checkHealth();
      
      expect(health.connected).toBe(true);
      expect(health.authenticated).toBe(true);
      expect(health.lastSyncTime).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('配额信息', () => {
    it('应该获取 API 配额信息', async () => {
      if (!process.env.GITHUB_TEST_TOKEN) vi.skip();
      
      const quota = await adapter.getQuota();
      
      expect(quota.used).toBeGreaterThanOrEqual(0);
      expect(quota.total).toBeGreaterThan(0);
      expect(quota.available).toBeGreaterThan(0);
      expect(quota.usagePercent).toBeLessThanOrEqual(100);
    });
  });
});
```

### E2E 测试场景

```typescript
// apps/desktop/e2e/sync.e2e.test.ts

import { test, expect, Page } from '@playwright/test';
import { generateTestEntity } from '@packages/test-utils';

test.describe('Cloud Sync E2E Tests', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5173'); // 开发服务器
  });
  
  test.afterEach(async () => {
    await page.close();
  });
  
  test('用户应该能完成配置向导', async () => {
    // 导航到设置
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="sync-config-link"]');
    
    // Step 1: 选择平台
    await page.click('[data-testid="provider-github"]');
    await page.click('[data-testid="next-button"]');
    
    // Step 2: 输入 Token
    await page.fill('[data-testid="github-token-input"]', process.env.GITHUB_TEST_TOKEN || '');
    await page.fill('[data-testid="github-repo-input"]', 'test-user/dailyuse-sync-test');
    await page.click('[data-testid="next-button"]');
    
    // 等待连接验证
    await page.waitForSelector('[data-testid="connection-verified"]', { timeout: 10000 });
    
    // Step 3: 密码
    const password = 'TestPassword123!@#';
    await page.fill('[data-testid="encryption-key"]', password);
    await page.fill('[data-testid="encryption-key-confirm"]', password);
    await page.click('[data-testid="next-button"]');
    
    // Step 4: 同步选项
    await page.click('[data-testid="sync-direction-upload"]');
    await page.click('[data-testid="complete-button"]');
    
    // 等待同步完成
    await page.waitForSelector('[data-testid="sync-completed"]', { timeout: 60000 });
    
    // 验证完成消息
    const message = await page.textContent('[data-testid="sync-summary"]');
    expect(message).toContain('同步完成');
  });
  
  test('新目标应该自动同步到云', async () => {
    // 假设已配置同步
    
    // 创建新目标
    await page.click('[data-testid="new-goal-button"]');
    await page.fill('[data-testid="goal-title-input"]', 'Test Goal for Sync');
    await page.click('[data-testid="create-goal-button"]');
    
    // 等待同步
    await page.waitForSelector('[data-testid="sync-indicator-synced"]', { timeout: 5000 });
    
    // 验证同步指示
    const indicator = await page.getAttribute('[data-testid="sync-indicator"]', 'data-status');
    expect(indicator).toBe('synced');
  });
  
  test('应该能解决同步冲突', async () => {
    // 模拟冲突场景
    // 1. 离线修改本地数据
    // 2. 同时修改云数据
    // 3. 重新连接时检测冲突
    // 4. 显示冲突解决界面
    
    await page.click('[data-testid="conflict-local-button"]');
    await page.click('[data-testid="resolve-conflict-button"]');
    
    // 验证冲突已解决
    await page.waitForSelector('[data-testid="sync-indicator-synced"]', { timeout: 5000 });
  });
});
```

### 性能基准测试

```typescript
// packages/infrastructure-client/src/performance.bench.ts

import { bench, describe } from 'vitest';
import { EncryptionService } from './encryption/EncryptionService';
import { GitHubSyncAdapter } from './adapters/GitHubSyncAdapter';

describe('Performance Benchmarks', () => {
  describe('Encryption', () => {
    bench('encrypt 10KB', () => {
      const service = new EncryptionService('password');
      const data = 'x'.repeat(10 * 1024);
      service.encrypt(data);
    });
    
    bench('encrypt 1MB', () => {
      const service = new EncryptionService('password');
      const data = 'x'.repeat(1024 * 1024);
      service.encrypt(data);
    });
    
    bench('decrypt 10KB', () => {
      const service = new EncryptionService('password');
      const data = 'x'.repeat(10 * 1024);
      const encrypted = service.encrypt(data);
      service.decrypt(encrypted as any);
    });
  });
  
  describe('Sync Operations', () => {
    bench('push single entity', async () => {
      // 需要真实的 adapter 和网络连接
      // 使用 mock 可能更合适
    });
    
    bench('pull 100 entities', async () => {
      // 批量拉取性能测试
    });
  });
});
```

---

## 📁 文件变更清单

### 新增文件

```
packages/test-utils/src/
├── sync-test-utils.ts
└── mocks/
    ├── MockAdapter.ts
    └── MockEncryptionService.ts

packages/infrastructure-client/src/encryption/
└── EncryptionService.test.ts

packages/infrastructure-client/src/adapters/
├── GitHubSyncAdapter.test.ts
├── NutstoreSyncAdapter.test.ts
└── DropboxSyncAdapter.test.ts

apps/desktop/e2e/
├── sync.e2e.test.ts
└── fixtures/
    └── test-data.ts

packages/infrastructure-client/src/
└── performance.bench.ts
```

### 修改文件

```
vitest.config.ts
  └── 添加 E2E 测试配置

vitest.workspace.ts
  └── 添加性能基准配置

.github/workflows/test.yml
  └── 添加集成测试步骤
  └── 添加 GitHub 测试 token 密钥

package.json
  └── 添加测试脚本:
      - test:sync (单元测试)
      - test:sync:integration (集成测试)
      - test:sync:e2e (E2E 测试)
      - bench:sync (性能测试)
```

---

## 🧪 测试执行计划

### Phase 1: 单元测试
```bash
pnpm test:sync
```

- 加密服务测试: 30 分钟
- 适配器接口测试: 20 分钟
- 类型和工具函数: 10 分钟

### Phase 2: 集成测试
```bash
pnpm test:sync:integration
```

- 需要真实 GitHub/Nutstore/Dropbox token
- 可选，使用 mock 或 CI 环境变量

### Phase 3: E2E 测试
```bash
pnpm test:sync:e2e
```

- 需要启动开发服务器
- 需要配置云账户
- 可并行运行多个场景

### Phase 4: 性能测试
```bash
pnpm bench:sync
```

- 生成性能报告
- 比较不同配置的性能

---

## 📊 质量指标

| 指标 | 目标 | 当前 |
|-----|-----|-----|
| 代码覆盖率 | > 85% | - |
| 单元测试 | 100 个 | - |
| 集成测试 | 50 个 | - |
| E2E 测试 | 10 个 | - |
| 性能基准 | 建立基准 | - |

---

## 🚀 下一步

1. 执行所有测试用例
2. 修复发现的 bug
3. 生成测试覆盖率报告
4. 发布 EPIC-009 完成
