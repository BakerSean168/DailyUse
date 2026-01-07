# EPIC-016: Schedule 模块优化与 Desktop 集成

## 📋 Epic 概述

### 目标
优化 Schedule 模块架构，统一 API/Web/Desktop 三端实现，确保 Desktop 端拥有完整的调度执行能力。

### 背景
当前 Desktop 端的 Schedule 模块只有 CRUD 能力，缺少核心的**任务执行层**。API 端已实现完整的 `ScheduleTaskExecutor` + `CronJobManager` 架构，Desktop 需要对齐。

### 核心设计决策

#### 🎯 优先队列调度器（替代轮询方案）

**为什么不用轮询？**
| 方案 | 精度 | 资源消耗 | 优雅度 |
|------|------|---------|--------|
| 轮询 (setInterval) | ⭐⭐ 分钟级 | 中等（无效查询多） | ❌ 不优雅 |
| node-cron（每任务一个） | ⭐⭐⭐⭐⭐ 秒级 | 高（任务多时） | ⭐⭐⭐ |
| **优先队列 + 单 Timer** | ⭐⭐⭐⭐⭐ 毫秒级 | 低（只有一个 timer） | ✅ 最优雅 |

**优先队列核心思想：**
```
┌─────────────────────────────────────────────────────────────────┐
│  优先队列（按 nextRunAt 排序的最小堆）                           │
│                                                                 │
│  [Task A: 10:05] ← 堆顶（最近）                                 │
│  [Task B: 10:15]                                                │
│  [Task C: 11:00]                                                │
│  [Task D: 14:30]                                                │
│                                                                 │
│  只设置一个 setTimeout → 指向 Task A (10:05)                    │
│                                                                 │
│  当 Task A 执行后：                                             │
│  1. 从堆中取出 Task A                                           │
│  2. 执行 Task A                                                 │
│  3. 如果是循环任务，计算下次执行时间并重新入堆                    │
│  4. 设置新的 setTimeout → 指向新的堆顶 (Task B: 10:15)          │
└─────────────────────────────────────────────────────────────────┘
```

### 架构原则：包抽象 + 适配器模式

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用层 (Apps)                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│     API         │      Web        │         Desktop             │
│  (Server-side)  │  (Client-side)  │  (Hybrid: Main + Renderer)  │
├─────────────────┴─────────────────┴─────────────────────────────┤
│                   application-server (包)                        │
│  - ScheduleTaskQueue (优先队列调度器)                            │
│  - MinHeap (数据结构)                                            │
│  - executeScheduleTask, calculateNextRun                        │
│  - IScheduleTimer (Timer 抽象接口)                               │
├─────────────────────────────────────────────────────────────────┤
│                   application-client (包)                        │
│  - ScheduleTaskApplicationService, ScheduleEventService...      │
├─────────────────────────────────────────────────────────────────┤
│                     domain-server (包)                           │
│  - ScheduleTask, ScheduleTaskFactory, ReminderScheduleStrategy  │
├─────────────────────────────────────────────────────────────────┤
│                     domain-client (包)                           │
│  - ScheduleTask (Client), ScheduleConfig                        │
├─────────────────────────────────────────────────────────────────┤
│                  infrastructure-server (包)                      │
│  - ScheduleContainer, PrismaScheduleTaskRepository              │
├─────────────────────────────────────────────────────────────────┤
│                       contracts (包)                             │
│  - ScheduleTaskEventTypes, DTOs, Enums                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 当前状态分析

### API 端实现（完整 ✅）

| 组件 | 路径 | 状态 |
|------|------|------|
| ScheduleTaskExecutor | `apps/api/src/modules/schedule/application/services/` | ✅ 完整 |
| CronJobManager | `apps/api/src/modules/schedule/infrastructure/cron/` | ✅ 完整 |
| ScheduleBootstrap | `apps/api/src/modules/schedule/application/services/` | ✅ 完整 |
| ScheduleMonitor | `apps/api/src/modules/schedule/infrastructure/monitoring/` | ✅ 完整 |
| ReminderEventHandler | `apps/api/src/modules/reminder/application/event-handlers/` | ✅ 完整 |

### Web 端实现（纯客户端 ✅）

| 组件 | 路径 | 状态 |
|------|------|------|
| ScheduleWebApplicationService | `apps/web/src/modules/schedule/services/` | ✅ 完整 |
| scheduleApiClient | `apps/web/src/modules/schedule/infrastructure/api/` | ✅ 完整 |

**Web 职责：** 纯客户端，通过 API 调用服务端，不负责执行

### Desktop 端实现（缺失执行层 ⚠️）

| 组件 | 路径 | 状态 |
|------|------|------|
| ScheduleDesktopApplicationService | `apps/desktop/src/main/modules/schedule/application/` | ✅ CRUD 完整 |
| IPC Handlers | `apps/desktop/src/main/modules/schedule/ipc/` | ✅ 完整 |
| **ScheduleTaskQueue** | - | ❌ 缺失 |
| **ScheduleTaskExecutor** | - | ❌ 缺失 |
| **Reminder → ScheduleTask 集成** | - | ❌ 缺失 |

