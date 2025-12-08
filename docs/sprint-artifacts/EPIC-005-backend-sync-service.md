# EPIC-005: Backend Sync Service (后端同步服务)

## 📋 Epic 概述

**Epic ID**: EPIC-005  
**Epic Name**: Backend Multi-Device Sync Service  
**Epic Owner**: Backend Team  
**Created**: 2025-12-07  
**Completed**: 2025-12-08  
**Priority**: P3 (未来演进)  
**Status**: ✅ Completed  
**前置依赖**: 
- EPIC-002 (Desktop Application Development) ✅ Completed
- EPIC-004 (Offline Sync - Client Side) ✅ Completed
- 现有 API 服务基础设施

---

## 🎯 产品愿景

> **提供可靠、高效、可扩展的多设备数据同步后端服务，支持离线操作、冲突检测与解决。**

### 核心能力

| 能力 | 说明 | 技术实现 |
|------|------|---------|
| **变更追踪** | 记录所有数据变更历史 | Event Sourcing |
| **版本控制** | 乐观锁防止并发冲突 | 版本号递增 |
| **增量同步** | 只传输变更部分 | 游标分页 |
| **冲突检测** | 识别并发修改 | 字段级差异检测 |
| **设备管理** | 多设备注册与认证 | JWT + 设备 ID |
| **实时推送** | 通知其他设备有新变更 | WebSocket (可选) |

---

## 🏗️ 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        后端同步服务架构                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                     ┌────────────────────────────┐                     │
│    Clients          │      API Gateway           │                     │
│   ┌─────────┐       │  (Rate Limit, Auth)        │                     │
│   │Desktop A│──────►├────────────────────────────┤                     │
│   └─────────┘       │                            │                     │
│   ┌─────────┐       │  ┌──────────────────────┐  │                     │
│   │Desktop B│──────►│  │   Sync REST API      │  │                     │
│   └─────────┘       │  │   /sync/push         │  │                     │
│   ┌─────────┐       │  │   /sync/pull         │  │                     │
│   │   Web   │──────►│  │   /sync/devices      │  │                     │
│   └─────────┘       │  └──────────┬───────────┘  │                     │
│                     │             │              │                     │
│                     │  ┌──────────▼───────────┐  │                     │
│                     │  │   WebSocket Server   │◄─┼── Real-time Push    │
│                     │  │   (可选 Phase 2)     │  │                     │
│                     │  └──────────────────────┘  │                     │
│                     └────────────┬───────────────┘                     │
│                                  │                                      │
│     ┌────────────────────────────┼────────────────────────────┐        │
│     │                            │                            │        │
│     ▼                            ▼                            ▼        │
│ ┌─────────────┐          ┌─────────────┐          ┌─────────────┐     │
│ │   Sync      │          │  Conflict   │          │   Device    │     │
│ │   Service   │◄────────►│  Detector   │          │   Manager   │     │
│ │             │          │             │          │             │     │
│ └──────┬──────┘          └──────┬──────┘          └──────┬──────┘     │
│        │                        │                        │             │
│        └────────────────────────┼────────────────────────┘             │
│                                 │                                       │
│                    ┌────────────▼────────────┐                         │
│                    │     PostgreSQL          │                         │
│                    │  ┌─────────────────┐    │                         │
│                    │  │ sync_events     │    │  ← 事件溯源表           │
│                    │  │ entity_versions │    │  ← 实体版本表           │
│                    │  │ devices         │    │  ← 设备注册表           │
│                    │  │ sync_conflicts  │    │  ← 冲突记录表           │
│                    │  │ sync_cursors    │    │  ← 同步游标表           │
│                    │  └─────────────────┘    │                         │
│                    └─────────────────────────┘                         │
│                                                                         │
│                    ┌─────────────────────────┐                         │
│                    │       Redis             │                         │
│                    │  ├── 用户同步锁         │                         │
│                    │  ├── 设备在线状态       │                         │
│                    │  └── 速率限制           │                         │
│                    └─────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| 运行时 | Node.js / NestJS | 与现有 API 保持一致 |
| 数据库 | PostgreSQL | 现有基础设施 |
| 缓存 | Redis | 分布式锁、在线状态 |
| 消息队列 | Redis Pub/Sub | 实时通知 (可选 RabbitMQ) |
| API 文档 | OpenAPI 3.0 | Swagger |

---

## 📊 数据模型

### 1. 同步事件表 (sync_events)

```sql
-- 记录所有变更事件，作为同步的数据源 (Event Sourcing)
CREATE TABLE sync_events (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,          -- 事件唯一标识 (客户端生成)
    user_id UUID NOT NULL,                  -- 用户ID
    device_id UUID NOT NULL,                -- 来源设备
    entity_type VARCHAR(50) NOT NULL,       -- goal/task/reminder/schedule/...
    entity_id UUID NOT NULL,                -- 实体ID
    operation VARCHAR(20) NOT NULL,         -- create/update/delete
    payload JSONB NOT NULL,                 -- 变更内容 (差异或全量)
    base_version BIGINT NOT NULL,           -- 基于的版本号
    new_version BIGINT NOT NULL,            -- 新版本号
    client_timestamp BIGINT NOT NULL,       -- 客户端时间戳
    server_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_operation CHECK (operation IN ('create', 'update', 'delete'))
);

-- 索引
CREATE INDEX idx_sync_events_user_version ON sync_events(user_id, new_version);
CREATE INDEX idx_sync_events_entity ON sync_events(entity_type, entity_id);
CREATE INDEX idx_sync_events_device ON sync_events(device_id);
```

### 2. 实体版本表 (entity_versions)

```sql
-- 每个实体的当前状态 (物化视图，加速查询)
CREATE TABLE entity_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    current_version BIGINT NOT NULL DEFAULT 1,
    current_data JSONB NOT NULL,            -- 当前完整数据
    is_deleted BOOLEAN DEFAULT FALSE,
    last_modified_by UUID,                  -- 最后修改的设备
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX idx_entity_versions_user_type ON entity_versions(user_id, entity_type);
CREATE INDEX idx_entity_versions_modified ON entity_versions(last_modified_at);
```

### 3. 设备表 (devices)

```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL UNIQUE,         -- 客户端生成的设备唯一ID
    device_name VARCHAR(100) NOT NULL,
    platform VARCHAR(20) NOT NULL,          -- windows/macos/linux/web/ios/android
    app_version VARCHAR(20),
    last_sync_version BIGINT DEFAULT 0,     -- 该设备已同步到的版本
    last_sync_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    push_token TEXT,                        -- 推送通知 token (FCM/APNs)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devices_user ON devices(user_id);
```

### 4. 同步游标表 (sync_cursors)

```sql
-- 记录每个设备的同步进度
CREATE TABLE sync_cursors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    last_synced_event_id BIGINT NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (user_id, device_id)
);
```

### 5. 冲突记录表 (sync_conflicts)

```sql
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    local_event_id UUID NOT NULL,           -- 本地变更事件ID
    server_version BIGINT NOT NULL,         -- 服务端当前版本
    local_version JSONB NOT NULL,           -- 本地版本数据
    server_data JSONB NOT NULL,             -- 服务端版本数据
    conflicting_fields TEXT[] NOT NULL,     -- 冲突字段列表
    resolution_strategy VARCHAR(20),        -- local/remote/merge/manual
    resolved_data JSONB,                    -- 解决后的数据
    resolved_at TIMESTAMPTZ,
    resolved_by_device UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conflicts_user_unresolved ON sync_conflicts(user_id) 
    WHERE resolved_at IS NULL;
```

---

## ⚠️ 边界情况处理

### 1. 请求大小限制

| 限制项 | 阈值 | 处理方式 |
|--------|------|---------|
| 单个 Payload 大小 | 1 MB | 返回 413 错误 |
| 批量变更数量 | 100 条 | 超出部分忽略，返回警告 |
| 请求体总大小 | 5 MB | 返回 413 错误 |
| 单个字段值大小 | 64 KB | 返回 400 错误 |

```typescript
// Payload 大小验证
const LIMITS = {
  MAX_PAYLOAD_SIZE: 1024 * 1024,      // 1 MB
  MAX_BATCH_SIZE: 100,
  MAX_REQUEST_SIZE: 5 * 1024 * 1024,  // 5 MB
  MAX_FIELD_SIZE: 64 * 1024           // 64 KB
};

function validatePayloadSize(change: SyncChange): void {
  const payloadSize = JSON.stringify(change.payload).length;
  if (payloadSize > LIMITS.MAX_PAYLOAD_SIZE) {
    throw new PayloadTooLargeError(
      `Payload size ${payloadSize} exceeds limit ${LIMITS.MAX_PAYLOAD_SIZE}`
    );
  }
}
```

### 2. 设备数量限制

| 场景 | 限制 | 处理方式 |
|------|------|---------|
| 每用户最大设备数 | 10 | 拒绝新注册，提示删除旧设备 |
| 不活跃设备阈值 | 90 天 | 自动标记为非活跃 |
| WebSocket 连接数/用户 | 20 | 断开最旧连接 |

```typescript
// 设备数量检查
async function checkDeviceLimit(userId: string): Promise<void> {
  const activeDevices = await deviceRepo.count({
    userId,
    isActive: true
  });

  if (activeDevices >= MAX_DEVICES_PER_USER) {
    // 尝试清理不活跃设备
    const cleaned = await cleanInactiveDevices(userId);
    
    if (cleaned === 0) {
      throw new MaxDevicesReachedError(
        `User has ${activeDevices} active devices, limit is ${MAX_DEVICES_PER_USER}`
      );
    }
  }
}
```

### 3. 时钟偏移处理

```typescript
// 客户端时间戳偏移检测
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;  // 5分钟

function validateClientTimestamp(clientTimestamp: number): void {
  const serverTime = Date.now();
  const skew = Math.abs(serverTime - clientTimestamp);

  if (skew > MAX_CLOCK_SKEW_MS) {
    // 记录警告但不拒绝
    logger.warn('Client clock skew detected', {
      clientTime: clientTimestamp,
      serverTime,
      skew
    });
    
    // 使用服务端时间作为备用
    return serverTime;
  }

  return clientTimestamp;
}
```

### 4. 事件顺序保证

```typescript
// 处理乱序到达的事件
interface EventOrderingService {
  /**
   * 确保事件按客户端时间戳顺序处理
   * 使用缓冲区等待可能乱序的事件
   */
  async bufferAndProcess(change: SyncChange): Promise<void> {
    const buffer = await this.getEventBuffer(change.userId);
    
    // 添加到缓冲区
    buffer.add(change);
    
    // 等待 100ms 收集可能的乱序事件
    await sleep(100);
    
    // 按时间戳排序处理
    const orderedEvents = buffer.drainOrdered();
    for (const event of orderedEvents) {
      await this.processChange(event);
    }
  }
}
```

### 5. 网络中断处理

```typescript
// 超时与重试配置
const NETWORK_CONFIG = {
  REQUEST_TIMEOUT_MS: 30000,    // 30秒请求超时
  LOCK_TIMEOUT_MS: 5000,        // 5秒锁超时
  MAX_RETRIES: 3,               // 最大重试次数
  RETRY_BACKOFF_MS: 1000        // 重试退避时间
};

// 幂等性保证：通过 eventId 去重
async function ensureIdempotent(eventId: string): Promise<boolean> {
  const exists = await syncEventRepo.exists({ eventId });
  if (exists) {
    logger.info('Duplicate event detected, skipping', { eventId });
    return false;  // 已处理，跳过
  }
  return true;  // 需要处理
}
```

### 6. 超大历史数据同步

```typescript
// 新设备首次同步优化
async function initialSync(userId: string, deviceId: string): Promise<InitialSyncResult> {
  // 检查是否是首次同步
  const cursor = await syncCursorRepo.findOne({ deviceId });
  
  if (!cursor || cursor.lastSyncedEventId === 0) {
    // 首次同步：使用快照而非事件回放
    const snapshot = await this.createUserSnapshot(userId);
    
    return {
      type: 'snapshot',
      data: snapshot,
      version: snapshot.version
    };
  }

  // 增量同步
  return {
    type: 'incremental',
    data: await this.pullChanges(userId, deviceId, cursor.lastSyncedEventId)
  };
}

// 创建用户数据快照
async function createUserSnapshot(userId: string): Promise<Snapshot> {
  const entities = await entityVersionRepo.find({
    where: { userId, isDeleted: false }
  });

  return {
    version: await this.getCurrentVersion(userId),
    entities: entities.map(e => ({
      entityType: e.entityType,
      entityId: e.entityId,
      data: e.currentData,
      version: e.currentVersion
    })),
    createdAt: new Date()
  };
}
```

### 7. 实体删除后重建

```typescript
// 处理删除后重建的情况
async function handleCreateAfterDelete(change: SyncChange): Promise<ProcessResult> {
  const entity = await entityVersionRepo.findOne({
    entityType: change.entityType,
    entityId: change.entityId
  });

  if (entity?.isDeleted) {
    // 实体已删除，这是一个重建操作
    if (change.operation === 'create') {
      // 恢复实体
      await entityVersionRepo.update(
        { id: entity.id },
        {
          isDeleted: false,
          currentData: change.payload,
          currentVersion: await this.getNextVersion(change.userId)
        }
      );
      return { status: 'recreated' };
    }
  }

  return this.processChange(change);
}
```

### 8. 并发同步请求

