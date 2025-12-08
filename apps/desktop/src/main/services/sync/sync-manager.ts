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

/**
 * 同步管理器
 */
export class SyncManager {
  private deviceService: DeviceService;
  private syncLogService: SyncLogService;
  private syncStateService: SyncStateService;
  private initialized = false;

  constructor(private db: Database.Database) {
    this.deviceService = new DeviceService(db);
    this.syncLogService = new SyncLogService(db);
    this.syncStateService = new SyncStateService(db);
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
    
    // 初始化各服务
    this.deviceService.initialize();
    this.syncStateService.initialize();

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
export function initSyncManager(db: Database.Database): SyncManager {
  if (!syncManager) {
    syncManager = new SyncManager(db);
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
