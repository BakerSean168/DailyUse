/**
 * Dashboard View
 *
 * 首页仪表盘 - 显示概览信息
 * Story-007: Dashboard UI Enhancement
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardSkeleton } from '../../components/Skeleton';
import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
} from '@dailyuse/infrastructure-client';
import { useNavigate } from 'react-router-dom';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

import {
  StatCard,
  TodaySchedule,
  UpcomingReminders,
  GoalProgressList,
  QuickActions,
  MiniPieChart,
  type QuickAction,
  type PieDataItem,
} from './components';

// ============ Types ============

interface DashboardStats {
  goals: {
    total: number;
    active: number;
    completed: number;
    paused: number;
    overdue: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  schedules: {
    total: number;
    active: number;
    paused: number;
    todayCount: number;
  };
  reminders: {
    total: number;
    enabled: number;
    todayCount: number;
  };
}

// ============ Constants ============

const AUTO_REFRESH_INTERVAL = 60000; // 1 minute

// ============ Component ============

export function DashboardView() {
  const navigate = useNavigate();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Data lists
  const [activeGoals, setActiveGoals] = useState<GoalClientDTO[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskTemplateClientDTO[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<ScheduleTaskClientDTO[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderTemplateClientDTO[]>([]);

  // ============ Data Loading ============

  // Get empty stats
  const getEmptyStats = useCallback((): DashboardStats => {
    return {
      goals: { total: 0, active: 0, completed: 0, paused: 0, overdue: 0 },
      tasks: { total: 0, pending: 0, inProgress: 0, completed: 0 },
      schedules: { total: 0, active: 0, paused: 0, todayCount: 0 },
      reminders: { total: 0, enabled: 0, todayCount: 0 },
    };
  }, []);

  // Load goal stats
  const loadGoalStats = useCallback(async () => {
    const goalApiClient = GoalContainer.getInstance().getApiClient();
    const goalsResponse = await goalApiClient.getGoals();
    const goals = goalsResponse.goals;

    const goalStats = {
      total: goals.length,
      active: goals.filter((g: GoalClientDTO) => g.status === GoalStatus.ACTIVE).length,
      completed: goals.filter((g: GoalClientDTO) => g.status === GoalStatus.COMPLETED)
        .length,
      paused: 0, // Goal 没有 PAUSED 状态，使用 DRAFT 代替
      overdue: goals.filter((g: GoalClientDTO) => g.isOverdue).length,
    };

    const activeGoalsList = goals
      .filter((g: GoalClientDTO) => g.status === GoalStatus.ACTIVE)
      .slice(0, 5);

    return { stats: goalStats, activeGoals: activeGoalsList };
  }, []);

  // Load task stats
  const loadTaskStats = useCallback(async () => {
    const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();
    const tasks = await taskApiClient.getTaskTemplates();

    const taskStats = {
      total: tasks.length,
      pending: 0, // TaskTemplate 没有 PENDING，使用 PAUSED 替代
      inProgress: tasks.filter(
        (t: TaskTemplateClientDTO) => t.status === TaskTemplateStatus.ACTIVE,
      ).length,
      completed: tasks.filter(
        (t: TaskTemplateClientDTO) => t.status === TaskTemplateStatus.ARCHIVED,
      ).length,
    };

    const todayTasksList = tasks
      .filter((t: TaskTemplateClientDTO) => t.status === TaskTemplateStatus.ACTIVE)
      .slice(0, 5);

    return { stats: taskStats, todayTasks: todayTasksList };
  }, []);

  // Load schedule stats
  const loadScheduleStats = useCallback(async () => {
    try {
      const scheduleApiClient =
        ScheduleContainer.getInstance().getTaskApiClient();
      const schedules = await scheduleApiClient.getTasks();

      const scheduleStats = {
        total: schedules.length,
        active: schedules.filter(
          (s: ScheduleTaskClientDTO) => s.status === ScheduleTaskStatus.ACTIVE,
        ).length,
        paused: schedules.filter(
          (s: ScheduleTaskClientDTO) => s.status === ScheduleTaskStatus.PAUSED,
        ).length,
        todayCount: schedules.filter(
          (s: ScheduleTaskClientDTO) => s.status === ScheduleTaskStatus.ACTIVE,
        ).length, // 简化：活跃任务作为今日任务
      };

      const todaySchedulesList = schedules
        .filter((s: ScheduleTaskClientDTO) => s.status === ScheduleTaskStatus.ACTIVE)
        .slice(0, 5);

      return { stats: scheduleStats, todaySchedules: todaySchedulesList };
    } catch (error) {
      console.warn('[DashboardView] Schedule module not available:', error);
      return {
        stats: { total: 0, active: 0, paused: 0, todayCount: 0 },
        todaySchedules: [],
      };
    }
  }, []);

  // Load reminder stats
  const loadReminderStats = useCallback(async () => {
    try {
      const reminderApiClient = ReminderContainer.getInstance().getApiClient();
      const response = await reminderApiClient.getReminderTemplates();
      const reminders = response.templates;

      const reminderStats = {
        total: reminders.length,
        enabled: reminders.filter(
          (r: ReminderTemplateClientDTO) => r.effectiveEnabled,
        ).length,
        todayCount: reminders.filter(
          (r: ReminderTemplateClientDTO) => r.nextTriggerAt != null,
        ).length,
      };

      // 获取即将触发的提醒
      const upcomingRemindersList = reminders
        .filter(
          (r: ReminderTemplateClientDTO) =>
            r.effectiveEnabled && r.nextTriggerAt != null,
        )
        .sort(
          (a: ReminderTemplateClientDTO, b: ReminderTemplateClientDTO) =>
            (a.nextTriggerAt || 0) - (b.nextTriggerAt || 0),
        )
        .slice(0, 5);

      return { stats: reminderStats, upcomingReminders: upcomingRemindersList };
    } catch (error) {
      console.warn('[DashboardView] Reminder module not available:', error);
      return {
        stats: { total: 0, enabled: 0, todayCount: 0 },
        upcomingReminders: [],
      };
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      // 并行加载所有数据
      const [goalsData, tasksData, schedulesData, remindersData] =
        await Promise.allSettled([
          loadGoalStats(),
          loadTaskStats(),
          loadScheduleStats(),
          loadReminderStats(),
        ]);

      // 处理目标数据
      if (goalsData.status === 'fulfilled') {
        const { stats: goalStats, activeGoals: goals } = goalsData.value;
        setStats((prev) => ({ ...(prev || getEmptyStats()), goals: goalStats }));
        setActiveGoals(goals);
      }

      // 处理任务数据
      if (tasksData.status === 'fulfilled') {
        const { stats: taskStats, todayTasks: tasks } = tasksData.value;
        setStats((prev) => ({ ...(prev || getEmptyStats()), tasks: taskStats }));
        setTodayTasks(tasks);
      }

      // 处理日程数据
      if (schedulesData.status === 'fulfilled') {
        const { stats: scheduleStats, todaySchedules: schedules } =
          schedulesData.value;
        setStats((prev) => ({
          ...(prev || getEmptyStats()),
          schedules: scheduleStats,
        }));
        setTodaySchedules(schedules);
      }

      // 处理提醒数据
      if (remindersData.status === 'fulfilled') {
        const { stats: reminderStats, upcomingReminders: reminders } =
          remindersData.value;
        setStats((prev) => ({
          ...(prev || getEmptyStats()),
          reminders: reminderStats,
        }));
        setUpcomingReminders(reminders);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('[DashboardView] Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, [loadGoalStats, loadTaskStats, loadScheduleStats, loadReminderStats, getEmptyStats]);

  // ============ Auto Refresh ============

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (autoRefreshEnabled) {
      refreshIntervalRef.current = setInterval(() => {
        loadStats();
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, loadStats]);

  // ============ Quick Actions ============

  const quickActions: QuickAction[] = [
    {
      id: 'new-goal',
      label: '新建目标',
      icon: '🎯',
      variant: 'primary',
      onClick: () => navigate('/goals'),
    },
    {
      id: 'new-task',
      label: '新建任务',
      icon: '✅',
      variant: 'secondary',
      onClick: () => navigate('/tasks'),
    },
    {
      id: 'new-schedule',
      label: '新建日程',
      icon: '📅',
      variant: 'outline',
      onClick: () => navigate('/schedules'),
    },
    {
      id: 'new-reminder',
      label: '新建提醒',
      icon: '⏰',
      variant: 'outline',
      onClick: () => navigate('/reminders'),
    },
  ];

  // ============ Chart Data ============

  const goalStatusData: PieDataItem[] = stats
    ? [
        { label: '进行中', value: stats.goals.active, color: '#22c55e' },
        { label: '已完成', value: stats.goals.completed, color: '#3b82f6' },
        { label: '已暂停', value: stats.goals.paused, color: '#eab308' },
      ].filter((d) => d.value > 0)
    : [];

  const taskStatusData: PieDataItem[] = stats
    ? [
        { label: '待处理', value: stats.tasks.pending, color: '#f59e0b' },
        { label: '进行中', value: stats.tasks.inProgress, color: '#3b82f6' },
        { label: '已完成', value: stats.tasks.completed, color: '#22c55e' },
      ].filter((d) => d.value > 0)
    : [];

  // ============ Render ============

  // 使用骨架屏替代简单的加载提示
  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 自动刷新开关 */}
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="rounded"
            />
            自动刷新
          </label>
          {/* 刷新按钮 */}
          <button
            onClick={loadStats}
            disabled={loading}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            title="刷新数据"
          >
            {loading ? '⏳' : '🔄'} 刷新
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-muted-foreground">
          最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="目标"
          value={stats?.goals.active || 0}
          suffix="个进行中"
          icon="🎯"
          trend={stats?.goals.overdue ? 'down' : 'stable'}
          trendValue={
            stats?.goals.overdue ? `${stats.goals.overdue} 逾期` : undefined
          }
          onClick={() => navigate('/goals')}
          loading={loading}
        />
        <StatCard
          title="任务"
          value={stats?.tasks.pending || 0}
          suffix="待处理"
          icon="✅"
          onClick={() => navigate('/tasks')}
          loading={loading}
        />
        <StatCard
          title="日程"
          value={stats?.schedules.todayCount || 0}
          suffix="今日"
          icon="📅"
          onClick={() => navigate('/schedules')}
          loading={loading}
        />
        <StatCard
          title="提醒"
          value={stats?.reminders.enabled || 0}
          suffix="已启用"
          icon="⏰"
          onClick={() => navigate('/reminders')}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} layout="horizontal" />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Goal Progress */}
          <GoalProgressList
            goals={activeGoals}
            loading={loading}
            onViewAll={() => navigate('/goals')}
            onGoalClick={() => navigate('/goals')}
            maxItems={5}
          />

          {/* Goal Status Chart */}
          {goalStatusData.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <span>📊</span>
                <span>目标状态分布</span>
              </h3>
              <MiniPieChart
                data={goalStatusData}
                size={80}
                showLegend={true}
                innerRadius={0.5}
                loading={loading}
              />
            </div>
          )}

          {/* Today Tasks */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span>✅</span>
                <span>今日任务</span>
              </h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-primary hover:underline"
              >
                查看全部 →
              </button>
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div
                    key={task.uuid}
                    className="p-2 rounded-md border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm line-clamp-1">
                        {task.displayTitle || task.title}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          task.importance === ImportanceLevel.Vital
                            ? 'bg-red-100 text-red-700'
                            : task.importance === ImportanceLevel.Important
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {task.importanceText || task.importance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm">暂无活跃任务</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today Schedule */}
          <TodaySchedule
            schedules={todaySchedules}
            loading={loading}
            onViewAll={() => navigate('/schedules')}
            onScheduleClick={() => navigate('/schedules')}
            maxItems={5}
          />

          {/* Upcoming Reminders */}
          <UpcomingReminders
            reminders={upcomingReminders}
            loading={loading}
            onViewAll={() => navigate('/reminders')}
            onReminderClick={() => navigate('/reminders')}
            maxItems={5}
          />

          {/* Task Status Chart */}
          {taskStatusData.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <span>📈</span>
                <span>任务状态分布</span>
              </h3>
              <MiniPieChart
                data={taskStatusData}
                size={80}
                showLegend={true}
                innerRadius={0.5}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <p>DailyUse Desktop - 基于 Electron + React + shadcn/ui</p>
      </div>
    </div>
  );
}

export default DashboardView;
