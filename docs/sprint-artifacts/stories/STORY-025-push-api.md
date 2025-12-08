# STORY-025: Push API - 推送本地变更 (后端)

## 📋 Story 概述

**Story ID**: STORY-025  
**Epic**: EPIC-005 (Backend Sync Service - 后端同步服务)  
**优先级**: P3  
**预估工时**: 4 天 (拆分为 3 个子任务)  
**状态**: ✅ Completed  
**完成日期**: 2025-12-08  
**前置依赖**: STORY-023 ✅, STORY-024 (设备管理)

---

## 🎯 用户故事

**作为** Desktop 应用  
**我希望** 能够将本地变更推送到云端  
**以便于** 其他设备能够同步到这些变更

---

## 🔧 技术背景

### API 端点

```typescript
// POST /api/v1/sync/push
interface SyncPushRequest {
  deviceId: string;
  changes: SyncChange[];
}

interface SyncChange {
  eventId: string;           // 客户端生成的事件 UUID
  entityType: EntityType;    // goal/task/reminder/...
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  baseVersion: number;       // 客户端认为的当前版本
  clientTimestamp: number;   // 客户端时间戳
}

interface SyncPushResponse {
  accepted: string[];        // 已接受的事件 ID
  conflicts: ConflictInfo[]; // 检测到的冲突
  newVersion: number;        // 服务端当前最新版本
}
```

### Push 流程

```
┌─────────────────────────────────────────────────────────────────┐
│                       Push API 处理流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 获取同步锁 (Redis/DB)                                        │
│         │                                                       │
│         ▼                                                       │
│  2. 验证请求格式                                                 │
│         │                                                       │
│         ▼                                                       │
│  3. 遍历每个 change ─────────────────────────────┐              │
│         │                                         │              │
│         ▼                                         │              │
│  4. 检查版本冲突                                   │              │
│         │                                         │              │
│    ┌────┴────┐                                   │              │
│    │         │                                   │              │
│    ▼         ▼                                   │              │
│ 无冲突    有冲突                                  │              │
│    │         │                                   │              │
│    ▼         ▼                                   │              │
│ 写入事件  检测字段                                │              │
│    │         │                                   │              │
│    │    ┌────┴────┐                             │              │
│    │    │         │                             │              │
│    │    ▼         ▼                             │              │
│    │ 可自动    需手动                            │              │
│    │ 合并      解决                              │              │
│    │    │         │                             │              │
│    │    ▼         │                             │              │
│    │ 合并后     记录到                           │              │
│    │ 写入      conflicts                        │              │
│    │    │         │                             │              │
│    └────┴─────────┴──────────────────┬──────────┘              │
│                                       │                         │
│                                       ▼                         │
│  5. 更新 entity_versions                                        │
│         │                                                       │
│         ▼                                                       │
│  6. 释放同步锁                                                   │
│         │                                                       │
│         ▼                                                       │
│  7. 返回响应                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 验收标准

### AC-1: 同步锁机制 (STORY-025a)

- [ ] Redis 分布式锁正常工作
- [ ] 同用户并发请求被阻塞
- [ ] Redis 不可用时降级到数据库锁
- [ ] 锁超时自动释放 (5s)

### AC-2: 变更处理 (STORY-025b)

- [ ] 正确验证请求格式
- [ ] 正确检测版本冲突
- [ ] 非冲突字段自动合并
- [ ] 冲突正确记录到数据库
- [ ] 事件写入 sync_events 表

### AC-3: 事务与错误处理 (STORY-025c)

- [ ] 事务失败完全回滚
- [ ] 重复 eventId 幂等处理
- [ ] 错误响应符合 API 规范
- [ ] 部分成功返回明确状态

---

## 📝 Tasks/Subtasks

### Sub-Story 025a: 同步锁机制 [1天]

#### Task 25a.1: Redis 分布式锁 [3h]

- [ ] 25a.1.1 安装 redlock 依赖
- [ ] 25a.1.2 创建 `SyncLockService`
- [ ] 25a.1.3 实现 `acquireSyncLock()`
- [ ] 25a.1.4 实现 `releaseSyncLock()`

**实现参考:**

```typescript
@Injectable()
export class SyncLockService {
  private readonly LOCK_TTL = 5000;  // 5秒

