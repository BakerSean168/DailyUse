# STORY-006: Notification 模块重构

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 2  
> **预估**: 8 小时  
> **优先级**: P0  
> **依赖**: STORY-001, STORY-005

---

## 📋 概述

Desktop 已有一个 `notification.service.ts`，但它没有遵循 DDD 架构模式。
需要重构为符合模块化架构的实现，并整合原生通知和应用内通知。

---

## 🎯 目标

1. 重构现有 notification.service.ts 为模块化架构
2. 复用 `@dailyuse/application-server/notification` 的服务
3. 整合 Electron 原生通知和应用内通知中心

---

## ✅ 验收标准 (AC)

### AC-1: 应用内通知
```gherkin
Given Notification IPC channels
When 调用以下 channels:
  - notification:list
  - notification:get
  - notification:mark-read
  - notification:mark-all-read
  - notification:delete
  - notification:clear-all
Then 应正确管理应用内通知队列
```

### AC-2: 原生通知
```gherkin
Given 触发通知事件
When eventBus 发出 notification.show 事件
Then 应显示系统原生通知
And 点击通知应激活应用窗口
```

### AC-3: 通知偏好设置
```gherkin
Given 用户设置通知偏好
When 调用 notification:settings:update
Then 应更新通知行为（声音、静默时段等）
```

---

## 📁 任务清单

### Task 6.1: 分析现有 notification.service.ts

**现有文件**: `apps/desktop/src/main/services/notification.service.ts`

需要分析并提取可复用逻辑。

### Task 6.2: 创建 NotificationDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/notification/application/NotificationDesktopApplicationService.ts`

