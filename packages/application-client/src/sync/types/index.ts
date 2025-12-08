/**
 * @fileoverview 云同步适配器的类型定义
 * @module @dailyuse/application-client/sync/types
 */

// ========== 认证和连接 ==========

/**
 * 云平台认证凭据
 */
export interface AdapterCredentials {
  /** 提供商类型 */
  provider: 'github' | 'nutstore' | 'dropbox' | 'self-hosted';
  
  /** 访问令牌或密码 (基于提供商) */
  token?: string;
  
  /** 用户名 (某些提供商需要) */
  username?: string;
  
  /** 仓库路径 (GitHub: 'owner/repo', 其他: 目录路径) */
  repoPath?: string;
  
  /** 加密密钥 (本地存储，不上传到云平台) */
  encryptionKey: string;
  
  /** 可选的服务器地址 (自有服务器场景) */
  serverUrl?: string;
  
  /** 其他提供商特定配置 */
  [key: string]: any;
}

/**
 * 适配器健康状态
 */
export interface HealthStatus {
  /** 网络连接状态 */
  connected: boolean;
  
  /** 认证状态 */
  authenticated: boolean;
  
  /** 配额是否已超 */
  quotaExceeded: boolean;
  
  /** 最后一次成功同步时间 (毫秒时间戳) */
  lastSyncTime: number;
  
  /** 错误信息 (如果有) */
  errorMessage?: string;
  
  /** 详细诊断信息 */
  diagnostics?: Record<string, any>;
}

// ========== 加密数据 ==========

/**
 * 加密后的同步数据
 * 
 * 所有上传到云平台的数据都应该加密
 */
export interface EncryptedSyncData {
  /** Base64 编码的加密内容 */
  encryptedPayload: string;
  
  /** 初始向量 (Base64 编码) */
  iv: string;
  
  /** 认证标签 (Base64 编码，用于 GCM 模式) */
  authTag: string;
  
  /** 加密算法 */
  algorithm: 'AES-256-GCM';
  
  /** 可选的元数据（不加密） */
  metadata?: {
    /** 原始数据大小 (字节) */
    originalSize: number;
    /** 加密时间戳 */
    timestamp: number;
    /** 校验和 (可选) */
    checksum?: string;
  };
}

// ========== 推送/拉取结果 ==========

/**
 * 推送操作的结果
 */
export interface PushResult {
  /** 是否成功 */
  success: boolean;
  
  /** 服务端返回的新版本号 */
  version: number;
  
  /** 操作时间戳 (毫秒) */
  timestamp: number;
  
  /** 错误信息 (如果 success = false) */
  error?: string;
  
  /** 是否检测到冲突 */
  conflictDetected?: boolean;
  
  /** 冲突详情 (如果检测到冲突) */
  conflict?: ConflictInfo;
}

/**
 * 拉取操作的结果
 */
export interface PullResult {
  /** 是否成功 */
  success: boolean;
  
  /** 拉取到的数据项 */
  items: Array<{
    entityType: string;
    entityId: string;
    data: EncryptedSyncData;
    version: number;
    timestamp: number;
  }>;
  
  /** 用于下次增量同步的游标 */
  cursor: SyncCursor;
  
  /** 是否还有更多数据 (分页) */
  hasMore: boolean;
  
  /** 总数据项数 (可选) */
  totalItems?: number;
}

/**
 * 批量推送的结果
 */
export interface BatchPushResult {
  /** 成功推送的项数 */
  succeeded: number;
  
  /** 失败的项数 */
  failed: number;
  
  /** 冲突的项数 */
  conflicts: number;
  
  /** 详细结果 */
  results: Array<PushResult & { entityId: string; entityType: string }>;
  
  /** 错误信息列表 */
  errors?: string[];
}

// ========== 冲突处理 ==========

/**
 * 冲突信息
 */
export interface ConflictInfo {
  /** 冲突 ID */
  id: string;
  
  /** 实体类型 */
  entityType: string;
  
