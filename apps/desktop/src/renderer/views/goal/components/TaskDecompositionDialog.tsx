/**
 * Task Decomposition Dialog
 *
 * AI 任务分解对话框 - 使用 AI 将目标分解为子任务
 */

import { useState, useCallback } from 'react';
import type { DecompositionResult, DecomposedTask } from '@dailyuse/contracts/goal';
import { TaskDecompositionService } from '@dailyuse/application-client/goal/services';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskType } from '@dailyuse/contracts/task';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { TaskContainer } from '@dailyuse/infrastructure-client';

export interface TaskDecompositionDialogProps {
  goalId: string;
  goalTitle: string;
  goalDescription: string;
  goalDeadline?: string;
  open: boolean;
  onClose: () => void;
  onTasksCreated?: (tasks: TaskTemplateClientDTO[]) => void;
}

export function TaskDecompositionDialog({
  goalId,
  goalTitle,
  goalDescription,
  goalDeadline,
  open,
  onClose,
  onTasksCreated,
}: TaskDecompositionDialogProps) {
  const [decompositionResult, setDecompositionResult] = useState<DecompositionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<'initial' | 'decomposed' | 'created'>('initial');

  const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();

  /**
   * 执行 AI 分解
   */
  const handleDecompose = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const service = TaskDecompositionService.getInstance();
      const result = await service.decomposeGoal(
        goalId,
        goalTitle,
        goalDescription,
        {
          goalDeadline,
        }
      );

      setDecompositionResult(result);
      // 默认选中所有任务
      setSelectedTasks(new Set(Array.from({ length: result.tasks.length }, (_, i) => i)));
      setStep('decomposed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decompose goal');
    } finally {
      setLoading(false);
    }
  }, [goalId, goalTitle, goalDescription, goalDeadline]);

  /**
   * 创建任务
   */
  const handleCreateTasks = useCallback(async () => {
    if (!decompositionResult) return;

    try {
      setCreating(true);
      setError(null);

      const tasksToCreate: TaskTemplateClientDTO[] = [];

      // 只创建选中的任务
      decompositionResult.tasks.forEach((task, index) => {
        if (selectedTasks.has(index)) {
          const newTask: TaskTemplateClientDTO = {
            uuid: `task-${goalId}-${index}-${Date.now()}`,
            title: task.title,
            description: task.description || '',
            type: TaskType.Subtask,
            importance: mapComplexityToImportance(task.complexity),
            urgency: UrgencyLevel.Medium,
            estimatedMinutes: task.estimatedMinutes,
            createdAt: new Date().toISOString(),
            linkedGoalId: goalId,
            status: 'pending',
          };

          tasksToCreate.push(newTask);
        }
      });

      // 创建任务
      for (const task of tasksToCreate) {
        await taskApiClient.createTask(task);
      }

      setStep('created');
      if (onTasksCreated) {
        onTasksCreated(tasksToCreate);
      }

      // 3秒后关闭对话框
      setTimeout(() => {
        onClose();
        // 重置状态
        setStep('initial');
        setDecompositionResult(null);
        setSelectedTasks(new Set());
        setError(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
    } finally {
      setCreating(false);
    }
  }, [decompositionResult, selectedTasks, goalId, taskApiClient, onTasksCreated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">AI 智能分解</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {step === 'initial' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="font-semibold text-blue-900">目标:</p>
              <p className="text-sm text-blue-700">{goalTitle}</p>
            </div>

            {goalDescription && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-semibold text-gray-700">描述:</p>
                <p className="text-sm text-gray-600">{goalDescription}</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-600">
              点击下方按钮,使用 AI 智能分析目标,自动生成子任务列表。AI 将分析目标的复杂度、时间预估和风险。
            </p>
          </div>
        )}

        {step === 'decomposed' && decompositionResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-purple-50 p-3">
                <p className="text-xs text-purple-600">总任务数</p>
                <p className="text-lg font-bold text-purple-900">
                  {decompositionResult.tasks.length}
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3">
                <p className="text-xs text-orange-600">总工时</p>
                <p className="text-lg font-bold text-orange-900">
                  {decompositionResult.timeline.totalEstimatedHours}h
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-xs text-green-600">置信度</p>
                <p className="text-lg font-bold text-green-900">
                  {Math.round((decompositionResult.confidence || 0.8) * 100)}%
                </p>
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">分解的任务:</p>
              <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-200">
                {decompositionResult.tasks.map((task, index) => (
                  <TaskItem
                    key={index}
                    task={task}
                    index={index}
                    selected={selectedTasks.has(index)}
                    onToggle={(selected) => {
                      const newSelected = new Set(selectedTasks);
                      if (selected) {
                        newSelected.add(index);
                      } else {
                        newSelected.delete(index);
                      }
                      setSelectedTasks(newSelected);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Risks */}
            {decompositionResult.risks && decompositionResult.risks.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">识别的风险:</p>
                <div className="space-y-2">
                  {decompositionResult.risks.map((risk, index) => (
                    <div key={index} className="rounded-lg bg-yellow-50 p-3 text-sm">
                      <p className="font-semibold text-yellow-900">{risk.description}</p>
                      <p className="text-yellow-700">缓解: {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'created' && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✓</div>
            <div>
              <p className="font-semibold text-gray-900">任务创建成功!</p>
              <p className="text-sm text-gray-600">
                已创建 {selectedTasks.size} 个子任务
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            disabled={loading || creating}
          >
            {step === 'created' ? '关闭' : '取消'}
          </button>

          {step === 'initial' && (
            <button
              onClick={handleDecompose}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '正在分解...' : '🤖 AI 分解'}
            </button>
          )}

          {step === 'decomposed' && (
            <button
              onClick={handleCreateTasks}
              disabled={creating || selectedTasks.size === 0}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {creating ? '正在创建...' : `创建 ${selectedTasks.size} 个任务`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Task Item Component
 */
function TaskItem({
  task,
  index,
  selected,
  onToggle,
}: {
  task: DecomposedTask;
  index: number;
  selected: boolean;
  onToggle: (selected: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 p-3 last:border-0">
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 h-4 w-4 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">{task.title}</p>
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${getComplexityColor(
              task.complexity
            )}`}
          >
            {getComplexityLabel(task.complexity)}
          </span>
        </div>
        {task.description && (
          <p className="text-sm text-gray-600">{task.description}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span>⏱️ {task.estimatedMinutes}分钟</span>
          {task.dependencies && task.dependencies.length > 0 && (
            <span>🔗 依赖: {task.dependencies.join(', ')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: Map complexity to importance level
 */
function mapComplexityToImportance(
  complexity: 'simple' | 'medium' | 'complex'
): ImportanceLevel {
  switch (complexity) {
    case 'simple':
      return ImportanceLevel.Low;
    case 'medium':
      return ImportanceLevel.Moderate;
    case 'complex':
      return ImportanceLevel.High;
    default:
      return ImportanceLevel.Moderate;
  }
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
