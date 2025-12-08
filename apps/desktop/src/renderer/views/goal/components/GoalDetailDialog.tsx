/**
 * Goal Detail Dialog
 *
 * 目标详情对话框 - 查看、编辑目标和管理关键结果
 */

import { useState, useEffect, useCallback } from 'react';
import { GoalContainer, TaskContainer } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskType } from '@dailyuse/contracts/task';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { TaskDecompositionDialog } from './TaskDecompositionDialog';

interface GoalDetailDialogProps {
  goalUuid: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function GoalDetailDialog({ goalUuid, open, onClose, onUpdated }: GoalDetailDialogProps) {
  const [goal, setGoal] = useState<GoalClientDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑表单状态
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImportance, setEditImportance] = useState<ImportanceLevel>(ImportanceLevel.Moderate);
  const [editUrgency, setEditUrgency] = useState<UrgencyLevel>(UrgencyLevel.Medium);

  // 关联任务
  const [linkedTasks, setLinkedTasks] = useState<TaskTemplateClientDTO[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // 快速创建任务
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // AI 任务分解
  const [showAIDecomposition, setShowAIDecomposition] = useState(false);

  const goalApiClient = GoalContainer.getInstance().getApiClient();
  const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();

  const loadGoal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalApiClient.getGoalById(goalUuid, true);
      setGoal(data);
      // 初始化编辑表单
      setEditTitle(data.title);
      setEditDescription(data.description ?? '');
      setEditImportance(data.importance as ImportanceLevel);
      setEditUrgency(data.urgency as UrgencyLevel);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('[GoalDetailDialog] Failed to load goal:', err);
    } finally {
      setLoading(false);
    }
  }, [goalUuid, goalApiClient]);

  // 加载关联任务
  const loadLinkedTasks = useCallback(async () => {
    if (!goalUuid) return;
    try {
      setLoadingTasks(true);
      const tasks = await taskApiClient.getTaskTemplates({ goalUuid });
      setLinkedTasks(tasks);
    } catch (err) {
      console.error('[GoalDetailDialog] Failed to load linked tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [goalUuid, taskApiClient]);

  useEffect(() => {
    if (open) {
      loadGoal();
      loadLinkedTasks();
    }
  }, [open, loadGoal, loadLinkedTasks]);

  // 快速创建任务（简化版：目前仅提供入口）
  const handleQuickCreateTask = async () => {
    if (!quickTaskTitle.trim() || !goal) return;
    // TODO: 当 Task 服务完全实现后，这里将直接调用 taskApiClient.createTaskTemplate
    // 目前服务层返回 TODO 占位符
    console.log('[GoalDetailDialog] Quick create task for goal:', goal.uuid, quickTaskTitle);
    setError('任务创建服务正在开发中，请使用任务列表页面创建');
    setShowQuickTask(false);
    setQuickTaskTitle('');
  };

  const handleSave = async () => {
    if (!goal) return;

    try {
      setIsSaving(true);
      setError(null);
      await goalApiClient.updateGoal(goal.uuid, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        importance: editImportance,
        urgency: editUrgency,
      });
      setIsEditing(false);
      loadGoal();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      console.error('[GoalDetailDialog] Failed to save goal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;
    if (!confirm(`确定要删除目标「${goal.title}」吗？此操作不可撤销。`)) return;

    try {
      setIsSaving(true);
      await goalApiClient.deleteGoal(goal.uuid);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      console.error('[GoalDetailDialog] Failed to delete goal:', err);
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-yellow-100 text-yellow-800',
  };

  const progress = goal?.overallProgress ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : error && !goal ? (
          <div className="p-8 text-center">
            <div className="text-destructive mb-4">{error}</div>
            <button onClick={onClose} className="px-4 py-2 bg-secondary rounded-md">
              关闭
            </button>
          </div>
        ) : goal ? (
          <>
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between gap-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 text-xl font-bold bg-transparent border-b border-primary focus:outline-none"
                  />
                ) : (
                  <h2 className="text-xl font-bold">{goal.title}</h2>
                )}
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[goal.status]}`}>
                  {goal.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">总体进度</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">描述</label>
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {goal.description || '暂无描述'}
                  </p>
                )}
              </div>

              {/* Properties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">重要性</label>
                  {isEditing ? (
                    <select
                      value={editImportance}
                      onChange={(e) => setEditImportance(e.target.value as ImportanceLevel)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value={ImportanceLevel.Trivial}>无关紧要</option>
                      <option value={ImportanceLevel.Minor}>不太重要</option>
                      <option value={ImportanceLevel.Moderate}>中</option>
                      <option value={ImportanceLevel.Important}>重要</option>
                      <option value={ImportanceLevel.Vital}>极其重要</option>
                    </select>
                  ) : (
                    <div className="text-muted-foreground">{goal.importanceText ?? goal.importance}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">紧急度</label>
                  {isEditing ? (
                    <select
                      value={editUrgency}
                      onChange={(e) => setEditUrgency(e.target.value as UrgencyLevel)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value={UrgencyLevel.None}>无期限</option>
                      <option value={UrgencyLevel.Low}>低</option>
                      <option value={UrgencyLevel.Medium}>中</option>
                      <option value={UrgencyLevel.High}>高</option>
                      <option value={UrgencyLevel.Critical}>紧急</option>
                    </select>
                  ) : (
                    <div className="text-muted-foreground">{goal.urgencyText ?? goal.urgency}</div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">创建时间: </span>
                  {new Date(goal.createdAt).toLocaleString()}
                </div>
                {goal.targetDate && (
                  <div>
                    <span className="text-muted-foreground">目标日期: </span>
                    {new Date(goal.targetDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Key Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">关键结果 ({goal.keyResults?.length ?? 0})</h3>
                </div>
                {goal.keyResults && goal.keyResults.length > 0 ? (
                  <div className="space-y-2">
                    {goal.keyResults.map((kr: KeyResultClientDTO) => (
                      <div
                        key={kr.uuid}
                        className="p-3 border rounded-md bg-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{kr.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {kr.progressText}
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${kr.progressPercentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-md">
                    暂无关键结果
                  </div>
                )}
              </div>

              {/* Linked Tasks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">关联任务 ({linkedTasks.length})</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAIDecomposition(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                      title="使用 AI 智能分解目标为多个任务"
                    >
                      🤖 AI 分解
                    </button>
                    <button
                      onClick={() => setShowQuickTask(!showQuickTask)}
                      className="text-sm text-primary hover:underline"
                    >
                      + 快速创建
                    </button>
                  </div>
                </div>

                {/* Quick Create Form */}
                {showQuickTask && (
                  <div className="flex gap-2 p-3 border rounded-md bg-secondary/30">
                    <input
                      type="text"
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      placeholder="输入任务标题..."
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickCreateTask();
                        if (e.key === 'Escape') setShowQuickTask(false);
                      }}
                    />
                    <button
                      onClick={handleQuickCreateTask}
                      disabled={!quickTaskTitle.trim() || creatingTask}
                      className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
                    >
                      {creatingTask ? '...' : '创建'}
                    </button>
                  </div>
                )}

                {loadingTasks ? (
                  <div className="text-center py-4 text-muted-foreground">加载中...</div>
                ) : linkedTasks.length > 0 ? (
                  <div className="space-y-2">
                    {linkedTasks.map((task) => (
                      <div
                        key={task.uuid}
                        className="p-3 border rounded-md bg-card flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {task.taskTypeText} · {task.statusText}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {task.completedInstanceCount}/{task.instanceCount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-md">
                    暂无关联任务
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex items-center justify-between">
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md"
              >
                删除目标
              </button>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-secondary rounded-md"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !editTitle.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-secondary rounded-md"
                    >
                      关闭
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                    >
                      编辑
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* AI Task Decomposition Dialog */}
      {goal && (
        <TaskDecompositionDialog
          goalId={goal.uuid}
          goalTitle={goal.title}
          goalDescription={goal.description || ''}
          goalDeadline={goal.targetDate}
          open={showAIDecomposition}
          onClose={() => setShowAIDecomposition(false)}
          onTasksCreated={(tasks) => {
            // 刷新任务列表
            loadLinkedTasks();
          }}
        />
      )}
    </div>
  );
}

export default GoalDetailDialog;
