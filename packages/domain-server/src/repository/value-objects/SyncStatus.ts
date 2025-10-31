/**
 * SyncStatus 值对象
 * 同步状态 - 不可变值对象
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ISyncStatus = RepositoryContracts.SyncStatusServerDTO;
type SyncStatusClientDTO = RepositoryContracts.SyncStatusClientDTO;
type SyncStatusPersistenceDTO = RepositoryContracts.SyncStatusPersistenceDTO;

/**
 * SyncStatus 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class SyncStatus extends ValueObject implements ISyncStatus {
  public readonly isSyncing: boolean;
  public readonly lastSyncAt: number | null;
  public readonly syncError: string | null;
  public readonly pendingSyncCount: number;
  public readonly conflictCount: number;

  constructor(params: {
    isSyncing: boolean;
    lastSyncAt?: number | null;
    syncError?: string | null;
    pendingSyncCount: number;
    conflictCount: number;
  }) {
    super(); // 调用基类构造函数

    this.isSyncing = params.isSyncing;
    this.lastSyncAt = params.lastSyncAt ?? null;
    this.syncError = params.syncError ?? null;
    this.pendingSyncCount = params.pendingSyncCount;
    this.conflictCount = params.conflictCount;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof SyncStatus)) {
      return false;
    }

    return (
      this.isSyncing === other.isSyncing &&
      this.lastSyncAt === other.lastSyncAt &&
      this.syncError === other.syncError &&
      this.pendingSyncCount === other.pendingSyncCount &&
      this.conflictCount === other.conflictCount
    );
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      isSyncing: boolean;
      lastSyncAt: number | null;
      syncError: string | null;
      pendingSyncCount: number;
      conflictCount: number;
    }>,
  ): SyncStatus {
    return new SyncStatus({
      isSyncing: changes.isSyncing ?? this.isSyncing,
      lastSyncAt: changes.lastSyncAt ?? this.lastSyncAt,
      syncError: changes.syncError ?? this.syncError,
      pendingSyncCount: changes.pendingSyncCount ?? this.pendingSyncCount,
      conflictCount: changes.conflictCount ?? this.conflictCount,
    });
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ISyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      syncError: this.syncError,
      pendingSyncCount: this.pendingSyncCount,
      conflictCount: this.conflictCount,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): SyncStatusClientDTO {
    let syncStatusText = '未同步';
    let syncStatusColor = 'gray';

    if (this.isSyncing) {
      syncStatusText = '同步中...';
      syncStatusColor = 'blue';
    } else if (this.syncError) {
      syncStatusText = `同步失败: ${this.syncError}`;
      syncStatusColor = 'red';
    } else if (this.lastSyncAt) {
      syncStatusText = '同步成功';
      syncStatusColor = 'green';
    }

    const lastSyncFormatted = this.lastSyncAt
      ? new Date(this.lastSyncAt).toLocaleString('zh-CN')
      : null;

    return {
      isSyncing: this.isSyncing,
      syncError: this.syncError,
      lastSyncAt: this.lastSyncAt,
      syncStatusText,
      syncStatusColor,
      lastSyncFormatted,
      hasPendingChanges: this.pendingSyncCount > 0,
      hasConflicts: this.conflictCount > 0,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): SyncStatusPersistenceDTO {
    return {
      is_syncing: this.isSyncing,
      last_sync_at: this.lastSyncAt,
      sync_error: this.syncError,
      pending_sync_count: this.pendingSyncCount,
      conflict_count: this.conflictCount,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(data: ISyncStatus): SyncStatus {
    return new SyncStatus(data);
  }

  /**
   * 转换为 Contract 接口 (兼容旧代码)
   */
  public toContract(): ISyncStatus {
    return this.toServerDTO();
  }

  /**
   * 从 Contract 接口创建值对象 (兼容旧代码)
   */
  public static fromContract(data: ISyncStatus): SyncStatus {
    return SyncStatus.fromServerDTO(data);
  }

  /**
   * 创建初始同步状态（未同步）
   */
  public static createInitial(): SyncStatus {
    return new SyncStatus({
      isSyncing: false,
      lastSyncAt: null,
      syncError: null,
      pendingSyncCount: 0,
      conflictCount: 0,
    });
  }

  /**
   * 创建同步中状态
   */
  public static createSyncing(): SyncStatus {
    return new SyncStatus({
      isSyncing: true,
      lastSyncAt: null,
      syncError: null,
      pendingSyncCount: 0,
      conflictCount: 0,
    });
  }

  /**
   * 创建同步成功状态
   */
  public static createSynced(): SyncStatus {
    return new SyncStatus({
      isSyncing: false,
      lastSyncAt: Date.now(),
      syncError: null,
      pendingSyncCount: 0,
      conflictCount: 0,
    });
  }

  /**
   * 创建同步失败状态
   */
  public static createSyncFailed(error: string): SyncStatus {
    return new SyncStatus({
      isSyncing: false,
      lastSyncAt: Date.now(),
      syncError: error,
      pendingSyncCount: 0,
      conflictCount: 0,
    });
  }

  /**
   * 业务查询方法：是否有待处理项
   */
  public hasPendingItems(): boolean {
    return this.pendingSyncCount > 0 || this.conflictCount > 0;
  }

  /**
   * 业务查询方法：是否同步失败
   */
  public hasSyncError(): boolean {
    return this.syncError !== null;
  }

  /**
   * 业务查询方法：是否需要同步
   */
  public needsSync(): boolean {
    return this.pendingSyncCount > 0 && !this.isSyncing;
  }

  /**
   * 业务查询方法：是否有冲突
   */
  public hasConflicts(): boolean {
    return this.conflictCount > 0;
  }
}
