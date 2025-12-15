# Story 13.36: Dashboard 模块 IPC Client 和 Store

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.36 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 2h |
| 前置依赖 | Story 13.35 (Dashboard Main Process) |
| 关联模块 | Dashboard |

## 目标

实现 Dashboard 模块的 Renderer Process IPC Client 和 Zustand Store。

## 任务列表

### 1. 创建 DashboardIPCClient (0.5h)
- [ ] 继承 BaseIPCClient
- [ ] 实现所有数据获取方法
- [ ] 事件订阅

### 2. 创建 dashboardStore (1h)
- [ ] 状态管理
- [ ] 数据加载 Actions
- [ ] 自动刷新机制

### 3. 自定义 Hooks (0.5h)
- [ ] useTodayOverview
- [ ] useDashboardStats
- [ ] useTrendData

## 技术规范

### Dashboard IPC Client
```typescript
// renderer/modules/dashboard/infrastructure/ipc/dashboardIPCClient.ts
import { BaseIPCClient } from '../../../../infrastructure/ipc';

export interface TodayOverview {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  activeGoals: number;
  completedGoalsThisWeek: number;
  totalFocusMinutes: number;
  completedPomodoros: number;
  upcomingEvents: number;
  pendingReminders: number;
}

export interface DashboardStats {
  taskCompletionRate: number;
  taskCompletionTrend: number;
  avgGoalProgress: number;
  avgDailyFocusMinutes: number;
  focusTrend: number;
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

export interface DashboardIPCClient {
  getTodayOverview(): Promise<TodayOverview>;
  getStats(): Promise<DashboardStats>;
  getRecentActivity(limit?: number): Promise<ActivityItem[]>;
  getTrendData(days?: number): Promise<TrendData[]>;
  getWeeklyReport(): Promise<WeeklyReport>;
  refresh(): Promise<TodayOverview>;
  onUpdated(callback: (overview: TodayOverview) => void): () => void;
}

class DashboardIPCClientImpl extends BaseIPCClient implements DashboardIPCClient {
  constructor() {
    super('dashboard');
  }

  async getTodayOverview(): Promise<TodayOverview> {
    return this.invoke<TodayOverview>('get-today-overview');
  }

  async getStats(): Promise<DashboardStats> {
    return this.invoke<DashboardStats>('get-stats');
  }

  async getRecentActivity(limit = 20): Promise<ActivityItem[]> {
    return this.invoke<ActivityItem[]>('get-recent-activity', limit);
  }

  async getTrendData(days = 7): Promise<TrendData[]> {
    return this.invoke<TrendData[]>('get-trend-data', days);
  }

  async getWeeklyReport(): Promise<WeeklyReport> {
    return this.invoke<WeeklyReport>('get-weekly-report');
  }

  async refresh(): Promise<TodayOverview> {
    return this.invoke<TodayOverview>('refresh');
  }

  onUpdated(callback: (overview: TodayOverview) => void): () => void {
    return this.on('updated', callback);
  }
}

export const dashboardIPCClient = new DashboardIPCClientImpl();
```

