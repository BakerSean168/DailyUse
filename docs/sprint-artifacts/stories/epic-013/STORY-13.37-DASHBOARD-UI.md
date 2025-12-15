# Story 13.37: Dashboard 模块 UI 组件实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.37 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.36 (Dashboard IPC Client & Store) |
| 关联模块 | Dashboard |

## 目标

实现 Dashboard 模块的 UI 组件，包括概览卡片、统计图表、活动列表等。

## 任务列表

### 1. 创建 OverviewCards 组件 (1.5h)
- [ ] TaskOverviewCard
- [ ] GoalOverviewCard
- [ ] FocusOverviewCard
- [ ] QuickActionsCard

### 2. 创建 StatsSection 组件 (2h)
- [ ] ProductivityScoreCard
- [ ] TrendChart (使用 Recharts)
- [ ] CompletionRateCard

### 3. 创建 ActivitySection 组件 (1h)
- [ ] RecentActivityList
- [ ] ActivityItem

### 4. 创建 WeeklyInsights 组件 (1.5h)
- [ ] WeeklyReportCard
- [ ] InsightsSection

## 技术规范

### Overview Cards
```typescript
// renderer/modules/dashboard/presentation/components/OverviewCards.tsx
import React from 'react';
import { useTodayOverview } from '../hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@dailyuse/ui';
import {
  CheckSquare,
  Target,
  Clock,
  Calendar,
  Bell,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-background',
    success: 'bg-green-50 dark:bg-green-950/30',
    warning: 'bg-yellow-50 dark:bg-yellow-950/30',
    danger: 'bg-red-50 dark:bg-red-950/30',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Icon className={`w-5 h-5 ${iconStyles[variant]}`} />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && (
              <span className="text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const TaskOverviewCard: React.FC = () => {
  const { overview, isLoading } = useTodayOverview();

  if (isLoading || !overview) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const variant =
    overview.overdueTasks > 0
      ? 'danger'
      : overview.completedTasks >= overview.totalTasks * 0.8
        ? 'success'
        : 'default';

  return (
    <StatCard
      title="今日任务"
      value={`${overview.completedTasks}/${overview.totalTasks}`}
      subtitle={
        overview.overdueTasks > 0
          ? `${overview.overdueTasks} 个已过期`
          : `${overview.pendingTasks} 个待完成`
      }
      icon={CheckSquare}
      variant={variant}
    />
  );
};

export const GoalOverviewCard: React.FC = () => {
  const { overview, isLoading } = useTodayOverview();

  if (isLoading || !overview) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <StatCard
      title="活跃目标"
      value={overview.activeGoals}
      subtitle={`本周完成 ${overview.completedGoalsThisWeek} 个`}
      icon={Target}
      variant={overview.activeGoals > 0 ? 'default' : 'warning'}
    />
  );
};

export const FocusOverviewCard: React.FC = () => {
  const { overview, isLoading } = useTodayOverview();

  if (isLoading || !overview) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hours = Math.floor(overview.totalFocusMinutes / 60);
  const minutes = overview.totalFocusMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <StatCard
      title="今日专注"
      value={timeStr}
      subtitle={`${overview.completedPomodoros} 个番茄`}
      icon={Clock}
      variant={overview.totalFocusMinutes >= 120 ? 'success' : 'default'}
    />
  );
};

export const UpcomingCard: React.FC = () => {
  const { overview, isLoading } = useTodayOverview();

  if (isLoading || !overview) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <StatCard
      title="即将到来"
      value={overview.upcomingEvents + overview.pendingReminders}
      subtitle={`${overview.upcomingEvents} 日程, ${overview.pendingReminders} 提醒`}
      icon={Calendar}
      variant={
        overview.upcomingEvents + overview.pendingReminders > 5
          ? 'warning'
          : 'default'
      }
    />
  );
};

export const OverviewCards: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <TaskOverviewCard />
      <GoalOverviewCard />
      <FocusOverviewCard />
      <UpcomingCard />
    </div>
  );
};
```

### Stats Section with Chart
```typescript
// renderer/modules/dashboard/presentation/components/StatsSection.tsx
import React from 'react';
import { useDashboardStats, useTrendData } from '../hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  Progress,
} from '@dailyuse/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

export const ProductivityScoreCard: React.FC = () => {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const scoreColor =
    stats.productivityScore >= 70
      ? 'text-green-600'
      : stats.productivityScore >= 40
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          生产力得分
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className={`text-5xl font-bold ${scoreColor}`}>
            {stats.productivityScore}
          </div>
          <p className="text-sm text-muted-foreground mt-2">满分 100</p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>任务完成率</span>
              <span>{stats.taskCompletionRate}%</span>
            </div>
            <Progress value={stats.taskCompletionRate} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>目标进度</span>
              <span>{stats.avgGoalProgress}%</span>
            </div>
            <Progress value={stats.avgGoalProgress} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>日均专注</span>
              <span>{stats.avgDailyFocusMinutes} 分钟</span>
            </div>
            <Progress
              value={Math.min((stats.avgDailyFocusMinutes / 120) * 100, 100)}
              className="h-2"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            {stats.taskCompletionTrend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={
                stats.taskCompletionTrend >= 0 ? 'text-green-600' : 'text-red-600'
              }
            >
              {stats.taskCompletionTrend >= 0 ? '+' : ''}
              {stats.taskCompletionTrend}% 任务
            </span>
          </div>
          <div className="flex items-center gap-1">
            {stats.focusTrend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={stats.focusTrend >= 0 ? 'text-green-600' : 'text-red-600'}
            >
              {stats.focusTrend >= 0 ? '+' : ''}
              {stats.focusTrend}% 专注
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const TrendChart: React.FC = () => {
  const { data, isLoading } = useTrendData(7);

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardContent className="p-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>本周趋势</CardTitle>
        <CardDescription>任务完成和专注时间的变化趋势</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="tasksCompleted"
                name="完成任务"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorTasks)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="focusMinutes"
                name="专注时间 (分钟)"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorFocus)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatsSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ProductivityScoreCard />
      <TrendChart />
    </div>
  );
};
```

