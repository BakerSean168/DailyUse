# STORY-023: 同步数据库设计与迁移 (后端)

## 📋 Story 概述

**Story ID**: STORY-023  
**Epic**: EPIC-005 (Backend Sync Service - 后端同步服务)  
**优先级**: P3  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: 
- EPIC-002 ✅ (Desktop Application Development)
- 现有 API 服务基础设施 ✅

---

## 🎯 用户故事

**作为** 后端开发者  
**我希望** 有完善的同步数据库表结构和迁移脚本  
**以便于** 支持多设备数据同步功能的实现

---

## 🔧 技术背景

### 数据库架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL 同步表结构                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐       ┌─────────────────┐                 │
│  │  sync_events    │       │ entity_versions │                 │
│  │  (事件溯源)     │◄─────►│  (当前状态)     │                 │
│  │                 │       │                 │                 │
│  │  - event_id     │       │  - entity_id    │                 │
│  │  - user_id      │       │  - current_ver  │                 │
│  │  - entity_type  │       │  - current_data │                 │
│  │  - operation    │       │  - is_deleted   │                 │
│  │  - payload      │       │                 │                 │
│  │  - version      │       │                 │                 │
│  └─────────────────┘       └─────────────────┘                 │
│                                                                 │
│  ┌─────────────────┐       ┌─────────────────┐                 │
│  │    devices      │       │  sync_cursors   │                 │
│  │  (设备注册)     │◄─────►│  (同步进度)     │                 │
│  │                 │       │                 │                 │
│  │  - device_id    │       │  - device_id    │                 │
│  │  - platform     │       │  - last_event   │                 │
│  │  - last_sync    │       │  - last_sync_at │                 │
│  └─────────────────┘       └─────────────────┘                 │
│                                                                 │
│                    ┌─────────────────┐                         │
│                    │ sync_conflicts  │                         │
│                    │  (冲突记录)     │                         │
│                    │                 │                         │
│                    │  - local_data   │                         │
│                    │  - server_data  │                         │
│                    │  - resolution   │                         │
│                    └─────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Event Sourcing 设计

| 概念 | 说明 |
|------|------|
| **sync_events** | 所有变更的完整历史记录（不可变） |
| **entity_versions** | 实体的当前状态（物化视图） |
| **版本号** | 用户级别递增，用于增量同步 |

---

## 📋 验收标准

### AC-1: 迁移脚本完整性

- [ ] `sync_events` 表创建成功
- [ ] `entity_versions` 表创建成功
- [ ] `devices` 表创建成功
- [ ] `sync_cursors` 表创建成功
- [ ] `sync_conflicts` 表创建成功

### AC-2: 迁移脚本幂等性

- [ ] 迁移脚本可重复执行无错误
- [ ] 支持回滚操作
- [ ] 回滚后可重新执行迁移

### AC-3: 索引与性能

- [ ] 主要查询场景有索引覆盖
- [ ] JSONB 字段有 GIN 索引
- [ ] 部分索引用于常用过滤条件

### AC-4: 数据库函数

- [ ] `next_sync_version()` 函数正常工作
- [ ] 版本号在用户级别正确递增
- [ ] 不同用户版本号相互隔离

---

## 📝 Tasks/Subtasks

### Task 23.1: 创建数据库迁移脚本 [4h]

- [ ] 23.1.1 创建 `sync_events` 表迁移
- [ ] 23.1.2 创建 `entity_versions` 表迁移
- [ ] 23.1.3 创建 `devices` 表迁移
- [ ] 23.1.4 创建 `sync_cursors` 表迁移
- [ ] 23.1.5 创建 `sync_conflicts` 表迁移

**数据库结构:**

```sql
-- 1. sync_events 表 (事件溯源核心表)
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

-- 2. entity_versions 表 (物化当前状态)
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

-- 3. devices 表
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
    push_token TEXT,                        -- 推送通知 token
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. sync_cursors 表
CREATE TABLE sync_cursors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    last_synced_event_id BIGINT NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (user_id, device_id)
);

-- 5. sync_conflicts 表
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    local_event_id UUID NOT NULL,           -- 本地变更事件ID
    server_version BIGINT NOT NULL,         -- 服务端当前版本
    local_data JSONB NOT NULL,              -- 本地版本数据
    server_data JSONB NOT NULL,             -- 服务端版本数据
    conflicting_fields TEXT[] NOT NULL,     -- 冲突字段列表
    resolution_strategy VARCHAR(20),        -- local/remote/merge/manual
    resolved_data JSONB,                    -- 解决后的数据
    resolved_at TIMESTAMPTZ,
    resolved_by_device UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Task 23.2: 创建索引优化 [2h]

- [ ] 23.2.1 创建 `sync_events` 复合索引
- [ ] 23.2.2 创建 `entity_versions` 索引
- [ ] 23.2.3 创建 `devices` 索引
- [ ] 23.2.4 创建 `sync_conflicts` 部分索引
- [ ] 23.2.5 创建 JSONB GIN 索引

**索引结构:**

```sql
-- sync_events 索引
CREATE INDEX idx_sync_events_user_version ON sync_events(user_id, new_version);
CREATE INDEX idx_sync_events_entity ON sync_events(entity_type, entity_id);
CREATE INDEX idx_sync_events_device ON sync_events(device_id);
CREATE INDEX idx_sync_events_timestamp ON sync_events(server_timestamp);

