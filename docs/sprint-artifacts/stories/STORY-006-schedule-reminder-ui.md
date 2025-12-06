# STORY-006: 核心模块 UI - Schedule & Reminder

## 📋 Story 概述

**Story ID**: STORY-006  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P1 (核心价值)  
**预估工时**: 5-7 天  
**状态**: 🔵 Ready for Dev  
**前置依赖**: STORY-002, STORY-003, STORY-004

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 能够管理我的日程安排和设置提醒  
**以便于** 准时参加活动并不忘记重要事项  

---

## 📋 验收标准

### 功能验收 - Schedule 模块

- [ ] 日历视图（日/周/月切换）
- [ ] 时间线视图
- [ ] 创建日程事件
- [ ] 编辑日程事件
- [ ] 删除日程事件
- [ ] 重复事件支持（每日/每周/每月/自定义）
- [ ] 事件拖拽调整时间

### 功能验收 - Reminder 模块

- [ ] 提醒列表展示
- [ ] 创建新提醒
- [ ] 编辑提醒详情
- [ ] 删除提醒
- [ ] 提醒模板管理
- [ ] 提醒触发时间设置

### 功能验收 - 原生通知

- [ ] 系统托盘通知弹出
- [ ] 通知点击跳转到详情
- [ ] 通知声音配置
- [ ] 通知免打扰模式

### 技术验收

- [ ] 使用 `@dailyuse/application-client` 服务
- [ ] Electron Notification API 集成
- [ ] IPC 主进程通知触发

---

## 📐 技术设计

### 文件结构

```
apps/desktop/src/renderer/
├── views/
│   ├── schedule/
│   │   ├── ScheduleView.vue           # 日程主页
│   │   ├── ScheduleCalendar.vue       # 日历组件
│   │   ├── ScheduleTimeline.vue       # 时间线组件
│   │   ├── ScheduleEventDialog.vue    # 事件编辑弹窗
│   │   └── components/
│   │       ├── CalendarDay.vue        # 日视图
│   │       ├── CalendarWeek.vue       # 周视图
│   │       ├── CalendarMonth.vue      # 月视图
│   │       └── EventItem.vue          # 事件项
│   │
│   └── reminder/
│       ├── ReminderListView.vue       # 提醒列表
│       ├── ReminderFormDialog.vue     # 创建/编辑弹窗
│       ├── ReminderTemplateView.vue   # 模板管理
│       └── components/
│           ├── ReminderCard.vue       # 提醒卡片
│           └── ReminderTimePicker.vue # 时间选择器
│
├── shared/
│   └── composables/
│       ├── useSchedule.ts             # Schedule 业务逻辑
│       └── useReminder.ts             # Reminder 业务逻辑

apps/desktop/src/main/
└── shared/
    └── notification/
        ├── notificationService.ts     # 通知服务
        └── notificationScheduler.ts   # 通知调度器
```

### 通知架构

```
┌─────────────────────────────────────────────────────────────┐
│ Renderer Process                                             │
│                                                              │
│  ReminderView → useReminder() → scheduleReminder()          │
│       ↓                                                      │
│  IPC: 'notification:schedule'                               │
└──────────────────────────────────┬──────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────┐
│ Main Process                                                 │
│                                                              │
│  NotificationScheduler                                       │
│       ↓ (node-schedule)                                      │
│  定时触发                                                    │
│       ↓                                                      │
│  Electron Notification API                                   │
│       ↓                                                      │
│  系统原生通知弹出                                            │
│                                                              │
│  点击通知 → IPC: 'notification:clicked' → 渲染进程跳转     │
└─────────────────────────────────────────────────────────────┘
```

### Composable 设计

