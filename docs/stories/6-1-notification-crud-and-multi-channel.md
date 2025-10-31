# Story 6-1: 通知 CRUD + 多渠道聚合

> **Story ID**: STORY-6.1  
> **Epic**: Epic 6 - Notification Module  
> **优先级**: P0  
> **Story Points**: 8  
> **Sprint**: Sprint 5  
> **状态**: ready-for-dev

---

## 📋 Story 概述

### Story 标题
通知 CRUD + 多渠道聚合

### Story 描述
实现通知系统的基础 CRUD 功能和多渠道通知聚合功能，支持站内通知、邮件通知、浏览器推送等多种通知渠道。

### 业务价值
- 统一管理所有通知消息
- 支持多渠道通知推送
- 提供实时通知更新
- 增强用户体验和及时性

---

## 🎯 验收标准 (Gherkin)

### Scenario 1: 创建通知
```gherkin
Given 用户已登录系统
When 系统触发通知事件（任务到期/目标更新等）
Then 系统创建一条通知记录
And 通知包含标题、内容、类型、优先级
And 根据用户配置选择推送渠道（站内/邮件/推送）
```

### Scenario 2: 查看通知列表
```gherkin
Given 用户已登录
When 用户访问通知中心
Then 显示通知列表（分页）
And 支持按未读/已读筛选
And 支持按类型筛选（系统/任务/目标/提醒）
And 支持按优先级筛选
And 显示未读通知数量角标
```

### Scenario 3: 标记已读
```gherkin
Given 用户查看通知列表
When 用户点击某条通知
Then 该通知标记为已读
And 未读计数减 1

When 用户点击"全部标记已读"
Then 所有通知标记为已读
And 未读计数归零
```

### Scenario 4: 删除通知
```gherkin
Given 用户查看通知列表
When 用户删除某条通知
Then 该通知从列表移除
And 服务器端软删除记录
```

### Scenario 5: 实时通知推送
```gherkin
Given 用户已登录并保持在线
When 系统创建新通知
Then 前端通过 WebSocket 实时收到通知
And 显示通知弹窗（可配置）
And 未读计数实时更新
```

---

## 📐 技术设计

### 领域模型

#### Notification Aggregate
```typescript
class Notification {
  uuid: UUID;
  userId: UUID;
  type: NotificationType; // SYSTEM | TASK | GOAL | REMINDER
  priority: NotificationPriority; // LOW | NORMAL | HIGH | URGENT
  title: string;
  content: string;
  metadata: Record<string, any>; // 额外数据（任务ID、目标ID等）
  channels: NotificationChannel[]; // IN_APP | EMAIL | PUSH
  status: NotificationStatus; // PENDING | SENT | READ | DELETED
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 数据库 Schema

```prisma
model Notification {
  uuid        String   @id @default(uuid())
  userId      String   @map("user_id")
  type        String   // SYSTEM, TASK, GOAL, REMINDER
  priority    String   @default("NORMAL") // LOW, NORMAL, HIGH, URGENT
  title       String
  content     String   @db.Text
  metadata    Json?
  channels    String[] // IN_APP, EMAIL, PUSH
  status      String   @default("PENDING") // PENDING, SENT, READ, DELETED
  readAt      DateTime? @map("read_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  
  user        User     @relation(fields: [userId], references: [uuid], onDelete: Cascade)
  
  @@index([userId, status])
  @@index([userId, createdAt])
  @@map("notifications")
}
```

### API 接口设计

#### 1. 创建通知
```
POST /api/v1/notifications
Request:
{
  type: 'TASK' | 'GOAL' | 'SYSTEM' | 'REMINDER',
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
  title: string,
  content: string,
  metadata?: Record<string, any>,
  channels: ('IN_APP' | 'EMAIL' | 'PUSH')[]
}
Response: NotificationClientDTO
```

#### 2. 查询通知列表
```
GET /api/v1/notifications?page=1&limit=20&status=UNREAD&type=TASK
Response: {
  notifications: NotificationClientDTO[],
  total: number,
  unreadCount: number
}
```

#### 3. 标记已读
```
PATCH /api/v1/notifications/:uuid/read
Response: NotificationClientDTO

PATCH /api/v1/notifications/read-all
Response: { success: true, count: number }
```

#### 4. 删除通知
```
DELETE /api/v1/notifications/:uuid
Response: { success: true }

DELETE /api/v1/notifications
Body: { uuids: string[] }
Response: { success: true, count: number }
```

#### 5. 获取未读数量
```
GET /api/v1/notifications/unread-count
Response: { count: number }
```

#### 6. WebSocket 事件
```
// 客户端订阅
ws://api/notifications

// 服务端推送
Event: notification:new
Payload: NotificationClientDTO

Event: notification:read
Payload: { uuid: string }

Event: notification:deleted
Payload: { uuid: string }
```

---

## 🏗️ 实现任务

### Backend Tasks
- [ ] 1. 创建 Notification Prisma Schema
- [ ] 2. 实现 Notification Domain Model (Aggregate)
- [ ] 3. 实现 NotificationRepository
- [ ] 4. 实现 NotificationApplicationService
  - [ ] createNotification()
  - [ ] findNotifications()
  - [ ] markAsRead()
  - [ ] markAllAsRead()
  - [ ] deleteNotification()
  - [ ] getUnreadCount()
- [ ] 5. 实现 NotificationController + Routes
- [ ] 6. 实现 WebSocket Gateway (NotificationGateway)
- [ ] 7. 实现通知发送服务 (NotificationSender)
  - [ ] InAppNotificationSender
  - [ ] EmailNotificationSender (集成邮件服务)
  - [ ] PushNotificationSender (预留接口)
- [ ] 8. 编写单元测试

### Frontend Tasks
- [ ] 9. 创建 Notification Contracts (DTO)
- [ ] 10. 实现 NotificationApiClient
- [ ] 11. 实现 useNotification Composable
- [ ] 12. 创建 NotificationList 组件
- [ ] 13. 创建 NotificationItem 组件
- [ ] 14. 创建 NotificationBell 组件 (Header 未读角标)
- [ ] 15. 创建 NotificationDrawer 组件 (侧边抽屉)
- [ ] 16. 实现 WebSocket 实时推送
- [ ] 17. 集成到 Layout (Header 显示通知图标)
- [ ] 18. 创建通知中心页面 (/notifications)

---

## 🧪 测试策略

### 单元测试
- NotificationApplicationService 测试
- Notification Domain Model 测试
- NotificationRepository 测试

### 集成测试
- API 端到端测试 (Supertest)
- WebSocket 推送测试

### E2E 测试
- 创建通知流程
- 查看通知列表
- 标记已读/删除
- 实时推送验证

---

## 📦 交付物

- [ ] Backend API (8 个端点)
- [ ] WebSocket Gateway (实时推送)
- [ ] Frontend Components (5 个组件)
- [ ] Notification Page (/notifications)
- [ ] 单元测试 (覆盖率 80%+)
- [ ] API 文档 (Swagger)

---

## 📚 相关文档

- [PRD - Notification 模块](../PRD-PRODUCT-REQUIREMENTS.md#7-notification-通知模块)
- [Epic 6 Context](../epic-6-context.md)
- [Epic Planning](../epic-planning.md#epic-6)

---

**Story 创建时间**: 2025-10-30  
**Story 状态**: ready-for-dev  
**预计完成时间**: 2025-11-03
