/**
 * @fileoverview Nutstore Sync 适配器 - 使用坚果云 WebDAV 存储加密数据
 * @module @dailyuse/infrastructure-client/adapters
 */

import axios, { AxiosInstance } from 'axios';
import type {
  ISyncAdapter,
  AdapterCredentials,
  EncryptedSyncData,
  HealthStatus,
  PushResult,
  PullResult,
  BatchPushResult,
  ConflictInfo,
  ConflictResolution,
  RemoteVersionInfo,
  SyncCursor,
  QuotaInfo,
  AdapterConfig,
  ExportData,
  ImportOptions,
} from '@dailyuse/application-client/sync';

import { BaseAdapter } from './BaseAdapter';

/**
 * Nutstore (坚果云) Sync 适配器
 *
 * 使用坚果云 WebDAV 协议作为云存储后端，支持：
 * - 完整的端到端加密
 * - WebDAV 协议兼容
 * - 中文用户优化
 * - 无限存储空间 (免费计划)
 *
 * **设计特性**:
 * - 数据完全加密后再上传
 * - 利用文件修改时间作为版本控制
 * - 支持离线工作和最终一致性
 * - 坚果云免费计划即可使用 (30GB)
 *
 * @example
 * ```typescript
 * const adapter = new NutstoreSyncAdapter({
 *   provider: 'nutstore',
 *   username: 'user@example.com',
 *   token: 'nutstore-password',
 *   encryptionKey: userPassword,
 * });
 *
 * await adapter.authenticate(credentials);
 * const result = await adapter.push('goal', goalId, encryptedData, 1);
 * ```
 */
export class NutstoreSyncAdapter extends BaseAdapter {
  private client: AxiosInstance;
  private username: string;
  private baseDir: string = 'DailyUse/Data';
  private serverUrl: string = 'https://dav.jianguoyun.com/dav';

  // 配置
  private static readonly REQUEST_TIMEOUT = 30000;
  private static readonly BATCH_SIZE = 5;

  // 缓存
  private cursorCache: Map<string, SyncCursor> = new Map();
  private configCache: AdapterConfig | null = null;