### Dashboard Store
```typescript
// renderer/modules/dashboard/presentation/stores/dashboardStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  dashboardIPCClient,
  type TodayOverview,
  type DashboardStats,
  type ActivityItem,
  type TrendData,
  type WeeklyReport,
} from '../../infrastructure/ipc';

interface DashboardState {
  overview: TodayOverview | null;
  stats: DashboardStats | null;
  recentActivity: ActivityItem[];
  trendData: TrendData[];
  weeklyReport: WeeklyReport | null;
  
  isLoadingOverview: boolean;
  isLoadingStats: boolean;
  isLoadingActivity: boolean;
  isLoadingTrend: boolean;
  isLoadingReport: boolean;
  
  lastUpdated: Date | null;
  error: string | null;
}

interface DashboardActions {
  loadOverview: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadRecentActivity: (limit?: number) => Promise<void>;
  loadTrendData: (days?: number) => Promise<void>;
  loadWeeklyReport: () => Promise<void>;
  
  loadAll: () => Promise<void>;
  refresh: () => Promise<void>;
  
  initialize: () => Promise<void>;
}

type DashboardStore = DashboardState & DashboardActions;

const initialState: DashboardState = {
  overview: null,
  stats: null,
  recentActivity: [],
  trendData: [],
  weeklyReport: null,
  
  isLoadingOverview: false,
  isLoadingStats: false,
  isLoadingActivity: false,
  isLoadingTrend: false,
  isLoadingReport: false,
  
  lastUpdated: null,
  error: null,
};

export const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    loadOverview: async () => {
      set({ isLoadingOverview: true, error: null });
      try {
        const overview = await dashboardIPCClient.getTodayOverview();
        set({ overview, isLoadingOverview: false, lastUpdated: new Date() });
      } catch (error) {
        set({
          error: (error as Error).message,
          isLoadingOverview: false,
        });
      }
    },

    loadStats: async () => {
      set({ isLoadingStats: true, error: null });
      try {
        const stats = await dashboardIPCClient.getStats();
        set({ stats, isLoadingStats: false });
      } catch (error) {
        set({
          error: (error as Error).message,
          isLoadingStats: false,
        });
      }
    },

    loadRecentActivity: async (limit = 20) => {
      set({ isLoadingActivity: true, error: null });
      try {
        const recentActivity = await dashboardIPCClient.getRecentActivity(limit);
        set({ recentActivity, isLoadingActivity: false });
      } catch (error) {
        set({
          error: (error as Error).message,
          isLoadingActivity: false,
        });
      }
    },

    loadTrendData: async (days = 7) => {
      set({ isLoadingTrend: true, error: null });
      try {
        const trendData = await dashboardIPCClient.getTrendData(days);
        set({ trendData, isLoadingTrend: false });
      } catch (error) {
        set({
          error: (error as Error).message,
          isLoadingTrend: false,
        });
      }
    },

    loadWeeklyReport: async () => {
      set({ isLoadingReport: true, error: null });
      try {
        const weeklyReport = await dashboardIPCClient.getWeeklyReport();
        set({ weeklyReport, isLoadingReport: false });
      } catch (error) {
        set({
          error: (error as Error).message,
          isLoadingReport: false,
        });
      }
    },

    loadAll: async () => {
      const { loadOverview, loadStats, loadRecentActivity, loadTrendData } = get();
      await Promise.all([
        loadOverview(),
        loadStats(),
        loadRecentActivity(),
        loadTrendData(),
      ]);
    },

    refresh: async () => {
      try {
        const overview = await dashboardIPCClient.refresh();
        set({ overview, lastUpdated: new Date() });
        
        // Also refresh other data
        const { loadStats, loadRecentActivity, loadTrendData } = get();
        await Promise.all([
          loadStats(),
          loadRecentActivity(),
          loadTrendData(),
        ]);
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },

    initialize: async () => {
      // Load initial data
      await get().loadAll();

      // Subscribe to updates from main process
      dashboardIPCClient.onUpdated((overview) => {
        set({ overview, lastUpdated: new Date() });
      });

      // Auto refresh every 5 minutes
      setInterval(() => {
        get().refresh();
      }, 5 * 60 * 1000);
    },
  }))
);
```

