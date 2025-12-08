/**
 * Task Decomposition Service
 * 
 * EPIC-006: Smart Productivity - STORY-027
 * 
 * AI-powered task decomposition for breaking down complex tasks
 * into manageable subtasks with automatic estimation and ordering.
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskDecompositionService');

export interface DecomposedTask {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  difficulty: 'simple' | 'moderate' | 'complex';
  dependencies: string[]; // IDs of tasks that must be completed first
  suggestedOrder: number;
  tags?: string[];
}

export interface DecompositionResult {
  originalTask: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
  };
  subtasks: DecomposedTask[];
  timeline: {
    totalEstimatedMinutes: number;
    estimatedDays: number;
    criticalPath: string[]; // Most important/longest dependency chain
  };
  risks: string[];
  confidence: number; // 0-100
}

/**
 * Service for decomposing complex tasks into subtasks
 * Uses AI-like heuristics for realistic estimation
 */
export class TaskDecompositionService {
  private static instance: TaskDecompositionService;
  private decompositionCache = new Map<string, DecompositionResult>();
  private readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutes

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TaskDecompositionService {
    if (!TaskDecompositionService.instance) {
      TaskDecompositionService.instance = new TaskDecompositionService();
    }
    return TaskDecompositionService.instance;
  }

  /**
   * Decompose a task into subtasks
   */
  decompose(task: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
  }): DecompositionResult {
    const cacheKey = `${task.title}:${task.description || ''}`;
    const cached = this.decompositionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const complexity = this.assessComplexity(task);
    const subtasks = this.generateSubtasks(task, complexity);
    const timeline = this.calculateTimeline(subtasks, task.estimatedMinutes);
    const risks = this.identifyRisks(task, subtasks);
    const confidence = this.calculateConfidence(task, subtasks);

    const result: DecompositionResult = {
      originalTask: task,
      subtasks,
      timeline,
      risks,
      confidence,
    };

    // Cache the result
    this.decompositionCache.set(cacheKey, result);
    setTimeout(() => this.decompositionCache.delete(cacheKey), this.CACHE_TTL);

    logger.debug(`Decomposed task: ${task.title} into ${subtasks.length} subtasks`);
    return result;
  }

  /**
   * Assess task complexity based on description
   */
  private assessComplexity(task: {
    title: string;
    description?: string;
  }): 'simple' | 'moderate' | 'complex' {
    const content = `${task.title} ${task.description || ''}`.toLowerCase();
    
    // Complex indicators
    const complexKeywords = [
      'integration', 'multiple', 'complex', 'system',
      'architecture', 'design', 'refactor', 'optimize'
    ];
    const moderateKeywords = [
      'implement', 'develop', 'create', 'build', 'feature'
    ];

    const complexCount = complexKeywords.filter(k => content.includes(k)).length;
    const moderateCount = moderateKeywords.filter(k => content.includes(k)).length;

    if (complexCount >= 2) return 'complex';
    if (moderateCount >= 2 || complexCount >= 1) return 'moderate';
    return 'simple';
  }

  /**
   * Generate subtasks based on task complexity
   */
  private generateSubtasks(
    task: { title: string; description?: string },
    complexity: 'simple' | 'moderate' | 'complex'
  ): DecomposedTask[] {
    const subtasks: DecomposedTask[] = [];
    const count = complexity === 'complex' ? 5 : complexity === 'moderate' ? 3 : 2;

    // Generate default subtask structure
    const baseSubtasks = {
      simple: ['Complete main task'],
      moderate: [
        'Plan and design approach',
        'Implement core functionality',
        'Test and validate'
      ],
      complex: [
        'Analyze requirements and design solution',
        'Set up development environment',
        'Implement core features',
        'Integration and testing',
        'Optimization and documentation'
      ]
    };

    const templates = baseSubtasks[complexity];
    let cumulativeMinutes = 0;

    templates.forEach((template, index) => {
      const baseMinutes = this.estimateSubtaskTime(complexity, index, templates.length);
      const subtask: DecomposedTask = {
        id: `subtask-${index}`,
        title: template,
        estimatedMinutes: baseMinutes,
        difficulty: complexity,
        dependencies: index > 0 ? [`subtask-${index - 1}`] : [],
        suggestedOrder: index + 1,
        tags: this.generateTags(task.title, template),
      };
      subtasks.push(subtask);
      cumulativeMinutes += baseMinutes;
    });

    return subtasks;
  }

  /**
   * Estimate individual subtask time
   */
  private estimateSubtaskTime(
    complexity: 'simple' | 'moderate' | 'complex',
    index: number,
    total: number
  ): number {
    const baseMinutes = {
      simple: 30,
      moderate: 60,
      complex: 120
    };

    const base = baseMinutes[complexity];
    
    // First subtask (analysis) takes more time
    if (index === 0) return Math.round(base * 1.2);
    
    // Last subtask (testing/validation) also takes more time
    if (index === total - 1) return Math.round(base * 1.1);
    
    return base;
  }

  /**
   * Calculate overall timeline
   */
  private calculateTimeline(
    subtasks: DecomposedTask[],
    userEstimate?: number
  ): DecompositionResult['timeline'] {
    const totalMinutes = subtasks.reduce((sum, st) => sum + st.estimatedMinutes, 0);
    
    // Apply buffer for realistic estimation (20% overhead)
    const bufferedMinutes = Math.round(totalMinutes * 1.2);
    
    // Consider user's initial estimate
    const finalMinutes = userEstimate 
      ? Math.max(bufferedMinutes, userEstimate)
      : bufferedMinutes;

    return {
      totalEstimatedMinutes: finalMinutes,
      estimatedDays: Math.ceil(finalMinutes / (8 * 60)), // 8-hour workday
      criticalPath: this.computeCriticalPath(subtasks),
    };
  }

  /**
   * Compute the longest dependency chain as the critical path
   */
  private computeCriticalPath(subtasks: DecomposedTask[]): string[] {
    const byId = new Map(subtasks.map(st => [st.id, st]));
    const memo = new Map<string, string[]>();

    const dfs = (id: string, stack: Set<string>): string[] => {
      if (memo.has(id)) return memo.get(id)!;
      if (stack.has(id)) return [id]; // Cycle guard, should not happen with generated tasks

      const task = byId.get(id);
      if (!task || task.dependencies.length === 0) {
        const path = [id];
        memo.set(id, path);
        return path;
      }

      stack.add(id);
      let bestPath: string[] = [];
      for (const dep of task.dependencies) {
        const candidate = dfs(dep, stack);
        if (candidate.length > bestPath.length) {
          bestPath = candidate;
        }
      }
      stack.delete(id);

      const fullPath = [...bestPath, id];
      memo.set(id, fullPath);
      return fullPath;
    };

    let critical: string[] = [];
    for (const st of subtasks) {
      const path = dfs(st.id, new Set());
      if (path.length > critical.length) {
        critical = path;
      }
    }

    return critical;
  }

  /**
   * Identify potential risks
   */
  private identifyRisks(
    task: { title: string; description?: string },
    subtasks: DecomposedTask[]
  ): string[] {
    const risks: string[] = [];
    const content = `${task.title} ${task.description || ''}`.toLowerCase();

    // Risk detection heuristics
    if (subtasks.length > 5) {
      risks.push('Task is complex with many subtasks - consider breaking into smaller features');
    }

    if (content.includes('integration') || content.includes('api')) {
      risks.push('Integration work - ensure external dependencies are available');
    }

    if (content.includes('refactor') || content.includes('legacy')) {
      risks.push('Refactoring work - may have unexpected side effects');
    }

    if (subtasks.some(st => st.dependencies.length > 1)) {
      risks.push('Multiple task dependencies - coordinate dependencies carefully');
    }

    return risks;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    task: { title: string; description?: string },
    subtasks: DecomposedTask[]
  ): number {
    let confidence = 80; // Base confidence

    // Adjust based on task clarity
    const description = task.description || '';
    if (!description || description.length < 20) {
      confidence -= 10; // Low confidence with unclear requirements
    } else if (description.length > 200) {
      confidence += 5; // Higher confidence with detailed requirements
    }

    // Adjust based on subtask structure
    if (subtasks.length < 2 || subtasks.length > 10) {
      confidence -= 10; // Unusual breakdown
    }

    // Cap at 0-100
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generate relevant tags for subtasks
   */
  private generateTags(title: string, subtaskTitle: string): string[] {
    const tags: string[] = [];

    // Extract domain from title
    if (title.toLowerCase().includes('api')) tags.push('backend');
    if (title.toLowerCase().includes('ui') || title.toLowerCase().includes('component')) tags.push('frontend');
    if (title.toLowerCase().includes('test')) tags.push('testing');
    if (title.toLowerCase().includes('doc')) tags.push('documentation');

    // Based on subtask
    if (subtaskTitle.toLowerCase().includes('design')) tags.push('design');
    if (subtaskTitle.toLowerCase().includes('implement')) tags.push('implementation');
    if (subtaskTitle.toLowerCase().includes('test')) tags.push('testing');
    if (subtaskTitle.toLowerCase().includes('optimize')) tags.push('optimization');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.decompositionCache.clear();
    logger.debug('Cache cleared');
  }
}

export const taskDecompositionService = TaskDecompositionService.getInstance();
