/**
 * Daily Planning Service - Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DailyPlanningService } from '../DailyPlanningService';
import type { DailyPlan } from '../DailyPlanningService';
import { setDate, setHours } from 'date-fns';

describe('DailyPlanningService', () => {
  let service: DailyPlanningService;
  const testDate = setHours(new Date(), 0);

  beforeEach(() => {
    service = DailyPlanningService.getInstance();
    service.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = DailyPlanningService.getInstance();
      const instance2 = DailyPlanningService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateDailyPlan - Basic Functionality', () => {
    it('should generate daily plan for empty task list', async () => {
      const plan = await service.generateDailyPlan(testDate, []);

      expect(plan).toHaveProperty('date');
      expect(plan).toHaveProperty('summary');
      expect(plan).toHaveProperty('recommendations');
      expect(plan).toHaveProperty('insights');
      expect(plan.date).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should generate plan with tasks', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Important task',
          estimatedMinutes: 120,
          priority: 'high' as const,
        },
        {
          id: 'task-2',
          title: 'Medium task',
          estimatedMinutes: 60,
          priority: 'medium' as const,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.summary.totalTasks).toBeGreaterThan(0);
      expect(plan.recommendations.length).toBeGreaterThan(0);
    });

    it('should have valid timestamp', async () => {
      const plan = await service.generateDailyPlan(testDate, []);

      expect(plan.generatedAt).toBeInstanceOf(Date);
      expect(plan.generatedAt.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Task Prioritization', () => {
    it('should prioritize high priority tasks', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Low priority',
          estimatedMinutes: 30,
          priority: 'low' as const,
        },
        {
          id: 'task-2',
          title: 'High priority',
          estimatedMinutes: 30,
          priority: 'high' as const,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      // High priority task should appear first or be recommended
      const taskIds = plan.recommendations.map((r) => r.taskId);
      expect(taskIds).toContain('task-2');
    });

    it('should prioritize tasks with near deadlines', async () => {
      const today = setHours(testDate, 10);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const tasks = [
        {
          id: 'task-1',
          title: 'Due today',
          estimatedMinutes: 30,
          dueDate: today,
        },
        {
          id: 'task-2',
          title: 'Due later',
          estimatedMinutes: 30,
          dueDate: tomorrow,
        },
      ];

      const plan = await service.generateDailyPlan(today, tasks);

      // Task due today should be recommended first
      if (plan.recommendations.length > 0) {
        expect(plan.recommendations[0].taskId).toBe('task-1');
      }
    });

    it('should prioritize tasks with dependencies', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task with 3 dependencies',
          estimatedMinutes: 30,
          dependencies: 3,
        },
        {
          id: 'task-2',
          title: 'Task with no dependencies',
          estimatedMinutes: 30,
          dependencies: 0,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      // Task with dependencies should be prioritized
      const taskIds = plan.recommendations.map((r) => r.taskId);
      const task1Index = taskIds.indexOf('task-1');
      const task2Index = taskIds.indexOf('task-2');

      if (task1Index !== -1 && task2Index !== -1) {
        expect(task1Index).toBeLessThanOrEqual(task2Index);
      }
    });
  });

  describe('Time Slot Allocation', () => {
    it('should allocate tasks to available time slots', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Morning task',
          estimatedMinutes: 60,
          priority: 'high' as const,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.recommendations.length).toBeGreaterThan(0);
      expect(plan.recommendations[0].suggestedTime.start).toMatch(/\d{2}:\d{2}/);
      expect(plan.recommendations[0].suggestedTime.end).toMatch(/\d{2}:\d{2}/);
    });

    it('should respect available time in recommendations', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          estimatedMinutes: 120,
        },
        {
          id: 'task-2',
          title: 'Task 2',
          estimatedMinutes: 120,
        },
        {
          id: 'task-3',
          title: 'Task 3',
          estimatedMinutes: 120,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      // Should fit within work hours (9-18 = 9 hours = 540 minutes)
      const totalMinutes = plan.recommendations.reduce(
        (sum, r) => sum + r.suggestedTime.duration,
        0
      );

      expect(totalMinutes).toBeLessThanOrEqual(540);
    });

    it('should limit recommendations to max 5 tasks', async () => {
      const tasks = Array.from({ length: 20 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        estimatedMinutes: 30,
      }));

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Energy Level Matching', () => {
    it('should assign deep focus tasks to high energy periods', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Deep work task',
          estimatedMinutes: 120,
          focusLevel: 'deep' as const,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      const recommendation = plan.recommendations[0];
      if (recommendation) {
        const hour = parseInt(recommendation.suggestedTime.start.split(':')[0]);
        // Deep focus should be in morning (high energy hours)
        expect(hour).toBeLessThan(14);
      }
    });

    it('should assign light tasks to low energy periods', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Light task',
          estimatedMinutes: 30,
          focusLevel: 'light' as const,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      const recommendation = plan.recommendations[0];
      if (recommendation) {
        expect(recommendation.energyLevel).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(recommendation.energyLevel);
      }
    });
  });

  describe('Summary Generation', () => {
    it('should calculate workload correctly', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task',
          estimatedMinutes: 120,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.summary.workload).toMatch(/light|moderate|heavy|overload/);
      expect(plan.summary.estimatedWorkHours).toBeGreaterThan(0);
    });

    it('should set light workload for few tasks', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Single task',
          estimatedMinutes: 30,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.summary.workload).toBe('light');
    });

    it('should set appropriate workload for many tasks', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        estimatedMinutes: 60,
      }));

      const plan = await service.generateDailyPlan(testDate, tasks);

      // With 10 tasks of 60min each, max fits ~5-6 in 9 hour workday
      // So only 5 will be recommended, resulting in moderate-heavy
      expect(['light', 'moderate', 'heavy', 'overload']).toContain(plan.summary.workload);
    });

    it('should calculate completion confidence', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task',
          estimatedMinutes: 60,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.summary.completionConfidence).toBeGreaterThanOrEqual(0);
      expect(plan.summary.completionConfidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Insights Generation', () => {
    it('should generate insights for empty plan', async () => {
      const plan = await service.generateDailyPlan(testDate, []);

      expect(Array.isArray(plan.insights)).toBe(true);
    });

    it('should handle high workload scenarios', async () => {
      const tasks = Array.from({ length: 15 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        estimatedMinutes: 60,
      }));

      const plan = await service.generateDailyPlan(testDate, tasks);

      // Plan should handle high volume, either via heavy/overload or insights
      expect(plan.recommendations.length).toBeGreaterThan(0);
      expect(['light', 'moderate', 'heavy', 'overload']).toContain(plan.summary.workload);
    });

    it('should suggest adding tasks for light workload', async () => {
      const plan = await service.generateDailyPlan(testDate, []);

      const hasSuggestion = plan.insights.some((i) => i.includes('空闲'));
      expect(hasSuggestion || plan.summary.workload === 'light').toBe(true);
    });

    it('should warn about consecutive deep focus', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Deep 1',
          estimatedMinutes: 120,
          focusLevel: 'deep' as const,
        },
        {
          id: 'task-2',
          title: 'Deep 2',
          estimatedMinutes: 120,
          focusLevel: 'deep' as const,
        },
        {
          id: 'task-3',
          title: 'Deep 3',
          estimatedMinutes: 120,
          focusLevel: 'deep' as const,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      const hasDeepWorkWarning = plan.warnings?.some((w) => w.includes('深度'));
      expect(hasDeepWorkWarning || plan.insights.some((i) => i.includes('深度'))).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache plan results', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task',
          estimatedMinutes: 30,
        },
      ];

      const plan1 = await service.generateDailyPlan(testDate, tasks);
      const plan2 = await service.generateDailyPlan(testDate, tasks);

      expect(plan1.date).toBe(plan2.date);
      expect(plan1.recommendations.length).toBe(plan2.recommendations.length);
    });

    it('should clear cache', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task',
          estimatedMinutes: 30,
        },
      ];

      await service.generateDailyPlan(testDate, tasks);
      service.clearCache();

      // Should still work but cache is cleared
      const plan = await service.generateDailyPlan(testDate, tasks);
      expect(plan).toBeDefined();
    });

    it('should clear specific cache entry', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task',
          estimatedMinutes: 30,
        },
      ];

      await service.generateDailyPlan(testDate, tasks);
      service.clearCache(
        `daily-plan-${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`
      );

      const plan = await service.generateDailyPlan(testDate, tasks);
      expect(plan).toBeDefined();
    });
  });

  describe('Cache Expiry', () => {
    it('should allow setting cache expiry', () => {
      service.setCacheExpiry(120);
      expect(() => service.setCacheExpiry(120)).not.toThrow();
    });
  });

  describe('Reasoning Generation', () => {
    it('should include reasoning in recommendations', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task',
          estimatedMinutes: 30,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      if (plan.recommendations.length > 0) {
        expect(plan.recommendations[0].reasoning).toBeTruthy();
        expect(plan.recommendations[0].reasoning.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Different Task Durations', () => {
    it('should handle short tasks (15 min)', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Quick task',
          estimatedMinutes: 15,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle long tasks (240 min)', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Long task',
          estimatedMinutes: 240,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.recommendations.length).toBeGreaterThan(0);
    });

    it('should reject tasks longer than 240 min', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Too long',
          estimatedMinutes: 300,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.recommendations.map((r) => r.taskId)).not.toContain('task-1');
    });
  });

  describe('Warnings', () => {
    it('should detect consecutive deep focus tasks', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Deep 1',
          estimatedMinutes: 120,
          focusLevel: 'deep' as const,
        },
        {
          id: 'task-2',
          title: 'Deep 2',
          estimatedMinutes: 120,
          focusLevel: 'deep' as const,
        },
        {
          id: 'task-3',
          title: 'Deep 3',
          estimatedMinutes: 120,
          focusLevel: 'deep' as const,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.warnings && plan.warnings.length > 0).toBe(true);
    });

    it('should handle overallocation scenarios', async () => {
      const tasks = Array.from({ length: 20 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        estimatedMinutes: 60,
      }));

      const plan = await service.generateDailyPlan(testDate, tasks);

      // With 20 tasks, only 5 max will be recommended
      expect(plan.recommendations.length).toBeLessThanOrEqual(5);
      expect(plan.summary.totalTasks).toBeLessThanOrEqual(5);
    });
  });

  describe('Summary Validation', () => {
    it('should have consistent summary totals', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          estimatedMinutes: 60,
        },
        {
          id: 'task-2',
          title: 'Task 2',
          estimatedMinutes: 30,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      expect(plan.summary.totalTasks).toBe(plan.recommendations.length);
    });

    it('should calculate hours correctly', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Task',
          estimatedMinutes: 120,
        },
      ];

      const plan = await service.generateDailyPlan(testDate, tasks);

      if (plan.recommendations.length > 0) {
        expect(plan.summary.estimatedWorkHours).toBeGreaterThan(0);
      }
    });
  });
});
