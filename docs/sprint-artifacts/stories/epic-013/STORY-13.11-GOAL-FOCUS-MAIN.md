# Story 13.11: Goal Focus 主进程服务

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.11 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | High |
| 预估工时 | 8h |
| 状态 | Backlog |

## 目标

在 Goal 模块的主进程端实现完整的专注模式（Focus/Pomodoro）服务。

## 背景

专注模式是与目标（Goal）紧密关联的功能：用户可以针对某个目标开启专注计时，完成后自动更新目标进度。这种设计体现了 DDD 中的聚合概念——Focus 是 Goal 聚合的一部分。

### 功能概述

1. **番茄钟计时**: 25分钟专注 + 5分钟休息
2. **自定义时长**: 支持自定义专注和休息时长
3. **目标关联**: 专注时间可计入目标进度
4. **统计追踪**: 记录专注历史和统计数据
5. **系统集成**: 勿扰模式、系统通知

## 任务列表

- [ ] 1. 创建 `main/modules/goal/services/focus/` 目录结构
- [ ] 2. 实现核心领域模型
  - [ ] `FocusSession` - 专注会话实体
  - [ ] `FocusTimer` - 计时器值对象
  - [ ] `FocusSettings` - 设置值对象
- [ ] 3. 实现 `FocusService`
  - [ ] startSession(goalUuid?, duration?) - 开始专注
  - [ ] pauseSession() - 暂停
  - [ ] resumeSession() - 继续
  - [ ] stopSession() - 停止
  - [ ] completeSession() - 完成
  - [ ] getActiveSession() - 获取当前会话
- [ ] 4. 实现 `FocusStatisticsService`
  - [ ] getSessionHistory(filter) - 历史记录
  - [ ] getDailyStatistics(date) - 每日统计
  - [ ] getWeeklyStatistics(week) - 每周统计
  - [ ] getGoalFocusTime(goalUuid) - 目标专注时长
- [ ] 5. 实现 `FocusNotificationService`
  - [ ] 会话开始通知
  - [ ] 会话完成通知
  - [ ] 休息提醒
- [ ] 6. 实现 `FocusSystemIntegration`
  - [ ] 勿扰模式控制
  - [ ] 系统托盘状态更新
- [ ] 7. 创建 IPC Handler
- [ ] 8. 数据持久化 (Prisma)
- [ ] 9. 添加单元测试

## 技术设计

### 目录结构

```
main/modules/goal/services/focus/
├── domain/
│   ├── focus-session.entity.ts
│   ├── focus-timer.vo.ts
│   ├── focus-settings.vo.ts
│   └── focus-status.enum.ts
├── services/
│   ├── focus.service.ts
│   ├── focus-statistics.service.ts
│   ├── focus-notification.service.ts
│   └── focus-system-integration.service.ts
├── ipc/
│   └── focus-ipc-handler.ts
├── repository/
│   └── focus-session.repository.ts
└── index.ts
```

### FocusSession 实体

```typescript
// main/modules/goal/services/focus/domain/focus-session.entity.ts
import { FocusStatus } from './focus-status.enum';

export interface FocusSessionProps {
  uuid: string;
  accountUuid: string;
  goalUuid?: string;           // 可选关联目标
  taskUuid?: string;           // 可选关联任务
  plannedDuration: number;     // 计划时长（分钟）
  actualDuration: number;      // 实际时长（分钟）
  status: FocusStatus;
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
  pausedDurations: number[];   // 暂停时长记录
  notes?: string;
}

export class FocusSession {
  private props: FocusSessionProps;

  constructor(props: FocusSessionProps) {
    this.props = props;
  }

  get uuid(): string { return this.props.uuid; }
  get status(): FocusStatus { return this.props.status; }
  get goalUuid(): string | undefined { return this.props.goalUuid; }
  
  get remainingTime(): number {
    if (this.props.status === FocusStatus.COMPLETED) return 0;
    
    const elapsed = this.calculateElapsedTime();
    return Math.max(0, this.props.plannedDuration * 60 - elapsed);
  }

  get progress(): number {
    const elapsed = this.calculateElapsedTime();
    return Math.min(100, (elapsed / (this.props.plannedDuration * 60)) * 100);
  }

  private calculateElapsedTime(): number {
    const now = new Date();
    let elapsed = (now.getTime() - this.props.startedAt.getTime()) / 1000;
    
    // 减去暂停时间
    const totalPaused = this.props.pausedDurations.reduce((a, b) => a + b, 0);
    elapsed -= totalPaused;
    
    return elapsed;
  }

  pause(): void {
    if (this.props.status !== FocusStatus.ACTIVE) {
      throw new Error('Can only pause active session');
    }
    this.props.status = FocusStatus.PAUSED;
    this.props.pausedAt = new Date();
  }

  resume(): void {
    if (this.props.status !== FocusStatus.PAUSED) {
      throw new Error('Can only resume paused session');
    }
    
    // 记录暂停时长
    const pauseDuration = (new Date().getTime() - this.props.pausedAt!.getTime()) / 1000;
    this.props.pausedDurations.push(pauseDuration);
    
    this.props.status = FocusStatus.ACTIVE;
    this.props.pausedAt = undefined;
  }

  complete(): void {
    this.props.status = FocusStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.actualDuration = this.calculateElapsedTime() / 60;
  }

  cancel(): void {
    this.props.status = FocusStatus.CANCELLED;
    this.props.completedAt = new Date();
    this.props.actualDuration = this.calculateElapsedTime() / 60;
  }

  toDTO(): FocusSessionDTO {
    return {
      uuid: this.props.uuid,
      accountUuid: this.props.accountUuid,
      goalUuid: this.props.goalUuid,
      taskUuid: this.props.taskUuid,
      plannedDuration: this.props.plannedDuration,
      actualDuration: this.props.actualDuration,
      status: this.props.status,
      remainingTime: this.remainingTime,
      progress: this.progress,
      startedAt: this.props.startedAt.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
    };
  }
}
```

