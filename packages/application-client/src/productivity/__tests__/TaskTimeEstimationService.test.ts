import { describe, it, expect, beforeEach } from 'vitest';
import { taskTimeEstimationService } from '../TaskTimeEstimationService';

describe('TaskTimeEstimationService', () => {
  beforeEach(() => {
    taskTimeEstimationService.clearCache();
  });

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