### Custom Hooks
```typescript
// renderer/modules/dashboard/presentation/hooks/useTodayOverview.ts
import { useEffect } from 'react';
import { useDashboardStore } from '../stores';

export function useTodayOverview() {
  const overview = useDashboardStore((state) => state.overview);
  const isLoading = useDashboardStore((state) => state.isLoadingOverview);
  const lastUpdated = useDashboardStore((state) => state.lastUpdated);
  const loadOverview = useDashboardStore((state) => state.loadOverview);
  const refresh = useDashboardStore((state) => state.refresh);

  useEffect(() => {
    if (!overview) {
      loadOverview();
    }
  }, [overview, loadOverview]);

  return {
    overview,
    isLoading,
    lastUpdated,
    refresh,
  };
}

// renderer/modules/dashboard/presentation/hooks/useDashboardStats.ts
import { useEffect } from 'react';
import { useDashboardStore } from '../stores';

export function useDashboardStats() {
  const stats = useDashboardStore((state) => state.stats);
  const isLoading = useDashboardStore((state) => state.isLoadingStats);
  const loadStats = useDashboardStore((state) => state.loadStats);

  useEffect(() => {
    if (!stats) {
      loadStats();
    }
  }, [stats, loadStats]);

  return {
    stats,
    isLoading,
    reload: loadStats,
  };
}

// renderer/modules/dashboard/presentation/hooks/useTrendData.ts
import { useEffect, useState } from 'react';
import { useDashboardStore } from '../stores';

export function useTrendData(days = 7) {
  const trendData = useDashboardStore((state) => state.trendData);
  const isLoading = useDashboardStore((state) => state.isLoadingTrend);
  const loadTrendData = useDashboardStore((state) => state.loadTrendData);
  const [currentDays, setCurrentDays] = useState(days);

  useEffect(() => {
    if (trendData.length === 0 || currentDays !== days) {
      loadTrendData(days);
      setCurrentDays(days);
    }
  }, [days, trendData.length, loadTrendData, currentDays]);

  return {
    data: trendData,
    isLoading,
    reload: () => loadTrendData(days),
  };
}

// renderer/modules/dashboard/presentation/hooks/useRecentActivity.ts
import { useEffect } from 'react';
import { useDashboardStore } from '../stores';

export function useRecentActivity(limit = 20) {
  const recentActivity = useDashboardStore((state) => state.recentActivity);
  const isLoading = useDashboardStore((state) => state.isLoadingActivity);
  const loadRecentActivity = useDashboardStore((state) => state.loadRecentActivity);

  useEffect(() => {
    if (recentActivity.length === 0) {
      loadRecentActivity(limit);
    }
  }, [recentActivity.length, loadRecentActivity, limit]);

  return {
    activities: recentActivity,
    isLoading,
    reload: () => loadRecentActivity(limit),
  };
}

// renderer/modules/dashboard/presentation/hooks/useWeeklyReport.ts
import { useEffect } from 'react';
import { useDashboardStore } from '../stores';

export function useWeeklyReport() {
  const weeklyReport = useDashboardStore((state) => state.weeklyReport);
  const isLoading = useDashboardStore((state) => state.isLoadingReport);
  const loadWeeklyReport = useDashboardStore((state) => state.loadWeeklyReport);

  useEffect(() => {
    if (!weeklyReport) {
      loadWeeklyReport();
    }
  }, [weeklyReport, loadWeeklyReport]);

  return {
    report: weeklyReport,
    isLoading,
    reload: loadWeeklyReport,
  };
}
```

### Index Files
```typescript
// renderer/modules/dashboard/infrastructure/ipc/index.ts
export { dashboardIPCClient, type DashboardIPCClient } from './dashboardIPCClient';
export type {
  TodayOverview,
  DashboardStats,
  ActivityItem,
  TrendData,
  WeeklyReport,
} from './dashboardIPCClient';

// renderer/modules/dashboard/presentation/stores/index.ts
export { useDashboardStore } from './dashboardStore';

// renderer/modules/dashboard/presentation/hooks/index.ts
export { useTodayOverview } from './useTodayOverview';
export { useDashboardStats } from './useDashboardStats';
export { useTrendData } from './useTrendData';
export { useRecentActivity } from './useRecentActivity';
export { useWeeklyReport } from './useWeeklyReport';
```

