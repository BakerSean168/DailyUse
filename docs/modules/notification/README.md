---
tags:
  - module
  - notification
  - messaging
  - business-logic
description: 通知中心模块 - 多渠道消息推送系统的完整实现文档
created: 2025-11-23T17:10:00
updated: 2025-11-23T17:10:00
---

# 🔔 Notification Module - 通知中心模块

> 统一的消息推送系统，支持多渠道、优先级管理和消息聚合

## 📋 目录

- [模块概述](#模块概述)
- [核心概念](#核心概念)
- [领域模型](#领域模型)
- [API接口](#api接口)
- [使用示例](#使用示例)
- [推送渠道](#推送渠道)
- [消息模板](#消息模板)

---

## 🎯 模块概述

### 功能简介

通知中心模块提供统一的消息推送服务：

- 📱 多渠道推送（应用内、邮件、推送通知）
- 🎯 消息分类与优先级
- 📊 消息聚合与摘要
- ✅ 已读/未读状态管理
- 🔕 免打扰模式
- 📈 推送统计与分析
- 🎨 消息模板系统

### 通知类型

| 类型 | 描述 | 示例 |
|------|------|------|
| **系统通知** | 系统消息 | 版本更新、维护通知 |
| **提醒通知** | 时间提醒 | 任务到期、会议提醒 |
| **社交通知** | 用户互动 | 评论、点赞、分享 |
| **业务通知** | 业务事件 | 目标完成、任务分配 |

---

## 💡 核心概念

### 通知类型

```typescript
enum NotificationType {
  SYSTEM = 'system',           // 系统通知
  REMINDER = 'reminder',       // 提醒通知
  GOAL_UPDATE = 'goal_update', // 目标更新
  TASK_UPDATE = 'task_update', // 任务更新
  ACHIEVEMENT = 'achievement', // 成就通知
  SOCIAL = 'social',           // 社交互动
}
```

### 优先级

```typescript
enum NotificationPriority {
  LOW = 'low',       // 低优先级（静默）
  NORMAL = 'normal', // 普通（应用内）
  HIGH = 'high',     // 高优先级（推送）
  URGENT = 'urgent', // 紧急（强制推送）
}
```

### 推送渠道

```typescript
enum NotificationChannel {
  IN_APP = 'in_app',       // 应用内通知
  EMAIL = 'email',         // 邮件通知
  PUSH = 'push',           // 推送通知
  SMS = 'sms',             // 短信通知
  WEBHOOK = 'webhook',     // Webhook通知
}
```

### 通知状态

```typescript
enum NotificationStatus {
  PENDING = 'pending',     // 待发送
  SENT = 'sent',           // 已发送
  READ = 'read',           // 已读
  ARCHIVED = 'archived',   // 已归档
  FAILED = 'failed',       // 发送失败
}
```

---

## 🏗 领域模型

### 聚合根: NotificationAggregate

```typescript
// apps/api/src/notification/domain/aggregates/notification.aggregate.ts
export class NotificationAggregate {
  private constructor(
    public readonly id: string,
    private _type: NotificationType,
    private _title: string,
    private _content: string,
    private _priority: NotificationPriority,
    private _channels: NotificationChannel[],
    private _status: NotificationStatus,
    private _metadata: Record<string, any>,
    private _actionUrl: string | null,
    private _imageUrl: string | null,
    public readonly userId: string,
    public readonly createdAt: Date,
    private _sentAt: Date | null,
    private _readAt: Date | null,
    private _expiresAt: Date | null,
    private readonly events: DomainEvent[] = []
  ) {}

  static create(props: CreateNotificationProps): NotificationAggregate {
    const notification = new NotificationAggregate(
      uuidv4(),
      props.type,
      props.title,
      props.content,
      props.priority ?? NotificationPriority.NORMAL,
      props.channels ?? [NotificationChannel.IN_APP],
      NotificationStatus.PENDING,
      props.metadata ?? {},
      props.actionUrl ?? null,
      props.imageUrl ?? null,
      props.userId,
      new Date(),
      null,
      null,
      props.expiresAt ?? null
    );

    notification.addEvent(new NotificationCreatedEvent(notification.toPlainObject()));
    return notification;
  }

  // Getters
  get type(): NotificationType { return this._type; }
  get title(): string { return this._title; }
  get content(): string { return this._content; }
  get priority(): NotificationPriority { return this._priority; }
  get status(): NotificationStatus { return this._status; }
  get isRead(): boolean { return this._status === NotificationStatus.READ; }
  get isExpired(): boolean {
    return this._expiresAt !== null && new Date() > this._expiresAt;
  }

  // 业务方法
  markAsSent(): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error('Only pending notifications can be marked as sent');
    }

    this._status = NotificationStatus.SENT;
    this._sentAt = new Date();

    this.addEvent(new NotificationSentEvent({
      notificationId: this.id,
      userId: this.userId,
      type: this._type,
      channels: this._channels,
    }));
  }

  markAsRead(): void {
    if (this.isRead) {
      return; // 已读，无需重复标记
    }

    this._status = NotificationStatus.READ;
    this._readAt = new Date();

    this.addEvent(new NotificationReadEvent({
      notificationId: this.id,
      userId: this.userId,
    }));
  }

  archive(): void {
    this._status = NotificationStatus.ARCHIVED;

    this.addEvent(new NotificationArchivedEvent({
      notificationId: this.id,
    }));
  }

  markAsFailed(reason: string): void {
    this._status = NotificationStatus.FAILED;
    this._metadata.failureReason = reason;

    this.addEvent(new NotificationFailedEvent({
      notificationId: this.id,
      reason,
    }));
  }

  retry(): void {
    if (this._status !== NotificationStatus.FAILED) {
      throw new Error('Only failed notifications can be retried');
    }

    this._status = NotificationStatus.PENDING;
    delete this._metadata.failureReason;

    this.addEvent(new NotificationRetriedEvent({
      notificationId: this.id,
    }));
  }

  // 检查是否应该推送到指定渠道
  shouldPushTo(channel: NotificationChannel): boolean {
    return this._channels.includes(channel) && !this.isExpired;
  }

  // 获取推送内容（根据渠道定制）
  getContentForChannel(channel: NotificationChannel): NotificationContent {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return {
          subject: this._title,
          body: this._content,
          html: this.renderEmailTemplate(),
        };

      case NotificationChannel.PUSH:
        return {
          title: this._title,
          body: this.truncate(this._content, 100),
          icon: this._imageUrl,
          data: this._metadata,
        };

      case NotificationChannel.IN_APP:
      default:
        return {
          title: this._title,
          content: this._content,
          imageUrl: this._imageUrl,
          actionUrl: this._actionUrl,
          metadata: this._metadata,
        };
    }
  }

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + '...'
      : text;
  }

  private renderEmailTemplate(): string {
    // 使用邮件模板渲染HTML
    return `
      <html>
        <body>
          <h2>${this._title}</h2>
          <p>${this._content}</p>
          ${this._actionUrl ? `<a href="${this._actionUrl}">查看详情</a>` : ''}
        </body>
      </html>
    `;
  }
}
```

### 推送服务

```typescript
// apps/api/src/notification/infrastructure/push/push.service.ts
@Injectable()
export class PushService {
  constructor(
    private readonly emailService: EmailService,
    private readonly fcmService: FCMService,
    private readonly sseService: SSEService
  ) {}

  async send(notification: NotificationAggregate): Promise<void> {
    const promises = notification.channels.map(channel =>
      this.sendToChannel(notification, channel)
    );

    try {
      await Promise.all(promises);
      notification.markAsSent();
    } catch (error) {
      notification.markAsFailed(error.message);
      throw error;
    }
  }

  private async sendToChannel(
    notification: NotificationAggregate,
    channel: NotificationChannel
  ): Promise<void> {
    const content = notification.getContentForChannel(channel);

    switch (channel) {
      case NotificationChannel.IN_APP:
        await this.sseService.push(notification.userId, {
          type: 'notification',
          data: content,
        });
        break;

      case NotificationChannel.EMAIL:
        await this.emailService.send({
          to: notification.userEmail,
          subject: content.subject,
          html: content.html,
        });
        break;

      case NotificationChannel.PUSH:
        await this.fcmService.send({
          token: notification.userDeviceToken,
          title: content.title,
          body: content.body,
          data: content.data,
        });
        break;

      case NotificationChannel.SMS:
        // TODO: 实现短信推送
        break;
    }
  }
}
```

---

## 🔌 API接口

### 基础路径

```
/api/notifications
```

### 端点列表

#### 1. 获取通知列表

```http
GET /api/notifications?status=unread&type=reminder&page=1&limit=20
Authorization: Bearer {token}
```

**查询参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| `status` | string | 通知状态（unread/read/all） |
| `type` | string | 通知类型过滤 |
| `priority` | string | 优先级过滤 |
| `page` | number | 页码 |
| `limit` | number | 每页数量 |

**响应** (200 OK):

```json
{
  "items": [
    {
      "id": "notif-123",
      "type": "reminder",
      "title": "任务即将到期",
      "content": "任务"完成项目文档"将在1小时后到期",
      "priority": "high",
      "status": "sent",
      "isRead": false,
      "actionUrl": "/tasks/task-123",
      "imageUrl": null,
      "createdAt": "2025-11-23T17:10:00.000Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 2. 标记为已读

```http
POST /api/notifications/{notificationId}/read
Authorization: Bearer {token}
```

#### 3. 批量标记为已读

```http
POST /api/notifications/read-all
Authorization: Bearer {token}
```

#### 4. 归档通知

```http
POST /api/notifications/{notificationId}/archive
Authorization: Bearer {token}
```

#### 5. 获取未读数量

```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

**响应** (200 OK):

```json
{
  "count": 5,
  "byType": {
    "reminder": 3,
    "task_update": 1,
    "goal_update": 1
  }
}
```

#### 6. SSE订阅（实时通知）

```http
GET /api/notifications/subscribe
Authorization: Bearer {token}
Accept: text/event-stream
```

**响应** (Stream):

```
event: notification
data: {"id":"notif-123","type":"reminder","title":"任务即将到期",...}

event: notification
data: {"id":"notif-124","type":"goal_update","title":"目标状态更新",...}
```

---

## 💻 使用示例

### 前端 - Vue 3

**通知中心组件**

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useNotificationStore } from '@/stores/notification.store';
import type { Notification } from '@dailyuse/contracts';

const notificationStore = useNotificationStore();
const notifications = computed(() => notificationStore.notifications);
const unreadCount = computed(() => notificationStore.unreadCount);
const showPanel = ref(false);

let eventSource: EventSource;

onMounted(() => {
  notificationStore.fetchNotifications();
  
  // 订阅实时通知
  eventSource = notificationStore.subscribeToRealtime();
});

onUnmounted(() => {
  eventSource?.close();
});

async function markAsRead(notification: Notification) {
  await notificationStore.markAsRead(notification.id);
  
  // 如果有操作链接，跳转
  if (notification.actionUrl) {
    router.push(notification.actionUrl);
  }
}

async function markAllAsRead() {
  await notificationStore.markAllAsRead();
}

function getIcon(type: string): string {
  const icons = {
    reminder: 'mdi-bell-ring',
    goal_update: 'mdi-target',
    task_update: 'mdi-check-circle',
    achievement: 'mdi-trophy',
    system: 'mdi-information',
  };
  return icons[type] || 'mdi-bell';
}

function getColor(priority: string): string {
  const colors = {
    urgent: 'error',
    high: 'warning',
    normal: 'info',
    low: 'grey',
  };
  return colors[priority] || 'info';
}
</script>

<template>
  <div class="notification-center">
    <!-- 通知图标 -->
    <v-badge
      :content="unreadCount"
      :model-value="unreadCount > 0"
      color="error"
      overlap
    >
      <v-btn
        icon="mdi-bell"
        @click="showPanel = !showPanel"
      />
    </v-badge>

    <!-- 通知面板 -->
    <v-menu
      v-model="showPanel"
      :close-on-content-click="false"
      location="bottom end"
      width="400"
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>通知中心</span>
          <v-btn
            v-if="unreadCount > 0"
            variant="text"
            size="small"
            @click="markAllAsRead"
          >
            全部已读
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-list
          v-if="notifications.length > 0"
          max-height="400"
          style="overflow-y: auto"
        >
          <v-list-item
            v-for="notif in notifications"
            :key="notif.id"
            :class="{ 'bg-grey-lighten-4': !notif.isRead }"
            @click="markAsRead(notif)"
          >
            <template #prepend>
              <v-avatar :color="getColor(notif.priority)">
                <v-icon :icon="getIcon(notif.type)" />
              </v-avatar>
            </template>

            <v-list-item-title>{{ notif.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ notif.content }}</v-list-item-subtitle>

            <template #append>
              <v-list-item-action>
                <v-chip
                  v-if="!notif.isRead"
                  color="primary"
                  size="x-small"
                >
                  新
                </v-chip>
                <span class="text-caption text-grey">
                  {{ formatTime(notif.createdAt) }}
                </span>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>

        <v-card-text v-else class="text-center text-grey">
          暂无通知
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>
```

### 实时通知订阅

```typescript
// apps/web/src/stores/notification.store.ts
import { defineStore } from 'pinia';
import type { Notification } from '@dailyuse/contracts';
import { notificationApi } from '@/api/notification.api';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
  }),

  getters: {
    unreadCount: (state) =>
      state.notifications.filter(n => !n.isRead).length,
    
    unreadNotifications: (state) =>
      state.notifications.filter(n => !n.isRead),
  },

  actions: {
    async fetchNotifications() {
      const response = await notificationApi.getNotifications();
      this.notifications = response.items;
    },

    async markAsRead(id: string) {
      await notificationApi.markAsRead(id);
      const notification = this.notifications.find(n => n.id === id);
      if (notification) {
        notification.isRead = true;
        notification.status = 'read';
      }
    },

    async markAllAsRead() {
      await notificationApi.markAllAsRead();
      this.notifications.forEach(n => {
        n.isRead = true;
        n.status = 'read';
      });
    },

    subscribeToRealtime(): EventSource {
      const eventSource = new EventSource('/api/notifications/subscribe', {
        withCredentials: true,
      });

      eventSource.addEventListener('notification', (event) => {
        const notification = JSON.parse(event.data) as Notification;
        this.addNotification(notification);
        this.showToast(notification);
      });

      eventSource.onerror = () => {
        console.error('SSE connection error');
        // 重连逻辑
        setTimeout(() => {
          this.subscribeToRealtime();
        }, 5000);
      };

      return eventSource;
    },

    addNotification(notification: Notification) {
      this.notifications.unshift(notification);
      
      // 限制列表长度
      if (this.notifications.length > 100) {
        this.notifications = this.notifications.slice(0, 100);
      }
    },

    showToast(notification: Notification) {
      // 使用Toast显示通知
      const { $toast } = useNuxtApp();
      $toast.info(notification.title, {
        description: notification.content,
        action: notification.actionUrl
          ? {
              label: '查看',
              onClick: () => router.push(notification.actionUrl),
            }
          : undefined,
      });
    },
  },
});
```

---

## 📱 推送渠道

### 应用内通知（SSE）

使用Server-Sent Events实现实时推送：

```typescript
// apps/api/src/notification/infrastructure/sse/sse.service.ts
@Injectable()
export class SSEService {
  private connections = new Map<string, Response>();

  subscribe(userId: string, response: Response): void {
    this.connections.set(userId, response);

    // 设置SSE响应头
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // 发送初始连接消息
    this.sendEvent(userId, 'connected', { timestamp: new Date() });

    // 心跳检测
    const heartbeat = setInterval(() => {
      this.sendEvent(userId, 'heartbeat', { timestamp: new Date() });
    }, 30000);

    // 连接关闭时清理
    response.on('close', () => {
      clearInterval(heartbeat);
      this.connections.delete(userId);
    });
  }

  push(userId: string, data: any): void {
    this.sendEvent(userId, 'notification', data);
  }

  private sendEvent(userId: string, event: string, data: any): void {
    const response = this.connections.get(userId);
    if (!response) return;

    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
```

### 邮件通知

```typescript
// apps/api/src/notification/infrastructure/email/email.service.ts
@Injectable()
export class EmailService {
  constructor(private readonly mailer: MailerService) {}

  async send(options: EmailOptions): Promise<void> {
    await this.mailer.sendMail({
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
  }

  renderTemplate(template: string, data: any): string {
    // 使用模板引擎渲染
    return ejs.render(template, data);
  }
}
```

### 推送通知（FCM）

```typescript
// apps/api/src/notification/infrastructure/fcm/fcm.service.ts
@Injectable()
export class FCMService {
  constructor(private readonly admin: admin.app.App) {}

  async send(options: PushOptions): Promise<void> {
    await this.admin.messaging().send({
      token: options.token,
      notification: {
        title: options.title,
        body: options.body,
        imageUrl: options.icon,
      },
      data: options.data,
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    });
  }
}
```

---

## 📝 消息模板

### 模板系统

```typescript
// 通知模板管理
export class NotificationTemplateService {
  private templates = new Map<string, NotificationTemplate>();

  constructor() {
    this.loadTemplates();
  }

  getTemplate(type: string): NotificationTemplate {
    return this.templates.get(type);
  }

  render(template: NotificationTemplate, data: any): string {
    return template.content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] || '';
    });
  }

  private loadTemplates(): void {
    this.templates.set('goal_completed', {
      title: '🎉 目标已完成',
      content: '恭喜！你已完成目标"{{goalTitle}}"',
      priority: NotificationPriority.HIGH,
    });

    this.templates.set('task_assigned', {
      title: '📋 新任务分配',
      content: '{{assignerName}}给你分配了任务"{{taskTitle}}"',
      priority: NotificationPriority.NORMAL,
    });

    // ... 更多模板
  }
}
```

---

## 📚 相关文档

- [[modules/reminder/README|提醒模块]] - 提醒触发通知
- [[concepts/event-driven|事件驱动架构]]
- [[architecture/integration-architecture|集成架构]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
