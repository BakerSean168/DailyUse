# Story 13.45: Notification 模块 Store 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.45 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.44 (Notification IPC Client) |
| 关联模块 | Notification |

## 目标

实现 Notification 模块的 Zustand Store，统一管理通知状态、实时通知队列和设置。

## 任务列表

### 1. 创建 Notification Store (2h)
- [ ] 状态定义
- [ ] 通知队列管理
- [ ] 历史管理
- [ ] 设置同步

### 2. 实现 Toast 队列 (1h)
- [ ] Toast 添加/移除
- [ ] 自动消失
- [ ] 位置管理

### 3. 创建选择器和 Hooks (1h)
- [ ] 状态选择器
- [ ] 便捷 Hooks

## 技术规范

### Notification Store
```typescript
// renderer/modules/notification/store/notification-store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  notificationIPCClient,
  type NotificationRecord,
  type NotificationSettings,
  type NotificationPayload,
} from '../infrastructure/ipc';
import { nanoid } from 'nanoid';

// Toast is a lightweight in-app notification
export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number; // milliseconds, undefined = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export interface NotificationState {
  // Initialization
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Notifications history
  notifications: NotificationRecord[];
  total: number;
  unreadCount: number;

  // Toast queue (in-app notifications)
  toasts: Toast[];
  maxToasts: number;

  // Settings
  settings: NotificationSettings | null;
  doNotDisturb: boolean;

  // UI state
  isNotificationCenterOpen: boolean;
}

export interface NotificationActions {
  // Initialization
  initialize: () => Promise<void>;
  reset: () => void;

  // Notifications
  loadNotifications: (options?: { limit?: number; offset?: number }) => Promise<void>;
  loadMore: () => Promise<void>;
  showNotification: (payload: NotificationPayload) => Promise<NotificationRecord>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
  clearHistory: () => Promise<void>;

  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Settings
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleDND: () => Promise<void>;

  // UI
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  toggleNotificationCenter: () => void;
}

const initialState: NotificationState = {
  isInitialized: false,
  isLoading: false,
  error: null,
  notifications: [],
  total: 0,
  unreadCount: 0,
  toasts: [],
  maxToasts: 5,
  settings: null,
  doNotDisturb: false,
  isNotificationCenterOpen: false,
};

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Initialization
      initialize: async () => {
        if (get().isInitialized) return;

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Load settings and initial notifications
          await Promise.all([
            get().loadSettings(),
            get().loadNotifications({ limit: 20 }),
          ]);

          // Update unread count
          const count = await notificationIPCClient.getUnreadCount();
          set((state) => {
            state.unreadCount = count;
          });

          // Setup event listeners
          get().setupEventListeners();

          set((state) => {
            state.isInitialized = true;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Initialization failed';
            state.isLoading = false;
          });
        }
      },

      reset: () => {
        set(initialState);
      },

      // Notifications
      loadNotifications: async (options) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const result = await notificationIPCClient.getHistory(options);

          set((state) => {
            if (options?.offset && options.offset > 0) {
              state.notifications.push(...result.notifications);
            } else {
              state.notifications = result.notifications;
            }
            state.total = result.total;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to load';
            state.isLoading = false;
          });
        }
      },

      loadMore: async () => {
        const { notifications, total } = get();
        if (notifications.length >= total) return;

        await get().loadNotifications({
          limit: 20,
          offset: notifications.length,
        });
      },

      showNotification: async (payload) => {
        const record = await notificationIPCClient.show(payload);

        set((state) => {
          state.notifications.unshift(record);
          state.total += 1;
          if (!record.read) {
            state.unreadCount += 1;
          }
        });

        return record;
      },

      markRead: async (id) => {
        await notificationIPCClient.markRead(id);

        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        });
      },

      markAllRead: async () => {
        await notificationIPCClient.markAllRead();

        set((state) => {
          state.notifications.forEach((n) => {
            n.read = true;
            n.readAt = new Date().toISOString();
          });
          state.unreadCount = 0;
        });
      },

      dismiss: async (id) => {
        await notificationIPCClient.dismiss(id);

        set((state) => {
          const index = state.notifications.findIndex((n) => n.id === id);
          if (index !== -1) {
            const notification = state.notifications[index];
            if (!notification.read) {
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
            state.notifications.splice(index, 1);
            state.total -= 1;
          }
        });
      },

      dismissAll: async () => {
        await notificationIPCClient.dismissAll();

        set((state) => {
          state.notifications = [];
          state.total = 0;
          state.unreadCount = 0;
        });
      },

      clearHistory: async () => {
        await notificationIPCClient.clearHistory();

        set((state) => {
          state.notifications = [];
          state.total = 0;
          state.unreadCount = 0;
        });
      },

      // Toasts
      addToast: (toast) => {
        const id = nanoid();
        const newToast: Toast = { ...toast, id };

        set((state) => {
          // Remove oldest if at max
          if (state.toasts.length >= state.maxToasts) {
            state.toasts.shift();
          }
          state.toasts.push(newToast);
        });

        // Auto-remove after duration
        if (toast.duration !== undefined) {
          setTimeout(() => {
            get().removeToast(id);
          }, toast.duration || 5000);
        }

        return id;
      },

      removeToast: (id) => {
        set((state) => {
          const index = state.toasts.findIndex((t) => t.id === id);
          if (index !== -1) {
            const toast = state.toasts[index];
            toast.onDismiss?.();
            state.toasts.splice(index, 1);
          }
        });
      },

      clearToasts: () => {
        set((state) => {
          state.toasts.forEach((t) => t.onDismiss?.());
          state.toasts = [];
        });
      },

      // Settings
      loadSettings: async () => {
        const settings = await notificationIPCClient.getSettings();

        set((state) => {
          state.settings = settings;
          state.doNotDisturb = settings.doNotDisturb;
        });
      },

      updateSettings: async (newSettings) => {
        const updated = await notificationIPCClient.updateSettings(newSettings);

        set((state) => {
          state.settings = updated;
          state.doNotDisturb = updated.doNotDisturb;
        });
      },

      toggleDND: async () => {
        const newValue = await notificationIPCClient.toggleDoNotDisturb();

        set((state) => {
          state.doNotDisturb = newValue;
          if (state.settings) {
            state.settings.doNotDisturb = newValue;
          }
        });
      },

      // UI
      openNotificationCenter: () => {
        set((state) => {
          state.isNotificationCenterOpen = true;
        });
      },

      closeNotificationCenter: () => {
        set((state) => {
          state.isNotificationCenterOpen = false;
        });
      },

      toggleNotificationCenter: () => {
        set((state) => {
          state.isNotificationCenterOpen = !state.isNotificationCenterOpen;
        });
      },

      // Internal: Setup event listeners
      setupEventListeners: () => {
        notificationIPCClient.onReceived((notification) => {
          set((state) => {
            // Add to notifications list
            state.notifications.unshift(notification);
            state.total += 1;
            if (!notification.read) {
              state.unreadCount += 1;
            }
          });

          // Also show as toast
          get().addToast({
            type: notification.type === 'error' ? 'error' : notification.type === 'warning' ? 'warning' : 'info',
            title: notification.title,
            description: notification.body,
            duration: 5000,
          });
        });

        notificationIPCClient.onDismissed((id) => {
          set((state) => {
            const index = state.notifications.findIndex((n) => n.id === id);
            if (index !== -1) {
              state.notifications.splice(index, 1);
              state.total -= 1;
            }
          });
        });

        notificationIPCClient.onDNDChanged((enabled) => {
          set((state) => {
            state.doNotDisturb = enabled;
            if (state.settings) {
              state.settings.doNotDisturb = enabled;
            }
          });
        });
      },
    }))
  )
);
```

