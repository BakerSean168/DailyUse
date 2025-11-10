/**
 * SyncStatusClient 值对象
 * 同步状态 - 客户端值对象
 * 实现 ISyncStatusClient 接口
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ISyncStatusClient = RepositoryContracts.ISyncStatusClient;
type SyncStatusServerDTO = RepositoryContracts.SyncStatusServerDTO;
type SyncStatusClientDTO = RepositoryContracts.SyncStatusClientDTO;

/**
 * SyncStatusClient 值对象
 */
export class SyncStatus extends ValueObject implements ISyncStatusClient {
  public readonly isSyncing: boolean;
  public readonly syncError?: string | null;
  public readonly lastSyncAt?: number | null;

  // 从 Server DTO 传递的数据
  private _pendingSyncCount: number;
  private _conflictCount: number;

  constructor(params: {
    isSyncing: boolean;
    syncError?: string | null;
    lastSyncAt?: number | null;
    pendingSyncCount: number;
    conflictCount: number;
  }) {
    super();
    this.isSyncing = params.isSyncing;
    this.syncError = params.syncError ?? null;
    this.lastSyncAt = params.lastSyncAt ?? null;
    this._pendingSyncCount = params.pendingSyncCount;
    this._conflictCount = params.conflictCount;
    Object.freeze(this);
  }

  // UI 辅助属性
  public get syncStatusText(): string {
    if (this.syncError) return '同步失败';
    if (this.isSyncing) return '同步中';
    return '已同步';
  }

  public get syncStatusColor(): string {
    if (this.syncError) return 'red';
    if (this.isSyncing) return 'blue';
    return 'green';
  }

  public get lastSyncFormatted(): string | null {
    if (!this.lastSyncAt) return null;
    return this.formatRelativeTime(this.lastSyncAt);
  }

  public get hasPendingChanges(): boolean {
    return this._pendingSyncCount > 0;
  }

  public get hasConflicts(): boolean {
    return this._conflictCount > 0;
  }

  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
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
      this.syncError === other.syncError &&
      this.lastSyncAt === other.lastSyncAt &&
      this._pendingSyncCount === other._pendingSyncCount &&
      this._conflictCount === other._conflictCount
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): SyncStatusServerDTO {
    return {
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      syncError: this.syncError,
      pendingSyncCount: this._pendingSyncCount,
      conflictCount: this._conflictCount,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: SyncStatusServerDTO): SyncStatus {
    return new SyncStatus({
      isSyncing: dto.isSyncing,
      syncError: dto.syncError,
      lastSyncAt: dto.lastSyncAt,
      pendingSyncCount: dto.pendingSyncCount,
      conflictCount: dto.conflictCount,
    });
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: SyncStatusClientDTO): SyncStatus {
    return new SyncStatus({
      isSyncing: dto.isSyncing,
      syncError: dto.syncError,
      lastSyncAt: dto.lastSyncAt,
      pendingSyncCount: 0, // 无法从 Client DTO 反推
      conflictCount: 0, // 无法从 Client DTO 反推
    });
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): SyncStatusClientDTO {
    return {
      isSyncing: this.isSyncing,
      syncError: this.syncError,
      lastSyncAt: this.lastSyncAt,
      syncStatusText: this.syncStatusText,
      syncStatusColor: this.syncStatusColor,
      lastSyncFormatted: this.lastSyncFormatted,
      hasPendingChanges: this.hasPendingChanges,
      hasConflicts: this.hasConflicts,
    };
  }
}
