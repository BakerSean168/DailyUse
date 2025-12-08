/**
 * @fileoverview GitHub Sync 适配器 - 使用 GitHub 私有仓库存储加密数据
 * @module @dailyuse/infrastructure-client/adapters
 */

import { Octokit } from '@octokit/rest';
import type { OctokitResponse } from '@octokit/types';
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
 * GitHub Sync 适配器
 *
 * 使用 GitHub 私有仓库作为云存储后端，支持：
 * - 完整的端到端加密
 * - Git 历史作为版本控制
 * - 离线工作和最终一致性
 * - GitHub Free 计划可用
 *
 * **设计特性**:
 * - 数据完全加密后再上传到 GitHub
 * - 利用 Git commit hash 作为版本号
 * - 支持无限版本历史 (Git 历史)
 * - 支持冲突检测和解决
 * - 速率限制处理 (5000 请求/小时)
 *
 * @example
 * ```typescript
 * const adapter = new GitHubSyncAdapter({
 *   provider: 'github',
 *   token: process.env.GITHUB_TOKEN,
 *   repoPath: 'user/daily-use-sync',
 *   encryptionKey: userPassword,
 * });
 *
 * await adapter.authenticate(credentials);
 * const result = await adapter.push('goal', goalId, encryptedData, 1);
 * ```
 */