-- entity_versions 索引
CREATE INDEX idx_entity_versions_user_type ON entity_versions(user_id, entity_type);
CREATE INDEX idx_entity_versions_modified ON entity_versions(last_modified_at);
CREATE INDEX idx_entity_versions_data ON entity_versions USING GIN (current_data);

-- devices 索引
CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_devices_last_seen ON devices(last_seen_at);

-- sync_conflicts 部分索引 (只索引未解决的冲突)
CREATE INDEX idx_conflicts_user_unresolved ON sync_conflicts(user_id) 
    WHERE resolved_at IS NULL;
```

### Task 23.3: 创建数据库函数 [2h]

- [ ] 23.3.1 创建 `next_sync_version()` 函数
- [ ] 23.3.2 创建冲突检测辅助函数
- [ ] 23.3.3 添加函数单元测试

**函数实现:**

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

-- 检测实体是否有版本冲突
CREATE OR REPLACE FUNCTION check_version_conflict(
    p_user_id UUID,
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_base_version BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_version BIGINT;
BEGIN
    SELECT current_version 
    INTO v_current_version
    FROM entity_versions 
    WHERE user_id = p_user_id 
      AND entity_type = p_entity_type 
      AND entity_id = p_entity_id;
    
    -- 不存在则无冲突
    IF v_current_version IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- 版本不匹配则有冲突
    RETURN v_current_version > p_base_version;
END;
$$ LANGUAGE plpgsql;
```

### Task 23.4: 编写迁移测试 [2h]

- [ ] 23.4.1 迁移幂等性测试
- [ ] 23.4.2 回滚测试
- [ ] 23.4.3 版本号函数测试
- [ ] 23.4.4 索引有效性测试

### Task 23.5: 文档更新 [1h]

- [ ] 23.5.1 更新 API 数据库 ER 图
- [ ] 23.5.2 添加迁移执行说明
- [ ] 23.5.3 记录设计决策

---

## 📐 Dev Notes

### 技术规范

1. **Event Sourcing 原则**
   - `sync_events` 表记录所有变更，永不删除
   - `entity_versions` 表是物化视图，可从 events 重建
   - 版本号在用户级别递增，用于增量同步

2. **版本号策略**
   ```
   User A: 1, 2, 3, 4, 5...
   User B: 1, 2, 3...  (独立序列)
   ```

3. **冲突检测逻辑**
   ```
   if (base_version < current_version) {
     // 有冲突：本地修改基于旧版本
     detect_conflicting_fields(local_data, server_data);
   }
   ```

### 迁移命令

```bash
# 执行迁移
pnpm nx run api:migrate:up

# 回滚迁移
pnpm nx run api:migrate:down

# 查看迁移状态
pnpm nx run api:migrate:status
```

### 相关文件位置

```
apps/api/
├── prisma/
│   └── migrations/
│       └── YYYYMMDD_sync_tables/
│           └── migration.sql           # Task 23.1, 23.2
├── src/
│   └── database/
│       └── functions/
│           └── sync-functions.sql      # Task 23.3
└── tests/
    └── migrations/
        └── sync-tables.spec.ts         # Task 23.4
```

---

## 🧪 测试场景

### 场景 23.1: 迁移脚本幂等性

```typescript
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
});
```

### 场景 23.2: 表结构验证

```typescript
describe('Table Structure', () => {
  it('should create all required tables', async () => {
    const tables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tableNames = tables.rows.map(r => r.table_name);
    expect(tableNames).toContain('sync_events');
    expect(tableNames).toContain('entity_versions');
    expect(tableNames).toContain('devices');
    expect(tableNames).toContain('sync_cursors');
    expect(tableNames).toContain('sync_conflicts');
  });
});
```

### 场景 23.3: 版本号生成函数

```typescript
describe('Version Number Generation', () => {
  it('should generate sequential version numbers', async () => {
    const userId = 'user-uuid-1';
    
    const v1 = await db.query('SELECT next_sync_version($1)', [userId]);
    const v2 = await db.query('SELECT next_sync_version($1)', [userId]);
    const v3 = await db.query('SELECT next_sync_version($1)', [userId]);

    expect(v1.rows[0].next_sync_version).toBe(1);
    expect(v2.rows[0].next_sync_version).toBe(2);
    expect(v3.rows[0].next_sync_version).toBe(3);
  });

  it('should isolate version numbers between users', async () => {
    const userA = 'user-a';
    const userB = 'user-b';

    const vA1 = await db.query('SELECT next_sync_version($1)', [userA]);
    const vB1 = await db.query('SELECT next_sync_version($1)', [userB]);

    expect(vA1.rows[0].next_sync_version).toBe(1);
    expect(vB1.rows[0].next_sync_version).toBe(1);
  });
});
```

### 场景 23.4: 回滚测试

```bash
# Given: 已执行迁移
pnpm nx run api:migrate:up

# When: 执行回滚
pnpm nx run api:migrate:down

# Then: 表应被删除
psql -c "SELECT COUNT(*) FROM sync_events"
# 预期: ERROR: relation "sync_events" does not exist
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
