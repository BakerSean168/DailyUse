# Story 13.14: Schedule 模块 IPC Client

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.14 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | High |
| 预估工时 | 5h |
| 状态 | Backlog |

## 目标

为 Schedule 模块创建完整的 IPC Client 实现，包括日程管理和时间块功能。

## 背景

Schedule 是时间管理的核心模块，管理用户的日程安排和时间块。需要支持复杂的时间查询和冲突检测。

## 任务列表

- [ ] 1. 创建 `renderer/modules/schedule/infrastructure/ipc/` 目录
- [ ] 2. 实现 `ScheduleIPCClient`
  - [ ] create(input) - 创建日程
  - [ ] get(uuid) - 获取日程
  - [ ] list(filter) - 列出日程
  - [ ] update(uuid, input) - 更新日程
  - [ ] delete(uuid) - 删除日程
  - [ ] getByDateRange(start, end) - 按日期范围查询
  - [ ] checkConflicts(schedule) - 冲突检测
- [ ] 3. 实现 `TimeBlockIPCClient`
  - [ ] create(input) - 创建时间块
  - [ ] list(date) - 列出某天时间块
  - [ ] update(uuid, input) - 更新时间块
  - [ ] delete(uuid) - 删除时间块
  - [ ] moveBlock(uuid, newTime) - 移动时间块
- [ ] 4. 实现 `RecurrenceIPCClient`
  - [ ] createRecurring(input) - 创建重复日程
  - [ ] updateRecurring(uuid, input, scope) - 更新重复日程
  - [ ] deleteRecurring(uuid, scope) - 删除重复日程
  - [ ] getOccurrences(uuid, range) - 获取重复实例
- [ ] 5. 添加类型定义
- [ ] 6. 添加单元测试

## 技术设计

### 目录结构

```
renderer/modules/schedule/infrastructure/ipc/
├── schedule.ipc-client.ts
├── time-block.ipc-client.ts
├── recurrence.ipc-client.ts
├── types.ts
└── index.ts
```

### ScheduleIPCClient

```typescript
// renderer/modules/schedule/infrastructure/ipc/schedule.ipc-client.ts
import { BaseIPCClient } from '@/shared/infrastructure/ipc';
import { IPC_CHANNELS } from '@/shared/types/ipc-channels';
import type {
  ScheduleClientDTO,
  CreateScheduleInput,
  UpdateScheduleInput,
  ListSchedulesFilter,
  DateRange,
  ConflictResult,
} from '@dailyuse/contracts/schedule';

export class ScheduleIPCClient extends BaseIPCClient {
  async create(input: CreateScheduleInput): Promise<ScheduleClientDTO> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.CREATE, input);
  }

  async get(uuid: string): Promise<ScheduleClientDTO | null> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.GET, { uuid });
  }

  async list(filter?: ListSchedulesFilter): Promise<ScheduleClientDTO[]> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.LIST, filter);
  }

  async update(uuid: string, input: UpdateScheduleInput): Promise<ScheduleClientDTO> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.UPDATE, { uuid, ...input });
  }

  async delete(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.DELETE, { uuid });
  }

  /**
   * 按日期范围查询日程
   */
  async getByDateRange(start: string, end: string): Promise<ScheduleClientDTO[]> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.GET_BY_DATE_RANGE, { start, end });
  }

  /**
   * 检测日程冲突
   */
  async checkConflicts(schedule: Partial<CreateScheduleInput>): Promise<ConflictResult> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.CHECK_CONFLICTS, schedule);
  }

  /**
   * 批量获取指定日期的日程
   */
  async getByDate(date: string): Promise<ScheduleClientDTO[]> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.GET_BY_DATE, { date });
  }

  /**
   * 获取日程统计
   */
  async getStatistics(range: DateRange): Promise<ScheduleStatistics> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.STATISTICS, range);
  }
}
```

### TimeBlockIPCClient

```typescript
// renderer/modules/schedule/infrastructure/ipc/time-block.ipc-client.ts
import { BaseIPCClient } from '@/shared/infrastructure/ipc';

export interface TimeBlockDTO {
  uuid: string;
  scheduleUuid?: string;
  taskUuid?: string;
  title: string;
  startTime: string;
  endTime: string;
  color?: string;
  isAllDay: boolean;
}

export class TimeBlockIPCClient extends BaseIPCClient {
  async create(input: CreateTimeBlockInput): Promise<TimeBlockDTO> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.TIME_BLOCK.CREATE, input);
  }

  async list(date: string): Promise<TimeBlockDTO[]> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.TIME_BLOCK.LIST, { date });
  }

  async listByRange(start: string, end: string): Promise<TimeBlockDTO[]> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.TIME_BLOCK.LIST_BY_RANGE, { start, end });
  }

  async update(uuid: string, input: UpdateTimeBlockInput): Promise<TimeBlockDTO> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.TIME_BLOCK.UPDATE, { uuid, ...input });
  }

  async delete(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.TIME_BLOCK.DELETE, { uuid });
  }

  /**
   * 移动时间块到新时间
   */
  async moveBlock(uuid: string, newStartTime: string): Promise<TimeBlockDTO> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.TIME_BLOCK.MOVE, { uuid, newStartTime });
  }

  /**
   * 调整时间块大小
   */
  async resizeBlock(uuid: string, newEndTime: string): Promise<TimeBlockDTO> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.TIME_BLOCK.RESIZE, { uuid, newEndTime });
  }
}
```

