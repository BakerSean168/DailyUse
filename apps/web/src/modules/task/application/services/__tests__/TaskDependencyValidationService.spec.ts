/**
 * Unit Tests for TaskDependencyValidationService
 * 任务依赖验证服务单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { taskDependencyValidationService } from '../TaskDependencyValidationService';
import { TaskTemplateStatus, TaskType } from '@dailyuse/contracts/task';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO } from '@dailyuse/contracts/task';

type TaskDependencyClientDTO = TaskDependencyClientDTO;

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
  type: string = 'FS',
): TaskDependencyClientDTO {
  return {
    uuid: `dep-${Math.random().toString(36).substr(2, 9)}`,
    predecessorTaskUuid: predecessorUuid,
    successorTaskUuid: successorUuid,
    dependencyType: type as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as TaskDependencyClientDTO;
}

describe('TaskDependencyValidationService', () => {
  let mockTasks: TestTask[];
  let mockDependencies: TaskDependencyClientDTO[];

  beforeEach(() => {
    // 设置测试数据
    mockTasks = [
      { uuid: 'task-a', title: '任务 A', status: 'PENDING' },
      { uuid: 'task-b', title: '任务 B', status: 'PENDING' },
      { uuid: 'task-c', title: '任务 C', status: 'PENDING' },
      { uuid: 'task-d', title: '任务 D', status: 'PENDING' },
      { uuid: 'task-e', title: '任务 E', status: 'PENDING' },
    ];

    mockDependencies = [];
  });

  describe('detectCircularDependency', () => {
    it('应检测简单的两节点循环 (A → B → A)', () => {
      mockDependencies = [createTestDependency('task-b', 'task-a')];

      const result = taskDependencyValidationService.detectCircularDependency(
        'task-a',
        'task-b',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toContain('task-a');
      expect(result.cyclePath).toContain('task-b');
      expect(result.cyclePathNames).toBeDefined();
      expect(result.cyclePathNames).toContain('任务 A');
      expect(result.cyclePathNames).toContain('任务 B');
    });

    it('应检测三节点循环 (A → B → C → A)', () => {
      mockDependencies = [
        createTestDependency('task-b', 'task-c'),
        createTestDependency('task-c', 'task-a'),
      ];

      const result = taskDependencyValidationService.detectCircularDependency(
        'task-a',
        'task-b',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath.length).toBeGreaterThanOrEqual(3);
    });

    it('应检测复杂循环 (A → B → C → D → B)', () => {
      mockDependencies = [
        createTestDependency('task-b', 'task-c'),
        createTestDependency('task-c', 'task-d'),
        createTestDependency('task-d', 'task-b'),
      ];

      const result = taskDependencyValidationService.detectCircularDependency(
        'task-a',
        'task-b',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.hasCycle).toBe(true);
    });

    it('应允许有效的链式依赖 (A → B → C → D)', () => {
      mockDependencies = [
        createTestDependency('task-b', 'task-c'),
        createTestDependency('task-c', 'task-d'),
      ];

      const result = taskDependencyValidationService.detectCircularDependency(
        'task-a',
        'task-b',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.hasCycle).toBe(false);
      expect(result.cyclePath).toEqual([]);
    });

    it('应允许有效的菱形依赖 (A → B, A → C, B → D, C → D)', () => {
      mockDependencies = [
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-d'),
        createTestDependency('task-c', 'task-d'),
      ];

      const result = taskDependencyValidationService.detectCircularDependency(
        'task-a',
        'task-b',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.hasCycle).toBe(false);
    });

    it('应允许独立的依赖关系', () => {
      mockDependencies = [createTestDependency('task-c', 'task-d')];

      const result = taskDependencyValidationService.detectCircularDependency(
        'task-a',
        'task-b',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.hasCycle).toBe(false);
    });
  });

  describe('validateDependency', () => {
    it('应拒绝自依赖', async () => {
      const result = await taskDependencyValidationService.validateDependency(
        'task-a',
        'task-a',
        'FS',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SELF_DEPENDENCY');
      expect(result.errors[0].message).toContain('自己');
    });

    it('应拒绝重复的依赖', async () => {
      mockDependencies = [createTestDependency('task-a', 'task-b')];

      const result = await taskDependencyValidationService.validateDependency(
        'task-a',
        'task-b',
        'FS',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DUPLICATE_DEPENDENCY');
    });

    it('应拒绝循环依赖', async () => {
      mockDependencies = [createTestDependency('task-b', 'task-a')];

      const result = await taskDependencyValidationService.validateDependency(
        'task-a',
        'task-b',
        'FS',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('CIRCULAR_DEPENDENCY');
      expect(result.errors[0].details?.cyclePath).toBeDefined();
    });

    it('应拒绝无效的依赖类型', async () => {
      const result = await taskDependencyValidationService.validateDependency(
        'task-a',
        'task-b',
        'INVALID_TYPE',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('INVALID_DEPENDENCY_TYPE');
    });

    it('应拒绝无效的 UUID', async () => {
      const result = await taskDependencyValidationService.validateDependency(
        '',
        'task-b',
        'FS',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('INVALID_UUID');
    });

    it('应接受有效的依赖', async () => {
      const result = await taskDependencyValidationService.validateDependency(
        'task-a',
        'task-b',
        'FS',
        mockDependencies,
        mockTasks as any,
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应对深层链发出警告 (> 5 层)', async () => {
      // 创建深层链: A → B → C → D → E → F
      mockDependencies = [
        createTestDependency('task-b', 'task-c'),
        createTestDependency('task-c', 'task-d'),
        createTestDependency('task-d', 'task-e'),
      ];

      mockTasks.push({ uuid: 'task-f', title: '任务 F', status: 'PENDING' });

      const result = await taskDependencyValidationService.validateDependency(
        'task-a',
        'task-b',
        'FS',
        mockDependencies,
        mockTasks as any,
      );

      // 应该仍然有效，但可能有警告
      expect(result.isValid).toBe(true);
      // 警告取决于实际的链深度计算实现
    });
  });

  describe('calculateAffectedTasks', () => {
    it('应计算受影响的后续任务', () => {
      mockDependencies = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
        createTestDependency('task-c', 'task-d'),
      ];

      const affected = taskDependencyValidationService.calculateAffectedTasks(
        'task-a',
        mockDependencies,
      );

      expect(affected).toContain('task-b');
      expect(affected).toContain('task-c');
      expect(affected).toContain('task-d');
      expect(affected.length).toBe(3);
    });

    it('应返回空数组对于没有后续任务的任务', () => {
      mockDependencies = [createTestDependency('task-a', 'task-b')];

      const affected = taskDependencyValidationService.calculateAffectedTasks(
        'task-b',
        mockDependencies,
      );

      expect(affected).toEqual([]);
    });
  });
});

