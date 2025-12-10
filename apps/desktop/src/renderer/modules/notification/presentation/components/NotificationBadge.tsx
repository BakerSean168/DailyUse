/**
 * NotificationBadge Component
 *
 * 通知未读数量徽章
 * Story-010: Notification Module
 */

import { memo } from 'react';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
}

export const NotificationBadge = memo(function NotificationBadge({
  count,
  maxCount = 99,
  className = '',
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-red-500 text-white rounded-full ${className}`}
    >
      {displayCount}
    </span>
  );
});

export default NotificationBadge;
