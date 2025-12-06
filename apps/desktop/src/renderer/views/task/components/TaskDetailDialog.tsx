/**
 * Task Detail Dialog
 *
 * 任务模板详情对话框 - 查看、编辑任务模板
 */

import { useState, useEffect, useCallback } from 'react';
import { TaskContainer } from '@dailyuse/infrastructure-client';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';

interface TaskDetailDialogProps {
  templateUuid: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function TaskDetailDialog({ templateUuid, open, onClose, onUpdated }: TaskDetailDialogProps) {
  const [template, setTemplate] = useState<TaskTemplateClientDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑表单状态
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImportance, setEditImportance] = useState<ImportanceLevel>(ImportanceLevel.Moderate);
  const [editUrgency, setEditUrgency] = useState<UrgencyLevel>(UrgencyLevel.Medium);

  // 获取 API Client
  const taskApiClient = TaskContainer.getInstance().getTemplateApiClient();

  const loadTemplate = useCallback(async () => {
    if (!templateUuid || !open) return;

    try {
      setLoading(true);
      setError(null);
      const result = await taskApiClient.getTaskTemplateById(templateUuid);
      setTemplate(result);
      // 初始化编辑表单
      setEditTitle(result.title);
      setEditDescription(result.description ?? '');
      setEditImportance(result.importance);
      setEditUrgency(result.urgency);
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to load template:', err);
      setError('加载任务模板失败');
    } finally {
      setLoading(false);
    }
  }, [templateUuid, open, taskApiClient]);

  useEffect(() => {
    if (open) {
      loadTemplate();
      setIsEditing(false);
    }
  }, [open, loadTemplate]);

  const handleSave = async () => {
    if (!template) return;

    try {
      setIsSaving(true);
      setError(null);
      await taskApiClient.updateTaskTemplate(template.uuid, {
        title: editTitle,
        description: editDescription || undefined,
        importance: editImportance,
        urgency: editUrgency,
      });
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to save template:', err);
      setError('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;

    const confirmed = window.confirm('确定要删除这个任务模板吗？此操作无法撤销。');
    if (!confirmed) return;

    try {
      setIsSaving(true);
      await taskApiClient.deleteTaskTemplate(template.uuid);
      onUpdated();
      onClose();
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to delete template:', err);
      setError('删除失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (template) {
      setEditTitle(template.title);
      setEditDescription(template.description ?? '');
      setEditImportance(template.importance);
      setEditUrgency(template.urgency);
    }
    setIsEditing(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? '编辑任务模板' : '任务模板详情'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !template ? (
            <div className="text-center py-12 text-muted-foreground">
              任务模板不存在
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">标题</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                ) : (
                  <h3 className="text-lg font-semibold">{template.title}</h3>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">描述</label>
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full p-2 border rounded-md resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {template.description || '无描述'}
                  </p>
                )}
              </div>

              {/* Importance & Urgency */}
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
                    <div className="text-muted-foreground">{template.importanceText}</div>
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
                    <div className="text-muted-foreground">{template.urgencyText}</div>
                  )}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium">预计用时</label>
                <div className="text-muted-foreground">
                  {template.estimatedMinutes ? `${template.estimatedMinutes} 分钟` : '未设置'}
                </div>
              </div>

              {/* Task Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">任务类型</label>
                  <div className="text-muted-foreground">{template.taskTypeText}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">状态</label>
                  <div className="text-muted-foreground">{template.statusText}</div>
                </div>
              </div>

              {/* Time Config */}
              {template.timeDisplayText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">时间设置</label>
                  <div className="text-muted-foreground">{template.timeDisplayText}</div>
                </div>
              )}

              {/* Recurrence */}
              {template.recurrenceText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">重复规则</label>
                  <div className="text-muted-foreground">🔄 {template.recurrenceText}</div>
                </div>
              )}

              {/* Reminder */}
              {template.hasReminder && template.reminderText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">提醒</label>
                  <div className="text-muted-foreground">🔔 {template.reminderText}</div>
                </div>
              )}

              {/* Goal Binding */}
              {template.isLinkedToGoal && template.goalLinkText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">关联目标</label>
                  <div className="text-muted-foreground">🎯 {template.goalLinkText}</div>
                </div>
              )}

              {/* Instance Stats */}
              <div className="space-y-2">
                <label className="text-sm font-medium">任务实例统计</label>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-secondary rounded-md">
                    <div className="text-2xl font-bold">{template.instanceCount}</div>
                    <div className="text-sm text-muted-foreground">总实例</div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-md">
                    <div className="text-2xl font-bold text-green-700">{template.completedInstanceCount}</div>
                    <div className="text-sm text-green-600">已完成</div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-md">
                    <div className="text-2xl font-bold text-yellow-700">{template.pendingInstanceCount}</div>
                    <div className="text-sm text-yellow-600">待处理</div>
                  </div>
                </div>
                {template.instanceCount > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">完成率</span>
                      <span className="font-medium">{Math.round(template.completionRate)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${template.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">创建时间: </span>
                  {template.formattedCreatedAt}
                </div>
                <div>
                  <span className="text-muted-foreground">更新时间: </span>
                  {template.formattedUpdatedAt}
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={isSaving || loading || !template}
            className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-50"
          >
            删除模板
          </button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 border rounded-md hover:bg-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editTitle.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border rounded-md hover:bg-secondary"
                >
                  关闭
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={loading || !template}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  编辑
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailDialog;
