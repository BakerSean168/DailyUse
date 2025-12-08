# 云平台同步方案 - 技术设计文档

> **文档版本**: v1.0  
> **创建日期**: 2025-12-08  
> **状态**: 📋 计划中  
> **相关 EPICs**: EPIC-004 (Offline Sync), EPIC-005 (Backend Sync)

---

## 📋 概述

### 背景

DailyUse 项目已实现完整的离线同步基础设施（EPIC-004/005），包括：
- ✅ 客户端同步引擎 (SyncManager)
- ✅ 冲突检测与解决 (ConflictManager)
- ✅ 后端同步服务 (SyncService)
- ✅ 事件溯源架构 (Event Sourcing)

**但关键问题**：用户需要自己部署后端才能使用同步功能，这对大多数用户来说是**不可接受的**。

### 核心洞察

**不应该强制用户自己部署服务器，而应该提供"开箱即用"的云存储方案。**

### 解决方案

采用**分阶段、多提供商策略**：

1. **Phase 1** (立即): 基于云平台的适配器 (GitHub, Nutstore, Dropbox)
2. **Phase 2** (6-18个月): 自有后端作为高级选项
3. **长期**: 用户可自由选择或迁移

---

## 🎯 产品目标

### 短期 (Phase 1: 0-6个月)

| 目标 | 说明 |
|------|------|
| **立即可用** | 用户无需部署，即插即用 |
| **用户信任** | 使用已知品牌的云服务 |
| **零成本** | 免费或低成本上线 |
| **隐私保护** | 用户数据在其掌控中 |

### 中期 (Phase 2: 6-18个月)

| 目标 | 说明 |
|------|------|
| **双引擎** | 同时支持云平台和自有后端 |
| **无缝迁移** | 用户可自由切换提供商 |
| **性能优化** | 自有后端提供更好性能 |
| **商业化** | 自有后端作为高级功能 |

### 长期 (18个月+)

| 目标 | 说明 |
|------|------|
| **完全开放** | 用户可自选、自建、自部署 |
| **生态开放** | 支持第三方同步提供商 |
| **数据可移植** | 完全的数据导入导出能力 |

---

## 🏗️ 架构设计

### 核心原则

1. **适配器模式** - 统一的 SyncAdapter 接口，支持多个实现
2. **无认知成本** - 用户的体验完全一致，不感知底层实现
3. **逐步迁移** - 新用户从云平台开始，可逐步升级到自有服务
4. **数据所有权** - 用户数据始终由用户掌控（加密的前提下）

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop Application                   │
│            (Electron + DDD Domain Layer)                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │      SyncManager (统一接口)        │
         │  - Push/Pull 数据                  │
         │  - 冲突检测与解决                   │
         │  - 离线缓冲队列                     │
         └───────────────┬───────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
   │   GitHub    │ │  Nutstore    │ │  Dropbox     │
   │   Adapter   │ │  Adapter     │ │  Adapter     │
   │             │ │              │ │              │
   │ - REST API  │ │ - WebDAV API │ │ - REST API   │
   │ - WebDAV    │ │ - File Sync  │ │ - Streaming  │
   │ - Encryption│ │ - Encryption │ │ - Encryption │
   └─────────────┘ └──────────────┘ └──────────────┘
        │                │                │
        ▼                ▼                ▼
   ☁️ GitHub Repos    ☁️ Nutstore      ☁️ Dropbox
```

### 统一 SyncAdapter 接口

```typescript
// packages/application-client/src/sync/interfaces/ISyncAdapter.ts
export interface ISyncAdapter {
  // ========== 初始化 ==========
  /**
   * 验证连接和权限
   */
  async authenticate(credentials: AdapterCredentials): Promise<void>;
  
  /**
   * 检查适配器健康状态
   */
  async checkHealth(): Promise<HealthStatus>;

  // ========== 核心同步 ==========
  /**
   * 推送数据到云平台
   * @param entityType - 实体类型 (goal, task, reminder, etc)
   * @param entityId - 实体 ID
   * @param data - 需要推送的数据 (已加密)
   * @param version - 版本号 (用于乐观锁)
   */
  async push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult>;

