/**
 * Priority Analysis Service
 * 
 * EPIC-006: Smart Productivity - STORY-029
 * 
 * Multi-factor priority scoring for tasks based on
 * urgency, importance, impact, and strategic alignment.
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('PriorityAnalysisService');

export interface PriorityFactors {
  urgency: number; // 0-10, deadline proximity
  importance: number; // 0-10, business value
  impact: number; // 0-10, consequence of non-completion
  effort: number; // 0-10, implementation difficulty
  dependencies: number; // 0-10, number of blocking tasks
  strategicAlignment: number; // 0-10, alignment with goals
}

export interface PriorityScore {
  overallScore: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  urgencyScore: number;
  importanceScore: number;
  impactScore: number;
  effortScore: number;
  recommendation: string;
  rationale: string;
}

/**
 * Service for analyzing and scoring task priorities
 * Uses weighted multi-factor analysis (Eisenhower Matrix inspired)
 */
export class PriorityAnalysisService {
  private static instance: PriorityAnalysisService;
  private priorityCache = new Map<string, PriorityScore>();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PriorityAnalysisService {
    if (!PriorityAnalysisService.instance) {
      PriorityAnalysisService.instance = new PriorityAnalysisService();
    }
    return PriorityAnalysisService.instance;
  }

  /**
   * Analyze and score task priority
   */
  analyzePriority(
    taskId: string,
    taskTitle: string,
    factors: PriorityFactors
  ): PriorityScore {
    const cacheKey = `${taskId}:${JSON.stringify(factors)}`;
    const cached = this.priorityCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate weighted scores
    const urgencyScore = this.scoreUrgency(factors.urgency);
    const importanceScore = this.scoreImportance(factors.importance);
    const impactScore = this.scoreImpact(factors.impact);
    const effortScore = this.scoreEffort(factors.effort);
    const dependencyScore = this.scoreDependencies(factors.dependencies);
    const alignmentScore = this.scoreAlignment(factors.strategicAlignment);

    // Weighted calculation (weights sum to 1.0)
    const weights = {
      urgency: 0.25,
      importance: 0.25,
      impact: 0.20,
      effort: -0.15, // Negative because high effort reduces priority
      dependencies: -0.10, // Blocking tasks reduce priority
      alignment: 0.15,
    } as const;

    const overallScore = Math.round(
      urgencyScore * weights.urgency +
      importanceScore * weights.importance +
      impactScore * weights.impact +
      effortScore * weights.effort +
      dependencyScore * weights.dependencies +
      alignmentScore * weights.alignment
    );

    // Clamp to 0-100
    const clampedScore = Math.max(0, Math.min(100, overallScore));

    // Determine priority level
    const priority = this.determinePriority(clampedScore, factors);
    const recommendation = this.generateRecommendation(priority, clampedScore, factors);
    const rationale = this.generateRationale(factors, priority);

    const score: PriorityScore = {
      overallScore: clampedScore,
      priority,
      urgencyScore,
      importanceScore,
      impactScore,
      effortScore,
      recommendation,
      rationale,
    };

    // Cache result
    this.priorityCache.set(cacheKey, score);
    setTimeout(() => this.priorityCache.delete(cacheKey), this.CACHE_TTL);

    logger.debug(`Analyzed priority for: ${taskTitle} - Score: ${clampedScore}`);
    return score;
  }

  /**
   * Score urgency factor
   */
  private scoreUrgency(urgency: number): number {
    return Math.min(100, urgency * urgency); // Exponential weighting
  }

  /**
   * Score importance factor
   */
  private scoreImportance(importance: number): number {
    return Math.min(100, importance * 10);
  }

  /**
   * Score impact factor
   */
  private scoreImpact(impact: number): number {
    return Math.min(100, impact * 10);
  }

  /**
   * Score effort factor (inverted - high effort reduces priority)
   */
  private scoreEffort(effort: number): number {
    return Math.max(0, 100 - effort * 10);
  }

  /**
   * Score dependency factor
   */
  private scoreDependencies(dependencies: number): number {
    return Math.max(0, 100 - dependencies * 10);
  }

  /**
   * Score strategic alignment
   */
  private scoreAlignment(alignment: number): number {
    return Math.min(100, alignment * 10);
  }

  /**
   * Determine priority level from score
   */
  private determinePriority(
    score: number,
    factors: PriorityFactors
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (factors.urgency >= 8 && factors.importance >= 8) {
      return 'critical';
    }

    if (score >= 70 && factors.dependencies < 5) {
      return 'high';
    }

    if (score >= 40) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate priority recommendation
   */
  private generateRecommendation(
    priority: 'critical' | 'high' | 'medium' | 'low',
    score: number,
    factors: PriorityFactors
  ): string {
    switch (priority) {
      case 'critical':
        return 'Start immediately - this is a critical task';
      case 'high':
        if (factors.effort > 7) {
          return 'Important but high effort - break into subtasks first';
        }
        return 'Schedule early - important task';
      case 'medium':
        if (factors.dependencies > 0) {
          return 'Schedule after dependencies clear';
        }
        return 'Schedule after urgent items';
      case 'low':
        return 'Low priority - handle after higher priority items';
      default:
        return 'Reassess priority factors';
    }
  }

  /**
   * Generate priority rationale
   */
  private generateRationale(
    factors: PriorityFactors,
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): string {
    const parts: string[] = [];

    if (factors.urgency >= 7) parts.push('deadline is near');
    if (factors.importance >= 8) parts.push('high business value');
    if (factors.impact >= 7) parts.push('high impact');
    if (factors.effort <= 3) parts.push('quick to complete');
    if (factors.effort >= 8) parts.push('high effort');
    if (factors.dependencies > 0) parts.push(`${factors.dependencies} blockers`);
    if (factors.strategicAlignment >= 8) parts.push('strongly aligned');

    return parts.join(', ') || 'Standard task';
  }

  /**
   * Compare priorities between multiple tasks
   */
  compareTasks(
    tasks: Array<{ id: string; title: string; factors: PriorityFactors }>
  ): Array<{ id: string; score: number }> {
    return tasks
      .map(task => ({
        id: task.id,
        score: this.analyzePriority(task.id, task.title, task.factors).overallScore,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.priorityCache.clear();
    logger.debug('Priority cache cleared');
  }
}

export const priorityAnalysisService = PriorityAnalysisService.getInstance();
