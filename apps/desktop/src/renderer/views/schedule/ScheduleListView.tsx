/**
 * Schedule List View
 *
 * 调度任务列表视图 - 显示所有定时任务和提醒
 */

import { useState, useEffect, useCallback } from 'react';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import { ScheduleCard } from './components/ScheduleCard';
import { ScheduleCreateDialog } from './components/ScheduleCreateDialog';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { ScheduleEditDialog } from './components/ScheduleEditDialog';

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'ALL' | ScheduleTaskStatus;

export function ScheduleListView() {
  const [tasks, setTasks] = useState<ScheduleTaskClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTaskClientDTO | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  // 获取调度任务 API Client
  const scheduleApiClient = ScheduleContainer.getInstance().getTaskApiClient();

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await scheduleApiClient.getTasks();
      setTasks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载调度任务失败');
      console.error('[ScheduleListView] Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [scheduleApiClient]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskCreated = () => {
    setShowCreateDialog(false);
    loadTasks();
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const handlePauseTask = async (taskUuid: string) => {
    try {
      await scheduleApiClient.pauseTask(taskUuid);
      loadTasks();
    } catch (err) {
      console.error('[ScheduleListView] Failed to pause task:', err);
    }
  };

  const handleResumeTask = async (taskUuid: string) => {
    try {
      await scheduleApiClient.resumeTask(taskUuid);
      loadTasks();
    } catch (err) {
      console.error('[ScheduleListView] Failed to resume task:', err);
    }
  };

  const handleCompleteTask = async (taskUuid: string) => {
    try {
      await scheduleApiClient.completeTask(taskUuid);
      loadTasks();
    } catch (err) {
      console.error('[ScheduleListView] Failed to complete task:', err);
    }
  };

  const handleDeleteTask = async (taskUuid: string) => {
    try {
      await scheduleApiClient.deleteTask(taskUuid);
      loadTasks();
    } catch (err) {
      console.error('[ScheduleListView] Failed to delete task:', err);
    }
  };

  // 过滤任务
  const filteredTasks = tasks.filter((task) => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = task.name.toLowerCase().includes(query);
      const matchesDesc = task.description?.toLowerCase().includes(query);
      if (!matchesName && !matchesDesc) return false;
    }
    // 状态过滤
    if (statusFilter !== 'ALL' && task.status !== statusFilter) {
      return false;
    }
    // 来源模块过滤
    if (sourceFilter !== 'ALL' && task.sourceModule !== sourceFilter) {
      return false;
    }
    return true;
  });

  // 按下次运行时间排序
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aNext = a.execution.nextRunAt;
    const bNext = b.execution.nextRunAt;
    if (!aNext && !bNext) return 0;
    if (!aNext) return 1;
    if (!bNext) return -1;
    return new Date(aNext).getTime() - new Date(bNext).getTime();
  });

  // 统计信息
  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.status === ScheduleTaskStatus.ACTIVE).length,
    paused: tasks.filter((t) => t.status === ScheduleTaskStatus.PAUSED).length,
    overdue: tasks.filter((t) => t.isOverdue).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive">{error}</div>
        <button
          onClick={loadTasks}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">调度管理</h1>
          <p className="text-muted-foreground">
            共 {stats.total} 个调度任务，{stats.active} 个活跃
            {stats.overdue > 0 && (
              <span className="text-destructive ml-2">
                ⚠️ {stats.overdue} 个已过期
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            + 新建调度
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setViewMode('list')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            viewMode === 'list'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📋 列表视图
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            viewMode === 'calendar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📅 日历视图
        </button>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <ScheduleCalendarView 
          tasks={sortedTasks} 
          onTaskClick={(task) => setEditingTask(task)}
          onTaskDrop={(task, newDate) => {
            // 显示提示 - 由于API限制，拖拽调整时间功能需要后端支持
            console.log(`[ScheduleListView] Task ${task.name} dropped to ${newDate.toISOString()}`);
            alert(`拖拽功能预览：将 "${task.name}" 移动到 ${newDate.toLocaleDateString('zh-CN')}\n\n注意：完整的日期调整功能需要后端 API 支持更新任务调度配置。`);
          }}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Search and Filter Bar */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 搜索调度任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-md bg-background"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="ALL">所有状态</option>
              <option value={ScheduleTaskStatus.ACTIVE}>活跃</option>
              <option value={ScheduleTaskStatus.PAUSED}>暂停</option>
              <option value={ScheduleTaskStatus.COMPLETED}>已完成</option>
              <option value={ScheduleTaskStatus.CANCELLED}>已取消</option>
              <option value={ScheduleTaskStatus.FAILED}>失败</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="ALL">所有模块</option>
              <option value="REMINDER">提醒</option>
              <option value="TASK">任务</option>
              <option value="GOAL">目标</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">总调度数</div>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">活跃</div>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
              <div className="text-sm text-muted-foreground">暂停中</div>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">已过期</div>
            </div>
          </div>

          {/* Task List */}
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-muted-foreground">暂无调度任务</div>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4 px-4 py-2 text-primary hover:underline"
              >
                创建第一个调度任务
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTasks.map((task) => (
                <ScheduleCard
                  key={task.uuid}
                  task={task}
                  onPause={() => handlePauseTask(task.uuid)}
                  onResume={() => handleResumeTask(task.uuid)}
                  onComplete={() => handleCompleteTask(task.uuid)}
                  onDelete={() => handleDeleteTask(task.uuid)}
                  onEdit={() => setEditingTask(task)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <ScheduleCreateDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {/* Edit Dialog */}
      {editingTask && (
        <ScheduleEditDialog
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={() => {
            handleTaskUpdated();
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