  /**
   * 从云平台拉取数据
   * @param entityType - 实体类型
   * @param since - 仅获取此时间戳后的变更
   * @param version - 本地当前版本
   */
  async pull(
    entityType: string,
    since: number,
    version?: number
  ): Promise<PullResult>;

  /**
   * 批量同步
   */
  async batchPush(
    items: Array<{
      entityType: string;
      entityId: string;
      data: EncryptedSyncData;
      version: number;
    }>
  ): Promise<BatchPushResult>;

  // ========== 冲突处理 ==========
  /**
   * 获取服务端版本 (用于冲突检测)
   */
  async getRemoteVersion(
    entityType: string,
    entityId: string
  ): Promise<RemoteVersionInfo>;

  /**
   * 解决版本冲突 (服务端参与的策略)
   */
  async resolveConflict(
    conflict: ConflictInfo,
    resolution: ConflictResolution
  ): Promise<void>;

  // ========== 配置管理 ==========
  /**
   * 获取本地游标 (用于增量同步)
   */
  async getCursor(
    entityType: string
  ): Promise<SyncCursor>;

  /**
   * 更新本地游标
   */
  async updateCursor(
    entityType: string,
    cursor: SyncCursor
  ): Promise<void>;

  // ========== 工具方法 ==========
  /**
   * 获取剩余配额 (存储空间、API 调用等)
   */
  async getQuota(): Promise<QuotaInfo>;

  /**
   * 导出全量数据 (用于备份或迁移)
   */
  async exportAll(): Promise<ExportData>;

  /**
   * 导入数据 (从备份恢复)
   */
  async importData(data: ExportData): Promise<void>;
}

// ========== 类型定义 ==========
export interface AdapterCredentials {
  provider: 'github' | 'nutstore' | 'dropbox' | 'self-hosted';
  token?: string;
  repoPath?: string;          // GitHub
  username?: string;          // Nutstore
  encryptionKey: string;      // 本地加密密钥 (不发送到服务器)
}

export interface EncryptedSyncData {
  encryptedPayload: string;   // AES-256-GCM 加密的 JSON
  iv: string;                 // 初始向量
  authTag: string;            // 认证标签
  algorithm: 'AES-256-GCM';
}

export interface PushResult {
  success: boolean;
  version: number;            // 服务端返回的新版本
  timestamp: number;
  error?: string;
  conflictDetected?: boolean; // 是否检测到冲突
}

export interface PullResult {
  success: boolean;
  items: Array<{
    entityType: string;
    entityId: string;
    data: EncryptedSyncData;
    version: number;
    timestamp: number;
  }>;
  cursor: SyncCursor;
  hasMore: boolean;           // 是否有更多数据
}

export interface HealthStatus {
  connected: boolean;
  authenticated: boolean;
  quotaExceeded: boolean;
  lastSyncTime: number;
  errorMessage?: string;
}

export interface SyncCursor {
  entityType: string;
  lastSyncTimestamp: number;
  lastSyncVersion: number;
  position?: string;          // 分页用 (某些提供商需要)
}
```

---

## 🔐 加密策略

### 核心设计原则

**用户端加密 + 零知识架构**

```typescript
interface EncryptionDesign {
  // 密钥管理
  keyManagement: {
    masterKey: "用户密码 或 生物认证生成",
    derivation: "PBKDF2 (用户密码 + Salt)",
    storage: "本地 localStorage (已加密)",
    transport: "仅在本地使用，不发送到服务器",
  },
  
  // 加密流程
  encryptionFlow: {
    input: "用户数据 (JSON)",
    step1: "使用 AES-256-GCM 加密",
    step2: "生成 IV (初始向量) 和 Auth Tag",
    output: "加密二进制数据 + 元数据",
    upload: "发送到云平台",
  },
  
  // 解密流程
  decryptionFlow: {
    download: "从云平台下载加密数据",
    input: "加密数据 + IV + Auth Tag",
    step1: "用户输入密钥 或 生物认证",
    step2: "使用 AES-256-GCM 解密",
    output: "原始数据 (JSON)",
  },
  
