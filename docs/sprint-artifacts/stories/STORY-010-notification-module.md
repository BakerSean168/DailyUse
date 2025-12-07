# STORY-010: 通知模块

## 📋 Story 概述

**Story ID**: STORY-010  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P2 (增强体验)  
**预估工时**: 2-3 天  
**状态**: ✅ Completed  
**前置依赖**: STORY-002, STORY-003, STORY-004

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 收到系统原生通知提醒我的任务和日程  
**以便于** 即使不打开应用也不会错过重要事项  

---

## 📋 验收标准

### 功能验收 - 通知类型

- [ ] 日程提醒通知
- [ ] 任务截止提醒
- [ ] 目标进度提醒
- [ ] 系统消息通知

### 功能验收 - 通知交互

- [ ] 点击通知打开相关页面
- [ ] 通知快捷操作（完成、推迟）
- [ ] 通知历史记录
- [ ] 标记已读/全部已读

### 功能验收 - 通知设置

- [ ] 通知开关（总开关）
- [ ] 分类通知开关
- [ ] 免打扰时间设置
- [ ] 通知声音设置

### 技术验收

- [ ] 使用系统原生通知 API
- [ ] 通知调度（定时触发）
- [ ] 离线通知支持

---

## 📐 技术设计

### 文件结构

```
apps/desktop/src/
├── renderer/
│   └── views/
│       └── notifications/
│           ├── NotificationCenterView.vue  # 通知中心
│           ├── NotificationSettingsView.vue # 通知设置
│           └── components/
│               ├── NotificationList.vue    # 通知列表
│               ├── NotificationItem.vue    # 通知项
│               └── NotificationBadge.vue   # 未读徽章
│
├── shared/
│   └── composables/
│       ├── useNotifications.ts             # 通知逻辑
│       └── useNotificationSettings.ts      # 设置逻辑
│
└── main/
    └── modules/
        └── notification/
            ├── notificationManager.ts      # 通知管理器
            ├── notificationScheduler.ts    # 通知调度器
            └── notificationIpcHandlers.ts  # IPC 处理器
```

### 通知管理器

```typescript
// apps/desktop/src/main/modules/notification/notificationManager.ts
import { Notification, shell, nativeImage } from 'electron';
import path from 'node:path';

interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  type: 'schedule' | 'task' | 'goal' | 'system';
  targetRoute?: string;
  actions?: { type: 'complete' | 'snooze'; label: string }[];
}

export class NotificationManager {
  private static instance: NotificationManager;
  private mainWindow: BrowserWindow;
  
  static getInstance(mainWindow?: BrowserWindow): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(mainWindow!);
    }
    return NotificationManager.instance;
  }
  
  private constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }
  
  show(payload: NotificationPayload): void {
    const notification = new Notification({
      title: payload.title,
      body: payload.body,
      icon: this.getIconForType(payload.type),
      silent: false,
      urgency: 'normal',
    });
    
    // 点击通知
    notification.on('click', () => {
      // 激活窗口
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
      
      // 导航到目标页面
      if (payload.targetRoute) {
        this.mainWindow.webContents.send('navigate', payload.targetRoute);
      }
    });
    
    // 通知关闭
    notification.on('close', () => {
      // 记录通知已读
      this.mainWindow.webContents.send('notification:closed', payload.id);
    });
    
    notification.show();
  }
  
  private getIconForType(type: NotificationPayload['type']): string {
    const icons: Record<string, string> = {
      schedule: 'calendar.png',
      task: 'task.png',
      goal: 'goal.png',
      system: 'app.png',
    };
    
    return path.join(__dirname, 'assets', 'icons', icons[type] || 'app.png');
  }
}
```

### 通知调度器

