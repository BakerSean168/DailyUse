# Story 13.35: Dashboard 模块 Main Process 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.35 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.34 (Setting Module) |
| 关联模块 | Dashboard |

## 目标

在 Main Process 中实现 Dashboard 模块的 IPC Handler，提供仪表盘数据聚合服务。

## 任务列表

### 1. 创建 dashboardHandler (2.5h)
- [ ] 今日概览数据聚合
- [ ] 统计数据计算
- [ ] 最近活动查询
- [ ] 趋势数据分析

### 2. 实现缓存机制 (1h)
- [ ] 数据缓存
- [ ] 缓存失效策略
- [ ] 增量更新

### 3. 单元测试 (0.5h)
- [ ] Handler 测试
- [ ] 数据聚合测试

## 技术规范

### Dashboard Handler
```typescript
// main/modules/dashboard/dashboardHandler.ts
import { ipcMain, BrowserWindow } from 'electron';
import { db } from '../../database';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, format } from 'date-fns';

// Types
export interface TodayOverview {
  // Tasks
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  
  // Goals
  activeGoals: number;
  completedGoalsThisWeek: number;
  
  // Focus
  totalFocusMinutes: number;
  completedPomodoros: number;
  
  // Schedule
  upcomingEvents: number;
  
  // Reminders
  pendingReminders: number;
}

export interface DashboardStats {
  // Task completion rate
  taskCompletionRate: number;
  taskCompletionTrend: number; // percentage change from last week
  
  // Goal progress
  avgGoalProgress: number;
  
  // Focus time
  avgDailyFocusMinutes: number;
  focusTrend: number;
  
  // Productivity score (0-100)
  productivityScore: number;
}

export interface ActivityItem {
  id: string;
  type: 'task_completed' | 'goal_progress' | 'focus_session' | 'reminder_triggered' | 'document_created';
  title: string;
  description: string | null;
  timestamp: Date;
  entityUuid: string;
  entityType: string;
}

export interface TrendData {
  date: string;
  tasksCompleted: number;
  focusMinutes: number;
  productivityScore: number;
}

export interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  tasksCreated: number;
  tasksCompleted: number;
  goalsAchieved: number;
  totalFocusMinutes: number;
  mostProductiveDay: string;
  insights: string[];
}

class DashboardHandler {
  private mainWindow: BrowserWindow | null = null;
  private cache: Map<string, { data: unknown; expiry: Date }> = new Map();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  register() {
    ipcMain.handle('dashboard:get-today-overview', async () => {
      return this.getCachedOrFetch('today-overview', () => this.getTodayOverview());
    });

    ipcMain.handle('dashboard:get-stats', async () => {
      return this.getCachedOrFetch('stats', () => this.getStats());
    });

    ipcMain.handle('dashboard:get-recent-activity', async (_, limit: number = 20) => {
      return this.getRecentActivity(limit);
    });

    ipcMain.handle('dashboard:get-trend-data', async (_, days: number = 7) => {
      return this.getCachedOrFetch(`trend-${days}`, () => this.getTrendData(days));
    });

    ipcMain.handle('dashboard:get-weekly-report', async () => {
      return this.getCachedOrFetch('weekly-report', () => this.getWeeklyReport());
    });

    ipcMain.handle('dashboard:refresh', async () => {
      return this.refresh();
    });

    console.log('[DashboardHandler] Registered');
  }

  // ===== Data Aggregation Methods =====

  private async getTodayOverview(): Promise<TodayOverview> {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    // Tasks
    const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
      db.task.count({
        where: {
          OR: [
            { dueDate: { gte: dayStart, lte: dayEnd } },
            { isCompleted: false },
          ],
        },
      }),
      db.task.count({
        where: {
          isCompleted: true,
          completedAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      db.task.count({
        where: {
          isCompleted: false,
          dueDate: { lt: dayStart },
        },
      }),
    ]);

    // Goals
    const [activeGoals, completedGoalsThisWeek] = await Promise.all([
      db.goal.count({
        where: { status: 'active' },
      }),
      db.goal.count({
        where: {
          status: 'completed',
          completedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
    ]);

    // Focus sessions (from goal focus tracking)
    const focusSessions = await db.focusSession.findMany({
      where: {
        startedAt: { gte: dayStart, lte: dayEnd },
        status: 'completed',
      },
    });
    const totalFocusMinutes = focusSessions.reduce(
      (sum, session) => sum + (session.actualDurationMinutes || 0),
      0
    );
    const completedPomodoros = focusSessions.length;

    // Schedule
    const upcomingEvents = await db.schedule.count({
      where: {
        startTime: { gte: today, lte: dayEnd },
      },
    });

    // Reminders
    const pendingReminders = await db.reminder.count({
      where: {
        isActive: true,
        nextTriggerTime: { lte: dayEnd },
      },
    });

    return {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      overdueTasks,
      activeGoals,
      completedGoalsThisWeek,
      totalFocusMinutes,
      completedPomodoros,
      upcomingEvents,
      pendingReminders,
    };
  }

  private async getStats(): Promise<DashboardStats> {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const lastWeekStart = startOfWeek(subDays(today, 7));
    const lastWeekEnd = endOfWeek(subDays(today, 7));

    // Task completion rate
    const [thisWeekCompleted, thisWeekTotal, lastWeekCompleted, lastWeekTotal] =
      await Promise.all([
        db.task.count({
          where: {
            isCompleted: true,
            completedAt: { gte: weekStart },
          },
        }),
        db.task.count({
          where: {
            createdAt: { gte: weekStart },
          },
        }),
        db.task.count({
          where: {
            isCompleted: true,
            completedAt: { gte: lastWeekStart, lte: lastWeekEnd },
          },
        }),
        db.task.count({
          where: {
            createdAt: { gte: lastWeekStart, lte: lastWeekEnd },
          },
        }),
      ]);

    const taskCompletionRate =
      thisWeekTotal > 0 ? (thisWeekCompleted / thisWeekTotal) * 100 : 0;
    const lastWeekRate =
      lastWeekTotal > 0 ? (lastWeekCompleted / lastWeekTotal) * 100 : 0;
    const taskCompletionTrend = taskCompletionRate - lastWeekRate;

    // Goal progress
    const activeGoals = await db.goal.findMany({
      where: { status: 'active' },
      select: { progress: true },
    });
    const avgGoalProgress =
      activeGoals.length > 0
        ? activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length
        : 0;

    // Focus time
    const daysCount = 7;
    const focusSessions = await db.focusSession.findMany({
      where: {
        startedAt: { gte: subDays(today, daysCount) },
        status: 'completed',
      },
    });
    const totalFocusMinutes = focusSessions.reduce(
      (sum, s) => sum + (s.actualDurationMinutes || 0),
      0
    );
    const avgDailyFocusMinutes = totalFocusMinutes / daysCount;

    // Calculate trend
    const lastWeekFocusSessions = await db.focusSession.findMany({
      where: {
        startedAt: { gte: lastWeekStart, lte: lastWeekEnd },
        status: 'completed',
      },
    });
    const lastWeekFocusMinutes = lastWeekFocusSessions.reduce(
      (sum, s) => sum + (s.actualDurationMinutes || 0),
      0
    );
    const focusTrend =
      lastWeekFocusMinutes > 0
        ? ((totalFocusMinutes - lastWeekFocusMinutes) / lastWeekFocusMinutes) * 100
        : 0;

    // Productivity score (weighted calculation)
    const productivityScore = Math.min(
      100,
      Math.round(
        taskCompletionRate * 0.3 +
          avgGoalProgress * 0.3 +
          Math.min(avgDailyFocusMinutes / 2, 40) * 1 // 2 hours = 40 points
      )
    );

    return {
      taskCompletionRate: Math.round(taskCompletionRate),
      taskCompletionTrend: Math.round(taskCompletionTrend),
      avgGoalProgress: Math.round(avgGoalProgress),
      avgDailyFocusMinutes: Math.round(avgDailyFocusMinutes),
      focusTrend: Math.round(focusTrend),
      productivityScore,
    };
  }

  private async getRecentActivity(limit: number): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];

    // Recent completed tasks
    const completedTasks = await db.task.findMany({
      where: { isCompleted: true },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
    activities.push(
      ...completedTasks.map((task) => ({
        id: `task-${task.uuid}`,
        type: 'task_completed' as const,
        title: task.title,
        description: null,
        timestamp: task.completedAt!,
        entityUuid: task.uuid,
        entityType: 'task',
      }))
    );

    // Recent focus sessions
    const focusSessions = await db.focusSession.findMany({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: limit,
      include: { goal: true },
    });
    activities.push(
      ...focusSessions.map((session) => ({
        id: `focus-${session.uuid}`,
        type: 'focus_session' as const,
        title: `完成专注 ${session.actualDurationMinutes} 分钟`,
        description: session.goal?.title || null,
        timestamp: session.completedAt!,
        entityUuid: session.uuid,
        entityType: 'focus_session',
      }))
    );

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private async getTrendData(days: number): Promise<TrendData[]> {
    const data: TrendData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const [tasksCompleted, focusSessions] = await Promise.all([
        db.task.count({
          where: {
            isCompleted: true,
            completedAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        db.focusSession.findMany({
          where: {
            startedAt: { gte: dayStart, lte: dayEnd },
            status: 'completed',
          },
        }),
      ]);

      const focusMinutes = focusSessions.reduce(
        (sum, s) => sum + (s.actualDurationMinutes || 0),
        0
      );

      // Simple productivity score for the day
      const productivityScore = Math.min(
        100,
        tasksCompleted * 10 + Math.floor(focusMinutes / 3)
      );

      data.push({
        date: format(date, 'yyyy-MM-dd'),
        tasksCompleted,
        focusMinutes,
        productivityScore,
      });
    }

    return data;
  }

  private async getWeeklyReport(): Promise<WeeklyReport> {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    const [tasksCreated, tasksCompleted, goalsAchieved, focusSessions] =
      await Promise.all([
        db.task.count({
          where: {
            createdAt: { gte: weekStart, lte: weekEnd },
          },
        }),
        db.task.count({
          where: {
            isCompleted: true,
            completedAt: { gte: weekStart, lte: weekEnd },
          },
        }),
        db.goal.count({
          where: {
            status: 'completed',
            completedAt: { gte: weekStart, lte: weekEnd },
          },
        }),
        db.focusSession.findMany({
          where: {
            startedAt: { gte: weekStart, lte: weekEnd },
            status: 'completed',
          },
        }),
      ]);

    const totalFocusMinutes = focusSessions.reduce(
      (sum, s) => sum + (s.actualDurationMinutes || 0),
      0
    );

    // Find most productive day
    const trendData = await this.getTrendData(7);
    const mostProductiveDay = trendData.reduce((best, day) =>
      day.productivityScore > best.productivityScore ? day : best
    );

    // Generate insights
    const insights: string[] = [];
    const completionRate =
      tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
    
    if (completionRate >= 80) {
      insights.push('本周任务完成率很高，继续保持！');
    } else if (completionRate < 50) {
      insights.push('本周任务完成率较低，可以尝试减少任务数量或分解大任务。');
    }

    if (totalFocusMinutes >= 600) {
      insights.push('本周专注时间充足，效率不错！');
    } else if (totalFocusMinutes < 180) {
      insights.push('本周专注时间较少，建议使用番茄钟技术提升专注度。');
    }

    return {
      weekStart,
      weekEnd,
      tasksCreated,
      tasksCompleted,
      goalsAchieved,
      totalFocusMinutes,
      mostProductiveDay: mostProductiveDay.date,
      insights,
    };
  }

  // ===== Cache Management =====

  private async getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > new Date()) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      expiry: new Date(Date.now() + this.CACHE_TTL),
    });
    return data;
  }

  private async refresh(): Promise<TodayOverview> {
    this.cache.clear();
    const overview = await this.getTodayOverview();
    this.emitEvent('dashboard:updated', overview);
    return overview;
  }

  // ===== Event Emission =====

  private emitEvent(channel: string, data: unknown) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

export const dashboardHandler = new DashboardHandler();
```

### Module Index
```typescript
// main/modules/dashboard/index.ts
export { dashboardHandler } from './dashboardHandler';
export type {
  TodayOverview,
  DashboardStats,
  ActivityItem,
  TrendData,
  WeeklyReport,
} from './dashboardHandler';
```

## 验收标准

- [ ] 今日概览数据正确聚合
- [ ] 统计数据计算准确
- [ ] 趋势数据生成正确
- [ ] 最近活动查询正常
- [ ] 周报生成功能正常
- [ ] 缓存机制有效
- [ ] 缓存刷新正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/dashboard/dashboardHandler.ts`
- `main/modules/dashboard/index.ts`