  // 安全性保证
  security: [
    "✅ 服务端看不到明文数据",
    "✅ 即使云平台被入侵，数据仍然安全",
    "✅ 用户可随时更改密钥",
    "✅ 支持多设备使用同一密钥",
  ]
}
```

### 实现细节

```typescript
// packages/infrastructure-client/src/encryption/EncryptionService.ts
export class EncryptionService {
  private masterKey: CryptoKey;
  
  /**
   * 从用户密码衍生密钥
   */
  static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array = crypto.getRandomValues(new Uint8Array(16))
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * 加密数据
   */
  async encrypt(
    data: object,
    encryptionKey: CryptoKey
  ): Promise<EncryptedSyncData> {
    const plaintext = JSON.stringify(data);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(plaintext);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      encryptionKey,
      encoded
    );
    
    return {
      encryptedPayload: Buffer.from(encrypted).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      authTag: '', // AES-GCM 包含在 encrypted 中
      algorithm: 'AES-256-GCM',
    };
  }
  
  /**
   * 解密数据
   */
  async decrypt(
    encryptedData: EncryptedSyncData,
    encryptionKey: CryptoKey
  ): Promise<object> {
    const encrypted = Buffer.from(encryptedData.encryptedPayload, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      encryptionKey,
      encrypted
    );
    
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decrypted);
    
    return JSON.parse(plaintext);
  }
}
```

---

## 🔌 具体实现

### 1. GitHub 适配器

#### 为什么是 GitHub？

| 优势 | 说明 |
|------|------|
| **开发者友好** | 几乎所有开发者都有 GitHub 账户 |
| **完全免费** | 私有仓库无限制 |
| **版本控制天然** | Git 的冲突解决能力完全适用 |
| **易于迁移** | Git 可轻松导出/导入 |
| **API 完善** | REST 和 GraphQL 都支持 |

#### 存储结构

```
user/dailyuse-data (私有仓库)
├── .dailyuse/
│   ├── metadata.json          # 同步元数据
│   │   {
│   │     "version": 1,
│   │     "lastSync": 1702032000,
│   │     "devices": ["device-1", "device-2"],
│   │     "syncCursors": {
│   │       "goal": { "version": 42, "timestamp": 1702032000 },
│   │       "task": { "version": 156, "timestamp": 1702032000 }
│   │     }
│   │   }
│   └── encryption.json        # 加密配置 (不含密钥)
│       {
│         "algorithm": "AES-256-GCM",
│         "keyDerivation": "PBKDF2"
│       }
├── data/
│   ├── goals/                 # 目标数据
│   │   ├── goal-uuid-1.json
│   │   ├── goal-uuid-2.json
│   │   └── ...
│   ├── tasks/                 # 任务数据
│   │   ├── task-uuid-1.json
│   │   ├── task-uuid-2.json
│   │   └── ...
│   ├── reminders/             # 提醒数据
│   │   └── ...
│   └── schedules/             # 日程数据
│       └── ...
└── sync-log/                  # 同步日志 (仅本地)
    ├── 2025-12-08.log
    └── ...
```

#### 实现代码

```typescript
// packages/infrastructure-client/src/adapters/GitHubSyncAdapter.ts
import { Octokit } from '@octokit/rest';
import type { ISyncAdapter, EncryptedSyncData, PushResult, PullResult } from '../interfaces/ISyncAdapter';

