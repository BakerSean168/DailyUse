# Story 13.44: Notification 模块 IPC Client 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.44 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 3h |
| 前置依赖 | Story 13.43 (Notification Main Handler) |
| 关联模块 | Notification |

## 目标

实现 Notification 模块的渲染进程 IPC Client，提供类型安全的通知管理接口。

## 任务列表

### 1. 创建 NotificationIPCClient 类 (1.5h)
- [ ] 核心通知方法
- [ ] 历史管理方法
- [ ] 设置管理方法
- [ ] 事件监听

### 2. 实现 Hooks (1h)
- [ ] useNotifications hook
- [ ] useNotificationSettings hook

### 3. 类型定义与导出 (0.5h)
- [ ] 完整类型定义
- [ ] 模块导出

## 技术规范

### Notification IPC Client
```typescript
// renderer/modules/notification/infrastructure/ipc/notification-ipc-client.ts
import { BaseIPCClient } from '@/infrastructure/ipc';

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
  timeout?: number;
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
    start: string;
    end: string;
  };
  categorySettings: Record<NotificationType, {
    enabled: boolean;
    sound: boolean;
    systemNotification: boolean;
  }>;
}

export interface NotificationHistoryOptions {
  limit?: number;
  offset?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
}

export interface NotificationHistoryResult {
  notifications: NotificationRecord[];
  total: number;
}

// Event types
export interface NotificationEvents {
  received: NotificationRecord;
  clicked: { id: string };
  action: { id: string; actionId: string };
  dismissed: string;
  'all-dismissed': void;
  'dnd-changed': boolean;
}

class NotificationIPCClient extends BaseIPCClient {
  constructor() {
    super('notification');
  }

  // Core notification methods
  async show(payload: NotificationPayload): Promise<NotificationRecord> {
    return this.invoke<NotificationRecord>('show', payload);
  }

  async showSystem(payload: NotificationPayload): Promise<void> {
    return this.invoke<void>('show-system', payload);
  }

  async dismiss(notificationId: string): Promise<void> {
    return this.invoke<void>('dismiss', notificationId);
  }

  async dismissAll(): Promise<void> {
    return this.invoke<void>('dismiss-all');
  }

  // Convenience methods for different notification types
  async info(title: string, body: string, options?: Partial<NotificationPayload>): Promise<NotificationRecord> {
    return this.show({ type: 'info', title, body, ...options });
  }

  async success(title: string, body: string, options?: Partial<NotificationPayload>): Promise<NotificationRecord> {
    return this.show({ type: 'success', title, body, ...options });
  }

  async warning(title: string, body: string, options?: Partial<NotificationPayload>): Promise<NotificationRecord> {
    return this.show({ type: 'warning', title, body, priority: 'high', ...options });
  }

  async error(title: string, body: string, options?: Partial<NotificationPayload>): Promise<NotificationRecord> {
    return this.show({ type: 'error', title, body, priority: 'high', ...options });
  }

  async reminder(title: string, body: string, options?: Partial<NotificationPayload>): Promise<NotificationRecord> {
    return this.show({
      type: 'reminder',
      title,
      body,
      priority: 'high',
      requireInteraction: true,
      ...options,
    });
  }

  // History methods
  async getHistory(options?: NotificationHistoryOptions): Promise<NotificationHistoryResult> {
    return this.invoke<NotificationHistoryResult>('get-history', options);
  }

  async markRead(notificationId: string): Promise<void> {
    return this.invoke<void>('mark-read', notificationId);
  }

  async markAllRead(): Promise<void> {
    return this.invoke<void>('mark-all-read');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    return this.invoke<void>('delete', notificationId);
  }

  async clearHistory(): Promise<void> {
    return this.invoke<void>('clear-history');
  }

  async getUnreadCount(): Promise<number> {
    return this.invoke<number>('get-unread-count');
  }

  // Settings methods
  async getSettings(): Promise<NotificationSettings> {
    return this.invoke<NotificationSettings>('get-settings');
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return this.invoke<NotificationSettings>('update-settings', settings);
  }

  async toggleDoNotDisturb(enabled?: boolean): Promise<boolean> {
    return this.invoke<boolean>('toggle-dnd', enabled);
  }

  // Badge
  async updateBadge(count: number): Promise<void> {
    return this.invoke<void>('update-badge', count);
  }

  // Event listeners with typed callbacks
  onReceived(callback: (notification: NotificationRecord) => void): () => void {
    return this.on('received', callback);
  }

  onClicked(callback: (data: { id: string }) => void): () => void {
    return this.on('clicked', callback);
  }

  onAction(callback: (data: { id: string; actionId: string }) => void): () => void {
    return this.on('action', callback);
  }

  onDismissed(callback: (notificationId: string) => void): () => void {
    return this.on('dismissed', callback);
  }

  onAllDismissed(callback: () => void): () => void {
    return this.on('all-dismissed', callback);
  }

  onDNDChanged(callback: (enabled: boolean) => void): () => void {
    return this.on('dnd-changed', callback);
  }
}

export const notificationIPCClient = new NotificationIPCClient();
```