  /**
   * 构造函数
   *
   * @param credentials - 认证凭据，包括用户名、密码和加密密钥
   *
   * @throws {Error} 如果凭据不完整
   */
  constructor(credentials: AdapterCredentials) {
    super(credentials);

    if (!credentials.username) {
      throw new Error('Nutstore username (email) is required');
    }

    if (!credentials.token) {
      throw new Error('Nutstore password is required');
    }

    this.username = credentials.username;

    // 初始化 HTTP 客户端
    this.client = axios.create({
      baseURL: this.serverUrl,
      auth: {
        username: this.username,
        password: credentials.token,
      },
      timeout: NutstoreSyncAdapter.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 验证认证和连接
   */
  async authenticate(credentials: AdapterCredentials): Promise<void> {
    try {
      // 验证 WebDAV 连接
      await this.client.propfind(`/${this.baseDir}`, null, {
        headers: {
          Depth: '0',
        },
      });

      // 创建数据目录
      await this.ensureDataDirectory();

      this.initialized = true;
      console.log(
        `[Nutstore] Authenticated as ${this.username}, base dir: ${this.baseDir}`
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Authentication failed: Invalid credentials');
        }
        if (error.message.includes('403')) {
          throw new Error('Authentication failed: Access denied');
        }
      }
      throw error;
    }
  }

  /**
   * 检查健康状态
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await this.client.propfind(`/${this.baseDir}`, null, {
        headers: {
          Depth: '0',
        },
      });

      return {
        connected: true,
        authenticated: !!response.status,
        quotaExceeded: false,
        lastSyncTime: this.cursorCache.size > 0 ? Date.now() : 0,
      };
    } catch (error) {
      return {
        connected: false,
        authenticated: false,
        quotaExceeded: false,
        lastSyncTime: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 推送单个实体到坚果云
   */
  async push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult> {
    try {
      const path = `/${this.baseDir}/${entityType}/${entityId}.json`;
      const content = JSON.stringify({
        data,
        version,
        timestamp: Date.now(),
      });

      // 检查文件是否存在 (获取版本信息)
      let remoteVersion = version;
      try {
        const response = await this.client.propfind(path, null, {
          headers: {
            Depth: '0',
          },
        });
        if (response.status === 207) {
          remoteVersion = version + 1;
        }
      } catch (err) {
        // 文件不存在
      }

      // 上传文件
      await this.client.put(path, content, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

      return {
        success: true,
        version: remoteVersion,
        timestamp: Date.now(),
        conflictDetected: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        version,
        timestamp: Date.now(),
        error: errorMessage,
      };
    }
  }

  /**
   * 批量推送数据
   */
  async batchPush(
    items: Array<{
      entityType: string;
      entityId: string;
      data: EncryptedSyncData;
      version: number;
    }>
  ): Promise<BatchPushResult> {
    const results: Array<PushResult & { entityId: string; entityType: string }> = [];
    let succeeded = 0;
    let failed = 0;
    let conflicts = 0;
    const errors: string[] = [];

    // 按批处理以避免超时
    for (let i = 0; i < items.length; i += NutstoreSyncAdapter.BATCH_SIZE) {
      const batch = items.slice(i, i + NutstoreSyncAdapter.BATCH_SIZE);

      const promises = batch.map(item =>
        this.push(item.entityType, item.entityId, item.data, item.version)
      );

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result, index) => {
        const item = batch[index];
        let pushResult: PushResult;

        if (result.status === 'fulfilled') {
          pushResult = result.value;
        } else {
          pushResult = {
            success: false,
            version: item.version,
            timestamp: Date.now(),
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          };
        }

        results.push({
          ...pushResult,
          entityType: item.entityType,
          entityId: item.entityId,
        });

        if (pushResult.success) {
          succeeded++;
        } else if (pushResult.conflictDetected) {
          conflicts++;
        } else {
          failed++;
          errors.push(pushResult.error || 'Unknown error');
        }
      });

      // 延迟避免限流
      if (i + NutstoreSyncAdapter.BATCH_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return {
      succeeded,
      failed,
      conflicts,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 拉取数据
   */
  async pull(entityType: string, since: number, version?: number): Promise<PullResult> {
    try {
      const path = `/${this.baseDir}/${entityType}`;
      const items: PullResult['items'] = [];

      // 列出目录中的所有文件
      try {
        const response = await this.client.propfind(path, null, {
          headers: {
            Depth: '1',
          },
        });

        if (response.status === 207) {
          const files = Array.isArray(response.data) ? response.data : [response.data];

          for (const file of files) {
            if (
              file.href &&
              file.href.endsWith('.json') &&
              file.propstat
            ) {
              const props = file.propstat[0]?.prop;
              if (props && props.getlastmodified) {
                const modTime = new Date(props.getlastmodified).getTime();

                if (modTime >= since) {
                  const entityId = file.href.split('/').pop()?.replace('.json', '');
                  if (entityId) {
                    try {
                      const contentResponse = await this.client.get(file.href);
                      const fileData = JSON.parse(contentResponse.data);

                      items.push({
                        entityType,
                        entityId,
                        data: fileData.data,
                        version: fileData.version,
                        timestamp: fileData.timestamp,
                      });
                    } catch (err) {
                      // 跳过无法解析的文件
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        // 目录不存在
      }

      const cursor: SyncCursor = {
        entityType,
        lastSyncTimestamp: Date.now(),
        lastSyncVersion: version || 0,
        createdAt: Date.now(),
      };

      this.cursorCache.set(entityType, cursor);

      return {
        success: true,
        items,
        cursor,
        hasMore: false,
        totalItems: items.length,
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        cursor: {
          entityType,
          lastSyncTimestamp: since,
          lastSyncVersion: version || 0,
          createdAt: Date.now(),
        },
        hasMore: false,
      };
    }
  }

  /**
   * 获取远程版本信息
   */
  async getRemoteVersion(entityType: string, entityId: string): Promise<RemoteVersionInfo> {
    try {
      const path = `/${this.baseDir}/${entityType}/${entityId}.json`;
      const response = await this.client.propfind(path, null, {
        headers: {
          Depth: '0',
        },
      });

      if (response.status === 207) {
        const file = Array.isArray(response.data) ? response.data[0] : response.data;
        const props = file.propstat[0]?.prop;

        if (props && props.getlastmodified) {
          const timestamp = new Date(props.getlastmodified).getTime();

          try {
            const contentResponse = await this.client.get(path);
            const fileData = JSON.parse(contentResponse.data);

            return {
              version: fileData.version,
              updatedAt: timestamp,
              exists: true,
            };
          } catch (err) {
            return {
              version: 0,
              updatedAt: timestamp,
              exists: true,
            };
          }
        }
      }

      return {
        version: 0,
        updatedAt: 0,
        exists: false,
      };
    } catch (error) {
      return {
        version: 0,
        updatedAt: 0,
        exists: false,
      };
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflict: ConflictInfo,
    resolution: ConflictResolution
  ): Promise<void> {
    let dataToCommit: EncryptedSyncData;

    switch (resolution.strategy) {
      case 'local':
        dataToCommit = conflict.localData;
        break;
      case 'remote':
        dataToCommit = conflict.remoteData;
        break;
      case 'manual':
        if (!resolution.resolvedData) {
          throw new Error('Resolved data is required for manual resolution');
        }
        dataToCommit = resolution.resolvedData;
        break;
      case 'merge':
        dataToCommit = { ...conflict.localData };
        break;
      default:
        throw new Error(`Unknown resolution strategy: ${resolution.strategy}`);
    }

    await this.push(
      conflict.entityType,
      conflict.entityId,
      dataToCommit,
      conflict.remoteVersion
    );
  }

  /**
   * 获取游标
   */
  async getCursor(entityType: string): Promise<SyncCursor> {
    if (this.cursorCache.has(entityType)) {
      return this.cursorCache.get(entityType)!;
    }

    return {
      entityType,
      lastSyncTimestamp: 0,
      lastSyncVersion: 0,
      createdAt: Date.now(),
    };
  }

  /**
   * 更新游标
   */
  async updateCursor(entityType: string, cursor: SyncCursor): Promise<void> {
    this.cursorCache.set(entityType, cursor);
  }

  /**
   * 获取配额信息
   */
  async getQuota(): Promise<QuotaInfo> {
    try {
      // 坚果云免费计划 30GB
      const total = 30 * 1024 * 1024 * 1024; // 30GB
      const available = total; // 简化处理，实际应该调用 API 获取

      return {
        used: 0,
        total,
        available,
        usagePercent: 0,
      };
    } catch (error) {
      return {
        used: 0,
        total: 0,
        available: 0,
        usagePercent: 0,
      };
    }
  }

  /**
   * 设置配置
   */
  async setConfig(config: Partial<AdapterConfig>): Promise<void> {
    if (!this.configCache) {
      this.configCache = {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 30000,
        enableCache: true,
        cacheExpiry: 300000,
        maxConcurrentRequests: 3,
      };
    }

    this.configCache = { ...this.configCache, ...config };
  }

  /**
   * 获取配置
   */
  async getConfig(): Promise<AdapterConfig> {
    if (!this.configCache) {
      this.configCache = {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 30000,
        enableCache: true,
        cacheExpiry: 300000,
        maxConcurrentRequests: 3,
      };
    }

    return this.configCache;
  }

  /**
   * 导出全量数据
   */
  async exportAll(): Promise<ExportData> {
    const items: ExportData['items'] = [];
    const entityTypes = ['goal', 'task', 'reminder', 'schedule'];

    for (const entityType of entityTypes) {
      const pullResult = await this.pull(entityType, 0);
      items.push(...pullResult.items);
    }

    return {
      version: 1,
      exportedAt: Date.now(),
      checksum: '',
      items,
      metadata: {
        totalItems: items.length,
        provider: 'nutstore',
        userEmail: this.username,
      },
    };
  }

  /**
   * 导入数据
   */
  async importData(data: ExportData, options?: ImportOptions): Promise<void> {
    const overwrite = options?.overwrite ?? false;

    for (const item of data.items) {
      const existing = await this.getRemoteVersion(item.entityType, item.entityId);

      if (existing.exists && !overwrite) {
        if (options?.conflictStrategy === 'skip') {
          continue;
        }
      }

      await this.push(item.entityType, item.entityId, item.data, item.version);
    }
  }

  /**
   * 清空缓存
   */
  async clearCache(): Promise<void> {
    this.cursorCache.clear();
    this.configCache = null;
  }

  /**
   * 清理资源
   */
  protected async cleanup(): Promise<void> {
    this.cursorCache.clear();
    this.configCache = null;
  }

  // ===== 私有方法 =====

  /**
   * 确保数据目录存在
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await this.client.mkcol(`/${this.baseDir}`, null);
    } catch (error) {
      // 目录可能已存在，忽略错误
    }
  }
}
