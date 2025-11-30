/**
 * Unit Tests for TaskCriticalPathService
 * 关键路径计算服务单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { taskCriticalPathService } from '../TaskCriticalPathService';
import { TaskTemplateStatus, TaskType } from '@dailyuse/contracts/task';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';


// 创建测试任务
function createTestTask(uuid: string, title: string, estimatedMinutes: number): TaskForDAG {
  return {
    uuid,
    title,
    description: `Test task: ${title}`,
    status: 'PENDING',
    priority: 'MEDIUM',
    estimatedMinutes,
  } as TaskForDAG;
}

// 创建测试依赖
function createTestDependency(
  predecessorUuid: string,
  successorUuid: string,
): TaskDependencyClientDTO {
  return {
    uuid: `dep-${predecessorUuid}-${successorUuid}`,
    predecessorTaskUuid: predecessorUuid,
    successorTaskUuid: successorUuid,
    dependencyType: 'FS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as TaskDependencyClientDTO;
}

describe('TaskCriticalPathService', () => {
  describe('topologicalSort', () => {
    it('should sort tasks with linear dependencies (A → B → C)', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-c', 'Task C', 60),
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 60),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
      ];

      const sorted = taskCriticalPathService.topologicalSort(tasks, dependencies);

      expect(sorted).toHaveLength(3);
      expect(sorted[0].uuid).toBe('task-a');
      expect(sorted[1].uuid).toBe('task-b');
      expect(sorted[2].uuid).toBe('task-c');
    });

    it('should handle diamond dependencies (A → B, A → C, B → D, C → D)', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 60),
        createTestTask('task-c', 'Task C', 60),
        createTestTask('task-d', 'Task D', 60),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-d'),
        createTestDependency('task-c', 'task-d'),
      ];

      const sorted = taskCriticalPathService.topologicalSort(tasks, dependencies);

      expect(sorted).toHaveLength(4);
      expect(sorted[0].uuid).toBe('task-a');
      expect(sorted[3].uuid).toBe('task-d');
      // task-b 和 task-c 的顺序可以互换
      const midTasks = [sorted[1].uuid, sorted[2].uuid].sort();
      expect(midTasks).toEqual(['task-b', 'task-c']);
    });

    it('should handle multiple start nodes', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 60),
        createTestTask('task-c', 'Task C', 60),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-c'),
      ];

      const sorted = taskCriticalPathService.topologicalSort(tasks, dependencies);

      expect(sorted).toHaveLength(3);
      expect(sorted[2].uuid).toBe('task-c');
      // task-a 和 task-b 可以任意顺序
    });

    it('should return empty array for cyclic dependencies', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 60),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-a'), // Cycle!
      ];

      const sorted = taskCriticalPathService.topologicalSort(tasks, dependencies);

      expect(sorted).toHaveLength(0); // Cannot sort cyclic graph
    });
  });

  describe('calculateTaskTimings', () => {
    it('should calculate ES and EF for linear tasks', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60), // 1 hour
        createTestTask('task-b', 'Task B', 120), // 2 hours
        createTestTask('task-c', 'Task C', 90), // 1.5 hours
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
      ];

      const sorted = taskCriticalPathService.topologicalSort(tasks, dependencies);
      const timings = taskCriticalPathService.calculateTaskTimings(sorted, dependencies);

      // Task A
      const timingA = timings.get('task-a')!;
      expect(timingA.earliestStart).toBe(0);
      expect(timingA.earliestFinish).toBe(60);
      expect(timingA.duration).toBe(60);

      // Task B
      const timingB = timings.get('task-b')!;
      expect(timingB.earliestStart).toBe(60);
      expect(timingB.earliestFinish).toBe(180);
      expect(timingB.duration).toBe(120);

      // Task C
      const timingC = timings.get('task-c')!;
      expect(timingC.earliestStart).toBe(180);
      expect(timingC.earliestFinish).toBe(270);
      expect(timingC.duration).toBe(90);
    });

    it('should calculate LS and LF correctly', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
      ];

      const sorted = taskCriticalPathService.topologicalSort(tasks, dependencies);
      const timings = taskCriticalPathService.calculateTaskTimings(sorted, dependencies);

      // 项目总工期 = 270
      // Task C: LF = 270, LS = 270 - 90 = 180
      const timingC = timings.get('task-c')!;
      expect(timingC.latestFinish).toBe(270);
      expect(timingC.latestStart).toBe(180);

      // Task B: LF = 180, LS = 180 - 120 = 60
      const timingB = timings.get('task-b')!;
      expect(timingB.latestFinish).toBe(180);
      expect(timingB.latestStart).toBe(60);

      // Task A: LF = 60, LS = 60 - 60 = 0
      const timingA = timings.get('task-a')!;
      expect(timingA.latestFinish).toBe(60);
      expect(timingA.latestStart).toBe(0);
    });

    it('should calculate slack time correctly', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
      ];

      const sorted = taskCriticalPathService.topologicalSort(tasks, dependencies);
      const timings = taskCriticalPathService.calculateTaskTimings(sorted, dependencies);

      // 线性路径，所有任务松弛时间都是 0
      timings.forEach((timing, uuid) => {
        expect(timing.slack).toBe(0);
        expect(timing.isCritical).toBe(true);
      });
    });

    it('should identify non-critical tasks with slack', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 30), // Short parallel task
        createTestTask('task-d', 'Task D', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'), // Critical path
        createTestDependency('task-a', 'task-c'), // Parallel path
        createTestDependency('task-b', 'task-d'),
        createTestDependency('task-c', 'task-d'),
      ];

      const sorted = taskCriticalPathService.topologicalSort(tasks, dependencies);
      const timings = taskCriticalPathService.calculateTaskTimings(sorted, dependencies);

      // Task C 是非关键任务
      const timingC = timings.get('task-c')!;
      expect(timingC.slack).toBeGreaterThan(0); // 应该有松弛时间
      expect(timingC.isCritical).toBe(false);

      // Task A, B, D 是关键任务
      expect(timings.get('task-a')!.isCritical).toBe(true);
      expect(timings.get('task-b')!.isCritical).toBe(true);
      expect(timings.get('task-d')!.isCritical).toBe(true);
    });
  });

  describe('calculateCriticalPath', () => {
    it('should identify single critical path', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
      ];

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);

      expect(result.criticalTasks).toHaveLength(3);
      expect(result.criticalPath).toEqual(['task-a', 'task-b', 'task-c']);
      expect(result.projectDuration).toBe(270); // 60 + 120 + 90
    });

    it('should identify multiple critical paths', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 120), // Same duration as B
        createTestTask('task-d', 'Task D', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-d'),
        createTestDependency('task-c', 'task-d'),
      ];

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);

      // 所有任务都在关键路径上（两条并行路径工期相同）
      expect(result.criticalTasks).toHaveLength(4);
      expect(result.projectDuration).toBe(270); // 60 + 120 + 90
    });

    it('should handle tasks with zero duration', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 0), // Milestone
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
      ];

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);

      expect(result.projectDuration).toBe(210); // 0 + 120 + 90
      expect(result.criticalTasks).toHaveLength(3);
    });

    it('should throw error for cyclic dependencies', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-a'),
      ];

      expect(() => {
        taskCriticalPathService.calculateCriticalPath(tasks, dependencies);
      }).toThrow('Cyclic dependency');
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should suggest duration reduction for critical tasks > 1 hour', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 180), // 3 hours - should suggest
        createTestTask('task-b', 'Task B', 45), // 45 min - should not suggest
        createTestTask('task-c', 'Task C', 120), // 2 hours - should suggest
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
      ];

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);

      const durationSuggestions = result.suggestions.filter((s) => s.type === 'reduce_duration');

      expect(durationSuggestions.length).toBeGreaterThanOrEqual(2);
      expect(durationSuggestions.some((s) => s.taskUuid === 'task-a')).toBe(true);
      expect(durationSuggestions.some((s) => s.taskUuid === 'task-c')).toBe(true);
    });

    it('should suggest parallelization for tasks with slack', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 30), // Has slack
        createTestTask('task-d', 'Task D', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-d'),
        createTestDependency('task-c', 'task-d'),
      ];

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);

      const parallelSuggestions = result.suggestions.filter((s) => s.type === 'parallelize');

      // Task C 应该有并行化建议
      expect(parallelSuggestions.length).toBeGreaterThan(0);
    });

    it('should limit suggestions to top 5', () => {
      // 创建很多关键任务
      const tasks: TaskForDAG[] = [];
      const dependencies: TaskDependencyClientDTO[] = [];

      for (let i = 0; i < 10; i++) {
        tasks.push(createTestTask(`task-${i}`, `Task ${i}`, 180));
        if (i > 0) {
          dependencies.push(createTestDependency(`task-${i - 1}`, `task-${i}`));
        }
      }

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);

      expect(result.suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('formatProjectTimeline', () => {
    it('should calculate project timeline metrics', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 30),
        createTestTask('task-d', 'Task D', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-d'),
        createTestDependency('task-c', 'task-d'),
      ];

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);
      const timeline = taskCriticalPathService.formatProjectTimeline(result);

      expect(timeline.totalDuration).toBe(270); // 60 + 120 + 90
      expect(timeline.criticalTaskCount).toBeGreaterThan(0);
      expect(timeline.totalSlack).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isCritical', () => {
    it('should correctly identify critical tasks', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-b', 'task-c'),
      ];

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);

      expect(taskCriticalPathService.isCritical('task-a', result)).toBe(true);
      expect(taskCriticalPathService.isCritical('task-b', result)).toBe(true);
      expect(taskCriticalPathService.isCritical('task-c', result)).toBe(true);
    });
  });

  describe('getSlackTime', () => {
    it('should return correct slack time for tasks', () => {
      const tasks: TaskForDAG[] = [
        createTestTask('task-a', 'Task A', 60),
        createTestTask('task-b', 'Task B', 120),
        createTestTask('task-c', 'Task C', 30),
        createTestTask('task-d', 'Task D', 90),
      ];

      const dependencies: TaskDependencyClientDTO[] = [
        createTestDependency('task-a', 'task-b'),
        createTestDependency('task-a', 'task-c'),
        createTestDependency('task-b', 'task-d'),
        createTestDependency('task-c', 'task-d'),
      ];

      const result = taskCriticalPathService.calculateCriticalPath(tasks, dependencies);

      // Task C 应该有松弛时间
      const slackC = taskCriticalPathService.getSlackTime('task-c', result);
      expect(slackC).toBeGreaterThan(0);

      // Critical tasks 应该有 0 松弛时间
      const slackA = taskCriticalPathService.getSlackTime('task-a', result);
      expect(slackA).toBe(0);
    });
  });
});