### FocusService

```typescript
// main/modules/goal/services/focus/services/focus.service.ts
import { injectable, inject } from 'tsyringe';
import { FocusSession } from '../domain/focus-session.entity';
import { FocusSessionRepository } from '../repository/focus-session.repository';
import { GoalProgressService } from '../../goal-progress.service';
import { EventEmitter } from 'events';

interface StartSessionInput {
  accountUuid: string;
  goalUuid?: string;
  taskUuid?: string;
  duration?: number;  // 分钟，默认 25
}

@injectable()
export class FocusService {
  private activeSession: FocusSession | null = null;
  private timer: NodeJS.Timeout | null = null;
  private events = new EventEmitter();

  constructor(
    @inject('FocusSessionRepository') private repository: FocusSessionRepository,
    @inject('GoalProgressService') private goalProgressService: GoalProgressService,
    @inject('NotificationService') private notificationService: NotificationService,
  ) {}

  async startSession(input: StartSessionInput): Promise<FocusSession> {
    // 检查是否有进行中的会话
    if (this.activeSession) {
      throw new Error('Already have an active focus session');
    }

    const session = FocusSession.create({
      accountUuid: input.accountUuid,
      goalUuid: input.goalUuid,
      taskUuid: input.taskUuid,
      plannedDuration: input.duration ?? 25,
    });

    await this.repository.save(session);
    this.activeSession = session;

    // 启动计时器
    this.startTimer();

    // 发送事件
    this.events.emit('session:started', session.toDTO());

    return session;
  }

  async pauseSession(): Promise<FocusSession> {
    if (!this.activeSession) {
      throw new Error('No active session');
    }

    this.activeSession.pause();
    this.stopTimer();
    
    await this.repository.save(this.activeSession);
    this.events.emit('session:paused', this.activeSession.toDTO());

    return this.activeSession;
  }

  async resumeSession(): Promise<FocusSession> {
    if (!this.activeSession) {
      throw new Error('No active session');
    }

    this.activeSession.resume();
    this.startTimer();
    
    await this.repository.save(this.activeSession);
    this.events.emit('session:resumed', this.activeSession.toDTO());

    return this.activeSession;
  }

  async stopSession(): Promise<FocusSession> {
    if (!this.activeSession) {
      throw new Error('No active session');
    }

    this.activeSession.cancel();
    this.stopTimer();
    
    await this.repository.save(this.activeSession);
    
    const session = this.activeSession;
    this.activeSession = null;
    
    this.events.emit('session:stopped', session.toDTO());

    return session;
  }

  async completeSession(): Promise<FocusSession> {
    if (!this.activeSession) {
      throw new Error('No active session');
    }

    this.activeSession.complete();
    this.stopTimer();
    
    await this.repository.save(this.activeSession);

    // 如果关联了目标，更新目标进度
    if (this.activeSession.goalUuid) {
      await this.goalProgressService.addFocusTime(
        this.activeSession.goalUuid,
        this.activeSession.actualDuration
      );
    }

    // 发送完成通知
    await this.notificationService.showFocusComplete(this.activeSession.toDTO());

    const session = this.activeSession;
    this.activeSession = null;
    
    this.events.emit('session:completed', session.toDTO());

    return session;
  }

  getActiveSession(): FocusSession | null {
    return this.activeSession;
  }

  // 订阅事件
  on(event: string, handler: (...args: any[]) => void): void {
    this.events.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.events.off(event, handler);
  }

  private startTimer(): void {
    // 每秒更新一次
    this.timer = setInterval(() => {
      if (!this.activeSession) return;

      // 检查是否完成
      if (this.activeSession.remainingTime <= 0) {
        this.completeSession();
        return;
      }

      // 发送进度更新
      this.events.emit('session:tick', {
        remainingTime: this.activeSession.remainingTime,
        progress: this.activeSession.progress,
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
```

