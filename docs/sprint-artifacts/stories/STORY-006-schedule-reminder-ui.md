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

## 🏗️ 技术实现方案 (架构师补充)

### 1. IPC 通道与服务映射

#### Schedule 模块 (28 IPC 通道)

| IPC 通道 | 描述 |
|----------|------|
| `schedule:create` | 创建日程事件 |
| `schedule:get` | 获取单个日程 |
| `schedule:list` | 获取日程列表 |
| `schedule:timeRange` | 按时间范围获取 |
| `schedule:update` | 更新日程 |
| `schedule:delete` | 删除日程 |
| `schedule:conflicts` | 获取冲突 |
| `schedule:detectConflicts` | 检测冲突 |
| `scheduleTask:create` | 创建调度任务 |
| `scheduleTask:list` | 获取调度任务列表 |
| `scheduleTask:pause` | 暂停调度任务 |
| `scheduleTask:resume` | 恢复调度任务 |
| `scheduleTask:complete` | 完成调度任务 |
| `scheduleTask:statistics` | 获取调度统计 |

#### Reminder 模块 (20 IPC 通道)

| IPC 通道 | 描述 |
|----------|------|
| `reminder:template:create` | 创建提醒模板 |
| `reminder:template:list` | 获取模板列表 |
| `reminder:template:get` | 获取单个模板 |
| `reminder:template:update` | 更新模板 |
| `reminder:template:delete` | 删除模板 |
| `reminder:template:toggle` | 开关模板 |
| `reminder:upcoming` | 获取即将触发的提醒 |
| `reminder:group:create` | 创建提醒组 |
| `reminder:group:list` | 获取组列表 |
| `reminder:statistics` | 获取提醒统计 |

### 2. 日历组件技术选型

```typescript
// 推荐使用 FullCalendar
// npm install @fullcalendar/core @fullcalendar/vue3 @fullcalendar/daygrid @fullcalendar/timegrid

import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  editable: true,
  selectable: true,
  events: [], // 从 useSchedule 获取
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  select: handleDateSelect,
};
```

### 3. 原生通知实现

```typescript
// apps/desktop/src/main/modules/notification/NotificationService.ts
import { Notification, app, BrowserWindow } from 'electron';

export class NotificationService {
  private mainWindow: BrowserWindow;
  
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }
  
  show(options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
    urgency?: 'normal' | 'critical' | 'low';
    actions?: { type: string; text: string }[];
    targetRoute?: string;
  }): void {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon || this.getAppIcon(),
      silent: options.silent ?? false,
      urgency: options.urgency ?? 'normal',
    });
    
    notification.on('click', () => {
      // 聚焦窗口
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
      
      // 导航到目标页面
      if (options.targetRoute) {
        this.mainWindow.webContents.send('navigate', options.targetRoute);
      }
    });
    
    notification.show();
  }
  
  private getAppIcon(): string {
    // 根据平台返回图标路径
    return process.platform === 'win32'
      ? 'resources/icon.ico'
      : 'resources/icon.png';
  }
}
```

### 4. 提醒调度器

```typescript
// apps/desktop/src/main/modules/reminder/ReminderScheduler.ts
import { schedule, Job } from 'node-schedule';
import { ReminderContainer } from '@dailyuse/infrastructure-server';

export class ReminderScheduler {
  private jobs = new Map<string, Job>();
  private notificationService: NotificationService;
  
  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }
  
  async initialize(): Promise<void> {
    const container = ReminderContainer.getInstance();
    const repo = container.getReminderTemplateRepository();
    
    // 加载所有启用的提醒模板
    const templates = await repo.findEnabled();
    
    for (const template of templates) {
      this.scheduleReminder(template);
    }
  }
  
  scheduleReminder(template: ReminderTemplate): void {
    // 取消已存在的任务
    this.cancelReminder(template.uuid);
    
    // 根据 cron 表达式创建新任务
    const job = schedule.scheduleJob(template.cronExpression, () => {
      this.triggerReminder(template);
    });
    
    if (job) {
      this.jobs.set(template.uuid, job);
    }
  }
  
  private triggerReminder(template: ReminderTemplate): void {
    this.notificationService.show({
      title: template.title,
      body: template.description || '',
      targetRoute: `/reminders/${template.uuid}`,
    });
  }
  
  cancelReminder(uuid: string): void {
    const job = this.jobs.get(uuid);
    if (job) {
      job.cancel();
      this.jobs.delete(uuid);
    }
  }
}
```

### 5. useSchedule Composable

```typescript
// apps/desktop/src/renderer/shared/composables/useSchedule.ts
import { ref, computed } from 'vue';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import {
  CreateScheduleService,
  GetSchedulesByTimeRangeService,
  UpdateScheduleService,
  DeleteScheduleService,
  DetectConflictsService,
} from '@dailyuse/application-client';
import type { ScheduleClientDTO, CreateScheduleRequest } from '@dailyuse/contracts/schedule';

export function useSchedule() {
  const container = ScheduleContainer.getInstance();
  
  const schedules = ref<ScheduleClientDTO[]>([]);
  const loading = ref(false);
  
  const services = {
    create: new CreateScheduleService(container),
    getByTimeRange: new GetSchedulesByTimeRangeService(container),
    update: new UpdateScheduleService(container),
    delete: new DeleteScheduleService(container),
    detectConflicts: new DetectConflictsService(container),
  };
  
  async function fetchSchedulesByTimeRange(start: Date, end: Date) {
    loading.value = true;
    try {
      schedules.value = await services.getByTimeRange.execute({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
    } finally {
      loading.value = false;
    }
  }
  
  async function createSchedule(request: CreateScheduleRequest) {
    // 先检测冲突
    const conflicts = await services.detectConflicts.execute({
      startTime: request.startTime,
      endTime: request.endTime,
    });
    
    if (conflicts.hasConflict) {
      // 返回冲突信息让 UI 处理
      return { success: false, conflicts };
    }
    
    const schedule = await services.create.execute(request);
    schedules.value.push(schedule);
    return { success: true, schedule };
  }
  
  // FullCalendar 格式化
  const calendarEvents = computed(() => {
    return schedules.value.map(s => ({
      id: s.uuid,
      title: s.title,
      start: s.startTime,
      end: s.endTime,
      backgroundColor: getEventColor(s.type),
      extendedProps: { schedule: s },
    }));
  });
  
  return {
    schedules: computed(() => schedules.value),
    calendarEvents,
    loading: computed(() => loading.value),
    fetchSchedulesByTimeRange,
    createSchedule,
  };
}
```

---

## 📚 参考资料

- Web 端实现: `apps/web/src/modules/schedule/`, `apps/web/src/modules/reminder/`
- Electron Notification: https://www.electronjs.org/docs/latest/api/notification
- node-schedule: https://github.com/node-schedule/node-schedule
- FullCalendar Vue: https://fullcalendar.io/docs/vue

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
