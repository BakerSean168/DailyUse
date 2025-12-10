/**
 * Sync Status Indicator Component
 * 
 * Visualizes the current data synchronization state, including online/offline status,
 * sync progress, pending changes, and conflicts.
 * Allows users to manually trigger a sync by clicking.
 * 
 * Part of EPIC-004: Offline Sync - STORY-022 UI Integration.
 *
 * @module renderer/shared/components/SyncStatusIndicator
 */

import { useSyncStatus, type SyncState } from '../hooks/useSyncStatus';

/**
 * Configuration for status icons and colors.
 */
const STATUS_ICONS: Record<SyncState, { icon: string; color: string; label: string }> = {
  idle: { icon: '☁️', color: 'text-green-500', label: '已同步' },
  syncing: { icon: '🔄', color: 'text-blue-500', label: '同步中...' },
  error: { icon: '⚠️', color: 'text-red-500', label: '同步失败' },
  offline: { icon: '📴', color: 'text-gray-400', label: '离线' },
};

/**
 * Props for the SyncStatusIndicator component.
 */
interface SyncStatusIndicatorProps {
  /** Whether to show the text label alongside the icon. Defaults to false. */
  showLabel?: boolean;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Component to display the synchronization status.
 */
export function SyncStatusIndicator({ showLabel = false, className = '' }: SyncStatusIndicatorProps) {
  const {
    status,
    pendingCount,
    unresolvedConflicts,
    lastSyncAt,
    lastError,
    isOnline,
    triggerSync,
    isLoading,
  } = useSyncStatus();

  // Determine display status (override with 'offline' if network is down)
  const displayStatus: SyncState = !isOnline ? 'offline' : status;
  const statusInfo = STATUS_ICONS[displayStatus] || STATUS_ICONS.idle;

  /**
   * Formats the last sync timestamp into a relative string.
   */
  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return '从未同步';
    
    const diff = Date.now() - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  /**
   * Generates the tooltip text based on current state.
   */
  const getTooltipContent = (): string => {
    const lines = [statusInfo.label];
    
    if (pendingCount > 0) {
      lines.push(`待同步: ${pendingCount} 项`);
    }
    
    if (unresolvedConflicts > 0) {
      lines.push(`冲突: ${unresolvedConflicts} 项`);
    }
    
    lines.push(`上次同步: ${formatLastSync(lastSyncAt)}`);
    
    if (lastError) {
      lines.push(`错误: ${lastError}`);
    }
    
    return lines.join('\n');
  };

  const hasConflicts = unresolvedConflicts > 0;

  /**
   * Handles click event to trigger sync manually.
   */
  const handleClick = async () => {
    if (status !== 'syncing' && isOnline) {
      await triggerSync();
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="animate-pulse">⏳</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'syncing' || !isOnline}
      className={`
        relative flex items-center gap-2 px-2 py-1 rounded-md
        hover:bg-muted transition-colors
        disabled:cursor-not-allowed
        ${className}
      `}
      title={getTooltipContent()}
    >
      {/* Status Icon */}
      <span className={`text-lg ${status === 'syncing' ? 'animate-spin' : ''}`}>
        {statusInfo.icon}
      </span>

      {/* Pending Count Badge */}
      {pendingCount > 0 && !hasConflicts && (
        <span className="
          absolute -top-1 -right-1 
          min-w-[18px] h-[18px] 
          flex items-center justify-center
          text-xs font-medium
          bg-yellow-500 text-white rounded-full
          px-1
        ">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}

      {/* Conflict Warning Badge */}
      {hasConflicts && (
        <span className="
          absolute -top-1 -right-1 
          min-w-[18px] h-[18px] 
          flex items-center justify-center
          text-xs font-medium
          bg-red-500 text-white rounded-full
          px-1
        ">
          ⚡{unresolvedConflicts}
        </span>
      )}

      {/* Text Label */}
      {showLabel && (
        <span className={`text-sm ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      )}
    </button>
  );
}

export default SyncStatusIndicator;
