# STORY-045: GitHub Sync 适配器实现

## 📋 Story 概述

**Story ID**: STORY-045  
**Epic**: EPIC-009 (Cloud Sync Integration)  
**优先级**: P0 (核心功能)  
**预估工时**: 5 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-043, STORY-044

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 能将我的数据同步到 GitHub 私有仓库  
**以便于** 零成本地使用 GitHub 作为我的云存储，无需部署服务器

---

## 📋 验收标准

### GitHub 连接验收

- [ ] 支持 GitHub Personal Access Token 认证
- [ ] 支持 OAuth2 登录流程
- [ ] 验证令牌有效性和权限
- [ ] 检查仓库访问权限
- [ ] 支持自定义仓库 (owner/repo)
- [ ] 错误处理: 401 (认证失败), 403 (权限不足), 404 (仓库不存在)

### 数据存储验收

- [ ] 创建专用目录结构 `.dailyuse/data/`
- [ ] 按实体类型组织文件 (goals/, tasks/, reminders/, etc.)
- [ ] 使用 JSON 格式存储加密数据
- [ ] 支持多版本管理 (Git 历史作为版本控制)
- [ ] 支持批量上传 (避免 API 限流)

### Push 操作验收

- [ ] 推送单个实体到 GitHub
- [ ] 推送多个实体 (批量)
- [ ] 处理网络超时和重试
- [ ] 检测并报告冲突 (服务端已有更新)
- [ ] 返回正确的版本号 (Git commit hash)
- [ ] 支持幂等操作 (可安全重试)

### Pull 操作验收

- [ ] 拉取所有数据 (首次同步)
- [ ] 支持增量拉取 (since 时间戳)
- [ ] 返回正确的游标
- [ ] 分页处理大量数据
- [ ] 支持继续拉取 (hasMore)

### 冲突检测验收

- [ ] 检测本地版本 < 服务端版本
- [ ] 返回冲突详情 (本地数据、服务端数据)
- [ ] 支持冲突解决 (local/remote/merge)

### 性能验收

- [ ] 身份验证 < 500ms
- [ ] 推送 100 个实体 < 5s
- [ ] 拉取 1000 个实体 < 10s
- [ ] GitHub API 限流正确处理

### 配额验收

- [ ] 获取仓库大小
- [ ] 获取 API 速率限制信息
- [ ] 检查是否超过配额
- [ ] 提醒用户接近限制

---

## 🔧 技术方案

### GitHub Sync 适配器实现