---

## 📊 Story 拆解

### Story 1: 事件类型标准化 ✅ (已完成)

**状态：** 已完成

**完成内容：**
- 创建 `packages/contracts/src/modules/schedule/event-types.ts`
- 定义 `ScheduleTaskEventTypes` 和 `ScheduleStatisticsEventTypes`
- 更新 domain-server 使用新常量
- 更新 API/Desktop 事件监听器

---

### Story 2: 提取 ScheduleTaskQueue 到 application-server 包

**目标：** 创建可复用的优先队列调度器，供 API 和 Desktop 共用

**文件结构：**
```
packages/application-server/src/schedule/
├── services/
│   ├── execute-schedule-task.ts      # 核心执行逻辑
│   ├── calculate-next-run.ts         # cron 表达式解析
│   └── index.ts
└── scheduler/
    ├── ScheduleTaskQueue.ts          # 优先队列调度器
    ├── MinHeap.ts                    # 最小堆数据结构
    ├── IScheduleTimer.ts             # Timer 抽象接口
    ├── IScheduleMonitor.ts           # 监控抽象接口
    └── index.ts
```

#### 2.1 Timer 抽象接口

```typescript
// packages/application-server/src/schedule/scheduler/IScheduleTimer.ts

/**
 * 调度器 Timer 抽象
 * 允许不同运行时提供自己的 timer 实现
 */
export interface IScheduleTimer {
  /**
   * 设置定时器
   * @param callback 回调函数
   * @param delayMs 延迟毫秒数
   * @returns timer ID
   */
  setTimeout(callback: () => void, delayMs: number): unknown;
  
  /**
   * 清除定时器
   */
  clearTimeout(id: unknown): void;
  
  /**
   * 获取当前时间戳
   */
  now(): number;
}

/**
 * Node.js / Electron 默认实现
 */
export class NodeTimer implements IScheduleTimer {
  setTimeout(callback: () => void, delayMs: number): NodeJS.Timeout {
    return global.setTimeout(callback, delayMs);
  }
  
  clearTimeout(id: unknown): void {
    global.clearTimeout(id as NodeJS.Timeout);
  }
  
  now(): number {
    return Date.now();
  }
}
```

#### 2.2 最小堆数据结构

```typescript
// packages/application-server/src/schedule/scheduler/MinHeap.ts

export interface HeapItem {
  taskUuid: string;
  nextRunAt: number;  // 毫秒时间戳
}

/**
 * 最小堆 - 用于优先队列调度
 * 堆顶始终是 nextRunAt 最小（最近）的任务
 */
export class MinHeap<T extends HeapItem> {
  private heap: T[] = [];

  get size(): number {
    return this.heap.length;
  }

  /**
   * 查看堆顶元素（不移除）
   */
  peek(): T | undefined {
    return this.heap[0];
  }

  /**
   * 插入元素
   */
  insert(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * 提取最小元素（移除堆顶）
   */
  extractMin(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  /**
   * 移除指定 taskUuid 的元素
   */
  remove(taskUuid: string): boolean {
    const index = this.heap.findIndex(item => item.taskUuid === taskUuid);
    if (index === -1) return false;

    if (index === this.heap.length - 1) {
      this.heap.pop();
    } else {
      this.heap[index] = this.heap.pop()!;
      this.bubbleUp(index);
      this.bubbleDown(index);
    }
    return true;
  }

  /**
   * 更新指定任务的执行时间
   */
  update(taskUuid: string, newNextRunAt: number): boolean {
    const index = this.heap.findIndex(item => item.taskUuid === taskUuid);
    if (index === -1) return false;

    this.heap[index].nextRunAt = newNextRunAt;
    this.bubbleUp(index);
    this.bubbleDown(index);
    return true;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].nextRunAt <= this.heap[index].nextRunAt) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.heap[left].nextRunAt < this.heap[smallest].nextRunAt) {
        smallest = left;
      }
      if (right < length && this.heap[right].nextRunAt < this.heap[smallest].nextRunAt) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}
```

#### 2.3 优先队列调度器

