# STORY-024: 设备管理 API (后端)

## 📋 Story 概述

**Story ID**: STORY-024  
**Epic**: EPIC-005 (Backend Sync Service - 后端同步服务)  
**优先级**: P3  
**预估工时**: 2-3 天  
**状态**: ✅ Completed  
**完成日期**: 2025-12-08  
**前置依赖**: STORY-023 ✅ (同步数据库迁移)

---

## 🎯 用户故事

**作为** 多设备用户  
**我希望** 能够管理我的所有已注册设备  
**以便于** 我可以查看设备状态、远程登出不需要的设备

---

## 🔧 技术背景

### API 端点概览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/sync/devices` | POST | 注册新设备 |
| `/sync/devices` | GET | 获取设备列表 |
| `/sync/devices/:id` | PUT | 更新设备信息 |
| `/sync/devices/:id` | DELETE | 远程登出设备 |
| `/sync/devices/:id/heartbeat` | POST | 心跳更新 |

### 设备状态管理

```
┌─────────────────────────────────────────────────────────┐
│                   设备生命周期                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐    POST /devices    ┌──────────┐          │
│  │ Unknown │ ──────────────────► │ Active   │          │
│  └─────────┘                     └────┬─────┘          │
│                                       │                 │
│                    heartbeat (30s)    │ 90天无活动      │
│                         ▲             ▼                 │
│                         │        ┌──────────┐          │
│                         └────────│ Inactive │          │
│                                  └────┬─────┘          │
│                                       │                 │
│                    DELETE /devices/:id│                 │
│                                       ▼                 │
│                                  ┌──────────┐          │
│                                  │ Removed  │          │
│                                  └──────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 验收标准

### AC-1: 设备注册

- [ ] 新设备成功注册
- [ ] 设备 ID 唯一性验证
- [ ] 记录设备名称、平台、版本
- [ ] 返回设备信息

### AC-2: 设备列表

- [ ] 返回用户所有设备
- [ ] 标识当前设备
- [ ] 显示在线状态 (Redis)
- [ ] 显示最后活跃时间

### AC-3: 设备数量限制

- [ ] 最多 10 个活跃设备
- [ ] 超出时提示删除旧设备
- [ ] 90 天不活跃自动标记 Inactive

### AC-4: 远程登出

- [ ] 标记设备为非活跃
- [ ] 清除同步游标
- [ ] 可选发送推送通知

### AC-5: 心跳更新

- [ ] 更新 last_seen_at
- [ ] 更新 Redis 在线状态
- [ ] 30 秒超时标记离线

---

## 📝 Tasks/Subtasks

### Task 24.1: 设备注册接口 [3h]

- [ ] 24.1.1 创建 `POST /sync/devices` 端点
- [ ] 24.1.2 验证设备 ID 唯一性
- [ ] 24.1.3 检查设备数量限制 (10)
- [ ] 24.1.4 保存设备信息到数据库
- [ ] 24.1.5 返回设备详情

**请求/响应:**

```typescript
// POST /api/v1/sync/devices
interface RegisterDeviceDto {
  deviceId: string;      // 客户端生成的 UUID
  deviceName: string;    // 例如 "MacBook Pro"
  platform: Platform;    // windows/macos/linux/web
  appVersion: string;    // 例如 "1.0.0"
  pushToken?: string;    // 推送通知 token
}

