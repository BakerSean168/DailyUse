# Story 13.38: Dashboard 模块视图与页面路由

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.38 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.37 (Dashboard UI Components) |
| 关联模块 | Dashboard |

## 目标

实现 Dashboard 模块的页面级组件和路由配置，整合所有 Dashboard 组件形成完整的仪表盘页面。

## 任务列表

### 1. 创建 DashboardPage 组件 (1.5h)
- [ ] 整合所有 Dashboard 组件
- [ ] 实现页面布局
- [ ] 添加刷新功能
- [ ] 错误边界处理

### 2. 创建 QuickActions 组件 (1h)
- [ ] 快速创建任务
- [ ] 快速开始专注
- [ ] 快捷导航按钮

### 3. 配置路由 (1h)
- [ ] Dashboard 路由定义
- [ ] 路由守卫配置
- [ ] 导航集成

### 4. 模块整合与导出 (0.5h)
- [ ] 模块导出文件
- [ ] 类型导出
- [ ] 文档注释

## 技术规范

### Dashboard Page
```typescript
// renderer/modules/dashboard/presentation/views/DashboardPage.tsx
import React, { useCallback } from 'react';
import { useDashboard } from '../hooks';
import {
  OverviewCards,
  StatsSection,
  ActivitySection,
  WeeklyInsights,
} from '../components';
import { QuickActions } from '../components/QuickActions';
import {
  Button,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@dailyuse/ui';
import { RefreshCw, AlertCircle, LayoutDashboard } from 'lucide-react';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px] col-span-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
};

const DashboardError: React.FC<{
  error: Error;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>加载失败</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message || '无法加载仪表盘数据'}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          重试
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export const DashboardPage: React.FC = () => {
  const {
    isInitialized,
    isLoading,
    error,
    refreshData,
    lastUpdated,
  } = useDashboard();

  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // Initial loading state
  if (!isInitialized) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <DashboardError error={error} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold">仪表盘</h1>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                最后更新: {new Date(lastUpdated).toLocaleTimeString('zh-CN')}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          刷新
        </Button>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Overview Cards */}
      <OverviewCards />

      {/* Stats Section */}
      <StatsSection />

      {/* Activity and Weekly Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivitySection />
        <WeeklyInsights />
      </div>
    </div>
  );
};
```

