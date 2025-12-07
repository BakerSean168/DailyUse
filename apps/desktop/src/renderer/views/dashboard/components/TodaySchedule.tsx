/**
 * TodaySchedule Component
 *
 * 今日日程列表组件
 * Story-007: Dashboard UI
 */

import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';

export interface TodayScheduleProps {
  /** 日程任务列表 */
  schedules: ScheduleTaskClientDTO[];
  /** 加载状态 */
  loading?: boolean;
  /** 点击查看全部 */
  onViewAll?: () => void;
  /** 点击单个日程 */
  onScheduleClick?: (schedule: ScheduleTaskClientDTO) => void;
  /** 最大显示数量 */
  maxItems?: number;
}

/**
 * 获取状态标签样式
 */
function getStatusStyle(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700';
    case 'PAUSED':
      return 'bg-yellow-100 text-yellow-700';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-700';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-700';
    case 'FAILED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * 获取状态显示文本
 */
function getStatusText(status: string) {
  switch (status) {
    case 'ACTIVE':
      return '进行中';
    case 'PAUSED':
      return '已暂停';
    case 'COMPLETED':
      return '已完成';
    case 'CANCELLED':
      return '已取消';
    case 'FAILED':
      return '失败';
    default:
      return status;
  }
}

/**
 * 格式化执行时间
 */
function formatScheduleTime(task: ScheduleTaskClientDTO): string {
  if (task.nextRunAtFormatted) {
    // 从 "2025-10-12 14:30:00" 中提取时间部分
    const parts = task.nextRunAtFormatted.split(' ');
    return parts[1]?.substring(0, 5) || task.nextRunAtFormatted;
  }
  if (task.schedule?.startDateFormatted) {
    return task.schedule.startDateFormatted;
  }
  return '--:--';
}

export function TodaySchedule({
  schedules,
  loading = false,
  onViewAll,
  onScheduleClick,
  maxItems = 5,
}: TodayScheduleProps) {
  const displaySchedules = schedules.slice(0, maxItems);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-8 bg-muted rounded" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-muted rounded mb-1" />
                <div className="h-3 w-20 bg-muted rounded" />
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
          <span>📅</span>
          <span>今日日程</span>
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

      {/* 日程列表 */}
      {displaySchedules.length > 0 ? (
        <div className="space-y-2">
          {displaySchedules.map((schedule) => (
            <div
              key={schedule.uuid}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onScheduleClick?.(schedule)}
            >
              {/* 时间 */}
              <div className="w-14 text-center">
                <span className="text-sm font-medium">
                  {formatScheduleTime(schedule)}
                </span>
              </div>

              {/* 分隔线 */}
              <div className="w-0.5 h-8 bg-primary/30 rounded-full" />

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {schedule.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${getStatusStyle(schedule.status)}`}
                  >
                    {getStatusText(schedule.status)}
                  </span>
                  {schedule.sourceModuleDisplay && (
                    <span className="text-xs text-muted-foreground">
                      {schedule.sourceModuleDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <div className="text-2xl mb-2">📅</div>
          <p className="text-sm">今日暂无日程安排</p>
        </div>
      )}

      {/* 更多提示 */}
      {schedules.length > maxItems && (
        <div className="mt-3 pt-3 border-t text-center">
          <span className="text-xs text-muted-foreground">
            还有 {schedules.length - maxItems} 项日程
          </span>
        </div>
      )}
    </div>
  );
}

export default TodaySchedule;