interface DeviceResponse {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  lastSyncAt: string | null;
  lastSeenAt: string;
  isActive: boolean;
  createdAt: string;
}
```

### Task 24.2: 设备列表接口 [2h]

- [ ] 24.2.1 创建 `GET /sync/devices` 端点
- [ ] 24.2.2 查询用户所有设备
- [ ] 24.2.3 从 Redis 获取在线状态
- [ ] 24.2.4 标识当前请求设备

**响应:**

```typescript
interface DeviceListResponse {
  devices: (DeviceResponse & {
    isOnline: boolean;
    isCurrent: boolean;
  })[];
  total: number;
}
```

### Task 24.3: 设备更新接口 [1h]

- [ ] 24.3.1 创建 `PUT /sync/devices/:id` 端点
- [ ] 24.3.2 允许更新设备名称
- [ ] 24.3.3 允许更新推送 token

### Task 24.4: 远程登出接口 [2h]

- [ ] 24.4.1 创建 `DELETE /sync/devices/:id` 端点
- [ ] 24.4.2 标记设备为非活跃
- [ ] 24.4.3 删除同步游标
- [ ] 24.4.4 从 Redis 移除在线状态
- [ ] 24.4.5 可选发送推送通知

### Task 24.5: 心跳接口 [2h]

- [ ] 24.5.1 创建 `POST /sync/devices/:id/heartbeat` 端点
- [ ] 24.5.2 更新数据库 last_seen_at
- [ ] 24.5.3 设置 Redis 在线状态 (TTL 30s)
- [ ] 24.5.4 返回服务端时间

**Redis 键结构:**

```
online:{userId}:devices SET [deviceId1, deviceId2, ...]  TTL: 60s
```

### Task 24.6: 不活跃设备清理 [2h]

- [ ] 24.6.1 创建定时任务 (每日执行)
- [ ] 24.6.2 标记 90 天未活跃设备
- [ ] 24.6.3 记录清理日志

### Task 24.7: 编写测试 [3h]

- [ ] 24.7.1 设备注册测试
- [ ] 24.7.2 设备列表测试
- [ ] 24.7.3 远程登出测试
- [ ] 24.7.4 心跳测试
- [ ] 24.7.5 设备数量限制测试

---

## 📐 Dev Notes

### 技术规范

1. **设备数量限制**
   ```typescript
   const MAX_DEVICES_PER_USER = 10;
   const DEVICE_INACTIVE_THRESHOLD_DAYS = 90;
   ```

2. **心跳间隔**
   - 客户端每 30 秒发送心跳
   - Redis TTL 60 秒 (允许 1 次丢失)

3. **平台枚举**
   ```typescript
   type Platform = 'windows' | 'macos' | 'linux' | 'web' | 'ios' | 'android';
   ```

### 相关文件位置

```
apps/api/src/
├── modules/sync/
│   ├── controllers/
│   │   └── device.controller.ts    # Task 24.1-24.5
│   ├── services/
│   │   └── device.service.ts
│   ├── dto/
│   │   └── device.dto.ts
│   └── entities/
│       └── device.entity.ts
├── jobs/
│   └── cleanup-inactive-devices.job.ts  # Task 24.6
└── tests/
    └── device.spec.ts              # Task 24.7
```

---

## 🧪 测试场景

### 场景 24.1: 设备注册

```typescript
describe('POST /sync/devices - Register Device', () => {
  it('should register new device successfully', async () => {
    const response = await request(app)
      .post('/api/v1/sync/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: 'device-uuid-1',
        deviceName: 'MacBook Pro',
        platform: 'macos',
        appVersion: '1.0.0'
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      deviceId: 'device-uuid-1',
      deviceName: 'MacBook Pro',
      platform: 'macos',
      isActive: true
    });
  });
});
```

### 场景 24.2: 设备数量限制

```
前置条件：
  - 用户已注册 10 个活跃设备
  
步骤：
  1. 尝试注册第 11 个设备
  
预期结果：
  - 返回 400 错误
  - 错误码: MAX_DEVICES_REACHED
  - 提示删除旧设备
```

### 场景 24.3: 远程登出

```
步骤：
  1. 设备 A 调用 DELETE /sync/devices/{设备B的ID}
  2. 设备 B 尝试同步
  
预期结果：
  - 设备 B 被标记为非活跃
  - 设备 B 的同步游标被删除
  - 设备 B 再次同步时返回 404 DEVICE_NOT_FOUND
```

### 场景 24.4: 在线状态检测

```
步骤：
  1. 设备 A 发送心跳
  2. 获取设备列表
  3. 等待 60 秒 (心跳超时)
  4. 再次获取设备列表
  
预期结果：
  - 步骤 2: 设备 A 的 isOnline = true
  - 步骤 4: 设备 A 的 isOnline = false
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
