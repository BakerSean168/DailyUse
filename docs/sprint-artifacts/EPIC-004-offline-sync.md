# EPIC-004: Offline Sync (多设备数据同步)

## 📋 Epic 概述

**Epic ID**: EPIC-004  
**Epic Name**: Multi-Device Offline Sync  
**Epic Owner**: Development Team  
**Created**: 2025-12-07  
**Priority**: P3 (未来演进)  
**Status**: 🟡 Planning  
**前置依赖**: 
- EPIC-002 (Desktop Application Development) ✅ Completed
- EPIC-005 (Backend Sync Service) 🟡 Planning

---

## 🎯 产品愿景

> **在任何地方、任何设备上，数据始终可用、始终同步，冲突可追溯、可解决。**

### 用户场景

**场景 1：离线工作**
```
1. 在飞机上（无网络）打开 DailyUse
2. 创建 3 个任务，完成 2 个目标
3. 所有操作实时保存到本地 SQLite
4. 状态栏显示「离线模式 - 5 个变更待同步」
```

**场景 2：恢复在线**
```
1. 飞机落地，连接 WiFi
2. 应用自动检测到网络恢复
3. 后台静默同步 5 个变更
4. 状态栏显示「已同步 ✓」
5. 通知：「5 个变更已同步到云端」
```

**场景 3：多设备编辑**
```
1. 早上在家用 Mac 创建任务「完成产品文档」
2. 路上用手机（Web）将状态改为「进行中」
3. 到公司打开 Windows 桌面版
4. 自动拉取最新状态，显示任务「进行中」
```

**场景 4：冲突解决**
```
1. 设备 A (离线) 将任务标题改为「完成产品文档 v1」
2. 设备 B (在线) 将任务标题改为「完成产品文档 - 最终版」
3. 设备 A 恢复网络，同步时检测到冲突
4. 弹出冲突解决对话框：
   ├── 本地版本：「完成产品文档 v1」
   ├── 云端版本：「完成产品文档 - 最终版」
   └── 选项：使用本地 | 使用云端 | 手动合并
5. 用户选择后，冲突记录保存到历史
```

---

## 🔄 同步状态机

### 状态定义

```typescript
enum SyncState {
  IDLE = 'idle',               // 空闲，无待同步变更
  PENDING = 'pending',         // 有待同步变更，等待同步
  SYNCING = 'syncing',         // 正在同步中
  CONFLICT = 'conflict',       // 检测到冲突，等待解决
  ERROR = 'error',             // 同步失败
  OFFLINE = 'offline',         // 离线模式
}

enum SyncEvent {
  CHANGE_DETECTED = 'change_detected',      // 检测到本地变更
  NETWORK_ONLINE = 'network_online',        // 网络恢复
  NETWORK_OFFLINE = 'network_offline',      // 网络断开
  SYNC_START = 'sync_start',                // 开始同步
  SYNC_SUCCESS = 'sync_success',            // 同步成功
  SYNC_FAILED = 'sync_failed',              // 同步失败
  CONFLICT_DETECTED = 'conflict_detected',  // 检测到冲突
  CONFLICT_RESOLVED = 'conflict_resolved',  // 冲突已解决
  RETRY_REQUESTED = 'retry_requested',      // 请求重试
}
```

### 状态转换图

```
                                    ┌────────────────────────────────────────┐
                                    │                                        │
                                    ▼                                        │
┌─────────┐  change_detected   ┌─────────┐  sync_start   ┌─────────┐        │
│  IDLE   │───────────────────►│ PENDING │──────────────►│ SYNCING │        │
└─────────┘                    └─────────┘               └────┬────┘        │
     ▲                              │                         │             │
     │                              │                    ┌────┴────┐        │
     │                              │ network_offline    │         │        │
     │                              ▼                    ▼         ▼        │
     │                         ┌─────────┐         ┌─────────┐ ┌────────┐   │
     │                         │ OFFLINE │         │ SUCCESS │ │ FAILED │   │
     │                         └────┬────┘         └────┬────┘ └───┬────┘   │
     │                              │                   │          │        │
     │                              │ network_online    │          │ retry  │
     │                              │                   │          │        │
     │                              ▼                   ▼          ▼        │
     │                         ┌─────────┐         ┌─────────┐              │
     │◄────────────────────────│ PENDING │◄────────│  IDLE   │              │
     │                         └─────────┘         └─────────┘              │
     │                                                                      │
     │                              ┌─────────────┐                         │
     │  conflict_resolved           │  CONFLICT   │◄────────────────────────┘
     └──────────────────────────────┴─────────────┘  conflict_detected
```

### 状态机实现

```typescript
// services/sync-state-machine.ts
import { createMachine, interpret } from 'xstate';

export const syncMachine = createMachine({
  id: 'sync',
  initial: 'idle',
  context: {
    pendingCount: 0,
    retryCount: 0,
    lastError: null as Error | null,
    conflicts: [] as ConflictInfo[],
  },
  states: {
    idle: {
      on: {
        CHANGE_DETECTED: {
          target: 'pending',
          actions: 'incrementPendingCount',
        },
        NETWORK_OFFLINE: 'offline',
      },
    },
    pending: {
      on: {
        SYNC_START: 'syncing',
        NETWORK_OFFLINE: 'offline',
        CHANGE_DETECTED: {
          actions: 'incrementPendingCount',
        },
      },
      after: {
        // 防抖：500ms 后自动开始同步
        500: {
          target: 'syncing',
          cond: 'isNetworkOnline',
        },
      },
    },
    syncing: {
      invoke: {
        src: 'performSync',
        onDone: {
          target: 'idle',
          actions: 'resetPendingCount',
        },
        onError: [
          {
            target: 'conflict',
            cond: 'isConflictError',
            actions: 'storeConflicts',
          },
          {
            target: 'error',
            actions: 'storeError',
          },
        ],
      },
      on: {
        NETWORK_OFFLINE: 'offline',
      },
    },
    conflict: {
      on: {
        CONFLICT_RESOLVED: [
          {
            target: 'pending',
            cond: 'hasMoreConflicts',
          },
          {
            target: 'idle',
          },
        ],
      },
    },
    error: {
      on: {
        RETRY_REQUESTED: {
          target: 'pending',
          actions: 'incrementRetryCount',
        },
      },
      after: {
        // 指数退避自动重试
        RETRY_DELAY: {
          target: 'pending',
          cond: 'canRetry',
          actions: 'incrementRetryCount',
        },
      },
    },
    offline: {
      on: {
        NETWORK_ONLINE: [
          {
            target: 'pending',
            cond: 'hasPendingChanges',
          },
          {
            target: 'idle',
          },
        ],
        CHANGE_DETECTED: {
          actions: 'incrementPendingCount',
        },
      },
    },
  },
}, {
  guards: {
    isNetworkOnline: () => navigator.onLine,
    isConflictError: (_, event) => event.data?.type === 'conflict',
    hasMoreConflicts: (ctx) => ctx.conflicts.length > 0,
    hasPendingChanges: (ctx) => ctx.pendingCount > 0,
    canRetry: (ctx) => ctx.retryCount < 5,
  },
  delays: {
    RETRY_DELAY: (ctx) => Math.min(1000 * Math.pow(2, ctx.retryCount), 60000),
  },
});
```

---

## ⚙️ 同步配置与用户设置

> **[2025-12-07 技术评审决策]** 以下配置根据评审会议决策确定

### 同步策略常量

```typescript
// config/sync-constants.ts

/**
 * 同步行为配置
 * 根据 2025-12-07 技术评审决策确定
 */
export const SYNC_CONFIG = {
  // D4 决策: 防抖时间 500ms
  DEBOUNCE_MS: 500,
  
  // D3 决策: 离线变更上限 1000 条
  MAX_PENDING_CHANGES: 1000,
  WARNING_THRESHOLD: 800,
  
  // 重试策略
  MAX_RETRY_COUNT: 5,
  RETRY_BASE_DELAY_MS: 1000,
  RETRY_MAX_DELAY_MS: 60000,
  
  // 批量同步
  BATCH_SIZE: 50,
  PULL_LIMIT: 100,
  
  // 心跳间隔
  HEARTBEAT_INTERVAL_MS: 30000,
  
  // 冲突通知方式 (D2 决策)
  CONFLICT_NOTIFICATION: 'taskbar' as const,  // 'immediate' | 'taskbar' | 'on-open'
} as const;
```

### 用户同步设置

```typescript
// types/sync-settings.ts

/**
 * 用户可配置的同步设置
 * [评审新增] 支持禁用同步功能
 */
export interface SyncSettings {
  /** 是否启用云同步 - [评审新增] */
  enabled: boolean;
  
  /** 自动同步 (启用时变更自动推送) */
  autoSync: boolean;
  
  /** 仅 WiFi 同步 (移动端考虑) */
  wifiOnly: boolean;
  
  /** 冲突通知方式 */
  conflictNotification: 'immediate' | 'taskbar' | 'on-open';
  
  /** 同步频率 (手动模式时) */
  manualSyncInterval: number;  // 分钟, 0 = 仅手动触发
}

/** 默认设置 */
export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  enabled: true,
  autoSync: true,
  wifiOnly: false,
  conflictNotification: 'taskbar',
  manualSyncInterval: 0,
};
```

### 同步设置 UI

```vue
<!-- components/settings/SyncSettings.vue -->
<template>
  <div class="sync-settings">
    <SettingGroup title="云同步">
      <!-- 主开关 [评审新增] -->
      <SettingItem 
        title="启用云同步"
        description="关闭后数据仅保存在本地"
      >
        <Switch v-model="settings.enabled" />
      </SettingItem>
      
      <template v-if="settings.enabled">
        <!-- 自动同步 -->
        <SettingItem 
          title="自动同步"
          description="变更时自动同步到云端"
        >
          <Switch v-model="settings.autoSync" />
        </SettingItem>
        
        <!-- 冲突通知 -->
        <SettingItem 
          title="冲突通知方式"
          description="检测到数据冲突时如何提醒"
        >
          <Select v-model="settings.conflictNotification">
            <Option value="immediate">立即弹窗</Option>
            <Option value="taskbar">任务栏通知</Option>
            <Option value="on-open">下次打开时</Option>
          </Select>
        </SettingItem>
      </template>
    </SettingGroup>
    
    <!-- 同步状态 -->
    <SettingGroup title="同步状态">
      <SyncStatusDisplay />
    </SettingGroup>
  </div>
</template>
```

### SQLite 设置表