### useNotifications Hook
```typescript
// renderer/modules/notification/infrastructure/ipc/use-notifications.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  notificationIPCClient,
  type NotificationRecord,
  type NotificationHistoryOptions,
} from './notification-ipc-client';

export interface UseNotificationsOptions {
  autoLoad?: boolean;
  limit?: number;
  unreadOnly?: boolean;
}

export interface UseNotificationsReturn {
  notifications: NotificationRecord[];
  total: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoLoad = true, limit = 20, unreadOnly = false } = options;

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const loadNotifications = useCallback(
    async (append = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await notificationIPCClient.getHistory({
          limit,
          offset: append ? offsetRef.current : 0,
          unreadOnly,
        });

        if (append) {
          setNotifications((prev) => [...prev, ...result.notifications]);
        } else {
          setNotifications(result.notifications);
          offsetRef.current = 0;
        }

        setTotal(result.total);
        offsetRef.current += result.notifications.length;

        const count = await notificationIPCClient.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    },
    [limit, unreadOnly]
  );

  const loadMore = useCallback(async () => {
    if (notifications.length < total) {
      await loadNotifications(true);
    }
  }, [loadNotifications, notifications.length, total]);

  const refresh = useCallback(async () => {
    await loadNotifications(false);
  }, [loadNotifications]);

  const markRead = useCallback(async (id: string) => {
    await notificationIPCClient.markRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationIPCClient.markAllRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  const dismiss = useCallback(async (id: string) => {
    await notificationIPCClient.dismiss(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => prev - 1);
  }, []);

  const dismissAll = useCallback(async () => {
    await notificationIPCClient.dismissAll();
    setNotifications([]);
    setTotal(0);
    setUnreadCount(0);
  }, []);

  const clearHistory = useCallback(async () => {
    await notificationIPCClient.clearHistory();
    setNotifications([]);
    setTotal(0);
    setUnreadCount(0);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadNotifications(false);
    }
  }, [autoLoad, loadNotifications]);

  // Listen for new notifications
  useEffect(() => {
    const unsubReceived = notificationIPCClient.onReceived((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setTotal((prev) => prev + 1);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    const unsubDismissed = notificationIPCClient.onDismissed((id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });

    return () => {
      unsubReceived();
      unsubDismissed();
    };
  }, []);

  return {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    loadMore,
    refresh,
    markRead,
    markAllRead,
    dismiss,
    dismissAll,
    clearHistory,
  };
}
```

