/**
 * Sync Engine Service
 * 
 * EPIC-004: Offline Sync - 同步引擎
 * STORY-020: Network Sync Layer
 * 
 * 职责：
 * - 协调完整的同步流程
 * - Push 本地变更
 * - Pull 远程变更
 * - 应用远程变更到本地
 * - 处理冲突
 */

import { EventEmitter } from 'events';
import type { SyncLogService, SyncLogEntry } from './sync-log.service';
import type { SyncStateService } from './sync-state.service';
import type { DeviceService } from './device.service';
import { NetworkService } from './network.service';
import { SyncClientService, SyncApiError } from './sync-client.service';
import type { ConflictInfo, RemoteChange } from './sync-client.service';
import { RetryQueueService } from './retry-queue.service';

// ========== 类型定义 ==========

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncResult {
  status: SyncStatus;
  pushedCount?: number;
  pulledCount?: number;
  conflictCount?: number;
  error?: Error;
}

export interface SyncEngineConfig {
  /** 变更后防抖延迟（毫秒），默认 500ms */
  debounceMs?: number;
  /** 每次 Push 的最大变更数，默认 50 */
  pushBatchSize?: number;
  /** 每次 Pull 的最大变更数，默认 100 */
  pullBatchSize?: number;
  /** 是否自动同步，默认 true */
  autoSync?: boolean;
}

export interface SyncEngineEvents {
  'sync-start': () => void;
  'sync-complete': (result: SyncResult) => void;
  'sync-error': (error: Error) => void;
  'conflict-detected': (conflicts: ConflictInfo[]) => void;
  'changes-applied': (changes: RemoteChange[]) => void;
}

export class SyncEngine extends EventEmitter {
  private isSyncing = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceMs: number;
  private readonly pushBatchSize: number;
  private readonly pullBatchSize: number;
  private readonly autoSync: boolean;

  constructor(
    private readonly syncLogService: SyncLogService,
    private readonly syncStateService: SyncStateService,
    private readonly deviceService: DeviceService,
    private readonly networkService: NetworkService,
    private readonly syncClient: SyncClientService,
    private readonly retryQueue: RetryQueueService,
    config: SyncEngineConfig = {}
  ) {
    super();
    this.debounceMs = config.debounceMs || 500;
    this.pushBatchSize = config.pushBatchSize || 50;
    this.pullBatchSize = config.pullBatchSize || 100;
    this.autoSync = config.autoSync !== false;

    this.setupListeners();
  }

  /**
   * 设置事件监听
   */
  private setupListeners(): void {
    // 网络恢复时自动同步
    this.networkService.on('online', () => {
      console.log('[SyncEngine] Network online, triggering sync');
      if (this.autoSync) {
        this.sync();
      }
    });

    this.networkService.on('offline', () => {
      console.log('[SyncEngine] Network offline');
      this.syncStateService.setOffline();
    });
  }

