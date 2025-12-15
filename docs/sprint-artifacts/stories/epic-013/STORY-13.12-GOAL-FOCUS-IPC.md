# Story 13.12: Goal Focus IPC Client

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.12 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | Medium |
| 预估工时 | 4h |
| 状态 | Backlog |

## 目标

为渲染进程创建 Focus 功能的 IPC Client，实现与主进程 FocusService 的通信。

## 背景

Focus 功能在主进程中实现核心逻辑（计时、持久化），渲染进程通过 IPC Client 控制和展示状态。

## 任务列表

- [ ] 1. 创建 `renderer/modules/goal/infrastructure/ipc/focus/` 目录
- [ ] 2. 实现 `GoalFocusIPCClient`
  - [ ] startSession(input) - 开始专注
  - [ ] pauseSession() - 暂停
  - [ ] resumeSession() - 继续
  - [ ] stopSession() - 停止
  - [ ] getCurrentSession() - 获取当前会话
- [ ] 3. 实现 `GoalFocusStatisticsIPCClient`
  - [ ] getDailyStatistics(date) - 每日统计
  - [ ] getWeeklyStatistics(startDate) - 每周统计
  - [ ] getSessionHistory(filter) - 历史记录
- [ ] 4. 实现实时事件监听
  - [ ] onTick 回调 - 计时更新
  - [ ] onCompleted 回调 - 会话完成
  - [ ] onPaused 回调 - 会话暂停
- [ ] 5. 注册到 Goal 模块 DI Container
- [ ] 6. 添加单元测试

## 技术设计

### 目录结构

```
renderer/modules/goal/infrastructure/ipc/focus/
├── goal-focus.ipc-client.ts
├── goal-focus-statistics.ipc-client.ts
├── goal-focus-events.ts
├── types.ts
└── index.ts
```

### GoalFocusIPCClient

```typescript
// renderer/modules/goal/infrastructure/ipc/focus/goal-focus.ipc-client.ts
import { BaseIPCClient } from '@/shared/infrastructure/ipc';
import { IPC_CHANNELS } from '@/shared/types/ipc-channels';
import type { 
  FocusSessionDTO, 
  StartFocusSessionInput,
  FocusTickData,
} from './types';

export class GoalFocusIPCClient extends BaseIPCClient {
  private tickCallbacks: Set<(data: FocusTickData) => void> = new Set();
  private completedCallbacks: Set<(session: FocusSessionDTO) => void> = new Set();
  private isListening = false;

  constructor() {
    super();
    this.setupEventListeners();
  }

  /**
   * 开始专注会话
   */
  async startSession(input: StartFocusSessionInput): Promise<FocusSessionDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.START, input);
  }

  /**
   * 暂停当前会话
   */
  async pauseSession(): Promise<FocusSessionDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.PAUSE);
  }

  /**
   * 继续暂停的会话
   */
  async resumeSession(): Promise<FocusSessionDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.RESUME);
  }

  /**
   * 停止会话（取消）
   */
  async stopSession(): Promise<FocusSessionDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.STOP);
  }

  /**
   * 获取当前进行中的会话
   */
  async getCurrentSession(): Promise<FocusSessionDTO | null> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.CURRENT);
  }

  /**
   * 订阅计时更新
   */
  onTick(callback: (data: FocusTickData) => void): () => void {
    this.tickCallbacks.add(callback);
    return () => this.tickCallbacks.delete(callback);
  }

  /**
   * 订阅会话完成
   */
  onCompleted(callback: (session: FocusSessionDTO) => void): () => void {
    this.completedCallbacks.add(callback);
    return () => this.completedCallbacks.delete(callback);
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (this.isListening) return;
    this.isListening = true;

    // 监听主进程发送的计时更新
    window.electronAPI.on(IPC_CHANNELS.GOAL.FOCUS.TICK, (_, data: FocusTickData) => {
      this.tickCallbacks.forEach(cb => cb(data));
    });

    // 监听会话完成事件
    window.electronAPI.on(IPC_CHANNELS.GOAL.FOCUS.COMPLETED, (_, session: FocusSessionDTO) => {
      this.completedCallbacks.forEach(cb => cb(session));
    });
  }

  /**
   * 清理事件监听
   */
  dispose(): void {
    this.tickCallbacks.clear();
    this.completedCallbacks.clear();
    window.electronAPI.off(IPC_CHANNELS.GOAL.FOCUS.TICK);
    window.electronAPI.off(IPC_CHANNELS.GOAL.FOCUS.COMPLETED);
    this.isListening = false;
  }
}
```

### GoalFocusStatisticsIPCClient

