/**
 * StatCard Component
 *
 * 统计卡片组件 - 用于显示仪表盘统计信息
 * Story-007: Dashboard UI
 */

import type { ReactNode } from 'react';

export interface StatCardProps {
  /** 卡片标题 */
  title: string;
  /** 主要数值 */
  value: string | number;
  /** 数值后缀（如 "个"、"%"） */
  suffix?: string;
  /** 子标题或描述 */
  subtitle?: string;
  /** 图标 emoji */
  icon?: string;
  /** 趋势方向 */
  trend?: 'up' | 'down' | 'stable';
  /** 趋势数值 */
  trendValue?: string;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 子内容 */
  children?: ReactNode;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 趋势指示器颜色
 */
const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-500',
};

/**
 * 趋势指示器图标
 */
const trendIcons = {
  up: '↑',
  down: '↓',
  stable: '→',
};

export function StatCard({
  title,
  value,
  suffix,
  subtitle,
  icon,
  trend,
  trendValue,
  onClick,
  className = '',
  children,
  loading = false,
}: StatCardProps) {
  const baseClasses =
    'rounded-lg border bg-card p-4 transition-colors duration-200';
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/30'
    : '';

  if (loading) {
    return (
      <div className={`${baseClasses} ${className} animate-pulse`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="h-8 w-16 bg-muted rounded mb-1" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        {trend && trendValue && (
          <span className={`text-xs ${trendColors[trend]} flex items-center gap-0.5`}>
            {trendIcons[trend]} {trendValue}
          </span>
        )}
      </div>

      {/* 主数值 */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {suffix && (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>

      {/* 副标题 */}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}

      {/* 自定义内容 */}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default StatCard;