```typescript
// packages/infrastructure-client/src/adapters/GitHubSyncAdapter.ts

import { Octokit } from '@octokit/rest';
import { ISyncAdapter, AdapterCredentials, /* 其他类型 */ } from '@packages/application-client';
import { BaseAdapter } from './BaseAdapter';

/**
 * GitHub Sync 适配器
 * 
 * 使用 GitHub 私有仓库作为云存储后端
 * 
 * 设计原则:
 * - 数据完全加密后再上传
 * - 利用 Git 历史作为版本控制
 * - 支持离线工作和最终一致性
 * - GitHub Free 计划即可使用
 */
export class GitHubSyncAdapter extends BaseAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private baseDir: string = '.dailyuse/data';
  
  // GitHub API 限制
  private static readonly API_LIMIT_THRESHOLD = 100; // 保留 100 个请求作为缓冲
  private static readonly BATCH_SIZE = 10; // 批量操作的大小
  
  constructor(credentials: AdapterCredentials) {
    super(credentials);
    
    if (!credentials.token) {
      throw new Error('GitHub token is required');
    }
    
    if (!credentials.repoPath) {
      throw new Error('Repository path (owner/repo) is required');
    }
    
    const [owner, repo] = credentials.repoPath.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository path format. Expected: owner/repo');
    }
    
    this.owner = owner;
    this.repo = repo;
    
    // 初始化 GitHub API 客户端
    this.octokit = new Octokit({
      auth: credentials.token,
    });
  }
  
  // ========== 连接与认证 ==========
  
  async authenticate(credentials: AdapterCredentials): Promise<void> {
    try {
      // 验证令牌有效性
      const user = await this.octokit.rest.users.getAuthenticated();
      console.log(`Authenticated as: ${user.data.login}`);
      
      // 验证仓库访问权限
      const repo = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      
      if (repo.data.private !== true) {
        throw new Error('Repository must be private for security');
      }
      
      // 检查 .dailyuse 目录是否存在，不存在则创建
      await this.ensureBaseDir();
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid GitHub token');
        } else if (error.message.includes('403')) {
          throw new Error('Insufficient permissions. Repository must be accessible');
        } else if (error.message.includes('404')) {
          throw new Error(`Repository ${this.owner}/${this.repo} not found`);
        }
      }
      throw error;
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    try {
      // 检查 API 限制
      const rateLimit = await this.octokit.rest.rateLimit.get();
      const remaining = rateLimit.data.resources.core.remaining;
      const quotaExceeded = remaining < GitHubSyncAdapter.API_LIMIT_THRESHOLD;
      
      // 获取最后同步时间 (通过检查最新 commit)
      let lastSyncTime = 0;
      try {
        const commits = await this.octokit.rest.repos.listCommits({
          owner: this.owner,
          repo: this.repo,
          per_page: 1,
        });
        
        if (commits.data.length > 0) {
          lastSyncTime = new Date(commits.data[0].commit.committer?.date || 0).getTime();
        }
      } catch {
        // 如果没有 commit，则 lastSyncTime 保持为 0
      }
      
      return {
        connected: true,
        authenticated: true,
        quotaExceeded,
        lastSyncTime,
        diagnostics: {
          apiRemaining: remaining,
          apiLimit: rateLimit.data.resources.core.limit,
          repository: `${this.owner}/${this.repo}`,
        },
      };
    } catch (error) {
      return {
        connected: false,
        authenticated: false,
        quotaExceeded: false,
        lastSyncTime: 0,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  // ========== 核心同步操作 ==========
  
  /**
   * 推送数据到 GitHub
   */
  async push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult> {
    try {
      const filePath = this.getFilePath(entityType, entityId);
      
      // 检查是否需要创建新文件或更新现有文件
      let currentSha: string | undefined;
      let serverVersion = 0;
      
      try {
        const existing = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
        });
        
        if ('sha' in existing.data) {
          currentSha = existing.data.sha;
          // 从元数据提取服务端版本
          serverVersion = (existing.data as any).metadata?.version || 0;
        }
      } catch (error) {
        // 文件不存在，这是正常的新建操作
        if ((error as any).status !== 404) {
          throw error;
        }
      }
      
      // 检查冲突
      if (serverVersion > version) {
        // 服务端有更新的版本
        const remoteData = await this.getRemoteData(filePath);
        return {
          success: false,
          version: serverVersion,
          timestamp: Date.now(),
          error: 'Version conflict',
          conflictDetected: true,
          conflict: {
            id: `${entityType}:${entityId}`,
            entityType,
            entityId,
            localVersion: version,
            remoteVersion: serverVersion,
            localData: data,
            remoteData,
            detectedAt: Date.now(),
          },
        };
      }
      
      // 准备文件内容
      const fileContent = JSON.stringify({
        version: version + 1,
        timestamp: Date.now(),
        data,
      }, null, 2);
      
      const encodedContent = Buffer.from(fileContent).toString('base64');
      
      // 推送到 GitHub
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: `chore: sync ${entityType} ${entityId} (v${version + 1})`,
        content: encodedContent,
        sha: currentSha,
      });
      
      const newVersion = version + 1;
      
      return {
        success: true,
        version: newVersion,
        timestamp: Date.now(),
      };
      
    } catch (error) {
      return {
        success: false,
        version: 0,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 拉取数据从 GitHub
   */
  async pull(
    entityType: string,
    since: number,
    version?: number
  ): Promise<PullResult> {
    try {
      const dirPath = `${this.baseDir}/${entityType}`;
      
      // 获取目录中的所有文件
      const contents = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: dirPath,
      });
      
      if (!Array.isArray(contents.data)) {
        return {
          success: true,
          items: [],
          cursor: { entityType, lastSyncTimestamp: Date.now(), lastSyncVersion: 0 },
          hasMore: false,
        };
      }
      
      // 过滤和处理文件
      const items = [];
      for (const file of contents.data) {
        if (!file.name?.endsWith('.json') || file.type !== 'file') {
          continue;
        }
        
        const fileData = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: file.path,
        });
        
        if ('content' in fileData.data) {
          const decoded = Buffer.from(fileData.data.content, 'base64').toString('utf-8');
          const parsed = JSON.parse(decoded);
          
          if (parsed.timestamp >= since) {
            const entityId = file.name.replace('.json', '');
            items.push({
              entityType,
              entityId,
              data: parsed.data,
              version: parsed.version,
              timestamp: parsed.timestamp,
            });
          }
        }
      }
      
      return {
        success: true,
        items,
        cursor: {
          entityType,
          lastSyncTimestamp: Date.now(),
          lastSyncVersion: version || 0,
        },
        hasMore: false,
        totalItems: items.length,
      };
      
    } catch (error) {
      return {
        success: true,
        items: [],
        cursor: { entityType, lastSyncTimestamp: Date.now(), lastSyncVersion: 0 },
        hasMore: false,
        // 如果目录不存在，返回空列表而不是错误
      };
    }
  }
  
  /**
   * 批量推送
   */
  async batchPush(
    items: Array<{
      entityType: string;
      entityId: string;
      data: EncryptedSyncData;
      version: number;
    }>
  ): Promise<BatchPushResult> {
    const results = [];
    let succeeded = 0;
    let failed = 0;
    let conflicts = 0;
    
    // 按批次处理，避免 API 限流
    for (let i = 0; i < items.length; i += GitHubSyncAdapter.BATCH_SIZE) {
      const batch = items.slice(i, i + GitHubSyncAdapter.BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(item => 
          this.push(
            item.entityType,
            item.entityId,
            item.data,
            item.version
          )
        )
      );
      
      for (const result of batchResults) {
        results.push(result as any);
        if (result.success) {
          succeeded++;
        } else if (result.conflictDetected) {
          conflicts++;
        } else {
          failed++;
        }
      }
      
      // 批次间延迟，避免限流
      if (i + GitHubSyncAdapter.BATCH_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return {
      succeeded,
      failed,
      conflicts,
      results: results as any,
    };
  }
  
  // ========== 冲突处理 ==========
  
  async getRemoteVersion(
    entityType: string,
    entityId: string
  ): Promise<RemoteVersionInfo> {
    try {
      const filePath = this.getFilePath(entityType, entityId);
      const file = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      });
      
      if ('content' in file.data && file.data.content) {
        const decoded = Buffer.from(file.data.content, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        
        return {
          version: parsed.version,
          updatedAt: parsed.timestamp,
          exists: true,
        };
      }
      
      throw new Error('File not found');
    } catch (error) {
      if ((error as any).status === 404) {
        return { version: 0, updatedAt: 0, exists: false };
      }
      throw error;
    }
  }
  
  async resolveConflict(
    conflict: ConflictInfo,
    resolution: ConflictResolution
  ): Promise<void> {
    if (resolution.strategy === 'local' && resolution.resolvedData) {
      // 使用本地数据覆盖服务端
      await this.push(
        conflict.entityType,
        conflict.entityId,
        resolution.resolvedData,
        conflict.remoteVersion
      );
    } else if (resolution.strategy === 'remote') {
      // 用户选择接受远程数据，无需操作
      // (下次 pull 时会获取远程数据)
    } else if (resolution.strategy === 'manual' && resolution.resolvedData) {
      // 使用手动合并的结果
      await this.push(
        conflict.entityType,
        conflict.entityId,
        resolution.resolvedData,
        conflict.remoteVersion
      );
    }
  }
  
  // ========== 游标与增量同步 ==========
  
  async getCursor(entityType: string): Promise<SyncCursor> {
    const health = await this.checkHealth();
    return {
      entityType,
      lastSyncTimestamp: health.lastSyncTime,
      lastSyncVersion: 0,
      createdAt: Date.now(),
    };
  }
  
  async updateCursor(entityType: string, cursor: SyncCursor): Promise<void> {
    // GitHub 使用 Git 历史作为版本控制，不需要显式更新
  }
  
  // ========== 配额 ==========
  
  async getQuota(): Promise<QuotaInfo> {
    try {
      const rateLimit = await this.octokit.rest.rateLimit.get();
      const repo = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      
      const remaining = rateLimit.data.resources.core.remaining;
      const limit = rateLimit.data.resources.core.limit;
      
      return {
        used: limit - remaining,
        total: limit,
        available: remaining,
        remainingApiCalls: remaining,
        resetAt: rateLimit.data.resources.core.reset * 1000,
        usagePercent: ((limit - remaining) / limit) * 100,
      };
    } catch (error) {
      throw new Error(`Failed to get quota: ${error}`);
    }
  }
  
  // ========== 数据导入导出 ==========
  
  async exportAll(): Promise<ExportData> {
    const items = [];
    const entityTypes = ['goals', 'tasks', 'reminders', 'schedules'];
    
    for (const entityType of entityTypes) {
      try {
        const result = await this.pull(entityType, 0);
        items.push(...result.items);
      } catch {
        // 实体类型不存在，跳过
      }
    }
    
    return {
      version: 1,
      exportedAt: Date.now(),
      checksum: this.calculateChecksum(items),
      items: items as any,
      metadata: {
        totalItems: items.length,
        provider: 'github',
      },
    };
  }
  
  async importData(
    data: ExportData,
    options?: ImportOptions
  ): Promise<void> {
    for (const item of data.items) {
      await this.push(
        item.entityType,
        item.entityId,
        item.data,
        0
      );
    }
  }
  
  // ========== 工具方法 ==========
  
  private getFilePath(entityType: string, entityId: string): string {
    return `${this.baseDir}/${entityType}/${entityId}.json`;
  }
  
  private async ensureBaseDir(): Promise<void> {
    try {
      await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: this.baseDir,
      });
    } catch (error) {
      if ((error as any).status === 404) {
        // 创建 .gitkeep 文件以确保目录存在
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: `${this.baseDir}/.gitkeep`,
          message: 'chore: initialize sync directory',
          content: Buffer.from('').toString('base64'),
        });
      } else {
        throw error;
      }
    }
  }
  
  private async getRemoteData(filePath: string): Promise<EncryptedSyncData> {
    const file = await this.octokit.rest.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
    });
    
    if ('content' in file.data && file.data.content) {
      const decoded = Buffer.from(file.data.content, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      return parsed.data;
    }
    
    throw new Error('Failed to retrieve remote data');
  }
  
  private calculateChecksum(items: any[]): string {
    // 简单的校验和计算
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(items))
      .digest('hex');
  }
  
  async clearCache(): Promise<void> {
    // GitHub 适配器不使用本地缓存
  }
  
  protected async cleanup(): Promise<void> {
    // GitHub 适配器无需清理资源
  }
}
```

