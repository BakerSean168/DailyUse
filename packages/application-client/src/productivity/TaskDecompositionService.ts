/**
 * Task Decomposition Service
 * 
 * EPIC-006: Smart Productivity - STORY-027
 * 
 * AI-powered task decomposition for breaking down complex tasks
 * into manageable subtasks with automatic estimation and ordering.
 * 
 * Features:
 * - Intelligent complexity assessment
 * - Domain-aware subtask generation
 * - Critical path calculation
 * - Risk identification
 * - Confidence scoring
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
  category?: 'planning' | 'development' | 'testing' | 'documentation' | 'review';
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
    parallelizableGroups: string[][]; // Tasks that can be done in parallel
  };
  risks: string[];
  confidence: number; // 0-100
  decompositionType: 'generic' | 'development' | 'learning' | 'project';
}

/** Keywords indicating task domain for smarter decomposition */
interface DomainKeywords {
  development: string[];
  learning: string[];
  project: string[];
  documentation: string[];
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

    const decompositionType = this.detectDecompositionType(task);
    const complexity = this.assessComplexity(task);
    const subtasks = this.generateSubtasks(task, complexity, decompositionType);
    const timeline = this.calculateTimeline(subtasks, task.estimatedMinutes);
    const risks = this.identifyRisks(task, subtasks);
    const confidence = this.calculateConfidence(task, subtasks);

    const result: DecompositionResult = {
      originalTask: task,
      subtasks,
      timeline,
      risks,
      confidence,
      decompositionType,
    };

    // Cache the result
    this.decompositionCache.set(cacheKey, result);
    setTimeout(() => this.decompositionCache.delete(cacheKey), this.CACHE_TTL);