```typescript
// renderer/modules/goal/infrastructure/ipc/focus/goal-focus-statistics.ipc-client.ts
import { BaseIPCClient } from '@/shared/infrastructure/ipc';
import { IPC_CHANNELS } from '@/shared/types/ipc-channels';
import type {
  FocusSessionDTO,
  FocusDailyStatistics,
  FocusWeeklyStatistics,
  FocusHistoryFilter,
} from './types';

export class GoalFocusStatisticsIPCClient extends BaseIPCClient {
  /**
   * 获取指定日期的专注统计
   */
  async getDailyStatistics(date: string): Promise<FocusDailyStatistics> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.STATISTICS.DAILY, { date });
  }

  /**
   * 获取指定周的专注统计
   */
  async getWeeklyStatistics(startDate: string): Promise<FocusWeeklyStatistics> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.STATISTICS.WEEKLY, { startDate });
  }

  /**
   * 获取专注历史记录
   */
  async getSessionHistory(filter?: FocusHistoryFilter): Promise<FocusSessionDTO[]> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.HISTORY, filter);
  }

  /**
   * 获取目标的专注时长统计
   */
  async getGoalFocusTime(goalUuid: string): Promise<GoalFocusTimeStatistics> {
    return this.invoke(IPC_CHANNELS.GOAL.FOCUS.STATISTICS.GOAL, { goalUuid });
  }
}
```

### 类型定义

```typescript
// renderer/modules/goal/infrastructure/ipc/focus/types.ts

export interface StartFocusSessionInput {
  accountUuid: string;
  goalUuid?: string;
  taskUuid?: string;
  duration?: number;  // 分钟，默认 25
}

export interface FocusSessionDTO {
  uuid: string;
  accountUuid: string;
  goalUuid?: string;
  taskUuid?: string;
  plannedDuration: number;
  actualDuration?: number;
  status: FocusStatus;
  remainingTime: number;
  progress: number;
  startedAt: string;
  completedAt?: string;
}

export enum FocusStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface FocusTickData {
  remainingTime: number;  // 秒
  progress: number;       // 0-100
}

export interface FocusDailyStatistics {
  date: string;
  totalSessions: number;
  completedSessions: number;
  totalMinutes: number;
  goalBreakdown: Array<{
    goalUuid: string;
    goalTitle: string;
    minutes: number;
  }>;
}

export interface FocusWeeklyStatistics {
  startDate: string;
  endDate: string;
  dailyData: FocusDailyStatistics[];
  totalSessions: number;
  totalMinutes: number;
  averagePerDay: number;
}

export interface FocusHistoryFilter {
  goalUuid?: string;
  status?: FocusStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface GoalFocusTimeStatistics {
  goalUuid: string;
  totalMinutes: number;
  sessionCount: number;
  lastSessionAt?: string;
}
```

### IPC Channels 扩展

```typescript
// 在 shared/types/ipc-channels.ts 中添加
GOAL: {
  // ... existing channels
  FOCUS: {
    START: 'goal:focus:start',
    PAUSE: 'goal:focus:pause',
    RESUME: 'goal:focus:resume',
    STOP: 'goal:focus:stop',
    CURRENT: 'goal:focus:current',
    TICK: 'goal:focus:tick',           // 从主进程推送
    COMPLETED: 'goal:focus:completed', // 从主进程推送
    STATISTICS: {
      DAILY: 'goal:focus:statistics:daily',
      WEEKLY: 'goal:focus:statistics:weekly',
      GOAL: 'goal:focus:statistics:goal',
    },
    HISTORY: 'goal:focus:history',
  },
}
```

### DI 注册

```typescript
// 更新 renderer/modules/goal/di/register.ts
import { GoalFocusIPCClient, GoalFocusStatisticsIPCClient } from '../infrastructure/ipc/focus';

export function registerGoalModule(container: Container): void {
  // ... existing registrations

  // Focus IPC Clients
  container.registerSingleton(
    GOAL_TOKENS.FOCUS_IPC_CLIENT,
    () => new GoalFocusIPCClient()
  );

  container.registerSingleton(
    GOAL_TOKENS.FOCUS_STATISTICS_IPC_CLIENT,
    () => new GoalFocusStatisticsIPCClient()
  );
}
```

## 验收标准

- [ ] `GoalFocusIPCClient` 完整实现
- [ ] `GoalFocusStatisticsIPCClient` 完整实现
- [ ] 实时事件监听正常工作
- [ ] 事件清理机制（dispose）正确
- [ ] TypeScript 类型完整
- [ ] 注册到 DI Container
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/goal/infrastructure/ipc/focus/goal-focus.ipc-client.ts` | 新建 | Focus IPC Client |
| `renderer/modules/goal/infrastructure/ipc/focus/goal-focus-statistics.ipc-client.ts` | 新建 | Statistics IPC Client |
| `renderer/modules/goal/infrastructure/ipc/focus/types.ts` | 新建 | 类型定义 |
| `renderer/modules/goal/infrastructure/ipc/focus/index.ts` | 新建 | 导出 |
| `renderer/modules/goal/di/register.ts` | 修改 | 注册 Focus clients |
| `shared/types/ipc-channels.ts` | 修改 | 添加 Focus channels |

## 依赖关系

- **前置依赖**: Story 13.11 (Goal Focus Main Process)
- **后续依赖**: Story 13.13 (Goal Focus Store & UI)
