/**
 * Sync Manager
 * 
 * EPIC-004: Offline Sync
 * 
 * 同步服务的统一管理入口
 * - 初始化所有同步相关服务
 * - 提供服务访问接口
 * - 管理同步生命周期
 */

import Database from 'better-sqlite3';
import { DeviceService } from './device.service';
import { SyncLogService } from './sync-log.service';
import { SyncStateService } from './sync-state.service';
import { NetworkService } from './network.service';
import { SyncClientService } from './sync-client.service';
import { RetryQueueService } from './retry-queue.service';
import { SyncEngine } from './sync-engine.service';

export interface SyncManagerConfig {
  /** 同步服务器 URL */
  syncServerUrl?: string;
  /** 是否自动同步 */
  autoSync?: boolean;
}

/**
 * 同步管理器
 */
export class SyncManager {
  private deviceService: DeviceService;
  private syncLogService: SyncLogService;
  private syncStateService: SyncStateService;
  private networkService: NetworkService;
  private syncClient: SyncClientService | null = null;
  private retryQueue: RetryQueueService;
  private syncEngine: SyncEngine | null = null;
  private initialized = false;
  private config: SyncManagerConfig;

  constructor(private db: Database.Database, config: SyncManagerConfig = {}) {
    this.config = config;
    this.deviceService = new DeviceService(db);
    this.syncLogService = new SyncLogService(db);
    this.syncStateService = new SyncStateService(db);
    this.networkService = new NetworkService({
      syncServerUrl: config.syncServerUrl,
    });
    this.retryQueue = new RetryQueueService();
  }

  /**
   * 初始化同步管理器
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('[SyncManager] Already initialized');
      return;
    }

    console.log('[SyncManager] Initializing...');
    
    // 初始化基础服务
    this.deviceService.initialize();
    this.syncStateService.initialize();
    this.networkService.initialize();

    // 如果配置了服务器 URL，初始化同步客户端和引擎
    if (this.config.syncServerUrl) {
      this.syncClient = new SyncClientService({
        baseUrl: this.config.syncServerUrl,
      });

      this.syncEngine = new SyncEngine(
        this.syncLogService,
        this.syncStateService,
        this.deviceService,
        this.networkService,
        this.syncClient,
        this.retryQueue,
        { autoSync: this.config.autoSync }
      );

      console.log(`[SyncManager] Sync engine initialized with server: ${this.config.syncServerUrl}`);
    } else {
      console.log('[SyncManager] No sync server configured, running in offline mode');
    }

    this.initialized = true;
    console.log('[SyncManager] Initialized successfully');
    console.log(`[SyncManager] Device ID: ${this.deviceService.getDeviceId()}`);
    console.log(`[SyncManager] Pending changes: ${this.syncLogService.getPendingCount()}`);
  }

  /**
   * 获取设备服务
   */
  getDeviceService(): DeviceService {
    this.ensureInitialized();
    return this.deviceService;
  }

  /**
   * 获取同步日志服务
   */
  getSyncLogService(): SyncLogService {
    this.ensureInitialized();
    return this.syncLogService;
  }

  /**
   * 获取同步状态服务
   */
  getSyncStateService(): SyncStateService {
    this.ensureInitialized();
    return this.syncStateService;
  }

  /**
   * 获取同步摘要信息
   */
  getSyncSummary(): {
    deviceId: string;
    deviceName: string;
    platform: string;
    pendingCount: number;
    syncState: string;
    lastSyncAt: number | null;
    lastError: string | null;
  } {
    this.ensureInitialized();
    
    const deviceInfo = this.deviceService.getDeviceInfo();
    const syncState = this.syncStateService.getState();
    const pendingCount = this.syncLogService.getPendingCount();

    return {
      deviceId: deviceInfo.id,
      deviceName: deviceInfo.name,
      platform: deviceInfo.platform,
      pendingCount,
      syncState: syncState.currentState,
      lastSyncAt: syncState.lastSyncAt,
      lastError: syncState.lastError,
    };
  }

  /**
   * 获取同步统计
   */
  getStats() {
    this.ensureInitialized();
    return this.syncLogService.getStats();
  }

  /**
   * 获取网络服务
   */
  getNetworkService(): NetworkService {
    this.ensureInitialized();
    return this.networkService;
  }

  /**
   * 获取同步引擎
   */
  getSyncEngine(): SyncEngine | null {
    this.ensureInitialized();
    return this.syncEngine;
  }

  /**
   * 触发同步
   */
  triggerSync(): void {
    if (this.syncEngine) {
      this.syncEngine.triggerSync();
    }
  }

  /**
   * 强制同步
   */
  async forceSync() {
    if (this.syncEngine) {
      return this.syncEngine.forceSync();
    }
    return { status: 'offline' as const };
  }

  /**
   * 检查是否在线
   */
  isOnline(): boolean {
    return this.networkService.getStatus();
  }

  /**
   * 销毁同步管理器
   */
  destroy(): void {
    this.syncEngine?.destroy();
    this.networkService.destroy();
    this.retryQueue.clear();
    this.initialized = false;
    console.log('[SyncManager] Destroyed');
  }

  /**
   * 检查是否已初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('[SyncManager] Not initialized. Call initialize() first.');
    }
  }
}

// 单例实例
let syncManager: SyncManager | null = null;

/**
 * 初始化同步管理器（单例）
 */
export function initSyncManager(db: Database.Database, config?: SyncManagerConfig): SyncManager {
  if (!syncManager) {
    syncManager = new SyncManager(db, config);
    syncManager.initialize();
  }
  return syncManager;
}

/**
 * 获取同步管理器实例
 */
export function getSyncManager(): SyncManager {
  if (!syncManager) {
    throw new Error('[SyncManager] Not initialized. Call initSyncManager() first.');
  }
  return syncManager;
}
