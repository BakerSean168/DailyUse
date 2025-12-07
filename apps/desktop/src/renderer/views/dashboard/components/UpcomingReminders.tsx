/**
 * UpcomingReminders Component
 *
 * 即将到来的提醒列表组件
 * Story-007: Dashboard UI
 */

import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

export interface UpcomingRemindersProps {
  /** 提醒模板列表 */
  reminders: ReminderTemplateClientDTO[];
  /** 加载状态 */
  loading?: boolean;
  /** 点击查看全部 */
  onViewAll?: () => void;
  /** 点击单个提醒 */
  onReminderClick?: (reminder: ReminderTemplateClientDTO) => void;
  /** 最大显示数量 */
  maxItems?: number;
}

/**
 * 获取重要性颜色
 */
function getImportanceStyle(importance: string) {
  switch (importance) {
    case 'Vital':
    case 'VITAL':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Important':
    case 'IMPORTANT':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Moderate':
    case 'MODERATE':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function UpcomingReminders({
  reminders,
  loading = false,
  onViewAll,
  onReminderClick,
  maxItems = 5,
}: UpcomingRemindersProps) {
  const displayReminders = reminders.slice(0, maxItems);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 w-28 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-muted rounded mb-1" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* 标题 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span>⏰</span>
          <span>即将提醒</span>
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:underline"
          >
            查看全部 →
          </button>
        )}
      </div>

      {/* 提醒列表 */}
      {displayReminders.length > 0 ? (
        <div className="space-y-2">
          {displayReminders.map((reminder) => (
            <div
              key={reminder.uuid}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onReminderClick?.(reminder)}
            >
              {/* 图标 */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{
                  backgroundColor: reminder.color
                    ? `${reminder.color}20`
                    : undefined,
                }}
              >
                {reminder.icon || '🔔'}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {reminder.displayTitle || reminder.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {reminder.nextTriggerText || reminder.triggerText}
                  </span>
                </div>
              </div>

              {/* 重要性标签 */}
              <span
                className={`text-xs px-1.5 py-0.5 rounded border ${getImportanceStyle(reminder.importanceLevel)}`}
              >
                {reminder.importanceText}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <div className="text-2xl mb-2">⏰</div>
          <p className="text-sm">暂无即将到来的提醒</p>
        </div>
      )}

      {/* 更多提示 */}
      {reminders.length > maxItems && (
        <div className="mt-3 pt-3 border-t text-center">
          <span className="text-xs text-muted-foreground">
            还有 {reminders.length - maxItems} 个提醒
          </span>
        </div>
      )}
    </div>
  );
}

export default UpcomingReminders;
