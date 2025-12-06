/**
 * Task List View
 *
 * 任务列表视图 - 显示所有任务模板和实例
 */

import { useState, useEffect, useCallback } from 'react';
import { TaskContainer } from '@dailyuse/infrastructure-client';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskCard } from './components/TaskCard';
import { TaskCreateDialog } from './components/TaskCreateDialog';

export function TaskListView() {
  const [templates, setTemplates] = useState<TaskTemplateClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'today'>('templates');

  // 获取任务模板列表服务
  const listTemplatesService = TaskContainer.getInstance().getListTemplatesService();

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listTemplatesService.execute({});
      setTemplates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载任务失败');
      console.error('[TaskListView] Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [listTemplatesService]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleTaskCreated = () => {
    setShowCreateDialog(false);
    loadTemplates();
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
          onClick={loadTemplates}
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
          <h1 className="text-2xl font-bold">任务管理</h1>
          <p className="text-muted-foreground">
            共 {templates.length} 个任务模板
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + 新建任务
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          任务模板
        </button>
        <button
          onClick={() => setActiveTab('today')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'today'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          今日任务
        </button>
      </div>

      {/* Task List */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 border rounded-lg bg-card">
          <div className="text-4xl">✅</div>
          <div className="text-muted-foreground">还没有任务，创建第一个吧！</div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            创建任务
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TaskCard
              key={template.uuid}
              template={template}
              onUpdate={loadTemplates}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <TaskCreateDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}

export default TaskListView;
