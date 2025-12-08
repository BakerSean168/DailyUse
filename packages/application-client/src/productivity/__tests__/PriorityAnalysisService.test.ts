import { describe, it, expect, beforeEach } from 'vitest';
import { priorityAnalysisService } from '../PriorityAnalysisService';

describe('PriorityAnalysisService', () => {
  beforeEach(() => {
    priorityAnalysisService.clearCache();
  });

  describe('Basic Priority Analysis', () => {
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

  describe('Eisenhower Matrix Classification', () => {
    it('classifies urgent-important tasks', () => {
      const result = priorityAnalysisService.analyzePriority('e1', 'Urgent Important', {
        urgency: 8,
        importance: 8,
        impact: 5,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 5,
      });

      expect(result.eisenhowerQuadrant).toBe('urgent-important');
    });

    it('classifies not-urgent-important tasks', () => {
      const result = priorityAnalysisService.analyzePriority('e2', 'Not Urgent Important', {
        urgency: 3,
        importance: 8,
        impact: 7,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 8,
      });

      expect(result.eisenhowerQuadrant).toBe('not-urgent-important');
    });

    it('classifies urgent-not-important tasks', () => {
      const result = priorityAnalysisService.analyzePriority('e3', 'Urgent Not Important', {
        urgency: 8,
        importance: 3,
        impact: 3,
        effort: 2,
        dependencies: 0,
        strategicAlignment: 2,
      });

      expect(result.eisenhowerQuadrant).toBe('urgent-not-important');
    });

    it('classifies not-urgent-not-important tasks', () => {
      const result = priorityAnalysisService.analyzePriority('e4', 'Neither', {
        urgency: 2,
        importance: 2,
        impact: 2,
        effort: 2,
        dependencies: 0,
        strategicAlignment: 2,
      });

      expect(result.eisenhowerQuadrant).toBe('not-urgent-not-important');
    });
  });

  describe('Context Fit Analysis', () => {
    it('returns context fit for each analysis', () => {
      const result = priorityAnalysisService.analyzePriority('c1', 'Context test', {
        urgency: 5,
        importance: 5,
        impact: 5,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 5,
      });

      expect(result.contextFit).toBeDefined();
      expect(result.contextFit.energyLevel).toBeDefined();
      expect(result.contextFit.focusRequired).toBeDefined();
      expect(result.contextFit.suggestedTimeSlot).toBeDefined();
      expect(typeof result.contextFit.timeOfDay).toBe('boolean');
    });

    it('suggests morning for high-energy tasks', () => {
      const result = priorityAnalysisService.analyzePriority('c2', 'High energy task', {
        urgency: 5,
        importance: 5,
        impact: 9, // High impact
        effort: 8, // High effort
        dependencies: 0,
        strategicAlignment: 5,
      });

      expect(result.contextFit.energyLevel).toBe('high');
      expect(result.contextFit.suggestedTimeSlot).toBe('morning');
    });

    it('suggests afternoon for low-energy tasks', () => {
      const result = priorityAnalysisService.analyzePriority('c3', 'Low energy task', {
        urgency: 5,
        importance: 5,
        impact: 3,
        effort: 2, // Low effort
        dependencies: 0,
        strategicAlignment: 5,
      });

      expect(result.contextFit.energyLevel).toBe('low');
      expect(result.contextFit.suggestedTimeSlot).toBe('afternoon');
    });

    it('calculates focus requirement correctly', () => {
      const result = priorityAnalysisService.analyzePriority('c4', 'Focus test', {
        urgency: 5,
        importance: 5,
        impact: 8,
        effort: 6,
        dependencies: 0,
        strategicAlignment: 5,
      });

      // Focus = (effort + impact) / 2 = (6 + 8) / 2 = 7
      expect(result.contextFit.focusRequired).toBe(7);
    });
  });

  describe('Priority Levels', () => {
    it('classifies high priority tasks correctly', () => {
      const result = priorityAnalysisService.analyzePriority('p1', 'High priority', {
        urgency: 9,
        importance: 9,
        impact: 9,
        effort: 2, // Low effort (good for priority)
        dependencies: 0,
        strategicAlignment: 9,
      });

      expect(['critical', 'high']).toContain(result.priority);
    });

    it('classifies medium priority tasks correctly', () => {
      const result = priorityAnalysisService.analyzePriority('p2', 'Medium priority', {
        urgency: 6,
        importance: 6,
        impact: 6,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 6,
      });

      // Score should be in medium range (40-69)
      expect(['medium', 'low']).toContain(result.priority);
    });

    it('classifies low priority tasks correctly', () => {
      const result = priorityAnalysisService.analyzePriority('p3', 'Low priority', {
        urgency: 2,
        importance: 2,
        impact: 2,
        effort: 8, // High effort reduces priority
        dependencies: 5, // Many dependencies reduce priority
        strategicAlignment: 2,
      });

      expect(result.priority).toBe('low');
    });
  });

  describe('Recommendations', () => {
    it('provides quadrant-based recommendation for urgent-important', () => {
      const result = priorityAnalysisService.analyzePriority('r1', 'Urgent Important Task', {
        urgency: 9,
        importance: 9,
        impact: 8,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 8,
      });

      expect(result.recommendation.toLowerCase()).toContain('do first');
    });

    it('provides quadrant-based recommendation for not-urgent-important', () => {
      const result = priorityAnalysisService.analyzePriority('r2', 'Important Task', {
        urgency: 3,
        importance: 8,
        impact: 7,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 8,
      });

      expect(result.recommendation.toLowerCase()).toContain('schedule');
    });
  });

  describe('Rationale Generation', () => {
    it('includes deadline warning in rationale when urgent', () => {
      const result = priorityAnalysisService.analyzePriority('rat1', 'Urgent task', {
        urgency: 8,
        importance: 5,
        impact: 5,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 5,
      });

      expect(result.rationale.toLowerCase()).toContain('deadline');
    });

    it('includes business value in rationale when important', () => {
      const result = priorityAnalysisService.analyzePriority('rat2', 'Important task', {
        urgency: 5,
        importance: 9,
        impact: 5,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 5,
      });

      expect(result.rationale.toLowerCase()).toContain('business value');
    });

    it('mentions blockers when dependencies exist', () => {
      const result = priorityAnalysisService.analyzePriority('rat3', 'Blocked task', {
        urgency: 5,
        importance: 5,
        impact: 5,
        effort: 5,
        dependencies: 3,
        strategicAlignment: 5,
      });

      expect(result.rationale).toContain('3 blockers');
    });
  });

  describe('Score Calculations', () => {
    it('returns scores between 0 and 100', () => {
      const result = priorityAnalysisService.analyzePriority('s1', 'Score test', {
        urgency: 5,
        importance: 5,
        impact: 5,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 5,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.urgencyScore).toBeGreaterThanOrEqual(0);
      expect(result.importanceScore).toBeGreaterThanOrEqual(0);
      expect(result.impactScore).toBeGreaterThanOrEqual(0);
    });

    it('applies exponential weighting to urgency', () => {
      const low = priorityAnalysisService.analyzePriority('s2', 'Low urgency', {
        urgency: 3,
        importance: 5,
        impact: 5,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 5,
      });

      priorityAnalysisService.clearCache();

      const high = priorityAnalysisService.analyzePriority('s3', 'High urgency', {
        urgency: 9,
        importance: 5,
        impact: 5,
        effort: 5,
        dependencies: 0,
        strategicAlignment: 5,
      });

      // Exponential weighting means high urgency should have much higher score
      expect(high.urgencyScore).toBeGreaterThan(low.urgencyScore * 3);
    });
  });
});
