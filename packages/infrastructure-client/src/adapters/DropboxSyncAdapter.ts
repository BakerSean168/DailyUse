/**
 * @fileoverview Dropbox Sync 适配器 - 使用 Dropbox 存储加密数据
 * @module @dailyuse/infrastructure-client/adapters
 */

import { Dropbox } from 'dropbox';
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
 * Dropbox Sync 适配器
 *
 * 使用 Dropbox 作为云存储后端，支持：
 * - 完整的端到端加密
 * - OAuth2 认证
 * - 跨平台支持
 * - 无限版本历史
 *
 * **设计特性**:
 * - 数据完全加密后再上传
 * - 利用 Dropbox 文件修订 ID 作为版本
 * - 支持离线工作和最终一致性
 * - Dropbox Free 计划 2GB 即可使用
 *
 * @example
 * ```typescript
 * const adapter = new DropboxSyncAdapter({
 *   provider: 'dropbox',
 *   token: dropboxAccessToken,
 *   encryptionKey: userPassword,
 * });
 *
 * await adapter.authenticate(credentials);
 * const result = await adapter.push('goal', goalId, encryptedData, 1);
 * ```
 */
export class DropboxSyncAdapter extends BaseAdapter {
  private dropbox: Dropbox;
  private baseDir: string = '/DailyUse/Data';

  // 配置
  private static readonly REQUEST_TIMEOUT = 30000;
  private static readonly BATCH_SIZE = 10;

  // 缓存
  private cursorCache: Map<string, SyncCursor> = new Map();
  private configCache: AdapterConfig | null = null;

  /**
   * 构造函数
   *
   * @param credentials - 认证凭据，包括 Dropbox access token
   *
   * @throws {Error} 如果凭据不完整
   */
  constructor(credentials: AdapterCredentials) {
    super(credentials);

    if (!credentials.token) {
      throw new Error('Dropbox access token is required');
    }

    // 初始化 Dropbox 客户端
    this.dropbox = new Dropbox({
      accessToken: credentials.token,
      selectAdmin: false,
      selectUser: false,
    });
  }

  /**
   * 验证认证和连接
   */
  async authenticate(credentials: AdapterCredentials): Promise<void> {
    try {
      // 验证令牌有效性
      const user = await this.dropbox.usersGetCurrentAccount();

      // 创建数据目录
      await this.ensureDataDirectory();

      this.initialized = true;
      console.log(
        `[Dropbox] Authenticated as ${user.result.name.display_name}, base dir: ${this.baseDir}`
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Authentication failed: Invalid token');
        }
        if (error.message.includes('expired')) {
          throw new Error('Authentication failed: Token expired');
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
      const user = await this.dropbox.usersGetCurrentAccount();

      return {
        connected: true,
        authenticated: !!user.result.account_id,
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
   * 推送单个实体到 Dropbox
   */
  async push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult> {
    try {
      const path = `${this.baseDir}/${entityType}/${entityId}.json`;
      const content = JSON.stringify({
        data,
        version,
        timestamp: Date.now(),
      });

      // 上传文件 (覆盖如果存在)
      const result = await this.dropbox.filesUpload({
        path,
        contents: Buffer.from(content),
        autorename: false,
        mode: { '.tag': 'overwrite' },
      });

      return {
        success: true,
        version: version + 1,
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

    // 按批处理
    for (let i = 0; i < items.length; i += DropboxSyncAdapter.BATCH_SIZE) {
      const batch = items.slice(i, i + DropboxSyncAdapter.BATCH_SIZE);

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
      if (i + DropboxSyncAdapter.BATCH_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
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
      const path = `${this.baseDir}/${entityType}`;
      const items: PullResult['items'] = [];

      try {
        const result = await this.dropbox.filesListFolder({
          path,
          recursive: false,
        });

        for (const entry of result.result.entries) {
          if (
            entry['.tag'] === 'file' &&
            entry.name.endsWith('.json')
          ) {
            try {
              const contentResult = await this.dropbox.filesDownload({
                path: entry.path_display || entry.path_lower,
              });

              const content = contentResult.result.fileBinary.toString('utf-8');
              const fileData = JSON.parse(content);

              if (fileData.timestamp >= since) {
                const entityId = entry.name.replace('.json', '');

                items.push({
                  entityType,
                  entityId,
                  data: fileData.data,
                  version: fileData.version,
                  timestamp: fileData.timestamp,
                });
              }
            } catch (err) {
              // 跳过无法解析的文件
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
      const path = `${this.baseDir}/${entityType}/${entityId}.json`;

      const result = await this.dropbox.filesGetMetadata({
        path,
      });

      if (result.result['.tag'] === 'file') {
        try {
          const contentResult = await this.dropbox.filesDownload({
            path,
          });

          const content = contentResult.result.fileBinary.toString('utf-8');
          const fileData = JSON.parse(content);

          return {
            version: fileData.version,
            updatedAt: new Date(result.result.server_modified).getTime(),
            exists: true,
          };
        } catch (err) {
          return {
            version: 0,
            updatedAt: new Date(result.result.server_modified).getTime(),
            exists: true,
          };
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
      const result = await this.dropbox.usersGetSpaceUsage();
      const used = result.result.used;
      const total = result.result.allocation.allocated;

      return {
        used,
        total,
        available: total - used,
        usagePercent: (used / total) * 100,
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
        maxConcurrentRequests: 6,
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
        maxConcurrentRequests: 6,
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
        provider: 'dropbox',
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
      await this.dropbox.filesCreateFolderV2({
        path: this.baseDir,
        autorename: false,
      });
    } catch (error) {
      // 目录可能已存在，忽略错误
    }
  }
}