export class GitHubSyncAdapter implements ISyncAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private encryptionService: EncryptionService;
  
  constructor(
    githubToken: string,
    repoPath: string = 'user/dailyuse-data',
    encryptionService: EncryptionService
  ) {
    this.octokit = new Octokit({ auth: githubToken });
    const [owner, repo] = repoPath.split('/');
    this.owner = owner;
    this.repo = repo;
    this.encryptionService = encryptionService;
  }
  
  async authenticate(credentials: AdapterCredentials): Promise<void> {
    try {
      const user = await this.octokit.rest.users.getAuthenticated();
      console.log(`Authenticated as ${user.data.login}`);
      
      // 确保仓库存在
      await this.ensureRepoExists();
    } catch (error) {
      throw new Error(`GitHub authentication failed: ${error.message}`);
    }
  }
  
  async push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult> {
    const filePath = `data/${entityType}/${entityId}.json`;
    const fileContent = JSON.stringify(data);
    
    try {
      // 获取现有文件 (用于 SHA)
      let sha: string | undefined;
      try {
        const existingFile = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
        });
        sha = existingFile.data.sha;
      } catch (error) {
        // 文件不存在，这是第一次创建
        sha = undefined;
      }
      
      // 上传文件
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: `chore(sync): update ${entityType}/${entityId} v${version}`,
        content: Buffer.from(fileContent).toString('base64'),
        sha: sha,
      });
      
      return {
        success: true,
        version: version + 1,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        version: version,
        timestamp: Date.now(),
        error: error.message,
      };
    }
  }
  
  async pull(
    entityType: string,
    since: number,
    version?: number
  ): Promise<PullResult> {
    try {
      // 获取目录下所有文件
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: `data/${entityType}`,
      });
      
      const items: PullResult['items'] = [];
      
      if (Array.isArray(response.data)) {
        for (const file of response.data) {
          if (file.name.endsWith('.json')) {
            const fileContent = await this.octokit.rest.repos.getContent({
              owner: this.owner,
              repo: this.repo,
              path: file.path,
            });
            
            const content = Buffer.from(fileContent.data.content, 'base64').toString();
            const data = JSON.parse(content);
            const entityId = file.name.replace('.json', '');
            
            // 根据时间戳过滤
            if (fileContent.data.updated_at) {
              const updateTime = new Date(fileContent.data.updated_at).getTime();
              if (updateTime > since) {
                items.push({
                  entityType,
                  entityId,
                  data,
                  version: version ? version + 1 : 1,
                  timestamp: updateTime,
                });
              }
            }
          }
        }
      }
      
      return {
        success: true,
        items,
        cursor: {
          entityType,
          lastSyncTimestamp: Date.now(),
          lastSyncVersion: version ? version + 1 : 1,
        },
        hasMore: false,
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        cursor: {
          entityType,
          lastSyncTimestamp: Date.now(),
          lastSyncVersion: version || 0,
        },
        hasMore: false,
      };
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    try {
      const user = await this.octokit.rest.users.getAuthenticated();
      const repo = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      
      return {
        connected: true,
        authenticated: true,
        quotaExceeded: false,
        lastSyncTime: Date.now(),
      };
    } catch (error) {
      return {
        connected: false,
        authenticated: false,
        quotaExceeded: false,
        lastSyncTime: 0,
        errorMessage: error.message,
      };
    }
  }
  
  private async ensureRepoExists(): Promise<void> {
    try {
      await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
    } catch (error) {
      // 仓库不存在，创建它
      await this.octokit.rest.repos.createForAuthenticatedUser({
        name: this.repo,
        private: true,
        description: 'DailyUse encrypted sync data repository',
      });
      
      // 创建初始目录结构
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: '.dailyuse/metadata.json',
        message: 'chore: initialize sync repository',
        content: Buffer.from(
          JSON.stringify({
            version: 1,
            lastSync: Date.now(),
            devices: [],
            syncCursors: {},
          }, null, 2)
        ).toString('base64'),
      });
    }
  }
}
```

#### API 限流考虑

```typescript
interface GitHubRateLimiting {
  // GitHub API 限制
  limits: {
    authenticated: "60 req/hour per token",
    unauthenticated: "60 req/hour per IP",
  },
  
  // 优化策略
  optimization: {
    batchOperations: "合并多个文件更新为一个请求",
    polling: "使用 Webhooks 而非轮询",
    caching: "本地缓存元数据",
    rateLimit: "实现退避重试策略",
  },
  
