# Story 13.46: Notification 模块 UI 组件实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.46 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.45 (Notification Store) |
| 关联模块 | Notification |

## 目标

实现 Notification 模块的 UI 组件，包括 Toast 组件、通知中心、通知列表和设置页面。

## 任务列表

### 1. 创建 Toast 组件 (2h)
- [ ] Toast 组件
- [ ] ToastContainer
- [ ] Toast 动画

### 2. 创建通知中心组件 (2h)
- [ ] NotificationCenter
- [ ] NotificationItem
- [ ] NotificationBell (触发按钮)

### 3. 创建通知设置组件 (1.5h)
- [ ] NotificationSettings
- [ ] CategorySettings
- [ ] DNDSchedule

### 4. 创建页面和路由 (0.5h)
- [ ] NotificationPage
- [ ] 路由配置

## 技术规范

### Toast Component
```typescript
// renderer/modules/notification/presentation/components/Toast.tsx
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@dailyuse/ui';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@dailyuse/ui';
import type { Toast as ToastType } from '../../store';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
};

const iconStyles = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const Icon = toastIcons[toast.type];

  const handleDismiss = useCallback(() => {
    onDismiss(toast.id);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full',
        toastStyles[toast.type]
      )}
    >
      <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', iconStyles[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
        )}
        {toast.action && (
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto mt-2"
            onClick={toast.action.onClick}
          >
            {toast.action.label}
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 -mr-1 -mt-1"
        onClick={handleDismiss}
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
```

### Toast Container
```typescript
// renderer/modules/notification/presentation/components/ToastContainer.tsx
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Toast } from './Toast';
import { useToasts } from '../../store';

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToasts();

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};
```

### Notification Bell
```typescript
// renderer/modules/notification/presentation/components/NotificationBell.tsx
import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button, Badge, Popover, PopoverContent, PopoverTrigger } from '@dailyuse/ui';
import { useUnreadCount, useDoNotDisturb, useNotificationCenter } from '../../store';
import { NotificationCenter } from './NotificationCenter';
import { cn } from '@dailyuse/ui';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const unreadCount = useUnreadCount();
  const { enabled: dndEnabled } = useDoNotDisturb();
  const { isOpen, toggle } = useNotificationCenter();

  return (
    <Popover open={isOpen} onOpenChange={toggle}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
        >
          {dndEnabled ? (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && !dndEnabled && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <NotificationCenter />
      </PopoverContent>
    </Popover>
  );
};
```

### Notification Center
```typescript
// renderer/modules/notification/presentation/components/NotificationCenter.tsx
import React from 'react';
import {
  Button,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@dailyuse/ui';
import { Settings, CheckCheck, Trash2, Moon, MoonOff } from 'lucide-react';
import { useNotificationList, useDoNotDisturb } from '../../store';
import { NotificationItem } from './NotificationItem';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    isLoading,
    canLoadMore,
    loadMore,
    markAllRead,
    dismissAll,
    clearHistory,
    markRead,
    dismiss,
  } = useNotificationList();
  const { enabled: dndEnabled, toggle: toggleDND } = useDoNotDisturb();

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">通知</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleDND}
            title={dndEnabled ? '关闭勿扰模式' : '开启勿扰模式'}
          >
            {dndEnabled ? (
              <MoonOff className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={markAllRead}
            title="全部已读"
          >
            <CheckCheck className="w-4 h-4" />
          </Button>
          <Link to="/settings/notifications">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="设置">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unread" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="unread" className="relative">
            未读
            {unreadNotifications.length > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                {unreadNotifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="flex-1 m-0">
          <ScrollArea className="h-full">
            {unreadNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <CheckCheck className="w-12 h-12 mb-4" />
                <p>没有未读通知</p>
              </div>
            ) : (
              <div className="divide-y">
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markRead}
                    onDismiss={dismiss}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="all" className="flex-1 m-0">
          <ScrollArea className="h-full">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <Bell className="w-12 h-12 mb-4" />
                <p>暂无通知</p>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                    />
                  ))}
                </div>
                {canLoadMore && (
                  <div className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoading}
                    >
                      加载更多
                    </Button>
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t bg-muted/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={clearHistory}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清空所有通知
          </Button>
        </div>
      )}
    </div>
  );
};
```

### Notification Item
```typescript
// renderer/modules/notification/presentation/components/NotificationItem.tsx
import React from 'react';
import { cn } from '@dailyuse/ui';
import { Button } from '@dailyuse/ui';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Bell,
  Target,
  CheckSquare,
  X,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { NotificationRecord } from '../../infrastructure/ipc';

interface NotificationItemProps {
  notification: NotificationRecord;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  reminder: Bell,
  task: CheckSquare,
  goal: Target,
};

const typeColors = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  reminder: 'text-purple-600',
  task: 'text-cyan-600',
  goal: 'text-orange-600',
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDismiss,
}) => {
  const Icon = typeIcons[notification.type] || Info;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors',
        !notification.read && 'bg-primary/5'
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
      )}

      {/* Icon */}
      <div className={cn('shrink-0', notification.read && 'ml-4')}>
        <Icon className={cn('w-5 h-5', typeColors[notification.type])} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.read && 'font-medium')}>
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: zhCN,
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMarkRead(notification.id)}
            title="标记已读"
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDismiss(notification.id)}
          title="删除"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
```

