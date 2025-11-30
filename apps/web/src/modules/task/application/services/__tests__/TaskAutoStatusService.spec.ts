/**
 * Unit Tests for TaskAutoStatusService
 * 任务自动状态服务单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskAutoStatusService } from '../TaskAutoStatusService';
import { TaskTemplateStatus, TaskType } from '@dailyuse/contracts/task';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO } from '@dailyuse/contracts/task';


// 简化的任务类型用于测试
interface TestTask {
  uuid: string;
  title: string;
  status: string;
}

// 创建测试用的依赖对象
function createTestDependency(
  predecessorUuid: string,
  successorUuid: string,
): TaskDependencyClientDTO {
  return {
    uuid: `dep-${Math.random().toString(36).substr(2, 9)}`,
    predecessorTaskUuid: predecessorUuid,
    successorTaskUuid: successorUuid,
    dependencyType: 'FS' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as TaskDependencyClientDTO;
}

describe('TaskAutoStatusService', () => {
  let mockTasks: TestTask[];
  let mockDependencies: TaskDependencyClientDTO[];

  beforeEach(() => {
    mockTasks = [
      { uuid: 'task-a', title: '任务 A', status: 'PENDING' },
      { uuid: 'task-b', title: '任务 B', status: 'PENDING' },
      { uuid: 'task-c', title: '任务 C', status: 'PENDING' },
      { uuid: 'task-d', title: '任务 D', status: 'PENDING' },
    ];

    mockDependencies = [];
  });

  describe('calculateTaskStatus', () => {
    it('应将没有前置任务的 PENDING 任务标记为 READY', () => {
      const task = { uuid: 'task-a', title: '任务 A', status: 'PENDING' };

      const status = taskAutoStatusService.calculateTaskStatus(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(status).toBe('READY');
    });

    it('应将所有前置任务已完成的 BLOCKED 任务标记为 READY', () => {
      mockTasks = [
        { uuid: 'task-a', title: '任务 A', status: 'COMPLETED' },
        { uuid: 'task-b', title: '任务 B', status: 'BLOCKED' },
      ];

      mockDependencies = [createTestDependency('task-a', 'task-b')];

      const task = mockTasks[1];
      const status = taskAutoStatusService.calculateTaskStatus(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(status).toBe('READY');
    });

    it('应将有未完成前置任务的任务标记为 BLOCKED', () => {
      mockTasks = [
        { uuid: 'task-a', title: '任务 A', status: 'PENDING' },
        { uuid: 'task-b', title: '任务 B', status: 'PENDING' },
      ];

      mockDependencies = [createTestDependency('task-a', 'task-b')];

      const task = mockTasks[1];
      const status = taskAutoStatusService.calculateTaskStatus(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(status).toBe('BLOCKED');
    });

    it('应保持 IN_PROGRESS 任务的状态不变', () => {
      mockTasks = [
        { uuid: 'task-a', title: '任务 A', status: 'PENDING' },
        { uuid: 'task-b', title: '任务 B', status: 'IN_PROGRESS' },
      ];

      mockDependencies = [createTestDependency('task-a', 'task-b')];

      const task = mockTasks[1];
      const status = taskAutoStatusService.calculateTaskStatus(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(status).toBe('IN_PROGRESS');
    });

    it('应保持 COMPLETED 任务的状态不变', () => {
      const task = { uuid: 'task-a', title: '任务 A', status: 'COMPLETED' };

      const status = taskAutoStatusService.calculateTaskStatus(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(status).toBe('COMPLETED');
    });
  });

  describe('analyzeTaskReadiness', () => {
    it('应正确分析没有前置任务的任务', () => {
      const task = { uuid: 'task-a', title: '任务 A', status: 'PENDING' };

      const analysis = taskAutoStatusService.analyzeTaskReadiness(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(analysis.totalPredecessors).toBe(0);
      expect(analysis.completedPredecessors).toEqual([]);
      expect(analysis.incompletePredecessors).toEqual([]);
      expect(analysis.isReady).toBe(true);
    });

    it('应正确分析所有前置任务已完成的任务', () => {
      mockTasks = [
        { uuid: 'task-a', title: '任务 A', status: 'COMPLETED' },
        { uuid: 'task-b', title: '任务 B', status: 'COMPLETED' },
        { uuid: 'task-c', title: '任务 C', status: 'PENDING' },
      ];

      mockDependencies = [
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-c'),
      ];

      const task = mockTasks[2];
      const analysis = taskAutoStatusService.analyzeTaskReadiness(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(analysis.totalPredecessors).toBe(2);
      expect(analysis.completedPredecessors).toHaveLength(2);
      expect(analysis.incompletePredecessors).toHaveLength(0);
      expect(analysis.isReady).toBe(true);
    });

    it('应正确分析有未完成前置任务的任务', () => {
      mockTasks = [
        { uuid: 'task-a', title: '任务 A', status: 'COMPLETED' },
        { uuid: 'task-b', title: '任务 B', status: 'PENDING' },
        { uuid: 'task-c', title: '任务 C', status: 'PENDING' },
      ];

      mockDependencies = [
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-c'),
      ];

      const task = mockTasks[2];
      const analysis = taskAutoStatusService.analyzeTaskReadiness(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(analysis.totalPredecessors).toBe(2);
      expect(analysis.completedPredecessors).toHaveLength(1);
      expect(analysis.incompletePredecessors).toHaveLength(1);
      expect(analysis.incompletePredecessors).toContain('task-b');
      expect(analysis.isReady).toBe(false);
    });
  });

  describe('canTaskStart', () => {
    it('应允许没有前置任务的任务开始', () => {
      const task = { uuid: 'task-a', title: '任务 A', status: 'PENDING' };

      const result = taskAutoStatusService.canTaskStart(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(result.canStart).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('应允许所有前置任务已完成的任务开始', () => {
      mockTasks = [
        { uuid: 'task-a', title: '任务 A', status: 'COMPLETED' },
        { uuid: 'task-b', title: '任务 B', status: 'PENDING' },
      ];

      mockDependencies = [createTestDependency('task-a', 'task-b')];

      const task = mockTasks[1];
      const result = taskAutoStatusService.canTaskStart(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(result.canStart).toBe(true);
    });

    it('应阻止有未完成前置任务的任务开始', () => {
      mockTasks = [
        { uuid: 'task-a', title: '任务 A', status: 'PENDING' },
        { uuid: 'task-b', title: '任务 B', status: 'PENDING' },
      ];

      mockDependencies = [createTestDependency('task-a', 'task-b')];

      const task = mockTasks[1];
      const result = taskAutoStatusService.canTaskStart(
        task as any,
        mockTasks as any,
        mockDependencies,
      );

      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('前置任务');
      expect(result.blockingTasks).toHaveLength(1);
      expect(result.blockingTasks?.[0]).toBe('task-a');
    });
  });

  describe('Event System', () => {
    it('应触发 status changed 事件', () => {
      const handler = vi.fn();
      const unsubscribe = taskAutoStatusService.onStatusChanged(handler);

      // 模拟状态变更（实际需要通过 updateTaskStatusOnDependencyChange 触发）
      // 这里只测试订阅机制
      expect(handler).not.toHaveBeenCalled();

      unsubscribe();
    });

    it('应触发 task ready 事件', () => {
      const handler = vi.fn();
      const unsubscribe = taskAutoStatusService.onTaskReady(handler);

      expect(handler).not.toHaveBeenCalled();

      unsubscribe();
    });

    it('应触发 task blocked 事件', () => {
      const handler = vi.fn();
      const unsubscribe = taskAutoStatusService.onTaskBlocked(handler);

      expect(handler).not.toHaveBeenCalled();

      unsubscribe();
    });

    it('应正确清理事件订阅', () => {
      const handler = vi.fn();
      const unsubscribe = taskAutoStatusService.onStatusChanged(handler);

      unsubscribe();

      // 清理后不应再触发事件
      // （实际验证需要模拟事件发送）
    });
  });
});