```typescript
// useSchedule.ts
import { ref, computed } from 'vue';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import {
  GetScheduleEventsService,
  CreateScheduleEventService,
  UpdateScheduleEventService,
  DeleteScheduleEventService,
} from '@dailyuse/application-client';
import type { ScheduleEventClientDTO } from '@dailyuse/contracts/schedule';

export function useSchedule() {
  const container = ScheduleContainer.getInstance();
  
  // State
  const events = ref<ScheduleEventClientDTO[]>([]);
  const currentView = ref<'day' | 'week' | 'month'>('week');
  const currentDate = ref(new Date());
  const loading = ref(false);
  
  // Services
  const getEventsService = new GetScheduleEventsService(container);
  const createEventService = new CreateScheduleEventService(container);
  
  // Actions
  async function fetchEvents(startDate: Date, endDate: Date) {
    loading.value = true;
    try {
      const result = await getEventsService.execute({ startDate, endDate });
      events.value = result.items;
    } finally {
      loading.value = false;
    }
  }
  
  async function createEvent(data: CreateScheduleEventRequest) {
    const event = await createEventService.execute(data);
    events.value.push(event);
    return event;
  }
  
  // View helpers
  function setView(view: 'day' | 'week' | 'month') {
    currentView.value = view;
  }
  
  function goToDate(date: Date) {
    currentDate.value = date;
  }
  
  return {
    events: computed(() => events.value),
    currentView: computed(() => currentView.value),
    currentDate: computed(() => currentDate.value),
    loading: computed(() => loading.value),
    
    fetchEvents,
    createEvent,
    setView,
    goToDate,
  };
}
```

### 原生通知服务

```typescript
// apps/desktop/src/main/shared/notification/notificationService.ts
import { Notification, nativeImage } from 'electron';
import path from 'path';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  data?: Record<string, unknown>;
}

export class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  show(options: NotificationOptions): Notification {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: this.getIcon(options.icon),
      silent: options.silent ?? false,
    });
    
    notification.on('click', () => {
      // 发送到渲染进程
      this.handleClick(options.data);
    });
    
    notification.show();
    return notification;
  }
  
  private getIcon(iconPath?: string): Electron.NativeImage | undefined {
    if (iconPath) {
      return nativeImage.createFromPath(iconPath);
    }
    // 默认图标
    return nativeImage.createFromPath(
      path.join(__dirname, '../../../public/icon.png')
    );
  }
  
  private handleClick(data?: Record<string, unknown>) {
    // 通知渲染进程
    const { BrowserWindow } = require('electron');
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('notification:clicked', data);
      mainWindow.show();
      mainWindow.focus();
    }
  }
}
```

---

## 📝 Task 分解

### Task 6.1: Schedule 模块视图 (2-3 天)

**子任务**:
- [ ] 创建 ScheduleView.vue (主布局)
- [ ] 创建 ScheduleCalendar.vue
- [ ] 实现日视图 CalendarDay.vue
- [ ] 实现周视图 CalendarWeek.vue
- [ ] 实现月视图 CalendarMonth.vue
- [ ] 创建 ScheduleEventDialog.vue
- [ ] 实现 useSchedule.ts composable

**验收**:
- [ ] 日历显示正确
- [ ] 事件 CRUD 功能正常

### Task 6.2: Reminder 模块视图 (1-2 天)

**子任务**:
- [ ] 创建 ReminderListView.vue
- [ ] 创建 ReminderFormDialog.vue
- [ ] 创建 ReminderTemplateView.vue
- [ ] 创建 ReminderCard.vue 组件
- [ ] 实现 useReminder.ts composable

**验收**:
- [ ] 提醒 CRUD 功能正常
- [ ] 模板管理正常

### Task 6.3: 原生通知集成 (2 天)

**子任务**:
- [ ] 实现 NotificationService
- [ ] 实现 NotificationScheduler (node-schedule)
- [ ] 注册 IPC handlers
- [ ] 实现通知点击跳转
- [ ] 添加通知声音支持
- [ ] 实现免打扰模式

**验收**:
- [ ] 通知准时弹出
- [ ] 点击跳转正确
- [ ] 声音可配置

---

## 🔗 依赖关系

### 前置依赖

- ⏳ STORY-002/003/004 (基础架构)

### 后续影响

- 🔜 STORY-010 (桌面特性) - 托盘通知集成

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 通知权限问题 | 中 | 中 | 引导用户开启权限 |
| 定时器精度 | 低 | 中 | 使用 node-schedule |
| 日历性能 | 中 | 中 | 虚拟滚动 |

---

## 📚 参考资料

- Web 端实现: `apps/web/src/modules/schedule/`, `apps/web/src/modules/reminder/`
- Electron Notification: https://www.electronjs.org/docs/latest/api/notification
- node-schedule: https://github.com/node-schedule/node-schedule

---

## ✅ 完成定义 (DoD)

- [ ] 所有 UI 组件实现
- [ ] 原生通知工作
- [ ] CRUD 功能测试通过
- [ ] 与 Web 端功能一致
- [ ] 代码已提交并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Phase 2 (Week 3-4)
