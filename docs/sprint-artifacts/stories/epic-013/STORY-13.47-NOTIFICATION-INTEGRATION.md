# Story 13.47: Notification 模块系统集成

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.47 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.46 (Notification UI) |
| 关联模块 | Notification |

## 目标

将通知模块与应用其他模块集成，实现全局通知触发、模块间通知协调和统一的通知体验。

## 任务列表

### 1. 创建通知服务集成 (1.5h)
- [ ] NotificationService 类
- [ ] 模块间通知触发
- [ ] 通知模板

### 2. 集成到 Layout (1h)
- [ ] Header 集成 NotificationBell
- [ ] ToastContainer 全局挂载
- [ ] 初始化逻辑

### 3. 创建通知 Hooks (1h)
- [ ] useNotifyTaskComplete
- [ ] useNotifyGoalProgress
- [ ] useNotifyReminder

### 4. 模块导出与文档 (0.5h)
- [ ] 完整模块导出
- [ ] 使用文档

## 技术规范

### Notification Service
```typescript
// renderer/modules/notification/services/notification-service.ts
import { notificationIPCClient, type NotificationPayload } from '../infrastructure/ipc';
import { useNotificationStore } from '../store';

export interface NotificationTemplate {
  type: NotificationPayload['type'];
  title: string;
  bodyTemplate: string;
  priority?: NotificationPayload['priority'];
  actions?: NotificationPayload['actions'];
}

// Pre-defined notification templates
const notificationTemplates: Record<string, NotificationTemplate> = {
  // Task notifications
  taskCompleted: {
    type: 'task',
    title: '任务完成',
    bodyTemplate: '你已完成任务: {{taskName}}',
    priority: 'normal',
  },
  taskDueSoon: {
    type: 'task',
    title: '任务即将到期',
    bodyTemplate: '任务 "{{taskName}}" 将在 {{timeLeft}} 后到期',
    priority: 'high',
  },
  taskOverdue: {
    type: 'task',
    title: '任务已过期',
    bodyTemplate: '任务 "{{taskName}}" 已过期',
    priority: 'urgent',
  },

  // Goal notifications
  goalProgress: {
    type: 'goal',
    title: '目标进度更新',
    bodyTemplate: '目标 "{{goalName}}" 进度: {{progress}}%',
    priority: 'normal',
  },
  goalCompleted: {
    type: 'goal',
    title: '🎉 目标达成',
    bodyTemplate: '恭喜! 你已完成目标: {{goalName}}',
    priority: 'high',
  },
  goalMilestone: {
    type: 'goal',
    title: '里程碑达成',
    bodyTemplate: '{{goalName}} 达成里程碑: {{milestoneName}}',
    priority: 'normal',
  },

  // Focus notifications
  focusStarted: {
    type: 'info',
    title: '专注开始',
    bodyTemplate: '开始 {{duration}} 分钟的专注时间',
    priority: 'low',
  },
  focusCompleted: {
    type: 'success',
    title: '专注完成',
    bodyTemplate: '完成了 {{duration}} 分钟的专注!',
    priority: 'normal',
  },
  focusBreakTime: {
    type: 'info',
    title: '休息时间',
    bodyTemplate: '专注结束，休息 {{breakDuration}} 分钟',
    priority: 'normal',
  },

  // Reminder notifications
  reminderTriggered: {
    type: 'reminder',
    title: '提醒',
    bodyTemplate: '{{reminderContent}}',
    priority: 'high',
    actions: [
      { id: 'snooze', label: '稍后提醒' },
      { id: 'dismiss', label: '关闭' },
    ],
  },

  // Schedule notifications
  eventSoon: {
    type: 'info',
    title: '即将开始',
    bodyTemplate: '{{eventName}} 将在 {{timeLeft}} 后开始',
    priority: 'normal',
  },

  // System notifications
  syncCompleted: {
    type: 'success',
    title: '同步完成',
    bodyTemplate: '数据已同步完成',
    priority: 'low',
  },
  syncError: {
    type: 'error',
    title: '同步失败',
    bodyTemplate: '数据同步失败: {{error}}',
    priority: 'high',
  },
};

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private applyTemplate(template: NotificationTemplate, variables: Record<string, string>): NotificationPayload {
    let body = template.bodyTemplate;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return {
      type: template.type,
      title: template.title,
      body,
      priority: template.priority,
      actions: template.actions,
    };
  }

  async notify(templateName: string, variables: Record<string, string> = {}): Promise<void> {
    const template = notificationTemplates[templateName];
    if (!template) {
      console.warn(`Unknown notification template: ${templateName}`);
      return;
    }

    const payload = this.applyTemplate(template, variables);
    await notificationIPCClient.show(payload);
  }

  // Quick methods for common notifications
  async taskCompleted(taskName: string): Promise<void> {
    await this.notify('taskCompleted', { taskName });
  }

  async taskDueSoon(taskName: string, timeLeft: string): Promise<void> {
    await this.notify('taskDueSoon', { taskName, timeLeft });
  }

  async taskOverdue(taskName: string): Promise<void> {
    await this.notify('taskOverdue', { taskName });
  }

  async goalProgress(goalName: string, progress: number): Promise<void> {
    await this.notify('goalProgress', {
      goalName,
      progress: progress.toString(),
    });
  }

  async goalCompleted(goalName: string): Promise<void> {
    await this.notify('goalCompleted', { goalName });
  }

  async goalMilestone(goalName: string, milestoneName: string): Promise<void> {
    await this.notify('goalMilestone', { goalName, milestoneName });
  }

  async focusStarted(duration: number): Promise<void> {
    await this.notify('focusStarted', { duration: duration.toString() });
  }

  async focusCompleted(duration: number): Promise<void> {
    await this.notify('focusCompleted', { duration: duration.toString() });
  }

  async focusBreakTime(breakDuration: number): Promise<void> {
    await this.notify('focusBreakTime', { breakDuration: breakDuration.toString() });
  }

  async reminder(content: string): Promise<void> {
    await this.notify('reminderTriggered', { reminderContent: content });
  }

  async eventSoon(eventName: string, timeLeft: string): Promise<void> {
    await this.notify('eventSoon', { eventName, timeLeft });
  }

  // Direct methods for custom notifications
  async info(title: string, body: string): Promise<void> {
    await notificationIPCClient.info(title, body);
  }

  async success(title: string, body: string): Promise<void> {
    await notificationIPCClient.success(title, body);
  }

  async warning(title: string, body: string): Promise<void> {
    await notificationIPCClient.warning(title, body);
  }

  async error(title: string, body: string): Promise<void> {
    await notificationIPCClient.error(title, body);
  }
}

export const notificationService = NotificationService.getInstance();
```

