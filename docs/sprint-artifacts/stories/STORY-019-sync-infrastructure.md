# STORY-019: 同步基础设施 - 本地变更追踪

## 📋 Story 概述

**Story ID**: STORY-019  
**Epic**: EPIC-004 (Offline Sync - 多设备数据同步)  
**优先级**: P3  
**预估工时**: 3-4 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: EPIC-002 ✅ (Desktop Application Development)

---

## 🎯 用户故事

**作为** Desktop 应用用户  
**我希望** 我的所有数据变更都能被本地追踪记录  
**以便于** 在网络恢复后能够与云端同步

---

## 🔧 技术背景

### 同步架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     本地同步基础设施                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐    │
│  │ Repository  │───►│ Sync-Aware      │───►│  Sync Log    │    │
│  │  (CRUD)     │    │ Decorator       │    │  Service     │    │
│  └─────────────┘    └─────────────────┘    └──────┬───────┘    │
│                                                    │            │
│                                                    ▼            │
│                                            ┌──────────────┐    │
│                                            │   SQLite     │    │
│                                            │  sync_log    │    │
│                                            │   Table      │    │
│                                            └──────────────┘    │
│                                                                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐    │
│  │  Device     │    │   Sync State    │    │   Sync       │    │
│  │  Service    │    │   Machine       │    │   Config     │    │
│  └─────────────┘    └─────────────────┘    └──────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 变更追踪方式 | Repository 装饰器 | 透明拦截，无侵入 |
| 存储方式 | SQLite sync_log 表 | 与现有数据库一致 |
| 设备标识 | 机器 ID + UUID 回退 | 可靠且唯一 |
| 队列上限 | 1000 条 | 防止内存溢出 |

---

## 📋 验收标准

### AC-1: 同步数据库表创建

- [ ] `sync_log` 表存在且结构正确
- [ ] `devices` 表存在且结构正确  
- [ ] `sync_state` 表存在且有初始数据
- [ ] `conflict_records` 表存在
- [ ] 所有必要索引已创建

### AC-2: 设备注册与标识

- [ ] 首次启动生成唯一设备 ID
- [ ] 设备 ID 重启后保持不变
- [ ] 设备信息正确存储（平台、主机名）

### AC-3: 变更自动记录

- [ ] 创建操作自动记录到 sync_log
- [ ] 更新操作自动记录到 sync_log  
- [ ] 删除操作自动记录到 sync_log
- [ ] 记录包含完整 payload 和元数据

### AC-4: 待同步队列管理

- [ ] 可查询待同步变更数量
- [ ] 可批量标记为已同步
- [ ] 接近 1000 条时显示警告
- [ ] 达到 1000 条时阻止新变更

---

## 📝 Tasks/Subtasks

### Task 19.1: 创建同步数据库表 [2h]

- [ ] 19.1.1 创建 `sync_log` 表迁移脚本
- [ ] 19.1.2 创建 `devices` 表迁移脚本
- [ ] 19.1.3 创建 `sync_state` 表迁移脚本
- [ ] 19.1.4 创建 `conflict_records` 表迁移脚本
- [ ] 19.1.5 添加必要索引

**数据库结构:**

```sql
-- sync_log 表
CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,          -- goal/task/reminder/schedule/...
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,            -- create/update/delete
  payload TEXT NOT NULL,              -- JSON 格式变更内容
  timestamp INTEGER NOT NULL,         -- 变更时间戳
  device_id TEXT NOT NULL,            -- 来源设备
  synced INTEGER DEFAULT 0,           -- 是否已同步
  version INTEGER NOT NULL,           -- 实体版本号
  sync_error TEXT,                    -- 同步错误信息
  retry_count INTEGER DEFAULT 0,      -- 重试次数
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced);
CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(timestamp);

-- devices 表
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  device_name TEXT NOT NULL,
  platform TEXT NOT NULL,             -- windows/macos/linux
  app_version TEXT,
  last_sync_at INTEGER,
  created_at INTEGER NOT NULL
);

-- sync_state 表 (单例)
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_state TEXT DEFAULT 'idle',   -- idle/pending/syncing/conflict/error/offline
  pending_count INTEGER DEFAULT 0,
  last_sync_version INTEGER DEFAULT 0,
  last_sync_at INTEGER,
  last_error TEXT,
  updated_at INTEGER NOT NULL
);

-- conflict_records 表
CREATE TABLE IF NOT EXISTS conflict_records (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_data TEXT NOT NULL,
  server_data TEXT NOT NULL,
  conflicting_fields TEXT NOT NULL,   -- JSON 数组
  resolution TEXT,                    -- local/server/merge
  resolved_at INTEGER,
  created_at INTEGER NOT NULL
);
```

### Task 19.2: 实现设备注册服务 [2h]

- [ ] 19.2.1 创建 `DeviceService` 类
- [ ] 19.2.2 实现设备 ID 生成（node-machine-id + UUID 回退）
- [ ] 19.2.3 实现设备信息获取
- [ ] 19.2.4 集成到 DI 容器

**实现参考:**