```typescript
// apps/desktop/src/main/modules/notification/notificationScheduler.ts
import { container } from '../di/container';
import { ReminderRepository } from '@dailyuse/domain-server';

interface ScheduledNotification {
  id: string;
  triggerAt: Date;
  payload: NotificationPayload;
  timer?: NodeJS.Timeout;
}

export class NotificationScheduler {
  private scheduledNotifications = new Map<string, ScheduledNotification>();
  private notificationManager: NotificationManager;
  
  constructor(notificationManager: NotificationManager) {
    this.notificationManager = notificationManager;
  }
  
  async loadAndSchedule(): Promise<void> {
    const repo = container.resolve<ReminderRepository>('reminderRepository');
    const upcomingReminders = await repo.findUpcoming(24 * 60); // 24小时内
    
    for (const reminder of upcomingReminders) {
      this.schedule({
        id: reminder.id,
        triggerAt: reminder.scheduledAt,
        payload: {
          id: reminder.id,
          title: reminder.title,
          body: reminder.description || '',
          type: 'schedule',
          targetRoute: `/schedule/${reminder.scheduleId}`,
        },
      });
    }
  }
  
  schedule(notification: Omit<ScheduledNotification, 'timer'>): void {
    const now = Date.now();
    const triggerTime = notification.triggerAt.getTime();
    const delay = Math.max(0, triggerTime - now);
    
    // 取消之前的调度
    this.cancel(notification.id);
    
    const timer = setTimeout(() => {
      this.notificationManager.show(notification.payload);
      this.scheduledNotifications.delete(notification.id);
    }, delay);
    
    this.scheduledNotifications.set(notification.id, {
      ...notification,
      timer,
    });
  }
  
  cancel(id: string): void {
    const scheduled = this.scheduledNotifications.get(id);
    if (scheduled?.timer) {
      clearTimeout(scheduled.timer);
      this.scheduledNotifications.delete(id);
    }
  }
  
  cancelAll(): void {
    for (const [id] of this.scheduledNotifications) {
      this.cancel(id);
    }
  }
}
```

### Notification Composable

```typescript
// useNotifications.ts
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Notification } from '@dailyuse/contracts/notification';

export function useNotifications() {
  const router = useRouter();
  
  // State
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  
  // 加载通知
  async function loadNotifications() {
    loading.value = true;
    try {
      const result = await window.electronAPI.invoke<Notification[]>('notification:list');
      notifications.value = result;
      unreadCount.value = result.filter(n => !n.isRead).length;
    } finally {
      loading.value = false;
    }
  }
  
  // 标记已读
  async function markAsRead(id: string) {
    await window.electronAPI.invoke('notification:markRead', { id });
    
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }
  
  // 标记全部已读
  async function markAllAsRead() {
    await window.electronAPI.invoke('notification:markAllRead');
    
    notifications.value.forEach(n => n.isRead = true);
    unreadCount.value = 0;
  }
  
  // 清除通知
  async function clearNotification(id: string) {
    await window.electronAPI.invoke('notification:clear', { id });
    notifications.value = notifications.value.filter(n => n.id !== id);
  }
  
  // 监听新通知
  const handleNewNotification = (notification: Notification) => {
    notifications.value.unshift(notification);
    if (!notification.isRead) {
      unreadCount.value++;
    }
  };
  
  // 监听导航请求
  const handleNavigate = (route: string) => {
    router.push(route);
  };
  
  onMounted(() => {
    window.electronAPI.on('notification:new', handleNewNotification);
    window.electronAPI.on('navigate', handleNavigate);
    loadNotifications();
  });
  
  onUnmounted(() => {
    window.electronAPI.off('notification:new', handleNewNotification);
    window.electronAPI.off('navigate', handleNavigate);
  });
  
  return {
    notifications: computed(() => notifications.value),
    unreadCount: computed(() => unreadCount.value),
    loading: computed(() => loading.value),
    
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };
}
```

---

## 🏗️ 技术实现方案 (架构师补充)

> 本节由架构师 Agent 补充，提供详细技术实现指导

### 1. IPC 通道与服务映射 (8 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `notification:create` | NotificationService.create() | 创建通知 (应用内) |
| `notification:list` | NotificationService.list() | 列出通知 |
| `notification:get` | NotificationService.get() | 获取通知详情 |
| `notification:read` | NotificationService.markAsRead() | 标记已读 |
| `notification:readAll` | NotificationService.markAllAsRead() | 全部已读 |
| `notification:delete` | NotificationService.delete() | 删除通知 |
| `notification:batchDelete` | NotificationService.batchDelete() | 批量删除 |
| `notification:unreadCount` | NotificationService.getUnreadCount() | 未读数 |

### 2. 主进程事件 (Push to Renderer)

| 事件名 | 数据 | 触发场景 |
|-------|------|---------|
| `notification:new` | `NotificationPayload` | 新通知到达 |
| `notification:clicked` | `{ id, action }` | 用户点击系统通知 |
| `navigate` | `string` (route) | 通知点击后导航 |

### 3. 通知类型与优先级

