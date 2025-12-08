/**
 * Task Time Estimation Service
 * 
 * EPIC-006: Smart Productivity - STORY-028
 * 
 * AI-powered time estimation for tasks based on complexity,
 * team velocity, and historical data.
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskTimeEstimationService');

export interface EstimationFactors {
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'critical';
  teamVelocity?: number; // Historical avg tasks per hour
  riskLevel?: 'low' | 'medium' | 'high';
  dependencies?: number; // Number of dependent tasks
}

export interface TimeEstimate {
  mostLikelyMinutes: number;
  optimisticMinutes: number; // Best case
  pessimisticMinutes: number; // Worst case
  bufferPercentage: number; // Recommended buffer
  estimatedMinutes: number; // Final estimate with buffer
}

/**
 * Service for estimating task completion time
 * Uses three-point estimation (optimistic, likely, pessimistic)
 */
export class TaskTimeEstimationService {
  private static instance: TaskTimeEstimationService;
  private estimationCache = new Map<string, TimeEstimate>();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TaskTimeEstimationService {
    if (!TaskTimeEstimationService.instance) {
      TaskTimeEstimationService.instance = new TaskTimeEstimationService();
    }
    return TaskTimeEstimationService.instance;
  }

  /**
   * Estimate task time using three-point estimation
   */
  estimate(
    title: string,
    factors: EstimationFactors,
    userEstimate?: number
  ): TimeEstimate {
    const cacheKey = `${title}:${JSON.stringify(factors)}`;
    const cached = this.estimationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Base estimates for each complexity level
    const baseEstimates = {
      trivial: 15,      // Quick fixes
      simple: 30,       // Straightforward tasks
      moderate: 120,    // Standard features
      complex: 480,     // Complex features
      critical: 1440    // Multi-day work
    };

    const baseMinutes = baseEstimates[factors.complexity];

    // Three-point estimation
    const optimistic = this.calculateOptimistic(baseMinutes, factors);
    const likely = this.calculateLikely(baseMinutes, factors, userEstimate);
    const pessimistic = this.calculatePessimistic(baseMinutes, factors);

    // PERT formula: (optimistic + 4*likely + pessimistic) / 6
    const expectedValue = (optimistic + 4 * likely + pessimistic) / 6;

    // Determine buffer percentage
    const buffer = this.calculateBuffer(factors);
    const bufferedMinutes = Math.round(expectedValue * (1 + buffer / 100));

    const estimate: TimeEstimate = {
      mostLikelyMinutes: likely,
      optimisticMinutes: optimistic,
      pessimisticMinutes: pessimistic,
      bufferPercentage: buffer,
      estimatedMinutes: bufferedMinutes,
    };

    // Cache result
    this.estimationCache.set(cacheKey, estimate);
    setTimeout(() => this.estimationCache.delete(cacheKey), this.CACHE_TTL);

    logger.debug(`Estimated task: ${title} - ${bufferedMinutes} minutes`);
    return estimate;
  }

  /**
   * Calculate optimistic estimate (best case)
   */
  private calculateOptimistic(
    baseMinutes: number,
    factors: EstimationFactors
  ): number {
    let optimistic = baseMinutes * 0.5; // 50% of base time

    // Adjust for risk level
    if (factors.riskLevel === 'high') {
      optimistic *= 1.3; // Higher optimistic for risky tasks
    }

    return Math.round(optimistic);
  }

  /**
   * Calculate likely estimate (most probable)
   */
  private calculateLikely(
    baseMinutes: number,
    factors: EstimationFactors,
    userEstimate?: number
  ): number {
    let likely = baseMinutes;

    // Apply team velocity factor
    if (factors.teamVelocity && factors.teamVelocity > 0) {
      likely = Math.round(60 / factors.teamVelocity); // Convert tasks/hour to minutes per task
    }

    // Adjust for dependencies
    if (factors.dependencies && factors.dependencies > 0) {
      likely *= (1 + factors.dependencies * 0.1); // 10% per dependency
    }

    // Consider user estimate if provided
    if (userEstimate && userEstimate > 0) {
      likely = (likely + userEstimate) / 2; // Average with user estimate
    }

    return Math.round(likely);
  }

  /**
   * Calculate pessimistic estimate (worst case)
   */
  private calculatePessimistic(
    baseMinutes: number,
    factors: EstimationFactors
  ): number {
    let pessimistic = baseMinutes * 2.5; // 2.5x base time for worst case

    // Adjust for risk level
    if (factors.riskLevel === 'high') {
      pessimistic *= 1.5; // Even worse for high-risk tasks
    } else if (factors.riskLevel === 'low') {
      pessimistic *= 1.2; // Better for low-risk tasks
    }

    return Math.round(pessimistic);
  }

  /**
   * Calculate recommended buffer percentage
   */
  private calculateBuffer(factors: EstimationFactors): number {
    let buffer = 15; // Base 15% buffer

    // Risk-based buffer
    switch (factors.riskLevel) {
      case 'low':
        buffer = 10;
        break;
      case 'medium':
        buffer = 20;
        break;
      case 'high':
        buffer = 30;
        break;
    }

    // Complexity-based adjustment
    switch (factors.complexity) {
      case 'trivial':
        buffer += 5;
        break;
      case 'complex':
        buffer += 10;
        break;
      case 'critical':
        buffer += 20;
        break;
    }

    // Dependencies increase buffer
    if (factors.dependencies && factors.dependencies > 0) {
      buffer += Math.min(factors.dependencies * 5, 15); // Max 15% additional
    }

    return Math.min(buffer, 50); // Cap at 50%
  }

  /**
   * Get estimation statistics for task patterns
   */
  getStatistics(): {
    totalEstimates: number;
    cacheSize: number;
  } {
    return {
      totalEstimates: this.estimationCache.size,
      cacheSize: this.estimationCache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.estimationCache.clear();
    logger.debug('Estimation cache cleared');
  }
}

export const taskTimeEstimationService = TaskTimeEstimationService.getInstance();
