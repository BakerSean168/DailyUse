/**
 * Goal List View
 *
 * 目标列表视图 - 显示所有目标及其状态
 */

import { useState, useEffect, useCallback } from 'react';
import { GoalContainer } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { GoalCard } from './components/GoalCard';
import { GoalCreateDialog } from './components/GoalCreateDialog';

export function GoalListView() {
  const [goals, setGoals] = useState<GoalClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // 获取目标列表服务
  const listGoalsService = GoalContainer.getInstance().getListGoalsService();

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listGoalsService.execute({
        // 默认获取所有活跃目标
        status: undefined,
        includeArchived: false,
      });
      setGoals(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载目标失败');
      console.error('[GoalListView] Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  }, [listGoalsService]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleGoalCreated = () => {
    setShowCreateDialog(false);
    loadGoals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
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
          <p className="text-muted-foreground">
            共 {goals.length} 个目标
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + 新建目标
        </button>
      </div>

      {/* Goal List */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 border rounded-lg bg-card">
          <div className="text-4xl">🎯</div>
          <div className="text-muted-foreground">还没有目标，创建第一个吧！</div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            创建目标
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
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
    </div>
  );
}

export default GoalListView;