  /**
   * 触发同步（带防抖）
   */
  triggerSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.sync();
    }, this.debounceMs);
  }

  /**
   * 执行完整同步
   */
  async sync(): Promise<SyncResult> {
    // 检查是否正在同步
    if (this.isSyncing) {
      console.log('[SyncEngine] Sync already in progress');
      return { status: 'syncing' };
    }

    // 检查网络状态
    if (!this.networkService.getStatus()) {
      console.log('[SyncEngine] Offline, skipping sync');
      return { status: 'offline' };
    }

    // 检查是否有待同步的变更
    const pendingCount = this.syncLogService.getPendingCount();
    if (pendingCount === 0) {
      console.log('[SyncEngine] No pending changes');
      // 仍然执行 pull 以获取远程变更
    }

    this.isSyncing = true;
    this.syncStateService.startSync();
    this.emit('sync-start');

    console.log('[SyncEngine] Starting sync...');

    try {
      // 1. Push 本地变更
      const pushResult = await this.pushLocalChanges();
      
      // 2. Pull 远程变更
      const pullResult = await this.pullRemoteChanges();

      // 3. 更新状态
      const state = this.syncStateService.getState();
      this.syncStateService.completeSync(state.lastSyncVersion + 1);

      const result: SyncResult = {
        status: 'success',
        pushedCount: pushResult.pushedCount,
        pulledCount: pullResult.pulledCount,
        conflictCount: pushResult.conflictCount,
      };

      console.log('[SyncEngine] Sync completed:', result);
      this.emit('sync-complete', result);
      
      return result;
    } catch (error) {
      console.error('[SyncEngine] Sync failed:', error);
      
      const err = error as Error;
      this.syncStateService.failSync(err.message);
      this.emit('sync-error', err);

      // 如果是可重试的错误，加入重试队列
      if (error instanceof SyncApiError && error.isRetryable()) {
        this.scheduleRetry();
      }

      return { status: 'error', error: err };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push 本地变更到服务器
   */
  private async pushLocalChanges(): Promise<{
    pushedCount: number;
    conflictCount: number;
  }> {
    let totalPushed = 0;
    let totalConflicts = 0;

    while (true) {
      // 获取待同步的变更
      const pendingChanges = this.syncLogService.getPendingChanges(this.pushBatchSize);
      
      if (pendingChanges.length === 0) {
        break;
      }

      console.log(`[SyncEngine] Pushing ${pendingChanges.length} changes`);

      const result = await this.syncClient.pushChanges({
        deviceId: this.deviceService.getDeviceId(),
        changes: pendingChanges,
        lastSyncVersion: this.syncStateService.getState().lastSyncVersion,
      });

      // 标记已接受的变更为已同步
      if (result.accepted.length > 0) {
        this.syncLogService.markAsSynced(result.accepted);
        totalPushed += result.accepted.length;
      }

      // 处理冲突
      if (result.conflicts.length > 0) {
        totalConflicts += result.conflicts.length;
        await this.handleConflicts(result.conflicts, pendingChanges);
      }

      // 如果没有更多变更，退出
      if (pendingChanges.length < this.pushBatchSize) {
        break;
      }
    }

    return { pushedCount: totalPushed, conflictCount: totalConflicts };
  }

  /**
   * Pull 远程变更
   */
  private async pullRemoteChanges(): Promise<{ pulledCount: number }> {
    let totalPulled = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await this.syncClient.pullChanges({
        deviceId: this.deviceService.getDeviceId(),
        lastSyncVersion: this.syncStateService.getState().lastSyncVersion,
        limit: this.pullBatchSize,
      });

      if (result.changes.length > 0) {
        await this.applyRemoteChanges(result.changes);
        totalPulled += result.changes.length;
      }

      hasMore = result.hasMore;

      // 更新版本号
      if (result.currentVersion > this.syncStateService.getState().lastSyncVersion) {
        this.syncStateService.completeSync(result.currentVersion);
      }
    }

    return { pulledCount: totalPulled };
  }

  /**
   * 应用远程变更到本地
   */
  private async applyRemoteChanges(changes: RemoteChange[]): Promise<void> {
    console.log(`[SyncEngine] Applying ${changes.length} remote changes`);

    // 过滤掉本设备的变更
    const deviceId = this.deviceService.getDeviceId();
    const remoteChanges = changes.filter(c => c.deviceId !== deviceId);

    if (remoteChanges.length === 0) {
      return;
    }

    // TODO: 实际应用变更到本地数据库
    // 这需要根据 entityType 调用相应的 Repository
    // 暂时只记录日志
    for (const change of remoteChanges) {
      console.log(`[SyncEngine] Would apply: ${change.operation} ${change.entityType}:${change.entityId}`);
    }

    this.emit('changes-applied', remoteChanges);
  }

  /**
   * 处理冲突
   */
  private async handleConflicts(
    conflicts: ConflictInfo[],
    localChanges: SyncLogEntry[]
  ): Promise<void> {
    console.log(`[SyncEngine] Handling ${conflicts.length} conflicts`);

    for (const conflict of conflicts) {
      // 找到对应的本地变更
      const localChange = localChanges.find(
        c => c.entityType === conflict.entityType && c.entityId === conflict.entityId
      );

      if (localChange) {
        // 记录冲突
        this.syncLogService.markAsConflict(
          localChange.id,
          conflict.serverData,
          localChange.data,
          conflict.conflictingFields
        );
      }
    }

    this.emit('conflict-detected', conflicts);
  }

  /**
   * 安排重试
   */
  private scheduleRetry(): void {
    const syncId = `sync-${Date.now()}`;
    
    this.retryQueue.enqueue(
      syncId,
      () => this.sync().then(r => {
        if (r.status === 'error') throw r.error;
        return r;
      }),
      (result) => {
        console.log('[SyncEngine] Retry succeeded:', result);
      },
      (error) => {
        console.error('[SyncEngine] Retry failed:', error);
      }
    );
  }

  /**
   * 获取同步状态
   */
  getStatus(): {
    isSyncing: boolean;
    isOnline: boolean;
    pendingCount: number;
    lastSyncAt: number | null;
  } {
    return {
      isSyncing: this.isSyncing,
      isOnline: this.networkService.getStatus(),
      pendingCount: this.syncLogService.getPendingCount(),
      lastSyncAt: this.syncStateService.getState().lastSyncAt,
    };
  }

  /**
   * 强制同步（跳过防抖）
   */
  forceSync(): Promise<SyncResult> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    return this.sync();
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.retryQueue.clear();
    this.removeAllListeners();
  }
}
