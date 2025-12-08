import { describe, it, expect, beforeEach } from 'vitest';
import { taskDecompositionService } from '../TaskDecompositionService';

describe('TaskDecompositionService', () => {
  beforeEach(() => {
    taskDecompositionService.clearCache();
  });

  describe('Basic Decomposition', () => {
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

    it('should include decomposition type in result', () => {
      const result = taskDecompositionService.decompose({
        title: 'Implement new feature',
      });

      expect(result.decompositionType).toBeDefined();
      expect(['generic', 'development', 'learning', 'project']).toContain(result.decompositionType);
    });
  });

  describe('Decomposition Type Detection', () => {
    it('should detect development tasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Implement user authentication API',
        description: 'Code the login feature with tests',
      });

      expect(result.decompositionType).toBe('development');
    });

    it('should detect learning tasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Learn TypeScript advanced features',
        description: 'Study generics and practice with tutorials',
      });

      expect(result.decompositionType).toBe('learning');
    });

    it('should detect project tasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Project planning for Q1 release',
        description: 'Define milestones and deliverables',
      });

      expect(result.decompositionType).toBe('project');
    });

    it('should fallback to generic for ambiguous tasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Do something',
      });

      expect(result.decompositionType).toBe('generic');
    });
  });

  describe('Complexity Assessment', () => {
    it('should generate fewer subtasks for simple tasks', () => {
      const simple = taskDecompositionService.decompose({
        title: 'Fix typo',
      });

      taskDecompositionService.clearCache();

      const complex = taskDecompositionService.decompose({
        title: 'Design and implement complex integration system',
        description: 'Requires architecture refactor and optimization',
      });

      expect(simple.subtasks.length).toBeLessThan(complex.subtasks.length);
    });

    it('should assign difficulty to subtasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Build feature',
      });

      result.subtasks.forEach(subtask => {
        expect(['simple', 'moderate', 'complex']).toContain(subtask.difficulty);
      });
    });
  });

  describe('Subtask Structure', () => {
    it('should include category for each subtask', () => {
      const result = taskDecompositionService.decompose({
        title: 'Implement API endpoint',
      });

      result.subtasks.forEach(subtask => {
        expect(subtask.category).toBeDefined();
        expect(['planning', 'development', 'testing', 'documentation', 'review']).toContain(subtask.category);
      });
    });

    it('should generate unique subtask IDs', () => {
      const result = taskDecompositionService.decompose({
        title: 'Complex task',
        description: 'Multiple integration points',
      });

      const ids = result.subtasks.map(st => st.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should set dependencies correctly', () => {
      const result = taskDecompositionService.decompose({
        title: 'Build feature with tests',
      });

      // First subtask should have no dependencies
      expect(result.subtasks[0].dependencies.length).toBe(0);

      // Subsequent subtasks should depend on previous
      for (let i = 1; i < result.subtasks.length; i++) {
        expect(result.subtasks[i].dependencies).toContain(result.subtasks[i - 1].id);
      }
    });
  });

  describe('Timeline Calculation', () => {
    it('should calculate total estimated minutes', () => {
      const result = taskDecompositionService.decompose({
        title: 'Task with timeline',
      });

      expect(result.timeline.totalEstimatedMinutes).toBeGreaterThan(0);
    });

    it('should calculate estimated days based on 8-hour workday', () => {
      const result = taskDecompositionService.decompose({
        title: 'Long complex integration task',
        description: 'Requires architecture design and optimization',
      });

      expect(result.timeline.estimatedDays).toBeGreaterThanOrEqual(1);
    });

    it('should compute critical path', () => {
      const result = taskDecompositionService.decompose({
        title: 'Task with dependencies',
      });

      expect(result.timeline.criticalPath).toBeDefined();
      expect(Array.isArray(result.timeline.criticalPath)).toBe(true);
      expect(result.timeline.criticalPath.length).toBeGreaterThan(0);
    });

    it('should find parallelizable groups', () => {
      const result = taskDecompositionService.decompose({
        title: 'Complex development task',
        description: 'Requires multiple integration points',
      });

      expect(result.timeline.parallelizableGroups).toBeDefined();
      expect(Array.isArray(result.timeline.parallelizableGroups)).toBe(true);
    });

    it('should respect user estimate as minimum', () => {
      const result = taskDecompositionService.decompose({
        title: 'Quick task',
        estimatedMinutes: 500, // High user estimate
      });

      expect(result.timeline.totalEstimatedMinutes).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Risk Identification', () => {
    it('should identify integration risks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Build API integration',
      });

      expect(result.risks.some(r => r.toLowerCase().includes('integration'))).toBe(true);
    });

    it('should identify refactoring risks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Refactor legacy code',
      });

      expect(result.risks.some(r => r.toLowerCase().includes('refactor'))).toBe(true);
    });

    it('should warn about many subtasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Very complex system design and architecture integration',
        description: 'Multiple refactoring and optimization required',
      });

      // Complex tasks may trigger many-subtasks warning
      if (result.subtasks.length > 5) {
        expect(result.risks.some(r => r.toLowerCase().includes('complex') || r.toLowerCase().includes('many'))).toBe(true);
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should return confidence between 0 and 100', () => {
      const result = taskDecompositionService.decompose({
        title: 'Any task',
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should have lower confidence for tasks without description', () => {
      const withoutDesc = taskDecompositionService.decompose({
        title: 'Task only',
      });

      taskDecompositionService.clearCache();

      const withDesc = taskDecompositionService.decompose({
        title: 'Task only',
        description: 'This is a very detailed description that explains exactly what needs to be done with clear requirements and acceptance criteria',
      });

      expect(withDesc.confidence).toBeGreaterThan(withoutDesc.confidence);
    });
  });

  describe('Tags Generation', () => {
    it('should generate relevant tags for subtasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Build API with tests and documentation',
      });

      const allTags = result.subtasks.flatMap(st => st.tags || []);
      expect(allTags.length).toBeGreaterThan(0);
    });

    it('should detect backend tasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Build API endpoint',
      });

      const allTags = result.subtasks.flatMap(st => st.tags || []);
      expect(allTags).toContain('backend');
    });

    it('should detect frontend tasks', () => {
      const result = taskDecompositionService.decompose({
        title: 'Build UI component',
      });

      const allTags = result.subtasks.flatMap(st => st.tags || []);
      expect(allTags).toContain('frontend');
    });
  });
});