```typescript
// packages/application-server/src/schedule/scheduler/ScheduleTaskQueue.ts

import { MinHeap, HeapItem } from './MinHeap';
import { IScheduleTimer, NodeTimer } from './IScheduleTimer';
import { IScheduleMonitor } from './IScheduleMonitor';
import { calculateNextRun } from '../services/calculate-next-run';
import type { IScheduleTaskRepository } from '@dailyuse/infrastructure-server';
import type { IEventBus, ILogger } from '@dailyuse/utils';

export interface ScheduledItem extends HeapItem {
  taskName: string;
  cronExpression: string | null;
  timezone?: string;
}

export interface ScheduleTaskQueueConfig {
  timer?: IScheduleTimer;
  repository: IScheduleTaskRepository;
  eventBus: IEventBus;
  logger: ILogger;
  monitor?: IScheduleMonitor;
  /** 执行任务的回调 */
  onExecuteTask: (taskUuid: string) => Promise<void>;
}

/**
 * ScheduleTaskQueue - 优先队列调度器
 * 
 * 核心思想：
 * 1. 维护一个按 nextRunAt 排序的优先队列（最小堆）
 * 2. 只设置一个 setTimeout 指向最近的任务
 * 3. 任务执行后，计算下次执行时间并重新入队
 * 
 * 优势：
 * - 精度：毫秒级
 * - 资源：只有一个活跃的 timer
 * - 内存：O(n) 存储任务引用
 */
export class ScheduleTaskQueue {
  private queue: MinHeap<ScheduledItem>;
  private currentTimer: unknown = null;
  private isRunning = false;

  private timer: IScheduleTimer;
  private repository: IScheduleTaskRepository;
  private eventBus: IEventBus;
  private logger: ILogger;
  private monitor?: IScheduleMonitor;
  private onExecuteTask: (taskUuid: string) => Promise<void>;

  constructor(config: ScheduleTaskQueueConfig) {
    this.queue = new MinHeap<ScheduledItem>();
    this.timer = config.timer ?? new NodeTimer();
    this.repository = config.repository;
    this.eventBus = config.eventBus;
    this.logger = config.logger;
    this.monitor = config.monitor;
    this.onExecuteTask = config.onExecuteTask;
  }

  /**
   * 启动调度器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('ScheduleTaskQueue already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('ScheduleTaskQueue started');

    // 从数据库加载所有活跃任务
    await this.loadActiveTasks();
    
    // 调度下一个任务
    this.scheduleNext();
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.currentTimer) {
      this.timer.clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.isRunning = false;
    this.logger.info('ScheduleTaskQueue stopped');
  }

  /**
   * 添加任务到队列
   */
  addTask(item: ScheduledItem): void {
    if (!item.nextRunAt || item.nextRunAt <= 0) {
      this.logger.warn('Task has no valid nextRunAt, skipping', { 
        taskUuid: item.taskUuid 
      });
      return;
    }

    this.queue.insert(item);
    this.logger.debug('Task added to queue', {
      taskUuid: item.taskUuid,
      taskName: item.taskName,
      nextRunAt: new Date(item.nextRunAt).toISOString(),
    });

    // 如果新任务比当前最近的任务更早，重新调度
    if (this.isRunning) {
      this.reschedule();
    }
  }

  /**
   * 从队列中移除任务
   */
  removeTask(taskUuid: string): boolean {
    const removed = this.queue.remove(taskUuid);
    if (removed) {
      this.logger.debug('Task removed from queue', { taskUuid });
      this.reschedule();
    }
    return removed;
  }

  /**
   * 更新任务的执行时间
   */
  updateTaskSchedule(taskUuid: string, newNextRunAt: number): boolean {
    const updated = this.queue.update(taskUuid, newNextRunAt);
    if (updated) {
      this.logger.debug('Task schedule updated', { 
        taskUuid, 
        newNextRunAt: new Date(newNextRunAt).toISOString() 
      });
      this.reschedule();
    }
    return updated;
  }

  /**
   * 暂停任务（从队列移除但不删除）
   */
  pauseTask(taskUuid: string): boolean {
    return this.removeTask(taskUuid);
  }

  /**
   * 恢复任务（重新加入队列）
   */
  async resumeTask(taskUuid: string): Promise<boolean> {
    const task = await this.repository.findByUuid(taskUuid);
    if (!task || !task.isActive() || !task.enabled) {
      return false;
    }

    const nextRunAt = task.nextRunAt?.getTime();
    if (!nextRunAt) return false;

    this.addTask({
      taskUuid: task.uuid,
      taskName: task.taskName,
      nextRunAt,
      cronExpression: task.schedule.cronExpression,
      timezone: task.schedule.timezone,
    });

    return true;
  }

  /**
   * 检查并执行所有错过的任务（用于系统休眠恢复）
   */
  async checkMissedTasks(): Promise<{ executed: number; failed: number }> {
    const now = this.timer.now();
    const results = { executed: 0, failed: 0 };

    while (this.queue.size > 0) {
      const next = this.queue.peek();
      if (!next || next.nextRunAt > now) break;

      // 取出并执行
      const item = this.queue.extractMin()!;
      try {
        await this.executeTask(item);
        results.executed++;
      } catch (error) {
        results.failed++;
        this.logger.error('Missed task execution failed', {
          taskUuid: item.taskUuid,
          error,
        });
      }
    }

    // 重新调度
    this.reschedule();
    return results;
  }

  /**
   * 获取队列状态
   */
  getStatus(): { isRunning: boolean; queueSize: number; nextTaskAt: Date | null } {
    const next = this.queue.peek();
    return {
      isRunning: this.isRunning,
      queueSize: this.queue.size,
      nextTaskAt: next ? new Date(next.nextRunAt) : null,
    };
  }

  // ===== Private Methods =====

  private async loadActiveTasks(): Promise<void> {
    try {
      const tasks = await this.repository.findActiveTasks();
      
      for (const task of tasks) {
        const nextRunAt = task.nextRunAt?.getTime();
        if (!nextRunAt || !task.enabled) continue;

        this.queue.insert({
          taskUuid: task.uuid,
          taskName: task.taskName,
          nextRunAt,
          cronExpression: task.schedule.cronExpression,
          timezone: task.schedule.timezone,
        });
      }

      this.logger.info('Loaded active tasks into queue', { 
        count: tasks.length,
        queueSize: this.queue.size,
      });
    } catch (error) {
      this.logger.error('Failed to load active tasks', { error });
      throw error;
    }
  }

  private scheduleNext(): void {
    if (!this.isRunning) return;

    // 清除现有 timer
    if (this.currentTimer) {
      this.timer.clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }

    const next = this.queue.peek();
    if (!next) {
      this.logger.debug('Queue is empty, waiting for new tasks');
      return;
    }

    const now = this.timer.now();
    const delay = Math.max(0, next.nextRunAt - now);

    this.logger.debug('Scheduling next task', {
      taskUuid: next.taskUuid,
      taskName: next.taskName,
      scheduledAt: new Date(next.nextRunAt).toISOString(),
      delayMs: delay,
    });

    this.currentTimer = this.timer.setTimeout(async () => {
      await this.executeNextTask();
    }, delay);
  }

  private reschedule(): void {
    if (!this.isRunning) return;

    const next = this.queue.peek();
    if (!next) {
      if (this.currentTimer) {
        this.timer.clearTimeout(this.currentTimer);
        this.currentTimer = null;
      }
      return;
    }

    // 如果新的堆顶比当前调度更早，重新调度
    this.scheduleNext();
  }

  private async executeNextTask(): Promise<void> {
    const item = this.queue.extractMin();
    if (!item) {
      this.scheduleNext();
      return;
    }

    try {
      await this.executeTask(item);
    } catch (error) {
      this.logger.error('Task execution failed', {
        taskUuid: item.taskUuid,
        taskName: item.taskName,
        error,
      });
    }

    // 继续调度下一个任务
    this.scheduleNext();
  }

  private async executeTask(item: ScheduledItem): Promise<void> {
    const { taskUuid, taskName, cronExpression, timezone } = item;

    this.monitor?.recordExecutionStart(taskUuid, taskName);

    try {
      // 调用执行回调
      await this.onExecuteTask(taskUuid);

      this.monitor?.recordExecutionSuccess(taskUuid, taskName);

      // 如果是循环任务，计算下次执行时间并重新入队
      if (cronExpression) {
        const nextRunAt = calculateNextRun(cronExpression, timezone);
        if (nextRunAt) {
          this.queue.insert({
            taskUuid,
            taskName,
            nextRunAt: nextRunAt.getTime(),
            cronExpression,
            timezone,
          });
          
          this.logger.debug('Recurring task rescheduled', {
            taskUuid,
            taskName,
            nextRunAt: nextRunAt.toISOString(),
          });
        }
      }
    } catch (error) {
      this.monitor?.recordExecutionFailure(
        taskUuid, 
        taskName, 
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}
```