```typescript
// packages/contracts/src/notification/notification.types.ts
export type NotificationType = 
  | 'reminder'     // 提醒触发
  | 'schedule'     // 日程通知
  | 'goal'         // 目标相关
  | 'task'         // 任务相关
  | 'system'       // 系统消息
  | 'ai';          // AI 建议

export type NotificationPriority = 
  | 'high'         // 紧急 (声音 + 震动模式)
  | 'normal'       // 正常
  | 'low';         // 静默

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  actions?: NotificationAction[];
  data?: Record<string, unknown>;
  targetRoute?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
}
```

### 4. 系统通知与应用内通知

```
┌─────────────────────────────────────────────────────────────────┐
│                     Main Process                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐      ┌──────────────────────────────────┐  │
│  │ ReminderService │      │       NotificationManager        │  │
│  │  (触发提醒)      │ ──▶  │  ┌────────────────────────────┐ │  │
│  └─────────────────┘      │  │  系统通知 (Electron API)   │ │  │
│                            │  │  new Notification(...)     │ │  │
│  ┌─────────────────┐      │  └────────────────────────────┘ │  │
│  │ ScheduleService │ ──▶  │  ┌────────────────────────────┐ │  │
│  │  (日程开始)      │      │  │  应用内通知                 │ │  │
│  └─────────────────┘      │  │  webContents.send(...)     │ │  │
│                            │  └────────────────────────────┘ │  │
│  ┌─────────────────┐      │  ┌────────────────────────────┐ │  │
│  │    AIService    │ ──▶  │  │  NotificationStore (持久化) │ │  │
│  │   (AI 建议)      │      │  │  better-sqlite3           │ │  │
│  └─────────────────┘      │  └────────────────────────────┘ │  │
│                            └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5. 免打扰模式实现

```typescript
// apps/desktop/src/main/services/do-not-disturb.service.ts
import { nativeTheme, powerMonitor } from 'electron';

interface DndSchedule {
  enabled: boolean;
  startHour: number;  // 0-23
  startMinute: number;
  endHour: number;
  endMinute: number;
  weekdays: number[]; // 0=Sunday, 1=Monday, ...
}

export class DoNotDisturbService {
  private schedule: DndSchedule | null = null;
  private manualDnd: boolean = false;

  setSchedule(schedule: DndSchedule): void {
    this.schedule = schedule;
  }

  toggleManual(enabled: boolean): void {
    this.manualDnd = enabled;
  }

