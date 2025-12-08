/**
 * Sync Client Service
 * 
 * EPIC-004: Offline Sync - 同步 API 客户端
 * STORY-020: Network Sync Layer
 * 
 * 职责：
 * - 与后端同步 API 通信
 * - Push 本地变更到服务器
 * - Pull 远程变更到本地
 * - 处理认证 token
 */

import type { SyncLogEntry } from './sync-log.service';

// ========== API 类型定义 ==========

export interface SyncPushPayload {
  deviceId: string;
  changes: SyncLogEntry[];
  lastSyncVersion: number;
}

export interface ConflictInfo {
  entityType: string;
  entityId: string;
  localVersion: number;
  serverVersion: number;
  serverData: unknown;
  conflictingFields: string[];
}

export interface SyncPushResult {
  /** 已接受的事件 ID */
  accepted: string[];
  /** 冲突信息 */
  conflicts: ConflictInfo[];
  /** 新版本号 */
  newVersion: number;
}

export interface SyncPullPayload {
  deviceId: string;
  lastSyncVersion: number;
  limit?: number;
}

export interface RemoteChange {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  version: number;
  deviceId: string;
  timestamp: number;
}

export interface SyncPullResponse {
  changes: RemoteChange[];
  currentVersion: number;
  hasMore: boolean;
}

export interface SyncClientConfig {
  /** 同步服务器基础 URL */
  baseUrl: string;
  /** 请求超时（毫秒） */
  timeout?: number;
}

export class SyncClientService {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor(config: SyncClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // 移除尾部斜杠
    this.timeout = config.timeout || 30000; // 30s
  }

  /**
   * 设置认证 token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * 发送请求
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SyncApiError(
          response.status,
          errorData.message || response.statusText,
          errorData
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof SyncApiError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new SyncApiError(0, 'Request timeout');
      }

      throw new SyncApiError(0, 'Network error', { originalError: error });
    }
  }

  /**
   * Push 本地变更到服务器
   */
  async pushChanges(payload: SyncPushPayload): Promise<SyncPushResult> {
    console.log(`[SyncClient] Pushing ${payload.changes.length} changes`);
    
    const result = await this.request<SyncPushResult>(
      'POST',
      '/sync/push',
      payload
    );

    console.log(`[SyncClient] Push result: ${result.accepted.length} accepted, ${result.conflicts.length} conflicts`);
    return result;
  }

  /**
   * Pull 远程变更
   */
  async pullChanges(payload: SyncPullPayload): Promise<SyncPullResponse> {
    console.log(`[SyncClient] Pulling changes since version ${payload.lastSyncVersion}`);
    
    const result = await this.request<SyncPullResponse>(
      'POST',
      '/sync/pull',
      payload
    );

    console.log(`[SyncClient] Pulled ${result.changes.length} changes, hasMore: ${result.hasMore}`);
    return result;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 更新基础 URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }
}

/**
 * 同步 API 错误
 */
export class SyncApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'SyncApiError';
  }

  /**
   * 是否为网络错误（可重试）
   */
  isNetworkError(): boolean {
    return this.statusCode === 0;
  }

  /**
   * 是否为认证错误（不可重试）
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /**
   * 是否为服务器错误（可重试）
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * 是否为冲突错误
   */
  isConflictError(): boolean {
    return this.statusCode === 409;
  }

  /**
   * 是否可重试
   */
  isRetryable(): boolean {
    return this.isNetworkError() || this.isServerError();
  }
}