**任务清单：**
- [ ] 2.1 创建 `IScheduleTimer` 接口和 `NodeTimer` 实现
- [ ] 2.2 创建 `MinHeap` 数据结构
- [ ] 2.3 创建 `ScheduleTaskQueue` 优先队列调度器
- [ ] 2.4 创建 `calculateNextRun` cron 表达式解析函数
- [ ] 2.5 创建 `IScheduleMonitor` 接口
- [ ] 2.6 更新 `application-server/src/schedule/index.ts` 导出

---

### Story 3: 创建 Desktop 调度器

**目标：** 在 Desktop main 进程中使用 ScheduleTaskQueue，并集成 Electron 特有功能

**文件结构：**
```
apps/desktop/src/main/modules/schedule/
├── application/
│   ├── ScheduleDesktopApplicationService.ts  # 已有，增加调度方法
│   └── services/
│       └── execute-task.ts                   # 执行单个任务
└── infrastructure/
    ├── DesktopScheduler.ts                   # Desktop 调度器（包装 ScheduleTaskQueue）
    ├── DesktopScheduleMonitor.ts             # 监控实现
    └── index.ts
```

**Desktop 调度器实现：**

```typescript
// apps/desktop/src/main/modules/schedule/infrastructure/DesktopScheduler.ts

import { powerMonitor } from 'electron';
import { ScheduleTaskQueue, NodeTimer } from '@dailyuse/application-server';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';
import { eventBus, createLogger } from '@dailyuse/utils';
import { DesktopScheduleMonitor } from './DesktopScheduleMonitor';
import { executeScheduleTask } from '../application/services/execute-task';

const logger = createLogger('DesktopScheduler');

/**
 * Desktop 调度器
 * 
 * 包装 ScheduleTaskQueue，并集成 Electron 特有功能：
 * - PowerMonitor：处理系统休眠/恢复
 * - 应用生命周期管理
 */
export class DesktopScheduler {
  private static instance: DesktopScheduler;
  private queue: ScheduleTaskQueue;
  private monitor: DesktopScheduleMonitor;

  private constructor() {
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    
    this.monitor = DesktopScheduleMonitor.getInstance();

    this.queue = new ScheduleTaskQueue({
      timer: new NodeTimer(),
      repository,
      eventBus,
      logger,
      monitor: this.monitor,
      onExecuteTask: async (taskUuid: string) => {
        await executeScheduleTask(taskUuid, {
          repository,
          eventBus,
          logger,
          monitor: this.monitor,
        });
      },
    });

    // 设置 Electron PowerMonitor
    this.setupPowerMonitor();
  }

  static getInstance(): DesktopScheduler {
    if (!this.instance) {
      this.instance = new DesktopScheduler();
    }
    return this.instance;
  }

  /**
   * 启动调度器
   */
  async start(): Promise<void> {
    logger.info('Starting Desktop Scheduler...');
    await this.queue.start();
    logger.info('Desktop Scheduler started');
  }

  /**
   * 停止调度器
   */
  stop(): void {
    logger.info('Stopping Desktop Scheduler...');
    this.queue.stop();
    logger.info('Desktop Scheduler stopped');
  }

  /**
   * 添加任务
   */
  addTask(item: Parameters<ScheduleTaskQueue['addTask']>[0]): void {
    this.queue.addTask(item);
  }

  /**
   * 移除任务
   */
  removeTask(taskUuid: string): boolean {
    return this.queue.removeTask(taskUuid);
  }

  /**
   * 暂停任务
   */
  pauseTask(taskUuid: string): boolean {
    return this.queue.pauseTask(taskUuid);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskUuid: string): Promise<boolean> {
    return this.queue.resumeTask(taskUuid);
  }

  /**
   * 获取状态
   */
  getStatus(): ReturnType<ScheduleTaskQueue['getStatus']> & { stats: ReturnType<DesktopScheduleMonitor['getStats']> } {
    return {
      ...this.queue.getStatus(),
      stats: this.monitor.getStats(),
    };
  }

  /**
   * 设置 Electron PowerMonitor
   * 处理系统休眠/恢复
   */
  private setupPowerMonitor(): void {
    // 系统休眠后恢复时，检查错过的任务
    powerMonitor.on('resume', async () => {
      logger.info('System resumed from sleep, checking missed tasks...');
      try {
        const result = await this.queue.checkMissedTasks();
        logger.info('Missed tasks check completed', result);
      } catch (error) {
        logger.error('Failed to check missed tasks', { error });
      }
    });

    // 系统即将休眠时记录日志
    powerMonitor.on('suspend', () => {
      logger.info('System suspending, scheduler will pause...');
    });

    // 系统锁屏/解锁（可选：减少执行频率）
    powerMonitor.on('lock-screen', () => {
      logger.debug('Screen locked');
    });

    powerMonitor.on('unlock-screen', () => {
      logger.debug('Screen unlocked');
    });
  }
}
```