### Notification Settings
```typescript
// renderer/modules/notification/presentation/components/NotificationSettings.tsx
import React from 'react';
import { useNotificationSettings } from '../../infrastructure/ipc';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Switch,
  Label,
  Input,
  Separator,
} from '@dailyuse/ui';
import { Bell, Volume2, Monitor, Moon, Clock } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const {
    settings,
    isLoading,
    toggleEnabled,
    toggleSystemNotifications,
    toggleSound,
    toggleDND,
    updateCategorySettings,
    updateDNDSchedule,
  } = useNotificationSettings();

  if (isLoading || !settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            通知设置
          </CardTitle>
          <CardDescription>管理应用通知偏好</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>启用通知</Label>
                <p className="text-sm text-muted-foreground">接收应用内通知</p>
              </div>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={toggleEnabled} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>系统通知</Label>
                <p className="text-sm text-muted-foreground">
                  在系统通知中心显示通知
                </p>
              </div>
            </div>
            <Switch
              checked={settings.systemNotifications}
              onCheckedChange={toggleSystemNotifications}
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>通知声音</Label>
                <p className="text-sm text-muted-foreground">播放通知提示音</p>
              </div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={toggleSound}
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            勿扰模式
          </CardTitle>
          <CardDescription>暂停非紧急通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>勿扰模式</Label>
              <p className="text-sm text-muted-foreground">
                开启后只接收紧急通知
              </p>
            </div>
            <Switch checked={settings.doNotDisturb} onCheckedChange={toggleDND} />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>定时勿扰</Label>
                  <p className="text-sm text-muted-foreground">
                    在指定时间段自动开启勿扰模式
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.doNotDisturbSchedule?.enabled ?? false}
                onCheckedChange={(enabled) =>
                  updateDNDSchedule({
                    enabled,
                    start: settings.doNotDisturbSchedule?.start ?? '22:00',
                    end: settings.doNotDisturbSchedule?.end ?? '08:00',
                  })
                }
              />
            </div>

            {settings.doNotDisturbSchedule?.enabled && (
              <div className="grid grid-cols-2 gap-4 pl-8">
                <div>
                  <Label>开始时间</Label>
                  <Input
                    type="time"
                    value={settings.doNotDisturbSchedule.start}
                    onChange={(e) =>
                      updateDNDSchedule({
                        ...settings.doNotDisturbSchedule!,
                        start: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>结束时间</Label>
                  <Input
                    type="time"
                    value={settings.doNotDisturbSchedule.end}
                    onChange={(e) =>
                      updateDNDSchedule({
                        ...settings.doNotDisturbSchedule!,
                        end: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Settings */}
      <Card>
        <CardHeader>
          <CardTitle>分类设置</CardTitle>
          <CardDescription>为不同类型的通知设置偏好</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(settings.categorySettings).map(([type, config]) => (
              <div key={type} className="flex items-center justify-between py-2">
                <div>
                  <Label className="capitalize">{type}</Label>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">启用</Label>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(enabled) =>
                        updateCategorySettings(type as any, { enabled })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">声音</Label>
                    <Switch
                      checked={config.sound}
                      onCheckedChange={(sound) =>
                        updateCategorySettings(type as any, { sound })
                      }
                      disabled={!config.enabled}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">系统</Label>
                    <Switch
                      checked={config.systemNotification}
                      onCheckedChange={(systemNotification) =>
                        updateCategorySettings(type as any, { systemNotification })
                      }
                      disabled={!config.enabled}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### Component Index
```typescript
// renderer/modules/notification/presentation/components/index.ts
export { Toast } from './Toast';
export { ToastContainer } from './ToastContainer';
export { NotificationBell } from './NotificationBell';
export { NotificationCenter } from './NotificationCenter';
export { NotificationItem } from './NotificationItem';
export { NotificationSettings } from './NotificationSettings';
```

## 验收标准

- [ ] Toast 组件正确显示和动画
- [ ] ToastContainer 正确管理多个 Toast
- [ ] NotificationBell 显示未读数量
- [ ] NotificationCenter 正确显示通知列表
- [ ] 分 Tab 显示未读/全部
- [ ] 标记已读、删除功能正常
- [ ] 设置页面功能完整
- [ ] 勿扰模式 UI 正确
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/notification/presentation/components/Toast.tsx`
- `renderer/modules/notification/presentation/components/ToastContainer.tsx`
- `renderer/modules/notification/presentation/components/NotificationBell.tsx`
- `renderer/modules/notification/presentation/components/NotificationCenter.tsx`
- `renderer/modules/notification/presentation/components/NotificationItem.tsx`
- `renderer/modules/notification/presentation/components/NotificationSettings.tsx`
- `renderer/modules/notification/presentation/components/index.ts`