```sql
-- 同步设置存储
CREATE TABLE sync_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- 单例
    enabled INTEGER DEFAULT 1,
    auto_sync INTEGER DEFAULT 1,
    wifi_only INTEGER DEFAULT 0,
    conflict_notification TEXT DEFAULT 'taskbar',
    manual_sync_interval INTEGER DEFAULT 0,
    updated_at INTEGER NOT NULL
);

-- 初始化默认设置
INSERT INTO sync_settings (id, updated_at) VALUES (1, strftime('%s', 'now') * 1000);
```

---

## 🚨 边界情况处理

### 1. 离线队列溢出

```typescript
// 问题：长时间离线，变更累积过多
// 解决：限制队列大小，提供用户通知

const MAX_PENDING_CHANGES = 1000;
const WARNING_THRESHOLD = 800;

export class SyncQueueManager {
  private queue: SyncLogEntry[] = [];
  
  addChange(entry: SyncLogEntry): AddResult {
    if (this.queue.length >= MAX_PENDING_CHANGES) {
      // 队列已满，拒绝新变更
      return {
        success: false,
        reason: 'queue_full',
        action: 'show_warning_dialog',
      };
    }
    
    if (this.queue.length >= WARNING_THRESHOLD) {
      // 接近上限，显示警告
      this.notifyQueueWarning(this.queue.length);
    }
    
    this.queue.push(entry);
    return { success: true };
  }
  
  private notifyQueueWarning(count: number): void {
    NotificationService.show({
      title: '同步队列接近上限',
      body: `已有 ${count} 个变更等待同步，请尽快连接网络`,
      type: 'warning',
    });
  }
}
```

### 2. 同步过程中断

```typescript
// 问题：同步过程中网络断开或应用关闭
// 解决：事务性同步，断点续传

export class TransactionalSyncEngine {
  private currentBatch: SyncBatch | null = null;
  
  async sync(): Promise<void> {
    // 恢复上次未完成的批次
    this.currentBatch = await this.loadIncompleteBatch();
    
    if (!this.currentBatch) {
      this.currentBatch = await this.createNewBatch();
    }
    
    try {
      // 推送变更
      const result = await this.pushBatch(this.currentBatch);
      
      // 标记已完成的变更
      for (const entryId of result.accepted) {
        await this.markEntryComplete(entryId);
      }
      
      // 完成批次
      await this.completeBatch(this.currentBatch.id);
      
    } catch (error) {
      // 保存进度，下次恢复
      await this.saveBatchProgress(this.currentBatch);
      throw error;
    }
  }
  
  private async loadIncompleteBatch(): Promise<SyncBatch | null> {
    return this.db.prepare(`
      SELECT * FROM sync_batches 
      WHERE status = 'in_progress' 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get();
  }
}
```

### 3. 时钟偏差

```typescript
// 问题：设备时钟不同步导致顺序错误
// 解决：使用逻辑时钟 (Lamport timestamp) + 服务器时间

export interface SyncLogEntry {
  // ... 其他字段
  clientTimestamp: number;       // 本地时钟
  logicalClock: number;          // 逻辑时钟
  serverTimestamp?: number;      // 服务器返回的时间 (同步后填充)
}

export class LogicalClockService {
  private counter = 0;
  
  /**
   * 生成下一个逻辑时钟值
   */
  tick(): number {
    return ++this.counter;
  }
  
  /**
   * 同步时更新逻辑时钟
   * 确保本地时钟 >= 远程时钟
   */
  sync(remoteValue: number): void {
    this.counter = Math.max(this.counter, remoteValue) + 1;
  }
}
```

### 4. 大文件同步

```typescript
// 问题：大型附件同步超时或内存溢出
// 解决：分块上传，后台同步

export class LargeFileSyncService {
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB
  
  async syncLargeFile(
    fileId: string,
    filePath: string
  ): Promise<void> {
    const stat = await fs.stat(filePath);
    const totalChunks = Math.ceil(stat.size / this.CHUNK_SIZE);
    
    // 获取已上传的分块
    const uploadedChunks = await this.getUploadedChunks(fileId);
    
    for (let i = 0; i < totalChunks; i++) {
      if (uploadedChunks.includes(i)) continue;
      
      const chunk = await this.readChunk(filePath, i);
      await this.uploadChunk(fileId, i, chunk);
      
      // 更新进度
      await this.updateProgress(fileId, i + 1, totalChunks);
    }
    
    // 完成上传
    await this.finalizeUpload(fileId);
  }
}
```

### 5. 实体删除同步

```typescript
// 问题：删除的实体在其他设备上仍然存在
// 解决：软删除 + 墓碑记录

export interface TombstoneRecord {
  entityType: EntityType;
  entityId: string;
  deletedAt: number;
  deletedBy: string;  // deviceId
  expiresAt: number;  // 墓碑过期时间 (30天后)
}

export class TombstoneService {
  private readonly RETENTION_DAYS = 30;
  
