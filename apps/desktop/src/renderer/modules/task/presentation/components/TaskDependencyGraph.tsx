/**
 * Task Dependency Graph Component
 *
 * 任务依赖关系可视化组件
 * 使用简单的 CSS 网格布局展示任务依赖链
 * 
 * EPIC-015 重构: 使用 Entity 类型
 * - Props 接受 TaskTemplate Entity 数组
 * 
 * TODO: 当前 TaskTemplate Entity 不包含 parentTaskUuid 属性
 * 需要重新设计依赖关系模型或使用 TaskDependency 专用 API
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TaskTemplate } from '@dailyuse/domain-client/task';

interface TaskDependencyGraphProps {
  tasks: TaskTemplate[];
  onTaskClick?: (task: TaskTemplate) => void;
}

interface DependencyNode {
  task: TaskTemplate;
  level: number;
  dependencies: string[];
  dependents: string[];
}

export function TaskDependencyGraph({ tasks, onTaskClick }: TaskDependencyGraphProps) {
  // 构建依赖图
  const dependencyNodes = useMemo(() => {
    const nodes: Map<string, DependencyNode> = new Map();

    // 初始化所有节点
    tasks.forEach(task => {
      nodes.set(task.uuid, {
        task,
        level: 0,
        dependencies: [], // 前置任务
        dependents: [],   // 后续任务
      });
    });

    // TODO: TaskTemplate Entity 不包含 parentTaskUuid，暂时跳过依赖解析
    // 解析依赖关系（从 parentTaskUuid 推断）
    // tasks.forEach(task => {
    //   if (task.parentTaskUuid) {
    //     const parentNode = nodes.get(task.parentTaskUuid);
    //     const currentNode = nodes.get(task.uuid);
    //     if (parentNode && currentNode) {
    //       currentNode.dependencies.push(task.parentTaskUuid);
    //       parentNode.dependents.push(task.uuid);
    //     }
    //   }
    // });

    // 计算层级（拓扑排序）
    const calculateLevels = () => {
      const visited = new Set<string>();
      const levels = new Map<string, number>();

      const dfs = (uuid: string, level: number): number => {
        if (visited.has(uuid)) return levels.get(uuid) ?? 0;
        visited.add(uuid);

        const node = nodes.get(uuid);
        if (!node) return level;

        let maxDependencyLevel = -1;
        for (const depUuid of node.dependencies) {
          const depLevel = dfs(depUuid, level);
          maxDependencyLevel = Math.max(maxDependencyLevel, depLevel);
        }

        const myLevel = maxDependencyLevel + 1;
        levels.set(uuid, myLevel);
        node.level = myLevel;
        return myLevel;
      };

      nodes.forEach((_, uuid) => dfs(uuid, 0));
    };

    calculateLevels();

    return nodes;
  }, [tasks]);

  // 按层级分组
  const levelGroups = useMemo(() => {
    const groups: Map<number, DependencyNode[]> = new Map();
    
    dependencyNodes.forEach(node => {
      const level = node.level;
      if (!groups.has(level)) {
        groups.set(level, []);
      }
      groups.get(level)!.push(node);
    });

    // 转换为数组并排序
    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, nodes]) => ({ level, nodes }));
  }, [dependencyNodes]);

  // 状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'border-blue-500 bg-blue-50';
      case 'PAUSED': return 'border-yellow-500 bg-yellow-50';
      case 'ARCHIVED': return 'border-gray-400 bg-gray-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  // 检查任务是否被阻塞
  // TODO: TaskTemplate Entity 不包含 isBlocked 和 completedAt 属性
  const isBlocked = (node: DependencyNode) => {
    // 暂时返回 false，因为缺少依赖关系数据
    return false;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        没有任务数据
      </div>
    );
  }

  // 检查是否有依赖关系
  const hasDependencies = Array.from(dependencyNodes.values()).some(
    node => node.dependencies.length > 0 || node.dependents.length > 0
  );

  if (!hasDependencies) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4 text-muted-foreground border rounded-md">
          <div className="text-lg mb-2">📋 所有任务独立</div>
          <div className="text-sm">当前任务之间没有依赖关系</div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => (
            <div
              key={task.uuid}
              onClick={() => onTaskClick?.(task)}
              className={`
                p-3 border-2 rounded-lg cursor-pointer transition-all
                hover:shadow-md ${getStatusColor(task.status)}
              `}
            >
              <div className="font-medium truncate">{task.title}</div>
              <div className="text-sm text-muted-foreground">
                {task.taskTypeText} · {task.statusText}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 图例 */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
          <span>活跃</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-50 rounded"></div>
          <span>暂停</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 bg-gray-50 rounded"></div>
          <span>归档</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 bg-red-50 rounded"></div>
          <span>被阻塞</span>
        </div>
      </div>

      {/* 依赖层级视图 */}
      <div className="space-y-4">
        {levelGroups.map(({ level, nodes }) => (
          <div key={level} className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              层级 {level + 1} ({nodes.length} 个任务)
            </div>
            <div className="flex flex-wrap gap-3">
              {nodes.map(node => (
                <div
                  key={node.task.uuid}
                  onClick={() => onTaskClick?.(node.task)}
                  className={`
                    p-3 border-2 rounded-lg cursor-pointer transition-all min-w-[200px]
                    hover:shadow-md
                    ${isBlocked(node) ? 'border-red-500 bg-red-50' : getStatusColor(node.task.status)}
                  `}
                >
                  <div className="font-medium truncate">{node.task.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {node.task.taskTypeText} · {node.task.statusText}
                  </div>
                  {node.dependencies.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      ⬆️ 依赖 {node.dependencies.length} 个任务
                    </div>
                  )}
                  {node.dependents.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      ⬇️ 被 {node.dependents.length} 个任务依赖
                    </div>
                  )}
                  {isBlocked(node) && (
                    <div className="text-xs text-red-600 mt-1">
                      🚫 被阻塞
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 连接线说明 */}
      <div className="text-sm text-muted-foreground border-t pt-4">
        <strong>说明：</strong> 任务按依赖层级排列，层级 1 的任务没有前置依赖，
        层级越高表示依赖链越深。被阻塞的任务显示为红色边框。
      </div>
    </div>
  );
}

export default TaskDependencyGraph;