export class GitHubSyncAdapter extends BaseAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private baseDir: string = '.dailyuse/data';

  // GitHub API 限制
  private static readonly API_LIMIT_THRESHOLD = 100;
  private static readonly BATCH_SIZE = 10;
  private static readonly REQUEST_TIMEOUT = 30000; // 30 秒

  // 缓存
  private cursorCache: Map<string, SyncCursor> = new Map();
  private configCache: AdapterConfig | null = null;

  /**
   * 构造函数
   *
   * @param credentials - 认证凭据，包括 GitHub token 和仓库路径
   *
   * @throws {Error} 如果凭据不完整
   */
  constructor(credentials: AdapterCredentials) {
    super(credentials);

    if (!credentials.token) {
      throw new Error('GitHub token is required');
    }

    if (!credentials.repoPath) {
      throw new Error('Repository path (owner/repo) is required');
    }

    const parts = credentials.repoPath.split('/');
    if (parts.length !== 2) {
      throw new Error('Invalid repository path format. Expected: owner/repo');
    }

    this.owner = parts[0];
    this.repo = parts[1];

    // 初始化 Octokit 客户端
    this.octokit = new Octokit({
      auth: credentials.token,
      request: {
        timeout: GitHubSyncAdapter.REQUEST_TIMEOUT,
      },
    });
  }

  /**
   * 验证认证和连接
   *
   * @param credentials - 认证凭据
   *
   * @throws {Error} 如果认证失败或权限不足
   */
  async authenticate(credentials: AdapterCredentials): Promise<void> {
    try {
      // 验证令牌有效性
      const userRes = await this.octokit.rest.users.getAuthenticated();
      const username = userRes.data.login;

      // 验证仓库访问权限
      const repoRes = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      if (!repoRes.data.private) {
        throw new Error('Repository must be private for security');
      }

      // 创建或验证数据目录
      await this.ensureDataDirectory();

      this.initialized = true;
      console.log(
        `[GitHub] Authenticated as ${username}, repo: ${this.owner}/${this.repo}`
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Authentication failed: Invalid token');
        }
        if (error.message.includes('403')) {
          throw new Error('Authentication failed: Insufficient permissions');
        }
        if (error.message.includes('404')) {
          throw new Error('Authentication failed: Repository not found');
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
      const userRes = await this.octokit.rest.users.getAuthenticated();
      const rateLimit = await this.octokit.rest.rateLimit.get();

      return {
        connected: true,
        authenticated: !!userRes.data.login,
        quotaExceeded: rateLimit.data.resources.core.remaining < GitHubSyncAdapter.API_LIMIT_THRESHOLD,
        lastSyncTime: this.cursorCache.size > 0 ? Date.now() : 0,
        diagnostics: {
          rateLimit: {
            remaining: rateLimit.data.resources.core.remaining,
            limit: rateLimit.data.resources.core.limit,
            resetAt: rateLimit.data.resources.core.reset * 1000,
          },
        },
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
   * 推送单个实体到 GitHub
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

      // 尝试获取文件的当前 SHA (用于更新)
      let sha: string | undefined;
      try {
        const existingFile = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
        });

        if ('sha' in existingFile.data) {
          sha = existingFile.data.sha;
        }
      } catch (err) {
        // 文件不存在，这是新建
      }

      // 推送文件
      const commitRes = await this.octokit.rest.repos.createOrUpdateFileContents(
        {
          owner: this.owner,
          repo: this.repo,
          path,
          message: `sync: update ${entityType}/${entityId} (v${version})`,
          content: Buffer.from(content).toString('base64'),
          sha,
        }
      );

      return {
        success: true,
        version: version + 1,
        timestamp: Date.now(),
        conflictDetected: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // 检查冲突 (409 Conflict)
      if (errorMessage.includes('409') || errorMessage.includes('conflict')) {
        const remoteVersion = await this.getRemoteVersion(entityType, entityId);
        return {
          success: false,
          version,
          timestamp: Date.now(),
          conflictDetected: true,
          error: 'Version conflict detected',
          conflict: {
            id: `${entityType}/${entityId}`,
            entityType,
            entityId,
            localVersion: version,
            remoteVersion: remoteVersion.version,
            localData: data,
            remoteData: await this.getRemoteData(entityType, entityId),
            detectedAt: Date.now(),
          },
        };
      }

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

    // 按批处理以避免速率限制
    for (let i = 0; i < items.length; i += GitHubSyncAdapter.BATCH_SIZE) {
      const batch = items.slice(i, i + GitHubSyncAdapter.BATCH_SIZE);

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

      // 速率限制延迟
      if (i + GitHubSyncAdapter.BATCH_SIZE < items.length) {
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

      // 获取目录中的所有文件
      const contentsRes = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if (!Array.isArray(contentsRes.data)) {
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

      // 获取每个文件的内容
      for (const file of contentsRes.data) {
        if (file.name.endsWith('.json')) {
          const contentRes = await this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: file.path,
          });

          if ('content' in contentRes.data) {
            const decodedContent = Buffer.from(contentRes.data.content, 'base64').toString('utf-8');
            const fileData = JSON.parse(decodedContent);

            // 过滤时间戳
            if (fileData.timestamp >= since) {
              const entityId = file.name.replace('.json', '');
              items.push({
                entityType,
                entityId,
                data: fileData.data,
                version: fileData.version,
                timestamp: fileData.timestamp,
              });
            }
          }
        }
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
        hasMore: false, // GitHub 不需要分页（除非数据非常多）
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
      const res = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if ('content' in res.data) {
        const decodedContent = Buffer.from(res.data.content, 'base64').toString('utf-8');
        const fileData = JSON.parse(decodedContent);

        return {
          version: fileData.version,
          updatedAt: fileData.timestamp,
          exists: true,
        };
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
        // 简单的字段级合并
        dataToCommit = { ...conflict.localData };
        break;
      default:
        throw new Error(`Unknown resolution strategy: ${resolution.strategy}`);
    }

    // 推送解决后的数据
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
      const repoRes = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      const rateLimit = await this.octokit.rest.rateLimit.get();
      const used = repoRes.data.size || 0;
      const total = 1024 * 1024 * 1024; // 假设 1GB 作为软限制

      return {
        used,
        total,
        available: total - used,
        remainingApiCalls: rateLimit.data.resources.core.remaining,
        resetAt: rateLimit.data.resources.core.reset * 1000,
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
        maxConcurrentRequests: 5,
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
        maxConcurrentRequests: 5,
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
      checksum: '', // 会被计算
      items,
      metadata: {
        totalItems: items.length,
        provider: 'github',
        userEmail: this.credentials.username,
      },
    };
  }

  /**
   * 导入数据
   */
  async importData(data: ExportData, options?: ImportOptions): Promise<void> {
    const overwrite = options?.overwrite ?? false;

    for (const item of data.items) {
      // 检查冲突
      const existing = await this.getRemoteVersion(item.entityType, item.entityId);

      if (existing.exists && !overwrite) {
        if (options?.conflictStrategy === 'skip') {
          continue;
        }
        // 其他策略在这里处理
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
      // 尝试访问目录，如果不存在则创建
      await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: this.baseDir,
      });
    } catch (error) {
      // 目录不存在，创建一个 .gitkeep 文件
      try {
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: `${this.baseDir}/.gitkeep`,
          message: 'init: create data directory',
          content: Buffer.from('').toString('base64'),
        });
      } catch (createError) {
        // 忽略创建失败
      }
    }
  }

  /**
   * 获取远程数据（用于冲突检测）
   */
  private async getRemoteData(entityType: string, entityId: string): Promise<EncryptedSyncData> {
    try {
      const path = `${this.baseDir}/${entityType}/${entityId}.json`;
      const res = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if ('content' in res.data) {
        const decodedContent = Buffer.from(res.data.content, 'base64').toString('utf-8');
        const fileData = JSON.parse(decodedContent);
        return fileData.data;
      }

      throw new Error('Unable to retrieve remote data');
    } catch (error) {
      throw new Error(`Failed to get remote data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