**任务执行服务：**

```typescript
// apps/desktop/src/main/modules/schedule/application/services/execute-task.ts

import type { IScheduleTaskRepository } from '@dailyuse/infrastructure-server';
import type { IEventBus, ILogger } from '@dailyuse/utils';
import type { IScheduleMonitor } from '@dailyuse/application-server';
import { ScheduleTaskEventTypes } from '@dailyuse/contracts/schedule';

export interface ExecuteScheduleTaskDeps {
  repository: IScheduleTaskRepository;
  eventBus: IEventBus;
  logger: ILogger;
  monitor?: IScheduleMonitor;
}

/**
 * 执行调度任务
 */
export async function executeScheduleTask(
  taskUuid: string,
  deps: ExecuteScheduleTaskDeps,
): Promise<void> {
  const { repository, eventBus, logger, monitor } = deps;

  // 1. 从数据库加载任务
  const task = await repository.findByUuid(taskUuid);
  if (!task) {
    logger.error('Task not found', { taskUuid });
    throw new Error(`Task not found: ${taskUuid}`);
  }

  const taskName = task.taskName;
  monitor?.recordExecutionStart(taskUuid, taskName);

  try {
    // 2. 检查任务是否可执行
    if (!task.canExecute()) {
      const reason = getCannotExecuteReason(task);
      monitor?.recordExecutionSkipped(taskUuid, taskName, reason);
      logger.warn('Task cannot be executed', { taskUuid, taskName, reason });
      return;
    }

    // 3. 执行任务（调用聚合根方法）
    const success = task.execute();
    if (!success) {
      throw new Error('Task.execute() returned false');
    }

    // 4. 保存任务状态
    await repository.save(task);

    // 5. 发布领域事件
    const events = task.getDomainEvents();
    for (const event of events) {
      logger.debug('Publishing domain event', { eventType: event.eventType });
      eventBus.emit(event.eventType, event);
    }

    // 6. 清除已发布的事件
    task.clearDomainEvents();

    monitor?.recordExecutionSuccess(taskUuid, taskName);
    logger.info('Task executed successfully', { taskUuid, taskName });

  } catch (error) {
    monitor?.recordExecutionFailure(
      taskUuid,
      taskName,
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}

function getCannotExecuteReason(task: any): string {
  if (task.status !== 'active') return `Status is not active: ${task.status}`;
  if (!task.enabled) return 'Task is disabled';
  const nextRunAt = task.nextRunAt;
  if (!nextRunAt || nextRunAt > new Date()) {
    return `Not due yet: ${nextRunAt?.toISOString() || 'N/A'}`;
  }
  return 'Unknown reason';
}
```