```typescript
// 同一设备的并发请求处理
const deviceLocks = new Map<string, Promise<void>>();

async function withDeviceLock<T>(
  deviceId: string, 
  fn: () => Promise<T>
): Promise<T> {
  // 等待之前的请求完成
  const previousLock = deviceLocks.get(deviceId);
  if (previousLock) {
    await previousLock;
  }

  // 创建新锁
  let resolve: () => void;
  const lock = new Promise<void>(r => resolve = r);
  deviceLocks.set(deviceId, lock);

  try {
    return await fn();
  } finally {
    resolve!();
    deviceLocks.delete(deviceId);
  }
}
```

---

## 📊 Story 分解

### STORY-023: 同步数据库设计与迁移

**预估**: 2 天 | **优先级**: P3

#### 目标
创建同步所需的数据库表和索引

#### Tasks

- [ ] **Task 23.1**: 创建数据库迁移脚本
  - sync_events 表
  - entity_versions 表
  - devices 表
  - sync_cursors 表
  - sync_conflicts 表

- [ ] **Task 23.2**: 创建索引优化
  - 复合索引
  - 部分索引
  - JSONB GIN 索引

- [ ] **Task 23.3**: 创建数据库函数
  - 版本号生成函数
  - 冲突检测函数

```sql
-- 生成下一个版本号 (用户级别递增)
CREATE OR REPLACE FUNCTION next_sync_version(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_next_version BIGINT;
BEGIN
    SELECT COALESCE(MAX(new_version), 0) + 1 
    INTO v_next_version
    FROM sync_events 
    WHERE user_id = p_user_id;
    
    RETURN v_next_version;
END;
$$ LANGUAGE plpgsql;
```

#### 验收标准
- [ ] 所有迁移脚本可重复执行
- [ ] 索引覆盖主要查询场景
- [ ] 支持回滚

#### 验收场景与测试用例

##### 场景 23.1: 迁移脚本幂等性
```typescript
describe('STORY-023: Database Migration', () => {
  describe('Migration Idempotency', () => {
    it('should run migration multiple times without error', async () => {
      // Given: 已执行过迁移的数据库
      await runMigrations();
      
      // When: 再次执行迁移
      const result = await runMigrations();
      
      // Then: 不应抛出错误
      expect(result.success).toBe(true);
      expect(result.skipped).toBeGreaterThan(0);
    });

    it('should create all required tables', async () => {
      // When: 查询数据库表
      const tables = await db.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      // Then: 包含所有同步相关表
      const tableNames = tables.rows.map(r => r.table_name);
      expect(tableNames).toContain('sync_events');
      expect(tableNames).toContain('entity_versions');
      expect(tableNames).toContain('devices');
      expect(tableNames).toContain('sync_cursors');
      expect(tableNames).toContain('sync_conflicts');
    });

    it('should create required indexes', async () => {
      // When: 查询索引
      const indexes = await db.query(`
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'sync_events'
      `);

      // Then: 包含关键索引
      const indexNames = indexes.rows.map(r => r.indexname);
      expect(indexNames).toContain('idx_sync_events_user_version');
      expect(indexNames).toContain('idx_sync_events_entity');
    });
  });
});
```

##### 场景 23.2: 版本号生成函数
```typescript
describe('Version Number Generation', () => {
  it('should generate sequential version numbers', async () => {
    const userId = 'user-1';
    
    // When: 生成多个版本号
    const v1 = await db.query('SELECT next_sync_version($1)', [userId]);
    const v2 = await db.query('SELECT next_sync_version($1)', [userId]);
    const v3 = await db.query('SELECT next_sync_version($1)', [userId]);

    // Then: 版本号递增
    expect(v1.rows[0].next_sync_version).toBe(1);
    expect(v2.rows[0].next_sync_version).toBe(2);
    expect(v3.rows[0].next_sync_version).toBe(3);
  });

  it('should isolate version numbers between users', async () => {
    // Given: 两个不同用户
    const userA = 'user-a';
    const userB = 'user-b';

    // When: 各自生成版本号
    const vA1 = await db.query('SELECT next_sync_version($1)', [userA]);
    const vB1 = await db.query('SELECT next_sync_version($1)', [userB]);

    // Then: 各自独立从1开始
    expect(vA1.rows[0].next_sync_version).toBe(1);
    expect(vB1.rows[0].next_sync_version).toBe(1);
  });
});
```

##### 场景 23.3: 数据库回滚
```bash
# 测试回滚脚本
# Given: 已执行迁移
pnpm nx run api:migrate:up

# When: 执行回滚
pnpm nx run api:migrate:down

# Then: 表应被删除
psql -c "SELECT COUNT(*) FROM sync_events" # 应返回错误：表不存在
```

---

### STORY-024: 设备管理 API

**预估**: 2-3 天 | **优先级**: P3

#### 目标
实现设备注册、列表、更新、删除功能

#### API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/sync/devices` | POST | 注册设备 |
| `/sync/devices` | GET | 获取设备列表 |
| `/sync/devices/:id` | PUT | 更新设备信息 |
| `/sync/devices/:id` | DELETE | 远程登出设备 |
| `/sync/devices/:id/heartbeat` | POST | 心跳更新 |

#### Tasks

- [ ] **Task 24.1**: 设备注册接口
  - 验证设备ID唯一性
  - 记录设备信息
  - 返回设备令牌

```typescript
// POST /api/v1/sync/devices
@Post('devices')
@UseGuards(JwtAuthGuard)
async registerDevice(
  @CurrentUser() user: User,
  @Body() dto: RegisterDeviceDto
): Promise<DeviceResponse> {
  return this.deviceService.register(user.id, dto);
}

interface RegisterDeviceDto {
  deviceId: string;      // 客户端生成的 UUID
  deviceName: string;    // 例如 "MacBook Pro"
  platform: Platform;    // windows/macos/linux/web
  appVersion: string;    // 例如 "1.0.0"
  pushToken?: string;    // 推送通知 token
}
```

- [ ] **Task 24.2**: 设备列表接口
  - 返回用户所有设备
  - 标识当前设备
  - 显示在线状态

- [ ] **Task 24.3**: 设备更新接口
  - 更新设备名称
  - 更新推送 token

- [ ] **Task 24.4**: 远程登出接口
  - 标记设备为非活跃
  - 清除同步游标
  - 可选：发送推送通知

- [ ] **Task 24.5**: 心跳接口
  - 更新 last_seen_at
  - 更新 Redis 在线状态

#### 验收标准
- [ ] 设备注册成功
- [ ] 可查看所有设备
- [ ] 可远程登出设备
- [ ] 心跳正常更新

#### 验收场景与测试用例

