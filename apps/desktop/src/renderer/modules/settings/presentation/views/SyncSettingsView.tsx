/**
 * Sync Settings View
 * 
 * EPIC-004: Offline Sync - STORY-022 UI 集成
 * 
 * 同步设置页面 - 设备管理、冲突历史、同步配置
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useConflicts, type ConflictRecord, type MergeResult } from '../hooks/useConflicts';
import { ConflictResolverDialog } from '../components/ConflictResolverDialog';

export function SyncSettingsView() {
  const {
    status,
    pendingCount,
    lastSyncAt,
    lastError,
    unresolvedConflicts,
    isOnline,
    deviceId,
    deviceName,
    stats,
    triggerSync,
    forceSync,
    isLoading: isSyncLoading,
    refresh: refreshSync,
  } = useSyncStatus();

  const {
    conflicts,
    resolveWithLocal,
    resolveWithServer,
    resolveManually,
    isLoading: isConflictsLoading,
    refresh: refreshConflicts,
  } = useConflicts();

  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);

  // 格式化时间
  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return '从未';
    return format(timestamp, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
  };

  // 处理冲突解决
  const handleResolve = (result: MergeResult) => {
    console.log('Conflict resolved:', result);
    refreshConflicts();
    refreshSync();
  };

  const isLoading = isSyncLoading || isConflictsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">同步设置</h1>

      {/* 同步状态卡片 */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>☁️</span> 同步状态
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">状态</div>
            <div className="text-lg font-medium flex items-center gap-2">
              {status === 'syncing' && <span className="animate-spin">🔄</span>}
              {status === 'idle' && <span className="text-green-500">✓</span>}
              {status === 'error' && <span className="text-red-500">⚠️</span>}
              {status === 'offline' && <span className="text-gray-400">📴</span>}
              {status === 'syncing' ? '同步中' : 
               status === 'idle' ? '已同步' :
               status === 'error' ? '错误' : '离线'}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">待同步</div>
            <div className="text-lg font-medium">{pendingCount} 项</div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">未解决冲突</div>
            <div className={`text-lg font-medium ${unresolvedConflicts > 0 ? 'text-red-500' : ''}`}>
              {unresolvedConflicts} 个
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">网络</div>
            <div className="text-lg font-medium">
              {isOnline ? (
                <span className="text-green-500">在线</span>
              ) : (
                <span className="text-gray-400">离线</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            上次同步: {formatTime(lastSyncAt)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refreshSync()}
              disabled={isLoading}
              className="px-3 py-1 text-sm rounded-md bg-muted hover:bg-muted/80"
            >
              刷新
            </button>
            <button
              onClick={() => triggerSync()}
              disabled={status === 'syncing' || !isOnline}
              className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              立即同步
            </button>
          </div>
        </div>

        {lastError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md p-3 text-sm">
            错误: {lastError}
          </div>
        )}
      </div>

      {/* 设备信息 */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>💻</span> 当前设备
        </h2>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="font-medium">{deviceName}</div>
            <div className="text-sm text-muted-foreground">
              ID: {deviceId.substring(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* 未解决的冲突 */}
      {conflicts.length > 0 && (
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>⚡</span> 待解决冲突 ({conflicts.length})
          </h2>

          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div>
                  <div className="font-medium">
                    {conflict.entityType} - {conflict.entityId.substring(0, 8)}...
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {conflict.conflictingFields.length} 个冲突字段 • 
                    {format(new Date(conflict.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConflict(conflict)}
                  className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  解决
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 同步统计 */}
      {stats && (
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>📊</span> 同步统计
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">总变更</div>
              <div className="font-medium">{stats.totalChanges}</div>
            </div>
            <div>
              <div className="text-muted-foreground">已同步</div>
              <div className="font-medium text-green-500">{stats.syncedChanges}</div>
            </div>
            <div>
              <div className="text-muted-foreground">待同步</div>
              <div className="font-medium text-yellow-500">{stats.pendingChanges}</div>
            </div>
            <div>
              <div className="text-muted-foreground">失败</div>
              <div className="font-medium text-red-500">{stats.failedChanges}</div>
            </div>
          </div>
        </div>
      )}

      {/* 冲突解决对话框 */}
      {selectedConflict && (
        <ConflictResolverDialog
          conflict={selectedConflict}
          isOpen={!!selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onResolve={handleResolve}
          onResolveWithLocal={resolveWithLocal}
          onResolveWithServer={resolveWithServer}
          onResolveManually={resolveManually}
        />
      )}
    </div>
  );
}

export default SyncSettingsView;
