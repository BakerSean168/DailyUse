/**
 * Schedule Card Component
 *
 * 调度任务卡片组件 - 显示单个调度任务信息
 */

import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';

interface ScheduleCardProps {
  task: ScheduleTaskClientDTO;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function ScheduleCard({
  task,
  onPause,
  onResume,
  onComplete,
  onDelete,
}: ScheduleCardProps) {
  const isActive = task.status === ScheduleTaskStatus.ACTIVE;
  const isPaused = task.status === ScheduleTaskStatus.PAUSED;
  const isCompleted = task.status === ScheduleTaskStatus.COMPLETED;

  const getStatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      [ScheduleTaskStatus.ACTIVE]: { bg: 'bg-green-100', text: 'text-green-700', label: '活跃' },
      [ScheduleTaskStatus.PAUSED]: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '暂停' },
      [ScheduleTaskStatus.COMPLETED]: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已完成' },
      [ScheduleTaskStatus.CANCELLED]: { bg: 'bg-gray-100', text: 'text-gray-700', label: '已取消' },
      [ScheduleTaskStatus.FAILED]: { bg: 'bg-red-100', text: 'text-red-700', label: '失败' },
    };
    const config = statusConfig[task.status] || statusConfig[ScheduleTaskStatus.ACTIVE];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {task.statusDisplay || config.label}
      </span>
    );
  };

  const getSourceIcon = () => {
    switch (task.sourceModule) {
      case SourceModule.REMINDER:
        return '🔔';
      case SourceModule.TASK:
        return '✅';
      case SourceModule.GOAL:
        return '🎯';
      default:
        return '📅';
    }
  };

  const getHealthIcon = () => {
    switch (task.healthStatus) {
      case 'healthy':
        return '💚';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🔴';
      default:
        return '';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 bg-card hover:shadow-md transition-shadow ${
        task.isOverdue ? 'border-red-300 bg-red-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div className="flex-1 space-y-2">
          {/* Title Row */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{getSourceIcon()}</span>
            <h3 className="text-lg font-semibold">{task.name}</h3>
            {getStatusBadge()}
            {task.isOverdue && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                已过期
              </span>
            )}
            {getHealthIcon() && <span>{getHealthIcon()}</span>}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}

          {/* Schedule Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {task.schedule.cronExpression && (
              <div className="flex items-center gap-1">
                <span>⏰</span>
                <span>{task.schedule.cronDescription || task.schedule.cronExpression}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span>🔄</span>
              <span>{task.executionSummary}</span>
            </div>
          </div>

          {/* Next Run */}
          <div className="flex items-center gap-4 text-sm">
            {task.execution.nextRunAt && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">下次运行:</span>
                <span className="font-medium">
                  {task.execution.nextRunAtFormatted || task.nextRunAtFormatted}
                </span>
              </div>
            )}
            {task.execution.lastRunAt && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">上次运行:</span>
                <span className="font-medium">
                  {task.execution.lastRunAtFormatted || task.lastRunAtFormatted}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.metadata.tags && task.metadata.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {task.metadata.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isActive && (
            <button
              onClick={onPause}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary transition-colors"
              title="暂停"
            >
              ⏸️ 暂停
            </button>
          )}
          {isPaused && (
            <button
              onClick={onResume}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary transition-colors"
              title="恢复"
            >
              ▶️ 恢复
            </button>
          )}
          {!isCompleted && (
            <button
              onClick={onComplete}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-green-100 transition-colors"
              title="完成"
            >
              ✅ 完成
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm border rounded-md text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