  /**
   * 创建墓碑记录
   */
  async createTombstone(entityType: EntityType, entityId: string): Promise<void> {
    const tombstone: TombstoneRecord = {
      entityType,
      entityId,
      deletedAt: Date.now(),
      deletedBy: this.deviceService.getDeviceId(),
      expiresAt: Date.now() + this.RETENTION_DAYS * 24 * 60 * 60 * 1000,
    };
    
    await this.db.prepare(`
      INSERT INTO tombstones (entity_type, entity_id, deleted_at, deleted_by, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      tombstone.entityType,
      tombstone.entityId,
      tombstone.deletedAt,
      tombstone.deletedBy,
      tombstone.expiresAt
    );
  }
  
  /**
   * 检查实体是否已被删除
   */
  async isDeleted(entityType: EntityType, entityId: string): Promise<boolean> {
    const tombstone = await this.db.prepare(`
      SELECT 1 FROM tombstones 
      WHERE entity_type = ? AND entity_id = ? AND expires_at > ?
    `).get(entityType, entityId, Date.now());
    
    return !!tombstone;
  }
  
  /**
   * 清理过期墓碑
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.db.prepare(`
      DELETE FROM tombstones WHERE expires_at < ?
    `).run(Date.now());
    
    return result.changes;
  }
}
```

### 6. 并发修改同一实体

```typescript
// 问题：本地快速连续修改同一实体
// 解决：合并操作，防抖提交

export class OperationCoalescer {
  private pendingOperations = new Map<string, CoalescedOperation>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_MS = 500;
  
  /**
   * 添加操作，自动合并相同实体的变更
   */
  addOperation(op: SyncOperation): void {
    const key = `${op.entityType}:${op.entityId}`;
    
    // 取消之前的防抖定时器
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) clearTimeout(existingTimer);
    
    // 合并操作
    const existing = this.pendingOperations.get(key);
    if (existing) {
      this.mergeOperations(existing, op);
    } else {
      this.pendingOperations.set(key, { ...op, changes: [op.payload] });
    }
    
    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      this.flushOperation(key);
    }, this.DEBOUNCE_MS);
    
    this.debounceTimers.set(key, timer);
  }
  
  private mergeOperations(existing: CoalescedOperation, newOp: SyncOperation): void {
    // 合并策略
    if (newOp.operation === 'delete') {
      existing.operation = 'delete';
    } else if (existing.operation === 'create' && newOp.operation === 'update') {
      // create + update = create (with updated payload)
      existing.payload = { ...existing.payload, ...newOp.payload };
    } else {
      existing.payload = { ...existing.payload, ...newOp.payload };
    }
    
    existing.changes.push(newOp.payload);
  }
}
```

---

## 🔗 EPIC-005 接口契约

### 客户端需要实现的接口

```typescript
// 客户端同步客户端需要调用的后端 API

interface SyncApiClient {
  /**
   * 推送本地变更到服务端
   * @endpoint POST /api/v1/sync/push
   */
  push(request: SyncPushRequest): Promise<SyncPushResponse>;
  
  /**
   * 从服务端拉取远程变更
   * @endpoint POST /api/v1/sync/pull
   */
  pull(request: SyncPullRequest): Promise<SyncPullResponse>;
  
  /**
   * 注册设备
   * @endpoint POST /api/v1/sync/devices
   */
  registerDevice(request: RegisterDeviceRequest): Promise<DeviceResponse>;
  
  /**
   * 获取设备列表
   * @endpoint GET /api/v1/sync/devices
   */
  listDevices(): Promise<DeviceListResponse>;
  
  /**
   * 获取未解决的冲突
   * @endpoint GET /api/v1/sync/conflicts
   */
  listConflicts(): Promise<ConflictListResponse>;
  
  /**
   * 解决冲突
   * @endpoint POST /api/v1/sync/conflicts/:id/resolve
   */
  resolveConflict(
    conflictId: string,
    resolution: ResolveConflictRequest
  ): Promise<ResolveConflictResponse>;
}
```

### 请求/响应数据结构

```typescript
// === Push API ===

interface SyncPushRequest {
  deviceId: string;
  changes: SyncChange[];
}

interface SyncChange {
  eventId: string;              // UUID, 客户端生成
  entityType: EntityType;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  baseVersion: number;          // 基于的版本号
  clientTimestamp: number;      // 客户端时间戳
}

interface SyncPushResponse {
  success: boolean;
  accepted: string[];           // 接受的 eventId 列表
  conflicts: ServerConflict[];  // 冲突列表
  newVersion: number;           // 服务端最新版本
}

interface ServerConflict {
  eventId: string;
  entityType: EntityType;
  entityId: string;
  conflictingFields: string[];
  serverVersion: number;
  serverData: Record<string, unknown>;
}

// === Pull API ===

interface SyncPullRequest {
  deviceId: string;
  lastSyncVersion: number;      // 客户端已同步到的版本
  entityTypes?: EntityType[];   // 可选：只拉取指定类型
  limit?: number;               // 默认 100，最大 500
}

interface SyncPullResponse {
  changes: RemoteChange[];
  currentVersion: number;
  hasMore: boolean;
}

interface RemoteChange {
  eventId: string;
  entityType: EntityType;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  version: number;
  sourceDeviceId: string;
  serverTimestamp: number;
}

// === Device API ===

interface RegisterDeviceRequest {
  deviceId: string;
  deviceName: string;
  platform: 'windows' | 'macos' | 'linux' | 'web' | 'ios' | 'android';
  appVersion: string;
  pushToken?: string;
}

interface DeviceResponse {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  lastSyncAt: number | null;
  lastSeenAt: number;
  isActive: boolean;
}

// === Conflict API ===

interface ResolveConflictRequest {
  deviceId: string;
  strategy: 'local' | 'remote' | 'manual';
  resolvedData?: Record<string, unknown>;  // strategy=manual 时必填
}

interface ResolveConflictResponse {
  success: boolean;
  newVersion: number;
  resolvedData: Record<string, unknown>;
}
```

### 错误响应

```typescript
interface SyncErrorResponse {
  success: false;
  error: {
    code: SyncErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

enum SyncErrorCode {
  VERSION_CONFLICT = 'SYNC_VERSION_CONFLICT',
  DEVICE_NOT_FOUND = 'SYNC_DEVICE_NOT_FOUND',
  LOCK_TIMEOUT = 'SYNC_LOCK_TIMEOUT',
  RATE_LIMITED = 'SYNC_RATE_LIMITED',
  PAYLOAD_TOO_LARGE = 'SYNC_PAYLOAD_TOO_LARGE',
  UNAUTHORIZED = 'SYNC_UNAUTHORIZED',
  SERVER_ERROR = 'SYNC_SERVER_ERROR',
}
```

---

## 🔄 错误恢复策略

### 错误分类与处理

| 错误类型 | 示例 | 恢复策略 | 用户通知 |
|---------|------|---------|---------|
| **可重试** | 网络超时、服务器 5xx | 指数退避重试 | 静默重试，失败后通知 |
| **需要用户干预** | 冲突、认证失败 | 暂停同步，提示用户 | 弹窗或通知 |
| **不可恢复** | 数据格式错误、404 | 跳过该变更，记录日志 | 记录到问题列表 |
| **临时性** | 限流 429 | 延迟重试 | 静默 |

### 重试策略

```typescript
// services/sync-retry-strategy.ts

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: SyncErrorCode[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  retryableErrors: [
    SyncErrorCode.LOCK_TIMEOUT,
    SyncErrorCode.RATE_LIMITED,
    SyncErrorCode.SERVER_ERROR,
  ],
};

export class SyncRetryStrategy {
  constructor(private config: RetryConfig = DEFAULT_RETRY_CONFIG) {}
  
  /**
   * 判断错误是否可重试
   */
  isRetryable(error: SyncError): boolean {
    // 网络错误总是可重试
    if (error.isNetworkError) return true;
    
    // 特定错误码可重试
    return this.config.retryableErrors.includes(error.code);
  }
  
  /**
   * 计算重试延迟
   */
  getRetryDelay(attempt: number): number {
    // 指数退避 + 随机抖动
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    
    return Math.min(
      exponentialDelay + jitter,
      this.config.maxDelayMs
    );
  }
  
  /**
   * 判断是否应该继续重试
   */
  shouldRetry(attempt: number, error: SyncError): boolean {
    return attempt < this.config.maxRetries && this.isRetryable(error);
  }
}
```

### 错误恢复流程

```typescript
// services/sync-error-recovery.ts

export class SyncErrorRecovery {
  constructor(
    private retryStrategy: SyncRetryStrategy,
    private notificationService: NotificationService,
    private problemLogService: ProblemLogService
  ) {}
  
  /**
   * 处理同步错误
   */
  async handleError(
    entry: SyncLogEntry,
    error: SyncError,
    attempt: number
  ): Promise<RecoveryAction> {
    // 1. 认证错误 - 需要用户重新登录
    if (error.code === SyncErrorCode.UNAUTHORIZED) {
      await this.notificationService.show({
        title: '同步失败',
        body: '请重新登录以继续同步',
        action: { type: 'navigate', path: '/auth/login' },
      });
      return { action: 'pause', reason: 'auth_required' };
    }
    
    // 2. 冲突错误 - 需要用户解决
    if (error.code === SyncErrorCode.VERSION_CONFLICT) {
      return {
        action: 'show_conflict',
        conflict: error.details as ConflictInfo,
      };
    }
    
    // 3. 可重试错误
    if (this.retryStrategy.shouldRetry(attempt, error)) {
      const delay = this.retryStrategy.getRetryDelay(attempt);
      return { action: 'retry', delayMs: delay };
    }
    
    // 4. 不可恢复错误 - 记录到问题日志
    await this.problemLogService.log({
      entryId: entry.id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      error: error.message,
      errorCode: error.code,
      timestamp: Date.now(),
    });
    
    await this.notificationService.show({
      title: '同步问题',
      body: `「${entry.entityType}」同步失败，已记录到问题列表`,
    });
    
    return { action: 'skip', reason: 'unrecoverable' };
  }
}

type RecoveryAction =
  | { action: 'retry'; delayMs: number }
  | { action: 'pause'; reason: string }
  | { action: 'skip'; reason: string }
  | { action: 'show_conflict'; conflict: ConflictInfo };
```

---

## 🏗️ 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        同步架构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Desktop A (Windows)              Desktop B (macOS)            │
│   ┌──────────────────┐            ┌──────────────────┐         │
│   │   Renderer       │            │   Renderer       │         │
│   │   ├── SyncUI     │            │   ├── SyncUI     │         │
│   │   └── Conflict   │            │   └── Conflict   │         │
│   │       Resolver   │            │       Resolver   │         │
│   └────────┬─────────┘            └────────┬─────────┘         │
│            │ IPC                            │ IPC               │
│   ┌────────▼─────────┐            ┌────────▼─────────┐         │
│   │   Main Process   │            │   Main Process   │         │
│   │   ├── SQLite     │            │   ├── SQLite     │         │
│   │   ├── SyncLog    │            │   ├── SyncLog    │         │
│   │   └── SyncEngine │            │   └── SyncEngine │         │
│   └────────┬─────────┘            └────────┬─────────┘         │
│            │                                │                   │
│            │         ┌──────────────────┐  │                   │
│            └────────►│   Sync Server    │◄─┘                   │
│                      │   (API)          │                      │
│                      ├──────────────────┤                      │
│                      │   - WebSocket    │                      │
│                      │   - REST API     │                      │
│                      │   - Conflict     │                      │
│                      │     Detection    │                      │
│                      └────────┬─────────┘                      │
│                               │                                 │
│                      ┌────────▼─────────┐                      │
│                      │   PostgreSQL     │                      │
│                      │   (Source of     │                      │
│                      │    Truth)        │                      │
│                      └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 同步策略

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| **操作日志 (Event Sourcing)** | 记录每个变更操作 | 需要完整历史 ✅ |
| **版本向量** | 检测并发修改 | 多设备冲突检测 ✅ |
| **手动冲突解决** | 用户选择保留版本 | 需要用户决策 ✅ |
| **字段级合并** | 非冲突字段自动合并 | 减少冲突 ✅ |

### 数据流

```
                    ┌─────────────────────────────────────┐
                    │           同步数据流                 │
                    └─────────────────────────────────────┘
                    
本地变更触发:
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 用户    │───►│ Service │───►│ Repo    │───►│ SQLite  │
│ 操作    │    │ 调用    │    │ 保存    │    │ 写入    │
└─────────┘    └─────────┘    └────┬────┘    └─────────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │ SyncLog │ ← 同步日志记录
                              │ 写入    │
                              └────┬────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
               ┌─────────┐   ┌─────────┐   ┌─────────┐
               │ 在线    │   │ 离线    │   │ 队列    │
               │ 立即    │   │ 暂存    │   │ 重试    │
               │ 同步    │   │ 待上传  │   │ 失败    │
               └─────────┘   └─────────┘   └─────────┘

远程变更接收:
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Server  │───►│ Sync    │───►│ Conflict│───►│ Apply   │
│ Push    │    │ Engine  │    │ Check   │    │ Changes │
└─────────┘    └─────────┘    └────┬────┘    └─────────┘
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                         ▼                   ▼
                   ┌─────────┐         ┌─────────┐
                   │ 无冲突  │         │ 有冲突  │
                   │ 自动    │         │ 用户    │
                   │ 合并    │         │ 解决    │
                   └─────────┘         └─────────┘
```

---

## 📊 数据模型

### 同步日志表 (sync_log)

```sql
CREATE TABLE sync_log (
    id TEXT PRIMARY KEY,              -- UUID
    entity_type TEXT NOT NULL,        -- 'goal' | 'task' | 'reminder' ...
    entity_id TEXT NOT NULL,          -- 实体 UUID
    operation TEXT NOT NULL,          -- 'create' | 'update' | 'delete'
    payload TEXT NOT NULL,            -- JSON: 变更内容
    timestamp INTEGER NOT NULL,       -- Unix 毫秒时间戳
    device_id TEXT NOT NULL,          -- 设备唯一标识
    synced INTEGER DEFAULT 0,         -- 是否已同步: 0=未同步, 1=已同步
    version INTEGER NOT NULL,         -- 乐观锁版本号
    sync_error TEXT,                  -- 同步错误信息 (如有)
    retry_count INTEGER DEFAULT 0,    -- 重试次数
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_sync_log_synced ON sync_log(synced);
CREATE INDEX idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_timestamp ON sync_log(timestamp);
```

### 设备注册表 (devices)

```sql
CREATE TABLE devices (
    id TEXT PRIMARY KEY,              -- 设备 UUID
    name TEXT NOT NULL,               -- 设备名称 (用户可编辑)
    platform TEXT NOT NULL,           -- 'windows' | 'macos' | 'linux' | 'web'
    last_sync_at INTEGER,             -- 上次同步时间
    last_seen_at INTEGER,             -- 上次在线时间
    is_current INTEGER DEFAULT 0,     -- 是否当前设备
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### 冲突记录表 (conflict_records)

```sql
CREATE TABLE conflict_records (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    local_version TEXT NOT NULL,       -- JSON: 本地版本数据
    remote_version TEXT NOT NULL,      -- JSON: 远程版本数据
    resolved_version TEXT,             -- JSON: 解决后的版本
    resolution_strategy TEXT,          -- 'local' | 'remote' | 'merge' | 'manual'
    resolved_at INTEGER,
    resolved_by TEXT,                  -- 设备 ID
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_conflict_entity ON conflict_records(entity_type, entity_id);
CREATE INDEX idx_conflict_resolved ON conflict_records(resolved_at);
```

### 同步状态表 (sync_state)

```sql
CREATE TABLE sync_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- 单行表
    last_sync_at INTEGER,
    last_sync_version INTEGER,
    pending_changes INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'idle',  -- 'idle' | 'syncing' | 'error' | 'offline'
    last_error TEXT,
    updated_at INTEGER NOT NULL
);
```

---

## 📊 Story 分解

### STORY-019: 同步基础设施

**预估**: 3-4 天 | **优先级**: P3

#### 目标
建立本地同步日志基础设施，为同步功能做准备

#### Tasks

- [ ] **Task 19.1**: 创建同步数据库表
  - sync_log 表
  - devices 表
  - conflict_records 表
  - sync_state 表

```typescript
// database/migrations/002_sync_tables.ts
export function up(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      version INTEGER NOT NULL,
      sync_error TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_sync_log_synced 
      ON sync_log(synced);
    CREATE INDEX IF NOT EXISTS idx_sync_log_entity 
      ON sync_log(entity_type, entity_id);
    -- ... 其他表
  `);
}
```

- [ ] **Task 19.2**: 设备注册服务
  - 生成唯一设备 ID
  - 设备信息管理

```typescript
// services/device.service.ts
import { machineIdSync } from 'node-machine-id';
import { v4 as uuid } from 'uuid';

export class DeviceService {
  private deviceId: string;
  
  constructor(private db: Database) {
    this.deviceId = this.getOrCreateDeviceId();
  }
  
  private getOrCreateDeviceId(): string {
    try {
      // 尝试使用机器唯一标识
      return machineIdSync();
    } catch {
      // 回退到 UUID (存储在 SQLite)
      const stored = this.db.prepare(
        'SELECT value FROM app_config WHERE key = ?'
      ).get('device_id');
      
      if (stored) return stored.value;
      
      const newId = uuid();
      this.db.prepare(
        'INSERT INTO app_config (key, value) VALUES (?, ?)'
      ).run('device_id', newId);
      
      return newId;
    }
  }
  
  getDeviceId(): string {
    return this.deviceId;
  }
  
  getDeviceInfo(): DeviceInfo {
    return {
      id: this.deviceId,
      name: os.hostname(),
      platform: process.platform as Platform,
    };
  }
}
```

- [ ] **Task 19.3**: 同步日志服务
  - 记录本地变更
  - 查询待同步变更
  - 标记已同步

```typescript
// services/sync-log.service.ts
export interface SyncLogEntry {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
  deviceId: string;
  synced: boolean;
  version: number;
}

export class SyncLogService {
  constructor(
    private db: Database,
    private deviceService: DeviceService
  ) {}
  
  /**
   * 记录变更操作
   */
  logChange(
    entityType: EntityType,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    payload: Record<string, unknown>,
    version: number
  ): void {
    const entry: SyncLogEntry = {
      id: uuid(),
      entityType,
      entityId,
      operation,
      payload,
      timestamp: Date.now(),
      deviceId: this.deviceService.getDeviceId(),
      synced: false,
      version,
    };
    
    this.db.prepare(`
      INSERT INTO sync_log 
        (id, entity_type, entity_id, operation, payload, 
         timestamp, device_id, synced, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.entityType,
      entry.entityId,
      entry.operation,
      JSON.stringify(entry.payload),
      entry.timestamp,
      entry.deviceId,
      0,
      entry.version,
      entry.timestamp,
      entry.timestamp
    );
  }
  
  /**
   * 获取待同步的变更
   */
  getPendingChanges(limit: number = 100): SyncLogEntry[] {
    return this.db.prepare(`
      SELECT * FROM sync_log 
      WHERE synced = 0 
      ORDER BY timestamp ASC 
      LIMIT ?
    `).all(limit).map(this.mapRow);
  }
  
  /**
   * 标记为已同步
   */
  markAsSynced(ids: string[]): void {
    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`
      UPDATE sync_log 
      SET synced = 1, updated_at = ? 
      WHERE id IN (${placeholders})
    `).run(Date.now(), ...ids);
  }
  
  /**
   * 获取待同步变更数量
   */
  getPendingCount(): number {
    return this.db.prepare(
      'SELECT COUNT(*) as count FROM sync_log WHERE synced = 0'
    ).get().count;
  }
}
```

- [ ] **Task 19.4**: Repository 装饰器
  - 自动拦截写操作
  - 记录到同步日志

```typescript
// decorators/sync-aware.decorator.ts
export function createSyncAwareRepository<T extends BaseRepository>(
  repository: T,
  syncLogService: SyncLogService,
  entityType: EntityType
): T {
  return new Proxy(repository, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      
      if (typeof original !== 'function') {
        return original;
      }
      
      // 拦截写操作
      if (['create', 'update', 'delete'].includes(prop as string)) {
        return async (...args: unknown[]) => {
          const result = await original.apply(target, args);
          
          // 记录同步日志
          const entity = result as { id: string; version: number };
          syncLogService.logChange(
            entityType,
            entity.id,
            prop as 'create' | 'update' | 'delete',
            entity,
            entity.version
          );
          
          return result;
        };
      }
      
      return original.bind(target);
    },
  });
}
```

#### 验收标准
- [ ] 同步表创建成功
- [ ] 设备 ID 生成和持久化
- [ ] 本地变更自动记录到 sync_log
- [ ] 可查询待同步变更数量

#### 验收场景

**场景 19.1：数据库迁移验证**
```
前置条件：
  - 全新安装的应用
  - 数据库文件不存在
  
