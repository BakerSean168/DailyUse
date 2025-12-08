import { describe, it, expect, beforeEach } from 'vitest';
import { priorityAnalysisService } from '../PriorityAnalysisService';

describe('PriorityAnalysisService', () => {
  beforeEach(() => {
    priorityAnalysisService.clearCache();
  });

  it('classifies critical tasks with high urgency and importance', () => {
    const result = priorityAnalysisService.analyzePriority('t1', 'Critical task', {
      urgency: 9,
      importance: 9,
      impact: 8,
      effort: 3,
      dependencies: 0,
      strategicAlignment: 9,
    });

    expect(result.priority).toBe('critical');
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.recommendation.toLowerCase()).toContain('start immediately');
  });

  it('caches repeated analyses for identical inputs', () => {
    const factors = {
      urgency: 6,
      importance: 7,
      impact: 7,
      effort: 4,
      dependencies: 1,
      strategicAlignment: 8,
    };

    const first = priorityAnalysisService.analyzePriority('t2', 'Cached task', factors);
    const second = priorityAnalysisService.analyzePriority('t2', 'Cached task', factors);

    expect(first).toBe(second);
  });

  it('orders tasks by priority score when comparing', () => {
    const results = priorityAnalysisService.compareTasks([
      {
        id: 'high',
        title: 'High priority',
        factors: {
          urgency: 8,
          importance: 8,
          impact: 7,
          effort: 4,
          dependencies: 0,
          strategicAlignment: 8,
        },
      },
      {
        id: 'low',
        title: 'Low priority',
        factors: {
          urgency: 2,
          importance: 3,
          impact: 3,
          effort: 2,
          dependencies: 4,
          strategicAlignment: 2,
        },
      },
      {
        id: 'medium',
        title: 'Medium priority',
        factors: {
          urgency: 5,
          importance: 5,
          impact: 5,
          effort: 5,
          dependencies: 1,
          strategicAlignment: 5,
        },
      },
    ]);

    expect(results[0]?.id).toBe('high');
    expect(results[results.length - 1]?.id).toBe('low');
  });
});
