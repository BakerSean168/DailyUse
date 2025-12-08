/**
 * Sync State Service
 * 
 * EPIC-004: Offline Sync - 同步状态管理
 * 
 * 职责：
 * - 维护同步状态（连接状态、最后同步时间）
 * - 管理同步进度
 * - 提供同步状态查询
 * 
 * 数据库表结构 (sync_state):
 * - id: INTEGER PRIMARY KEY CHECK (id = 1) -- 单例
 * - current_state: TEXT DEFAULT 'idle'
 * - pending_count: INTEGER DEFAULT 0
 * - last_sync_version: INTEGER DEFAULT 0
 * - last_sync_at: INTEGER
 * - last_error: TEXT
 * - updated_at: INTEGER NOT NULL
 */

import Database from 'better-sqlite3';

// 同步状态枚举
export type SyncStateValue = 'idle' | 'syncing' | 'error' | 'offline';

// 数据库行类型
interface SyncStateRow {
  id: number;
  current_state: string;
  pending_count: number;
  last_sync_version: number;
  last_sync_at: number | null;
  last_error: string | null;
  updated_at: number;
}

// 业务层同步状态
export interface SyncState {
  currentState: SyncStateValue;
  pendingCount: number;
  lastSyncVersion: number;
  lastSyncAt: number | null;
  lastError: string | null;
  updatedAt: number;
  // 计算属性
  isOnline: boolean;
  isSyncing: boolean;
  hasError: boolean;
}

export class SyncStateService {
  private cachedState: SyncState | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();

  constructor(private db: Database.Database) {}

  /**
   * 初始化服务，从数据库加载状态
   */
  initialize(): void {
    this.cachedState = this.loadState();
    console.log('[SyncStateService] Initialized with state:', this.cachedState.currentState);
  }

  /**
   * 从数据库加载状态
   */
  private loadState(): SyncState {
    const row = this.db.prepare(
      'SELECT * FROM sync_state WHERE id = 1'
    ).get() as SyncStateRow | undefined;

    if (row) {
      return this.mapRowToState(row);
    }

    // 如果不存在则初始化（理论上不应该发生，因为 initializeSyncTables 已创建）
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO sync_state (id, current_state, pending_count, updated_at)
      VALUES (1, 'idle', 0, ?)
    `).run(now);

    return {
      currentState: 'idle',
      pendingCount: 0,
      lastSyncVersion: 0,
      lastSyncAt: null,
      lastError: null,
      updatedAt: now,
      isOnline: false,
      isSyncing: false,
      hasError: false,
    };
  }

  /**
   * 获取当前同步状态
   */
  getState(): SyncState {
    if (!this.cachedState) {
      this.cachedState = this.loadState();
    }
    return { ...this.cachedState };
  }

  /**
   * 设置状态为空闲（在线）
   */
  setIdle(): void {
    this.updateState({ currentState: 'idle', lastError: null });
  }

  /**
   * 设置状态为离线
   */
  setOffline(): void {
    this.updateState({ currentState: 'offline' });
  }

  /**
   * 开始同步
   */
  startSync(): void {
    this.updateState({ 
      currentState: 'syncing',
      lastError: null,
    });
  }

  /**
   * 同步成功完成
   */
  completeSync(version: number): void {
    const now = Date.now();
    this.updateState({
      currentState: 'idle',
      lastSyncVersion: version,
      lastSyncAt: now,
      lastError: null,
      pendingCount: 0,
    });
  }

  /**
   * 同步失败
   */
  failSync(error: string): void {
    this.updateState({
      currentState: 'error',
      lastError: error,
    });
  }

  /**
   * 更新待同步数量
   */
  updatePendingCount(count: number): void {
    this.updateState({ pendingCount: count });
  }

  /**
   * 增加待同步数量
   */
  incrementPendingCount(): void {
    const currentCount = this.cachedState?.pendingCount ?? 0;
    this.updateState({ pendingCount: currentCount + 1 });
  }

  /**
   * 减少待同步数量
   */
  decrementPendingCount(amount: number = 1): void {
    const currentCount = this.cachedState?.pendingCount ?? 0;
    this.updateState({ pendingCount: Math.max(0, currentCount - amount) });
  }

  /**
   * 添加状态变化监听器
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    // 立即发送当前状态
    if (this.cachedState) {
      listener({ ...this.cachedState });
    }
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 检查是否可以开始同步
   */
  canStartSync(): boolean {
    return this.cachedState?.currentState !== 'syncing';
  }

  /**
   * 获取距离上次成功同步的时间（毫秒）
   */
  getTimeSinceLastSync(): number | null {
    if (!this.cachedState?.lastSyncAt) return null;
    return Date.now() - this.cachedState.lastSyncAt;
  }

  /**
   * 更新状态
   */
  private updateState(updates: Partial<{
    currentState: SyncStateValue;
    pendingCount: number;
    lastSyncVersion: number;
    lastSyncAt: number | null;
    lastError: string | null;
  }>): void {
    const now = Date.now();

    // 构建 UPDATE 语句
    const setClauses: string[] = ['updated_at = ?'];
    const values: (string | number | null)[] = [now];

    if (updates.currentState !== undefined) {
      setClauses.push('current_state = ?');
      values.push(updates.currentState);
    }
    if (updates.pendingCount !== undefined) {
      setClauses.push('pending_count = ?');
      values.push(updates.pendingCount);
    }
    if (updates.lastSyncVersion !== undefined) {
      setClauses.push('last_sync_version = ?');
      values.push(updates.lastSyncVersion);
    }
    if (updates.lastSyncAt !== undefined) {
      setClauses.push('last_sync_at = ?');
      values.push(updates.lastSyncAt);
    }
    if (updates.lastError !== undefined) {
      setClauses.push('last_error = ?');
      values.push(updates.lastError);
    }

    this.db.prepare(`
      UPDATE sync_state SET ${setClauses.join(', ')} WHERE id = 1
    `).run(...values);

    // 更新缓存
    if (this.cachedState) {
      this.cachedState = {
        ...this.cachedState,
        ...updates,
        updatedAt: now,
        isOnline: (updates.currentState ?? this.cachedState.currentState) !== 'offline',
        isSyncing: (updates.currentState ?? this.cachedState.currentState) === 'syncing',
        hasError: (updates.currentState ?? this.cachedState.currentState) === 'error',
      };
    } else {
      this.cachedState = this.loadState();
    }

    this.notifyListeners();
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    if (!this.cachedState) return;
    
    const stateCopy = { ...this.cachedState };
    for (const listener of this.listeners) {
      try {
        listener(stateCopy);
      } catch (error) {
        console.error('[SyncStateService] Listener error:', error);
      }
    }
  }

  /**
   * 映射数据库行到业务状态
   */
  private mapRowToState(row: SyncStateRow): SyncState {
    const currentState = row.current_state as SyncStateValue;
    return {
      currentState,
      pendingCount: row.pending_count,
      lastSyncVersion: row.last_sync_version,
      lastSyncAt: row.last_sync_at,
      lastError: row.last_error,
      updatedAt: row.updated_at,
      isOnline: currentState !== 'offline',
      isSyncing: currentState === 'syncing',
      hasError: currentState === 'error',
    };
  }
}