### Unit Tests
```typescript
// renderer/modules/dashboard/presentation/stores/__tests__/dashboardStore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDashboardStore } from '../dashboardStore';
import { dashboardIPCClient } from '../../../infrastructure/ipc';

vi.mock('../../../infrastructure/ipc');

const mockDashboardIPCClient = vi.mocked(dashboardIPCClient);

describe('dashboardStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDashboardStore.setState({
      overview: null,
      stats: null,
      recentActivity: [],
      trendData: [],
      weeklyReport: null,
      isLoadingOverview: false,
      isLoadingStats: false,
      isLoadingActivity: false,
      isLoadingTrend: false,
      isLoadingReport: false,
      lastUpdated: null,
      error: null,
    });
  });

  describe('loadOverview', () => {
    it('should load today overview', async () => {
      const mockOverview = {
        totalTasks: 10,
        completedTasks: 5,
        pendingTasks: 5,
        overdueTasks: 2,
        activeGoals: 3,
        completedGoalsThisWeek: 1,
        totalFocusMinutes: 120,
        completedPomodoros: 5,
        upcomingEvents: 2,
        pendingReminders: 3,
      };

      mockDashboardIPCClient.getTodayOverview.mockResolvedValue(mockOverview);

      const { result } = renderHook(() => useDashboardStore());

      await act(async () => {
        await result.current.loadOverview();
      });

      expect(result.current.overview).toEqual(mockOverview);
      expect(result.current.isLoadingOverview).toBe(false);
      expect(result.current.lastUpdated).toBeTruthy();
    });

    it('should handle load error', async () => {
      mockDashboardIPCClient.getTodayOverview.mockRejectedValue(
        new Error('Load failed')
      );

      const { result } = renderHook(() => useDashboardStore());

      await act(async () => {
        await result.current.loadOverview();
      });

      expect(result.current.error).toBe('Load failed');
      expect(result.current.isLoadingOverview).toBe(false);
    });
  });

  describe('loadStats', () => {
    it('should load dashboard stats', async () => {
      const mockStats = {
        taskCompletionRate: 75,
        taskCompletionTrend: 10,
        avgGoalProgress: 60,
        avgDailyFocusMinutes: 45,
        focusTrend: 5,
        productivityScore: 72,
      };

      mockDashboardIPCClient.getStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useDashboardStore());

      await act(async () => {
        await result.current.loadStats();
      });

      expect(result.current.stats).toEqual(mockStats);
    });
  });

  describe('loadAll', () => {
    it('should load all data in parallel', async () => {
      mockDashboardIPCClient.getTodayOverview.mockResolvedValue({} as any);
      mockDashboardIPCClient.getStats.mockResolvedValue({} as any);
      mockDashboardIPCClient.getRecentActivity.mockResolvedValue([]);
      mockDashboardIPCClient.getTrendData.mockResolvedValue([]);

      const { result } = renderHook(() => useDashboardStore());

      await act(async () => {
        await result.current.loadAll();
      });

      expect(mockDashboardIPCClient.getTodayOverview).toHaveBeenCalled();
      expect(mockDashboardIPCClient.getStats).toHaveBeenCalled();
      expect(mockDashboardIPCClient.getRecentActivity).toHaveBeenCalled();
      expect(mockDashboardIPCClient.getTrendData).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh all data', async () => {
      const mockOverview = { totalTasks: 5 } as any;
      mockDashboardIPCClient.refresh.mockResolvedValue(mockOverview);
      mockDashboardIPCClient.getStats.mockResolvedValue({} as any);
      mockDashboardIPCClient.getRecentActivity.mockResolvedValue([]);
      mockDashboardIPCClient.getTrendData.mockResolvedValue([]);

      const { result } = renderHook(() => useDashboardStore());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockDashboardIPCClient.refresh).toHaveBeenCalled();
      expect(result.current.overview).toEqual(mockOverview);
    });
  });
});
```

## 验收标准

- [ ] IPC Client 所有方法正常调用
- [ ] Store 状态管理正常
- [ ] 数据加载和错误处理正常
- [ ] 自动刷新机制正常
- [ ] 自定义 Hooks 正常工作
- [ ] IPC 事件订阅正常
- [ ] 单元测试覆盖率 > 80%
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/dashboard/infrastructure/ipc/dashboardIPCClient.ts`
- `renderer/modules/dashboard/infrastructure/ipc/index.ts`
- `renderer/modules/dashboard/presentation/stores/dashboardStore.ts`
- `renderer/modules/dashboard/presentation/stores/index.ts`
- `renderer/modules/dashboard/presentation/hooks/useTodayOverview.ts`
- `renderer/modules/dashboard/presentation/hooks/useDashboardStats.ts`
- `renderer/modules/dashboard/presentation/hooks/useTrendData.ts`
- `renderer/modules/dashboard/presentation/hooks/useRecentActivity.ts`
- `renderer/modules/dashboard/presentation/hooks/useWeeklyReport.ts`
- `renderer/modules/dashboard/presentation/hooks/index.ts`
- `renderer/modules/dashboard/presentation/stores/__tests__/dashboardStore.test.ts`