**任务清单：**
- [ ] 3.1 创建 `DesktopScheduler` 类
- [ ] 3.2 创建 `executeScheduleTask` 服务
- [ ] 3.3 创建 `DesktopScheduleMonitor` 监控类
- [ ] 3.4 集成 Electron `powerMonitor`
- [ ] 3.5 添加 IPC handlers 获取调度状态

---

### Story 4: 更新模块初始化

**目标：** 确保 Desktop 启动时自动启动调度器

**修改文件：**

```typescript
// apps/desktop/src/main/modules/schedule/initialization/index.ts

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { DesktopScheduler } from '../infrastructure/DesktopScheduler';
import { registerScheduleEventHandlers } from '../application/event-handlers';

export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 事件处理器初始化
  manager.registerTask({
    name: 'schedule-event-handlers',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      registerScheduleEventHandlers();
      console.log('[Schedule] Event handlers registered');
    },
  });

  // 调度器初始化
  manager.registerTask({
    name: 'schedule-task-queue',
    phase: InitializationPhase.APP_STARTUP,
    priority: 55,  // 在事件处理器之后
    dependencies: ['schedule-event-handlers'],
    initialize: async () => {
      const scheduler = DesktopScheduler.getInstance();
      await scheduler.start();
      console.log('[Schedule] Task queue started');
    },
    cleanup: async () => {
      const scheduler = DesktopScheduler.getInstance();
      scheduler.stop();
      console.log('[Schedule] Task queue stopped');
    },
  });
}
```

**任务清单：**
- [ ] 4.1 更新 `schedule/initialization/index.ts`
- [ ] 4.2 添加事件处理器初始化任务
- [ ] 4.3 添加调度器启动任务
- [ ] 4.4 确保 cleanup 正确停止调度器

---

### Story 5: 实现 Reminder → ScheduleTask 自动创建

**目标：** Desktop 端创建 Reminder 时自动创建对应的 ScheduleTask，并加入调度队列

**实现：**

```typescript
// apps/desktop/src/main/modules/reminder/application/event-handlers/ReminderToScheduleHandler.ts

import { eventBus, createLogger } from '@dailyuse/utils';
import { ScheduleTaskFactory } from '@dailyuse/domain-server';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';
import { ReminderEventTypes } from '@dailyuse/contracts/reminder';
import { DesktopScheduler } from '../../../schedule/infrastructure/DesktopScheduler';

const logger = createLogger('ReminderToScheduleHandler');

export function registerReminderToScheduleHandlers(): void {
  // 监听 Reminder 创建事件
  eventBus.on(ReminderEventTypes.TEMPLATE_CREATED, async (event: any) => {
    await createScheduleTaskForReminder(event);
  });

  // 监听 Reminder 启用事件
  eventBus.on(ReminderEventTypes.TEMPLATE_ENABLED, async (event: any) => {
    await enableScheduleTaskForReminder(event);
  });

  // 监听 Reminder 禁用事件
  eventBus.on(ReminderEventTypes.TEMPLATE_DISABLED, async (event: any) => {
    await disableScheduleTaskForReminder(event);
  });

  // 监听 Reminder 删除事件
  eventBus.on(ReminderEventTypes.TEMPLATE_DELETED, async (event: any) => {
    await deleteScheduleTaskForReminder(event);
  });

  logger.info('Reminder → ScheduleTask handlers registered');
}

async function createScheduleTaskForReminder(event: any): Promise<void> {
  const { payload, accountUuid } = event;
  
  try {
    // 1. 使用工厂创建 ScheduleTask
    const factory = new ScheduleTaskFactory();
    const scheduleTask = factory.createFromSourceEntity({
      sourceModule: 'REMINDER',
      sourceEntityId: payload.templateUuid,
      sourceEntity: payload,
      accountUuid,
    });

    // 2. 保存到数据库
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    await repository.save(scheduleTask);

    // 3. 加入调度队列
    const scheduler = DesktopScheduler.getInstance();
    const nextRunAt = scheduleTask.nextRunAt?.getTime();
    
    if (nextRunAt && scheduleTask.enabled) {
      scheduler.addTask({
        taskUuid: scheduleTask.uuid,
        taskName: scheduleTask.taskName,
        nextRunAt,
        cronExpression: scheduleTask.schedule.cronExpression,
        timezone: scheduleTask.schedule.timezone,
      });
    }

    logger.info('ScheduleTask created for Reminder', {
      reminderUuid: payload.templateUuid,
      scheduleTaskUuid: scheduleTask.uuid,
      nextRunAt: nextRunAt ? new Date(nextRunAt).toISOString() : null,
    });

  } catch (error) {
    logger.error('Failed to create ScheduleTask for Reminder', { error });
  }
}

async function enableScheduleTaskForReminder(event: any): Promise<void> {
  const { payload } = event;
  
  try {
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    
    // 查找对应的 ScheduleTask
    const tasks = await repository.findBySourceEntity('REMINDER', payload.templateUuid);
    if (tasks.length === 0) return;

    const scheduler = DesktopScheduler.getInstance();
    
    for (const task of tasks) {
      // 恢复任务
      await scheduler.resumeTask(task.uuid);
      logger.info('ScheduleTask resumed for Reminder', {
        reminderUuid: payload.templateUuid,
        scheduleTaskUuid: task.uuid,
      });
    }
  } catch (error) {
    logger.error('Failed to enable ScheduleTask for Reminder', { error });
  }
}

async function disableScheduleTaskForReminder(event: any): Promise<void> {
  const { payload } = event;
  
  try {
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    
    const tasks = await repository.findBySourceEntity('REMINDER', payload.templateUuid);
    if (tasks.length === 0) return;

    const scheduler = DesktopScheduler.getInstance();
    
    for (const task of tasks) {
      scheduler.pauseTask(task.uuid);
      logger.info('ScheduleTask paused for Reminder', {
        reminderUuid: payload.templateUuid,
        scheduleTaskUuid: task.uuid,
      });
    }
  } catch (error) {
    logger.error('Failed to disable ScheduleTask for Reminder', { error });
  }
}

async function deleteScheduleTaskForReminder(event: any): Promise<void> {
  const { payload } = event;
  
  try {
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    
    const tasks = await repository.findBySourceEntity('REMINDER', payload.templateUuid);
    if (tasks.length === 0) return;

    const scheduler = DesktopScheduler.getInstance();
    
    for (const task of tasks) {
      // 1. 从队列移除
      scheduler.removeTask(task.uuid);
      
      // 2. 从数据库删除
      await repository.delete(task.uuid);
      
      logger.info('ScheduleTask deleted for Reminder', {
        reminderUuid: payload.templateUuid,
        scheduleTaskUuid: task.uuid,
      });
    }
  } catch (error) {
    logger.error('Failed to delete ScheduleTask for Reminder', { error });
  }
}
```