步骤：
  1. 启动应用
  2. 检查数据库结构
  
预期结果：
  - sync_log 表存在且索引正确
  - devices 表存在
  - conflict_records 表存在
  - sync_state 表存在且有一行初始数据
```

**场景 19.2：设备 ID 持久化**
```
步骤：
  1. 首次启动应用，记录设备 ID
  2. 关闭应用
  3. 重新启动应用，获取设备 ID
  
预期结果：
  - 两次获取的设备 ID 相同
  - 设备 ID 格式为 UUID 或机器唯一标识
```

**场景 19.3：变更自动记录**
```
前置条件：
  - 应用已启动
  - sync_log 表为空
  
步骤：
  1. 创建一个新目标
  2. 修改目标标题
  3. 删除目标
  4. 查询 sync_log 表
  
预期结果：
  - sync_log 有 3 条记录
  - 记录操作类型分别为 create, update, delete
  - 所有记录的 synced = 0
```

**场景 19.4：队列溢出保护**
```
前置条件：
  - MAX_PENDING_CHANGES = 1000
  - 当前待同步变更 = 990
  
步骤：
  1. 继续创建 10 个新目标
  2. 继续创建第 1001 个目标
  
预期结果：
  - 前 10 个目标创建成功
  - 在第 1000 个变更时显示警告通知
  - 第 1001 个目标创建被阻止，显示错误提示
```

#### 测试用例

```typescript
// tests/sync/sync-infrastructure.spec.ts
describe('STORY-019: 同步基础设施', () => {
  describe('数据库表创建', () => {
    it('应正确创建 sync_log 表', async () => {
      const tables = await db.pragma("table_info(sync_log)");
      expect(tables).toContainEqual(expect.objectContaining({ name: 'id' }));
      expect(tables).toContainEqual(expect.objectContaining({ name: 'entity_type' }));
      expect(tables).toContainEqual(expect.objectContaining({ name: 'operation' }));
      expect(tables).toContainEqual(expect.objectContaining({ name: 'synced' }));
    });
    
    it('应创建正确的索引', async () => {
      const indexes = await db.pragma("index_list(sync_log)");
      expect(indexes.map(i => i.name)).toContain('idx_sync_log_synced');
      expect(indexes.map(i => i.name)).toContain('idx_sync_log_entity');
    });
  });
  
  describe('设备服务', () => {
    it('应生成唯一设备 ID', () => {
      const deviceId = deviceService.getDeviceId();
      expect(deviceId).toMatch(/^[0-9a-f-]{36}$|^[a-f0-9]{32,64}$/i);
    });
    
    it('重启后设备 ID 应保持不变', async () => {
      const firstId = deviceService.getDeviceId();
      
      // 模拟重启
      await deviceService.dispose();
      const newDeviceService = new DeviceService(db);
      
      expect(newDeviceService.getDeviceId()).toBe(firstId);
    });
  });
  
  describe('同步日志服务', () => {
    it('应正确记录 create 操作', async () => {
      const goal = await goalService.create({ title: 'Test' });
      
      const logs = syncLogService.getPendingChanges();
      expect(logs).toContainEqual(expect.objectContaining({
        entityType: 'goal',
        entityId: goal.id,
        operation: 'create',
      }));
    });
    
    it('应正确记录 update 操作', async () => {
      const goal = await goalService.create({ title: 'Test' });
      await goalService.update(goal.id, { title: 'Updated' });
      
      const logs = syncLogService.getPendingChanges();
      const updateLog = logs.find(l => l.operation === 'update');
      expect(updateLog?.payload.title).toBe('Updated');
    });
    
    it('待同步变更数量应正确计算', async () => {
      const initialCount = syncLogService.getPendingCount();
      
      await goalService.create({ title: 'Test 1' });
      await goalService.create({ title: 'Test 2' });
      
      expect(syncLogService.getPendingCount()).toBe(initialCount + 2);
    });
    
    it('标记已同步后数量应减少', async () => {
      const goal = await goalService.create({ title: 'Test' });
      const logs = syncLogService.getPendingChanges();
      
      syncLogService.markAsSynced([logs[0].id]);
      
      const remaining = syncLogService.getPendingChanges();
      expect(remaining.find(l => l.id === logs[0].id)).toBeUndefined();
    });
  });
  
  describe('队列溢出保护', () => {
    it('接近上限时应显示警告', async () => {
      const warningSpy = vi.spyOn(notificationService, 'show');
      
      // 填充到警告阈值
      for (let i = 0; i < 800; i++) {
        await goalService.create({ title: `Test ${i}` });
      }
      
      expect(warningSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning' })
      );
    });
    
    it('达到上限时应拒绝新变更', async () => {
      // 填充到上限
      for (let i = 0; i < 1000; i++) {
        await goalService.create({ title: `Test ${i}` });
      }
      
      const result = syncQueueManager.addChange(mockEntry);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('queue_full');
    });
  });
});
```

---

### STORY-020: 网络同步层

**预估**: 3-4 天 | **优先级**: P3

#### 目标
实现与服务端的同步通信

#### Tasks

- [ ] **Task 20.1**: 网络状态监控
  - 检测在线/离线状态
  - 网络恢复自动触发同步

```typescript
// services/network.service.ts
import { EventEmitter } from 'events';

export class NetworkService extends EventEmitter {
  private isOnline: boolean;
  private checkInterval: NodeJS.Timer | null = null;
  
  constructor(private syncServerUrl: string) {
    super();
    this.isOnline = navigator.onLine;
    this.setupListeners();
  }
  
  private setupListeners(): void {
    // 浏览器事件
    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
    
    // 定期检测 (防止假在线)
    this.checkInterval = setInterval(() => this.checkConnection(), 30000);
  }
  
  private async checkConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.syncServerUrl}/health`, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      this.setOnline(response.ok);
    } catch {
      this.setOnline(false);
    }
  }
  
  private setOnline(online: boolean): void {
    if (this.isOnline !== online) {
      this.isOnline = online;
      this.emit(online ? 'online' : 'offline');
    }
  }
  
  getStatus(): boolean {
    return this.isOnline;
  }
}
```

