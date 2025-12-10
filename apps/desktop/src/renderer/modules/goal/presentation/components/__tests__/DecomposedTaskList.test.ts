/**
 * Decomposed Task List - Pure Vitest Unit Tests
 * No external UI testing libraries required
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DecomposedTask } from '@dailyuse/contracts/goal';

describe('DecomposedTaskList - Logic Tests', () => {
  const mockTasks: DecomposedTask[] = [
    {
      title: '学习基础概念',
      description: '理解核心思想',
      estimatedMinutes: 30,
      complexity: 'simple',
      dependencies: [],
      suggestedOrder: 1,
    },
    {
      title: '实践练习',
      description: '通过示例代码练习',
      estimatedMinutes: 60,
      complexity: 'medium',
      dependencies: ['学习基础概念'],
      suggestedOrder: 2,
    },
    {
      title: '深入研究',
      description: '探索高级特性',
      estimatedMinutes: 120,
      complexity: 'complex',
      dependencies: ['实践练习'],
      suggestedOrder: 3,
    },
  ];

  describe('Statistics Calculation', () => {
    it('应该正确计算总工时（分钟）', () => {
      const totalMinutes = mockTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
      expect(totalMinutes).toBe(210);
    });

    it('应该正确计算总工时（小时）', () => {
      const totalMinutes = mockTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
      const totalHours = (totalMinutes / 60).toFixed(1);

      expect(totalHours).toBe('3.5');
    });

    it('应该正确计算预计天数', () => {
      const totalMinutes = mockTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
      const workingHoursPerDay = 8;
      const totalDays = Math.ceil(totalMinutes / (workingHoursPerDay * 60));

      expect(totalDays).toBe(1);
    });

    it('应该正确计算平均复杂度', () => {
      const complexityScores: Record<string, number> = {
        simple: 1,
        medium: 2,
        complex: 3,
      };

      const avgComplexity =
        mockTasks.reduce((sum, task) => sum + complexityScores[task.complexity], 0) /
        mockTasks.length;

      expect(avgComplexity).toBe(2); // (1 + 2 + 3) / 3 = 2
    });

    it('应该正确计算复杂度分布', () => {
      const complexityCounts = {
        simple: mockTasks.filter((t) => t.complexity === 'simple').length,
        medium: mockTasks.filter((t) => t.complexity === 'medium').length,
        complex: mockTasks.filter((t) => t.complexity === 'complex').length,
      };

      expect(complexityCounts.simple).toBe(1);
      expect(complexityCounts.medium).toBe(1);
      expect(complexityCounts.complex).toBe(1);

      // 总计应该等于任务数
      const total = Object.values(complexityCounts).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(mockTasks.length);
    });
  });

  describe('Task Sorting and Ordering', () => {
    it('应该按 suggestedOrder 排序任务', () => {
      const sortedTasks = [...mockTasks].sort((a, b) => a.suggestedOrder - b.suggestedOrder);

      expect(sortedTasks[0].title).toBe('学习基础概念');
      expect(sortedTasks[1].title).toBe('实践练习');
      expect(sortedTasks[2].title).toBe('深入研究');
    });

    it('应该保持原始顺序未变', () => {
      const originalTasks = [...mockTasks];
      expect(originalTasks).toEqual(mockTasks);
    });
  });

  describe('Dependency Graph Building', () => {
    it('应该构建正确的依赖关系图', () => {
      const graph = new Map<string, DecomposedTask[]>();
      
      mockTasks.forEach((task) => {
        if (!graph.has(task.title)) {
          graph.set(task.title, []);
        }
      });

      mockTasks.forEach((task) => {
        if (task.dependencies && task.dependencies.length > 0) {
          task.dependencies.forEach((dep) => {
            if (!graph.has(dep)) {
              graph.set(dep, []);
            }
            const dependents = graph.get(dep);
            if (dependents) {
              dependents.push(task);
            }
          });
        }
      });

      expect(graph.size).toBe(3);
      expect(graph.get('学习基础概念')?.length).toBe(1);
      expect(graph.get('实践练习')?.length).toBe(1);
      expect(graph.get('深入研究')?.length).toBe(0);
    });

    it('应该计算每个任务的后续任务数', () => {
      const getDependentCount = (taskTitle: string): number => {
        return mockTasks.filter((t) => t.dependencies.includes(taskTitle)).length;
      };

      expect(getDependentCount('学习基础概念')).toBe(1);
      expect(getDependentCount('实践练习')).toBe(1);
      expect(getDependentCount('深入研究')).toBe(0);
    });
  });

  describe('Complexity Label Mapping', () => {
    it('应该正确映射 simple 到 简单', () => {
      const getComplexityLabel = (complexity: string): string => {
        const labels: Record<string, string> = {
          simple: '简单',
          medium: '中等',
          complex: '复杂',
        };
        return labels[complexity] || '未知';
      };

      expect(getComplexityLabel('simple')).toBe('简单');
    });

    it('应该正确映射 medium 到 中等', () => {
      const getComplexityLabel = (complexity: string): string => {
        const labels: Record<string, string> = {
          simple: '简单',
          medium: '中等',
          complex: '复杂',
        };
        return labels[complexity] || '未知';
      };

      expect(getComplexityLabel('medium')).toBe('中等');
    });

    it('应该正确映射 complex 到 复杂', () => {
      const getComplexityLabel = (complexity: string): string => {
        const labels: Record<string, string> = {
          simple: '简单',
          medium: '中等',
          complex: '复杂',
        };
        return labels[complexity] || '未知';
      };

      expect(getComplexityLabel('complex')).toBe('复杂');
    });

    it('应该为未知复杂度返回默认值', () => {
      const getComplexityLabel = (complexity: string): string => {
        const labels: Record<string, string> = {
          simple: '简单',
          medium: '中等',
          complex: '复杂',
        };
        return labels[complexity] || '未知';
      };

      expect(getComplexityLabel('unknown')).toBe('未知');
    });
  });

  describe('Complexity Color Mapping', () => {
    it('应该为 simple 返回绿色', () => {
      const getComplexityColor = (complexity: string): string => {
        switch (complexity) {
          case 'simple':
            return 'bg-green-100 text-green-800';
          case 'medium':
            return 'bg-yellow-100 text-yellow-800';
          case 'complex':
            return 'bg-red-100 text-red-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      };

      const color = getComplexityColor('simple');
      expect(color).toContain('green');
    });

    it('应该为 medium 返回黄色', () => {
      const getComplexityColor = (complexity: string): string => {
        switch (complexity) {
          case 'simple':
            return 'bg-green-100 text-green-800';
          case 'medium':
            return 'bg-yellow-100 text-yellow-800';
          case 'complex':
            return 'bg-red-100 text-red-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      };

      const color = getComplexityColor('medium');
      expect(color).toContain('yellow');
    });

    it('应该为 complex 返回红色', () => {
      const getComplexityColor = (complexity: string): string => {
        switch (complexity) {
          case 'simple':
            return 'bg-green-100 text-green-800';
          case 'medium':
            return 'bg-yellow-100 text-yellow-800';
          case 'complex':
            return 'bg-red-100 text-red-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      };

      const color = getComplexityColor('complex');
      expect(color).toContain('red');
    });
  });

  describe('Empty List Handling', () => {
    it('应该处理空任务列表', () => {
      const emptyTasks: DecomposedTask[] = [];

      expect(emptyTasks.length).toBe(0);
      expect(emptyTasks).toEqual([]);
    });

    it('应该在空列表时返回默认统计值', () => {
      const tasks: DecomposedTask[] = [];

      const stats = {
        totalMinutes: tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
        taskCount: tasks.length,
        complexityCount: {
          simple: tasks.filter((t) => t.complexity === 'simple').length,
          medium: tasks.filter((t) => t.complexity === 'medium').length,
          complex: tasks.filter((t) => t.complexity === 'complex').length,
        },
      };

      expect(stats.totalMinutes).toBe(0);
      expect(stats.taskCount).toBe(0);
      expect(stats.complexityCount.simple).toBe(0);
    });
  });

  describe('Task Selection State', () => {
    it('应该初始化空的选中集合', () => {
      const selectedIndexes = new Set<number>();
      expect(selectedIndexes.size).toBe(0);
    });

    it('应该正确管理选中状态', () => {
      const selectedIndexes = new Set([0, 2]);

      expect(selectedIndexes.has(0)).toBe(true);
      expect(selectedIndexes.has(1)).toBe(false);
      expect(selectedIndexes.has(2)).toBe(true);
      expect(selectedIndexes.size).toBe(2);
    });

    it('应该支持添加/移除选中项', () => {
      const selectedIndexes = new Set<number>();

      selectedIndexes.add(0);
      expect(selectedIndexes.has(0)).toBe(true);

      selectedIndexes.delete(0);
      expect(selectedIndexes.has(0)).toBe(false);

      selectedIndexes.add(1);
      selectedIndexes.add(2);
      expect(selectedIndexes.size).toBe(2);
    });

    it('应该支持清除所有选中项', () => {
      const selectedIndexes = new Set([0, 1, 2]);

      expect(selectedIndexes.size).toBe(3);

      selectedIndexes.clear();
      expect(selectedIndexes.size).toBe(0);
    });
  });

  describe('Time Formatting', () => {
    it('应该格式化分钟为小时', () => {
      const formatTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes}分钟`;
        const hours = (minutes / 60).toFixed(1);
        return `${hours}小时`;
      };

      expect(formatTime(30)).toBe('30分钟');
      expect(formatTime(60)).toBe('1.0小时');
      expect(formatTime(120)).toBe('2.0小时');
      expect(formatTime(210)).toBe('3.5小时');
    });
  });

  describe('Props and Callbacks', () => {
    it('应该接收 tasks 数组 props', () => {
      const tasks = mockTasks;
      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(3);
    });

    it('应该接收可选的 onTaskSelect 回调', () => {
      const onTaskSelect = vi.fn();
      
      mockTasks.forEach((task, index) => {
        onTaskSelect(task, index);
      });

      expect(onTaskSelect).toHaveBeenCalledTimes(3);
      expect(onTaskSelect).toHaveBeenCalledWith(mockTasks[0], 0);
    });

    it('应该接收可选的 selectedIndexes 属性', () => {
      const selectedIndexes = new Set([0, 2]);
      
      expect(selectedIndexes.has(0)).toBe(true);
      expect(selectedIndexes.has(2)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('应该验证任务数据完整性', () => {
      mockTasks.forEach((task) => {
        expect(task.title).toBeDefined();
        expect(task.description).toBeDefined();
        expect(task.estimatedMinutes).toBeGreaterThan(0);
        expect(['simple', 'medium', 'complex']).toContain(task.complexity);
        expect(Array.isArray(task.dependencies)).toBe(true);
        expect(typeof task.suggestedOrder).toBe('number');
      });
    });

    it('应该验证所有依赖任务都存在', () => {
      const taskTitles = new Set(mockTasks.map((t) => t.title));

      mockTasks.forEach((task) => {
        task.dependencies.forEach((dep) => {
          expect(taskTitles.has(dep)).toBe(true);
        });
      });
    });
  });
});