### Activity Section
```typescript
// renderer/modules/dashboard/presentation/components/ActivitySection.tsx
import React from 'react';
import { useRecentActivity } from '../hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
  Skeleton,
} from '@dailyuse/ui';
import {
  CheckCircle,
  Target,
  Clock,
  Bell,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ActivityItem } from '../../infrastructure/ipc';

const ActivityIcon: React.FC<{ type: ActivityItem['type'] }> = ({ type }) => {
  const icons = {
    task_completed: <CheckCircle className="w-4 h-4 text-green-600" />,
    goal_progress: <Target className="w-4 h-4 text-blue-600" />,
    focus_session: <Clock className="w-4 h-4 text-purple-600" />,
    reminder_triggered: <Bell className="w-4 h-4 text-yellow-600" />,
    document_created: <FileText className="w-4 h-4 text-gray-600" />,
  };
  return icons[type] || null;
};

const ActivityItemComponent: React.FC<{ activity: ActivityItem }> = ({
  activity,
}) => {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className="mt-0.5">
        <ActivityIcon type={activity.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.title}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground truncate">
            {activity.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.timestamp), {
            addSuffix: true,
            locale: zhCN,
          })}
        </p>
      </div>
    </div>
  );
};

export const RecentActivityList: React.FC = () => {
  const { activities, isLoading } = useRecentActivity(15);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近活动</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无活动记录
            </div>
          ) : (
            activities.map((activity) => (
              <ActivityItemComponent key={activity.id} activity={activity} />
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export const ActivitySection: React.FC = () => {
  return <RecentActivityList />;
};
```

### Weekly Insights
```typescript
// renderer/modules/dashboard/presentation/components/WeeklyInsights.tsx
import React from 'react';
import { useWeeklyReport } from '../hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  Badge,
} from '@dailyuse/ui';
import {
  Calendar,
  CheckCircle,
  Target,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const WeeklyReportCard: React.FC = () => {
  const { report, isLoading } = useWeeklyReport();

  if (isLoading || !report) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const weekRange = `${format(new Date(report.weekStart), 'M月d日', { locale: zhCN })} - ${format(new Date(report.weekEnd), 'M月d日', { locale: zhCN })}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              本周报告
            </CardTitle>
            <CardDescription>{weekRange}</CardDescription>
          </div>
          <Badge variant="outline">
            <Sparkles className="w-3 h-3 mr-1" />
            AI 洞察
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{report.tasksCompleted}</p>
              <p className="text-xs text-muted-foreground">任务完成</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{report.goalsAchieved}</p>
              <p className="text-xs text-muted-foreground">目标达成</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Clock className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">
                {Math.round(report.totalFocusMinutes / 60)}h
              </p>
              <p className="text-xs text-muted-foreground">专注时间</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">
                {format(new Date(report.mostProductiveDay), 'E', { locale: zhCN })}
              </p>
              <p className="text-xs text-muted-foreground">最高效日</p>
            </div>
          </div>
        </div>

        {/* Insights */}
        {report.insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              洞察与建议
            </h4>
            <ul className="space-y-1">
              {report.insights.map((insight, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30"
                >
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const WeeklyInsights: React.FC = () => {
  return <WeeklyReportCard />;
};
```

### Index File
```typescript
// renderer/modules/dashboard/presentation/components/index.ts
export { OverviewCards, TaskOverviewCard, GoalOverviewCard, FocusOverviewCard, UpcomingCard } from './OverviewCards';
export { StatsSection, ProductivityScoreCard, TrendChart } from './StatsSection';
export { ActivitySection, RecentActivityList } from './ActivitySection';
export { WeeklyInsights, WeeklyReportCard } from './WeeklyInsights';
```

## 验收标准

- [ ] 概览卡片数据正确显示
- [ ] 统计数据正确渲染
- [ ] 趋势图表正确绑定数据
- [ ] 活动列表正确显示
- [ ] 周报数据正确显示
- [ ] 加载状态显示正确
- [ ] 响应式布局正常
- [ ] 暗色模式支持
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/dashboard/presentation/components/OverviewCards.tsx`
- `renderer/modules/dashboard/presentation/components/StatsSection.tsx`
- `renderer/modules/dashboard/presentation/components/ActivitySection.tsx`
- `renderer/modules/dashboard/presentation/components/WeeklyInsights.tsx`
- `renderer/modules/dashboard/presentation/components/index.ts`