### 依赖配置

```json
// packages/infrastructure-client/package.json 的 dependencies 部分

{
  "dependencies": {
    "@octokit/rest": "^20.0.0",
    "@octokit/auth-token": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

---

## 📁 文件变更清单

### 新增文件

```
packages/infrastructure-client/src/adapters/
├── GitHubSyncAdapter.ts
└── index.ts (导出)
```

### 修改文件

```
packages/infrastructure-client/package.json
  └── 添加 @octokit/rest 依赖

packages/infrastructure-client/src/index.ts
  └── 导出 GitHubSyncAdapter

packages/application-client/src/sync/factory/AdapterFactory.ts
  └── 注册 GitHubSyncAdapter
```

---

## 🧪 测试要点

### 单元测试

- [ ] 令牌验证
- [ ] 文件路径生成
- [ ] 加密数据序列化
- [ ] 版本冲突检测

### 集成测试

- [ ] 完整的推送/拉取流程
- [ ] 批量操作
- [ ] 冲突解决
- [ ] API 限流处理
- [ ] 网络错误重试

### E2E 测试

- [ ] 使用真实 GitHub Token (使用测试账户)
- [ ] 创建临时仓库进行测试
- [ ] 验证加密数据安全
- [ ] 性能基准测试

---

## 🔗 GitHub API 限制

**Free 计划限制**:
- 认证请求: 5,000/小时
- 建议保留 100 个请求作为缓冲
- 批量操作时错开请求

**文件大小限制**:
- 单个文件 < 25MB
- 仓库 < 100GB

---

## 🚀 下一步

1. 实现 Nutstore 适配器 (STORY-046)
2. 实现 Dropbox 适配器 (STORY-047)
3. 配置向导 UI (STORY-048)
4. 集成测试 (STORY-055)