```typescript
/**
 * Notification Desktop Application Service
 */

import {
  NotificationService,
  NotificationPreferencesService,
} from '@dailyuse/application-server';
import { Notification, BrowserWindow } from 'electron';
import { eventBus, createLogger } from '@dailyuse/utils';
import type {
  NotificationClientDTO,
  NotificationPreferencesClientDTO,
} from '@dailyuse/contracts/notification';

const logger = createLogger('NotificationDesktopAppService');

export interface InAppNotification {
  uuid: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  title: string;
  body?: string;
  icon?: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationDesktopApplicationService {
  private notifications: InAppNotification[] = [];
  private mainWindow: BrowserWindow | null = null;
  private preferences: NotificationPreferencesClientDTO = {
    soundEnabled: true,
    nativeEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    groupByType: true,
  };

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  // ===== In-App Notifications =====

  async addNotification(notification: Omit<InAppNotification, 'uuid' | 'timestamp' | 'read'>): Promise<InAppNotification> {
    const newNotification: InAppNotification = {
      ...notification,
      uuid: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    
    // 限制通知数量
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // 通知渲染进程
    this.sendToRenderer('notification:new', newNotification);

    // 如果启用原生通知且不在静默时段
    if (this.preferences.nativeEnabled && !this.isInQuietHours()) {
      this.showNativeNotification(newNotification);
    }

    logger.info('Notification added', { uuid: newNotification.uuid });
    return newNotification;
  }

  async listNotifications(params?: {
    type?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    notifications: InAppNotification[];
    total: number;
    unreadCount: number;
  }> {
    let filtered = [...this.notifications];

    if (params?.type) {
      filtered = filtered.filter(n => n.type === params.type);
    }
    if (params?.read !== undefined) {
      filtered = filtered.filter(n => n.read === params.read);
    }

    const total = filtered.length;
    const offset = params?.offset || 0;
    const limit = params?.limit || 20;

    return {
      notifications: filtered.slice(offset, offset + limit),
      total,
      unreadCount: this.notifications.filter(n => !n.read).length,
    };
  }

  async getNotification(uuid: string): Promise<InAppNotification | null> {
    return this.notifications.find(n => n.uuid === uuid) ?? null;
  }

  async markAsRead(uuid: string): Promise<InAppNotification | null> {
    const notification = this.notifications.find(n => n.uuid === uuid);
    if (notification) {
      notification.read = true;
      this.sendToRenderer('notification:updated', notification);
    }
    return notification ?? null;
  }

  async markAllAsRead(): Promise<{ count: number }> {
    let count = 0;
    for (const n of this.notifications) {
      if (!n.read) {
        n.read = true;
        count++;
      }
    }
    this.sendToRenderer('notification:all-read', { count });
    return { count };
  }

  async deleteNotification(uuid: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.uuid === uuid);
    if (index >= 0) {
      this.notifications.splice(index, 1);
      this.sendToRenderer('notification:deleted', { uuid });
    }
  }

  async clearAll(): Promise<{ count: number }> {
    const count = this.notifications.length;
    this.notifications = [];
    this.sendToRenderer('notification:cleared', { count });
    return { count };
  }

  // ===== Native Notifications =====

  showNativeNotification(notification: InAppNotification): Notification | null {
    if (!Notification.isSupported()) {
      logger.warn('Native notifications not supported');
      return null;
    }

    const nativeNotification = new Notification({
      title: notification.title,
      body: notification.body || '',
      silent: !this.preferences.soundEnabled,
    });

    nativeNotification.on('click', () => {
      this.handleNativeNotificationClick(notification);
    });

    nativeNotification.show();
    return nativeNotification;
  }

  private handleNativeNotificationClick(notification: InAppNotification): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();

      // 如果有 actionUrl，发送导航事件
      if (notification.actionUrl) {
        this.sendToRenderer('notification:navigate', {
          uuid: notification.uuid,
          url: notification.actionUrl,
        });
      }
    }
  }

  // ===== Preferences =====

  async getPreferences(): Promise<NotificationPreferencesClientDTO> {
    return { ...this.preferences };
  }

  async updatePreferences(updates: Partial<NotificationPreferencesClientDTO>): Promise<NotificationPreferencesClientDTO> {
    this.preferences = { ...this.preferences, ...updates };
    logger.info('Notification preferences updated', this.preferences);
    return this.preferences;
  }

  // ===== Helpers =====

  private isInQuietHours(): boolean {
    if (!this.preferences.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { quietHoursStart, quietHoursEnd } = this.preferences;

    // 简化的静默时段判断（跨午夜）
    if (quietHoursStart <= quietHoursEnd) {
      return currentTime >= quietHoursStart && currentTime <= quietHoursEnd;
    } else {
      return currentTime >= quietHoursStart || currentTime <= quietHoursEnd;
    }
  }

  private sendToRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  // ===== Event Integration =====

  initEventListeners(): void {
    // 监听来自其他模块的通知请求
    eventBus.on('notification.show', (data: {
      type: InAppNotification['type'];
      title: string;
      body?: string;
      actionUrl?: string;
    }) => {
      this.addNotification(data);
    });

    // 监听提醒触发
    eventBus.on('reminder.triggered', (data: {
      uuid: string;
      title: string;
      body?: string;
    }) => {
      this.addNotification({
        type: 'reminder',
        title: data.title,
        body: data.body,
        actionUrl: `/reminders/${data.uuid}`,
        metadata: { reminderUuid: data.uuid },
      });
    });

    // 监听任务提醒
    eventBus.on('task.due', (data: {
      uuid: string;
      title: string;
    }) => {
      this.addNotification({
        type: 'warning',
        title: `Task Due: ${data.title}`,
        actionUrl: `/tasks/${data.uuid}`,
        metadata: { taskUuid: data.uuid },
      });
    });

    logger.info('Notification event listeners initialized');
  }
}
```

### Task 6.3: 创建 Notification IPC Handlers

**文件**: `apps/desktop/src/main/modules/notification/ipc/notification.ipc-handlers.ts`

