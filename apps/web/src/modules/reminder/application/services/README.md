# Reminder 数据同步服务

## 概述

`ReminderSyncApplicationService` 是 Reminder 模块的数据同步服务，负责：

1. 初始化时同步所有数据
2. 监听事件总线上的刷新事件
3. 自动从服务器刷新数据
4. 更新 Pinia store

## 使用方法

### 1. 初始化（应用启动时）

```typescript
import { reminderSyncApplicationService } from '@/modules/reminder/application/services';

// 在应用初始化时调用一次
reminderSyncApplicationService.initializeEventListeners();
await reminderSyncApplicationService.syncAllTemplatesAndGroups();
```

### 2. 手动刷新所有数据

```typescript
await reminderSyncApplicationService.refreshAll();
```

### 3. 发布事件触发单个实体刷新

```typescript
import { eventBus, ReminderEvents } from '@/modules/reminder/application/services';

// 刷新单个 Template
eventBus.emit(ReminderEvents.TEMPLATE_REFRESH, {
  templateUuid: 'xxx-xxx-xxx',
  reason: 'Instance created',
  timestamp: Date.now(),
});

// 刷新单个 Group
eventBus.emit(ReminderEvents.GROUP_REFRESH, {
  groupUuid: 'xxx-xxx-xxx',
  reason: 'Group updated',
  timestamp: Date.now(),
});

// 刷新所有 Templates
eventBus.emit(ReminderEvents.TEMPLATES_REFRESH_ALL);

// 刷新所有 Groups
eventBus.emit(ReminderEvents.GROUPS_REFRESH_ALL);
```

### 4. 清理（应用卸载时）

```typescript
reminderSyncApplicationService.cleanup();
```

## 事件列表

| 事件名 | 说明 | 数据结构 |
|--------|------|----------|
| `reminder:template:refresh` | 刷新单个模板 | `{ templateUuid, reason, timestamp }` |
| `reminder:group:refresh` | 刷新单个分组 | `{ groupUuid, reason, timestamp }` |
| `reminder:templates:refresh:all` | 刷新所有模板 | 无参数 |
| `reminder:groups:refresh:all` | 刷新所有分组 | 无参数 |

## 架构设计

```
用户操作 / 定时任务
    ↓
发布事件到 EventBus
    ↓
ReminderSyncApplicationService 监听事件
    ↓
调用 reminderApiClient 获取最新数据
    ↓
转换为客户端实体
    ↓
更新 ReminderStore
    ↓
Vue 组件自动响应更新
```

## 对比传统刷新方式

### 传统方式

```typescript
// 每个组件都要手动刷新
await reminderTemplateApplicationService.getReminderTemplates({ forceRefresh: true });
```

### 事件驱动方式

```typescript
// 只需要发布事件
eventBus.emit(ReminderEvents.TEMPLATES_REFRESH_ALL);

// 所有订阅该数据的组件自动更新
```

## 优势

1. **解耦**: 组件不需要知道数据从哪里来
2. **自动化**: 数据变更自动同步，无需手动刷新
3. **一致性**: 所有使用该数据的组件都会同步更新
4. **可扩展**: 轻松添加新的事件类型
5. **易调试**: 所有数据同步操作都有日志输出

## 与 Goal 模块的一致性

Reminder 模块的数据同步服务参考了 Goal 模块的设计：

- 相同的事件驱动架构
- 相同的单例模式
- 相同的生命周期管理
- 相同的错误处理机制

这确保了整个应用的架构一致性。
