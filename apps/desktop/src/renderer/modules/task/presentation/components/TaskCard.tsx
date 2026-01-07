/**
 * Task Card Component
 *
 * 显示单个任务模板的卡片
 * 
 * EPIC-015 重构: 使用 Entity 类型和 Hook
 * - Props 接受 TaskTemplate Entity
 * - 使用 useTaskTemplate Hook 进行状态操作
 * - 利用 Entity 的 getter 方法（isActive, isPaused, isArchived）
 */

import { useState } from 'react';
import type { TaskTemplate } from '@dailyuse/domain-client/task';
import { UrgencyLevel } from '@dailyuse/contracts/shared';
import { TaskDetailDialog } from './TaskDetailDialog';
import { useTaskTemplate } from '../hooks/useTaskTemplate';

interface TaskCardProps {
  template: TaskTemplate;
  onUpdate: () => void;
}

export function TaskCard({ template, onUpdate }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // 使用 Hook 进行状态操作
  const { activateTemplate, pauseTemplate, archiveTemplate } = useTaskTemplate();

  const handleActivate = async () => {
    try {
      setIsUpdating(true);
      await activateTemplate(template.uuid);
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
      await pauseTemplate(template.uuid);
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
      await archiveTemplate(template.uuid);
      onUpdate();
    } catch (err) {
      console.error('[TaskCard] Failed to archive:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // 状态颜色映射 - 使用 Entity getter 属性
  const getStatusColorClass = (): string => {
    if (template.isActive) return 'bg-blue-100 text-blue-800';
    if (template.isPaused) return 'bg-yellow-100 text-yellow-800';
    if (template.isArchived) return 'bg-gray-100 text-gray-600';
    return 'bg-red-100 text-red-600'; // DELETED
  };

  // 重要性颜色 (ImportanceLevel: Vital, Important, Moderate, Minor, Trivial)
  const importanceColors: Record<string, string> = {
    Vital: 'text-red-600',
    Important: 'text-orange-500',
    Moderate: 'text-blue-500',
    Minor: 'text-gray-500',
    Trivial: 'text-gray-400',
  };

  // 紧急度颜色 (UrgencyLevel: Critical, High, Medium, Low, None)
  const urgencyColors: Record<string, string> = {
    Critical: 'bg-red-500 text-white',
    High: 'bg-orange-500 text-white',
    Medium: 'bg-yellow-500 text-yellow-900',
    Low: 'bg-blue-100 text-blue-700',
    None: 'bg-gray-100 text-gray-600',
  };

  const handleDetailClose = () => {
    setShowDetail(false);
  };

  const handleDetailUpdate = () => {
    onUpdate();
    setShowDetail(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不打开详情
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setShowDetail(true);
  };

  return (
    <div
      className={`
        rounded-lg border bg-card p-4 space-y-3 transition-all cursor-pointer
        hover:shadow-md hover:border-primary/50
        ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={handleCardClick}
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
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColorClass()}`}>
          {template.statusText ?? template.status}
        </span>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {template.importance && (
          <span className={`${importanceColors[template.importance] ?? 'text-gray-500'}`}>
            ⚡ {template.importanceText ?? template.importance}
          </span>
        )}
        {template.urgency && template.urgency !== UrgencyLevel.None && (
          <span className={`px-1.5 py-0.5 text-xs rounded ${urgencyColors[template.urgency] ?? 'bg-gray-100'}`}>
            🔥 {template.urgencyText ?? template.urgency}
          </span>
        )}
      </div>

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
            >
              #{tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Recurrence Info */}
      {template.recurrenceRule && (
        <div className="text-sm text-muted-foreground">
          🔄 重复任务
        </div>
      )}

      {/* Actions - 使用 Entity 的 getter 属性 */}
      <div className="flex gap-2 pt-2 border-t">
        {template.isActive && (
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
        {template.isPaused && (
          <button
            onClick={handleActivate}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            激活
          </button>
        )}
        {template.isArchived && (
          <button
            onClick={handleActivate}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            恢复
          </button>
        )}
      </div>

      {/* Detail Dialog */}
      <TaskDetailDialog
        templateUuid={template.uuid}
        open={showDetail}
        onClose={handleDetailClose}
        onUpdated={handleDetailUpdate}
      />
    </div>
  );
}

export default TaskCard;