  /** 实体 ID */
  entityId: string;
  
  /** 本地版本 */
  localVersion: number;
  
  /** 服务端版本 */
  remoteVersion: number;
  
  /** 本地数据 (加密) */
  localData: EncryptedSyncData;
  
  /** 服务端数据 (加密) */
  remoteData: EncryptedSyncData;
  
  /** 冲突字段列表 (可选) */
  conflictingFields?: string[];
  
  /** 检测时间 (毫秒时间戳) */
  detectedAt: number;
}

/**
 * 冲突解决方案
 */
export interface ConflictResolution {
  /** 解决策略 */
  strategy: 'local' | 'remote' | 'manual' | 'merge';
  
  /** 解决后的数据 (如果是 manual 或 merge 策略) */
  resolvedData?: EncryptedSyncData;
  
  /** 手动合并的字段选择 (字段名 -> 'local' 或 'remote') */
  fieldSelections?: Record<string, 'local' | 'remote'>;
}

// ========== 游标与增量同步 ==========

/**
 * 同步游标
 * 
 * 用于追踪增量同步的位置
 */
export interface SyncCursor {
  /** 实体类型 */
  entityType: string;
  
  /** 最后同步的时间戳 (毫秒) */
  lastSyncTimestamp: number;
  
  /** 最后同步的版本 */
  lastSyncVersion: number;
  
  /** 分页位置 (某些提供商使用) */
  position?: string;
  
  /** 游标创建时间 (毫秒时间戳) */
  createdAt: number;
}

// ========== 配额信息 ==========

/**
 * 存储配额信息
 */
export interface QuotaInfo {
  /** 已用存储空间 (字节) */
  used: number;
  
  /** 总存储配额 (字节) */
  total: number;
  
  /** 可用空间 (字节) */
  available: number;
  
  /** 剩余 API 调用次数 (某些提供商限制) */
  remainingApiCalls?: number;
  
  /** API 调用配额重置时间 (毫秒时间戳) */
  resetAt?: number;
  
  /** 使用百分比 (0-100) */
  usagePercent: number;
}

// ========== 配置 ==========

/**
 * 适配器配置
 */
export interface AdapterConfig {
  /** 网络请求失败时的重试次数 */
  retryCount: number;
  
  /** 重试之间的延迟 (毫秒) */
  retryDelay: number;
  
  /** 请求超时时间 (毫秒) */
  timeout: number;
  
  /** 是否启用本地缓存 */
  enableCache: boolean;
  
  /** 缓存过期时间 (毫秒) */
  cacheExpiry: number;
  
  /** 最大并发请求数 */
  maxConcurrentRequests: number;
}

// ========== 数据导出导入 ==========

/**
 * 导出的数据包
 */
export interface ExportData {
  /** 导出格式版本 */
  version: 1;
  
  /** 导出时间 (毫秒时间戳) */
  exportedAt: number;
  
  /** 数据完整性校验和 (SHA-256) */
  checksum: string;
  
  /** 数据项列表 */
  items: Array<{
    entityType: string;
    entityId: string;
    data: EncryptedSyncData;
    version: number;
  }>;
  
  /** 元数据 */
  metadata: {
    totalItems: number;
    provider: string;
    userEmail?: string;
  };
}

/**
 * 导入选项
 */
export interface ImportOptions {
  /** 是否覆盖现有数据 */
  overwrite?: boolean;
  
  /** 冲突解决策略 */
  conflictStrategy?: 'local' | 'remote' | 'skip';
  
  /** 是否验证校验和 */
  validateChecksum?: boolean;
}

// ========== 远程版本信息 ==========

/**
 * 远程实体的版本信息
 */
export interface RemoteVersionInfo {
  /** 当前版本号 */
  version: number;
  
  /** 最后更新时间 (毫秒时间戳) */
  updatedAt: number;
  
  /** 更新者标识 (可选) */
  updatedBy?: string;
  
  /** 实体是否存在于远程 */
  exists: boolean;
}