```typescript
/**
 * Notification IPC Handlers
 */

import { ipcMain } from 'electron';
import { NotificationDesktopApplicationService } from '../application/NotificationDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationIPC');

let appService: NotificationDesktopApplicationService | null = null;

export function getNotificationAppService(): NotificationDesktopApplicationService {
  if (!appService) {
    appService = new NotificationDesktopApplicationService();
  }
  return appService;
}

export function registerNotificationIpcHandlers(): void {
  // List notifications
  ipcMain.handle('notification:list', async (_, params) => {
    try {
      return await getNotificationAppService().listNotifications(params);
    } catch (error) {
      logger.error('Failed to list notifications', error);
      throw error;
    }
  });

  // Get single notification
  ipcMain.handle('notification:get', async (_, uuid) => {
    try {
      return await getNotificationAppService().getNotification(uuid);
    } catch (error) {
      logger.error('Failed to get notification', error);
      throw error;
    }
  });

  // Mark as read
  ipcMain.handle('notification:mark-read', async (_, uuid) => {
    try {
      return await getNotificationAppService().markAsRead(uuid);
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
      throw error;
    }
  });

  // Mark all as read
  ipcMain.handle('notification:mark-all-read', async () => {
    try {
      return await getNotificationAppService().markAllAsRead();
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error);
      throw error;
    }
  });

  // Delete notification
  ipcMain.handle('notification:delete', async (_, uuid) => {
    try {
      await getNotificationAppService().deleteNotification(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete notification', error);
      throw error;
    }
  });

  // Clear all notifications
  ipcMain.handle('notification:clear-all', async () => {
    try {
      return await getNotificationAppService().clearAll();
    } catch (error) {
      logger.error('Failed to clear all notifications', error);
      throw error;
    }
  });

  // Get preferences
  ipcMain.handle('notification:settings:get', async () => {
    try {
      return await getNotificationAppService().getPreferences();
    } catch (error) {
      logger.error('Failed to get notification preferences', error);
      throw error;
    }
  });

  // Update preferences
  ipcMain.handle('notification:settings:update', async (_, updates) => {
    try {
      return await getNotificationAppService().updatePreferences(updates);
    } catch (error) {
      logger.error('Failed to update notification preferences', error);
      throw error;
    }
  });

  // Trigger native notification (for testing)
  ipcMain.handle('notification:show-native', async (_, data) => {
    try {
      const notification = await getNotificationAppService().addNotification({
        type: data.type || 'info',
        title: data.title,
        body: data.body,
        actionUrl: data.actionUrl,
      });
      return notification;
    } catch (error) {
      logger.error('Failed to show native notification', error);
      throw error;
    }
  });

  logger.info('Notification IPC handlers registered');
}
```

### Task 6.4: 创建模块入口

**文件**: `apps/desktop/src/main/modules/notification/index.ts`

```typescript
/**
 * Notification Module - Desktop Main Process
 */

import { BrowserWindow } from 'electron';
import { registerNotificationIpcHandlers, getNotificationAppService } from './ipc/notification.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationModule');

export function registerNotificationModule(): void {
  InitializationManager.getInstance().registerModule(
    'notification',
    InitializationPhase.CORE_SERVICES,
    async () => {
      // 注册 IPC handlers
      registerNotificationIpcHandlers();

      // 初始化事件监听
      const appService = getNotificationAppService();
      appService.initEventListeners();

      logger.info('Notification module initialized');
    }
  );
}

/**
 * 设置主窗口引用（需要在窗口创建后调用）
 */
export function setNotificationMainWindow(window: BrowserWindow): void {
  getNotificationAppService().setMainWindow(window);
}

export { NotificationDesktopApplicationService } from './application/NotificationDesktopApplicationService';
export { getNotificationAppService } from './ipc/notification.ipc-handlers';
```

### Task 6.5: 删除旧的 notification.service.ts

完成新模块后，删除旧文件：
- `apps/desktop/src/main/services/notification.service.ts`

并更新所有引用点。

---

## 📚 技术上下文

### 现有 notification.service.ts 功能

需要先读取分析现有实现，保留有用逻辑。

### 与 Reminder 模块的集成

- Reminder 模块通过 eventBus 发送 `reminder.triggered` 事件
- Notification 模块监听该事件并创建应用内通知
- 根据用户偏好决定是否显示原生通知

---

## 🔗 依赖关系

- **依赖**: 
  - STORY-001 (基础设施)
  - STORY-005 (Reminder 模块 - 事件集成)
- **被依赖**: 
  - STORY-007 (Dashboard 显示通知计数)

---

## 📝 备注

- 需要处理 Electron 原生 Notification API 的平台差异
- 静默时段功能需要与系统设置保持一致（可选）
- 考虑添加通知分组功能以减少视觉干扰
