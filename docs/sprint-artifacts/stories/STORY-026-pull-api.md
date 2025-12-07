# STORY-026: Pull API - 拉取远程变更 (后端)

## 📋 Story 概述

**Story ID**: STORY-026  
**Epic**: EPIC-005 (Backend Sync Service - 后端同步服务)  
**优先级**: P3  
**预估工时**: 3-4 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-023 ✅, STORY-024, STORY-025

---

## 🎯 用户故事

**作为** Desktop 应用  
**我希望** 能够从云端拉取其他设备的变更  
**以便于** 保持本地数据与云端同步

---

## 🔧 技术背景

### API 端点

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

### Pull 流程

```
┌─────────────────────────────────────────────────────────────────┐
│                       Pull API 处理流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 验证请求参数                                                 │
│         │                                                       │
│         ▼                                                       │
│  2. 查询 sync_events                                            │
│     WHERE new_version > lastSyncVersion                         │
│       AND device_id != current_device  (排除自己的变更)          │
│       AND entity_type IN (...) (可选过滤)                        │
│     ORDER BY new_version ASC                                    │
│     LIMIT limit + 1  (判断 hasMore)                             │
│         │                                                       │
│         ▼                                                       │
│  3. 转换为 RemoteChange 格式                                    │
│         │                                                       │
│         ▼                                                       │
│  4. 更新同步游标 (sync_cursors)                                  │
│         │                                                       │
│         ▼                                                       │
│  5. 返回响应 (gzip 压缩)                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 验收标准

### AC-1: 增量拉取

- [ ] 只返回 lastSyncVersion 之后的变更
- [ ] 排除当前设备的变更
- [ ] 按版本号升序返回

### AC-2: 分页支持

- [ ] 支持 limit 参数 (默认100, 最大500)
- [ ] 正确返回 hasMore 标志
- [ ] 支持连续分页直到完成

### AC-3: 实体类型过滤

- [ ] 支持 entityTypes 参数
- [ ] 多类型 OR 过滤
- [ ] 空数组返回所有类型

### AC-4: 同步游标

- [ ] 拉取后更新游标
- [ ] 支持断点续传
- [ ] 游标与设备绑定

### AC-5: 性能要求

- [ ] 100 条变更响应 < 500ms
- [ ] 支持 gzip 压缩
- [ ] 索引优化查询

---

## 📝 Tasks/Subtasks

### Task 26.1: Pull Controller [2h]

- [ ] 26.1.1 创建 `POST /sync/pull` 端点
- [ ] 26.1.2 请求 DTO 验证
- [ ] 26.1.3 设备验证中间件

### Task 26.2: 增量查询服务 [4h]

- [ ] 26.2.1 创建 `SyncPullService`
- [ ] 26.2.2 实现 `pullChanges()` 主方法
- [ ] 26.2.3 实现版本号查询逻辑
- [ ] 26.2.4 实现排除当前设备变更
- [ ] 26.2.5 实现分页逻辑

**查询逻辑:**

```typescript
async pullChanges(
  userId: string,
  deviceId: string,
  lastSyncVersion: number,
  options: PullOptions = {}
): Promise<SyncPullResponse> {
  const { limit = 100, entityTypes } = options;
  const effectiveLimit = Math.min(limit, 500);

  // 构建查询
  const queryBuilder = this.syncEventRepo
    .createQueryBuilder('e')
    .where('e.user_id = :userId', { userId })
    .andWhere('e.new_version > :lastSyncVersion', { lastSyncVersion })
    .andWhere('e.device_id != :deviceId', { deviceId });

  // 实体类型过滤
  if (entityTypes && entityTypes.length > 0) {
    queryBuilder.andWhere('e.entity_type IN (:...entityTypes)', { entityTypes });
  }

  // 排序和分页
  queryBuilder
    .orderBy('e.new_version', 'ASC')
    .take(effectiveLimit + 1);  // 多取一条判断 hasMore

  const events = await queryBuilder.getMany();
  const hasMore = events.length > effectiveLimit;
  const changes = events.slice(0, effectiveLimit).map(this.toRemoteChange);

  // 获取当前最新版本
  const currentVersion = await this.getCurrentVersion(userId);

  // 更新同步游标
  if (changes.length > 0) {
    await this.updateSyncCursor(userId, deviceId, changes[changes.length - 1].version);
  }

  return { changes, currentVersion, hasMore };
}
```

### Task 26.3: 实体类型过滤 [2h]

- [ ] 26.3.1 实现类型参数验证
- [ ] 26.3.2 实现多类型 OR 查询
- [ ] 26.3.3 测试过滤功能

### Task 26.4: 同步游标管理 [2h]

- [ ] 26.4.1 实现游标更新逻辑
- [ ] 26.4.2 实现断点续传支持
- [ ] 26.4.3 游标清理（设备删除时）

**游标表操作:**

```typescript
async updateSyncCursor(
  userId: string,
  deviceId: string,
  lastSyncedEventId: number
): Promise<void> {
  await this.syncCursorRepo.upsert(
    {
      userId,
      deviceId,
      lastSyncedEventId,
      lastSyncedAt: new Date()
    },
    ['userId', 'deviceId']
  );
}
```

### Task 26.5: 响应优化 [2h]

- [ ] 26.5.1 启用 gzip 压缩
- [ ] 26.5.2 字段选择优化
- [ ] 26.5.3 响应时间监控

### Task 26.6: 编写测试 [4h]

- [ ] 26.6.1 增量拉取测试
- [ ] 26.6.2 分页测试
- [ ] 26.6.3 类型过滤测试
- [ ] 26.6.4 游标测试
- [ ] 26.6.5 性能测试

---

## 📐 Dev Notes

### 技术规范

1. **分页限制**
   - 默认: 100 条
   - 最大: 500 条
   - 超过最大值自动截断

2. **游标策略**
   - 使用版本号作为游标
   - 每次拉取成功后更新
   - 设备删除时清理游标

3. **压缩配置**
   ```typescript
   // NestJS gzip 压缩
   app.use(compression({
     filter: (req, res) => {
       // 对 /sync/pull 响应启用压缩
       if (req.path.includes('/sync/pull')) return true;
       return compression.filter(req, res);
     },
     threshold: 1024  // > 1KB 时压缩
   }));
   ```

### 相关文件位置

```
apps/api/src/modules/sync/
├── controllers/
│   └── pull.controller.ts
├── services/
│   ├── sync-pull.service.ts
│   └── sync-cursor.service.ts
├── dto/
│   └── pull.dto.ts
└── tests/
    ├── pull-basic.spec.ts
    ├── pull-pagination.spec.ts
    ├── pull-filter.spec.ts
    └── pull-performance.spec.ts