### Quick Actions Component
```typescript
// renderer/modules/dashboard/presentation/components/QuickActions.tsx
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
} from '@dailyuse/ui';
import {
  Plus,
  PlayCircle,
  Target,
  FileText,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useTaskActions } from '@/modules/task/presentation/hooks';
import { useGoalFocusActions } from '@/modules/goal/presentation/hooks';

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

const QuickActionButton: React.FC<QuickActionProps> = ({
  icon: Icon,
  label,
  description,
  onClick,
  variant = 'default',
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-4 p-4 rounded-lg border transition-all
        hover:shadow-md hover:border-primary/50
        ${variant === 'primary' ? 'bg-primary/5 border-primary/30' : 'bg-background'}
      `}
    >
      <div
        className={`
        p-3 rounded-full
        ${variant === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-muted'}
      `}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { createTask } = useTaskActions();
  const { startQuickFocus } = useGoalFocusActions();
  
  const [showQuickTaskDialog, setShowQuickTaskDialog] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const handleQuickTask = useCallback(async () => {
    if (quickTaskTitle.trim()) {
      await createTask({
        title: quickTaskTitle.trim(),
        priority: 'medium',
      });
      setQuickTaskTitle('');
      setShowQuickTaskDialog(false);
    }
  }, [quickTaskTitle, createTask]);

  const handleStartFocus = useCallback(() => {
    startQuickFocus(25); // 25分钟默认番茄
    navigate('/focus');
  }, [startQuickFocus, navigate]);

  const handleNewGoal = useCallback(() => {
    navigate('/goals/new');
  }, [navigate]);

  const handleNewDocument = useCallback(() => {
    navigate('/editor/new');
  }, [navigate]);

  const handleViewSchedule = useCallback(() => {
    navigate('/schedule');
  }, [navigate]);

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <QuickActionButton
              icon={Plus}
              label="快速任务"
              description="创建新任务"
              onClick={() => setShowQuickTaskDialog(true)}
              variant="primary"
            />
            <QuickActionButton
              icon={PlayCircle}
              label="开始专注"
              description="启动番茄时钟"
              onClick={handleStartFocus}
            />
            <QuickActionButton
              icon={Target}
              label="新目标"
              description="设定新目标"
              onClick={handleNewGoal}
            />
            <QuickActionButton
              icon={FileText}
              label="新文档"
              description="撰写笔记"
              onClick={handleNewDocument}
            />
            <QuickActionButton
              icon={Calendar}
              label="查看日程"
              description="今日安排"
              onClick={handleViewSchedule}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Task Dialog */}
      <Dialog open={showQuickTaskDialog} onOpenChange={setShowQuickTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>快速创建任务</DialogTitle>
            <DialogDescription>
              输入任务标题，快速创建一个待办任务
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">任务标题</Label>
              <Input
                id="task-title"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="输入任务标题..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickTask();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowQuickTaskDialog(false)}
            >
              取消
            </Button>
            <Button onClick={handleQuickTask} disabled={!quickTaskTitle.trim()}>
              创建
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

### Dashboard Routes
```typescript
// renderer/modules/dashboard/routes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { DashboardPage } from './presentation/views/DashboardPage';
import { AuthGuard } from '@/modules/auth/presentation/components';

export const dashboardRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <DashboardPage />
      </AuthGuard>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardPage />
      </AuthGuard>
    ),
  },
];

// Lazy loaded version for code splitting
export const LazyDashboardPage = React.lazy(() =>
  import('./presentation/views/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);

export const lazyDashboardRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <React.Suspense fallback={<DashboardLoadingFallback />}>
          <LazyDashboardPage />
        </React.Suspense>
      </AuthGuard>
    ),
  },
];

// Loading fallback
const DashboardLoadingFallback: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
};
```

### Module Index
```typescript
// renderer/modules/dashboard/index.ts
/**
 * Dashboard Module
 *
 * 仪表盘模块提供应用的主入口视图，展示：
 * - 今日概览（任务、目标、专注时间）
 * - 生产力统计和趋势
 * - 最近活动
 * - 周报洞察
 * - 快捷操作入口
 */

// Infrastructure
export { DashboardIPCClient } from './infrastructure/ipc';
export type {
  TodayOverview,
  DashboardStats,
  TrendDataPoint,
  ActivityItem,
  WeeklyReport,
} from './infrastructure/ipc';

// Store
export { useDashboardStore, dashboardSelectors } from './store';
export type { DashboardState, DashboardActions } from './store';

// Hooks
export {
  useDashboard,
  useTodayOverview,
  useDashboardStats,
  useTrendData,
  useRecentActivity,
  useWeeklyReport,
} from './presentation/hooks';

// Components
export {
  OverviewCards,
  TaskOverviewCard,
  GoalOverviewCard,
  FocusOverviewCard,
  UpcomingCard,
  StatsSection,
  ProductivityScoreCard,
  TrendChart,
  ActivitySection,
  RecentActivityList,
  WeeklyInsights,
  WeeklyReportCard,
} from './presentation/components';
export { QuickActions } from './presentation/components/QuickActions';

// Views
export { DashboardPage } from './presentation/views/DashboardPage';

// Routes
export { dashboardRoutes, lazyDashboardRoutes, LazyDashboardPage } from './routes';

// Module initialization
export const initializeDashboardModule = async (): Promise<void> => {
  const { useDashboardStore } = await import('./store');
  await useDashboardStore.getState().initialize();
};
```

### Types Definition
```typescript
// renderer/modules/dashboard/types.ts
/**
 * Dashboard Module Types
 */

// Time range for stats queries
export type TimeRange = '7d' | '14d' | '30d' | '90d';

// Dashboard widget configuration
export interface DashboardWidget {
  id: string;
  type: 'overview' | 'stats' | 'activity' | 'weekly' | 'custom';
  position: { row: number; col: number };
  size: { width: number; height: number };
  visible: boolean;
}

// Dashboard layout configuration
export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  rowHeight: number;
}

// Dashboard preferences
export interface DashboardPreferences {
  refreshInterval: number; // seconds
  defaultTimeRange: TimeRange;
  showQuickActions: boolean;
  layout: DashboardLayout;
}

// Quick action configuration
export interface QuickAction {
  id: string;
  type: 'task' | 'focus' | 'goal' | 'document' | 'schedule' | 'custom';
  label: string;
  description: string;
  icon: string;
  action: string; // route or action name
  enabled: boolean;
}
```

## 验收标准

- [ ] DashboardPage 正确整合所有组件
- [ ] 快捷操作正常工作
- [ ] 路由配置正确
- [ ] 懒加载正常工作
- [ ] 刷新功能正常
- [ ] 错误处理正确
- [ ] 加载状态显示正确
- [ ] 模块导出完整
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/dashboard/presentation/views/DashboardPage.tsx`
- `renderer/modules/dashboard/presentation/components/QuickActions.tsx`
- `renderer/modules/dashboard/routes.tsx`
- `renderer/modules/dashboard/index.ts`
- `renderer/modules/dashboard/types.ts`