- [ ] **Task 20.2**: 同步客户端
  - REST API 调用
  - 可选 WebSocket 实时推送

```typescript
// services/sync-client.service.ts
export interface SyncPushPayload {
  deviceId: string;
  changes: SyncLogEntry[];
  lastSyncVersion: number;
}

export interface SyncPullPayload {
  deviceId: string;
  lastSyncVersion: number;
}

export interface SyncPullResponse {
  changes: RemoteChange[];
  currentVersion: number;
  hasMore: boolean;
}

export class SyncClientService {
  constructor(
    private baseUrl: string,
    private authService: AuthService
  ) {}
  
  /**
   * 推送本地变更到服务端
   */
  async pushChanges(payload: SyncPushPayload): Promise<SyncPushResult> {
    const response = await fetch(`${this.baseUrl}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.authService.getToken()}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new SyncError('Push failed', response.status);
    }
    
    return response.json();
  }
  
  /**
   * 拉取远程变更
   */
  async pullChanges(payload: SyncPullPayload): Promise<SyncPullResponse> {
    const response = await fetch(`${this.baseUrl}/sync/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.authService.getToken()}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new SyncError('Pull failed', response.status);
    }
    
    return response.json();
  }
}
```

- [ ] **Task 20.3**: 同步引擎
  - 协调 push/pull 流程
  - 处理重试和错误

```typescript
// services/sync-engine.service.ts
export class SyncEngine {
  private isSyncing = false;
  private syncQueue: SyncLogEntry[] = [];
  
  constructor(
    private syncLogService: SyncLogService,
    private syncClient: SyncClientService,
    private conflictService: ConflictService,
    private networkService: NetworkService
  ) {
    // 网络恢复时自动同步
    this.networkService.on('online', () => this.sync());
  }
  
  /**
   * 执行完整同步
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { status: 'already-syncing' };
    }
    
    if (!this.networkService.getStatus()) {
      return { status: 'offline' };
    }
    
    this.isSyncing = true;
    
    try {
      // 1. 推送本地变更
      await this.pushLocalChanges();
      
      // 2. 拉取远程变更
      await this.pullRemoteChanges();
      
      return { status: 'success' };
    } catch (error) {
      return { status: 'error', error };
    } finally {
      this.isSyncing = false;
    }
  }
  
  private async pushLocalChanges(): Promise<void> {
    const pendingChanges = this.syncLogService.getPendingChanges();
    
    if (pendingChanges.length === 0) return;
    
    const result = await this.syncClient.pushChanges({
      deviceId: this.deviceService.getDeviceId(),
      changes: pendingChanges,
      lastSyncVersion: this.getLastSyncVersion(),
    });
    
    // 处理冲突
    if (result.conflicts.length > 0) {
      await this.conflictService.handleConflicts(result.conflicts);
    }
    
    // 标记已同步
    this.syncLogService.markAsSynced(
      pendingChanges.map(c => c.id)
    );
  }
  
  private async pullRemoteChanges(): Promise<void> {
    let hasMore = true;
    
    while (hasMore) {
      const response = await this.syncClient.pullChanges({
        deviceId: this.deviceService.getDeviceId(),
        lastSyncVersion: this.getLastSyncVersion(),
      });
      
      // 应用远程变更
      await this.applyRemoteChanges(response.changes);
      
      // 更新同步版本
      this.setLastSyncVersion(response.currentVersion);
      
      hasMore = response.hasMore;
    }
  }
  
  private async applyRemoteChanges(changes: RemoteChange[]): Promise<void> {
    for (const change of changes) {
      // 检查本地是否有未同步的冲突变更
      const localPending = this.syncLogService.findPendingForEntity(
        change.entityType,
        change.entityId
      );
      
      if (localPending) {
        // 有冲突，交给冲突服务处理
        await this.conflictService.createConflict(localPending, change);
      } else {
        // 无冲突，直接应用
        await this.applyChange(change);
      }
    }
  }
}
```

- [ ] **Task 20.4**: 重试队列
  - 失败变更自动重试
  - 指数退避策略

```typescript
// services/retry-queue.service.ts
export class RetryQueueService {
  private readonly maxRetries = 5;
  private readonly baseDelay = 1000; // 1s
  
  /**
   * 计算重试延迟 (指数退避)
   */
  private getRetryDelay(retryCount: number): number {
    return Math.min(
      this.baseDelay * Math.pow(2, retryCount),
      60000 // 最大 60s
    );
  }
  
  /**
   * 处理失败的同步
   */
  async handleFailure(entry: SyncLogEntry, error: Error): Promise<void> {
    if (entry.retryCount >= this.maxRetries) {
      // 超过最大重试次数，标记为失败
      await this.markAsFailed(entry, error);
      return;
    }
    
    // 更新重试计数
    await this.incrementRetryCount(entry);
    
    // 延迟后重试
    const delay = this.getRetryDelay(entry.retryCount);
    setTimeout(() => {
      this.syncEngine.syncEntry(entry);
    }, delay);
  }
}
```

#### 验收标准
- [ ] 在线时自动同步
- [ ] 离线时变更暂存
- [ ] 网络恢复自动重试
- [ ] 失败重试有指数退避

#### 验收场景

**场景 20.1：在线自动同步**
```
前置条件：
  - 网络正常连接
  - 用户已登录
  
步骤：
  1. 创建一个新目标
  2. 等待 500ms (防抖时间)
  3. 检查 sync_log 状态
  
预期结果：
  - sync_log 中该记录的 synced = 1
  - 服务端有对应的同步事件
```

**场景 20.2：离线变更暂存**
```
前置条件：
  - 网络断开 (飞行模式)
  
步骤：
  1. 创建 3 个新目标
  2. 修改 1 个目标
  3. 检查 sync_log 状态
  4. 检查状态栏显示
  
预期结果：
  - sync_log 有 4 条 synced = 0 的记录
  - 状态栏显示「离线模式 - 4 个变更待同步」
```

**场景 20.3：网络恢复自动同步**
```
前置条件：
  - 场景 20.2 完成后
  - 有 4 个待同步变更
  
步骤：
  1. 恢复网络连接
  2. 等待 5 秒
  3. 检查 sync_log 状态
  4. 检查状态栏显示
  
预期结果：
  - 所有 sync_log 记录的 synced = 1
  - 状态栏显示「已同步 ✓」
  - 收到通知「4 个变更已同步到云端」
```

**场景 20.4：重试指数退避**
```
前置条件：
  - 服务端返回 500 错误
  
步骤：
  1. 创建一个新目标
  2. 观察重试行为
  3. 记录每次重试的时间间隔
  
预期结果：
  - 第 1 次重试：~1s 后
  - 第 2 次重试：~2s 后
  - 第 3 次重试：~4s 后
  - 第 4 次重试：~8s 后
  - 第 5 次重试失败后，记录到问题列表
```

**场景 20.5：同步中断恢复**
```
步骤：
  1. 积累 50 个待同步变更
  2. 开始同步
  3. 在同步过程中 (已完成 20 个) 关闭应用
  4. 重新启动应用
  5. 检查同步状态
  
预期结果：
  - 前 20 个变更保持 synced = 1
  - 剩余 30 个变更重新加入同步队列
  - 继续同步完成所有变更
```

#### 测试用例

```typescript
// tests/sync/network-sync.spec.ts
describe('STORY-020: 网络同步层', () => {
  describe('网络状态监控', () => {
    it('应正确检测在线状态', () => {
      expect(networkService.getStatus()).toBe(true);
    });
    
    it('网络断开时应触发 offline 事件', async () => {
      const offlineSpy = vi.fn();
      networkService.on('offline', offlineSpy);
      
      // 模拟网络断开
      await simulateNetworkOffline();
      
      expect(offlineSpy).toHaveBeenCalled();
    });
    
    it('网络恢复时应触发 online 事件', async () => {
      const onlineSpy = vi.fn();
      networkService.on('online', onlineSpy);
      
      await simulateNetworkOffline();
      await simulateNetworkOnline();
      
      expect(onlineSpy).toHaveBeenCalled();
    });
  });
  
  describe('同步引擎', () => {
    it('在线时应自动触发同步', async () => {
      const syncSpy = vi.spyOn(syncEngine, 'sync');
      
      await goalService.create({ title: 'Test' });
      await vi.advanceTimersByTime(500); // 防抖
      
      expect(syncSpy).toHaveBeenCalled();
    });
    
    it('离线时不应触发同步', async () => {
      await simulateNetworkOffline();
      const syncSpy = vi.spyOn(syncEngine, 'sync');
      
      await goalService.create({ title: 'Test' });
      await vi.advanceTimersByTime(500);
      
      expect(syncSpy).not.toHaveBeenCalled();
    });
    
    it('网络恢复时应自动同步待处理变更', async () => {
      await simulateNetworkOffline();
      await goalService.create({ title: 'Test' });
      
      const syncSpy = vi.spyOn(syncEngine, 'sync');
      await simulateNetworkOnline();
      
      expect(syncSpy).toHaveBeenCalled();
    });
  });
  
  describe('重试机制', () => {
    it('应使用指数退避策略', async () => {
      mockServer.setResponse('push', { status: 500 });
      
      const delays: number[] = [];
      vi.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
        delays.push(delay as number);
        return 0 as any;
      });
      
      await goalService.create({ title: 'Test' });
      await runAllTimers();
      
      expect(delays[0]).toBeCloseTo(1000, -2);
      expect(delays[1]).toBeCloseTo(2000, -2);
      expect(delays[2]).toBeCloseTo(4000, -2);
    });
    
    it('超过最大重试次数后应标记失败', async () => {
      mockServer.setResponse('push', { status: 500 });
      
      await goalService.create({ title: 'Test' });
      
      for (let i = 0; i < 6; i++) {
        await vi.advanceTimersByTime(60000);
      }
      
      const logs = syncLogService.getPendingChanges();
      expect(logs[0].sync_error).toBeTruthy();
    });
  });
  
  describe('断点续传', () => {
    it('应恢复未完成的同步批次', async () => {
      // 创建未完成的批次
      await db.prepare(`
        INSERT INTO sync_batches (id, status, progress)
        VALUES (?, 'in_progress', 20)
      `).run('batch-1');
      
      const batch = await syncEngine.loadIncompleteBatch();
      expect(batch?.id).toBe('batch-1');
      expect(batch?.progress).toBe(20);
    });
  });
});
```

---

### STORY-021: 冲突检测与解决

**预估**: 4-5 天 | **优先级**: P3

#### 目标
实现冲突检测、记录和用户解决机制

#### 冲突解决策略

| 实体类型 | 字段 | 策略 | 说明 |
|----------|------|------|------|
| Goal | title | 用户选择 | 标题冲突需要用户决定 |
| Goal | progress | 取较大值 | 进度只增不减 |
| Goal | status | 优先级合并 | completed > active > paused |
| Task | title | 用户选择 | |
| Task | status | 已完成优先 | 任一完成即完成 |
| Task | dueDate | 取较早 | 更紧迫的优先 |
| Reminder | time | 用户选择 | 时间敏感 |
| Setting | * | 后写入优先 | 配置项简单覆盖 |

#### Tasks

- [ ] **Task 21.1**: 冲突检测服务
  - 版本号比较
  - 字段级差异检测

```typescript
// services/conflict-detection.service.ts
export interface ConflictInfo {
  entityType: EntityType;
  entityId: string;
  localVersion: VersionedEntity;
  remoteVersion: VersionedEntity;
  conflictingFields: string[];
}

export class ConflictDetectionService {
  /**
   * 检测两个版本之间的冲突
   */
  detectConflict(
    local: VersionedEntity,
    remote: VersionedEntity
  ): ConflictInfo | null {
    // 版本号相同，无冲突
    if (local.version === remote.version) {
      return null;
    }
    
    // 本地版本更新，无冲突（远程会接受本地）
    if (local.version > remote.version) {
      return null;
    }
    
    // 远程版本更新，检测字段级冲突
    const conflictingFields = this.findConflictingFields(local, remote);
    
    if (conflictingFields.length === 0) {
      return null; // 字段无冲突，可自动合并
    }
    
    return {
      entityType: local.entityType,
      entityId: local.id,
      localVersion: local,
      remoteVersion: remote,
      conflictingFields,
    };
  }
  
  private findConflictingFields(
    local: VersionedEntity,
    remote: VersionedEntity
  ): string[] {
    const conflicts: string[] = [];
    const fieldsToCheck = this.getFieldsForEntity(local.entityType);
    
    for (const field of fieldsToCheck) {
      const localValue = local[field];
      const remoteValue = remote[field];
      
      // 两边都修改了同一字段且值不同
      if (
        localValue !== undefined &&
        remoteValue !== undefined &&
        !isEqual(localValue, remoteValue)
      ) {
        conflicts.push(field);
      }
    }
    
    return conflicts;
  }
}
```

- [ ] **Task 21.2**: 冲突记录服务
  - 保存冲突历史
  - 查询未解决冲突

```typescript
// services/conflict-record.service.ts
export class ConflictRecordService {
  constructor(private db: Database) {}
  
  /**
   * 创建冲突记录
   */
  createConflict(conflict: ConflictInfo): ConflictRecord {
    const record: ConflictRecord = {
      id: uuid(),
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      localVersion: JSON.stringify(conflict.localVersion),
      remoteVersion: JSON.stringify(conflict.remoteVersion),
      resolvedVersion: null,
      resolutionStrategy: null,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: Date.now(),
    };
    
    this.db.prepare(`
      INSERT INTO conflict_records 
        (id, entity_type, entity_id, local_version, remote_version, 
         resolved_version, resolution_strategy, resolved_at, resolved_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.entityType,
      record.entityId,
      record.localVersion,
      record.remoteVersion,
      record.resolvedVersion,
      record.resolutionStrategy,
      record.resolvedAt,
      record.resolvedBy,
      record.createdAt
    );
    
    return record;
  }
  
  /**
   * 获取未解决的冲突
   */
  getUnresolvedConflicts(): ConflictRecord[] {
    return this.db.prepare(`
      SELECT * FROM conflict_records 
      WHERE resolved_at IS NULL 
      ORDER BY created_at DESC
    `).all().map(this.mapRow);
  }
  
  /**
   * 解决冲突
   */
  resolveConflict(
    conflictId: string,
    resolvedVersion: VersionedEntity,
    strategy: ResolutionStrategy,
    deviceId: string
  ): void {
    this.db.prepare(`
      UPDATE conflict_records 
      SET resolved_version = ?,
          resolution_strategy = ?,
          resolved_at = ?,
          resolved_by = ?
      WHERE id = ?
    `).run(
      JSON.stringify(resolvedVersion),
      strategy,
      Date.now(),
      deviceId,
      conflictId
    );
  }
  
  /**
   * 获取冲突历史
   */
  getConflictHistory(
    entityType?: EntityType,
    entityId?: string,
    limit: number = 50
  ): ConflictRecord[] {
    let sql = 'SELECT * FROM conflict_records WHERE resolved_at IS NOT NULL';
    const params: unknown[] = [];
    
    if (entityType) {
      sql += ' AND entity_type = ?';
      params.push(entityType);
    }
    
    if (entityId) {
      sql += ' AND entity_id = ?';
      params.push(entityId);
    }
    
    sql += ' ORDER BY resolved_at DESC LIMIT ?';
    params.push(limit);
    
    return this.db.prepare(sql).all(...params).map(this.mapRow);
  }
}
```

- [ ] **Task 21.3**: 冲突解决器
  - 自动解决策略
  - 需要用户干预时暂停

```typescript
// services/conflict-resolver.service.ts
export type ResolutionStrategy = 'local' | 'remote' | 'merge' | 'manual';