  isActive(): boolean {
    if (this.manualDnd) return true;
    if (!this.schedule?.enabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.schedule.startHour * 60 + this.schedule.startMinute;
    const endMinutes = this.schedule.endHour * 60 + this.schedule.endMinute;
    const dayOfWeek = now.getDay();

    if (!this.schedule.weekdays.includes(dayOfWeek)) return false;

    // 处理跨午夜的情况
    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  shouldShowNotification(priority: NotificationPriority): boolean {
    if (!this.isActive()) return true;
    // 只有高优先级通知在 DND 模式下仍显示
    return priority === 'high';
  }
}
```

### 6. 通知权限检查

```typescript
// apps/desktop/src/main/services/notification-permission.ts
import { Notification } from 'electron';

export async function checkNotificationPermission(): Promise<{
  supported: boolean;
  granted: boolean;
}> {
  const supported = Notification.isSupported();
  
  if (!supported) {
    return { supported: false, granted: false };
  }

  // macOS 需要检查权限
  if (process.platform === 'darwin') {
    // Electron 会在首次创建 Notification 时请求权限
    // 目前无法预先检查，只能尝试创建
    return { supported: true, granted: true };
  }

  // Windows/Linux 通常不需要显式授权
  return { supported: true, granted: true };
}

export function requestNotificationPermission(): void {
  // 通过创建一个静默通知来触发权限请求
  if (process.platform === 'darwin') {
    const notification = new Notification({
      title: '',
      body: '',
      silent: true,
    });
    notification.close();
  }
}
```

### 7. 通知声音配置

```typescript
// apps/desktop/src/main/services/notification-sound.ts
import { app, shell } from 'electron';
import * as path from 'path';

const BUILT_IN_SOUNDS = {
  default: 'notification.wav',
  gentle: 'gentle.wav',
  urgent: 'urgent.wav',
  chime: 'chime.wav',
  none: null,
} as const;

export class NotificationSoundService {
  private soundsDir: string;
  private currentSound: keyof typeof BUILT_IN_SOUNDS = 'default';

  constructor() {
    this.soundsDir = path.join(app.getPath('userData'), 'sounds');
  }

  setSound(sound: keyof typeof BUILT_IN_SOUNDS): void {
    this.currentSound = sound;
  }

  getSoundPath(): string | null {
    const sound = BUILT_IN_SOUNDS[this.currentSound];
    if (!sound) return null;
    
    return path.join(this.soundsDir, sound);
  }

  async playSound(): Promise<void> {
    const soundPath = this.getSoundPath();
    if (!soundPath) return;

    // 使用 Electron 的 shell API 或 node 音频库播放
    // 简单实现: 打开系统播放器
    // await shell.openPath(soundPath);
    
    // 更好的实现: 使用 node-speaker 或类似库
  }
}
```

### 8. 设置持久化

```typescript
// 通知设置存储在 Settings 模块中
interface NotificationSettings {
  enabled: boolean;
  
  // 系统通知
  systemNotifications: boolean;
  showPreview: boolean;  // 显示通知内容预览
  
  // 声音
  soundEnabled: boolean;
  soundName: string;
  
  // 免打扰
  dndEnabled: boolean;
  dndSchedule: DndSchedule;
  
  // 按类型配置
  typeSettings: Record<NotificationType, {
    enabled: boolean;
    sound: boolean;
    priority: NotificationPriority;
  }>;
}

// IPC 通道
// setting:get - { key: 'notification' }
// setting:update - { key: 'notification', value: NotificationSettings }
```

### 9. 与 STORY-006 (Schedule/Reminder) 集成

```typescript
// Reminder 触发时调用 NotificationManager
// apps/desktop/src/main/handlers/reminder-ipc.handler.ts

import { NotificationManager } from '../services/notification-manager';

// 当 reminder 触发时
async function onReminderTriggered(reminder: Reminder) {
  const notificationManager = container.resolve<NotificationManager>('notificationManager');
  
  await notificationManager.show({
    id: `reminder-${reminder.id}`,
    type: 'reminder',
    priority: reminder.priority === 'urgent' ? 'high' : 'normal',
    title: reminder.title,
    body: reminder.description || '',
    targetRoute: `/schedule?reminder=${reminder.id}`,
    actions: [
      { id: 'snooze', label: '稍后提醒', type: 'secondary' },
      { id: 'complete', label: '完成', type: 'primary' },
    ],
  });
}

// 处理通知操作
notificationManager.on('action', async (notificationId, actionId) => {
  if (notificationId.startsWith('reminder-')) {
    const reminderId = notificationId.replace('reminder-', '');
    
    if (actionId === 'snooze') {
      // 5分钟后再次提醒
      await reminderService.snooze(reminderId, 5);
    } else if (actionId === 'complete') {
      await reminderService.complete(reminderId);
    }
  }
});
```

---

## 📝 Task 分解

### Task 10.1: 通知管理器 (1 天)

**子任务**:
- [ ] 实现 NotificationManager
- [ ] 实现 NotificationScheduler
- [ ] 注册 notification IPC handlers
- [ ] 集成 Reminder 数据源

### Task 10.2: 通知中心界面 (1 天)

**子任务**:
- [ ] 创建 NotificationCenterView.vue
- [ ] 创建 NotificationList.vue
- [ ] 创建 NotificationItem.vue
- [ ] 创建 NotificationBadge.vue
- [ ] 实现 useNotifications.ts

### Task 10.3: 通知设置 (0.5-1 天)

**子任务**:
- [ ] 创建 NotificationSettingsView.vue
- [ ] 实现 useNotificationSettings.ts
- [ ] 免打扰时间逻辑
- [ ] 通知声音配置

---

## 🔗 依赖关系

### 前置依赖

- ⏳ STORY-002/003/004 (基础架构)
- ⏳ STORY-006 (日程/提醒数据)

### 后续影响

- 🔜 用户体验提升

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 系统通知权限 | 中 | 中 | 引导用户授权 |
| 调度精度问题 | 低 | 低 | 使用 wake-up 机制 |

---

## ✅ 完成定义 (DoD)

- [ ] 系统通知正常工作
- [ ] 通知调度准确
- [ ] 通知中心显示正确
- [ ] 代码已提交并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Phase 3 (Week 6-7)
