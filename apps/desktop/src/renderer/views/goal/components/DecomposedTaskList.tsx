/**
 * Decomposed Task List Component
 *
 * 显示已分解的任务列表，支持依赖关系可视化
 */

import { useMemo } from 'react';
import type { DecomposedTask } from '@dailyuse/contracts/goal';

export interface DecomposedTaskListProps {
  tasks: DecomposedTask[];
  onTaskSelect?: (task: DecomposedTask, index: number) => void;
  selectedIndexes?: Set<number>;
}

export function DecomposedTaskList({
  tasks,
  onTaskSelect,
  selectedIndexes = new Set(),
}: DecomposedTaskListProps) {
  /**
   * 计算任务的依赖关系树
   */
  const taskGraph = useMemo(() => {
    const graph = new Map<string, DecomposedTask[]>();
    tasks.forEach((task) => {
      if (!graph.has(task.title)) {
        graph.set(task.title, []);
      }
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((dep) => {
          if (!graph.has(dep)) {
            graph.set(dep, []);
          }
          graph.get(dep)?.push(task);
        });
      }
    });
    return graph;
  }, [tasks]);

  /**
   * 排序任务 (按执行顺序)
   */
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.suggestedOrder - b.suggestedOrder);
  }, [tasks]);

  /**
   * 计算总时间统计
   */
  const stats = useMemo(() => {
    const totalMinutes = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
    const complexityCounts = {
      simple: tasks.filter((t) => t.complexity === 'simple').length,
      medium: tasks.filter((t) => t.complexity === 'medium').length,
      complex: tasks.filter((t) => t.complexity === 'complex').length,
    };

    return {
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      totalDays: Math.ceil(totalMinutes / (8 * 60)),
      complexityCounts,
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-600">没有分解的任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="总任务数"
          value={tasks.length}
          icon="📋"
        />
        <StatCard
          label="总工时"
          value={`${stats.totalHours}h`}
          icon="⏱️"
        />
        <StatCard
          label="预计天数"
          value={stats.totalDays}
          icon="📅"
          subtitle="(每天8小时)"
        />
        <StatCard
          label="平均复杂度"
          value={getAverageComplexity(stats.complexityCounts)}
          icon="📊"
        />
      </div>

      {/* Complexity Distribution */}
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="mb-3 font-semibold text-gray-900">任务复杂度分布</p>
        <div className="space-y-2">
          <ComplexityBar
            label="简单"
            count={stats.complexityCounts.simple}
            total={tasks.length}
            color="bg-green-500"
          />
          <ComplexityBar
            label="中等"
            count={stats.complexityCounts.medium}
            total={tasks.length}
            color="bg-yellow-500"
          />
          <ComplexityBar
            label="复杂"
            count={stats.complexityCounts.complex}
            total={tasks.length}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Task Timeline */}
      <div className="space-y-2">
        <p className="font-semibold text-gray-900">任务时间线</p>
        <div className="space-y-2 rounded-lg border border-gray-200 p-4">
          {sortedTasks.map((task, index) => (
            <TaskCard
              key={`${task.title}-${index}``}
              task={task}
              index={index}
              isSelected={selectedIndexes.has(index)}
              onSelect={() => onTaskSelect?.(task, index)}
              dependentTasks={taskGraph.get(task.title) || []}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 text-center">
      <p className="text-2xl">{icon}</p>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

/**
 * Complexity Bar Component
 */
function ComplexityBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {count} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Task Card Component
 */
function TaskCard({
  task,
  index,
  isSelected,
  onSelect,
  dependentTasks,
}: {
  task: DecomposedTask;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  dependentTasks: DecomposedTask[];
}) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block h-6 w-6 rounded-full bg-gray-200 text-center text-xs font-bold text-gray-700">
              {task.suggestedOrder}
            </span>
            <p className="font-semibold text-gray-900">{task.title}</p>
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded ${getComplexityColor(
                task.complexity
              )}`}
            >
              {getComplexityLabel(task.complexity)}
            </span>
          </div>

          {task.description && (
            <p className="mt-1 text-sm text-gray-600">{task.description}</p>
          )}

          {/* Meta Info */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{task.estimatedMinutes}分钟</span>
            </span>

            {task.dependencies && task.dependencies.length > 0 && (
              <span className="flex items-center gap-1">
                <span>🔗</span>
                <span>{task.dependencies.join(', ')}</span>
              </span>
            )}

            {dependentTasks.length > 0 && (
              <span className="flex items-center gap-1">
                <span>⛓️</span>
                <span>{dependentTasks.length}个后续任务</span>
              </span>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        <div className="ml-2 mt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="h-4 w-4 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: Get complexity color
 */
function getComplexityColor(complexity: string): string {
  switch (complexity) {
    case 'simple':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'complex':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Helper: Get complexity label
 */
function getComplexityLabel(complexity: string): string {
  switch (complexity) {
    case 'simple':
      return '简单';
    case 'medium':
      return '中等';
    case 'complex':
      return '复杂';
    default:
      return '未知';
  }
}

/**
 * Helper: Get average complexity
 */
function getAverageComplexity(counts: {
  simple: number;
  medium: number;
  complex: number;
}): string {
  const total = counts.simple + counts.medium + counts.complex;
  if (total === 0) return '无';

  const score = (counts.simple * 1 + counts.medium * 2 + counts.complex * 3) / total;

  if (score < 1.5) return '简单';
  if (score < 2.5) return '中等';
  return '复杂';
}