**任务清单：**
- [ ] 5.1 创建 `ReminderToScheduleHandler.ts`
- [ ] 5.2 实现 `createScheduleTaskForReminder`
- [ ] 5.3 实现 `enableScheduleTaskForReminder`
- [ ] 5.4 实现 `disableScheduleTaskForReminder`
- [ ] 5.5 实现 `deleteScheduleTaskForReminder`
- [ ] 5.6 在 Reminder 模块初始化时注册处理器

---

### Story 6: 完善事件发布链

**目标：** 确保 `schedule.task.triggered` 事件正确发布并被 NotificationService 接收

**事件流验证：**
```
DesktopScheduler (ScheduleTaskQueue)
    ↓ (触发时间到达)
executeScheduleTask(taskUuid)
    ↓
task.execute() → addDomainEvent({ eventType: ScheduleTaskEventTypes.TRIGGERED, ... })
    ↓
repository.save(task)
    ↓
for (event of task.getDomainEvents()) {
  eventBus.emit(event.eventType, event);  // 发布: 'schedule.task.triggered'
}
    ↓
NotificationService 监听 ScheduleTaskEventTypes.TRIGGERED
    ↓
显示桌面通知
```

**任务清单：**
- [ ] 6.1 验证 NotificationService 事件监听使用正确的常量
- [ ] 6.2 验证 ScheduleTask.execute() 发布正确的事件类型
- [ ] 6.3 添加端到端测试

---

### Story 7: 添加调度监控和日志

**目标：** 提供调度执行的可观测性

```typescript
// apps/desktop/src/main/modules/schedule/infrastructure/DesktopScheduleMonitor.ts

import { createLogger } from '@dailyuse/utils';
import type { IScheduleMonitor } from '@dailyuse/application-server';

const logger = createLogger('DesktopScheduleMonitor');

export class DesktopScheduleMonitor implements IScheduleMonitor {
  private static instance: DesktopScheduleMonitor;
  
  private executionStats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    skippedExecutions: 0,
    lastExecutionAt: null as Date | null,
  };

  static getInstance(): DesktopScheduleMonitor {
    if (!this.instance) {
      this.instance = new DesktopScheduleMonitor();
    }
    return this.instance;
  }

  recordExecutionStart(taskUuid: string, taskName: string): void {
    logger.debug('⏰ Task execution started', { taskUuid, taskName });
  }

  recordExecutionSuccess(taskUuid: string, taskName: string): void {
    this.executionStats.totalExecutions++;
    this.executionStats.successfulExecutions++;
    this.executionStats.lastExecutionAt = new Date();
    logger.info('✅ Task executed successfully', { taskUuid, taskName });
  }

  recordExecutionFailure(taskUuid: string, taskName: string, error: Error): void {
    this.executionStats.totalExecutions++;
    this.executionStats.failedExecutions++;
    this.executionStats.lastExecutionAt = new Date();
    logger.error('❌ Task execution failed', { 
      taskUuid, 
      taskName, 
      error: error.message,
      stack: error.stack,
    });
  }

  recordExecutionSkipped(taskUuid: string, taskName: string, reason: string): void {
    this.executionStats.skippedExecutions++;
    logger.warn('⏭️ Task execution skipped', { taskUuid, taskName, reason });
  }

  getStats(): typeof this.executionStats {
    return { ...this.executionStats };
  }

  resetStats(): void {
    this.executionStats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      skippedExecutions: 0,
      lastExecutionAt: null,
    };
  }
}
```

