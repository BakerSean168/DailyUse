/**
 * Network Service
 * 
 * EPIC-004: Offline Sync - 网络状态监控
 * STORY-020: Network Sync Layer
 * 
 * 职责：
 * - 监控网络连接状态
 * - 定期健康检查（防止假在线）
 * - 触发 online/offline 事件
 */

import { EventEmitter } from 'events';

export interface NetworkServiceConfig {
  /** 同步服务器 URL */
  syncServerUrl?: string;
  /** 健康检查间隔（毫秒），默认 30 秒 */
  healthCheckInterval?: number;
  /** 健康检查超时（毫秒），默认 5 秒 */
  healthCheckTimeout?: number;
}

export interface NetworkServiceEvents {
  online: () => void;
  offline: () => void;
  'status-change': (isOnline: boolean) => void;
}

export class NetworkService extends EventEmitter {
  private isOnline: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private syncServerUrl: string;
  private readonly healthCheckIntervalMs: number;
  private readonly healthCheckTimeoutMs: number;
  private lastCheckAt: number | null = null;

  constructor(config: NetworkServiceConfig = {}) {
    super();
    this.syncServerUrl = config.syncServerUrl || '';
    this.healthCheckIntervalMs = config.healthCheckInterval || 30000; // 30s
    this.healthCheckTimeoutMs = config.healthCheckTimeout || 5000; // 5s
  }

  /**
   * 初始化网络服务
   */
  initialize(): void {
    // 在 Electron 主进程中使用 net 模块检查
    this.isOnline = this.checkInitialStatus();
    console.log(`[NetworkService] Initialized, online: ${this.isOnline}`);

    // 启动定期健康检查
    this.startHealthCheck();
  }

  /**
   * 检查初始网络状态
   */
  private checkInitialStatus(): boolean {
    // 在 Electron 主进程中，我们假设在线，让健康检查来验证
    return true;
  }

  /**
   * 启动定期健康检查
   */
  private startHealthCheck(): void {
    if (this.checkInterval) return;

    // 立即执行一次检查
    this.checkConnection();

    // 定期检查
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, this.healthCheckIntervalMs);

    console.log(`[NetworkService] Health check started (interval: ${this.healthCheckIntervalMs}ms)`);
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[NetworkService] Health check stopped');
    }
  }

  /**
   * 检查服务器连接
   */
  async checkConnection(): Promise<boolean> {
    if (!this.syncServerUrl) {
      // 没有配置服务器 URL，假设在线（用于本地开发）
      this.setOnline(true);
      return true;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeoutMs);

      const response = await fetch(`${this.syncServerUrl}/health`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.lastCheckAt = Date.now();

      const isOnline = response.ok;
      this.setOnline(isOnline);
      return isOnline;
    } catch (error) {
      this.lastCheckAt = Date.now();
      this.setOnline(false);
      return false;
    }
  }

  /**
   * 设置在线状态
   */
  private setOnline(online: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = online;

    if (wasOnline !== online) {
      console.log(`[NetworkService] Status changed: ${wasOnline} -> ${online}`);
      this.emit('status-change', online);
      
      if (online) {
        this.emit('online');
      } else {
        this.emit('offline');
      }
    }
  }

  /**
   * 获取当前在线状态
   */
  getStatus(): boolean {
    return this.isOnline;
  }

  /**
   * 获取上次检查时间
   */
  getLastCheckAt(): number | null {
    return this.lastCheckAt;
  }

  /**
   * 手动设置服务器 URL
   */
  setSyncServerUrl(url: string): void {
    this.syncServerUrl = url;
  }

  /**
   * 强制刷新状态
   */
  async refresh(): Promise<boolean> {
    return this.checkConnection();
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopHealthCheck();
    this.removeAllListeners();
  }
}