##### 场景 24.1: 设备注册
```typescript
describe('STORY-024: Device Management', () => {
  describe('POST /sync/devices - Register Device', () => {
    it('should register new device successfully', async () => {
      // Given: 已认证用户
      const token = await getAuthToken('user@example.com');
      
      // When: 注册新设备
      const response = await request(app)
        .post('/api/v1/sync/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: 'device-uuid-1',
          deviceName: 'MacBook Pro',
          platform: 'macos',
          appVersion: '1.0.0'
        });

      // Then: 返回设备信息
      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        deviceId: 'device-uuid-1',
        deviceName: 'MacBook Pro',
        platform: 'macos',
        isActive: true
      });
    });

    it('should reject duplicate deviceId', async () => {
      // Given: 已注册设备
      await registerDevice('device-uuid-1');

      // When: 重复注册
      const response = await request(app)
        .post('/api/v1/sync/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: 'device-uuid-1', ... });

      // Then: 返回冲突错误
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DEVICE_ALREADY_REGISTERED');
    });

    it('should limit max devices per user', async () => {
      // Given: 已注册10个设备（达到上限）
      for (let i = 0; i < 10; i++) {
        await registerDevice(`device-${i}`);
      }

      // When: 注册第11个设备
      const response = await registerDevice('device-11');

      // Then: 返回设备数量上限错误
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MAX_DEVICES_REACHED');
    });
  });

  describe('GET /sync/devices - List Devices', () => {
    it('should return all user devices', async () => {
      // Given: 用户有3个设备
      await registerDevice('device-1');
      await registerDevice('device-2');
      await registerDevice('device-3');

      // When: 获取设备列表
      const response = await request(app)
        .get('/api/v1/sync/devices')
        .set('Authorization', `Bearer ${token}`);

      // Then: 返回3个设备
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });

    it('should indicate online status', async () => {
      // Given: device-1 在线, device-2 离线
      await redis.sadd('online:user-id', 'device-1');

      // When: 获取设备列表
      const response = await request(app)
        .get('/api/v1/sync/devices')
        .set('Authorization', `Bearer ${token}`);

      // Then: 正确标识在线状态
      const device1 = response.body.data.find(d => d.deviceId === 'device-1');
      const device2 = response.body.data.find(d => d.deviceId === 'device-2');
      expect(device1.isOnline).toBe(true);
      expect(device2.isOnline).toBe(false);
    });
  });

  describe('DELETE /sync/devices/:id - Remote Logout', () => {
    it('should deactivate device', async () => {
      // Given: 已注册设备
      const device = await registerDevice('device-1');

      // When: 远程登出
      const response = await request(app)
        .delete(`/api/v1/sync/devices/${device.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Then: 设备被标记为非活跃
      expect(response.status).toBe(200);
      const updatedDevice = await deviceRepo.findById(device.id);
      expect(updatedDevice.isActive).toBe(false);
    });

    it('should clear sync cursor on logout', async () => {
      // Given: 设备有同步游标
      await syncCursorRepo.save({ deviceId: 'device-1', lastSyncedEventId: 100 });

      // When: 远程登出
      await request(app)
        .delete(`/api/v1/sync/devices/${device.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Then: 同步游标被清除
      const cursor = await syncCursorRepo.findByDeviceId('device-1');
      expect(cursor).toBeNull();
    });
  });

  describe('POST /sync/devices/:id/heartbeat', () => {
    it('should update last_seen_at', async () => {
      // Given: 设备注册时间为1小时前
      const device = await registerDevice('device-1');
      await db.query(
        'UPDATE devices SET last_seen_at = NOW() - INTERVAL \'1 hour\' WHERE id = $1',
        [device.id]
      );

      // When: 发送心跳
      await request(app)
        .post(`/api/v1/sync/devices/${device.id}/heartbeat`)
        .set('Authorization', `Bearer ${token}`);

      // Then: last_seen_at 更新为当前时间
      const updated = await deviceRepo.findById(device.id);
      const diff = Date.now() - new Date(updated.lastSeenAt).getTime();
      expect(diff).toBeLessThan(5000); // 5秒内
    });

    it('should update Redis online status', async () => {
      // When: 发送心跳
      await request(app)
        .post(`/api/v1/sync/devices/${device.id}/heartbeat`)
        .set('Authorization', `Bearer ${token}`);

      // Then: Redis 记录在线状态
      const isOnline = await redis.sismember('online:user-id', 'device-1');
      expect(isOnline).toBe(1);
    });
  });
});
```

##### 场景 24.2: 设备数量限制
```typescript
// 常量定义
const MAX_DEVICES_PER_USER = 10;
const DEVICE_INACTIVE_THRESHOLD_DAYS = 90;

// 自动清理不活跃设备
async function cleanupInactiveDevices(userId: string): Promise<number> {
  const result = await db.query(`
    UPDATE devices 
    SET is_active = FALSE 
    WHERE user_id = $1 
      AND last_seen_at < NOW() - INTERVAL '${DEVICE_INACTIVE_THRESHOLD_DAYS} days'
      AND is_active = TRUE
    RETURNING id
  `, [userId]);
  
  return result.rowCount;
}
```

---

### STORY-025: Push API - 推送本地变更

> **[2025-12-07 评审决策]** 本 Story 拆分为 3 个子 Story，便于并行开发和增量交付

**原预估**: 4-5 天 → **拆分后**: 025a (1天) + 025b (2天) + 025c (1天)  
**优先级**: P3

#### 子 Story 拆分

| Sub-Story | 名称 | 预估 | 依赖 |
|-----------|------|------|------|
| **STORY-025a** | 同步锁机制 | 1 天 | 无 |
| **STORY-025b** | 变更处理 + 冲突检测 | 2 天 | 025a |
| **STORY-025c** | 事务与错误处理 | 1 天 | 025b |

---

#### STORY-025a: 同步锁机制 (1天)

**目标**: 实现分布式锁，防止并发推送

**Tasks**:
- [ ] Redis Redlock 实现
- [ ] [评审新增] 数据库降级锁
- [ ] 锁超时处理
- [ ] 单元测试

**验收标准**:
- [ ] 同用户并发请求被正确阻塞
- [ ] Redis 不可用时自动降级
- [ ] 锁超时后自动释放

---

#### STORY-025b: 变更处理 + 冲突检测 (2天)

**目标**: 实现变更处理和冲突检测核心逻辑

**Tasks**:
- [ ] 请求格式验证
- [ ] 版本冲突检测
- [ ] 字段级差异分析
- [ ] 自动合并非冲突字段
- [ ] 写入 sync_events 表
- [ ] 更新 entity_versions 表

**验收标准**:
- [ ] 正确检测版本冲突
- [ ] 非冲突字段可自动合并
- [ ] 冲突正确记录到数据库

---

#### STORY-025c: 事务与错误处理 (1天)

**目标**: 确保数据一致性和优雅的错误处理

**Tasks**:
- [ ] 数据库事务封装
- [ ] 部分成功处理策略
- [ ] 错误响应标准化
- [ ] 幂等性保证 (eventId 去重)

**验收标准**:
- [ ] 事务失败时完全回滚
- [ ] 重复 eventId 幂等处理
- [ ] 错误响应符合 API 规范

---

#### 原 Story 目标
实现客户端推送变更到服务端的完整流程

#### API 端点

```typescript
// POST /api/v1/sync/push
interface SyncPushRequest {
  deviceId: string;
  changes: SyncChange[];
}

interface SyncChange {
  eventId: string;           // 客户端生成的事件UUID
  entityType: EntityType;    // goal/task/reminder/...
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  baseVersion: number;       // 客户端认为的当前版本
  clientTimestamp: number;   // 客户端时间戳
}

interface SyncPushResponse {
  accepted: string[];        // 已接受的事件ID列表
  conflicts: ConflictInfo[]; // 检测到的冲突
  newVersion: number;        // 服务端当前最新版本
}
```

#### Tasks

- [ ] **Task 25.1**: 同步锁机制
  - 使用 Redis 分布式锁
  - 防止同一用户并发推送
  - **[评审新增] Redis 降级策略**

```typescript
/**
 * 同步锁服务
 * [2025-12-07 评审新增] 添加 Redis 降级策略
 */
@Injectable()
export class SyncLockService {
  private readonly LOCK_TTL = 5000;  // 5秒

  async acquireSyncLock(userId: string): Promise<Lock> {
    try {
      // 优先使用 Redis 分布式锁
      const lock = await this.redlock.acquire(
        [`sync:lock:${userId}`],
        this.LOCK_TTL
      );
      return { type: 'redis', lock };
    } catch (error) {
      if (this.isRedisUnavailable(error)) {
        // [评审新增] Redis 不可用时降级到数据库行锁
        this.logger.warn('Redis unavailable, falling back to DB lock', { userId });
        return await this.fallbackToDbLock(userId);
      }
      throw error;
    }
  }

  /**
   * [评审新增] 数据库行锁降级方案
   */
  private async fallbackToDbLock(userId: string): Promise<Lock> {
    const result = await this.db.query(`
      INSERT INTO sync_locks (user_id, acquired_at, expires_at)
      VALUES ($1, NOW(), NOW() + INTERVAL '${this.LOCK_TTL}ms')
      ON CONFLICT (user_id) DO UPDATE
      SET acquired_at = NOW(), expires_at = NOW() + INTERVAL '${this.LOCK_TTL}ms'
      WHERE sync_locks.expires_at < NOW()
      RETURNING id
    `, [userId]);

    if (result.rowCount === 0) {
      throw new LockAcquisitionError('Failed to acquire DB lock');
    }

    return { 
      type: 'database', 
      lockId: result.rows[0].id,
      release: () => this.releaseDbLock(userId)
    };
  }

  private async releaseDbLock(userId: string): Promise<void> {
    await this.db.query('DELETE FROM sync_locks WHERE user_id = $1', [userId]);
  }

  private isRedisUnavailable(error: Error): boolean {
    return error.name === 'ConnectionError' || 
           error.message.includes('ECONNREFUSED') ||
           error.message.includes('ETIMEDOUT');
  }
}

-- [评审新增] 降级锁表
CREATE TABLE sync_locks (
    user_id UUID PRIMARY KEY,
    acquired_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sync_locks_expires ON sync_locks(expires_at);
```

- [ ] **Task 25.2**: 变更处理流程
  - 验证请求格式
  - 遍历每个变更
  - 检查版本冲突
  - 写入事件表

```typescript
async processChange(
  userId: string,
  deviceId: string,
  change: SyncChange
): Promise<ProcessResult> {
  // 1. 获取当前实体状态
  const entity = await this.entityVersionRepo.findOne({
    userId,
    entityType: change.entityType,
    entityId: change.entityId,
  });

  // 2. 检查版本冲突
  if (entity && entity.currentVersion !== change.baseVersion) {
    const conflict = this.conflictDetector.detect(change, entity);
    if (conflict) {
      await this.conflictRepo.save(conflict);
      return { status: 'conflict', conflict };
    }
  }

  // 3. 生成新版本号
  const newVersion = await this.getNextVersion(userId);

  // 4. 写入事件
  await this.syncEventRepo.save({
    eventId: change.eventId,
    userId,
    deviceId,
    entityType: change.entityType,
    entityId: change.entityId,
    operation: change.operation,
    payload: change.payload,
    baseVersion: change.baseVersion,
    newVersion,
    clientTimestamp: change.clientTimestamp,
  });

  // 5. 更新实体版本
  await this.updateEntityVersion(userId, change, newVersion);

  return { status: 'accepted', version: newVersion };
}
```

- [ ] **Task 25.3**: 冲突检测器
  - 版本号比较
  - 字段级差异检测
  - 自动合并判断

```typescript
class ConflictDetector {
  detect(change: SyncChange, entity: EntityVersion): ConflictInfo | null {
    const conflictingFields = this.findConflictingFields(
      change.payload,
      entity.currentData
    );

    if (conflictingFields.length === 0) {
      return null; // 可自动合并
    }

    return {
      entityType: change.entityType,
      entityId: change.entityId,
      localEventId: change.eventId,
      conflictingFields,
      localVersion: change.payload,
      serverVersion: entity.currentData,
    };
  }

  private findConflictingFields(
    local: Record<string, unknown>,
    server: Record<string, unknown>
  ): string[] {
    const conflicts: string[] = [];
    const ignoredFields = ['id', 'version', 'updatedAt', 'createdAt'];

    for (const [field, localValue] of Object.entries(local)) {
      if (ignoredFields.includes(field)) continue;
      
      const serverValue = server[field];
      if (!isEqual(localValue, serverValue)) {
        conflicts.push(field);
      }
    }

    return conflicts;
  }
}
```

- [ ] **Task 25.4**: 实体版本更新
  - 创建/更新 entity_versions
  - 处理软删除

- [ ] **Task 25.5**: 事务与错误处理
  - 数据库事务
  - 部分成功处理
  - 错误响应

#### 验收标准
- [ ] 成功推送变更
- [ ] 正确检测版本冲突
- [ ] 冲突记录到数据库
- [ ] 并发推送不会丢失数据

#### 验收场景与测试用例

##### 场景 25.1: 成功推送变更
```typescript
describe('STORY-025: Push API', () => {
  describe('POST /sync/push - Basic Push', () => {
    it('should accept valid create operation', async () => {
      // Given: 新建目标数据
      const change: SyncChange = {
        eventId: 'event-uuid-1',
        entityType: 'goal',
        entityId: 'goal-uuid-1',
        operation: 'create',
        payload: {
          title: '学习 TypeScript',
          status: 'active',
          priority: 1
        },
        baseVersion: 0,
        clientTimestamp: Date.now()
      };

      // When: 推送变更
      const response = await request(app)
        .post('/api/v1/sync/push')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Device-ID', 'device-1')
        .send({ deviceId: 'device-1', changes: [change] });

      // Then: 变更被接受
      expect(response.status).toBe(200);
      expect(response.body.data.accepted).toContain('event-uuid-1');
      expect(response.body.data.conflicts).toHaveLength(0);
      expect(response.body.data.newVersion).toBe(1);
    });

    it('should accept valid update operation', async () => {
      // Given: 已存在的目标
      await createEntity('goal', 'goal-1', { title: 'Old Title', version: 1 });

      // When: 推送更新
      const response = await pushChange({
        eventId: 'event-2',
        entityType: 'goal',
        entityId: 'goal-1',
        operation: 'update',
        payload: { title: 'New Title' },
        baseVersion: 1,
        clientTimestamp: Date.now()
      });

      // Then: 更新成功
      expect(response.body.data.accepted).toContain('event-2');
      
      // And: 实体版本更新
      const entity = await entityVersionRepo.findOne({ entityId: 'goal-1' });
      expect(entity.currentVersion).toBe(2);
      expect(entity.currentData.title).toBe('New Title');
    });

    it('should accept valid delete operation', async () => {
      // Given: 已存在的目标
      await createEntity('goal', 'goal-1', { title: 'To Delete', version: 1 });

      // When: 推送删除
      const response = await pushChange({
        eventId: 'event-3',
        entityType: 'goal',
        entityId: 'goal-1',
        operation: 'delete',
        payload: {},
        baseVersion: 1,
        clientTimestamp: Date.now()
      });

      // Then: 删除成功
      expect(response.body.data.accepted).toContain('event-3');
      
      // And: 实体标记为已删除
      const entity = await entityVersionRepo.findOne({ entityId: 'goal-1' });
      expect(entity.isDeleted).toBe(true);
    });

    it('should accept batch changes', async () => {
      // Given: 多个变更
      const changes = [
        { eventId: 'e1', entityType: 'goal', entityId: 'g1', operation: 'create', ... },
        { eventId: 'e2', entityType: 'task', entityId: 't1', operation: 'create', ... },
        { eventId: 'e3', entityType: 'reminder', entityId: 'r1', operation: 'create', ... }
      ];

      // When: 批量推送
      const response = await request(app)
        .post('/api/v1/sync/push')
        .send({ deviceId: 'device-1', changes });

      // Then: 所有变更被接受，版本号递增
      expect(response.body.data.accepted).toHaveLength(3);
      expect(response.body.data.newVersion).toBe(3);
    });
  });
});
```

##### 场景 25.2: 版本冲突检测
```typescript
describe('Version Conflict Detection', () => {
  it('should detect conflict when baseVersion mismatches', async () => {
    // Given: 服务端实体版本为 5
    await createEntity('goal', 'goal-1', { 
      title: 'Server Title', 
      version: 5 
    });

    // When: 客户端基于版本3推送
    const response = await pushChange({
      entityId: 'goal-1',
      operation: 'update',
      payload: { title: 'Client Title' },
      baseVersion: 3  // 落后于服务端
    });

    // Then: 检测到冲突
    expect(response.body.data.conflicts).toHaveLength(1);
    expect(response.body.data.conflicts[0]).toMatchObject({
      entityId: 'goal-1',
      conflictingFields: ['title'],
      localVersion: { title: 'Client Title' },
      serverVersion: { title: 'Server Title' }
    });
  });

  it('should auto-merge non-conflicting fields', async () => {
    // Given: 服务端修改了 title
    await createEntity('goal', 'goal-1', { 
      title: 'Server Title',
      description: 'Original Desc',
      version: 2 
    });

    // When: 客户端修改 description（基于版本1）
    const response = await pushChange({
      entityId: 'goal-1',
      operation: 'update',
      payload: { description: 'New Desc' },  // 不同字段
      baseVersion: 1
    });

    // Then: 自动合并成功，无冲突
    expect(response.body.data.accepted).toHaveLength(1);
    expect(response.body.data.conflicts).toHaveLength(0);

    // And: 两个字段都保留
    const entity = await entityVersionRepo.findOne({ entityId: 'goal-1' });
    expect(entity.currentData.title).toBe('Server Title');
    expect(entity.currentData.description).toBe('New Desc');
  });

  it('should record conflict in database', async () => {
    // Given: 产生冲突
    await createConflict('goal-1', 'title');

    // Then: 冲突记录在数据库
    const conflict = await conflictRepo.findOne({ 
      entityId: 'goal-1',
      resolvedAt: null  // 未解决
    });
    expect(conflict).toBeDefined();
    expect(conflict.conflictingFields).toContain('title');
  });
});
```

##### 场景 25.3: 并发推送处理
```typescript
describe('Concurrent Push Handling', () => {
  it('should prevent concurrent push with distributed lock', async () => {
    // Given: 两个设备同时推送
    const pushPromiseA = pushChange({ eventId: 'e1', ... }, 'device-a');
    const pushPromiseB = pushChange({ eventId: 'e2', ... }, 'device-b');

    // When: 并发执行
    const [resultA, resultB] = await Promise.allSettled([
      pushPromiseA,
      pushPromiseB
    ]);

    // Then: 一个成功，一个等待后成功（或返回锁超时）
    const successCount = [resultA, resultB]
      .filter(r => r.status === 'fulfilled' && r.value.status === 200)
      .length;
    expect(successCount).toBeGreaterThanOrEqual(1);
  });

  it('should maintain data consistency under concurrent operations', async () => {
    // Given: 初始版本为1
    await createEntity('goal', 'goal-1', { counter: 0, version: 1 });

    // When: 10个并发更新
    const promises = Array.from({ length: 10 }, (_, i) =>
      pushChange({
        entityId: 'goal-1',
        operation: 'update',
        payload: { counter: i + 1 },
        baseVersion: 1
      })
    );
    await Promise.allSettled(promises);

    // Then: 最终版本号正确（1个成功 + 9个冲突）
    const entity = await entityVersionRepo.findOne({ entityId: 'goal-1' });
    expect(entity.currentVersion).toBe(2); // 只有1个成功更新

    // And: 冲突都被记录
    const conflicts = await conflictRepo.find({ entityId: 'goal-1' });
    expect(conflicts).toHaveLength(9);
  });
});
```

##### 场景 25.4: 边界情况处理
```typescript
describe('Push Edge Cases', () => {
  it('should reject payload exceeding size limit', async () => {
    // Given: 超大 payload（>1MB）
    const largePayload = { data: 'x'.repeat(1024 * 1024 + 1) };

    // When: 尝试推送
    const response = await pushChange({
      entityId: 'goal-1',
      payload: largePayload
    });

    // Then: 返回 413 错误
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('SYNC_PAYLOAD_TOO_LARGE');
  });

  it('should handle empty changes array', async () => {
    // When: 推送空数组
    const response = await request(app)
      .post('/api/v1/sync/push')
      .send({ deviceId: 'device-1', changes: [] });

    // Then: 返回成功但无变更
    expect(response.status).toBe(200);
    expect(response.body.data.accepted).toHaveLength(0);
  });

  it('should reject unregistered device', async () => {
    // Given: 未注册的设备ID

    // When: 尝试推送
    const response = await request(app)
      .post('/api/v1/sync/push')
      .set('X-Device-ID', 'unknown-device')
      .send({ deviceId: 'unknown-device', changes: [change] });

    // Then: 返回 404
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SYNC_DEVICE_NOT_FOUND');
  });

  it('should deduplicate by eventId', async () => {
    // Given: 已接受的事件
    await pushChange({ eventId: 'event-1', ... });

    // When: 重复推送同一事件ID
    const response = await pushChange({ eventId: 'event-1', ... });

    // Then: 幂等处理，返回成功但不重复处理
    expect(response.status).toBe(200);
    expect(response.body.data.accepted).toContain('event-1');
    
    // And: 数据库只有一条记录
    const events = await syncEventRepo.find({ eventId: 'event-1' });
    expect(events).toHaveLength(1);
  });
});
```

---

### STORY-026: Pull API - 拉取远程变更

**预估**: 3-4 天 | **优先级**: P3

#### 目标
实现客户端从服务端拉取变更的完整流程

#### API 端点

```typescript
// POST /api/v1/sync/pull
interface SyncPullRequest {
  deviceId: string;
  lastSyncVersion: number;   // 客户端已同步到的版本
  entityTypes?: EntityType[]; // 可选：只拉取指定类型
  limit?: number;            // 每次拉取数量，默认100，最大500
}

interface SyncPullResponse {
  changes: RemoteChange[];
  currentVersion: number;    // 服务端当前最新版本
  hasMore: boolean;          // 是否还有更多变更
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
```

#### Tasks

- [ ] **Task 26.1**: 增量查询逻辑
  - 基于版本号查询
  - 排除当前设备的变更
  - 分页返回

```typescript
async pullChanges(
  userId: string,
  deviceId: string,
  lastSyncVersion: number,
  limit: number = 100
): Promise<SyncPullResponse> {
  // 查询自上次同步后的所有变更
  const events = await this.syncEventRepo.find({
    where: {
      userId,
      newVersion: MoreThan(lastSyncVersion),
      deviceId: Not(deviceId), // 排除自己的变更
    },
    order: { newVersion: 'ASC' },
    take: limit + 1, // 多取一条判断 hasMore
  });

  const hasMore = events.length > limit;
  const changes = events.slice(0, limit).map(this.toRemoteChange);

  // 获取当前最新版本
  const currentVersion = await this.getCurrentVersion(userId);

  // 更新同步游标
  if (changes.length > 0) {
    await this.updateSyncCursor(
      userId,
      deviceId,
      changes[changes.length - 1].version
    );
  }

  return { changes, currentVersion, hasMore };
}
```

- [ ] **Task 26.2**: 实体类型过滤
  - 支持只拉取指定类型
  - 优化查询性能

- [ ] **Task 26.3**: 同步游标更新
  - 记录拉取进度
  - 断点续传支持

- [ ] **Task 26.4**: 批量返回优化
  - 压缩响应 (gzip)
  - 字段选择

#### 验收标准
- [ ] 正确返回增量变更
- [ ] 分页拉取正常
- [ ] 断点续传正常
- [ ] 性能满足要求 (<500ms)

#### 验收场景与测试用例

##### 场景 26.1: 增量拉取
```typescript
describe('STORY-026: Pull API', () => {
  describe('POST /sync/pull - Incremental Pull', () => {
    it('should return changes since last sync version', async () => {
      // Given: 服务端有版本 1-10 的变更
      for (let i = 1; i <= 10; i++) {
        await createSyncEvent({ version: i, entityId: `goal-${i}` });
      }

      // When: 客户端从版本5开始拉取
      const response = await request(app)
        .post('/api/v1/sync/pull')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: 'device-1', lastSyncVersion: 5 });

      // Then: 返回版本 6-10 的变更
      expect(response.status).toBe(200);
      expect(response.body.data.changes).toHaveLength(5);
      expect(response.body.data.changes[0].version).toBe(6);
      expect(response.body.data.changes[4].version).toBe(10);
      expect(response.body.data.currentVersion).toBe(10);
      expect(response.body.data.hasMore).toBe(false);
    });

    it('should return empty when already synced', async () => {
      // Given: 服务端最新版本为 10
      await createSyncEvent({ version: 10 });

      // When: 客户端已同步到版本10
      const response = await request(app)
        .post('/api/v1/sync/pull')
        .send({ deviceId: 'device-1', lastSyncVersion: 10 });

      // Then: 返回空数组
      expect(response.body.data.changes).toHaveLength(0);
      expect(response.body.data.hasMore).toBe(false);
    });

    it('should exclude changes from same device', async () => {
      // Given: device-1 推送的变更
      await createSyncEvent({ version: 1, sourceDevice: 'device-1' });
      // And: device-2 推送的变更
      await createSyncEvent({ version: 2, sourceDevice: 'device-2' });

      // When: device-1 拉取
      const response = await request(app)
        .post('/api/v1/sync/pull')
        .send({ deviceId: 'device-1', lastSyncVersion: 0 });

      // Then: 只返回 device-2 的变更
      expect(response.body.data.changes).toHaveLength(1);
      expect(response.body.data.changes[0].sourceDeviceId).toBe('device-2');
    });
  });
});
```

##### 场景 26.2: 分页拉取
```typescript
describe('Pagination', () => {
  it('should respect limit parameter', async () => {
    // Given: 200个变更
    for (let i = 1; i <= 200; i++) {
      await createSyncEvent({ version: i });
    }

    // When: 限制每次50条
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .send({ deviceId: 'device-1', lastSyncVersion: 0, limit: 50 });

    // Then: 返回50条，标记有更多
    expect(response.body.data.changes).toHaveLength(50);
    expect(response.body.data.hasMore).toBe(true);
  });

  it('should allow paginated iteration', async () => {
    // Given: 250个变更
    for (let i = 1; i <= 250; i++) {
      await createSyncEvent({ version: i });
    }

    // When: 分页拉取直到完成
    let lastVersion = 0;
    let totalChanges = 0;
    let iterations = 0;

    do {
      const response = await request(app)
        .post('/api/v1/sync/pull')
        .send({ deviceId: 'device-1', lastSyncVersion: lastVersion, limit: 100 });

      totalChanges += response.body.data.changes.length;
      lastVersion = response.body.data.changes[response.body.data.changes.length - 1]?.version || lastVersion;
      iterations++;

      if (!response.body.data.hasMore) break;
    } while (iterations < 10);

    // Then: 最终获取所有变更
    expect(totalChanges).toBe(250);
    expect(iterations).toBe(3);  // 100 + 100 + 50
  });

  it('should enforce max limit', async () => {
    // When: 请求超过最大限制
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .send({ deviceId: 'device-1', lastSyncVersion: 0, limit: 1000 });

    // Then: 限制为最大值500
    expect(response.body.data.changes.length).toBeLessThanOrEqual(500);
  });
});
```

##### 场景 26.3: 实体类型过滤
```typescript
describe('Entity Type Filtering', () => {
  it('should filter by entityTypes', async () => {
    // Given: 不同类型的变更
    await createSyncEvent({ version: 1, entityType: 'goal' });
    await createSyncEvent({ version: 2, entityType: 'task' });
    await createSyncEvent({ version: 3, entityType: 'reminder' });
    await createSyncEvent({ version: 4, entityType: 'goal' });

    // When: 只拉取 goal 类型
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .send({ 
        deviceId: 'device-1', 
        lastSyncVersion: 0,
        entityTypes: ['goal']
      });

    // Then: 只返回 goal
    expect(response.body.data.changes).toHaveLength(2);
    expect(response.body.data.changes.every(c => c.entityType === 'goal')).toBe(true);
  });

  it('should filter by multiple entityTypes', async () => {
    // When: 拉取 goal 和 task
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .send({ 
        deviceId: 'device-1', 
        lastSyncVersion: 0,
        entityTypes: ['goal', 'task']
      });

    // Then: 返回 goal 和 task
    expect(response.body.data.changes).toHaveLength(3);
  });
});
```

##### 场景 26.4: 同步游标更新
```typescript
describe('Sync Cursor Management', () => {
  it('should update sync cursor after pull', async () => {
    // Given: 初始游标为0
    await syncCursorRepo.save({ deviceId: 'device-1', lastSyncedEventId: 0 });

    // When: 拉取到版本50
    await request(app)
      .post('/api/v1/sync/pull')
      .send({ deviceId: 'device-1', lastSyncVersion: 0, limit: 50 });

    // Then: 游标更新
    const cursor = await syncCursorRepo.findOne({ deviceId: 'device-1' });
    expect(cursor.lastSyncedEventId).toBe(50);
  });

  it('should support resume from cursor', async () => {
    // Given: 之前同步到版本50
    await syncCursorRepo.save({ deviceId: 'device-1', lastSyncedEventId: 50 });

    // When: 断线重连后继续拉取
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .send({ deviceId: 'device-1', lastSyncVersion: 50 });

    // Then: 从版本51开始
    expect(response.body.data.changes[0].version).toBe(51);
  });
});
```

##### 场景 26.5: 性能要求
```typescript
describe('Pull Performance', () => {
  it('should respond within 500ms for 100 changes', async () => {
    // Given: 100个变更
    for (let i = 1; i <= 100; i++) {
      await createSyncEvent({ version: i });
    }

    // When: 拉取
    const start = Date.now();
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .send({ deviceId: 'device-1', lastSyncVersion: 0, limit: 100 });
    const duration = Date.now() - start;

    // Then: 响应时间 < 500ms
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  it('should use gzip compression', async () => {
    // When: 请求带 Accept-Encoding
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .set('Accept-Encoding', 'gzip')
      .send({ deviceId: 'device-1', lastSyncVersion: 0 });

    // Then: 响应使用 gzip
    expect(response.headers['content-encoding']).toBe('gzip');
  });
});
```

---

### STORY-027: 冲突解决 API

**预估**: 2-3 天 | **优先级**: P3

#### 目标
实现冲突查询和解决功能

#### API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/sync/conflicts` | GET | 获取未解决冲突列表 |
| `/sync/conflicts/:id` | GET | 获取冲突详情 |
| `/sync/conflicts/:id/resolve` | POST | 解决冲突 |
| `/sync/conflicts/history` | GET | 冲突历史 |

#### Tasks

- [ ] **Task 27.1**: 冲突列表接口
  - 返回未解决冲突
  - 支持分页
  - 按实体类型过滤

```typescript
// GET /api/v1/sync/conflicts
@Get('conflicts')
@UseGuards(JwtAuthGuard)
async listConflicts(
  @CurrentUser() user: User,
  @Query() query: ListConflictsDto
): Promise<PaginatedResponse<ConflictInfo>> {
  return this.conflictService.list(user.id, query);
}
```

- [ ] **Task 27.2**: 冲突解决接口
  - 验证解决方案
  - 应用解决结果
  - 生成新版本

```typescript
// POST /api/v1/sync/conflicts/:id/resolve
interface ResolveConflictDto {
  deviceId: string;
  strategy: 'local' | 'remote' | 'manual';
  resolvedData?: Record<string, unknown>;  // strategy=manual 时必填
}

@Post('conflicts/:id/resolve')
@UseGuards(JwtAuthGuard)
async resolveConflict(
  @CurrentUser() user: User,
  @Param('id') conflictId: string,
  @Body() dto: ResolveConflictDto
): Promise<ResolveConflictResponse> {
  return this.conflictService.resolve(user.id, conflictId, dto);
}
```

- [ ] **Task 27.3**: 冲突历史接口
  - 查询已解决冲突
  - 支持按实体筛选

#### 验收标准
- [ ] 可查询未解决冲突
- [ ] 可解决冲突
- [ ] 解决后生成新版本
- [ ] 历史可追溯

#### 验收场景与测试用例

##### 场景 27.1: 冲突查询
```typescript
describe('STORY-027: Conflict Resolution API', () => {
  describe('GET /sync/conflicts - List Conflicts', () => {
    it('should return unresolved conflicts', async () => {
      // Given: 2个未解决冲突，1个已解决
      await createConflict('goal-1', { resolvedAt: null });
      await createConflict('goal-2', { resolvedAt: null });
      await createConflict('goal-3', { resolvedAt: new Date() });

      // When: 获取冲突列表
      const response = await request(app)
        .get('/api/v1/sync/conflicts')
        .set('Authorization', `Bearer ${token}`);

      // Then: 只返回未解决的
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should support pagination', async () => {
      // Given: 50个未解决冲突
      for (let i = 0; i < 50; i++) {
        await createConflict(`goal-${i}`);
      }

      // When: 分页获取
      const response = await request(app)
        .get('/api/v1/sync/conflicts?page=1&limit=20')
        .set('Authorization', `Bearer ${token}`);

      // Then: 返回分页结果
      expect(response.body.data).toHaveLength(20);
      expect(response.body.meta.total).toBe(50);
      expect(response.body.meta.totalPages).toBe(3);
    });

    it('should filter by entityType', async () => {
      // Given: 不同类型的冲突
      await createConflict('goal-1', { entityType: 'goal' });
      await createConflict('task-1', { entityType: 'task' });

      // When: 过滤 goal 类型
      const response = await request(app)
        .get('/api/v1/sync/conflicts?entityType=goal')
        .set('Authorization', `Bearer ${token}`);

      // Then: 只返回 goal 冲突
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].entityType).toBe('goal');
    });
  });

  describe('GET /sync/conflicts/:id - Conflict Detail', () => {
    it('should return conflict detail with diff', async () => {
      // Given: 一个冲突
      const conflict = await createConflict('goal-1', {
        localVersion: { title: 'Local Title', priority: 1 },
        serverVersion: { title: 'Server Title', priority: 2 }
      });

      // When: 获取详情
      const response = await request(app)
        .get(`/api/v1/sync/conflicts/${conflict.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Then: 返回完整信息
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        id: conflict.id,
        entityType: 'goal',
        entityId: 'goal-1',
        conflictingFields: ['title', 'priority'],
        localVersion: { title: 'Local Title', priority: 1 },
        serverVersion: { title: 'Server Title', priority: 2 }
      });
    });
  });
});
```

##### 场景 27.2: 冲突解决
```typescript
describe('POST /sync/conflicts/:id/resolve', () => {
  it('should resolve with local strategy', async () => {
    // Given: 一个冲突
    const conflict = await createConflict('goal-1', {
      localVersion: { title: 'Local Title' },
      serverVersion: { title: 'Server Title' }
    });

    // When: 选择本地版本
    const response = await request(app)
      .post(`/api/v1/sync/conflicts/${conflict.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: 'device-1',
        strategy: 'local'
      });

    // Then: 解决成功
    expect(response.status).toBe(200);
    expect(response.body.data.resolved).toBe(true);

    // And: 实体更新为本地版本
    const entity = await entityVersionRepo.findOne({ entityId: 'goal-1' });
    expect(entity.currentData.title).toBe('Local Title');
    
    // And: 新版本生成
    expect(entity.currentVersion).toBeGreaterThan(conflict.serverVersion);
  });

  it('should resolve with remote strategy', async () => {
    // Given: 一个冲突
    const conflict = await createConflict('goal-1', {
      localVersion: { title: 'Local Title' },
      serverVersion: { title: 'Server Title' }
    });

    // When: 选择服务端版本
    const response = await request(app)
      .post(`/api/v1/sync/conflicts/${conflict.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: 'device-1',
        strategy: 'remote'
      });

    // Then: 保留服务端数据
    const entity = await entityVersionRepo.findOne({ entityId: 'goal-1' });
    expect(entity.currentData.title).toBe('Server Title');
  });

  it('should resolve with manual merge', async () => {
    // Given: 一个冲突
    const conflict = await createConflict('goal-1', {
      localVersion: { title: 'Local', description: 'Local Desc' },
      serverVersion: { title: 'Server', description: 'Server Desc' }
    });

    // When: 手动合并
    const response = await request(app)
      .post(`/api/v1/sync/conflicts/${conflict.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: 'device-1',
        strategy: 'manual',
        resolvedData: {
          title: 'Local',  // 选择本地标题
          description: 'Server Desc'  // 选择服务端描述
        }
      });

    // Then: 使用合并后的数据
    const entity = await entityVersionRepo.findOne({ entityId: 'goal-1' });
    expect(entity.currentData.title).toBe('Local');
    expect(entity.currentData.description).toBe('Server Desc');
  });

  it('should reject manual strategy without resolvedData', async () => {
    // When: 手动策略但没有数据
    const response = await request(app)
      .post(`/api/v1/sync/conflicts/${conflict.id}/resolve`)
      .send({
        deviceId: 'device-1',
        strategy: 'manual'
        // missing resolvedData
      });

    // Then: 返回 400 错误
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('MANUAL_RESOLVE_DATA_REQUIRED');
  });

  it('should record resolution in conflict table', async () => {
    // When: 解决冲突
    await resolveConflict(conflict.id, { strategy: 'local' });

    // Then: 记录解决信息
    const resolved = await conflictRepo.findById(conflict.id);
    expect(resolved.resolvedAt).not.toBeNull();
    expect(resolved.resolutionStrategy).toBe('local');
    expect(resolved.resolvedByDevice).toBe('device-1');
  });
});
```

##### 场景 27.3: 冲突历史
```typescript
describe('GET /sync/conflicts/history', () => {
  it('should return resolved conflicts', async () => {
    // Given: 已解决的冲突
    await createResolvedConflict('goal-1', { 
      resolutionStrategy: 'local',
      resolvedAt: new Date('2024-01-15') 
    });

    // When: 查询历史
    const response = await request(app)
      .get('/api/v1/sync/conflicts/history')
      .set('Authorization', `Bearer ${token}`);

    // Then: 返回历史记录
    expect(response.status).toBe(200);
    expect(response.body.data[0].resolutionStrategy).toBe('local');
  });

  it('should filter by date range', async () => {
    // Given: 不同日期的冲突
    await createResolvedConflict('g1', { resolvedAt: new Date('2024-01-10') });
    await createResolvedConflict('g2', { resolvedAt: new Date('2024-01-20') });
    await createResolvedConflict('g3', { resolvedAt: new Date('2024-01-30') });

    // When: 过滤日期范围
    const response = await request(app)
      .get('/api/v1/sync/conflicts/history')
      .query({ from: '2024-01-15', to: '2024-01-25' });

    // Then: 只返回范围内的
    expect(response.body.data).toHaveLength(1);
  });

  it('should filter by entityId', async () => {
    // When: 查询特定实体的冲突历史
    const response = await request(app)
      .get('/api/v1/sync/conflicts/history')
      .query({ entityId: 'goal-1' });

    // Then: 只返回该实体的历史
    expect(response.body.data.every(c => c.entityId === 'goal-1')).toBe(true);
  });
});
```

---

### STORY-028: WebSocket 实时推送 (可选)

**预估**: 3-4 天 | **优先级**: P4 (可选)

#### 目标
实现变更的实时推送，提升多设备同步体验

#### Tasks

- [ ] **Task 28.1**: WebSocket 服务搭建
  - Socket.IO 或 ws 库
  - 认证中间件

```typescript
@WebSocketGateway({
  namespace: '/sync',
  cors: true,
})
export class SyncGateway {
  @WebSocketServer()
  server: Server;

  private userConnections = new Map<string, Map<string, Socket>>();

  async handleConnection(client: Socket) {
    const user = await this.authenticate(client);
    const deviceId = client.handshake.query.deviceId as string;

    if (!this.userConnections.has(user.id)) {
      this.userConnections.set(user.id, new Map());
    }
    this.userConnections.get(user.id)!.set(deviceId, client);

    // Redis 在线状态
    await this.redis.sadd(`online:${user.id}`, deviceId);
  }

  async handleDisconnect(client: Socket) {
    // 清理连接
  }

  /**
   * 通知用户的其他设备
   */
  notifyUserDevices(
    userId: string,
    sourceDeviceId: string,
    event: SyncNotification
  ) {
    const connections = this.userConnections.get(userId);
    if (!connections) return;

    for (const [deviceId, socket] of connections) {
      if (deviceId !== sourceDeviceId) {
        socket.emit('sync:update', event);
      }
    }
  }
}
```

- [ ] **Task 28.2**: 推送事件设计
  - 变更通知
  - 冲突通知

```typescript
interface SyncNotification {
  type: 'changes_available' | 'conflict_detected';
  version?: number;
  conflictId?: string;
}
```

- [ ] **Task 28.3**: 集成到 Push 流程
  - 推送成功后通知其他设备

- [ ] **Task 28.4**: 断线重连处理
  - 客户端重连
  - 补发丢失通知

#### 验收标准
- [ ] WebSocket 连接稳定
- [ ] 变更实时推送
- [ ] 断线重连正常

#### 验收场景与测试用例

##### 场景 28.1: WebSocket 连接
```typescript
describe('STORY-028: WebSocket Real-time Push', () => {
  describe('Connection Management', () => {
    it('should establish authenticated connection', async () => {
      // Given: 有效的 JWT token
      const token = await getAuthToken('user@example.com');

      // When: 建立 WebSocket 连接
      const socket = io('/sync', {
        auth: { token },
        query: { deviceId: 'device-1' }
      });

      // Then: 连接成功
      await expect(new Promise((resolve, reject) => {
        socket.on('connect', resolve);
        socket.on('connect_error', reject);
      })).resolves.toBeUndefined();

      socket.disconnect();
    });

    it('should reject connection without valid token', async () => {
      // When: 无效 token 连接
      const socket = io('/sync', {
        auth: { token: 'invalid-token' },
        query: { deviceId: 'device-1' }
      });

      // Then: 连接失败
      await expect(new Promise((resolve, reject) => {
        socket.on('connect', () => reject(new Error('Should not connect')));
        socket.on('connect_error', resolve);
      })).resolves.toBeDefined();
    });

    it('should track online status in Redis', async () => {
      // When: 建立连接
      const socket = await connectSocket('user-1', 'device-1');

      // Then: Redis 记录在线状态
      const isOnline = await redis.sismember('online:user-1', 'device-1');
      expect(isOnline).toBe(1);

      // When: 断开连接
      socket.disconnect();
      await sleep(100);

      // Then: 在线状态清除
      const isStillOnline = await redis.sismember('online:user-1', 'device-1');
      expect(isStillOnline).toBe(0);
    });

    it('should support multiple devices per user', async () => {
      // When: 同一用户多个设备连接
      const socket1 = await connectSocket('user-1', 'device-1');
      const socket2 = await connectSocket('user-1', 'device-2');
      const socket3 = await connectSocket('user-1', 'device-3');

      // Then: 所有设备都在线
      const onlineDevices = await redis.smembers('online:user-1');
      expect(onlineDevices).toHaveLength(3);

      socket1.disconnect();
      socket2.disconnect();
      socket3.disconnect();
    });
  });
});
```

##### 场景 28.2: 实时推送通知
```typescript
describe('Real-time Notifications', () => {
  it('should notify other devices on push', async () => {
    // Given: 两个设备连接
    const socket1 = await connectSocket('user-1', 'device-1');
    const socket2 = await connectSocket('user-1', 'device-2');

    // And: 设置监听
    const receivedEvents: SyncNotification[] = [];
    socket2.on('sync:update', (event) => receivedEvents.push(event));

    // When: device-1 推送变更
    await request(app)
      .post('/api/v1/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Device-ID', 'device-1')
      .send({ deviceId: 'device-1', changes: [change] });

    // Then: device-2 收到通知
    await waitFor(() => receivedEvents.length > 0, 1000);
    expect(receivedEvents[0]).toMatchObject({
      type: 'changes_available',
      version: 1
    });

    socket1.disconnect();
    socket2.disconnect();
  });

  it('should not notify the source device', async () => {
    // Given: device-1 和 device-2 连接
    const socket1 = await connectSocket('user-1', 'device-1');
    const socket2 = await connectSocket('user-1', 'device-2');

    const device1Events: SyncNotification[] = [];
    const device2Events: SyncNotification[] = [];
    socket1.on('sync:update', (e) => device1Events.push(e));
    socket2.on('sync:update', (e) => device2Events.push(e));

    // When: device-1 推送
    await pushChange('device-1', change);
    await sleep(500);

    // Then: 只有 device-2 收到通知
    expect(device1Events).toHaveLength(0);
    expect(device2Events).toHaveLength(1);
  });

  it('should notify on conflict detected', async () => {
    // Given: device-2 连接
    const socket2 = await connectSocket('user-1', 'device-2');
    const receivedEvents: SyncNotification[] = [];
    socket2.on('sync:update', (e) => receivedEvents.push(e));

    // When: device-1 推送产生冲突
    await pushConflictingChange('device-1');
    await waitFor(() => receivedEvents.length > 0);

    // Then: 收到冲突通知
    expect(receivedEvents[0]).toMatchObject({
      type: 'conflict_detected',
      conflictId: expect.any(String)
    });
  });
});
```

##### 场景 28.3: 断线重连
```typescript
describe('Reconnection Handling', () => {
  it('should automatically reconnect', async () => {
    // Given: 已建立连接
    const socket = await connectSocket('user-1', 'device-1');
    let reconnectCount = 0;
    socket.on('reconnect', () => reconnectCount++);

    // When: 模拟断线
    socket.disconnect();
    await sleep(100);
    socket.connect();

    // Then: 自动重连成功
    await waitFor(() => socket.connected, 5000);
    expect(socket.connected).toBe(true);
  });

  it('should resume notifications after reconnect', async () => {
    // Given: device-2 连接
    const socket2 = await connectSocket('user-1', 'device-2');
    const receivedEvents: SyncNotification[] = [];
    socket2.on('sync:update', (e) => receivedEvents.push(e));

    // When: 断线期间有变更
    socket2.disconnect();
    await pushChange('device-1', change);
    
    // And: 重连
    socket2.connect();
    await waitFor(() => socket2.connected);

    // And: 拉取变更
    await request(app)
      .post('/api/v1/sync/pull')
      .send({ deviceId: 'device-2', lastSyncVersion: 0 });

    // Then: 能够正常接收后续通知
    await pushChange('device-1', anotherChange);
    await waitFor(() => receivedEvents.length > 0);
    expect(receivedEvents).toHaveLength(1);
  });

  it('should handle connection timeout gracefully', async () => {
    // Given: 连接超时配置
    const socket = io('/sync', {
      auth: { token },
      timeout: 5000,
      reconnectionAttempts: 3
    });

    // When: 服务器不可达
    // Then: 应该有限重试后放弃
    // (模拟测试较复杂，通常集成测试)
  });
});
```

##### 场景 28.4: WebSocket 性能
```typescript
describe('WebSocket Performance', () => {
  it('should handle 100 concurrent connections per user', async () => {
    // Given: 100个连接请求
    const sockets: Socket[] = [];
    
    // When: 并发连接
    const startTime = Date.now();
    const promises = Array.from({ length: 100 }, async (_, i) => {
      const socket = await connectSocket('user-1', `device-${i}`);
      sockets.push(socket);
    });
    await Promise.all(promises);
    const connectionTime = Date.now() - startTime;

    // Then: 所有连接成功，耗时合理
    expect(sockets.every(s => s.connected)).toBe(true);
    expect(connectionTime).toBeLessThan(10000);  // 10秒内

    // Cleanup
    sockets.forEach(s => s.disconnect());
  });

  it('should broadcast notification within 100ms', async () => {
    // Given: 10个设备连接
    const sockets = await Promise.all(
      Array.from({ length: 10 }, (_, i) => 
        connectSocket('user-1', `device-${i}`)
      )
    );

    const receiveTimes: number[] = [];
    sockets.slice(1).forEach(s => {
      s.on('sync:update', () => receiveTimes.push(Date.now()));
    });

    // When: device-0 推送
    const pushTime = Date.now();
    await pushChange('device-0', change);

    // Then: 所有设备在100ms内收到
    await waitFor(() => receiveTimes.length === 9, 1000);
    const maxDelay = Math.max(...receiveTimes) - pushTime;
    expect(maxDelay).toBeLessThan(100);

    sockets.forEach(s => s.disconnect());
  });
});
```

---

### STORY-029: 同步服务性能优化

**预估**: 2-3 天 | **优先级**: P3

#### 目标
优化同步服务的性能和可靠性

#### Tasks

- [ ] **Task 29.1**: 数据库查询优化
  - 分析慢查询
  - 添加必要索引
  - 查询计划优化

- [ ] **Task 29.2**: 缓存策略
  - 实体版本缓存
  - 用户最新版本缓存

```typescript
// 缓存用户最新版本
async getCurrentVersion(userId: string): Promise<number> {
  const cacheKey = `sync:version:${userId}`;
  
  let version = await this.redis.get(cacheKey);
  if (version) return parseInt(version, 10);

  version = await this.syncEventRepo.max('newVersion', {
    where: { userId }
  }) || 0;

  await this.redis.setex(cacheKey, 60, version.toString());
  return version;
}
```

- [ ] **Task 29.3**: 批量操作优化
  - 批量插入事件
  - 批量更新版本

- [ ] **Task 29.4**: 压缩与传输优化
  - 响应 gzip 压缩
  - 增量 payload

- [ ] **Task 29.5**: 监控与告警
  - 同步延迟监控
  - 冲突率监控
  - 错误告警

#### 验收标准
- [ ] Push API < 200ms (p95)
- [ ] Pull API < 300ms (p95)
- [ ] 支持 10000+ 并发用户

#### 验收场景与测试用例

##### 场景 29.1: 数据库查询优化
```typescript
describe('STORY-029: Performance Optimization', () => {
  describe('Database Query Optimization', () => {
    it('should use index for user version query', async () => {
      // When: 分析查询计划
      const explain = await db.query(`
        EXPLAIN ANALYZE
        SELECT * FROM sync_events 
        WHERE user_id = $1 AND new_version > $2
        ORDER BY new_version ASC
        LIMIT 100
      `, ['user-1', 0]);

      // Then: 使用索引扫描，不是全表扫描
      const plan = explain.rows.map(r => r['QUERY PLAN']).join('\n');
      expect(plan).toContain('Index Scan');
      expect(plan).not.toContain('Seq Scan');
    });

    it('should optimize entity lookup query', async () => {
      // Given: 大量数据
      await seedSyncEvents(100000);

      // When: 查询特定实体
      const start = Date.now();
      await entityVersionRepo.findOne({
        userId: 'user-1',
        entityType: 'goal',
        entityId: 'goal-1'
      });
      const duration = Date.now() - start;

      // Then: 查询时间 < 10ms
      expect(duration).toBeLessThan(10);
    });

    it('should handle large event tables efficiently', async () => {
      // Given: 100万条事件
      await seedSyncEvents(1000000);

      // When: 查询最新100条
      const start = Date.now();
      await syncEventRepo.find({
        where: { userId: 'user-1' },
        order: { newVersion: 'DESC' },
        take: 100
      });
      const duration = Date.now() - start;

      // Then: 查询时间 < 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
```

##### 场景 29.2: 缓存策略
```typescript
describe('Caching Strategy', () => {
  it('should cache user current version', async () => {
    // Given: 用户有1000条事件
    await seedSyncEvents(1000, 'user-1');

    // When: 第一次获取版本（缓存 miss）
    const start1 = Date.now();
    const version1 = await syncService.getCurrentVersion('user-1');
    const coldDuration = Date.now() - start1;

    // And: 第二次获取（缓存 hit）
    const start2 = Date.now();
    const version2 = await syncService.getCurrentVersion('user-1');
    const warmDuration = Date.now() - start2;

    // Then: 缓存命中显著更快
    expect(version1).toBe(version2);
    expect(warmDuration).toBeLessThan(coldDuration / 5);
    expect(warmDuration).toBeLessThan(5);  // < 5ms
  });

  it('should invalidate cache on push', async () => {
    // Given: 缓存版本为 100
    await redis.set('sync:version:user-1', '100');

    // When: 推送新变更
    await pushChange('user-1', change);

    // Then: 缓存被更新
    const cachedVersion = await redis.get('sync:version:user-1');
    expect(parseInt(cachedVersion)).toBe(101);
  });

  it('should cache entity versions', async () => {
    // Given: 实体版本
    await createEntity('goal', 'goal-1', { version: 5 });

    // When: 获取实体（触发缓存）
    await entityVersionService.get('user-1', 'goal', 'goal-1');

    // Then: Redis 有缓存
    const cached = await redis.get('entity:user-1:goal:goal-1');
    expect(cached).toBeDefined();
    expect(JSON.parse(cached).currentVersion).toBe(5);
  });
});
```

##### 场景 29.3: 批量操作优化
```typescript
describe('Batch Operations', () => {
  it('should batch insert events efficiently', async () => {
    // Given: 100个变更
    const changes = Array.from({ length: 100 }, (_, i) => ({
      eventId: `event-${i}`,
      entityType: 'goal',
      entityId: `goal-${i}`,
      operation: 'create',
      payload: { title: `Goal ${i}` },
      baseVersion: 0,
      clientTimestamp: Date.now()
    }));

    // When: 批量推送
    const start = Date.now();
    const response = await request(app)
      .post('/api/v1/sync/push')
      .send({ deviceId: 'device-1', changes });
    const duration = Date.now() - start;

    // Then: 批量插入 < 500ms
    expect(response.body.data.accepted).toHaveLength(100);
    expect(duration).toBeLessThan(500);
  });

  it('should batch update entity versions', async () => {
    // 内部实现使用批量 upsert
    // 验证通过 Push API 性能测试
  });
});
```

##### 场景 29.4: 压缩与传输优化
```typescript
describe('Compression and Transfer', () => {
  it('should compress large responses', async () => {
    // Given: 1000个变更（大约 500KB JSON）
    await seedSyncEvents(1000, 'user-1');

    // When: 拉取变更
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .set('Accept-Encoding', 'gzip')
      .send({ deviceId: 'device-1', lastSyncVersion: 0, limit: 1000 });

    // Then: 响应被压缩
    expect(response.headers['content-encoding']).toBe('gzip');
    
    // And: 压缩后大小显著减小（通常 10x）
    const compressedSize = parseInt(response.headers['content-length']);
    expect(compressedSize).toBeLessThan(50 * 1024);  // < 50KB
  });

  it('should use incremental payload for updates', async () => {
    // Given: 更新只修改一个字段
    const change: SyncChange = {
      operation: 'update',
      payload: { title: 'New Title' },  // 只包含变更字段
      ...
    };

    // When: 推送
    const response = await pushChange(change);

    // Then: 接受增量更新
    expect(response.body.data.accepted).toHaveLength(1);
  });
});
```

##### 场景 29.5: 监控与告警
```typescript
describe('Monitoring and Alerting', () => {
  it('should expose metrics endpoint', async () => {
    // When: 访问 metrics
    const response = await request(app)
      .get('/metrics');

    // Then: 包含同步相关指标
    expect(response.status).toBe(200);
    expect(response.text).toContain('sync_push_duration_seconds');
    expect(response.text).toContain('sync_pull_duration_seconds');
    expect(response.text).toContain('sync_conflict_total');
  });

  it('should track push latency histogram', async () => {
    // Given: 执行多次 push
    for (let i = 0; i < 100; i++) {
      await pushChange({ eventId: `e-${i}`, ... });
    }

    // When: 获取 metrics
    const metrics = await getPrometheusMetrics();

    // Then: 包含延迟直方图
    expect(metrics).toContain('sync_push_duration_seconds_bucket');
    expect(metrics).toContain('sync_push_duration_seconds_sum');
    expect(metrics).toContain('sync_push_duration_seconds_count');
  });

  it('should log slow queries', async () => {
    // Given: 慢查询阈值 100ms
    const logSpy = jest.spyOn(logger, 'warn');

    // When: 执行慢查询（模拟）
    await simulateSlowQuery(200);

    // Then: 记录警告日志
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Slow query detected'),
      expect.objectContaining({ duration: expect.any(Number) })
    );
  });
});
```

##### 场景 29.6: 性能基准测试
```typescript
describe('Performance Benchmarks', () => {
  it('should meet Push API p95 < 200ms', async () => {
    // Given: 100个并发推送请求
    const latencies: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await pushChange({ eventId: `e-${i}`, ... });
      latencies.push(Date.now() - start);
    }

    // Then: p95 < 200ms
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    expect(p95).toBeLessThan(200);
  });

  it('should meet Pull API p95 < 300ms', async () => {
    // Given: 预填充数据
    await seedSyncEvents(10000, 'user-1');

    // When: 100次拉取
    const latencies: number[] = [];
    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await request(app)
        .post('/api/v1/sync/pull')
        .send({ deviceId: 'device-1', lastSyncVersion: i * 100, limit: 100 });
      latencies.push(Date.now() - start);
    }

    // Then: p95 < 300ms
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    expect(p95).toBeLessThan(300);
  });

  it('should support 10000+ concurrent users (load test)', async () => {
    // 使用 k6 或 Artillery 进行负载测试
    // 
    // k6 脚本示例:
    // export const options = {
    //   scenarios: {
    //     sync_load: {
    //       executor: 'constant-vus',
    //       vus: 10000,
    //       duration: '5m'
    //     }
    //   }
    // };
    // 
    // export default function() {
    //   http.post('/api/v1/sync/push', JSON.stringify(payload));
    //   check(res, { 'status is 200': (r) => r.status === 200 });
    // }
  });
});
```

---

### STORY-030: 同步服务测试

**预估**: 3-4 天 | **优先级**: P3

#### 目标
完整的测试覆盖

#### Tasks

- [ ] **Task 30.1**: 单元测试
  - ConflictDetector 测试
  - SyncService 测试
  - DeviceService 测试

- [ ] **Task 30.2**: 集成测试
  - Push/Pull 流程测试
  - 冲突解决测试
  - 并发测试

```typescript
describe('SyncService', () => {
  describe('push', () => {
    it('should accept valid changes', async () => {
      // ...
    });

    it('should detect version conflict', async () => {
      // ...
    });

    it('should handle concurrent push with lock', async () => {
      // ...
    });
  });

  describe('pull', () => {
    it('should return incremental changes', async () => {
      // ...
    });

    it('should exclude own device changes', async () => {
      // ...
    });
  });
});
```

- [ ] **Task 30.3**: 性能测试
  - 负载测试
  - 压力测试
  - 并发测试

- [ ] **Task 30.4**: 端到端测试
  - 多设备同步场景
  - 离线/在线切换
  - 冲突解决流程

#### 验收标准
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖关键流程
- [ ] 性能测试通过指标

#### 验收场景与测试用例

##### 场景 30.1: 单元测试覆盖
```typescript
describe('STORY-030: Sync Service Testing', () => {
  describe('Unit Tests', () => {
    describe('ConflictDetector', () => {
      it('should detect conflicting fields', () => {
        const detector = new ConflictDetector();
        
        const local = { title: 'Local Title', priority: 1 };
        const server = { title: 'Server Title', priority: 1 };
        
        const conflicts = detector.findConflictingFields(local, server);
        
        expect(conflicts).toEqual(['title']);
      });

      it('should ignore system fields', () => {
        const detector = new ConflictDetector();
        
        const local = { id: '1', updatedAt: '2024-01-01', title: 'Same' };
        const server = { id: '2', updatedAt: '2024-01-02', title: 'Same' };
        
        const conflicts = detector.findConflictingFields(local, server);
        
        expect(conflicts).toHaveLength(0);
      });

      it('should handle nested objects', () => {
        const detector = new ConflictDetector();
        
        const local = { metadata: { color: 'red' } };
        const server = { metadata: { color: 'blue' } };
        
        const conflicts = detector.findConflictingFields(local, server);
        
        expect(conflicts).toContain('metadata');
      });

      it('should handle arrays', () => {
        const detector = new ConflictDetector();
        
        const local = { tags: ['a', 'b'] };
        const server = { tags: ['a', 'c'] };
        
        const conflicts = detector.findConflictingFields(local, server);
        
        expect(conflicts).toContain('tags');
      });
    });

    describe('SyncService', () => {
      it('should generate sequential version numbers', async () => {
        const service = new SyncService(mockRepo);
        
        const v1 = await service.getNextVersion('user-1');
        const v2 = await service.getNextVersion('user-1');
        const v3 = await service.getNextVersion('user-1');
        
        expect(v2).toBe(v1 + 1);
        expect(v3).toBe(v2 + 1);
      });

      it('should validate change payload', () => {
        const service = new SyncService(mockRepo);
        
        // Valid change
        expect(() => service.validateChange(validChange)).not.toThrow();
        
        // Missing required fields
        expect(() => service.validateChange({ eventId: '1' }))
          .toThrow('entityType is required');
        
        // Invalid operation
        expect(() => service.validateChange({ ...validChange, operation: 'invalid' }))
          .toThrow('Invalid operation');
      });
    });

    describe('DeviceService', () => {
      it('should limit devices per user', async () => {
        const service = new DeviceService(mockRepo, { maxDevices: 10 });
        
        // Register 10 devices
        for (let i = 0; i < 10; i++) {
          await service.register('user-1', { deviceId: `d-${i}`, ... });
        }
        
        // 11th should fail
        await expect(service.register('user-1', { deviceId: 'd-10', ... }))
          .rejects.toThrow('MAX_DEVICES_REACHED');
      });

      it('should detect inactive devices', async () => {
        const service = new DeviceService(mockRepo);
        
        const inactiveDevice = {
          lastSeenAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
        };
        
        expect(service.isInactive(inactiveDevice)).toBe(true);
      });
    });
  });
});
```

##### 场景 30.2: 集成测试
```typescript
describe('Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Complete Sync Flow', () => {
    it('should complete full push-pull cycle', async () => {
      // Setup: 两个设备
      const device1 = await registerDevice('device-1');
      const device2 = await registerDevice('device-2');

      // Device 1 创建目标
      await request(app)
        .post('/api/v1/sync/push')
        .set('X-Device-ID', 'device-1')
        .send({
          deviceId: 'device-1',
          changes: [{
            eventId: 'e1',
            entityType: 'goal',
            entityId: 'goal-1',
            operation: 'create',
            payload: { title: 'Test Goal' },
            baseVersion: 0,
            clientTimestamp: Date.now()
          }]
        });

      // Device 2 拉取
      const pullResponse = await request(app)
        .post('/api/v1/sync/pull')
        .set('X-Device-ID', 'device-2')
        .send({ deviceId: 'device-2', lastSyncVersion: 0 });

      // 验证
      expect(pullResponse.body.data.changes).toHaveLength(1);
      expect(pullResponse.body.data.changes[0].payload.title).toBe('Test Goal');
    });

    it('should handle conflict resolution flow', async () => {
      // Setup: 创建初始数据
      await createEntity('goal', 'goal-1', { title: 'Original', version: 1 });

      // Device 1 推送更新（造成冲突）
      await request(app)
        .post('/api/v1/sync/push')
        .send({
          deviceId: 'device-1',
          changes: [{
            entityId: 'goal-1',
            operation: 'update',
            payload: { title: 'Device 1 Title' },
            baseVersion: 0  // 过期版本
          }]
        });

      // 获取冲突
      const conflictsResponse = await request(app)
        .get('/api/v1/sync/conflicts')
        .set('Authorization', `Bearer ${token}`);
      
      expect(conflictsResponse.body.data).toHaveLength(1);
      const conflictId = conflictsResponse.body.data[0].id;

      // 解决冲突
      const resolveResponse = await request(app)
        .post(`/api/v1/sync/conflicts/${conflictId}/resolve`)
        .send({
          deviceId: 'device-1',
          strategy: 'local'
        });

      expect(resolveResponse.body.data.resolved).toBe(true);

      // 验证最终状态
      const entity = await entityVersionRepo.findOne({ entityId: 'goal-1' });
      expect(entity.currentData.title).toBe('Device 1 Title');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle 10 concurrent push requests safely', async () => {
      // Setup
      await createEntity('goal', 'goal-1', { counter: 0, version: 1 });

      // 10 并发更新
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, (_, i) =>
          request(app)
            .post('/api/v1/sync/push')
            .send({
              deviceId: `device-${i}`,
              changes: [{
                eventId: `e-${i}`,
                entityId: 'goal-1',
                operation: 'update',
                payload: { counter: i + 1 },
                baseVersion: 1
              }]
            })
        )
      );

      // 验证：只有1个成功，其余冲突
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && 
        r.value.body.data.accepted.length > 0
      ).length;
      expect(successCount).toBe(1);

      const conflictCount = results.filter(r =>
        r.status === 'fulfilled' &&
        r.value.body.data.conflicts.length > 0
      ).length;
      expect(conflictCount).toBe(9);
    });
  });

  describe('Database Transaction Integrity', () => {
    it('should rollback on partial failure', async () => {
      // Given: 批量变更，其中一个会失败
      const changes = [
        { eventId: 'e1', entityId: 'g1', operation: 'create', payload: { title: 'Valid' }, baseVersion: 0 },
        { eventId: 'e2', entityId: 'g2', operation: 'create', payload: null, baseVersion: 0 }, // 无效
        { eventId: 'e3', entityId: 'g3', operation: 'create', payload: { title: 'Valid' }, baseVersion: 0 }
      ];

      // When: 推送
      const response = await request(app)
        .post('/api/v1/sync/push')
        .send({ deviceId: 'device-1', changes });

      // Then: 全部回滚（取决于设计决策）
      // 或者：部分成功，返回失败列表
    });
  });
});
```

##### 场景 30.3: 性能测试
```typescript
describe('Performance Tests', () => {
  describe('Load Testing', () => {
    it('should handle 1000 sequential pushes in < 30s', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        await request(app)
          .post('/api/v1/sync/push')
          .send({
            deviceId: 'device-1',
            changes: [{
              eventId: `e-${i}`,
              entityType: 'goal',
              entityId: `goal-${i}`,
              operation: 'create',
              payload: { title: `Goal ${i}` },
              baseVersion: 0
            }]
          });
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    });

    it('should handle 100 concurrent pulls', async () => {
      // Seed data
      await seedSyncEvents(10000);

      const startTime = Date.now();
      
      const results = await Promise.all(
        Array.from({ length: 100 }, () =>
          request(app)
            .post('/api/v1/sync/pull')
            .send({ deviceId: 'device-1', lastSyncVersion: 0, limit: 100 })
        )
      );

      const duration = Date.now() - startTime;

      // All should succeed
      expect(results.every(r => r.status === 200)).toBe(true);
      // Total time < 5s (50ms average per request)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Stress Testing', () => {
    it('should maintain performance under memory pressure', async () => {
      // 模拟大量数据场景
      await seedSyncEvents(100000);

      const memBefore = process.memoryUsage().heapUsed;

      // 执行大量操作
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/v1/sync/pull')
          .send({ deviceId: 'device-1', lastSyncVersion: i * 1000, limit: 1000 });
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memGrowth = (memAfter - memBefore) / 1024 / 1024;

      // 内存增长 < 100MB
      expect(memGrowth).toBeLessThan(100);
    });
  });
});
```

##### 场景 30.4: 端到端测试
```typescript
describe('End-to-End Tests', () => {
  describe('Multi-Device Sync Scenario', () => {
    it('should sync changes between 3 devices', async () => {
      // Setup: 3个设备
      const devices = ['laptop', 'phone', 'tablet'];
      for (const device of devices) {
        await registerDevice(device);
      }

      // Laptop 创建目标
      await pushFromDevice('laptop', {
        entityType: 'goal',
        entityId: 'goal-1',
        operation: 'create',
        payload: { title: 'Learn TypeScript', status: 'active' }
      });

      // Phone 拉取并更新
      await pullToDevice('phone');
      await pushFromDevice('phone', {
        entityType: 'goal',
        entityId: 'goal-1',
        operation: 'update',
        payload: { status: 'in-progress' }
      });

      // Tablet 拉取
      const tabletChanges = await pullToDevice('tablet');

      // 验证：Tablet 有最新数据
      const goal = tabletChanges.find(c => c.entityId === 'goal-1');
      expect(goal.payload).toMatchObject({
        title: 'Learn TypeScript',
        status: 'in-progress'
      });
    });

    it('should handle offline-online transition', async () => {
      // Device 离线期间积累变更
      const offlineChanges = [
        { eventId: 'e1', entityType: 'goal', entityId: 'g1', operation: 'create', ... },
        { eventId: 'e2', entityType: 'task', entityId: 't1', operation: 'create', ... },
        { eventId: 'e3', entityType: 'task', entityId: 't2', operation: 'create', ... }
      ];

      // 上线后批量推送
      const response = await request(app)
        .post('/api/v1/sync/push')
        .send({ deviceId: 'device-1', changes: offlineChanges });

      // 所有变更成功
      expect(response.body.data.accepted).toHaveLength(3);

      // 其他设备可以拉取
      const otherDevicePull = await request(app)
        .post('/api/v1/sync/pull')
        .send({ deviceId: 'device-2', lastSyncVersion: 0 });

      expect(otherDevicePull.body.data.changes).toHaveLength(3);
    });
  });

  describe('Conflict Resolution Workflow', () => {
    it('should guide user through conflict resolution UI', async () => {
      // 创建冲突场景
      await createConflictScenario('goal-1');

      // 1. 获取冲突列表
      const conflicts = await getConflicts();
      expect(conflicts).toHaveLength(1);

      // 2. 获取冲突详情（用于 UI 展示）
      const detail = await getConflictDetail(conflicts[0].id);
      expect(detail.conflictingFields).toBeDefined();
      expect(detail.localVersion).toBeDefined();
      expect(detail.serverVersion).toBeDefined();

      // 3. 用户选择解决方案
      const resolution = await resolveConflict(conflicts[0].id, {
        strategy: 'manual',
        resolvedData: {
          title: detail.localVersion.title,  // 选择本地标题
          description: detail.serverVersion.description  // 选择服务端描述
        }
      });

      expect(resolution.resolved).toBe(true);

      // 4. 验证解决后状态
      const entity = await getEntity('goal-1');
      expect(entity.title).toBe(detail.localVersion.title);
      expect(entity.description).toBe(detail.serverVersion.description);
    });
  });
});
```

##### 场景 30.5: 测试覆盖率报告
```bash
# 运行测试并生成覆盖率报告
pnpm nx run api:test --coverage

# 预期覆盖率输出:
# -------------------------|---------|----------|---------|---------|
# File                     | % Stmts | % Branch | % Funcs | % Lines |
# -------------------------|---------|----------|---------|---------|
# sync/                    |         |          |         |         |
#   sync.service.ts        |   92.5  |   88.2   |   95.0  |   91.8  |
#   conflict.detector.ts   |   95.0  |   90.5   |  100.0  |   94.2  |
#   device.service.ts      |   88.3  |   85.0   |   92.0  |   87.5  |
#   sync.gateway.ts        |   85.0  |   80.0   |   88.0  |   84.2  |
# -------------------------|---------|----------|---------|---------|
# All files                |   90.2  |   85.9   |   93.8  |   89.4  |
# -------------------------|---------|----------|---------|---------|

# 验收标准: 整体覆盖率 > 80%
```

---

## 📅 开发计划

```
Phase 1: 基础设施 (Week 1)
├── Day 1-2: STORY-023 (数据库设计)
└── Day 3-5: STORY-024 (设备管理)

Phase 2: 核心同步 (Week 2-3)
├── Day 1-5: STORY-025 (Push API)
└── Day 6-9: STORY-026 (Pull API)

Phase 3: 冲突处理 (Week 3)
└── Day 10-12: STORY-027 (冲突解决)

Phase 4: 增强功能 (Week 4)
├── Day 13-15: STORY-028 (WebSocket) [可选]
└── Day 16-17: STORY-029 (性能优化)

Phase 5: 质量保障 (Week 4-5)
└── Day 18-21: STORY-030 (测试)
```

---

## 🔗 API 规范

### 请求头

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Device-ID: <device_uuid>
X-App-Version: 1.0.0
```

### 响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "SYNC_VERSION_CONFLICT",
    "message": "Version conflict detected",
    "details": { ... }
  }
}
```

### 错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| `SYNC_VERSION_CONFLICT` | 409 | 版本冲突 |
| `SYNC_DEVICE_NOT_FOUND` | 404 | 设备未注册 |
| `SYNC_LOCK_TIMEOUT` | 423 | 同步锁超时 |
| `SYNC_RATE_LIMITED` | 429 | 速率限制 |
| `SYNC_PAYLOAD_TOO_LARGE` | 413 | 请求体过大 |

---

## 📈 监控指标

| 指标 | 阈值 | 告警 |
|------|------|------|
| Push API 延迟 (p95) | < 200ms | > 500ms |
| Pull API 延迟 (p95) | < 300ms | > 800ms |
| 冲突率 | < 5% | > 10% |
| 同步失败率 | < 1% | > 5% |
| WebSocket 连接数 | - | 断开告警 |

---

## 📈 风险评估

| 风险 | 概率 | 影响 | 缓解措施 | 回滚策略 |
|------|------|------|---------|---------|
| 高并发冲突 | 中 (30%) | 高 | 分布式锁 + 队列 | 关闭同步功能，保持只读 |
| 数据不一致 | 低 (10%) | 高 | 事务 + 版本校验 | 数据库回滚 + 重新同步 |
| 存储增长 | 高 (60%) | 中 | 事件归档策略 | 暂停归档，扩容存储 |
| 网络延迟 | 中 (40%) | 中 | 批量传输 + 压缩 | 降级为轮询模式 |
| 版本号溢出 | 极低 (1%) | 高 | BIGINT + 监控告警 | 版本号重置脚本 |
| 多租户数据泄露 | 极低 (1%) | 极高 | 行级安全策略 | 紧急关闭服务 + 审计 |
| WebSocket 连接风暴 | 中 (25%) | 中 | 连接数限制 + 背压 | 降级为轮询 |
| 数据库死锁 | 低 (15%) | 中 | 锁超时 + 重试 | 重启连接池 |

---

## 🗄️ 数据归档策略

### 归档需求分析

| 数据类型 | 保留期限 | 归档频率 | 存储目标 |
|---------|---------|---------|---------|
| sync_events | 90天 | 每日 | 冷存储 (S3/GCS) |
| sync_conflicts (已解决) | 30天 | 每周 | 压缩归档 |
| sync_events (已同步) | 7天快照 | 每日 | 删除或归档 |
| entity_versions | 永久 | 不归档 | 热存储 |

### 归档实现

```typescript
// 归档服务
@Injectable()
export class SyncArchiveService {
  // 归档常量
  private readonly EVENTS_RETENTION_DAYS = 90;
  private readonly CONFLICTS_RETENTION_DAYS = 30;
  private readonly BATCH_SIZE = 10000;

  /**
   * 归档旧事件到冷存储
   */
  async archiveOldEvents(): Promise<ArchiveResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.EVENTS_RETENTION_DAYS);

    let totalArchived = 0;
    let hasMore = true;

    while (hasMore) {
      // 批量查询待归档事件
      const events = await this.syncEventRepo.find({
        where: {
          serverTimestamp: LessThan(cutoffDate),
          archived: false
        },
        take: this.BATCH_SIZE,
        order: { id: 'ASC' }
      });

      if (events.length === 0) {
        hasMore = false;
        continue;
      }

      // 写入冷存储
      const archiveData = this.formatForArchive(events);
      await this.coldStorage.upload(
        `sync-events/${cutoffDate.toISOString().split('T')[0]}/${Date.now()}.jsonl.gz`,
        this.compress(archiveData)
      );

      // 标记已归档
      const ids = events.map(e => e.id);
      await this.syncEventRepo.update(
        { id: In(ids) },
        { archived: true }
      );

      totalArchived += events.length;
      
      // 避免长事务，休息一下
      await sleep(100);
    }

    return { totalArchived, cutoffDate };
  }

  /**
   * 删除已归档的事件（释放空间）
   */
  async purgeArchivedEvents(): Promise<number> {
    const result = await this.db.query(`
      DELETE FROM sync_events 
      WHERE archived = TRUE 
        AND server_timestamp < NOW() - INTERVAL '${this.EVENTS_RETENTION_DAYS + 7} days'
      LIMIT 10000
    `);
    return result.rowCount;
  }

  /**
   * 压缩已解决的冲突记录
   */
  async archiveResolvedConflicts(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.CONFLICTS_RETENTION_DAYS);

    const result = await this.db.query(`
      WITH archived AS (
        SELECT * FROM sync_conflicts 
        WHERE resolved_at IS NOT NULL 
          AND resolved_at < $1
          AND archived = FALSE
        LIMIT 5000
      )
      UPDATE sync_conflicts 
      SET archived = TRUE,
          local_version = NULL,  -- 清理大字段
          server_data = NULL
      WHERE id IN (SELECT id FROM archived)
      RETURNING id
    `, [cutoffDate]);

    return result.rowCount;
  }
}
```

### 归档调度

```typescript
// 使用 Bull 队列调度
@Processor('archive')
export class ArchiveProcessor {
  @Process('daily-archive')
  async handleDailyArchive(job: Job) {
    this.logger.log('Starting daily archive job');

    // 1. 归档旧事件
    const eventResult = await this.archiveService.archiveOldEvents();
    this.logger.log(`Archived ${eventResult.totalArchived} events`);

    // 2. 归档已解决冲突
    const conflictResult = await this.archiveService.archiveResolvedConflicts();
    this.logger.log(`Archived ${conflictResult} conflicts`);

    // 3. 清理已归档数据
    const purged = await this.archiveService.purgeArchivedEvents();
    this.logger.log(`Purged ${purged} archived events`);

    // 4. 更新表统计信息
    await this.db.query('ANALYZE sync_events');
    await this.db.query('ANALYZE sync_conflicts');
  }
}

// 调度配置
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'archive',
      defaultJobOptions: {
        repeat: { cron: '0 3 * * *' }  // 每天凌晨3点
      }
    })
  ]
})
export class ArchiveModule {}
```

---

## 🔢 版本号溢出处理

### 版本号设计

```sql
-- 使用 BIGINT，最大值 9,223,372,036,854,775,807
-- 假设每秒 1000 次变更，可用 292,471 年
```

### 溢出监控与告警

```typescript
// 版本号监控服务
@Injectable()
export class VersionMonitorService {
  private readonly BIGINT_MAX = BigInt('9223372036854775807');
  private readonly WARNING_THRESHOLD = 0.9;  // 90%
  private readonly CRITICAL_THRESHOLD = 0.99; // 99%

  @Cron('0 */6 * * *')  // 每6小时检查
  async checkVersionLimits() {
    // 查询每个用户的最高版本号
    const results = await this.db.query(`
      SELECT user_id, MAX(new_version) as max_version
      FROM sync_events
      GROUP BY user_id
      HAVING MAX(new_version) > $1
    `, [Number(this.BIGINT_MAX) * this.WARNING_THRESHOLD]);

    for (const row of results.rows) {
      const usage = Number(BigInt(row.max_version)) / Number(this.BIGINT_MAX);
      
      if (usage >= this.CRITICAL_THRESHOLD) {
        this.alertService.critical(
          `User ${row.user_id} version near overflow: ${(usage * 100).toFixed(2)}%`
        );
        await this.initiateVersionReset(row.user_id);
      } else if (usage >= this.WARNING_THRESHOLD) {
        this.alertService.warn(
          `User ${row.user_id} high version usage: ${(usage * 100).toFixed(2)}%`
        );
      }
    }
  }

  /**
   * 版本号重置（需要所有设备重新全量同步）
   */
  async initiateVersionReset(userId: string) {
    // 1. 通知所有设备需要重新同步
    await this.notifyDevicesForResync(userId);

    // 2. 创建新的事件序列
    await this.db.transaction(async (trx) => {
      // 归档旧事件
      await trx.query(`
        INSERT INTO sync_events_archive 
        SELECT * FROM sync_events WHERE user_id = $1
      `, [userId]);

      // 删除旧事件
      await trx.query(`
        DELETE FROM sync_events WHERE user_id = $1
      `, [userId]);

      // 重置同步游标
      await trx.query(`
        UPDATE sync_cursors 
        SET last_synced_event_id = 0 
        WHERE user_id = $1
      `, [userId]);

      // 基于 entity_versions 重建初始事件
      await trx.query(`
        INSERT INTO sync_events (
          event_id, user_id, device_id, entity_type, entity_id,
          operation, payload, base_version, new_version, client_timestamp
        )
        SELECT 
          gen_random_uuid(), user_id, 'system', entity_type, entity_id,
          'create', current_data, 0, ROW_NUMBER() OVER (ORDER BY id),
          EXTRACT(EPOCH FROM NOW()) * 1000
        FROM entity_versions
        WHERE user_id = $1 AND is_deleted = FALSE
      `, [userId]);
    });

    this.logger.warn(`Version reset completed for user ${userId}`);
  }
}
```

---

## 🔒 多租户安全隔离

### 行级安全策略 (RLS)

```sql
-- 启用行级安全
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY user_isolation_sync_events ON sync_events
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_isolation_entity_versions ON entity_versions
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_isolation_devices ON devices
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_isolation_sync_cursors ON sync_cursors
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_isolation_sync_conflicts ON sync_conflicts
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

### 应用层隔离

```typescript
// 中间件设置当前用户
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (userId) {
      // 设置 PostgreSQL 会话变量
      req.tenantContext = { userId };
    }
    next();
  }
}

// Repository 装饰器确保用户隔离
@Injectable()
export class SyncEventRepository {
  async find(userId: string, options: FindOptions) {
    // 确保 WHERE 条件包含 user_id
    return this.dataSource.query(`
      SET app.current_user_id = $1;
      SELECT * FROM sync_events 
      WHERE user_id = $1
      ${options.where ? `AND ${options.where}` : ''}
      ORDER BY ${options.order || 'new_version ASC'}
      LIMIT ${options.limit || 100}
    `, [userId]);
  }
}
```

### 安全测试

```typescript
describe('Multi-Tenant Security', () => {
  it('should not allow cross-user data access', async () => {
    // Given: 两个用户的数据
    await createSyncEvent({ userId: 'user-1', entityId: 'e1' });
    await createSyncEvent({ userId: 'user-2', entityId: 'e2' });

    // When: user-1 尝试拉取
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ deviceId: 'device-1', lastSyncVersion: 0 });

    // Then: 只能看到自己的数据
    expect(response.body.data.changes).toHaveLength(1);
    expect(response.body.data.changes[0].entityId).toBe('e1');
  });

  it('should reject direct SQL injection attempts', async () => {
    // When: 尝试 SQL 注入
    const maliciousPayload = {
      deviceId: "device-1'; DROP TABLE sync_events; --",
      changes: []
    };

    const response = await request(app)
      .post('/api/v1/sync/push')
      .send(maliciousPayload);

    // Then: 请求被拒绝或安全处理
    expect(response.status).not.toBe(500);
    
    // And: 表仍然存在
    const tableExists = await db.query(
      "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'sync_events')"
    );
    expect(tableExists.rows[0].exists).toBe(true);
  });
});
```

---

## 📊 事件压缩存储

### 事件合并策略

```typescript
// 对同一实体的多个更新事件进行压缩
@Injectable()
export class EventCompactionService {
  /**
   * 压缩同一实体的连续更新事件
   * 例如：update(v1->v2) + update(v2->v3) + update(v3->v4) 
   *   => compacted_update(v1->v4)
   */
  async compactEntityEvents(
    userId: string, 
    entityType: string, 
    entityId: string
  ): Promise<CompactionResult> {
    // 1. 获取该实体的所有未压缩更新事件
    const events = await this.syncEventRepo.find({
      where: {
        userId,
        entityType,
        entityId,
        operation: 'update',
        compacted: false
      },
      order: { newVersion: 'ASC' }
    });

    if (events.length < 3) {
      return { compacted: 0 };  // 不值得压缩
    }

    // 2. 合并 payload
    const mergedPayload = events.reduce((acc, event) => ({
      ...acc,
      ...event.payload
    }), {});

    // 3. 创建压缩事件
    const compactedEvent = {
      eventId: uuid(),
      userId,
      entityType,
      entityId,
      operation: 'update',
      payload: mergedPayload,
      baseVersion: events[0].baseVersion,
      newVersion: events[events.length - 1].newVersion,
      isCompacted: true,
      originalEventIds: events.map(e => e.eventId)
    };

    await this.db.transaction(async (trx) => {
      // 插入压缩事件
      await trx.insert('sync_events', compactedEvent);

      // 标记原事件为已压缩
      await trx.update('sync_events', 
        { compacted: true },
        { id: In(events.map(e => e.id)) }
      );
    });

    return { compacted: events.length };
  }

  /**
   * 定期压缩任务
   */
  @Cron('0 4 * * *')  // 每天凌晨4点
  async runCompaction() {
    // 查找有多个更新事件的实体
    const candidates = await this.db.query(`
      SELECT user_id, entity_type, entity_id, COUNT(*) as event_count
      FROM sync_events
      WHERE operation = 'update' AND compacted = FALSE
      GROUP BY user_id, entity_type, entity_id
      HAVING COUNT(*) >= 5
      LIMIT 1000
    `);

    for (const candidate of candidates.rows) {
      await this.compactEntityEvents(
        candidate.user_id,
        candidate.entity_type,
        candidate.entity_id
      );
    }
  }
}
```

### 存储优化

```sql
-- 使用表分区减少单表大小
CREATE TABLE sync_events (
    ...
) PARTITION BY RANGE (server_timestamp);

-- 按月分区
CREATE TABLE sync_events_2024_01 PARTITION OF sync_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE sync_events_2024_02 PARTITION OF sync_events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... 更多分区

-- 自动创建分区（使用 pg_partman 扩展）
SELECT partman.create_parent(
    'public.sync_events',
    'server_timestamp',
    'native',
    'monthly'
);

-- JSONB 压缩（PostgreSQL 14+）
ALTER TABLE sync_events 
    ALTER COLUMN payload SET COMPRESSION lz4;
```

---

## 🔗 依赖关系

### 与 EPIC-004 (客户端同步) 的接口对接

| 客户端接口 | 服务端接口 |
|-----------|-----------|
| `SyncClientService.pushChanges()` | `POST /sync/push` |
| `SyncClientService.pullChanges()` | `POST /sync/pull` |
| `DeviceService.register()` | `POST /sync/devices` |
| `ConflictResolver.resolve()` | `POST /sync/conflicts/:id/resolve` |

---

**文档版本**: v2.0  
**创建日期**: 2025-12-07  
**最后更新**: 2025-12-08  
**状态**: 🟡 Planning
