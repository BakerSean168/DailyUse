/**
 * Dashboard View
 *
 * 首页仪表盘 - 显示概览信息
 */

import { useState, useEffect } from 'react';
import { GoalContainer, TaskContainer } from '@dailyuse/infrastructure-client';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // 获取目标统计
      const goalApiClient = GoalContainer.getInstance().getApiClient();
      const goals = await goalApiClient.listAll();

      const goalStats = {
        total: goals.length,
        active: goals.filter((g) => g.status === 'ACTIVE').length,
        completed: goals.filter((g) => g.status === 'COMPLETED').length,
      };

      // 获取任务统计
      const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();
      const tasks = await taskApiClient.listAll();

      const taskStats = {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === 'PENDING').length,
        inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      };

      setStats({ goals: goalStats, tasks: taskStats });
    } catch (error) {
      console.error('[DashboardView] Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground">欢迎使用 DailyUse Desktop</p>
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
            管理目标
          </button>
          <button
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            管理任务
          </button>
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
