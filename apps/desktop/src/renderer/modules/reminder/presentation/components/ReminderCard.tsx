/**
 * Reminder Card Component
 *
 * 提醒卡片组件 - 显示单个提醒模板信息
 */

import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ReminderType } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

interface ReminderCardProps {
  template: ReminderTemplateClientDTO;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function ReminderCard({
  template,
  onToggle,
  onDelete,
  onEdit,
}: ReminderCardProps) {
  const getStatusBadge = () => {
    if (template.effectiveEnabled) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          活跃
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        暂停
      </span>
    );
  };

  const getTypeIcon = () => {
    switch (template.type) {
      case ReminderType.ONE_TIME:
        return '⏰';
      case ReminderType.RECURRING:
        return '🔄';
      default:
        return '🔔';
    }
  };

  const getImportanceColor = () => {
    switch (template.importanceLevel) {
      case ImportanceLevel.Vital:
      case ImportanceLevel.Important:
        return 'border-red-300';
      case ImportanceLevel.Moderate:
        return 'border-yellow-300';
      case ImportanceLevel.Minor:
      case ImportanceLevel.Trivial:
        return 'border-gray-300';
      default:
        return '';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 bg-card hover:shadow-md transition-shadow ${getImportanceColor()}`}
      style={template.color ? { borderLeftColor: template.color, borderLeftWidth: 4 } : undefined}
    >
      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div className="flex-1 space-y-2">
          {/* Title Row */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{template.icon || getTypeIcon()}</span>
            <h3 className="text-lg font-semibold">{template.displayTitle || template.title}</h3>
            {getStatusBadge()}
            {template.controlledByGroup && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                分组控制
              </span>
            )}
          </div>

          {/* Description */}
          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}

          {/* Trigger Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>{template.typeText || template.type}</span>
            </div>
            {template.triggerText && (
              <div className="flex items-center gap-1">
                <span>⏰</span>
                <span>{template.triggerText}</span>
              </div>
            )}
            {template.recurrenceText && (
              <div className="flex items-center gap-1">
                <span>🔄</span>
                <span>{template.recurrenceText}</span>
              </div>
            )}
          </div>

          {/* Next Trigger */}
          <div className="flex items-center gap-4 text-sm">
            {template.nextTriggerText && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">下次触发:</span>
                <span className="font-medium">{template.nextTriggerText}</span>
              </div>
            )}
            {template.lastTriggeredText && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">上次触发:</span>
                <span className="font-medium">{template.lastTriggeredText}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          {template.stats && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{template.stats.totalTriggersText || `触发 ${template.stats.totalTriggers || 0} 次`}</span>
              {template.stats.lastTriggeredText && (
                <span>上次: {template.stats.lastTriggeredText}</span>
              )}
            </div>
          )}

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {template.tags.map((tag, idx) => (
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
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-secondary transition-colors"
            title="编辑"
          >
            ✏️ 编辑
          </button>
          <button
            onClick={onToggle}
            className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
              template.effectiveEnabled
                ? 'hover:bg-yellow-100'
                : 'hover:bg-green-100'
            }`}
            title={template.effectiveEnabled ? '暂停' : '启用'}
          >
            {template.effectiveEnabled ? '⏸️ 暂停' : '▶️ 启用'}
          </button>
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
