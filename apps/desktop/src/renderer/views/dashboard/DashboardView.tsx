/**
 * Dashboard View
 *
 * 首页仪表盘 - 显示概览信息
 */

import { useState, useEffect, useCallback } from 'react';
import { GoalContainer, TaskContainer } from '@dailyuse/infrastructure-client';
import { useNavigate } from 'react-router-dom';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

interface DashboardStats {
  goals: {
    total: number;
    active: number;
    completed: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

export function DashboardView() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentGoals, setRecentGoals] = useState<GoalClientDTO[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskTemplateClientDTO[]>([]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      // 获取目标统计
      const goalApiClient = GoalContainer.getInstance().getApiClient();
      const goalsResponse = await goalApiClient.getGoals();
      const goals = goalsResponse.goals;

      const goalStats = {
        total: goals.length,
        active: goals.filter((g: { status: string }) => g.status === 'ACTIVE').length,
        completed: goals.filter((g: { status: string }) => g.status === 'COMPLETED').length,
      };

      // 设置最近活跃目标（最多5个）
      const activeGoals = goals
        .filter((g: GoalClientDTO) => g.status === 'ACTIVE')
        .slice(0, 5);
      setRecentGoals(activeGoals);

      // 获取任务统计
      const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();
      const tasks = await taskApiClient.getTaskTemplates();

      const taskStats = {
        total: tasks.length,
        pending: tasks.filter((t: { status: string }) => t.status === 'PENDING').length,
        inProgress: tasks.filter((t: { status: string }) => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter((t: { status: string }) => t.status === 'COMPLETED').length,
      };

      // 设置今日任务（活跃状态，最多5个）
      const activeTasks = tasks
        .filter((t: TaskTemplateClientDTO) => t.status === 'ACTIVE')
        .slice(0, 5);
      setTodayTasks(activeTasks);

      setStats({ goals: goalStats, tasks: taskStats });
    } catch (error) {
      console.error('[DashboardView] Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
        <button
          onClick={loadStats}
          className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
          title="刷新数据"
        >
          🔄 刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 目标统计 */}
        <div
          className="rounded-lg border bg-card p-6 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate('/goals')}
        >
          <h2 className="text-lg font-semibold mb-4">目标概览</h2>
          {stats && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">总数</span>
                <span className="font-medium">{stats.goals.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">进行中</span>
                <span className="font-medium">{stats.goals.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">已完成</span>
                <span className="font-medium">{stats.goals.completed}</span>
              </div>
            </div>
          )}
        </div>

        {/* 任务统计 */}
        <div
          className="rounded-lg border bg-card p-6 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate('/tasks')}
        >
          <h2 className="text-lg font-semibold mb-4">任务概览</h2>
          {stats && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">总数</span>
                <span className="font-medium">{stats.tasks.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">待处理</span>
                <span className="font-medium">{stats.tasks.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">进行中</span>
                <span className="font-medium">{stats.tasks.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">已完成</span>
                <span className="font-medium">{stats.tasks.completed}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/goals')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            + 新建目标
          </button>
          <button
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            + 新建任务
          </button>
        </div>
      </div>

      {/* 活跃目标预览 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">🎯 活跃目标</h2>
            <button
              onClick={() => navigate('/goals')}
              className="text-sm text-primary hover:underline"
            >
              查看全部 →
            </button>
          </div>
          {recentGoals.length > 0 ? (
            <div className="space-y-3">
              {recentGoals.map((goal) => (
                <div
                  key={goal.uuid}
                  className="p-3 rounded-md border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate('/goals')}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm line-clamp-1">{goal.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                      {goal.statusText || '进行中'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress?.percentage || 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    进度: {goal.progress?.percentage || 0}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-3xl mb-2">🎯</div>
              <p>暂无活跃目标</p>
              <button
                onClick={() => navigate('/goals')}
                className="mt-2 text-sm text-primary hover:underline"
              >
                创建第一个目标
              </button>
            </div>
          )}
        </div>

        {/* 今日任务预览 */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">✅ 今日任务</h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-primary hover:underline"
            >
              查看全部 →
            </button>
          </div>
          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.uuid}
                  className="p-3 rounded-md border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate('/tasks')}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm line-clamp-1">{task.displayTitle || task.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.importance === 'Vital' ? 'bg-red-100 text-red-700' :
                      task.importance === 'Important' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {task.importanceText || task.importance}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {task.taskTypeText || (task.taskType === 'RECURRING' ? '重复' : '一次性')}
                    </span>
                    {task.timeDisplayText && (
                      <span className="text-xs text-muted-foreground">
                        · {task.timeDisplayText}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-3xl mb-2">✅</div>
              <p>暂无活跃任务</p>
              <button
                onClick={() => navigate('/tasks')}
                className="mt-2 text-sm text-primary hover:underline"
              >
                创建第一个任务
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 系统信息 */}
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        <p>DailyUse Desktop - 基于 Electron + React + shadcn/ui</p>
      </div>
    </div>
  );
}

export default DashboardView;