### useNotificationSettings Hook
```typescript
// renderer/modules/notification/infrastructure/ipc/use-notification-settings.ts
import { useState, useEffect, useCallback } from 'react';
import {
  notificationIPCClient,
  type NotificationSettings,
  type NotificationType,
} from './notification-ipc-client';

export interface UseNotificationSettingsReturn {
  settings: NotificationSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleEnabled: () => Promise<void>;
  toggleSystemNotifications: () => Promise<void>;
  toggleSound: () => Promise<void>;
  toggleDND: () => Promise<void>;
  updateCategorySettings: (
    type: NotificationType,
    settings: Partial<NotificationSettings['categorySettings'][NotificationType]>
  ) => Promise<void>;
  updateDNDSchedule: (schedule: NonNullable<NotificationSettings['doNotDisturbSchedule']>) => Promise<void>;
}

export function useNotificationSettings(): UseNotificationSettingsReturn {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationIPCClient.getSettings();
      setSettings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Listen for DND changes
  useEffect(() => {
    const unsubscribe = notificationIPCClient.onDNDChanged((enabled) => {
      setSettings((prev) =>
        prev ? { ...prev, doNotDisturb: enabled } : null
      );
    });

    return unsubscribe;
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updated = await notificationIPCClient.updateSettings(newSettings);
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, []);

  const toggleEnabled = useCallback(async () => {
    if (settings) {
      await updateSettings({ enabled: !settings.enabled });
    }
  }, [settings, updateSettings]);

  const toggleSystemNotifications = useCallback(async () => {
    if (settings) {
      await updateSettings({ systemNotifications: !settings.systemNotifications });
    }
  }, [settings, updateSettings]);

  const toggleSound = useCallback(async () => {
    if (settings) {
      await updateSettings({ soundEnabled: !settings.soundEnabled });
    }
  }, [settings, updateSettings]);

  const toggleDND = useCallback(async () => {
    await notificationIPCClient.toggleDoNotDisturb();
  }, []);

  const updateCategorySettings = useCallback(
    async (
      type: NotificationType,
      categorySettings: Partial<NotificationSettings['categorySettings'][NotificationType]>
    ) => {
      if (settings) {
        await updateSettings({
          categorySettings: {
            ...settings.categorySettings,
            [type]: {
              ...settings.categorySettings[type],
              ...categorySettings,
            },
          },
        });
      }
    },
    [settings, updateSettings]
  );

  const updateDNDSchedule = useCallback(
    async (schedule: NonNullable<NotificationSettings['doNotDisturbSchedule']>) => {
      await updateSettings({ doNotDisturbSchedule: schedule });
    },
    [updateSettings]
  );

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    toggleEnabled,
    toggleSystemNotifications,
    toggleSound,
    toggleDND,
    updateCategorySettings,
    updateDNDSchedule,
  };
}
```

### Index Export
```typescript
// renderer/modules/notification/infrastructure/ipc/index.ts
export { notificationIPCClient } from './notification-ipc-client';
export type {
  NotificationType,
  NotificationPriority,
  NotificationPayload,
  NotificationRecord,
  NotificationSettings,
  NotificationHistoryOptions,
  NotificationHistoryResult,
  NotificationEvents,
} from './notification-ipc-client';

export {
  useNotifications,
  type UseNotificationsOptions,
  type UseNotificationsReturn,
} from './use-notifications';

export {
  useNotificationSettings,
  type UseNotificationSettingsReturn,
} from './use-notification-settings';
```

## 验收标准

- [ ] IPC Client 正确封装所有通道
- [ ] 便捷方法 (info, success, warning, error) 正常工作
- [ ] 事件监听正确注册和清理
- [ ] useNotifications hook 功能完整
- [ ] useNotificationSettings hook 功能完整
- [ ] 分页加载正常工作
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/notification/infrastructure/ipc/notification-ipc-client.ts`
- `renderer/modules/notification/infrastructure/ipc/use-notifications.ts`
- `renderer/modules/notification/infrastructure/ipc/use-notification-settings.ts`
- `renderer/modules/notification/infrastructure/ipc/index.ts`