### Notification Hooks for Integration
```typescript
// renderer/modules/notification/hooks/use-notify.ts
import { useCallback } from 'react';
import { notificationService } from '../services/notification-service';
import { useToasts } from '../store';

// Hook for task-related notifications
export function useNotifyTask() {
  const { success } = useToasts();

  const notifyComplete = useCallback(async (taskName: string) => {
    await notificationService.taskCompleted(taskName);
    success('任务完成', taskName);
  }, [success]);

  const notifyDueSoon = useCallback(async (taskName: string, timeLeft: string) => {
    await notificationService.taskDueSoon(taskName, timeLeft);
  }, []);

  const notifyOverdue = useCallback(async (taskName: string) => {
    await notificationService.taskOverdue(taskName);
  }, []);

  return {
    notifyComplete,
    notifyDueSoon,
    notifyOverdue,
  };
}

// Hook for goal-related notifications
export function useNotifyGoal() {
  const { success, info } = useToasts();

  const notifyProgress = useCallback(async (goalName: string, progress: number) => {
    await notificationService.goalProgress(goalName, progress);
    if (progress === 100) {
      success('🎉 目标达成', goalName);
    }
  }, [success]);

  const notifyComplete = useCallback(async (goalName: string) => {
    await notificationService.goalCompleted(goalName);
    success('🎉 目标达成', goalName);
  }, [success]);

  const notifyMilestone = useCallback(async (goalName: string, milestoneName: string) => {
    await notificationService.goalMilestone(goalName, milestoneName);
    info('里程碑达成', `${goalName}: ${milestoneName}`);
  }, [info]);

  return {
    notifyProgress,
    notifyComplete,
    notifyMilestone,
  };
}

// Hook for focus-related notifications
export function useNotifyFocus() {
  const { info, success } = useToasts();

  const notifyStart = useCallback(async (duration: number) => {
    await notificationService.focusStarted(duration);
    info('专注开始', `${duration} 分钟`);
  }, [info]);

  const notifyComplete = useCallback(async (duration: number) => {
    await notificationService.focusCompleted(duration);
    success('专注完成', `${duration} 分钟`);
  }, [success]);

  const notifyBreak = useCallback(async (breakDuration: number) => {
    await notificationService.focusBreakTime(breakDuration);
    info('休息时间', `${breakDuration} 分钟`);
  }, [info]);

  return {
    notifyStart,
    notifyComplete,
    notifyBreak,
  };
}

// Hook for reminder notifications
export function useNotifyReminder() {
  return useCallback(async (content: string) => {
    await notificationService.reminder(content);
  }, []);
}

// Hook for schedule notifications
export function useNotifySchedule() {
  const { info } = useToasts();

  const notifyEventSoon = useCallback(async (eventName: string, timeLeft: string) => {
    await notificationService.eventSoon(eventName, timeLeft);
    info('即将开始', `${eventName} - ${timeLeft}`);
  }, [info]);

  return {
    notifyEventSoon,
  };
}

// General notification hook
export function useNotification() {
  const { success, error, warning, info } = useToasts();

  return {
    info: async (title: string, body: string) => {
      await notificationService.info(title, body);
      info(title, body);
    },
    success: async (title: string, body: string) => {
      await notificationService.success(title, body);
      success(title, body);
    },
    warning: async (title: string, body: string) => {
      await notificationService.warning(title, body);
      warning(title, body);
    },
    error: async (title: string, body: string) => {
      await notificationService.error(title, body);
      error(title, body);
    },
  };
}
```

