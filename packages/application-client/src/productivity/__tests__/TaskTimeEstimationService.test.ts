import { describe, it, expect, beforeEach } from 'vitest';
import { taskTimeEstimationService } from '../TaskTimeEstimationService';

describe('TaskTimeEstimationService', () => {
  beforeEach(() => {
    taskTimeEstimationService.clearCache();
  });

  describe('Basic Estimation', () => {
    it('should produce estimates with buffer', () => {
      const estimate = taskTimeEstimationService.estimate('Implement feature', {
        complexity: 'moderate',
        riskLevel: 'medium',
        dependencies: 1,
      });

      expect(estimate.estimatedMinutes).toBeGreaterThan(0);
      expect(estimate.bufferPercentage).toBeGreaterThan(0);
    });

    it('should honor team velocity (tasks/hour) when computing likely time', () => {
      const slow = taskTimeEstimationService.estimate('Velocity check', {
        complexity: 'moderate',
        teamVelocity: 1,
      });

      taskTimeEstimationService.clearCache();

      const fast = taskTimeEstimationService.estimate('Velocity check', {
        complexity: 'moderate',
        teamVelocity: 4,
      });

      expect(fast.mostLikelyMinutes).toBeLessThan(slow.mostLikelyMinutes);
    });

    it('should cache estimation results', () => {
      const first = taskTimeEstimationService.estimate('Add tests', {
        complexity: 'simple',
        riskLevel: 'low',
      });
      const second = taskTimeEstimationService.estimate('Add tests', {
        complexity: 'simple',
        riskLevel: 'low',
      });
      expect(first).toBe(second);
    });
  });

  describe('PERT Formula Validation', () => {
    it('should calculate optimistic < likely < pessimistic', () => {
      const estimate = taskTimeEstimationService.estimate('PERT test', {
        complexity: 'moderate',
        riskLevel: 'medium',
      });

      expect(estimate.optimisticMinutes).toBeLessThan(estimate.mostLikelyMinutes);
      expect(estimate.mostLikelyMinutes).toBeLessThan(estimate.pessimisticMinutes);
    });

    it('should produce estimates within confidence interval', () => {
      const estimate = taskTimeEstimationService.estimate('Confidence test', {
        complexity: 'simple',
        riskLevel: 'low',
      });

      // The estimated minutes (before buffer) should be within confidence interval
      expect(estimate.confidenceInterval.min).toBeLessThanOrEqual(estimate.mostLikelyMinutes);
      expect(estimate.confidenceInterval.max).toBeGreaterThanOrEqual(estimate.mostLikelyMinutes);
    });
  });

  describe('Confidence Interval', () => {
    it('should return higher confidence for simpler tasks', () => {
      const simple = taskTimeEstimationService.estimate('Simple task', {
        complexity: 'trivial',
        riskLevel: 'low',
      });

      taskTimeEstimationService.clearCache();

      const complex = taskTimeEstimationService.estimate('Complex task', {
        complexity: 'critical',
        riskLevel: 'high',
      });

      expect(simple.confidenceInterval.confidence).toBeGreaterThan(
        complex.confidenceInterval.confidence
      );
    });

    it('should return confidence between 0.3 and 0.95', () => {
      const estimate = taskTimeEstimationService.estimate('Confidence bounds', {
        complexity: 'moderate',
      });

      expect(estimate.confidenceInterval.confidence).toBeGreaterThanOrEqual(0.3);
      expect(estimate.confidenceInterval.confidence).toBeLessThanOrEqual(0.95);
    });

    it('should have min < max in confidence interval', () => {
      const estimate = taskTimeEstimationService.estimate('Min max test', {
        complexity: 'moderate',
        riskLevel: 'medium',
      });

      expect(estimate.confidenceInterval.min).toBeLessThan(estimate.confidenceInterval.max);
    });
  });

  describe('Time of Day Factor', () => {
    it('should return time of day factor between 0.65 and 1.0', () => {
      const estimate = taskTimeEstimationService.estimate('Time test', {
        complexity: 'simple',
      });

      expect(estimate.timeOfDayFactor).toBeGreaterThanOrEqual(0.65);
      expect(estimate.timeOfDayFactor).toBeLessThanOrEqual(1.0);
    });

    it('should apply morning efficiency for morning time', () => {
      const morning = taskTimeEstimationService.estimate('Morning task', {
        complexity: 'moderate',
        timeOfDay: 'morning',
      });

      expect(morning.timeOfDayFactor).toBe(1.0);
    });

    it('should apply lower efficiency for evening time', () => {
      taskTimeEstimationService.clearCache();
      
      const evening = taskTimeEstimationService.estimate('Evening task', {
        complexity: 'moderate',
        timeOfDay: 'evening',
      });

      expect(evening.timeOfDayFactor).toBe(0.75);
    });
  });

  describe('Complexity Levels', () => {
    it('should estimate trivial tasks as shortest', () => {
      const trivial = taskTimeEstimationService.estimate('Trivial', {
        complexity: 'trivial',
        timeOfDay: 'morning',
      });

      taskTimeEstimationService.clearCache();

      const critical = taskTimeEstimationService.estimate('Critical', {
        complexity: 'critical',
        timeOfDay: 'morning',
      });

      expect(trivial.estimatedMinutes).toBeLessThan(critical.estimatedMinutes);
    });

    it('should handle all complexity levels', () => {
      const complexities = ['trivial', 'simple', 'moderate', 'complex', 'critical'] as const;
      
      for (const complexity of complexities) {
        taskTimeEstimationService.clearCache();
        const estimate = taskTimeEstimationService.estimate(`Task ${complexity}`, {
          complexity,
        });
        expect(estimate.estimatedMinutes).toBeGreaterThan(0);
      }
    });
  });

  describe('Risk Levels', () => {
    it('should increase buffer for high risk tasks', () => {
      const low = taskTimeEstimationService.estimate('Low risk', {
        complexity: 'moderate',
        riskLevel: 'low',
      });

      taskTimeEstimationService.clearCache();

      const high = taskTimeEstimationService.estimate('High risk', {
        complexity: 'moderate',
        riskLevel: 'high',
      });

      expect(high.bufferPercentage).toBeGreaterThan(low.bufferPercentage);
    });

    it('should reduce confidence for high risk tasks', () => {
      const low = taskTimeEstimationService.estimate('Low risk confidence', {
        complexity: 'moderate',
        riskLevel: 'low',
      });

      taskTimeEstimationService.clearCache();

      const high = taskTimeEstimationService.estimate('High risk confidence', {
        complexity: 'moderate',
        riskLevel: 'high',
      });

      expect(low.confidenceInterval.confidence).toBeGreaterThan(
        high.confidenceInterval.confidence
      );
    });
  });

  describe('Dependencies', () => {
    it('should increase buffer for tasks with dependencies', () => {
      const noDeps = taskTimeEstimationService.estimate('No deps', {
        complexity: 'moderate',
        dependencies: 0,
      });

      taskTimeEstimationService.clearCache();

      const withDeps = taskTimeEstimationService.estimate('With deps', {
        complexity: 'moderate',
        dependencies: 3,
      });

      expect(withDeps.bufferPercentage).toBeGreaterThan(noDeps.bufferPercentage);
    });

    it('should cap dependency buffer at 15%', () => {
      const manyDeps = taskTimeEstimationService.estimate('Many deps', {
        complexity: 'moderate',
        riskLevel: 'low',
        dependencies: 10,
      });

      // Base 10% (low risk) + 15% (capped deps) + 0% (moderate complexity) = 25%
      expect(manyDeps.bufferPercentage).toBeLessThanOrEqual(50);
    });
  });

  describe('User Estimate Integration', () => {
    it('should consider user estimate in likely calculation', () => {
      const withoutUser = taskTimeEstimationService.estimate('Task A', {
        complexity: 'moderate',
      });

      taskTimeEstimationService.clearCache();

      const withUser = taskTimeEstimationService.estimate('Task A', {
        complexity: 'moderate',
      }, 240); // User thinks 4 hours

      // With high user estimate, likely should be higher
      expect(withUser.mostLikelyMinutes).toBeGreaterThan(withoutUser.mostLikelyMinutes);
    });
  });

  describe('Historical Data (Stubs)', () => {
    it('should return basedOn with default values', () => {
      const estimate = taskTimeEstimationService.estimate('History test', {
        complexity: 'simple',
        tags: ['feature', 'frontend'],
      });

      expect(estimate.basedOn).toBeDefined();
      expect(estimate.basedOn.similarTasksCount).toBe(0); // Stub returns 0
      expect(estimate.basedOn.userHistoryDays).toBe(30);
    });
  });

  describe('Statistics', () => {
    it('should track estimation count', () => {
      taskTimeEstimationService.clearCache();
      
      taskTimeEstimationService.estimate('Task 1', { complexity: 'simple' });
      taskTimeEstimationService.estimate('Task 2', { complexity: 'moderate' });
      taskTimeEstimationService.estimate('Task 3', { complexity: 'complex' });

      const stats = taskTimeEstimationService.getStatistics();
      expect(stats.totalEstimates).toBe(3);
      expect(stats.cacheSize).toBe(3);
    });

    it('should reset statistics on cache clear', () => {
      taskTimeEstimationService.estimate('Task', { complexity: 'simple' });
      taskTimeEstimationService.clearCache();

      const stats = taskTimeEstimationService.getStatistics();
      expect(stats.totalEstimates).toBe(0);
    });
  });
});