### RecurrenceIPCClient

```typescript
// renderer/modules/schedule/infrastructure/ipc/recurrence.ipc-client.ts
import { BaseIPCClient } from '@/shared/infrastructure/ipc';

export enum RecurrenceScope {
  THIS_ONLY = 'this_only',
  THIS_AND_FOLLOWING = 'this_and_following',
  ALL = 'all',
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  count?: number;
  byDay?: number[];      // 周几 (0-6)
  byMonthDay?: number[]; // 月中哪天 (1-31)
}

export class RecurrenceIPCClient extends BaseIPCClient {
  /**
   * 创建重复日程
   */
  async createRecurring(input: CreateRecurringScheduleInput): Promise<ScheduleClientDTO> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.RECURRENCE.CREATE, input);
  }

  /**
   * 更新重复日程
   * @param scope - 更新范围：仅此实例、此实例及之后、所有实例
   */
  async updateRecurring(
    uuid: string, 
    input: UpdateScheduleInput,
    scope: RecurrenceScope
  ): Promise<ScheduleClientDTO> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.RECURRENCE.UPDATE, { 
      uuid, 
      ...input, 
      scope 
    });
  }

  /**
   * 删除重复日程
   */
  async deleteRecurring(uuid: string, scope: RecurrenceScope): Promise<void> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.RECURRENCE.DELETE, { uuid, scope });
  }

  /**
   * 获取重复日程的所有实例
   */
  async getOccurrences(
    uuid: string, 
    range: DateRange
  ): Promise<ScheduleOccurrence[]> {
    return this.invoke(IPC_CHANNELS.SCHEDULE.RECURRENCE.GET_OCCURRENCES, { uuid, range });
  }
}
```

### IPC Channels

```typescript
// 在 IPC_CHANNELS 中添加
SCHEDULE: {
  CREATE: 'schedule:create',
  GET: 'schedule:get',
  LIST: 'schedule:list',
  UPDATE: 'schedule:update',
  DELETE: 'schedule:delete',
  GET_BY_DATE_RANGE: 'schedule:getByDateRange',
  GET_BY_DATE: 'schedule:getByDate',
  CHECK_CONFLICTS: 'schedule:checkConflicts',
  STATISTICS: 'schedule:statistics',
  TIME_BLOCK: {
    CREATE: 'schedule:timeBlock:create',
    LIST: 'schedule:timeBlock:list',
    LIST_BY_RANGE: 'schedule:timeBlock:listByRange',
    UPDATE: 'schedule:timeBlock:update',
    DELETE: 'schedule:timeBlock:delete',
    MOVE: 'schedule:timeBlock:move',
    RESIZE: 'schedule:timeBlock:resize',
  },
  RECURRENCE: {
    CREATE: 'schedule:recurrence:create',
    UPDATE: 'schedule:recurrence:update',
    DELETE: 'schedule:recurrence:delete',
    GET_OCCURRENCES: 'schedule:recurrence:getOccurrences',
  },
}
```

## 验收标准

- [ ] `ScheduleIPCClient` 完整实现
- [ ] `TimeBlockIPCClient` 完整实现
- [ ] `RecurrenceIPCClient` 完整实现
- [ ] 日期范围查询正确
- [ ] 冲突检测功能正常
- [ ] 重复日程处理正确
- [ ] TypeScript 类型完整
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/schedule/infrastructure/ipc/schedule.ipc-client.ts` | 新建 | Schedule IPC Client |
| `renderer/modules/schedule/infrastructure/ipc/time-block.ipc-client.ts` | 新建 | TimeBlock IPC Client |
| `renderer/modules/schedule/infrastructure/ipc/recurrence.ipc-client.ts` | 新建 | Recurrence IPC Client |
| `renderer/modules/schedule/infrastructure/ipc/types.ts` | 新建 | 类型定义 |
| `renderer/modules/schedule/infrastructure/ipc/index.ts` | 新建 | 导出 |

## 依赖关系

- **前置依赖**: Stories 13.1, 13.4
- **后续依赖**: Story 13.15 (Schedule DI), Story 13.16 (Schedule Store)
