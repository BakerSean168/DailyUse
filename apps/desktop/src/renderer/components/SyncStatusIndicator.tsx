/**
 * Sync Status Indicator Component
 * 
 * EPIC-004: Offline Sync - STORY-022 UI 集成
 * 
 * 显示同步状态图标和待同步数量
 */

import { useSyncStatus, type SyncState } from '../hooks/useSyncStatus';

// 状态图标映射
const STATUS_ICONS: Record<SyncState, { icon: string; color: string; label: string }> = {
  idle: { icon: '☁️', color: 'text-green-500', label: '已同步' },
  syncing: { icon: '🔄', color: 'text-blue-500', label: '同步中...' },
  error: { icon: '⚠️', color: 'text-red-500', label: '同步失败' },
  offline: { icon: '📴', color: 'text-gray-400', label: '离线' },
};

interface SyncStatusIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

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

  // 确定显示状态
  const displayStatus: SyncState = !isOnline ? 'offline' : status;
  const statusInfo = STATUS_ICONS[displayStatus];

  // 格式化上次同步时间
  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return '从未同步';
    
    const diff = Date.now() - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  // 生成 Tooltip 内容
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

  // 是否有冲突
  const hasConflicts = unresolvedConflicts > 0;

  // 处理点击
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
      {/* 状态图标 */}
      <span className={`text-lg ${status === 'syncing' ? 'animate-spin' : ''}`}>
        {statusInfo.icon}
      </span>

      {/* 待同步数量 Badge */}
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

      {/* 冲突警告 Badge */}
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

      {/* 文字标签 */}
      {showLabel && (
        <span className={`text-sm ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      )}
    </button>
  );
}

export default SyncStatusIndicator;