  // 个人用户足够吗?
  analysis: {
    userBehavior: "平均每天 5-10 次同步",
    perSync: "约 3-5 个 API 请求 (push/pull)",
    dailyQuota: "15-50 请求",
    hourlyPeak: "可能达到 20-30 请求",
    conclusion: "✅ 60/hour 的限制足够个人用户",
  }
}
```

### 2. Nutstore (坚果云) 适配器

#### 为什么选择坚果云？

| 优势 | 说明 |
|------|------|
| **国内服务** | 上传下载速度快，不需梯子 |
| **WebDAV 支持** | 可直接作为文件系统挂载 |
| **免费额度** | 每月免费 6GB 流量 |
| **国产用户友好** | 很多国内用户已在用 |

#### 实现代码

```typescript
// packages/infrastructure-client/src/adapters/NutstoreSyncAdapter.ts
import { Client as WebDAVClient } from '@webdav/client';
import type { ISyncAdapter, EncryptedSyncData, PushResult, PullResult } from '../interfaces/ISyncAdapter';

export class NutstoreSyncAdapter implements ISyncAdapter {
  private client: WebDAVClient;
  private basePath: string = '/dav/DailyUse';
  private encryptionService: EncryptionService;
  
  constructor(
    username: string,
    password: string,
    encryptionService: EncryptionService
  ) {
    this.client = createClient({
      hostname: 'https://dav.jianguoyun.com',
      username: username,
      password: password,
    });
    this.encryptionService = encryptionService;
  }
  
  async authenticate(credentials: AdapterCredentials): Promise<void> {
    try {
      const stat = await this.client.stat(this.basePath);
      console.log(`Connected to Nutstore at ${this.basePath}`);
    } catch (error) {
      // 路径不存在，创建它
      await this.ensureBasePath();
    }
  }
  
  async push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult> {
    const filePath = `${this.basePath}/data/${entityType}/${entityId}.json`;
    
    try {
      await this.client.putFileContents(
        filePath,
        JSON.stringify(data),
        {
          overwrite: true,
        }
      );
      
      return {
        success: true,
        version: version + 1,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        version: version,
        timestamp: Date.now(),
        error: error.message,
      };
    }
  }
  