export class ConflictResolverService {
  constructor(
    private conflictRecordService: ConflictRecordService,
    private entityServices: Map<EntityType, BaseService>
  ) {}
  
  /**
   * 尝试自动解决冲突
   */
  async tryAutoResolve(conflict: ConflictInfo): Promise<AutoResolveResult> {
    const strategy = this.getAutoResolveStrategy(conflict);
    
    if (!strategy) {
      // 无法自动解决，需要用户干预
      return { resolved: false, requiresManual: true };
    }
    
    const resolved = await this.applyStrategy(conflict, strategy);
    
    return { resolved: true, result: resolved };
  }
  
  private getAutoResolveStrategy(
    conflict: ConflictInfo
  ): ResolutionStrategy | null {
    const { entityType, conflictingFields, localVersion, remoteVersion } = conflict;
    
    // 检查是否所有冲突字段都可以自动合并
    for (const field of conflictingFields) {
      const autoStrategy = this.getFieldAutoStrategy(entityType, field);
      
      if (autoStrategy === 'manual') {
        return null; // 需要用户干预
      }
    }
    
    return 'merge';
  }
  
  private getFieldAutoStrategy(
    entityType: EntityType,
    field: string
  ): 'local' | 'remote' | 'merge' | 'manual' {
    const strategies: Record<string, Record<string, ResolutionStrategy>> = {
      goal: {
        title: 'manual',
        description: 'manual',
        progress: 'merge', // 取较大值
        status: 'merge',   // 优先级规则
        updatedAt: 'remote',
      },
      task: {
        title: 'manual',
        status: 'merge',   // 完成优先
        dueDate: 'merge',  // 取较早
        updatedAt: 'remote',
      },
      reminder: {
        time: 'manual',
        message: 'manual',
        enabled: 'merge',  // 任一启用则启用
      },
      setting: {
        '*': 'remote', // 设置项后写入优先
      },
    };
    
    return strategies[entityType]?.[field] 
      ?? strategies[entityType]?.['*'] 
      ?? 'manual';
  }
  
  /**
   * 合并字段
   */
  private mergeField(
    entityType: EntityType,
    field: string,
    localValue: unknown,
    remoteValue: unknown
  ): unknown {
    // progress: 取较大值
    if (field === 'progress') {
      return Math.max(localValue as number, remoteValue as number);
    }
    
    // status: 优先级合并
    if (field === 'status') {
      return this.mergeStatus(
        localValue as string,
        remoteValue as string,
        entityType
      );
    }
    
    // dueDate: 取较早
    if (field === 'dueDate') {
      return Math.min(localValue as number, remoteValue as number);
    }
    
    // enabled: OR 合并
    if (field === 'enabled') {
      return (localValue as boolean) || (remoteValue as boolean);
    }
    
    // 默认取远程
    return remoteValue;
  }
  
  private mergeStatus(
    local: string,
    remote: string,
    entityType: EntityType
  ): string {
    const priorities: Record<string, Record<string, number>> = {
      goal: { completed: 3, active: 2, paused: 1, draft: 0 },
      task: { completed: 3, inProgress: 2, pending: 1, cancelled: 0 },
    };
    
    const priority = priorities[entityType] ?? {};
    return (priority[local] ?? 0) >= (priority[remote] ?? 0) ? local : remote;
  }
  
  /**
   * 用户手动解决冲突
   */
  async resolveManually(
    conflictId: string,
    resolution: 'local' | 'remote' | Record<string, unknown>
  ): Promise<void> {
    const conflict = this.conflictRecordService.getById(conflictId);
    
    let resolvedVersion: VersionedEntity;
    let strategy: ResolutionStrategy;
    
    if (resolution === 'local') {
      resolvedVersion = JSON.parse(conflict.localVersion);
      strategy = 'local';
    } else if (resolution === 'remote') {
      resolvedVersion = JSON.parse(conflict.remoteVersion);
      strategy = 'remote';
    } else {
      // 手动合并
      resolvedVersion = {
        ...JSON.parse(conflict.remoteVersion),
        ...resolution,
        version: JSON.parse(conflict.remoteVersion).version + 1,
      };
      strategy = 'manual';
    }
    
    // 应用解决方案
    const service = this.entityServices.get(conflict.entityType);
    await service.update(resolvedVersion);
    
    // 记录解决方案
    this.conflictRecordService.resolveConflict(
      conflictId,
      resolvedVersion,
      strategy,
      this.deviceService.getDeviceId()
    );
  }
}
```

- [ ] **Task 21.4**: 冲突历史查看
  - 查看历史冲突记录
  - 支持按实体筛选

```typescript
// services/conflict-history.service.ts
export interface ConflictHistoryItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  conflictingFields: string[];
  localSummary: string;
  remoteSummary: string;
  resolutionStrategy: ResolutionStrategy;
  resolvedAt: number;
  resolvedByDevice: string;
}

