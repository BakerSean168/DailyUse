# Notification Module - Backend Implementation

## 📁 目录结构

```
notification/
├── domain/
│   ├── aggregates/
│   │   ├── Notification.ts         # 通知聚合根 (340 lines)
│   │   └── Notification.spec.ts    # 单元测试 (170 lines)
│   └── repositories/
│       └── NotificationRepository.interface.ts  # 仓储接口
├── infrastructure/
│   └── PrismaNotificationRepository.ts  # Prisma 仓储实现 (190 lines)
├── application/
│   └── NotificationApplicationService.ts  # 应用服务 (180 lines)
├── presentation/
│   ├── NotificationController.ts    # HTTP 控制器 (140 lines)
│   └── NotificationGateway.ts      # WebSocket 网关 (100 lines)
└── notification.module.ts          # NestJS 模块定义
```

## 🎯 已实现功能

### 1. Domain Layer (领域层)

#### Notification Aggregate (通知聚合根)
- ✅ `create()` - 创建通知
- ✅ `markAsRead()` - 标记已读
- ✅ `markAsSent()` - 标记已发送
- ✅ `markAsDelivered()` - 标记已送达
- ✅ `softDelete()` - 软删除
- ✅ `isExpired()` - 过期检查
- ✅ DTO 转换 (Server/Client/Persistence)

**特性**:
- 丰富的元数据支持 (metadata)
- 关联实体支持 (relatedEntityType/Uuid)
- 优先级分类 (importance/urgency)
- 过期时间支持 (expiresAt)
- 完整的审计字段 (createdAt, updatedAt, readAt, sentAt, etc.)

### 2. Infrastructure Layer (基础设施层)

#### PrismaNotificationRepository
- ✅ `save()` - 保存通知 (upsert)
- ✅ `findByUuid()` - 根据 UUID 查找
- ✅ `findByAccountUuid()` - 分页查询用户通知
- ✅ `countUnread()` - 统计未读数量
- ✅ `markAllAsRead()` - 批量标记已读
- ✅ `deleteMany()` - 批量删除
- ✅ `delete()` - 单个删除

**查询特性**:
- 分页支持 (page, limit)
- 状态筛选 (READ, UNREAD, ALL)
- 类型筛选 (SYSTEM, TASK, GOAL, etc.)
- 排序支持 (createdAt, priority)
- 软删除过滤 (deletedAt IS NULL)

### 3. Application Layer (应用层)

#### NotificationApplicationService
- ✅ `createNotification()` - 创建通知
- ✅ `findNotifications()` - 查询通知列表
- ✅ `findNotificationByUuid()` - 查询单个通知
- ✅ `markAsRead()` - 标记已读
- ✅ `markAllAsRead()` - 全部标记已读
- ✅ `deleteNotification()` - 删除通知
- ✅ `batchDeleteNotifications()` - 批量删除
- ✅ `getUnreadCount()` - 获取未读数量

**安全特性**:
- 用户数据隔离 (accountUuid 验证)
- NotFoundException 异常处理
- 批量操作的所有权验证

### 4. Presentation Layer (表现层)

#### NotificationController (HTTP API)
- ✅ `POST /api/v1/notifications` - 创建通知
- ✅ `GET /api/v1/notifications` - 查询列表
- ✅ `GET /api/v1/notifications/unread-count` - 未读数量
- ✅ `GET /api/v1/notifications/:uuid` - 查询单个
- ✅ `PATCH /api/v1/notifications/:uuid/read` - 标记已读
- ✅ `PATCH /api/v1/notifications/read-all` - 全部已读
- ✅ `DELETE /api/v1/notifications/:uuid` - 删除
- ✅ `DELETE /api/v1/notifications` - 批量删除

**API 特性**:
- JWT 认证保护 (@UseGuards(JwtAuthGuard))
- Swagger 文档 (@ApiTags, @ApiOperation)
- 统一响应格式

#### NotificationGateway (WebSocket)
- ✅ `namespace: /notifications` - WebSocket 命名空间
- ✅ Connection/Disconnection 管理
- ✅ 用户房间管理 (`user:${accountUuid}`)
- ✅ 实时推送事件:
  - `notification:new` - 新通知
  - `notification:read` - 已读通知
  - `notification:deleted` - 删除通知
  - `notification:unread-count` - 未读数量更新

**实时特性**:
- Socket.IO 集成
- 用户会话管理 (Map<accountUuid, Set<socketId>>)
- 房间订阅机制
- CORS 支持

