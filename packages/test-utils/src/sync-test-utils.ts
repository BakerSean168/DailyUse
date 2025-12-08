/**
 * @fileoverview 同步测试工具函数
 * @module @dailyuse/test-utils/sync
 */

import { EncryptionService } from '@dailyuse/infrastructure-client/encryption';
import type {
  ISyncAdapter,
  AdapterCredentials,
  EncryptedSyncData,
} from '@dailyuse/application-client/sync';

/**
 * 创建测试用加密服务
 */
export function createTestEncryptionService(password?: string, salt?: string): EncryptionService {
  return new EncryptionService(
    password || 'test-password-12345',
    salt || 'test-salt'
  );
}

/**
 * 生成测试实体
 */
export function generateTestEntity(
  type: 'goal' | 'task' | 'reminder' | 'schedule',
  overrides?: any
) {
  const base = {
    id: `test-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
  };

  switch (type) {
    case 'goal':
      return {
        ...base,
        title: 'Test Goal',
        description: 'Test goal description',
        status: 'in-progress',
        priority: 'medium',
        targetDate: Date.now() + 86400000 * 30, // 30 days
        ...overrides,
      };

    case 'task':
      return {
        ...base,
        title: 'Test Task',
        description: 'Test task description',
        completed: false,
        priority: 'medium',
        dueDate: Date.now() + 86400000 * 7, // 7 days
        ...overrides,
      };

    case 'reminder':
      return {
        ...base,
        title: 'Test Reminder',
        description: 'Test reminder description',
        dueDate: Date.now() + 86400000, // 1 day
        repeat: 'none',
        enabled: true,
        ...overrides,
      };

    case 'schedule':
      return {
        ...base,
        title: 'Test Schedule',
        description: 'Test schedule description',
        startTime: Date.now() + 3600000, // 1 hour
        endTime: Date.now() + 7200000, // 2 hours
        recurrence: 'none',
        ...overrides,
      };

    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
}

/**
 * 生成批量测试实体
 */
export function generateTestEntities(
  count: number,
  type: 'goal' | 'task' | 'reminder' | 'schedule'
) {
  return Array.from({ length: count }, (_, i) =>
    generateTestEntity(type, { title: `Test ${type} ${i + 1}` })
  );
}

/**
 * 测试加密-解密循环
 */
export async function testEncryptionCycle(
  encryptionService: EncryptionService,
  data: any
): Promise<boolean> {
  try {
    const plaintext = JSON.stringify(data);
    const encrypted = encryptionService.encrypt(plaintext);
    const decrypted = encryptionService.decrypt(encrypted);

    const parsed = JSON.parse(decrypted);
    return JSON.stringify(parsed) === JSON.stringify(data);
  } catch (error) {
    return false;
  }
}

/**
 * 验证数据完整性
 */
export function verifyDataIntegrity(original: any, decrypted: string): boolean {
  try {
    const parsed = JSON.parse(decrypted);
    return JSON.stringify(parsed) === JSON.stringify(original);
  } catch (error) {
    return false;
  }
}

/**
 * 测试适配器连接
 */
export async function testAdapterConnection(adapter: ISyncAdapter): Promise<boolean> {
  try {
    const health = await adapter.checkHealth();
    return health.connected && health.authenticated;
  } catch (error) {
    return false;
  }
}

/**
 * 测试推送-拉取循环
 */
export async function testPushPullCycle(
  adapter: ISyncAdapter,
  encryptionService: EncryptionService,
  entityType: string,
  entityData: any
): Promise<boolean> {
  try {
    // 推送
    const plaintext = JSON.stringify(entityData);
    const encrypted = encryptionService.encrypt(plaintext);
    const pushResult = await adapter.push(entityType, entityData.id, encrypted, 1);

    if (!pushResult.success) {
      return false;
    }

    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 500));

    // 拉取
    const pullResult = await adapter.pull(entityType, 0);

    if (!pullResult.success) {
      return false;
    }

    // 查找数据
    const item = pullResult.items.find(i => i.entityId === entityData.id);

    if (!item) {
      return false;
    }

    // 验证
    const decrypted = encryptionService.decrypt(item.data);
    return verifyDataIntegrity(entityData, decrypted);
  } catch (error) {
    return false;
  }
}

/**
 * 创建 Mock 适配器（用于单元测试）
 */
export class MockSyncAdapter implements ISyncAdapter {
  private data: Map<string, Map<string, EncryptedSyncData>> = new Map();
  private _connected: boolean = false;
  private _authenticated: boolean = false;
  private cursors: Map<string, any> = new Map();

  async authenticate(credentials: AdapterCredentials): Promise<void> {
    if (credentials.token === 'valid-token') {
      this._authenticated = true;
      this._connected = true;
    } else {
      throw new Error('Invalid credentials');
    }
  }

  async checkHealth() {
    return {
      connected: this._connected,
      authenticated: this._authenticated,
      quotaExceeded: false,
      lastSyncTime: Date.now(),
    };
  }

  async push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ) {
    if (!this.data.has(entityType)) {
      this.data.set(entityType, new Map());
    }

    this.data.get(entityType)!.set(entityId, data);

    return {
      success: true,
      version: version + 1,
      timestamp: Date.now(),
      conflictDetected: false,
    };
  }

  async pull(entityType: string, since: number, version?: number) {
    const typeData = this.data.get(entityType) || new Map();
    const items = Array.from(typeData.entries()).map(([entityId, data]) => ({
      entityType,
      entityId,
      data,
      version: 1,
      timestamp: Date.now(),
    }));

    return {
      success: true,
      items,
      cursor: {
        entityType,
        lastSyncTimestamp: Date.now(),
        lastSyncVersion: version || 0,
        createdAt: Date.now(),
      },
      hasMore: false,
      totalItems: items.length,
    };
  }

  async batchPush(items: any[]) {
    const results = [];

    for (const item of items) {
      const result = await this.push(
        item.entityType,
        item.entityId,
        item.data,
        item.version
      );
      results.push({ ...result, entityType: item.entityType, entityId: item.entityId });
    }

    return {
      succeeded: items.length,
      failed: 0,
      conflicts: 0,
      results,
    };
  }

  async getRemoteVersion(entityType: string, entityId: string) {
    const typeData = this.data.get(entityType);
    const exists = typeData?.has(entityId) || false;

    return {
      version: exists ? 1 : 0,
      updatedAt: exists ? Date.now() : 0,
      exists,
    };
  }

  async resolveConflict(conflict: any, resolution: any) {
    // Mock implementation
  }

  async getCursor(entityType: string) {
    return (
      this.cursors.get(entityType) || {
        entityType,
        lastSyncTimestamp: 0,
        lastSyncVersion: 0,
        createdAt: Date.now(),
      }
    );
  }

  async updateCursor(entityType: string, cursor: any) {
    this.cursors.set(entityType, cursor);
  }

  async getQuota() {
    return {
      used: 1000000,
      total: 10000000,
      available: 9000000,
      usagePercent: 10,
    };
  }

  async setConfig(config: any) {
    // Mock implementation
  }

  async getConfig() {
    return {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30000,
      enableCache: true,
      cacheExpiry: 300000,
      maxConcurrentRequests: 3,
    };
  }

  async exportAll() {
    const allItems: any[] = [];

    for (const [entityType, typeData] of this.data.entries()) {
      for (const [entityId, data] of typeData.entries()) {
        allItems.push({
          entityType,
          entityId,
          data,
          version: 1,
          timestamp: Date.now(),
        });
      }
    }

    return {
      version: 1,
      exportedAt: Date.now(),
      checksum: 'mock-checksum',
      items: allItems,
      metadata: {},
    };
  }

  async importData(data: any, options?: any) {
    // Mock implementation
  }

  async clearCache() {
    // Mock implementation
  }

  async disconnect() {
    this._connected = false;
    this._authenticated = false;
  }
}

/**
 * 等待指定时间
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数（用于处理网络不稳定）
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await wait(delayMs * attempt);
      }
    }
  }

  throw lastError;
}

/**
 * 性能测试辅助函数
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  return {
    result,
    duration: end - start,
  };
}

/**
 * 并发测试辅助函数
 */
export async function testConcurrency<T>(
  fn: () => Promise<T>,
  concurrency: number
): Promise<T[]> {
  const promises = Array.from({ length: concurrency }, () => fn());
  return Promise.all(promises);
}
