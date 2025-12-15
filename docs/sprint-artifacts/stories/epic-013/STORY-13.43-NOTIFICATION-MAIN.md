# Story 13.43: Notification 模块主进程 Handler 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.43 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.03 (IPC Infrastructure) |
| 关联模块 | Notification |

## 目标

实现 Notification 模块的主进程 Handler，提供应用内通知、系统通知、通知历史和通知设置管理。

## 任务列表

### 1. 创建 Notification Handler (2h)
- [ ] 基础结构设计
- [ ] IPC 通道注册
- [ ] 通知队列管理

### 2. 实现通知功能 (2h)
- [ ] 应用内通知
- [ ] 系统通知集成
- [ ] 通知优先级处理

### 3. 实现通知历史 (1h)
- [ ] 历史记录存储
- [ ] 已读状态管理
- [ ] 历史查询

### 4. 实现通知设置 (1h)
- [ ] 通知偏好设置
- [ ] 勿扰模式
- [ ] 通知分类配置

## 技术规范

### Notification Handler
```typescript
// main/modules/notification/notification-handler.ts
import { ipcMain, BrowserWindow, Notification, nativeImage, app } from 'electron';
import { db } from '@/infrastructure/database';
import { logger } from '@/infrastructure/logger';
import { nanoid } from 'nanoid';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'task' | 'goal';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPayload {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  priority?: NotificationPriority;
  icon?: string;
  actions?: Array<{
    id: string;
    label: string;
  }>;
  data?: Record<string, any>;
  silent?: boolean;
  requireInteraction?: boolean;
  timeout?: number; // milliseconds
}

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  read: boolean;
  dismissed: boolean;
  actionTaken?: string;
  data?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  systemNotifications: boolean;
  soundEnabled: boolean;
  doNotDisturb: boolean;
  doNotDisturbSchedule?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
  };
  categorySettings: Record<NotificationType, {
    enabled: boolean;
    sound: boolean;
    systemNotification: boolean;
  }>;
}

class NotificationHandler {
  private mainWindow: BrowserWindow | null = null;
  private notificationQueue: NotificationPayload[] = [];
  private settings: NotificationSettings | null = null;
  private activeNotifications: Map<string, Notification> = new Map();

  register(): void {
    // Core notification
    ipcMain.handle('notification:show', this.showNotification.bind(this));
    ipcMain.handle('notification:show-system', this.showSystemNotification.bind(this));
    ipcMain.handle('notification:dismiss', this.dismissNotification.bind(this));
    ipcMain.handle('notification:dismiss-all', this.dismissAllNotifications.bind(this));

    // History
    ipcMain.handle('notification:get-history', this.getHistory.bind(this));
    ipcMain.handle('notification:mark-read', this.markRead.bind(this));
    ipcMain.handle('notification:mark-all-read', this.markAllRead.bind(this));
    ipcMain.handle('notification:delete', this.deleteNotification.bind(this));
    ipcMain.handle('notification:clear-history', this.clearHistory.bind(this));
    ipcMain.handle('notification:get-unread-count', this.getUnreadCount.bind(this));

    // Settings
    ipcMain.handle('notification:get-settings', this.getSettings.bind(this));
    ipcMain.handle('notification:update-settings', this.updateSettings.bind(this));
    ipcMain.handle('notification:toggle-dnd', this.toggleDoNotDisturb.bind(this));

    // Badge (for dock/taskbar)
    ipcMain.handle('notification:update-badge', this.updateBadge.bind(this));

    logger.info('[NotificationHandler] Registered');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async initialize(): Promise<void> {
    // Load settings
    this.settings = await this.loadSettings();

    // Check for scheduled DND
    this.startDNDScheduleChecker();

    logger.info('[NotificationHandler] Initialized');
  }

  private async loadSettings(): Promise<NotificationSettings> {
    const saved = await db.appSettings.findUnique({
      where: { key: 'notification_settings' },
    });

    if (saved?.value) {
      return JSON.parse(saved.value);
    }

    // Default settings
    return {
      enabled: true,
      systemNotifications: true,
      soundEnabled: true,
      doNotDisturb: false,
      doNotDisturbSchedule: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      categorySettings: {
        info: { enabled: true, sound: false, systemNotification: false },
        success: { enabled: true, sound: true, systemNotification: false },
        warning: { enabled: true, sound: true, systemNotification: true },
        error: { enabled: true, sound: true, systemNotification: true },
        reminder: { enabled: true, sound: true, systemNotification: true },
        task: { enabled: true, sound: true, systemNotification: true },
        goal: { enabled: true, sound: true, systemNotification: true },
      },
    };
  }

  // Core notification methods
  private async showNotification(
    _: Electron.IpcMainInvokeEvent,
    payload: NotificationPayload
  ): Promise<NotificationRecord> {
    const id = payload.id || nanoid();
    const priority = payload.priority || 'normal';

    // Check if notifications are enabled and DND
    if (!this.settings?.enabled || this.isInDoNotDisturb()) {
      if (priority !== 'urgent') {
        // Queue non-urgent notifications during DND
        this.notificationQueue.push({ ...payload, id });
        return this.createRecord(id, payload, priority);
      }
    }

    // Check category settings
    const categoryConfig = this.settings?.categorySettings[payload.type];
    if (categoryConfig && !categoryConfig.enabled) {
      return this.createRecord(id, payload, priority);
    }

    // Save to history
    const record = await this.saveNotification(id, payload, priority);

    // Send to renderer for in-app notification
    this.mainWindow?.webContents.send('notification:received', record);

    // Show system notification if enabled
    if (
      this.settings?.systemNotifications &&
      categoryConfig?.systemNotification &&
      Notification.isSupported()
    ) {
      this.showNativeNotification(record, payload.actions);
    }

    return record;
  }

  private async showSystemNotification(
    _: Electron.IpcMainInvokeEvent,
    payload: NotificationPayload
  ): Promise<void> {
    if (!Notification.isSupported()) {
      logger.warn('[NotificationHandler] System notifications not supported');
      return;
    }

    const notification = new Notification({
      title: payload.title,
      body: payload.body,
      icon: payload.icon ? nativeImage.createFromPath(payload.icon) : undefined,
      silent: payload.silent || !this.settings?.soundEnabled,
      urgency: this.mapPriorityToUrgency(payload.priority),
    });

    const id = payload.id || nanoid();
    this.activeNotifications.set(id, notification);

    notification.on('click', () => {
      this.mainWindow?.show();
      this.mainWindow?.focus();
      this.mainWindow?.webContents.send('notification:clicked', {
        id,
        payload,
      });
      this.activeNotifications.delete(id);
    });

    notification.on('close', () => {
      this.activeNotifications.delete(id);
    });

    notification.on('action', (_, index) => {
      if (payload.actions && payload.actions[index]) {
        this.mainWindow?.webContents.send('notification:action', {
          id,
          actionId: payload.actions[index].id,
        });
      }
    });

    notification.show();

    // Auto-dismiss after timeout
    if (payload.timeout && !payload.requireInteraction) {
      setTimeout(() => {
        notification.close();
        this.activeNotifications.delete(id);
      }, payload.timeout);
    }
  }

  private showNativeNotification(
    record: NotificationRecord,
    actions?: NotificationPayload['actions']
  ): void {
    const notification = new Notification({
      title: record.title,
      body: record.body,
      silent: !this.settings?.soundEnabled,
      urgency: this.mapPriorityToUrgency(record.priority),
    });

    this.activeNotifications.set(record.id, notification);

    notification.on('click', () => {
      this.mainWindow?.show();
      this.mainWindow?.focus();
      this.markRead(null as any, record.id);
      this.mainWindow?.webContents.send('notification:clicked', {
        id: record.id,
      });
    });

    notification.show();
  }

  private async dismissNotification(
    _: Electron.IpcMainInvokeEvent,
    notificationId: string
  ): Promise<void> {
    await db.notification.update({
      where: { id: notificationId },
      data: { dismissed: true },
    });

    const notification = this.activeNotifications.get(notificationId);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(notificationId);
    }

    this.mainWindow?.webContents.send('notification:dismissed', notificationId);
  }

  private async dismissAllNotifications(): Promise<void> {
    await db.notification.updateMany({
      where: { dismissed: false },
      data: { dismissed: true },
    });

    for (const [id, notification] of this.activeNotifications) {
      notification.close();
    }
    this.activeNotifications.clear();

    this.mainWindow?.webContents.send('notification:all-dismissed');
  }

  // History methods
  private async getHistory(
    _: Electron.IpcMainInvokeEvent,
    options?: {
      limit?: number;
      offset?: number;
      type?: NotificationType;
      unreadOnly?: boolean;
    }
  ): Promise<{ notifications: NotificationRecord[]; total: number }> {
    const where: any = {};

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.unreadOnly) {
      where.read = false;
      where.dismissed = false;
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      db.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  private async markRead(
    _: Electron.IpcMainInvokeEvent,
    notificationId: string
  ): Promise<void> {
    await db.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date().toISOString(),
      },
    });

    this.updateBadgeCount();
  }

  private async markAllRead(): Promise<void> {
    await db.notification.updateMany({
      where: { read: false },
      data: {
        read: true,
        readAt: new Date().toISOString(),
      },
    });

    this.updateBadgeCount();
  }

  private async deleteNotification(
    _: Electron.IpcMainInvokeEvent,
    notificationId: string
  ): Promise<void> {
    await db.notification.delete({
      where: { id: notificationId },
    });
  }

  private async clearHistory(): Promise<void> {
    await db.notification.deleteMany({});
    this.updateBadgeCount();
  }

  private async getUnreadCount(): Promise<number> {
    return db.notification.count({
      where: {
        read: false,
        dismissed: false,
      },
    });
  }

  // Settings methods
  private async getSettings(): Promise<NotificationSettings> {
    return this.settings!;
  }

  private async updateSettings(
    _: Electron.IpcMainInvokeEvent,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    this.settings = { ...this.settings!, ...settings };

    await db.appSettings.upsert({
      where: { key: 'notification_settings' },
      update: { value: JSON.stringify(this.settings) },
      create: {
        key: 'notification_settings',
        value: JSON.stringify(this.settings),
      },
    });

    return this.settings;
  }

  private async toggleDoNotDisturb(
    _: Electron.IpcMainInvokeEvent,
    enabled?: boolean
  ): Promise<boolean> {
    const newValue = enabled ?? !this.settings?.doNotDisturb;
    this.settings = { ...this.settings!, doNotDisturb: newValue };

    await db.appSettings.upsert({
      where: { key: 'notification_settings' },
      update: { value: JSON.stringify(this.settings) },
      create: {
        key: 'notification_settings',
        value: JSON.stringify(this.settings),
      },
    });

    // Process queued notifications when DND is disabled
    if (!newValue) {
      this.processQueue();
    }

    this.mainWindow?.webContents.send('notification:dnd-changed', newValue);
    return newValue;
  }

  private async updateBadge(
    _: Electron.IpcMainInvokeEvent,
    count: number
  ): Promise<void> {
    if (process.platform === 'darwin') {
      app.dock.setBadge(count > 0 ? count.toString() : '');
    }
    // Windows badge is handled by BrowserWindow.setOverlayIcon
  }

  // Helper methods
  private async saveNotification(
    id: string,
    payload: NotificationPayload,
    priority: NotificationPriority
  ): Promise<NotificationRecord> {
    return db.notification.create({
      data: {
        id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        priority,
        read: false,
        dismissed: false,
        data: payload.data ? JSON.stringify(payload.data) : null,
        createdAt: new Date().toISOString(),
      },
    });
  }

  private createRecord(
    id: string,
    payload: NotificationPayload,
    priority: NotificationPriority
  ): NotificationRecord {
    return {
      id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      priority,
      read: false,
      dismissed: false,
      data: payload.data,
      createdAt: new Date().toISOString(),
    };
  }

  private isInDoNotDisturb(): boolean {
    if (!this.settings?.doNotDisturb) return false;
    if (!this.settings.doNotDisturbSchedule?.enabled) return true;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = this.settings.doNotDisturbSchedule;

    if (start <= end) {
      return currentTime >= start && currentTime < end;
    } else {
      return currentTime >= start || currentTime < end;
    }
  }

  private startDNDScheduleChecker(): void {
    // Check every minute
    setInterval(() => {
      if (this.settings?.doNotDisturbSchedule?.enabled) {
        const wasInDND = this.settings.doNotDisturb;
        const isNowInDND = this.isInDoNotDisturb();

        if (wasInDND !== isNowInDND) {
          this.mainWindow?.webContents.send('notification:dnd-changed', isNowInDND);
          if (!isNowInDND) {
            this.processQueue();
          }
        }
      }
    }, 60000);
  }

  private processQueue(): void {
    while (this.notificationQueue.length > 0) {
      const payload = this.notificationQueue.shift()!;
      this.showNotification(null as any, payload);
    }
  }

  private updateBadgeCount(): void {
    this.getUnreadCount().then((count) => {
      this.updateBadge(null as any, count);
    });
  }

  private mapPriorityToUrgency(
    priority?: NotificationPriority
  ): 'low' | 'normal' | 'critical' {
    switch (priority) {
      case 'low':
        return 'low';
      case 'urgent':
        return 'critical';
      default:
        return 'normal';
    }
  }

  // Public method to send notification from other handlers
  async notify(payload: NotificationPayload): Promise<NotificationRecord> {
    return this.showNotification(null as any, payload);
  }
}

export const notificationHandler = new NotificationHandler();
```

## 验收标准

- [ ] Notification Handler 正确注册所有 IPC 通道
- [ ] 应用内通知正确发送到渲染进程
- [ ] 系统通知正确显示
- [ ] 通知历史正确存储和查询
- [ ] 勿扰模式正常工作
- [ ] 通知设置正确保存
- [ ] Badge 更新正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/notification/notification-handler.ts`
- `main/modules/notification/index.ts`
