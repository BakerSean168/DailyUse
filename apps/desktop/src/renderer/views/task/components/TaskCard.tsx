/**
 * Task Card Component
 *
 * 显示单个任务模板的卡片
 */

import { useState } from 'react';
import { TaskContainer } from '@dailyuse/infrastructure-client';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

interface TaskCardProps {
  template: TaskTemplateClientDTO;
  onUpdate: () => void;
}

export function TaskCard({ template, onUpdate }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // 获取服务
  const activateService = TaskContainer.getInstance().getActivateTemplateService();
  const pauseService = TaskContainer.getInstance().getPauseTemplateService();
  const archiveService = TaskContainer.getInstance().getArchiveTemplateService();

  const handleActivate = async () => {
    try {
      setIsUpdating(true);
      await activateService.execute({ templateUuid: template.uuid });
      onUpdate();
    } catch (err) {
      console.error('[TaskCard] Failed to activate:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsUpdating(true);
      await pauseService.execute({ templateUuid: template.uuid });
      onUpdate();
    } catch (err) {
      console.error('[TaskCard] Failed to pause:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsUpdating(true);
      await archiveService.execute({ templateUuid: template.uuid });
      onUpdate();
    } catch (err) {
      console.error('[TaskCard] Failed to archive:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // 状态颜色映射 (TaskTemplateStatus: ACTIVE, PAUSED, ARCHIVED, DELETED)
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-gray-100 text-gray-600',
    DELETED: 'bg-red-100 text-red-600',
  };

  // 重要性颜色
  const importanceColors: Record<string, string> = {
    LOW: 'text-gray-500',
    MEDIUM: 'text-blue-500',
    HIGH: 'text-orange-500',
    CRITICAL: 'text-red-500',
  };

  return (
    <div
      className={`
        rounded-lg border bg-card p-4 space-y-3 transition-all
        hover:shadow-md hover:border-primary/50
        ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{template.title}</h3>
          {template.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[template.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {template.statusText ?? template.status}
        </span>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {template.importance && (
          <span className={importanceColors[template.importance] ?? 'text-gray-500'}>
            重要性: {template.importanceText ?? template.importance}
          </span>
        )}
        {template.estimatedMinutes && (
          <span>
            预计: {template.estimatedMinutes}分钟
          </span>
        )}
      </div>

      {/* Recurrence Info */}
      {template.recurrenceRule && (
        <div className="text-sm text-muted-foreground">
          🔄 重复任务
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        {template.status === 'ACTIVE' && (
          <>
            <button
              onClick={handlePause}
              className="flex-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              暂停
            </button>
            <button
              onClick={handleArchive}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              归档
            </button>
          </>
        )}
        {template.status === 'PAUSED' && (
          <button
            onClick={handleActivate}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            激活
          </button>
        )}
        {template.status === 'ARCHIVED' && (
          <button
            onClick={handleActivate}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            恢复
          </button>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