  constructor(
    private redlock: Redlock,
    private db: Database,
    private logger: Logger,
  ) {}

  async acquireSyncLock(userId: string): Promise<Lock> {
    try {
      const lock = await this.redlock.acquire(
        [`sync:lock:${userId}`],
        this.LOCK_TTL
      );
      return { type: 'redis', lock };
    } catch (error) {
      if (this.isRedisUnavailable(error)) {
        this.logger.warn('Redis unavailable, falling back to DB lock');
        return await this.fallbackToDbLock(userId);
      }
      throw error;
    }
  }
}
```

#### Task 25a.2: 数据库降级锁 [2h]

- [ ] 25a.2.1 创建 `sync_locks` 表
- [ ] 25a.2.2 实现 `fallbackToDbLock()`
- [ ] 25a.2.3 实现锁清理逻辑

**降级锁表:**

```sql
CREATE TABLE sync_locks (
    user_id UUID PRIMARY KEY,
    acquired_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sync_locks_expires ON sync_locks(expires_at);
```

#### Task 25a.3: 锁测试 [2h]

- [ ] 25a.3.1 Redis 锁测试
- [ ] 25a.3.2 降级锁测试
- [ ] 25a.3.3 超时释放测试

---

### Sub-Story 025b: 变更处理 + 冲突检测 [2天]

#### Task 25b.1: Push Controller [2h]

- [ ] 25b.1.1 创建 `POST /sync/push` 端点
- [ ] 25b.1.2 请求 DTO 验证
- [ ] 25b.1.3 设备验证中间件

#### Task 25b.2: 变更处理服务 [4h]

- [ ] 25b.2.1 创建 `SyncPushService`
- [ ] 25b.2.2 实现 `processChanges()` 主方法
- [ ] 25b.2.3 实现 `processChange()` 单个处理
- [ ] 25b.2.4 写入 sync_events 表

**处理逻辑:**

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

  // 3. 生成新版本号并写入事件
  const newVersion = await this.getNextVersion(userId);
  await this.syncEventRepo.save({ ... });

  // 4. 更新实体版本
  await this.updateEntityVersion(userId, change, newVersion);

  return { status: 'accepted', version: newVersion };
}
```

#### Task 25b.3: 冲突检测器 [3h]

- [ ] 25b.3.1 创建 `ConflictDetector`
- [ ] 25b.3.2 实现版本号比较
- [ ] 25b.3.3 实现字段级差异检测
- [ ] 25b.3.4 实现自动合并判断

#### Task 25b.4: 实体版本更新 [2h]

- [ ] 25b.4.1 创建/更新 entity_versions
- [ ] 25b.4.2 处理软删除
- [ ] 25b.4.3 处理删除后重建

#### Task 25b.5: 测试 [3h]

- [ ] 25b.5.1 成功推送测试
- [ ] 25b.5.2 冲突检测测试
- [ ] 25b.5.3 自动合并测试

---

### Sub-Story 025c: 事务与错误处理 [1天]

#### Task 25c.1: 事务封装 [2h]

- [ ] 25c.1.1 使用数据库事务包装处理
- [ ] 25c.1.2 失败时回滚
- [ ] 25c.1.3 部分成功策略

#### Task 25c.2: 幂等性保证 [2h]

- [ ] 25c.2.1 通过 eventId 去重
- [ ] 25c.2.2 重复请求返回成功
- [ ] 25c.2.3 记录去重日志

**幂等性实现:**

```typescript
async ensureIdempotent(eventId: string): Promise<boolean> {
  const exists = await this.syncEventRepo.exists({ eventId });
  if (exists) {
    this.logger.info('Duplicate event detected, skipping', { eventId });
    return false;  // 已处理，跳过
  }
  return true;  // 需要处理
}
```

#### Task 25c.3: 错误响应标准化 [2h]

- [ ] 25c.3.1 定义错误码
- [ ] 25c.3.2 统一错误响应格式
- [ ] 25c.3.3 Payload 大小限制 (1MB)

**错误码:**

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| SYNC_DEVICE_NOT_FOUND | 404 | 设备未注册 |
| SYNC_LOCK_TIMEOUT | 409 | 获取锁超时 |
| SYNC_PAYLOAD_TOO_LARGE | 413 | Payload 超过 1MB |
| SYNC_VALIDATION_ERROR | 400 | 请求格式错误 |

#### Task 25c.4: 测试 [2h]

- [ ] 25c.4.1 事务回滚测试
- [ ] 25c.4.2 幂等性测试
- [ ] 25c.4.3 错误响应测试

---

## 📐 Dev Notes

### 技术规范

1. **请求限制**
   - 单个 Payload: 1 MB
   - 批量变更数量: 100 条
   - 请求体总大小: 5 MB

2. **锁配置**
   - Redis 锁 TTL: 5 秒
   - 锁获取重试: 3 次
   - 重试间隔: 200ms

3. **版本号策略**
   - 用户级别递增
   - 使用数据库函数 `next_sync_version()`

### 相关文件位置

```
apps/api/src/modules/sync/
├── controllers/
│   └── push.controller.ts
├── services/
│   ├── sync-lock.service.ts       # 025a
│   ├── sync-push.service.ts       # 025b
│   └── conflict-detector.ts       # 025b
├── dto/
│   └── push.dto.ts
└── tests/
    ├── sync-lock.spec.ts
    ├── push-basic.spec.ts
    ├── push-conflict.spec.ts
    └── push-transaction.spec.ts
```

---

## 🧪 测试场景

### 场景 25.1: 成功推送变更

```typescript
describe('POST /sync/push - Basic Push', () => {
  it('should accept valid create operation', async () => {
    const change = {
      eventId: 'event-uuid-1',
      entityType: 'goal',
      entityId: 'goal-uuid-1',
      operation: 'create',
      payload: { title: '学习 TypeScript' },
      baseVersion: 0,
      clientTimestamp: Date.now()
    };

    const response = await request(app)
      .post('/api/v1/sync/push')
      .send({ deviceId: 'device-1', changes: [change] });

    expect(response.status).toBe(200);
    expect(response.body.data.accepted).toContain('event-uuid-1');
  });
});
```

### 场景 25.2: 版本冲突检测

```
前置条件：
  - 服务端实体版本为 5
  
步骤：
  1. 客户端基于版本 3 推送更新
  
预期结果：
  - 检测到版本冲突
  - conflicts 包含冲突详情
  - 冲突记录到数据库
```

### 场景 25.3: 并发推送

```
步骤：
  1. 同一用户的两个设备同时推送
  2. 检查数据一致性
  
预期结果：
  - 一个请求先获取锁并完成
  - 另一个等待后处理
  - 数据保持一致
```

### 场景 25.4: 幂等性

```
步骤：
  1. 推送 eventId='e1' 的变更
  2. 再次推送相同 eventId 的变更
  
预期结果：
  - 两次都返回成功
  - 数据库只有一条记录
```

---

## 📁 File List

> 实现过程中创建/修改的文件列表

*开发过程中更新*

---

## 📝 Change Log

| 日期 | 变更 | 作者 |
|------|------|------|
| 2025-12-07 | Story 创建，拆分为 025a/b/c | AI |

---

## 🤖 Dev Agent Record

### Debug Log

*开发过程中的调试记录*

### Completion Notes

*完成时的备注*