  async pull(
    entityType: string,
    since: number,
    version?: number
  ): Promise<PullResult> {
    try {
      const dirPath = `${this.basePath}/data/${entityType}`;
      const contents = await this.client.getDirectoryContents(dirPath);
      
      const items: PullResult['items'] = [];
      
      for (const file of contents) {
        if (file.basename.endsWith('.json')) {
          const fileContent = await this.client.getFileContents(file.filename);
          const data = JSON.parse(fileContent);
          const entityId = file.basename.replace('.json', '');
          
          // 根据修改时间过滤
          const updateTime = new Date(file.lastmod).getTime();
          if (updateTime > since) {
            items.push({
              entityType,
              entityId,
              data,
              version: version ? version + 1 : 1,
              timestamp: updateTime,
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
          lastSyncVersion: version ? version + 1 : 1,
        },
        hasMore: false,
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        cursor: {
          entityType,
          lastSyncTimestamp: Date.now(),
          lastSyncVersion: version || 0,
        },
        hasMore: false,
      };
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    try {
      const stat = await this.client.stat(this.basePath);
      return {
        connected: true,
        authenticated: true,
        quotaExceeded: false,
        lastSyncTime: Date.now(),
      };
    } catch (error) {
      return {
        connected: false,
        authenticated: false,
        quotaExceeded: false,
        lastSyncTime: 0,
        errorMessage: error.message,
      };
    }
  }
  
  private async ensureBasePath(): Promise<void> {
    try {
      // 尝试创建目录
      await this.client.createDirectory(`${this.basePath}/data/goals`);
      await this.client.createDirectory(`${this.basePath}/data/tasks`);
      await this.client.createDirectory(`${this.basePath}/data/reminders`);
      await this.client.createDirectory(`${this.basePath}/data/schedules`);
      
      console.log('Created Nutstore directory structure');
    } catch (error) {
      throw new Error(`Failed to create Nutstore directories: ${error.message}`);
    }
  }
}
```

### 3. Dropbox 适配器

```typescript
// packages/infrastructure-client/src/adapters/DropboxSyncAdapter.ts
import { Dropbox } from 'dropbox';
import type { ISyncAdapter, EncryptedSyncData, PushResult, PullResult } from '../interfaces/ISyncAdapter';

export class DropboxSyncAdapter implements ISyncAdapter {
  private dropbox: Dropbox;
  private basePath: string = '/DailyUse';
  private encryptionService: EncryptionService;
  
  constructor(
    accessToken: string,
    encryptionService: EncryptionService
  ) {
    this.dropbox = new Dropbox({ auth: accessToken });
    this.encryptionService = encryptionService;
  }
  
  async authenticate(credentials: AdapterCredentials): Promise<void> {
    try {
      const auth = await this.dropbox.usersGetCurrentAccount();
      console.log(`Authenticated as ${auth.result.name.display_name}`);
      await this.ensureBasePath();
    } catch (error) {
      throw new Error(`Dropbox authentication failed: ${error.message}`);
    }
  }
  
  async push(
    entityType: string,
    entityId: string,
    data: EncryptedSyncData,
    version: number
  ): Promise<PushResult> {
    const filePath = `${this.basePath}/data/${entityType}/${entityId}.json`;
    const fileContent = Buffer.from(JSON.stringify(data));
    
    try {
      await this.dropbox.filesUpload({
        path: filePath,
        contents: fileContent,
        mode: { '.tag': 'overwrite' },
      });
      
      return {
        success: true,
        version: version + 1,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        version: version,
        timestamp: Date.now(),
        error: error.message,
      };
    }
  }
  
  async pull(
    entityType: string,
    since: number,
    version?: number
  ): Promise<PullResult> {
    try {
      const dirPath = `${this.basePath}/data/${entityType}`;
      const response = await this.dropbox.filesListFolder({
        path: dirPath,
        recursive: false,
      });
      
      const items: PullResult['items'] = [];
      
      for (const entry of response.result.entries) {
        if (entry['.tag'] === 'file' && entry.name.endsWith('.json')) {
          const fileContent = await this.dropbox.filesDownload({
            path: entry.path_display!,
          });
          
          const content = Buffer.from(fileContent.result.fileBinary).toString();
          const data = JSON.parse(content);
          const entityId = entry.name.replace('.json', '');
          
          // 根据修改时间过滤
          const updateTime = new Date(entry.server_modified).getTime();
          if (updateTime > since) {
            items.push({
              entityType,
              entityId,
              data,
              version: version ? version + 1 : 1,
              timestamp: updateTime,
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
          lastSyncVersion: version ? version + 1 : 1,
        },
        hasMore: false,
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        cursor: {
          entityType,
          lastSyncTimestamp: Date.now(),
          lastSyncVersion: version || 0,
        },
        hasMore: false,
      };
    }
  }
  
  async checkHealth(): Promise<HealthStatus> {
    try {
      await this.dropbox.usersGetCurrentAccount();
      const space = await this.dropbox.usersGetSpaceUsage();
      
      const isQuotaExceeded = 
        space.result.used >= space.result.allocation.allocated * 0.95;
      
      return {
        connected: true,
        authenticated: true,
        quotaExceeded: isQuotaExceeded,
        lastSyncTime: Date.now(),
      };
    } catch (error) {
      return {
        connected: false,
        authenticated: false,
        quotaExceeded: false,
        lastSyncTime: 0,
        errorMessage: error.message,
      };
    }
  }
  
  private async ensureBasePath(): Promise<void> {
    // Dropbox 自动创建目录，无需手动创建
  }
}
```

---

## 📱 用户配置 UI

### 配置流程

```
┌─────────────────────────────────────────────────────┐
│            同步设置 - 选择存储提供商                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  选择同步方式:                                       │
│                                                      │
│  ○ 本地离线 (不同步)                                 │
│                                                      │
│  ⚫ GitHub (推荐)                                     │
│     ├─ 免费 (私有仓库无限)                           │
│     ├─ 开发者友好                                    │
│     └─ 版本控制支持 Git                             │
│     [连接 GitHub]                                    │
│                                                      │
│  ○ 坚果云 (国内快速)                                 │
│     ├─ 免费 (6GB/月)                                │
│     ├─ WebDAV 支持                                  │
│     └─ 上传下载快                                   │
│     [连接坚果云]                                     │
│                                                      │
│  ○ Dropbox                                          │
│     ├─ 免费 (2GB)                                   │
│     ├─ 跨平台                                       │
│     └─ 可靠稳定                                     │
│     [连接 Dropbox]                                  │
│                                                      │
│  ○ 自有服务器 (Phase 2)                             │
│     ├─ 完全控制                                     │
│     ├─ 高级功能                                     │
│     └─ 企业级支持                                   │
│     [配置自有服务器]                                 │
│                                                      │
├─────────────────────────────────────────────────────┤
│                [下一步]                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            设置加密密钥                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  这个密钥用于本地加密你的数据                         │
│  存储提供商将看不到你的数据内容                       │
│                                                      │
│  密钥生成方式:                                       │
│                                                      │
│  ⚫ 使用密码                                         │
│     输入一个强密码:                                  │
│     ┌──────────────────────────────────────────┐   │
│     │ ••••••••••                               │   │
│     └──────────────────────────────────────────┘   │
│     [显示/隐藏]  [生成强密码]                       │
│                                                      │
│  ○ 使用生物认证                                     │
│     ├─ Windows Hello                              │
│     ├─ Face ID                                    │
│     └─ Touch ID                                   │
│                                                      │
│  ⚠️ 重要提示:                                       │
│     • 妥善保管密钥，丢失将无法恢复数据                │
│     • 可将密钥导出备份                              │
│     • 建议使用密码管理器保存                         │
│                                                      │
├─────────────────────────────────────────────────────┤
│     [返回]                    [完成设置]             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            同步配置完成！                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ✅ GitHub 仓库连接成功                             │
│  ✅ 加密密钥已设置                                  │
│  ✅ 开始首次同步...                                 │
│                                                      │
│  同步进度:                                          │
│  ├─ 上传目标数据... [██████░░░░] 60%               │
│  ├─ 上传任务数据... [████░░░░░░] 40%               │
│  └─ 上传提醒数据... [░░░░░░░░░░] 0%               │
│                                                      │
│  预计完成时间: 2 分钟                                │
│                                                      │
├─────────────────────────────────────────────────────┤
│                [完成]                               │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 迁移策略 (Phase 1 → Phase 2)

### 为什么用户可能想迁移到自有后端？

| 原因 | 说明 |
|------|------|
| **性能要求** | 实时同步，不要等待 API 响应 |
| **集成需求** | 与其他自有系统集成 |
| **隐私极端** | 不想依赖任何第三方 |
| **企业部署** | 组织内网部署 |

### 无缝迁移方案

```typescript
interface MigrationPath {
  // Phase 1: 云平台
  phase1: {
    provider: 'github' | 'nutstore' | 'dropbox',
    storage: EncryptedJSON,
    encryption: ClientSideE2E,
  },
  
  // 迁移中: 双向同步
  migration: {
    source: CloudAdapter,
    destination: SelfHostedAdapter,
    direction: 'bidirectional',
    conflictStrategy: 'prefer_self_hosted',
  },
  
  // Phase 2: 自有后端
  phase2: {
    provider: 'self-hosted',
    storage: PostgreSQL,
    encryption: ServerSideE2E,
    additionalFeatures: [
      'Real-time sync (WebSocket)',
      'Advanced conflict resolution',
      'Data analytics',
      'Backup & restore',
      'Audit logs',
    ]
  },
  
  // 降级: 保持备份
  fallback: {
    keepCloudCopy: true,
    syncFrequency: 'weekly',
    emergencyAccess: true,
  }
}
```

### 迁移 UI 流程

```
设置 → 同步 → [当前提供商: GitHub]
                    ↓
            [切换提供商...]
                    ↓
         选择新提供商: 自有服务器
                    ↓
    输入服务器地址: https://sync.example.com
                    ↓
    验证连接... [✅ 连接成功]
                    ↓
    开始迁移?
    [当前: GitHub] → [新: Self-hosted]
    
    数据迁移选项:
    ○ 复制全部数据
    ○ 仅复制最近 6 个月
    ○ 只迁移最新版本
                    ↓
        迁移进度: [████████░░] 80%
        已迁移: 1,247 项目
        剩余时间: 2 分钟
                    ↓
    ✅ 迁移完成!
    
    现在选择:
    [ ] 保持 GitHub 副本 (备份)
    [ ] 删除 GitHub 数据 (释放空间)
    [完成]
```

---

## 🎯 Phase 1 实施计划

### Sprint 1: 架构与加密

| 任务 | 工时 | 优先级 |
|------|------|--------|
| 设计 SyncAdapter 接口 | 4h | P0 |
| 实现 EncryptionService | 8h | P0 |
| 单元测试 | 4h | P0 |

### Sprint 2: GitHub 适配器

| 任务 | 工时 | 优先级 |
|------|------|--------|
| 实现 GitHubSyncAdapter | 16h | P0 |
| 集成测试 | 8h | P0 |
| 文档编写 | 4h | P1 |

### Sprint 3: 其他适配器

| 任务 | 工时 | 优先级 |
|------|------|--------|
| NutstoreSyncAdapter | 12h | P1 |
| DropboxSyncAdapter | 12h | P1 |
| 集成测试 | 8h | P1 |

### Sprint 4: UI & 配置

| 任务 | 工时 | 优先级 |
|------|------|--------|
| 同步设置 UI | 16h | P0 |
| 配置向导 | 8h | P0 |
| 错误处理与恢复 | 8h | P0 |
| E2E 测试 | 8h | P0 |

---

## ✅ 验收标准

### Functional

- [ ] 用户可配置 GitHub/Nutstore/Dropbox
- [ ] 数据成功加密并上传到云平台
- [ ] 多设备可同步数据
- [ ] 冲突自动解决
- [ ] 离线时本地数据保留
- [ ] 网络恢复时自动同步

### Non-Functional

- [ ] 同步延迟 < 5 秒
- [ ] 加密/解密 < 1 秒
- [ ] 首次同步 < 2 分钟 (1000 项数据)
- [ ] 内存占用 < 100MB
- [ ] 支持离线使用 1 周+

### Security

- [ ] 服务端看不到明文数据
- [ ] 密钥仅本地存储
- [ ] 支持导出/备份密钥
- [ ] 通过 OWASP 安全检查

---

## 📚 相关文档

- [EPIC-004: Offline Sync](../sprint-artifacts/EPIC-004-offline-sync.md)
- [EPIC-005: Backend Sync Service](../sprint-artifacts/EPIC-005-backend-sync-service.md)
- [ADR-003: Module Extension Strategy](./adr/003-module-extension-strategy.md)

---

## 🔗 附录

### GitHub 认证流程

```
1. 用户点击 [连接 GitHub]
2. 打开 GitHub OAuth 授权页面
3. 用户选择或创建私有仓库 (user/dailyuse-data)
4. GitHub 返回 Personal Access Token
5. Token 存储到本地 (使用系统密钥环)
6. 验证连接成功
```

### 坚果云 WebDAV 认证

```
1. 用户输入坚果云用户名和密码
2. 使用 HTTPS Basic Auth 连接 WebDAV
3. 验证连接并创建目录结构
4. 密码存储到本地 (使用系统密钥环)
```

### 数据迁移 (GitHub → Self-Hosted)

```
1. 从 GitHub 下载所有加密数据
2. 在本地验证数据完整性
3. 解密数据 (使用用户密钥)
4. 重新加密 (如果使用新密钥)
5. 上传到自有服务器
6. 验证数据完整性
7. 可选: 保留 GitHub 备份或删除
```

---

**文档完成于**: 2025-12-08  
**下一步**: 根据此文档开始 Phase 1 实施
