/**
 * Goal List View
 *
 * 目标列表视图 - 显示所有目标及其状态
 */

import { useState, useEffect, useCallback } from 'react';
import { GoalContainer } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO, GoalFolderClientDTO } from '@dailyuse/contracts/goal';
import { GoalCard } from './components/GoalCard';
import { GoalCreateDialog } from './components/GoalCreateDialog';
import { GoalFolderManager } from './components/GoalFolderManager';
import { GoalListSkeleton } from '../../components/Skeleton';
import { VirtualList } from '../../components/VirtualList';

export function GoalListView() {
  const [goals, setGoals] = useState<GoalClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<GoalFolderClientDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  // 视图模式: grid(网格) / list(列表，支持虚拟滚动)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 获取 API Client
  const goalApiClient = GoalContainer.getInstance().getApiClient();

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await goalApiClient.getGoals({
        folderUuid: selectedFolder?.uuid,
      });
      setGoals(result.goals);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载目标失败');
      console.error('[GoalListView] Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  }, [goalApiClient, selectedFolder]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleGoalCreated = () => {
    setShowCreateDialog(false);
    loadGoals();
  };

  // 过滤目标
  const filteredGoals = goals.filter((goal) => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = goal.title.toLowerCase().includes(query);
      const matchesDesc = goal.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDesc) return false;
    }
    // 状态过滤
    if (statusFilter !== 'ALL' && goal.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // 使用骨架屏替代简单的加载提示
  if (loading) {
    return <GoalListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive">{error}</div>
        <button
          onClick={loadGoals}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">我的目标</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button
              onClick={() => setShowFolderManager(true)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              📁 {selectedFolder ? selectedFolder.name : '全部目标'}
              <span className="text-xs">▼</span>
            </button>
            <span>·</span>
            <span>共 {goals.length} 个目标</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFolderManager(true)}
            className="px-4 py-2 border rounded-md hover:bg-secondary"
            title="管理文件夹"
          >
            📂 文件夹
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            + 新建目标
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 搜索目标..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background"
        >
          <option value="ALL">全部状态</option>
          <option value="ACTIVE">🟢 进行中</option>
          <option value="COMPLETED">✅ 已完成</option>
          <option value="ARCHIVED">📦 已归档</option>
          <option value="DRAFT">📝 草稿</option>
        </select>
        {/* 视图模式切换 */}
        <div className="flex border rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'}`}
            title="网格视图"
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'}`}
            title="列表视图（大数据量时更流畅）"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Goal List */}
      {filteredGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 border rounded-lg bg-card">
          <div className="text-4xl">🎯</div>
          <div className="text-muted-foreground">
            {searchQuery || statusFilter !== 'ALL'
              ? '没有找到匹配的目标'
              : '还没有目标，创建第一个吧！'}
          </div>
          {!searchQuery && statusFilter === 'ALL' && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              创建目标
            </button>
          )}
          {(searchQuery || statusFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
              className="px-4 py-2 border rounded-md hover:bg-secondary"
            >
              清除筛选
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* 列表视图 - 使用虚拟滚动优化大数据量 */
        <VirtualList
          items={filteredGoals}
          renderItem={(goal) => (
            <GoalCard
              goal={goal}
              onUpdate={loadGoals}
            />
          )}
          getItemKey={(goal) => goal.uuid}
          estimateSize={140}
          threshold={30}
          height="calc(100vh - 280px)"
          className="border rounded-lg"
          renderEmpty={() => null}
        />
      ) : (
        /* 网格视图 */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.uuid}
              goal={goal}
              onUpdate={loadGoals}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <GoalCreateDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleGoalCreated}
        />
      )}

      {/* Folder Manager */}
      <GoalFolderManager
        open={showFolderManager}
        onClose={() => setShowFolderManager(false)}
        onFolderSelect={setSelectedFolder}
        selectedFolderUuid={selectedFolder?.uuid ?? null}
      />
    </div>
  );
}

export default GoalListView;