## 📊 数据库 Schema

```prisma
model notification {
  uuid                String    @id
  accountUuid         String    @map("account_uuid")
  type                String    // SYSTEM, TASK, GOAL, REMINDER, SCHEDULE
  category            String    @default("GENERAL")
  importance          String    @default("NORMAL")
  urgency             String    @default("NORMAL")
  title               String
  content             String    @db.Text
  metadata            String?   @default("{}")
  status              String    @default("PENDING")
  isRead              Boolean   @default(false) @map("is_read")
  readAt              Int?      @map("read_at")
  relatedEntityType   String?   @map("related_entity_type")
  relatedEntityUuid   String?   @map("related_entity_uuid")
  expiresAt           Int?      @map("expires_at")
  createdAt           Int       @map("created_at")
  updatedAt           Int       @map("updated_at")
  sentAt              Int?      @map("sent_at")
  deliveredAt         Int?      @map("delivered_at")
  deletedAt           Int?      @map("deleted_at")
  
  account             account   @relation(...)
  
  @@index([accountUuid, status])
  @@index([accountUuid, createdAt])
  @@index([accountUuid, isRead])
  @@map("notifications")
}
```

## 🧪 测试

### 单元测试
- ✅ `Notification.spec.ts` - 聚合根测试 (170 lines)
  - 创建通知测试
  - 标记已读测试
  - 标记已发送测试
  - 软删除测试
  - 过期检查测试
  - DTO 转换测试

### 测试运行
```bash
# 运行单元测试
npm test packages/domain-server/src/notification

# 运行集成测试 (TODO)
npm test apps/api -- notification
```

## 🔌 使用示例

### 1. 创建通知
```typescript
const notification = await notificationService.createNotification(
  'account-uuid',
  {
    type: 'TASK',
    title: '任务即将到期',
    content: '您的任务"完成报告"将在 1 小时后到期',
    category: 'ALERT',
    importance: ImportanceLevel.HIGH,
    urgency: UrgencyLevel.HIGH,
    relatedEntityType: 'TASK',
    relatedEntityUuid: 'task-uuid',
    metadata: { taskTitle: '完成报告' },
  }
);
```

### 2. 查询通知列表
```typescript
const result = await notificationService.findNotifications(
  'account-uuid',
  {
    page: 1,
    limit: 20,
    status: 'UNREAD',
    type: 'TASK',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }
);
// result: { notifications, total, page, limit, unreadCount }
```

### 3. WebSocket 实时推送
```typescript
// 服务端推送
notificationGateway.sendNotificationToUser(
  'account-uuid',
  notification.toClientDTO()
);

// 客户端监听
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

## 📦 依赖关系

```
NotificationController
  └─> NotificationApplicationService
       └─> NotificationRepository (Interface)
            └─> PrismaNotificationRepository (Implementation)
                 └─> PrismaService

NotificationGateway (独立)
```

## 🚀 待实现功能 (Phase 2)

- [ ] 邮件通知发送 (EmailNotificationSender)
- [ ] 推送通知发送 (PushNotificationSender)
- [ ] 通知模板系统 (NotificationTemplate)
- [ ] 通知偏好设置 (NotificationPreference)
- [ ] 通知渠道管理 (NotificationChannel)
- [ ] 通知历史记录 (NotificationHistory)
- [ ] 通知摘要功能 (Daily/Weekly Digest)
- [ ] 通知统计分析 (Stats & Analytics)

## 📈 代码统计

- **总文件数**: 8 个
- **总代码量**: ~1,200 行
- **测试覆盖**: 聚合根单元测试 (170 lines)

### 分层统计
- Domain Layer: 510 lines (Aggregate + Tests + Interface)
- Infrastructure Layer: 190 lines (Repository)
- Application Layer: 180 lines (Service)
- Presentation Layer: 240 lines (Controller + Gateway)
- Module: 40 lines

## 🔗 相关文档

- [Story 6-1 文档](../../../../../docs/stories/6-1-notification-crud-and-multi-channel.md)
- [Epic 6 Context](../../../../../docs/epic-6-context.md)
- [Notification Contracts](../../../../../packages/contracts/src/modules/notification/)
- [PRD - Notification 模块](../../../../../docs/PRD-PRODUCT-REQUIREMENTS.md#7-notification-通知模块)

---

**实现日期**: 2025-10-30  
**状态**: Backend ✅ 完成 | Frontend ⏸️ 待实现  
**下一步**: 实现前端 UI 组件和 WebSocket 集成
