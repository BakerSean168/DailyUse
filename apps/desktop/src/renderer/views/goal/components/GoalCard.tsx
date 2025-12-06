/**
 * Goal Card Component
 *
 * 显示单个目标的卡片组件
 */

import { useState } from 'react';
import { GoalContainer } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

interface GoalCardProps {
  goal: GoalClientDTO;
  onUpdate: () => void;
}

export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // 获取 API Client
  const goalApiClient = GoalContainer.getInstance().getApiClient();

  const handleComplete = async () => {
    try {
      setIsUpdating(true);
      await goalApiClient.completeGoal(goal.uuid);
      onUpdate();
    } catch (err) {
      console.error('[GoalCard] Failed to complete goal:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsUpdating(true);
      await goalApiClient.archiveGoal(goal.uuid);
      onUpdate();
    } catch (err) {
      console.error('[GoalCard] Failed to archive goal:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivate = async () => {
    try {
      setIsUpdating(true);
      await goalApiClient.activateGoal(goal.uuid);
      onUpdate();
    } catch (err) {
      console.error('[GoalCard] Failed to activate goal:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // 状态颜色映射
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-yellow-100 text-yellow-800',
  };

  // 重要性颜色
  const importanceColors: Record<string, string> = {
    LOW: 'text-gray-500',
    MEDIUM: 'text-blue-500',
    HIGH: 'text-orange-500',
    CRITICAL: 'text-red-500',
  };

  // 计算进度 (overallProgress 是 0-100 的百分比)
  const progress = goal.overallProgress ?? 0;

  return (
    <div
      className={`
        rounded-lg border bg-card p-4 space-y-3 transition-all
        hover:shadow-md hover:border-primary/50
        ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
      `}
      style={{ borderLeftColor: goal.color ?? undefined, borderLeftWidth: goal.color ? '4px' : undefined }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {goal.description}
            </p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[goal.status] ?? statusColors.DRAFT}`}>
          {goal.status}
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">进度</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {goal.importance && (
          <span className={importanceColors[goal.importance]}>
            重要性: {goal.importanceText ?? goal.importance}
          </span>
        )}
        {goal.targetDate && (
          <span>
            截止: {new Date(goal.targetDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Key Results Count */}
      {goal.keyResults && goal.keyResults.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {goal.keyResults.length} 个关键结果
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        {goal.status === 'ACTIVE' && (
          <>
            <button
              onClick={handleComplete}
              className="flex-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              完成
            </button>
            <button
              onClick={handleArchive}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              归档
            </button>
          </>
        )}
        {goal.status === 'ARCHIVED' && (
          <button
            onClick={handleActivate}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            重新激活
          </button>
        )}
        {goal.status === 'COMPLETED' && (
          <div className="flex-1 text-center text-sm text-green-600">
            ✓ 已完成
          </div>
        )}
      </div>
    </div>
  );
}

export default GoalCard;