### IPC Handler

```typescript
// main/modules/goal/services/focus/ipc/focus-ipc-handler.ts
import { ipcMain, BrowserWindow } from 'electron';
import { container } from '@/infrastructure/di';
import { FocusService } from '../services/focus.service';
import { FocusStatisticsService } from '../services/focus-statistics.service';

export function registerFocusIPCHandlers(): void {
  const focusService = container.resolve(FocusService);
  const statsService = container.resolve(FocusStatisticsService);

  // 开始专注
  ipcMain.handle('goal:focus:start', async (_, input) => {
    const session = await focusService.startSession(input);
    return session.toDTO();
  });

  // 暂停
  ipcMain.handle('goal:focus:pause', async () => {
    const session = await focusService.pauseSession();
    return session.toDTO();
  });

  // 继续
  ipcMain.handle('goal:focus:resume', async () => {
    const session = await focusService.resumeSession();
    return session.toDTO();
  });

  // 停止
  ipcMain.handle('goal:focus:stop', async () => {
    const session = await focusService.stopSession();
    return session.toDTO();
  });

  // 获取当前会话
  ipcMain.handle('goal:focus:current', async () => {
    const session = focusService.getActiveSession();
    return session?.toDTO() ?? null;
  });

  // 统计相关
  ipcMain.handle('goal:focus:statistics:daily', async (_, { date }) => {
    return statsService.getDailyStatistics(date);
  });

  ipcMain.handle('goal:focus:statistics:weekly', async (_, { startDate }) => {
    return statsService.getWeeklyStatistics(startDate);
  });

  ipcMain.handle('goal:focus:history', async (_, filter) => {
    return statsService.getSessionHistory(filter);
  });

  // 转发实时事件到渲染进程
  focusService.on('session:tick', (data) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('goal:focus:tick', data);
    });
  });

  focusService.on('session:completed', (data) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('goal:focus:completed', data);
    });
  });
}
```

### Prisma Schema 扩展

```prisma
// 在 prisma/schema.prisma 中添加

model FocusSession {
  uuid            String    @id @default(uuid())
  accountUuid     String
  goalUuid        String?
  taskUuid        String?
  plannedDuration Int       // 分钟
  actualDuration  Float?    // 分钟
  status          String    // ACTIVE, PAUSED, COMPLETED, CANCELLED
  startedAt       DateTime
  pausedAt        DateTime?
  completedAt     DateTime?
  pausedDurations Json      // number[]
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  goal Goal? @relation(fields: [goalUuid], references: [uuid])

  @@index([accountUuid])
  @@index([goalUuid])
  @@index([startedAt])
  @@index([status])
}
```

## 验收标准

- [ ] FocusService 完整实现所有方法
- [ ] 计时器准确（误差 < 1秒/小时）
- [ ] 暂停/继续功能正常
- [ ] 目标进度自动更新
- [ ] 系统通知正常工作
- [ ] 数据持久化正确
- [ ] IPC Handler 注册完整
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `main/modules/goal/services/focus/domain/focus-session.entity.ts` | 新建 | 会话实体 |
| `main/modules/goal/services/focus/domain/focus-status.enum.ts` | 新建 | 状态枚举 |
| `main/modules/goal/services/focus/services/focus.service.ts` | 新建 | 核心服务 |
| `main/modules/goal/services/focus/services/focus-statistics.service.ts` | 新建 | 统计服务 |
| `main/modules/goal/services/focus/services/focus-notification.service.ts` | 新建 | 通知服务 |
| `main/modules/goal/services/focus/ipc/focus-ipc-handler.ts` | 新建 | IPC Handler |
| `main/modules/goal/services/focus/repository/focus-session.repository.ts` | 新建 | 数据仓库 |
| `prisma/schema.prisma` | 修改 | 添加 FocusSession 模型 |

## 依赖关系

- **前置依赖**: Story 13.9 (Goal IPC Client), Story 13.10 (Goal DI)
- **后续依赖**: Story 13.12 (Focus IPC Client), Story 13.13 (Focus UI)

## 注意事项

1. **计时精度**: 使用 `setInterval` 可能有漂移，考虑使用 `performance.now()` 校准
2. **进程重启**: 需要处理应用重启时恢复进行中的会话
3. **多窗口同步**: 确保所有窗口都收到状态更新
4. **系统休眠**: 处理系统休眠时的计时器暂停