export class ConflictHistoryService {
  /**
   * 获取格式化的冲突历史
   */
  async getFormattedHistory(options: HistoryOptions): Promise<ConflictHistoryItem[]> {
    const records = this.conflictRecordService.getConflictHistory(
      options.entityType,
      options.entityId,
      options.limit
    );
    
    return Promise.all(records.map(async (record) => {
      const local = JSON.parse(record.localVersion);
      const remote = JSON.parse(record.remoteVersion);
      const device = await this.deviceService.getById(record.resolvedBy);
      
      return {
        id: record.id,
        entityType: record.entityType,
        entityId: record.entityId,
        entityTitle: local.title ?? local.name ?? record.entityId,
        conflictingFields: this.detectConflictingFields(local, remote),
        localSummary: this.summarizeVersion(local),
        remoteSummary: this.summarizeVersion(remote),
        resolutionStrategy: record.resolutionStrategy,
        resolvedAt: record.resolvedAt,
        resolvedByDevice: device?.name ?? 'Unknown Device',
      };
    }));
  }
}
```

#### 验收标准
- [ ] 正确检测版本冲突
- [ ] 可自动合并的字段自动处理
- [ ] 无法自动解决时提示用户
- [ ] 冲突历史完整可查询

#### 验收场景

**场景 21.1：版本冲突检测**
```
前置条件：
  - 设备 A 和设备 B 都有同一目标 (version = 1)
  - 设备 A 离线
  
步骤：
  1. 设备 A (离线) 修改目标标题为「标题 A」
  2. 设备 B (在线) 修改目标标题为「标题 B」，同步成功 (version = 2)
  3. 设备 A 恢复网络，尝试同步
  
预期结果：
  - 检测到版本冲突 (本地 baseVersion=1, 服务端 version=2)
  - 生成冲突记录
  - 同步状态变为 conflict
```

**场景 21.2：自动合并 - 进度字段**
```
前置条件：
  - 同一目标在两台设备上
  
步骤：
  1. 设备 A (离线) 将进度从 50% 改为 70%
  2. 设备 B (在线) 将进度从 50% 改为 60%
  3. 设备 A 恢复网络
  
预期结果：
  - 自动合并，无需用户干预
  - 最终进度 = max(70%, 60%) = 70%
```

**场景 21.3：自动合并 - 状态字段**
```
前置条件：
  - 同一任务在两台设备上，状态 = pending
  
步骤：
  1. 设备 A 将状态改为 completed
  2. 设备 B 将状态改为 inProgress
  3. 同步
  
预期结果：
  - 自动合并，最终状态 = completed (优先级更高)
```

**场景 21.4：手动解决 - 标题冲突**
```
前置条件：
  - 场景 21.1 的冲突状态
  
步骤：
  1. 弹出冲突解决对话框
  2. 用户选择「使用本地版本」
  3. 点击确认
  
预期结果：
  - 目标标题更新为「标题 A」
  - 冲突记录更新：resolutionStrategy = 'local'
  - 生成新的同步事件
```

**场景 21.5：冲突历史查询**
```
前置条件：
  - 已解决过 3 个冲突
  
步骤：
  1. 打开设置 → 同步历史
  2. 查看冲突列表
  3. 按类型筛选「目标」
  
预期结果：
  - 显示所有已解决的冲突
  - 每条记录显示：实体名称、冲突字段、解决策略、解决时间
  - 筛选后只显示目标类型的冲突
```

#### 测试用例

```typescript
// tests/sync/conflict-resolution.spec.ts
describe('STORY-021: 冲突检测与解决', () => {
  describe('冲突检测服务', () => {
    it('版本不同时应检测到冲突', () => {
      const local = { id: '1', version: 1, title: 'Local' };
      const remote = { id: '1', version: 2, title: 'Remote' };
      
      const conflict = conflictDetection.detectConflict(local, remote);
      expect(conflict).not.toBeNull();
      expect(conflict?.conflictingFields).toContain('title');
    });
    
    it('版本相同时不应有冲突', () => {
      const local = { id: '1', version: 1, title: 'Same' };
      const remote = { id: '1', version: 1, title: 'Same' };
      
      const conflict = conflictDetection.detectConflict(local, remote);
      expect(conflict).toBeNull();
    });
    
    it('只有非冲突字段变更时应可自动合并', () => {
      const local = { id: '1', version: 1, progress: 70 };
      const remote = { id: '1', version: 2, progress: 60 };
      
      const conflict = conflictDetection.detectConflict(local, remote);
      expect(conflict?.conflictingFields).toContain('progress');
      
      // 但 progress 可自动合并
      const result = conflictResolver.tryAutoResolve(conflict!);
      expect(result.resolved).toBe(true);
    });
  });
  
  describe('自动合并策略', () => {
    it('progress 应取较大值', () => {
      const merged = conflictResolver.mergeField('goal', 'progress', 70, 60);
      expect(merged).toBe(70);
    });
    
    it('status 应按优先级合并', () => {
      const merged = conflictResolver.mergeField('goal', 'status', 'completed', 'active');
      expect(merged).toBe('completed');
    });
    
    it('dueDate 应取较早值', () => {
      const earlier = Date.now();
      const later = Date.now() + 86400000;
      
      const merged = conflictResolver.mergeField('task', 'dueDate', later, earlier);
      expect(merged).toBe(earlier);
    });
    
    it('enabled 应 OR 合并', () => {
      const merged = conflictResolver.mergeField('reminder', 'enabled', false, true);
      expect(merged).toBe(true);
    });
  });
  
  describe('手动解决', () => {
    it('选择本地版本应正确保存', async () => {
      const conflict = await createTestConflict();
      
      await conflictResolver.resolveManually(conflict.id, 'local');
      
      const record = await conflictRecordService.getById(conflict.id);
      expect(record.resolutionStrategy).toBe('local');
    });
    
    it('选择远程版本应正确保存', async () => {
      const conflict = await createTestConflict();
      
      await conflictResolver.resolveManually(conflict.id, 'remote');
      
      const record = await conflictRecordService.getById(conflict.id);
      expect(record.resolutionStrategy).toBe('remote');
    });
    
    it('手动合并应正确保存自定义值', async () => {
      const conflict = await createTestConflict();
      
      await conflictResolver.resolveManually(conflict.id, {
        title: 'Custom Merged Title',
      });
      
      const record = await conflictRecordService.getById(conflict.id);
      expect(record.resolutionStrategy).toBe('manual');
      expect(JSON.parse(record.resolvedVersion).title).toBe('Custom Merged Title');
    });
  });
  
  describe('冲突历史', () => {
    it('应正确查询已解决冲突', async () => {
      await createAndResolveConflicts(3);
      
      const history = await conflictHistoryService.getFormattedHistory({});
      expect(history).toHaveLength(3);
    });
    
    it('应支持按类型筛选', async () => {
      await createAndResolveConflicts(2, 'goal');
      await createAndResolveConflicts(1, 'task');
      
      const goalHistory = await conflictHistoryService.getFormattedHistory({
        entityType: 'goal',
      });
      expect(goalHistory).toHaveLength(2);
    });
  });
});
```

---

### STORY-022: 同步 UI 集成

**预估**: 2-3 天 | **优先级**: P3

#### 目标
实现同步状态展示和冲突解决 UI

#### Tasks

- [ ] **Task 22.1**: 同步状态指示器
  - 状态栏同步图标
  - 待同步数量 Badge
  - 同步进度指示

```typescript
// components/SyncStatusIndicator.tsx
import { useSyncStatus } from '../hooks/useSyncStatus';