**任务清单：**
- [ ] 7.1 创建 `DesktopScheduleMonitor`
- [ ] 7.2 集成到 `DesktopScheduler`
- [ ] 7.3 添加 IPC handler 获取统计信息
- [ ] 7.4 在 Dashboard 显示调度统计（可选）

---

### Story 8: 重构 API 使用 ScheduleTaskQueue（可选）

**目标：** API 端也迁移到使用 `ScheduleTaskQueue`，统一三端架构

**当前 API 架构：**
- 使用 `node-cron` 为每个任务创建独立的 cron job
- 任务数量多时内存占用高

**新架构：**
- 使用 `ScheduleTaskQueue` 优先队列
- 只有一个活跃 timer

**任务清单：**
- [ ] 8.1 创建 `ApiScheduler` 包装类
- [ ] 8.2 迁移 `CronJobManager` 到使用 `ScheduleTaskQueue`
- [ ] 8.3 更新 `ScheduleBootstrap`
- [ ] 8.4 测试验证功能一致性

---

## 📅 实施计划

### Phase 1: 核心调度器 (Story 2-3)
- **预计时间：** 2-3 天
- **依赖：** Story 1 已完成
- **产出：** 
  - `ScheduleTaskQueue` 优先队列调度器
  - `DesktopScheduler` Desktop 实现

### Phase 2: 模块集成 (Story 4-5)
- **预计时间：** 1-2 天
- **依赖：** Phase 1
- **产出：** 
  - Desktop 启动时自动开始调度
  - Reminder 创建时自动创建 ScheduleTask

### Phase 3: 完善与监控 (Story 6-7)
- **预计时间：** 1 天
- **依赖：** Phase 2
- **产出：** 
  - 完整的事件链
  - 调度监控

### Phase 4: API 统一（可选）(Story 8)
- **预计时间：** 1 天
- **依赖：** Phase 1
- **产出：** API 也使用统一的调度器架构

---

## ✅ 验收标准

### 功能验收
- [ ] Desktop 创建 Reminder 后，自动创建对应 ScheduleTask
- [ ] ScheduleTask 到期时自动触发执行（毫秒级精度）
- [ ] 执行后发布 `schedule.task.triggered` 事件
- [ ] NotificationService 接收事件并显示通知
- [ ] 系统休眠后恢复时，自动检查并执行错过的任务
- [ ] 日历视图正确显示来自 Reminder/Task/Goal 的日程

### 技术验收
- [ ] `application-server` 包包含 `ScheduleTaskQueue` 优先队列调度器
- [ ] `MinHeap` 数据结构正确实现（所有操作 O(log n)）
- [ ] Desktop 通过 `DesktopScheduler` 包装使用调度器
- [ ] 事件类型使用 `ScheduleTaskEventTypes` 常量
- [ ] 集成 Electron `powerMonitor` 处理休眠/恢复
- [ ] 所有新代码通过 typecheck
- [ ] 添加单元测试覆盖 MinHeap 和 ScheduleTaskQueue

---

## 📊 方案对比总结

| 维度 | 原轮询方案 | 新优先队列方案 |
|------|-----------|---------------|
| **精度** | 分钟级 | 毫秒级 |
| **资源消耗** | 每分钟查询所有任务 | 只有一个活跃 timer |
| **复杂度** | 简单 | 中等（需要最小堆） |
| **可扩展性** | 任务多时性能下降 | O(log n) 插入/删除 |
| **休眠处理** | 需额外处理 | 内置 checkMissedTasks |
| **代码复用** | API/Desktop 分离 | 统一 ScheduleTaskQueue |

---

## 📚 相关文档

- [Schedule 模块文档](../modules/schedule/README.md)
- [EPIC-017: Renderer Infrastructure 统一](./EPIC-017-renderer-infrastructure-unification.md) - Desktop Renderer 冗余代码清理
- [事件类型定义](../../packages/contracts/src/modules/schedule/event-types.ts)
- [API ScheduleTaskExecutor 实现](../../apps/api/src/modules/schedule/application/services/ScheduleTaskExecutor.ts)
- [最小堆数据结构](https://en.wikipedia.org/wiki/Binary_heap)