### Selectors
```typescript
// renderer/modules/notification/store/selectors.ts
import { useNotificationStore, type NotificationState, type Toast } from './notification-store';

export const notificationSelectors = {
  // Status
  hasUnread: (state: NotificationState) => state.unreadCount > 0,

  // Notifications by type
  getByType: (state: NotificationState) => (type: string) =>
    state.notifications.filter((n) => n.type === type),

  // Unread notifications
  unreadNotifications: (state: NotificationState) =>
    state.notifications.filter((n) => !n.read),

  // Recent notifications (last 5)
  recentNotifications: (state: NotificationState) =>
    state.notifications.slice(0, 5),

  // Toasts at position
  getToasts: (state: NotificationState) => state.toasts,

  // Can load more
  canLoadMore: (state: NotificationState) =>
    state.notifications.length < state.total,
};
```

### Hooks
```typescript
// renderer/modules/notification/store/hooks.ts
import { useCallback, useMemo } from 'react';
import { useNotificationStore, notificationSelectors, type Toast } from './index';

export function useNotificationCenter() {
  const store = useNotificationStore();

  return {
    isOpen: store.isNotificationCenterOpen,
    open: store.openNotificationCenter,
    close: store.closeNotificationCenter,
    toggle: store.toggleNotificationCenter,
  };
}

export function useUnreadCount() {
  return useNotificationStore((state) => state.unreadCount);
}

export function useDoNotDisturb() {
  const store = useNotificationStore();

  return {
    enabled: store.doNotDisturb,
    toggle: store.toggleDND,
  };
}

export function useToasts() {
  const store = useNotificationStore();

  const toast = useCallback(
    (options: Omit<Toast, 'id'>) => {
      return store.addToast(options);
    },
    [store]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      return store.addToast({
        type: 'success',
        title,
        description,
        duration: 5000,
      });
    },
    [store]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      return store.addToast({
        type: 'error',
        title,
        description,
        duration: 8000,
      });
    },
    [store]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      return store.addToast({
        type: 'warning',
        title,
        description,
        duration: 6000,
      });
    },
    [store]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      return store.addToast({
        type: 'info',
        title,
        description,
        duration: 5000,
      });
    },
    [store]
  );

  return {
    toasts: store.toasts,
    toast,
    success,
    error,
    warning,
    info,
    dismiss: store.removeToast,
    clear: store.clearToasts,
  };
}

export function useNotificationList() {
  const store = useNotificationStore();
  const canLoadMore = notificationSelectors.canLoadMore(store);

  return {
    notifications: store.notifications,
    total: store.total,
    isLoading: store.isLoading,
    canLoadMore,
    loadMore: store.loadMore,
    refresh: () => store.loadNotifications({ limit: 20 }),
    markRead: store.markRead,
    markAllRead: store.markAllRead,
    dismiss: store.dismiss,
    dismissAll: store.dismissAll,
    clearHistory: store.clearHistory,
  };
}

export function useNotify() {
  const store = useNotificationStore();

  const notify = useCallback(
    async (options: {
      type?: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'task' | 'goal';
      title: string;
      body: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }) => {
      return store.showNotification({
        type: options.type || 'info',
        title: options.title,
        body: options.body,
        priority: options.priority,
      });
    },
    [store]
  );

  return notify;
}
```

### Index Export
```typescript
// renderer/modules/notification/store/index.ts
export { useNotificationStore, type NotificationState, type NotificationActions, type Toast } from './notification-store';
export { notificationSelectors } from './selectors';
export {
  useNotificationCenter,
  useUnreadCount,
  useDoNotDisturb,
  useToasts,
  useNotificationList,
  useNotify,
} from './hooks';
```

## 验收标准

- [ ] Store 状态管理正确
- [ ] 通知列表正确更新
- [ ] Toast 队列管理正常
- [ ] 自动消失定时器正常
- [ ] 设置同步正确
- [ ] 事件监听正确
- [ ] Hooks 功能完整
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/notification/store/notification-store.ts`
- `renderer/modules/notification/store/selectors.ts`
- `renderer/modules/notification/store/hooks.ts`
- `renderer/modules/notification/store/index.ts`
