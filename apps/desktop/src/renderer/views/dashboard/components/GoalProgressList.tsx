/**
 * GoalProgressList Component
 *
 * 目标进度列表组件
 * Story-007: Dashboard UI
 */

import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export interface GoalProgressListProps {
  /** 目标列表 */
  goals: GoalClientDTO[];
  /** 加载状态 */
  loading?: boolean;
  /** 点击查看全部 */
  onViewAll?: () => void;
  /** 点击单个目标 */
  onGoalClick?: (goal: GoalClientDTO) => void;
  /** 最大显示数量 */
  maxItems?: number;
}

/**
 * 获取进度条颜色
 */
function getProgressColor(percentage: number) {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-blue-500';
  if (percentage >= 25) return 'bg-yellow-500';
  return 'bg-gray-400';
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
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function GoalProgressList({
  goals,
  loading = false,
  onViewAll,
  onGoalClick,
  maxItems = 5,
}: GoalProgressListProps) {
  const displayGoals = goals.slice(0, maxItems);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-40 bg-muted rounded mb-2" />
              <div className="h-2 w-full bg-muted rounded" />
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
          <span>🎯</span>
          <span>目标进度</span>
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

      {/* 目标列表 */}
      {displayGoals.length > 0 ? (
        <div className="space-y-3">
          {displayGoals.map((goal) => {
            const percentage = goal.overallProgress || 0;
            return (
              <div
                key={goal.uuid}
                className="p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onGoalClick?.(goal)}
              >
                {/* 标题行 */}
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm line-clamp-1 flex-1">
                    {goal.title}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ml-2 ${getStatusStyle(goal.status)}`}
                  >
                    {goal.statusText || '进行中'}
                  </span>
                </div>

                {/* 进度条 */}
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                {/* 进度文字 */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {goal.timeProgressText || `进度 ${percentage}%`}
                  </span>
                  {goal.daysRemaining != null && goal.daysRemaining > 0 && (
                    <span className="text-xs text-muted-foreground">
                      剩余 {goal.daysRemaining} 天
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-sm">暂无活跃目标</p>
        </div>
      )}

      {/* 更多提示 */}
      {goals.length > maxItems && (
        <div className="mt-3 pt-3 border-t text-center">
          <span className="text-xs text-muted-foreground">
            还有 {goals.length - maxItems} 个目标
          </span>
        </div>
      )}
    </div>
  );
}

export default GoalProgressList;