export function SyncStatusIndicator() {
  const { status, pendingCount, lastSyncAt, error } = useSyncStatus();
  
  const getIcon = () => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="animate-spin h-4 w-4" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'idle':
        return pendingCount > 0
          ? <CloudUpload className="h-4 w-4 text-warning" />
          : <Cloud className="h-4 w-4 text-success" />;
    }
  };
  
  const getTooltip = () => {
    switch (status) {
      case 'syncing':
        return '正在同步...';
      case 'offline':
        return `离线模式 - ${pendingCount} 个变更待同步`;
      case 'error':
        return `同步失败: ${error}`;
      case 'idle':
        return pendingCount > 0
          ? `${pendingCount} 个变更待同步`
          : `已同步 - ${formatTime(lastSyncAt)}`;
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            {getIcon()}
            {pendingCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Task 22.2**: 冲突解决对话框
  - 显示本地/远程版本差异
  - 用户选择解决方案

```typescript
// components/ConflictResolverDialog.tsx
interface ConflictResolverDialogProps {
  conflict: ConflictInfo;
  onResolve: (resolution: 'local' | 'remote' | Record<string, unknown>) => void;
  onDismiss: () => void;
}

export function ConflictResolverDialog({
  conflict,
  onResolve,
  onDismiss,
}: ConflictResolverDialogProps) {
  const [selectedResolution, setSelectedResolution] = 
    useState<'local' | 'remote' | 'manual'>('remote');
  const [manualValues, setManualValues] = useState<Record<string, unknown>>({});
  
  const local = conflict.localVersion;
  const remote = conflict.remoteVersion;
  
  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            检测到数据冲突
          </DialogTitle>
          <DialogDescription>
            「{local.title}」在多个设备上被修改，请选择要保留的版本
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 my-4">
          {/* 本地版本 */}
          <Card 
            className={cn(
              "cursor-pointer transition-all",
              selectedResolution === 'local' && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedResolution('local')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Laptop className="h-4 w-4" />
                本地版本
              </CardTitle>
              <CardDescription className="text-xs">
                修改于 {formatTime(local.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conflict.conflictingFields.map((field) => (
                <div key={field} className="mb-2">
                  <Label className="text-xs text-muted-foreground">
                    {getFieldLabel(field)}
                  </Label>
                  <p className="text-sm">{formatValue(local[field])}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* 远程版本 */}
          <Card 
            className={cn(
              "cursor-pointer transition-all",
              selectedResolution === 'remote' && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedResolution('remote')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                云端版本
              </CardTitle>
              <CardDescription className="text-xs">
                修改于 {formatTime(remote.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conflict.conflictingFields.map((field) => (
                <div key={field} className="mb-2">
                  <Label className="text-xs text-muted-foreground">
                    {getFieldLabel(field)}
                  </Label>
                  <p className="text-sm">{formatValue(remote[field])}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* 手动合并选项 */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              <ChevronDown className="h-4 w-4 mr-2" />
              手动合并字段
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            {conflict.conflictingFields.map((field) => (
              <div key={field} className="mb-4">
                <Label>{getFieldLabel(field)}</Label>
                <Input
                  value={manualValues[field] ?? remote[field]}
                  onChange={(e) => {
                    setManualValues({ ...manualValues, [field]: e.target.value });
                    setSelectedResolution('manual');
                  }}
                />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
        
        <DialogFooter>
          <Button variant="outline" onClick={onDismiss}>
            稍后解决
          </Button>
          <Button onClick={() => {
            if (selectedResolution === 'manual') {
              onResolve(manualValues);
            } else {
              onResolve(selectedResolution);
            }
          }}>
            应用选择
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Task 22.3**: 冲突历史页面
  - 列表展示历史冲突
  - 支持筛选和搜索

```typescript
// views/settings/SyncHistoryView.tsx
export function SyncHistoryView() {
  const [history, setHistory] = useState<ConflictHistoryItem[]>([]);
  const [filter, setFilter] = useState<EntityType | 'all'>('all');
  
  useEffect(() => {
    loadHistory();
  }, [filter]);
  
  const loadHistory = async () => {
    const data = await window.electronAPI.invoke('sync:conflict-history', {
      entityType: filter === 'all' ? undefined : filter,
      limit: 50,
    });
    setHistory(data);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">同步冲突历史</h2>
        <Select value={filter} onValueChange={(v) => setFilter(v as EntityType | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="goal">目标</SelectItem>
            <SelectItem value="task">任务</SelectItem>
            <SelectItem value="reminder">提醒</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        {history.map((item) => (
          <Card key={item.id}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.entityTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    冲突字段: {item.conflictingFields.join(', ')}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <Badge variant={getStrategyVariant(item.resolutionStrategy)}>
                    {getStrategyLabel(item.resolutionStrategy)}
                  </Badge>
                  <p className="text-muted-foreground mt-1">
                    {formatTime(item.resolvedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {history.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>暂无冲突历史</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Task 22.4**: 设备管理页面
  - 查看已注册设备
  - 设备重命名
  - 远程登出

```typescript
// views/settings/DevicesView.tsx
export function DevicesView() {
  const [devices, setDevices] = useState<Device[]>([]);
  const currentDeviceId = useCurrentDeviceId();
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">已登录设备</h2>
      
      <div className="space-y-2">
        {devices.map((device) => (
          <Card key={device.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPlatformIcon(device.platform)}
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {device.name}
                    {device.id === currentDeviceId && (
                      <Badge variant="secondary">当前设备</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    最后同步: {formatTime(device.lastSyncAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleRename(device)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {device.id !== currentDeviceId && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleLogout(device)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 验收标准
- [ ] 状态栏显示同步状态
- [ ] 冲突时弹出解决对话框
- [ ] 可查看冲突历史
- [ ] 可管理已登录设备

#### 验收场景

**场景 22.1：同步状态显示**
```
步骤：
  1. 在不同状态下观察状态栏图标
  
预期结果：
  - 空闲且已同步：绿色云图标 ✓
  - 有待同步变更：橙色上传图标 + 数量 Badge
  - 正在同步：旋转的加载图标
  - 离线：灰色断开图标
  - 同步失败：红色警告图标
```

**场景 22.2：同步状态 Tooltip**
```
步骤：
  1. 鼠标悬停在同步状态图标上
  
预期结果：
  - 已同步：「已同步 - 最后同步时间」
  - 待同步：「5 个变更待同步」
  - 离线：「离线模式 - 5 个变更待同步」
  - 失败：「同步失败: 网络错误」
```

**场景 22.3：冲突解决对话框**
```
前置条件：
  - 存在一个未解决的标题冲突
  
步骤：
  1. 弹出冲突解决对话框
  2. 检查显示内容
  3. 选择「使用本地」
  4. 点击确认
  
预期结果：
  - 对话框标题：「检测到数据冲突」
  - 显示本地版本和云端版本的对比
  - 显示冲突字段高亮
  - 点击确认后对话框关闭
  - 同步继续进行
```

**场景 22.4：设备管理**
```
前置条件：
  - 用户有 3 台已登录设备
  
步骤：
  1. 打开设置 → 设备管理
  2. 查看设备列表
  3. 重命名一台设备
  4. 远程登出一台设备
  
预期结果：
  - 显示所有 3 台设备，当前设备有标记
  - 每台设备显示：名称、平台、最后同步时间
  - 重命名成功后列表更新
  - 远程登出后该设备从列表消失
```

**场景 22.5：手动同步**
```
步骤：
  1. 点击同步状态图标
  2. 选择「立即同步」
  
预期结果：
  - 图标变为旋转加载状态
  - 同步完成后显示结果
  - 成功：短暂显示绿色对勾
  - 失败：显示错误提示
```

#### 测试用例

```typescript
// tests/sync/sync-ui.spec.ts
describe('STORY-022: 同步 UI 集成', () => {
  describe('同步状态指示器', () => {
    it('空闲状态应显示绿色云图标', async () => {
      await setSyncState({ status: 'idle', pendingCount: 0 });
      
      const icon = await screen.findByTestId('sync-status-icon');
      expect(icon).toHaveClass('text-success');
    });
    
    it('有待同步变更应显示 Badge', async () => {
      await setSyncState({ status: 'pending', pendingCount: 5 });
      
      const badge = await screen.findByTestId('sync-pending-badge');
      expect(badge).toHaveTextContent('5');
    });
    
    it('超过 99 个应显示 99+', async () => {
      await setSyncState({ status: 'pending', pendingCount: 150 });
      
      const badge = await screen.findByTestId('sync-pending-badge');
      expect(badge).toHaveTextContent('99+');
    });
    
    it('正在同步应显示旋转图标', async () => {
      await setSyncState({ status: 'syncing' });
      
      const icon = await screen.findByTestId('sync-status-icon');
      expect(icon).toHaveClass('animate-spin');
    });
  });
  
  describe('冲突解决对话框', () => {
    it('应正确显示冲突信息', async () => {
      await showConflictDialog({
        entityType: 'goal',
        conflictingFields: ['title'],
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
      });
      
      expect(screen.getByText('Local Title')).toBeInTheDocument();
      expect(screen.getByText('Remote Title')).toBeInTheDocument();
    });
    
    it('选择本地版本应调用正确回调', async () => {
      const onResolve = vi.fn();
      await showConflictDialog(mockConflict, { onResolve });
      
      await userEvent.click(screen.getByText('本地版本'));
      await userEvent.click(screen.getByText('应用选择'));
      
      expect(onResolve).toHaveBeenCalledWith('local');
    });
    
    it('手动合并应传递自定义值', async () => {
      const onResolve = vi.fn();
      await showConflictDialog(mockConflict, { onResolve });
      
      await userEvent.click(screen.getByText('手动合并字段'));
      await userEvent.type(screen.getByLabelText('标题'), 'Custom Title');
      await userEvent.click(screen.getByText('应用选择'));
      
      expect(onResolve).toHaveBeenCalledWith({ title: 'Custom Title' });
    });
  });
  
  describe('设备管理页面', () => {
    it('应显示所有设备', async () => {
      await mockDevices([
        { id: '1', name: 'MacBook Pro', platform: 'macos' },
        { id: '2', name: 'Windows PC', platform: 'windows' },
      ]);
      
      render(<DevicesView />);
      
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByText('Windows PC')).toBeInTheDocument();
    });
    
    it('当前设备应有标记', async () => {
      await mockCurrentDevice('1');
      await mockDevices([{ id: '1', name: 'My Device' }]);
      
      render(<DevicesView />);
      
      expect(screen.getByText('当前设备')).toBeInTheDocument();
    });
    
    it('远程登出应调用 API', async () => {
      const logoutSpy = vi.spyOn(deviceService, 'logout');
      await mockDevices([{ id: '2', name: 'Other Device' }]);
      
      render(<DevicesView />);
      await userEvent.click(screen.getByTestId('logout-device-2'));
      
      expect(logoutSpy).toHaveBeenCalledWith('2');
    });
  });
});
```

---

## 📅 开发计划

```
Week 1:
├── Day 1-2: STORY-019 (同步基础设施)
│   ├── 同步表创建
│   ├── 设备注册
│   └── 同步日志服务
└── Day 3-4: STORY-019 (同步基础设施)
    └── Repository 装饰器

Week 2:
├── Day 1-2: STORY-020 (网络同步层)
│   ├── 网络状态监控
│   └── 同步客户端
└── Day 3-4: STORY-020 (网络同步层)
    ├── 同步引擎
    └── 重试队列

Week 3:
├── Day 1-3: STORY-021 (冲突检测与解决)
│   ├── 冲突检测
│   ├── 冲突记录
│   └── 冲突解决器
└── Day 4-5: STORY-021 (冲突检测与解决)
    └── 冲突历史

Week 4:
├── Day 1-2: STORY-022 (同步 UI)
│   ├── 状态指示器
│   └── 冲突对话框
└── Day 3: STORY-022 (同步 UI)
    ├── 历史页面
    └── 设备管理
```

---

## 🔗 服务端 API 需求

> ⚠️ 注意：以下 API 需要服务端团队配合实现

### 必需 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/sync/push` | POST | 推送本地变更 |
| `/sync/pull` | POST | 拉取远程变更 |
| `/sync/devices` | GET | 获取设备列表 |
| `/sync/devices/:id` | PUT | 更新设备信息 |
| `/sync/devices/:id` | DELETE | 远程登出设备 |
| `/health` | HEAD | 连接检测 |

### 可选 API (实时同步)

| 端点 | 协议 | 说明 |
|------|------|------|
| `/sync/ws` | WebSocket | 实时推送变更通知 |

---

## 📈 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 服务端 API 延迟 | 高 | 高 | 可先完成本地基础设施，Mock API 测试 |
| 大量冲突积压 | 中 | 中 | 批量解决 UI，优先级排序 |
| 网络不稳定 | 中 | 中 | 完善重试机制，指数退避 |
| 数据一致性 | 中 | 高 | 版本号 + 事务保证 + 墓碑记录 |
| 离线队列溢出 | 低 | 高 | 队列大小限制，用户警告 |
| 同步过程中断 | 中 | 中 | 事务性同步，断点续传 |
| 时钟偏差 | 低 | 中 | 逻辑时钟 + 服务器时间 |

### 回滚策略

1. **同步功能回滚**
   - 设置 `DISABLE_SYNC=true` 环境变量
   - 应用降级为纯本地模式
   
2. **冲突解决回滚**
   - 从 conflict_records 表恢复原始数据
   - 重新触发冲突解决流程

3. **设备注销恢复**
   - 重新注册设备
   - 全量同步恢复数据

---

## 📊 监控与告警

### 同步健康指标

| 指标 | 正常范围 | 警告阈值 | 严重阈值 |
|------|----------|---------|---------|
| 待同步变更数 | 0-10 | > 50 | > 200 |
| 同步延迟 (秒) | < 5 | > 30 | > 120 |
| 冲突率 | < 1% | > 5% | > 15% |
| 重试队列深度 | 0 | > 10 | > 50 |
| 同步失败率 | < 0.1% | > 1% | > 5% |

---

**文档版本**: v1.1  
**创建日期**: 2025-12-07  
**最后更新**: 2025-12-07  
**更新说明**: 添加同步状态机、边界情况处理、EPIC-005 接口契约、错误恢复策略、验收场景、测试用例