```

---

## 🧪 测试场景

### 场景 26.1: 增量拉取

```typescript
describe('POST /sync/pull - Incremental Pull', () => {
  it('should return changes since last sync version', async () => {
    // Given: 服务端有版本 1-10 的变更
    for (let i = 1; i <= 10; i++) {
      await createSyncEvent({ version: i, entityId: `goal-${i}` });
    }

    // When: 客户端从版本5开始拉取
    const response = await request(app)
      .post('/api/v1/sync/pull')
      .send({ deviceId: 'device-1', lastSyncVersion: 5 });

    // Then: 返回版本 6-10 的变更
    expect(response.body.data.changes).toHaveLength(5);
    expect(response.body.data.changes[0].version).toBe(6);
    expect(response.body.data.hasMore).toBe(false);
  });
});
```

### 场景 26.2: 排除当前设备变更

```
前置条件：
  - device-1 推送了变更 (version 1)
  - device-2 推送了变更 (version 2)
  
步骤：
  1. device-1 从版本 0 拉取
  
预期结果：
  - 只返回 device-2 的变更
  - 不返回自己推送的变更
```

### 场景 26.3: 分页拉取

```
前置条件：
  - 服务端有 250 个变更
  
步骤：
  1. 以 limit=100 拉取第一页
  2. 检查 hasMore 标志
  3. 继续拉取直到 hasMore=false
  
预期结果：
  - 第 1 次: 100 条, hasMore=true
  - 第 2 次: 100 条, hasMore=true
  - 第 3 次: 50 条, hasMore=false
  - 总共 250 条
```

### 场景 26.4: 实体类型过滤

```
前置条件：
  - goal 变更 2 条
  - task 变更 3 条
  - reminder 变更 1 条
  
步骤：
  1. 拉取时指定 entityTypes=['goal']
  
预期结果：
  - 只返回 2 条 goal 变更
```

### 场景 26.5: 性能测试

```
前置条件：
  - 100 条变更数据
  
步骤：
  1. 发起拉取请求
  2. 测量响应时间
  
预期结果：
  - 响应时间 < 500ms
  - 响应使用 gzip 压缩
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
