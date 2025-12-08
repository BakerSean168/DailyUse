import { describe, it, expect, beforeEach } from 'vitest';
import { taskDecompositionService } from '../TaskDecompositionService';

describe('TaskDecompositionService', () => {
  beforeEach(() => {
    taskDecompositionService.clearCache();
  });

  it('should decompose a simple task into subtasks', () => {
    const result = taskDecompositionService.decompose({
      title: 'Write documentation',
      description: 'Create README for new feature',
      estimatedMinutes: 120,
    });

    expect(result.subtasks.length).toBeGreaterThan(0);
    expect(result.timeline.totalEstimatedMinutes).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should cache decomposition results', () => {
    const first = taskDecompositionService.decompose({ title: 'Build API' });
    const second = taskDecompositionService.decompose({ title: 'Build API' });
    expect(first).toBe(second);
  });
});