    logger.debug(`Decomposed task: ${task.title} into ${subtasks.length} subtasks (type: ${decompositionType})`);
    return result;
  }

  /**
   * Detect the type of decomposition needed based on task content
   */
  private detectDecompositionType(task: {
    title: string;
    description?: string;
  }): 'generic' | 'development' | 'learning' | 'project' {
    const content = `${task.title} ${task.description || ''}`.toLowerCase();

    const domainKeywords: DomainKeywords = {
      development: ['implement', 'develop', 'code', 'api', 'feature', 'bug', 'fix', 'refactor', 'test', 'deploy'],
      learning: ['learn', 'study', 'course', 'tutorial', 'practice', 'read', 'understand', 'master'],
      project: ['project', 'plan', 'milestone', 'phase', 'deliver', 'launch', 'release'],
      documentation: ['document', 'write', 'spec', 'readme', 'guide', 'manual'],
    };

    const scores = {
      development: domainKeywords.development.filter(k => content.includes(k)).length,
      learning: domainKeywords.learning.filter(k => content.includes(k)).length,
      project: domainKeywords.project.filter(k => content.includes(k)).length,
    };

    const maxScore = Math.max(scores.development, scores.learning, scores.project);
    
    if (maxScore === 0) return 'generic';
    if (scores.development === maxScore) return 'development';
    if (scores.learning === maxScore) return 'learning';
    if (scores.project === maxScore) return 'project';
    
    return 'generic';
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
   * Generate subtasks based on task complexity and decomposition type
   */
  private generateSubtasks(
    task: { title: string; description?: string },
    complexity: 'simple' | 'moderate' | 'complex',
    decompositionType: 'generic' | 'development' | 'learning' | 'project' = 'generic'
  ): DecomposedTask[] {
    const subtasks: DecomposedTask[] = [];

    // Domain-specific subtask templates
    const templatesByType = {
      generic: {
        simple: [
          { title: 'Complete main task', category: 'development' as const }
        ],
        moderate: [
          { title: 'Plan and design approach', category: 'planning' as const },
          { title: 'Implement core functionality', category: 'development' as const },
          { title: 'Test and validate', category: 'testing' as const }
        ],
        complex: [
          { title: 'Analyze requirements and design solution', category: 'planning' as const },
          { title: 'Set up development environment', category: 'development' as const },
          { title: 'Implement core features', category: 'development' as const },
          { title: 'Integration and testing', category: 'testing' as const },
          { title: 'Optimization and documentation', category: 'documentation' as const }
        ]
      },
      development: {
        simple: [
          { title: 'Implement and test', category: 'development' as const }
        ],
        moderate: [
          { title: 'Review requirements and plan approach', category: 'planning' as const },
          { title: 'Write implementation code', category: 'development' as const },
          { title: 'Write unit tests', category: 'testing' as const },
          { title: 'Code review and refinement', category: 'review' as const }
        ],
        complex: [
          { title: 'Technical design and architecture', category: 'planning' as const },
          { title: 'Set up project structure', category: 'development' as const },
          { title: 'Implement core logic', category: 'development' as const },
          { title: 'Implement edge cases and error handling', category: 'development' as const },
          { title: 'Write comprehensive tests', category: 'testing' as const },
          { title: 'Integration testing', category: 'testing' as const },
          { title: 'Documentation and review', category: 'documentation' as const }
        ]
      },
      learning: {
        simple: [
          { title: 'Read and practice', category: 'development' as const }
        ],
        moderate: [
          { title: 'Study core concepts', category: 'planning' as const },
          { title: 'Practice with examples', category: 'development' as const },
          { title: 'Review and consolidate', category: 'review' as const }
        ],
        complex: [
          { title: 'Gather learning resources', category: 'planning' as const },
          { title: 'Study foundational concepts', category: 'development' as const },
          { title: 'Work through tutorials', category: 'development' as const },
          { title: 'Build practice project', category: 'development' as const },
          { title: 'Review and create notes', category: 'documentation' as const }
        ]
      },
      project: {
        simple: [
          { title: 'Execute project task', category: 'development' as const }
        ],
        moderate: [
          { title: 'Define scope and requirements', category: 'planning' as const },
          { title: 'Execute main deliverables', category: 'development' as const },
          { title: 'Review and deliver', category: 'review' as const }
        ],
        complex: [
          { title: 'Project planning and scoping', category: 'planning' as const },
          { title: 'Resource allocation', category: 'planning' as const },
          { title: 'Phase 1 execution', category: 'development' as const },
          { title: 'Phase 2 execution', category: 'development' as const },
          { title: 'Quality assurance', category: 'testing' as const },
          { title: 'Delivery and handoff', category: 'review' as const }
        ]
      }
    };

    const templates = templatesByType[decompositionType][complexity];

    templates.forEach((template, index) => {
      const baseMinutes = this.estimateSubtaskTime(complexity, index, templates.length);
      const subtask: DecomposedTask = {
        id: `subtask-${index}`,
        title: template.title,
        estimatedMinutes: baseMinutes,
        difficulty: complexity,
        dependencies: index > 0 ? [`subtask-${index - 1}`] : [],
        suggestedOrder: index + 1,
        tags: this.generateTags(task.title, template.title),
        category: template.category,
      };
      subtasks.push(subtask);
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
      parallelizableGroups: this.findParallelizableGroups(subtasks),
    };
  }

  /**
   * Find groups of tasks that can be executed in parallel
   * Tasks with no dependencies on each other can be parallelized
   */
  private findParallelizableGroups(subtasks: DecomposedTask[]): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    // Group tasks by their dependency depth
    const depthMap = new Map<string, number>();
    
    const calculateDepth = (taskId: string): number => {
      if (depthMap.has(taskId)) return depthMap.get(taskId)!;
      
      const task = subtasks.find(st => st.id === taskId);
      if (!task || task.dependencies.length === 0) {
        depthMap.set(taskId, 0);
        return 0;
      }

      const maxDepth = Math.max(
        ...task.dependencies.map(dep => calculateDepth(dep) + 1)
      );
      depthMap.set(taskId, maxDepth);
      return maxDepth;
    };

    // Calculate depth for all tasks
    subtasks.forEach(st => calculateDepth(st.id));

    // Group by depth (tasks at same depth can be parallelized)
    const maxDepth = Math.max(...Array.from(depthMap.values()));
    for (let depth = 0; depth <= maxDepth; depth++) {
      const group = subtasks
        .filter(st => depthMap.get(st.id) === depth)
        .map(st => st.id);
      if (group.length > 0) {
        groups.push(group);
      }
    }

    return groups;
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