### App Layout Integration
```typescript
// renderer/layouts/AppLayout.tsx (修改示例)
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '@/modules/notification/presentation/components';
import { useNotificationStore } from '@/modules/notification/store';

export const AppLayout: React.FC = () => {
  const initializeNotifications = useNotificationStore((s) => s.initialize);

  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
```

### Header Integration
```typescript
// renderer/layouts/Header.tsx (修改示例)
import React from 'react';
import { NotificationBell } from '@/modules/notification/presentation/components';
import { UserMenu } from './UserMenu';
import { SearchBar } from './SearchBar';

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b flex items-center justify-between px-4">
      <SearchBar />
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
};
```

### Module Index
```typescript
// renderer/modules/notification/index.ts
/**
 * Notification Module
 *
 * 通知模块提供完整的通知功能：
 * - 应用内通知 (Toast)
 * - 系统通知
 * - 通知历史管理
 * - 勿扰模式
 * - 分类设置
 */

// Infrastructure
export { notificationIPCClient } from './infrastructure/ipc';
export type {
  NotificationType,
  NotificationPriority,
  NotificationPayload,
  NotificationRecord,
  NotificationSettings,
} from './infrastructure/ipc';

export {
  useNotifications,
  useNotificationSettings,
} from './infrastructure/ipc';

// Store
export { useNotificationStore, notificationSelectors } from './store';
export type { NotificationState, NotificationActions, Toast } from './store';

// Store Hooks
export {
  useNotificationCenter,
  useUnreadCount,
  useDoNotDisturb,
  useToasts,
  useNotificationList,
  useNotify,
} from './store';

// Service
export { notificationService } from './services/notification-service';

// Integration Hooks
export {
  useNotifyTask,
  useNotifyGoal,
  useNotifyFocus,
  useNotifyReminder,
  useNotifySchedule,
  useNotification,
} from './hooks/use-notify';

// Components
export {
  Toast,
  ToastContainer,
  NotificationBell,
  NotificationCenter,
  NotificationItem,
  NotificationSettings,
} from './presentation/components';

// Module initialization
export const initializeNotificationModule = async (): Promise<void> => {
  const { useNotificationStore } = await import('./store');
  await useNotificationStore.getState().initialize();
};
```

### Routes
```typescript
// renderer/modules/notification/routes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { NotificationSettings } from './presentation/components';
import { AuthGuard } from '@/modules/auth/presentation/components';

export const notificationRoutes: RouteObject[] = [
  {
    path: '/settings/notifications',
    element: (
      <AuthGuard>
        <div className="p-6 max-w-3xl mx-auto">
          <NotificationSettings />
        </div>
      </AuthGuard>
    ),
  },
];
```

## 验收标准

- [ ] NotificationService 正确封装通知模板
- [ ] 各模块 Hooks 正常工作
- [ ] Header 正确显示 NotificationBell
- [ ] ToastContainer 全局可用
- [ ] 模块初始化正确执行
- [ ] 通知与 Toast 同时触发
- [ ] 路由配置正确
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/notification/services/notification-service.ts`
- `renderer/modules/notification/hooks/use-notify.ts`
- `renderer/modules/notification/index.ts`
- `renderer/modules/notification/routes.tsx`
- `renderer/layouts/AppLayout.tsx`
- `renderer/layouts/Header.tsx`
