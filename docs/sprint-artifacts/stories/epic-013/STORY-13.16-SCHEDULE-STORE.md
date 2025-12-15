# Story 13.16: Schedule Store 重构 & 日历组件

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.16 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | High |
| 预估工时 | 6h |
| 状态 | Backlog |

## 目标

重构 Schedule Store 使用 IPC Client，并确保日历组件正常工作。

## 任务列表

- [ ] 1. 分析当前 Schedule Store 结构
- [ ] 2. 重构为使用 IPC Client
- [ ] 3. 添加时间块相关 actions
- [ ] 4. 添加重复日程相关 actions
- [ ] 5. 验证日历组件兼容性
- [ ] 6. 添加拖拽操作支持
- [ ] 7. 添加单元测试

## 技术设计

### Schedule Store

```typescript
// renderer/modules/schedule/store/schedule.store.ts
import { defineStore } from 'pinia';
import { container } from '@/shared/infrastructure/di';
import { SCHEDULE_TOKENS } from '../di/tokens';

interface ScheduleState {
  schedules: ScheduleClientDTO[];
  timeBlocks: TimeBlockDTO[];
  currentDate: string;
  viewMode: 'day' | 'week' | 'month';
  loading: boolean;
  error: string | null;
}

export const useScheduleStore = defineStore('schedule', {
  state: (): ScheduleState => ({
    schedules: [],
    timeBlocks: [],
    currentDate: new Date().toISOString().split('T')[0],
    viewMode: 'week',
    loading: false,
    error: null,
  }),

  getters: {
    currentDateSchedules: (state) => {
      return state.schedules.filter(s => 
        s.date === state.currentDate || 
        (s.startTime <= state.currentDate && s.endTime >= state.currentDate)
      );
    },
    
    weekSchedules: (state) => {
      // 获取当前周的日程
      const weekStart = getWeekStart(state.currentDate);
      const weekEnd = getWeekEnd(state.currentDate);
      return state.schedules.filter(s => 
        s.date >= weekStart && s.date <= weekEnd
      );
    },
  },

  actions: {
    getScheduleClient() {
      return container.resolve<ScheduleIPCClient>(SCHEDULE_TOKENS.SCHEDULE_IPC_CLIENT);
    },

    getTimeBlockClient() {
      return container.resolve<TimeBlockIPCClient>(SCHEDULE_TOKENS.TIME_BLOCK_IPC_CLIENT);
    },

    async fetchSchedulesByDateRange(start: string, end: string) {
      this.loading = true;
      try {
        const client = this.getScheduleClient();
        this.schedules = await client.getByDateRange(start, end);
      } catch (e) {
        this.error = formatError(e);
      } finally {
        this.loading = false;
      }
    },

    async fetchTimeBlocks(date: string) {
      try {
        const client = this.getTimeBlockClient();
        this.timeBlocks = await client.list(date);
      } catch (e) {
        this.error = formatError(e);
      }
    },

    async createSchedule(input: CreateScheduleInput) {
      this.loading = true;
      try {
        const client = this.getScheduleClient();
        const schedule = await client.create(input);
        this.schedules.push(schedule);
        return schedule;
      } catch (e) {
        this.error = formatError(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async moveTimeBlock(uuid: string, newStartTime: string) {
      try {
        const client = this.getTimeBlockClient();
        const updated = await client.moveBlock(uuid, newStartTime);
        const index = this.timeBlocks.findIndex(tb => tb.uuid === uuid);
        if (index !== -1) {
          this.timeBlocks[index] = updated;
        }
      } catch (e) {
        this.error = formatError(e);
        throw e;
      }
    },

    setViewMode(mode: 'day' | 'week' | 'month') {
      this.viewMode = mode;
    },

    navigateDate(direction: 'prev' | 'next') {
      // 根据 viewMode 调整日期
    },
  },
});
```

## 验收标准

- [ ] Store 重构完成
- [ ] 日历视图正常显示
- [ ] 日程拖拽操作正常
- [ ] 重复日程处理正确
- [ ] 视图切换流畅

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/schedule/store/schedule.store.ts` | 修改 | 重构 Store |
| `renderer/modules/schedule/store/time-block.store.ts` | 新建 | TimeBlock Store |

## 依赖关系

- **前置依赖**: Story 13.15 (Schedule DI)
- **后续依赖**: 无
