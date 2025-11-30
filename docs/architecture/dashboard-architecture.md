# Dashboard 模块架构设计

> **Dashboard 不只是数据展示页面，它是用户的工作台（Workbench）和行动中心（Action Center）。**
> 
> 用户在 Dashboard 上不仅能看到数据，还能**快速执行操作**：完成任务、记录进度、进入专注模式等。

## 目录

1. [设计原则](#1-设计原则)
2. [Dashboard 的双重角色](#2-dashboard-的双重角色)
3. [架构模式选择](#3-架构模式选择)
4. [Dashboard 组件分类](#4-dashboard-组件分类)
5. [各组件实现方案](#5-各组件实现方案)
6. [交互操作设计](#6-交互操作设计)
7. [API 设计](#7-api-设计)
8. [前端数据获取策略](#8-前端数据获取策略)
9. [性能优化](#9-性能优化)
10. [实现路线图](#10-实现路线图)

---

## 1. 设计原则

### 1.1 CQRS 核心理念

在 DDD/CQRS 架构中，**读（Query）和写（Command）应该分离**：

| 方面 | Command Side (写) | Query Side (读) |
|------|------------------|-----------------|
| **职责** | 执行业务逻辑，修改状态 | 查询数据，展示视图 |
| **模型** | 聚合根、实体、值对象 | ViewModel、DTO |
| **约束** | 遵循聚合边界 | **可跨聚合/模块查询** |
| **位置** | `domain-server` | `api` 模块内的 Queries |

### 1.2 Dashboard 的特殊性

Dashboard 是一个 **纯读（Read-Only）模块**：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Dashboard                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ 统计卡片    │ │  Todo 列表  │ │ 日程表      │ │ 目标卡片   │ │
│  │ (Stats)     │ │  (Todos)    │ │ (Schedule)  │ │ (Goals)    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│         │               │               │               │        │
│         ▼               ▼               ▼               ▼        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           Dashboard Query Service (CQRS Query Side)         │ │
│  │           - 直接查数据库                                     │ │
│  │           - 不依赖 domain-server                            │ │
│  │           - 返回 DTO/ViewModel                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 为什么 Dashboard 不应该依赖 domain-server？

| 问题 | 说明 |
|------|------|
| **违反 CQRS** | Query Side 不应该加载完整的 Domain Model |
| **性能开销** | 加载聚合根需要重建完整对象图，Dashboard 只需要部分字段 |
| **耦合过紧** | Dashboard 变成了所有模块的"超级消费者" |
| **类型声明** | domain-server 可能不生成 .d.ts，导致类型错误 |

---

## 2. Dashboard 的双重角色

### 2.1 不只是数据展示

传统理解的 Dashboard 只是"看板"，但现代 Dashboard 应该是：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dashboard = Workbench                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   📊 数据展示 (Query)          🎯 快捷操作 (Command)             │
│   ├── 统计卡片                 ├── ✅ 完成任务                   │
│   ├── 今日任务列表             ├── 📝 记录进度                   │
│   ├── 目标进度卡片             ├── ⏸️ 跳过/推迟                  │
│   ├── 日程时间线               ├── 🎯 进入专注模式               │
│   └── 提醒列表                 └── ➕ 快速创建                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 CQRS 中的 Command 处理

虽然 Dashboard 的**数据展示**使用 Query Side，但**操作**仍然通过 Command Side：

```
用户点击 "完成任务" 按钮
        │
        ▼
┌─────────────────────────────────────────┐
│  Dashboard UI (前端)                     │
│  - 显示操作 Dialog                       │
│  - 收集用户输入                          │
└─────────────────────────────────────────┘
        │
        ▼ POST /api/tasks/{uuid}/complete
┌─────────────────────────────────────────┐
│  Task Module (Command Side)             │
│  - TaskController                        │
│  - TaskApplicationService                │
│  - TaskInstance.complete() (Domain)      │
└─────────────────────────────────────────┘
        │
        ▼ 操作成功
┌─────────────────────────────────────────┐
│  Dashboard UI (前端)                     │
│  - 刷新 Query (局部刷新)                 │
│  - 更新 UI 状态                          │
└─────────────────────────────────────────┘
```

**关键：Dashboard 不实现 Command 逻辑，只是调用各模块的 Command API！**

---

## 3. 架构模式选择

### 3.1 三种可选模式对比

#### 模式 A: 直接查询模式 (Direct Query) ⭐ 推荐

```
Dashboard Controller
        │
        ▼
Dashboard Query Service  ──────► 直接 SQL/Prisma 查询
        │
        ▼
    返回 DTO
```

**优点：**
- 最高性能，直接查库
- 完全独立，不依赖其他模块
- 可以跨表 JOIN

**缺点：**
- 需要维护查询逻辑
- 可能与业务逻辑重复

#### 模式 B: 模块间 API 调用模式 (Inter-Module API)

```
Dashboard Controller
        │
        ▼
Dashboard Service
        │
        ├──► Task Module API (/api/tasks/today)
        ├──► Goal Module API (/api/goals/active)
        ├──► Reminder Module API (/api/reminders/upcoming)
        └──► Schedule Module API (/api/schedule/today)
```

**优点：**
- 各模块职责清晰
- 复用各模块的业务逻辑

**缺点：**
- 多次 HTTP 调用开销
- 需要各模块暴露 API

#### 模式 C: 混合模式 (Hybrid) ⭐⭐ 最佳实践

```
Dashboard Controller
        │
        ▼
Dashboard Query Service
        │
        ├──► 统计数据: 直接 SQL 查询 (高性能)
        ├──► Todo 列表: 调用 Task Query Service (复用逻辑)
        ├──► 日程表: 调用 Schedule Query Service
        └──► 目标卡片: 调用 Goal Query Service
```

**结论：我们采用模式 C (混合模式)**

---

## 4. Dashboard 组件分类

根据数据特性，Dashboard 组件分为 4 类：

| 类型 | 组件示例 | 数据特性 | 实现方式 |
|------|---------|---------|---------|
| **聚合统计** | 统计卡片 | 跨模块聚合、数值型 | 直接 SQL 查询 |
| **列表展示** | Todo 列表、提醒列表 | 单模块、分页、筛选 | 调用模块 Query Service |
| **时间视图** | 日程表、日历 | 时间范围查询 | 调用 Schedule Query |
| **详情卡片** | 目标卡片、项目卡片 | 单实体详情 | 调用模块 Query Service |

---

## 5. 各组件实现方案

### 5.1 统计卡片 (Statistics Cards)

**展示内容：**
- 今日任务完成数 / 总数
- 本周目标进度
- 待处理提醒数
- 日程执行情况

**实现方案：直接 SQL 查询**

```typescript
// apps/api/src/modules/dashboard/queries/StatisticsQueries.ts

export interface DashboardStatistics {
  tasks: {
    todayTotal: number;
    todayCompleted: number;
    completionRate: number;
  };
  goals: {
    activeCount: number;
    averageProgress: number;
    nearDeadlineCount: number;
  };
  reminders: {
    pendingCount: number;
    todayTriggered: number;
  };
  schedule: {
    todayTasks: number;
    executedCount: number;
  };
}

export class StatisticsQueries {
  constructor(private prisma: PrismaClient) {}

  async getDashboardStatistics(accountUuid: string): Promise<DashboardStatistics> {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(new Date());

    // 并行查询，提高性能
    const [taskStats, goalStats, reminderStats, scheduleStats] = await Promise.all([
      this.getTaskStatistics(accountUuid, today, tomorrow),
      this.getGoalStatistics(accountUuid),
      this.getReminderStatistics(accountUuid),
      this.getScheduleStatistics(accountUuid, today, tomorrow),
    ]);

    return {
      tasks: taskStats,
      goals: goalStats,
      reminders: reminderStats,
      schedule: scheduleStats,
    };
  }

  private async getTaskStatistics(accountUuid: string, today: Date, tomorrow: Date) {
    // 直接使用 Prisma 查询，不经过 domain-server
    const result = await this.prisma.taskInstance.aggregate({
      where: {
        accountUuid,
        instanceDate: { gte: today.getTime(), lt: tomorrow.getTime() },
      },
      _count: { _all: true },
    });

    const completed = await this.prisma.taskInstance.count({
      where: {
        accountUuid,
        instanceDate: { gte: today.getTime(), lt: tomorrow.getTime() },
        status: 'COMPLETED',
      },
    });

    const total = result._count._all;
    return {
      todayTotal: total,
      todayCompleted: completed,
      completionRate: total > 0 ? completed / total : 0,
    };
  }

  // ... 其他统计方法
}
```

**关键点：**
1. 使用 Prisma 直接查询，不加载 Domain Model
2. 并行查询提高性能
3. 返回简单的 DTO，不是聚合根

---

### 5.2 Todo 列表 (Today's Tasks)

**展示内容：**
- 今日待办任务列表
- 任务状态（待完成、进行中、已完成）
- 快速操作（完成、跳过、推迟）

**实现方案：调用 Task 模块的 Query Service**

```typescript
// apps/api/src/modules/task/queries/TaskQueries.ts

export interface TodayTaskItem {
  uuid: string;
  title: string;
  status: TaskInstanceStatus;
  scheduledTime: string | null;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  templateName: string;
  isOverdue: boolean;
}

export class TaskQueries {
  constructor(private prisma: PrismaClient) {}

  async getTodayTasks(accountUuid: string): Promise<TodayTaskItem[]> {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(new Date());

    const instances = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        instanceDate: { gte: today.getTime(), lt: tomorrow.getTime() },
      },
      include: {
        template: {
          select: {
            name: true,
            importance: true,
            urgency: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },  // 未完成的排前面
        { scheduledStartTime: 'asc' },
      ],
    });

    return instances.map(inst => ({
      uuid: inst.uuid,
      title: inst.template.name,
      status: inst.status as TaskInstanceStatus,
      scheduledTime: inst.scheduledStartTime 
        ? format(new Date(inst.scheduledStartTime), 'HH:mm') 
        : null,
      importance: inst.template.importance as ImportanceLevel,
      urgency: inst.template.urgency as UrgencyLevel,
      templateName: inst.template.name,
      isOverdue: inst.status === 'PENDING' && Date.now() > (inst.scheduledEndTime ?? Infinity),
    }));
  }
}
```

**Dashboard 调用方式：**

```typescript
// apps/api/src/modules/dashboard/queries/DashboardQueries.ts

export class DashboardQueries {
  constructor(
    private statisticsQueries: StatisticsQueries,
    private taskQueries: TaskQueries,
    private goalQueries: GoalQueries,
    private scheduleQueries: ScheduleQueries,
  ) {}

  async getTodayTasks(accountUuid: string) {
    return this.taskQueries.getTodayTasks(accountUuid);
  }
}
```

---

### 5.3 日程表 (Schedule View)

**展示内容：**
- 今日/本周日程时间线
- 任务时间块
- 提醒时间点
- 目标检查点

**实现方案：调用 Schedule 模块的 Query Service**

```typescript
// apps/api/src/modules/schedule/queries/ScheduleQueries.ts

export interface ScheduleTimelineItem {
  uuid: string;
  type: 'task' | 'reminder' | 'goal_checkpoint';
  title: string;
  startTime: number;
  endTime: number | null;
  status: 'pending' | 'completed' | 'skipped';
  color: string;
  sourceModule: string;
  sourceUuid: string;
}

export class ScheduleQueries {
  constructor(private prisma: PrismaClient) {}

  async getTimelineForDateRange(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ScheduleTimelineItem[]> {
    const startTs = startDate.getTime();
    const endTs = endDate.getTime();

    // 查询调度任务
    const scheduleTasks = await this.prisma.scheduleTask.findMany({
      where: {
        accountUuid,
        OR: [
          { nextExecutionAt: { gte: startTs, lte: endTs } },
          { lastExecutedAt: { gte: startTs, lte: endTs } },
        ],
      },
    });

    // 查询任务实例
    const taskInstances = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        instanceDate: { gte: startTs, lte: endTs },
      },
      include: { template: { select: { name: true } } },
    });

    // 查询提醒
    const reminders = await this.prisma.reminderTemplate.findMany({
      where: {
        accountUuid,
        status: 'ACTIVE',
        // ... 时间条件
      },
    });

    // 合并并排序
    const timeline: ScheduleTimelineItem[] = [
      ...this.mapTaskInstances(taskInstances),
      ...this.mapReminders(reminders),
      ...this.mapScheduleTasks(scheduleTasks),
    ];

    return timeline.sort((a, b) => a.startTime - b.startTime);
  }
}
```

---

### 5.4 目标卡片 (Goal Cards)

**展示内容：**
- 活跃目标列表（3-5 个）
- 目标进度条
- 关键结果完成情况
- 即将到期提醒

**实现方案：调用 Goal 模块的 Query Service**

```typescript
// apps/api/src/modules/goal/queries/GoalQueries.ts

export interface DashboardGoalCard {
  uuid: string;
  title: string;
  progress: number;
  targetDate: number | null;
  daysRemaining: number | null;
  status: GoalStatus;
  importance: ImportanceLevel;
  keyResults: {
    total: number;
    completed: number;
  };
  isNearDeadline: boolean;
}

export class GoalQueries {
  constructor(private prisma: PrismaClient) {}

  async getActiveGoalsForDashboard(
    accountUuid: string,
    limit: number = 5,
  ): Promise<DashboardGoalCard[]> {
    const goals = await this.prisma.goal.findMany({
      where: {
        accountUuid,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      include: {
        keyResults: {
          select: {
            uuid: true,
            progress: true,
            status: true,
          },
        },
      },
      orderBy: [
        { importance: 'desc' },
        { targetDate: 'asc' },
      ],
      take: limit,
    });

    const now = Date.now();
    const NEAR_DEADLINE_DAYS = 7;

    return goals.map(goal => {
      const daysRemaining = goal.targetDate 
        ? Math.ceil((goal.targetDate - now) / (1000 * 60 * 60 * 24))
        : null;

      const completedKRs = goal.keyResults.filter(kr => kr.status === 'COMPLETED').length;

      return {
        uuid: goal.uuid,
        title: goal.title,
        progress: goal.progress,
        targetDate: goal.targetDate,
        daysRemaining,
        status: goal.status as GoalStatus,
        importance: goal.importance as ImportanceLevel,
        keyResults: {
          total: goal.keyResults.length,
          completed: completedKRs,
        },
        isNearDeadline: daysRemaining !== null && daysRemaining <= NEAR_DEADLINE_DAYS,
      };
    });
  }
}
```

---

### 5.5 提醒列表 (Upcoming Reminders)

**展示内容：**
- 即将触发的提醒
- 今日已触发的提醒
- 快速操作（暂停、跳过）

```typescript
// apps/api/src/modules/reminder/queries/ReminderQueries.ts

export interface UpcomingReminder {
  uuid: string;
  title: string;
  nextTriggerTime: number;
  importance: ImportanceLevel;
  groupName: string | null;
  timeUntilTrigger: string; // "5分钟后", "1小时后"
}

export class ReminderQueries {
  constructor(private prisma: PrismaClient) {}

  async getUpcomingReminders(
    accountUuid: string,
    limit: number = 10,
  ): Promise<UpcomingReminder[]> {
    const now = Date.now();
    const next24h = now + 24 * 60 * 60 * 1000;

    const reminders = await this.prisma.reminderTemplate.findMany({
      where: {
        accountUuid,
        status: 'ACTIVE',
        enabled: true,
        // 假设有 nextTriggerAt 字段
        nextTriggerAt: { gte: now, lte: next24h },
      },
      include: {
        group: { select: { name: true } },
      },
      orderBy: { nextTriggerAt: 'asc' },
      take: limit,
    });

    return reminders.map(r => ({
      uuid: r.uuid,
      title: r.title,
      nextTriggerTime: r.nextTriggerAt!,
      importance: r.importance as ImportanceLevel,
      groupName: r.group?.name ?? null,
      timeUntilTrigger: this.formatTimeUntil(r.nextTriggerAt! - now),
    }));
  }

  private formatTimeUntil(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}分钟后`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时后`;
    return `${Math.floor(hours / 24)}天后`;
  }
}
```

---

## 6. 交互操作设计

Dashboard 上的所有操作都通过调用各模块的 Command API 实现，Dashboard 本身不包含业务逻辑。

### 6.1 Todo 列表 - 完成任务操作

**场景：用户点击任务左侧的小圆圈，弹出"记录完成"Dialog**

```
┌─────────────────────────────────────────────────────────────┐
│  📋 今日任务                                                 │
├─────────────────────────────────────────────────────────────┤
│  ○ 晨间锻炼 30 分钟              08:00    🔴 重要            │
│  ◉ 阅读《原子习惯》              09:30    ✅ 已完成          │
│  ○ 整理工作邮件                  10:00    🟡 普通            │
│  ○ 团队周会                      14:00    🔴 重要            │
└─────────────────────────────────────────────────────────────┘
        │
        │ 点击 ○
        ▼
┌─────────────────────────────────────────────────────────────┐
│  📝 记录完成 - 晨间锻炼 30 分钟                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  完成时间: [08:15] ▼                                        │
│                                                              │
│  完成情况:                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 今天做了 25 分钟有氧 + 5 分钟拉伸                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  心情: 😊 😐 😞                                              │
│                                                              │
│  [取消]                              [确认完成]              │
└─────────────────────────────────────────────────────────────┘
```

**前端实现：**

```typescript
// apps/web/src/features/dashboard/components/TodoList/TodoItem.tsx

interface TodoItemProps {
  task: TodayTaskItem;
  onComplete: (taskUuid: string, record: CompletionRecordInput) => void;
}

export function TodoItem({ task, onComplete }: TodoItemProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const handleCircleClick = () => {
    if (task.status !== 'COMPLETED') {
      setShowCompleteDialog(true);
    }
  };

  const handleConfirmComplete = async (record: CompletionRecordInput) => {
    await onComplete(task.uuid, record);
    setShowCompleteDialog(false);
  };

  return (
    <>
      <div className="todo-item">
        <button 
          className={`completion-circle ${task.status === 'COMPLETED' ? 'completed' : ''}`}
          onClick={handleCircleClick}
        >
          {task.status === 'COMPLETED' ? '◉' : '○'}
        </button>
        <span className="task-title">{task.title}</span>
        <span className="scheduled-time">{task.scheduledTime}</span>
        <ImportanceBadge level={task.importance} />
      </div>

      <CompleteTaskDialog
        open={showCompleteDialog}
        task={task}
        onClose={() => setShowCompleteDialog(false)}
        onConfirm={handleConfirmComplete}
      />
    </>
  );
}
```

**Dialog 组件：**

```typescript
// apps/web/src/features/dashboard/components/TodoList/CompleteTaskDialog.tsx

interface CompleteTaskDialogProps {
  open: boolean;
  task: TodayTaskItem;
  onClose: () => void;
  onConfirm: (record: CompletionRecordInput) => void;
}

export function CompleteTaskDialog({ open, task, onClose, onConfirm }: CompleteTaskDialogProps) {
  const [completedAt, setCompletedAt] = useState(new Date());
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<'good' | 'neutral' | 'bad'>('good');

  const handleSubmit = () => {
    onConfirm({
      completedAt: completedAt.getTime(),
      note,
      mood,
      quality: mood === 'good' ? 5 : mood === 'neutral' ? 3 : 1,
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>📝 记录完成 - {task.title}</DialogTitle>
      <DialogContent>
        <TimeInput 
          label="完成时间" 
          value={completedAt} 
          onChange={setCompletedAt} 
        />
        <TextArea
          label="完成情况"
          placeholder="记录一下这次完成的情况..."
          value={note}
          onChange={setNote}
        />
        <MoodSelector value={mood} onChange={setMood} />
      </DialogContent>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>取消</Button>
        <Button variant="primary" onClick={handleSubmit}>确认完成</Button>
      </DialogActions>
    </Dialog>
  );
}
```

**API 调用（调用 Task 模块的 Command API）：**

```typescript
// apps/web/src/features/dashboard/hooks/useTodoActions.ts

export function useTodoActions() {
  const queryClient = useQueryClient();

  const completeTask = useMutation({
    mutationFn: async ({ taskUuid, record }: { 
      taskUuid: string; 
      record: CompletionRecordInput 
    }) => {
      // 调用 Task 模块的 Command API
      return taskApi.completeInstance(taskUuid, record);
    },
    onSuccess: () => {
      // 局部刷新 Dashboard 数据
      queryClient.invalidateQueries(['dashboard', 'todayTasks']);
      queryClient.invalidateQueries(['dashboard', 'statistics']);
      toast.success('任务已完成 🎉');
    },
  });

  const skipTask = useMutation({
    mutationFn: async ({ taskUuid, reason }: { taskUuid: string; reason: string }) => {
      return taskApi.skipInstance(taskUuid, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', 'todayTasks']);
      toast.info('任务已跳过');
    },
  });

  return { completeTask, skipTask };
}
```

---

### 6.2 专注模式 (Focus Mode)

**场景：用户点击专注按钮，选择要专注的目标，进入专注模式**

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard 顶部工具栏                                        │
├─────────────────────────────────────────────────────────────┤
│  🏠 Dashboard    📊 统计    📅 日程    [🎯 专注模式]         │
└─────────────────────────────────────────────────────────────┘
        │
        │ 点击专注模式
        ▼
┌─────────────────────────────────────────────────────────────┐
│  🎯 进入专注模式                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  选择专注目标 (可多选):                                      │
│                                                              │
│  ☑️ 完成 Q4 销售报告        进度 65%    ⏰ 还剩 3 天         │
│  ☑️ 学习 React 高级模式     进度 40%    ⏰ 还剩 14 天        │
│  ☐  整理个人知识库          进度 20%    ⏰ 还剩 30 天        │
│  ☐  健身计划 - 减重 5kg     进度 30%    ⏰ 还剩 45 天        │
│                                                              │
│  专注时长: [25 分钟] ▼   (番茄钟)                           │
│                                                              │
│  专注期间:                                                   │
│  ☑️ 只显示选中目标的任务                                    │
│  ☑️ 屏蔽非相关提醒                                          │
│  ☐  开启勿扰模式                                            │
│                                                              │
│  [取消]                              [开始专注]              │
└─────────────────────────────────────────────────────────────┘
        │
        │ 开始专注
        ▼
┌─────────────────────────────────────────────────────────────┐
│  🎯 专注模式 - 剩余 24:35                          [退出]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  当前专注目标:                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🎯 完成 Q4 销售报告                           65% ████░ ││
│  │ 🎯 学习 React 高级模式                        40% ██░░░ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  📋 相关任务 (只显示选中目标的任务):                         │
│  ○ 收集 Q4 销售数据                              🔴 重要    │
│  ○ 阅读 React Hooks 文档                         🟡 普通    │
│  ○ 编写报告第三章                                🔴 重要    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**前端状态管理：**

```typescript
// apps/web/src/features/focus/stores/focusStore.ts

interface FocusState {
  isActive: boolean;
  selectedGoalUuids: string[];
  duration: number;  // 分钟
  startedAt: number | null;
  remainingTime: number;
  settings: {
    filterTasksByGoals: boolean;
    blockUnrelatedReminders: boolean;
    enableDND: boolean;
  };
}

export const useFocusStore = create<FocusState & FocusActions>((set, get) => ({
  // State
  isActive: false,
  selectedGoalUuids: [],
  duration: 25,
  startedAt: null,
  remainingTime: 0,
  settings: {
    filterTasksByGoals: true,
    blockUnrelatedReminders: true,
    enableDND: false,
  },

  // Actions
  startFocus: async (goalUuids: string[], duration: number) => {
    // 调用后端 API 开始专注会话
    const session = await focusApi.startSession({
      goalUuids,
      duration,
      settings: get().settings,
    });

    set({
      isActive: true,
      selectedGoalUuids: goalUuids,
      duration,
      startedAt: Date.now(),
      remainingTime: duration * 60,
    });

    // 启动倒计时
    get().startTimer();
  },

  endFocus: async () => {
    const { startedAt, duration, selectedGoalUuids } = get();
    
    // 记录专注会话
    await focusApi.endSession({
      goalUuids: selectedGoalUuids,
      actualDuration: Math.floor((Date.now() - startedAt!) / 1000),
      plannedDuration: duration * 60,
    });

    set({
      isActive: false,
      selectedGoalUuids: [],
      startedAt: null,
      remainingTime: 0,
    });
  },

  startTimer: () => {
    const interval = setInterval(() => {
      const remaining = get().remainingTime - 1;
      if (remaining <= 0) {
        clearInterval(interval);
        get().endFocus();
        // 播放提示音/通知
        notifyFocusComplete();
      } else {
        set({ remainingTime: remaining });
      }
    }, 1000);
  },
}));
```

**专注模式下的任务过滤：**

```typescript
// apps/web/src/features/dashboard/hooks/useDashboard.ts

export function useDashboard() {
  const { isActive: isFocusMode, selectedGoalUuids } = useFocusStore();

  // 获取今日任务
  const { data: allTasks } = useQuery({
    queryKey: ['dashboard', 'todayTasks'],
    queryFn: () => dashboardApi.getTodayTasks(),
  });

  // 专注模式下过滤任务
  const todayTasks = useMemo(() => {
    if (!allTasks) return [];
    
    if (isFocusMode && selectedGoalUuids.length > 0) {
      // 只显示与选中目标关联的任务
      return allTasks.filter(task => 
        task.goalBindings?.some(binding => 
          selectedGoalUuids.includes(binding.goalUuid)
        )
      );
    }
    
    return allTasks;
  }, [allTasks, isFocusMode, selectedGoalUuids]);

  return { todayTasks, isFocusMode };
}
```

**专注模式 Dialog：**

```typescript
// apps/web/src/features/focus/components/FocusModeDialog.tsx

export function FocusModeDialog({ open, onClose }: FocusModeDialogProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [duration, setDuration] = useState(25);
  const { startFocus } = useFocusStore();
  
  // 获取活跃目标列表
  const { data: activeGoals } = useQuery({
    queryKey: ['goals', 'active'],
    queryFn: () => goalApi.getActiveGoals(),
  });

  const handleStart = async () => {
    await startFocus(selectedGoals, duration);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogTitle>🎯 进入专注模式</DialogTitle>
      <DialogContent>
        <section>
          <h3>选择专注目标 (可多选)</h3>
          <div className="goal-list">
            {activeGoals?.map(goal => (
              <GoalCheckItem
                key={goal.uuid}
                goal={goal}
                checked={selectedGoals.includes(goal.uuid)}
                onChange={(checked) => {
                  setSelectedGoals(prev => 
                    checked 
                      ? [...prev, goal.uuid]
                      : prev.filter(id => id !== goal.uuid)
                  );
                }}
              />
            ))}
          </div>
        </section>

        <section>
          <h3>专注时长</h3>
          <DurationSelector value={duration} onChange={setDuration} />
        </section>

        <section>
          <h3>专注期间</h3>
          <FocusSettingsForm />
        </section>
      </DialogContent>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>取消</Button>
        <Button 
          variant="primary" 
          onClick={handleStart}
          disabled={selectedGoals.length === 0}
        >
          开始专注
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

### 6.3 快捷创建

**场景：用户想快速创建任务/目标/提醒**

```
Dashboard 右下角浮动按钮:

      ┌─── ➕ 新任务
      │
[➕] ─┼─── 🎯 新目标
      │
      └─── ⏰ 新提醒
```

```typescript
// apps/web/src/features/dashboard/components/QuickCreateFab.tsx

export function QuickCreateFab() {
  const [expanded, setExpanded] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'task' | 'goal' | 'reminder' | null>(null);

  return (
    <>
      <div className="quick-create-fab">
        {expanded && (
          <div className="fab-menu">
            <FabMenuItem 
              icon="📋" 
              label="新任务" 
              onClick={() => setActiveDialog('task')} 
            />
            <FabMenuItem 
              icon="🎯" 
              label="新目标" 
              onClick={() => setActiveDialog('goal')} 
            />
            <FabMenuItem 
              icon="⏰" 
              label="新提醒" 
              onClick={() => setActiveDialog('reminder')} 
            />
          </div>
        )}
        <button 
          className="fab-main"
          onClick={() => setExpanded(!expanded)}
        >
          ➕
        </button>
      </div>

      <QuickCreateTaskDialog 
        open={activeDialog === 'task'} 
        onClose={() => setActiveDialog(null)} 
      />
      <QuickCreateGoalDialog 
        open={activeDialog === 'goal'} 
        onClose={() => setActiveDialog(null)} 
      />
      <QuickCreateReminderDialog 
        open={activeDialog === 'reminder'} 
        onClose={() => setActiveDialog(null)} 
      />
    </>
  );
}
```

---

### 6.4 目标卡片 - 快速记录进度

**场景：用户点击目标卡片上的进度按钮，快速记录今日进展**

```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 完成 Q4 销售报告                                         │
├─────────────────────────────────────────────────────────────┤
│  进度: 65% ████████████░░░░░░░░                             │
│  截止: 12月1日 (还剩 3 天)                                  │
│                                                              │
│  关键结果:                                                   │
│  ✅ 收集数据 (100%)                                         │
│  🔄 分析报告 (60%)                                          │
│  ○ 制作 PPT (0%)                                            │
│                                                              │
│  [📝 记录进展]  [👁️ 查看详情]                               │
└─────────────────────────────────────────────────────────────┘
        │
        │ 点击 "记录进展"
        ▼
┌─────────────────────────────────────────────────────────────┐
│  📝 记录目标进展                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  更新关键结果进度:                                           │
│                                                              │
│  分析报告: [60%] ──────●────── [80%]                        │
│                                                              │
│  今日进展:                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 完成了数据可视化部分，明天继续写结论               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [取消]                              [保存进展]              │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.5 操作与 Query 的协作模式

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard 架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │   Query Side        │    │   Command Side      │        │
│  │   (数据展示)        │    │   (操作执行)        │        │
│  ├─────────────────────┤    ├─────────────────────┤        │
│  │ Dashboard Queries   │    │ 调用各模块 API:     │        │
│  │ ├── Statistics      │    │ ├── Task API        │        │
│  │ ├── TodayTasks      │◄───│ ├── Goal API        │        │
│  │ ├── ActiveGoals     │ 刷 │ ├── Reminder API    │        │
│  │ ├── Schedule        │ 新 │ └── Focus API       │        │
│  │ └── Reminders       │    │                     │        │
│  └─────────────────────┘    └─────────────────────┘        │
│           │                          │                      │
│           │                          │                      │
│           ▼                          ▼                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              前端状态管理 (React Query)             │   │
│  │  - 缓存 Query 数据                                  │   │
│  │  - Command 成功后 invalidate 相关 Query             │   │
│  │  - 乐观更新 (Optimistic Update)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键设计原则：**

1. **Dashboard 不实现业务逻辑** - 操作通过调用各模块 API
2. **精确失效** - 操作成功后只刷新相关数据
3. **乐观更新** - 提升用户体验
4. **状态隔离** - 专注模式等状态用独立 Store 管理

---

## 7. API 设计

### 7.1 Dashboard API 端点（Query Side）

采用 **BFF (Backend For Frontend)** 模式，为 Dashboard 专门设计 API：

```
GET /api/dashboard
├── /statistics          # 统计数据
├── /today-tasks         # 今日任务列表
├── /upcoming-reminders  # 即将触发的提醒
├── /active-goals        # 活跃目标卡片
├── /schedule            # 日程时间线
│   ├── ?date=2025-11-28           # 指定日期
│   └── ?range=week                # 周视图
└── /all                 # 一次性获取所有数据（首屏加载）
```

### 5.2 统一响应格式

```typescript
// apps/api/src/modules/dashboard/contracts/DashboardDTO.ts

export interface DashboardAllResponse {
  statistics: DashboardStatistics;
  todayTasks: TodayTaskItem[];
  upcomingReminders: UpcomingReminder[];
  activeGoals: DashboardGoalCard[];
  schedule: ScheduleTimelineItem[];
  lastUpdated: number;
}
```

### 5.3 Controller 实现

```typescript
// apps/api/src/modules/dashboard/controllers/DashboardController.ts

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardQueries: DashboardQueries) {}

  /**
   * 获取 Dashboard 全部数据（首屏加载用）
   */
  @Get('all')
  async getAll(@User() user: AuthUser): Promise<DashboardAllResponse> {
    const accountUuid = user.accountUuid;

    const [statistics, todayTasks, upcomingReminders, activeGoals, schedule] = 
      await Promise.all([
        this.dashboardQueries.getStatistics(accountUuid),
        this.dashboardQueries.getTodayTasks(accountUuid),
        this.dashboardQueries.getUpcomingReminders(accountUuid),
        this.dashboardQueries.getActiveGoals(accountUuid),
        this.dashboardQueries.getTodaySchedule(accountUuid),
      ]);

    return {
      statistics,
      todayTasks,
      upcomingReminders,
      activeGoals,
      schedule,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 单独获取统计数据（用于局部刷新）
   */
  @Get('statistics')
  async getStatistics(@User() user: AuthUser): Promise<DashboardStatistics> {
    return this.dashboardQueries.getStatistics(user.accountUuid);
  }

  // ... 其他端点
}
```

---

## 8. 前端数据获取策略

### 8.1 首屏加载策略

```typescript
// apps/web/src/features/dashboard/hooks/useDashboard.ts

export function useDashboard() {
  // 首屏：一次性加载所有数据
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', 'all'],
    queryFn: () => dashboardApi.getAll(),
    staleTime: 30 * 1000,  // 30秒内不重新请求
    refetchInterval: 60 * 1000, // 每分钟自动刷新
  });

  return { data, isLoading, refetch };
}
```

### 8.2 局部刷新策略

```typescript
// 当用户完成任务时，只刷新相关部分
const completeTask = useMutation({
  mutationFn: taskApi.complete,
  onSuccess: () => {
    // 精确失效
    queryClient.invalidateQueries(['dashboard', 'todayTasks']);
    queryClient.invalidateQueries(['dashboard', 'statistics']);
    // 不刷新 goals 和 reminders
  },
});
```

### 8.3 实时更新（可选）

```typescript
// 使用 WebSocket 接收实时更新
useEffect(() => {
  const ws = new WebSocket('/ws/dashboard');
  
  ws.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    
    switch (type) {
      case 'TASK_COMPLETED':
        queryClient.setQueryData(['dashboard', 'todayTasks'], (old) => 
          updateTaskInList(old, data)
        );
        break;
      case 'REMINDER_TRIGGERED':
        queryClient.invalidateQueries(['dashboard', 'upcomingReminders']);
        break;
    }
  };

  return () => ws.close();
}, []);
```

---

## 9. 性能优化

### 9.1 缓存策略

```typescript
// apps/api/src/modules/dashboard/services/DashboardCacheService.ts

export class DashboardCacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  private TTL = {
    statistics: 30 * 1000,      // 30秒
    todayTasks: 10 * 1000,      // 10秒
    activeGoals: 60 * 1000,     // 1分钟
    schedule: 30 * 1000,        // 30秒
  };

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, { 
      data, 
      expiry: Date.now() + (ttl ?? this.TTL.statistics) 
    });
    return data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 9.2 数据库查询优化

```typescript
// 使用索引优化常用查询
// prisma/schema.prisma

model TaskInstance {
  // ...
  @@index([accountUuid, instanceDate])
  @@index([accountUuid, status, instanceDate])
}

model Goal {
  // ...
  @@index([accountUuid, status])
  @@index([accountUuid, importance, targetDate])
}
```

### 9.3 响应时间目标

| 端点 | 目标响应时间 | 优化手段 |
|------|-------------|---------|
| `/dashboard/all` | ≤ 200ms | 并行查询 + 缓存 |
| `/dashboard/statistics` | ≤ 50ms | 内存缓存 |
| `/dashboard/today-tasks` | ≤ 100ms | 索引 + 分页 |

---

## 10. 实现路线图

### Phase 1: 基础架构 (当前)

- [x] 定义 Dashboard DTO 接口
- [ ] 创建 Dashboard Query Services
- [ ] 移除对 `domain-server` 的依赖
- [ ] 实现 `/dashboard/statistics` API

### Phase 2: 核心组件

- [ ] 实现 `/dashboard/today-tasks` API
- [ ] 实现 `/dashboard/active-goals` API
- [ ] 实现 `/dashboard/upcoming-reminders` API

### Phase 3: 日程视图

- [ ] 实现 `/dashboard/schedule` API
- [ ] 支持日/周视图切换

### Phase 4: 性能优化

- [ ] 添加缓存层
- [ ] 实现 `/dashboard/all` 聚合 API
- [ ] 添加 WebSocket 实时更新

### Phase 5: 前端集成

- [ ] 创建 Dashboard 组件
- [ ] 实现首屏加载优化
- [ ] 实现局部刷新策略

---

## 总结

### 核心原则

1. **Dashboard 是纯读模块** - 只需要 Query Service，不需要 Domain Model
2. **不依赖 domain-server** - 直接使用 Prisma 查询或调用模块 Query Service
3. **CQRS 分离** - Query Side 可以跨聚合边界自由查询
4. **性能优先** - 并行查询 + 缓存 + 精确失效

### 文件结构

```
apps/api/src/modules/dashboard/
├── controllers/
│   └── DashboardController.ts
├── queries/
│   ├── StatisticsQueries.ts     # 统计数据查询
│   ├── DashboardQueries.ts      # 聚合查询入口
│   └── index.ts
├── services/
│   └── DashboardCacheService.ts
├── dto/
│   └── DashboardDTO.ts
└── index.ts
```

### 依赖关系

```
DashboardController
        │
        ▼
DashboardQueries (Query Side)
        │
        ├──► StatisticsQueries (直接 Prisma)
        ├──► TaskQueries (Task 模块)
        ├──► GoalQueries (Goal 模块)
        ├──► ReminderQueries (Reminder 模块)
        └──► ScheduleQueries (Schedule 模块)
        │
        ▼
    Prisma Client (直接查库)
```

**注意：完全不依赖 `@dailyuse/domain-server`！**