```typescript
// services/device.service.ts
export class DeviceService {
  private deviceId: string;
  
  constructor(private db: Database) {
    this.deviceId = this.getOrCreateDeviceId();
  }
  
  private getOrCreateDeviceId(): string {
    try {
      // 优先使用机器唯一标识
      return machineIdSync();
    } catch {
      // 回退到存储的 UUID
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
  
  getDeviceId(): string { return this.deviceId; }
  
  getDeviceInfo(): DeviceInfo {
    return {
      id: this.deviceId,
      name: os.hostname(),
      platform: process.platform as Platform,
    };
  }
}
```

### Task 19.3: 实现同步日志服务 [4h]

- [ ] 19.3.1 创建 `SyncLogService` 类
- [ ] 19.3.2 实现 `logChange()` 方法 - 记录变更
- [ ] 19.3.3 实现 `getPendingChanges()` 方法 - 获取待同步
- [ ] 19.3.4 实现 `markAsSynced()` 方法 - 标记已同步
- [ ] 19.3.5 实现 `getPendingCount()` 方法 - 获取数量
- [ ] 19.3.6 实现队列溢出保护逻辑

**实现参考:**

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
  private readonly MAX_PENDING = 1000;
  private readonly WARNING_THRESHOLD = 800;
  
  logChange(/* ... */): void { /* ... */ }
  getPendingChanges(limit?: number): SyncLogEntry[] { /* ... */ }
  markAsSynced(ids: string[]): void { /* ... */ }
  getPendingCount(): number { /* ... */ }
}
```

### Task 19.4: 实现 Repository 装饰器 [4h]

- [ ] 19.4.1 创建 `createSyncAwareRepository` 工厂函数
- [ ] 19.4.2 使用 Proxy 拦截 create/update/delete 方法
- [ ] 19.4.3 自动调用 SyncLogService.logChange()
- [ ] 19.4.4 测试装饰器对现有功能无影响

**实现参考:**

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
      
      if (typeof original !== 'function') return original;
      
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

### Task 19.5: 编写单元测试 [3h]

- [ ] 19.5.1 DeviceService 测试
- [ ] 19.5.2 SyncLogService 测试
- [ ] 19.5.3 Repository 装饰器测试
- [ ] 19.5.4 队列溢出保护测试

### Task 19.6: 集成与文档 [2h]

- [ ] 19.6.1 更新 DI 容器配置
- [ ] 19.6.2 添加同步配置常量
- [ ] 19.6.3 更新架构文档

---

## 📐 Dev Notes

### 技术规范

1. **设备 ID 生成策略**
   - 优先使用 `node-machine-id` 获取机器唯一标识
   - 如果失败（如权限问题），回退到 UUID 并存储在 SQLite
   - 设备 ID 一旦生成永不改变

2. **同步日志格式**
   ```json
   {
     "id": "uuid-v4",
     "entityType": "goal",
     "entityId": "goal-uuid",
     "operation": "update",
     "payload": { "title": "New Title", "version": 5 },
     "timestamp": 1733580000000,
     "deviceId": "machine-id",
     "synced": false,
     "version": 5
   }
   ```

3. **队列溢出处理**
   - 800 条时显示任务栏警告通知
   - 1000 条时阻止新变更，显示错误提示
   - 建议用户手动同步或检查网络

### 依赖包

```json
{
  "node-machine-id": "^1.1.12",
  "uuid": "^9.0.0"
}
```

### 相关文件位置

```
apps/desktop/src/main/
├── database/
│   └── migrations/
│       └── 002_sync_tables.ts      # Task 19.1
├── services/
│   ├── device.service.ts           # Task 19.2
│   └── sync-log.service.ts         # Task 19.3
├── decorators/
│   └── sync-aware.decorator.ts     # Task 19.4
└── config/
    └── sync-constants.ts           # 同步配置常量
```

---

## 🧪 测试场景

### 场景 19.1: 数据库迁移验证

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

### 场景 19.2: 设备 ID 持久化

```
步骤：
  1. 首次启动应用，记录设备 ID
  2. 关闭应用
  3. 重新启动应用，获取设备 ID
  
预期结果：
  - 两次获取的设备 ID 相同
  - 设备 ID 格式为 UUID 或机器唯一标识
```

### 场景 19.3: 变更自动记录

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

### 场景 19.4: 队列溢出保护

```
前置条件：
  - MAX_PENDING_CHANGES = 1000
  - 当前待同步变更 = 990
  
步骤：
  1. 继续创建 10 个新目标
  2. 继续创建第 1001 个目标
  
预期结果：
  - 前 10 个目标创建成功
  - 在第 800 个变更时显示警告通知
  - 第 1001 个目标创建被阻止，显示错误提示
```

---

## 📁 File List

> 实现过程中创建/修改的文件列表

*开发过程中更新*

---

## 📝 Change Log

| 日期 | 变更 | 作者 |
|------|------|------|
| 2025-12-07 | Story 创建 | AI |

---

## 🤖 Dev Agent Record

### Debug Log

*开发过程中的调试记录*

### Completion Notes

*完成时的备注*
