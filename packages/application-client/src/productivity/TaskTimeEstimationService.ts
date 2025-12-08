/**
 * Task Time Estimation Service
 * 
 * EPIC-006: Smart Productivity - STORY-028
 * 
 * AI-powered time estimation for tasks based on complexity,
 * team velocity, and historical data.
 * 
 * Features:
 * - Three-point estimation (PERT)
 * - Confidence interval calculation
 * - Time-of-day efficiency factors
 * - Historical data analysis hooks
 * - Similar task matching preparation
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskTimeEstimationService');

export interface EstimationFactors {
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'critical';
  teamVelocity?: number; // Historical avg tasks per hour
  riskLevel?: 'low' | 'medium' | 'high';
  dependencies?: number; // Number of dependent tasks
  tags?: string[]; // Task tags for similarity matching
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface ConfidenceInterval {
  min: number; // Optimistic - 2 std dev
  max: number; // Pessimistic + 2 std dev
  confidence: number; // 0-1, how confident we are
}

export interface TimeEstimate {
  mostLikelyMinutes: number;
  optimisticMinutes: number; // Best case
  pessimisticMinutes: number; // Worst case
  bufferPercentage: number; // Recommended buffer
  estimatedMinutes: number; // Final estimate with buffer
  confidenceInterval: ConfidenceInterval; // Statistical confidence
  timeOfDayFactor: number; // Efficiency factor based on time
  basedOn: {
    similarTasksCount: number;
    userHistoryDays: number;
  };
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

    // Calculate standard deviation: (pessimistic - optimistic) / 6
    const stdDev = (pessimistic - optimistic) / 6;

    // Determine buffer percentage
    const buffer = this.calculateBuffer(factors);
    const bufferedMinutes = Math.round(expectedValue * (1 + buffer / 100));

    // Calculate time-of-day efficiency factor
    const timeOfDayFactor = this.getTimeOfDayFactor(factors.timeOfDay);

    // Apply time-of-day adjustment to final estimate
    const adjustedMinutes = Math.round(bufferedMinutes / timeOfDayFactor);

    // Calculate confidence interval (±2 std dev = 95% confidence)
    const confidenceInterval = this.calculateConfidenceInterval(
      expectedValue,
      stdDev,
      factors
    );

    // Get similar tasks info (stub for future implementation)
    const similarTasksInfo = this.getSimilarTasksInfo(title, factors.tags);

    const estimate: TimeEstimate = {
      mostLikelyMinutes: likely,
      optimisticMinutes: optimistic,
      pessimisticMinutes: pessimistic,
      bufferPercentage: buffer,
      estimatedMinutes: adjustedMinutes,
      confidenceInterval,
      timeOfDayFactor,
      basedOn: similarTasksInfo,
    };

    // Cache result
    this.estimationCache.set(cacheKey, estimate);
    setTimeout(() => this.estimationCache.delete(cacheKey), this.CACHE_TTL);

    logger.debug(`Estimated task: ${title} - ${adjustedMinutes} minutes (factor: ${timeOfDayFactor})`);
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
   * Calculate time-of-day efficiency factor
   * Morning hours are typically most productive
   * 
   * @param timeOfDay - Optional time of day override
   * @returns Efficiency factor (1.0 = baseline, >1 = more efficient)
   */
  private getTimeOfDayFactor(timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'): number {
    const tod = timeOfDay || this.getCurrentTimeOfDay();
    
    switch (tod) {
      case 'morning':
        return 1.0;   // Peak efficiency (baseline)
      case 'afternoon':
        return 0.85;  // Post-lunch dip
      case 'evening':
        return 0.75;  // Fatigue sets in
      case 'night':
        return 0.65;  // Low efficiency
      default:
        return 0.9;   // Default moderate efficiency
    }
  }

  /**
   * Get current time of day classification
   */
  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Calculate confidence interval for the estimate
   * Uses statistical approach based on three-point estimation variance
   * 
   * @param expectedValue - PERT expected value
   * @param stdDev - Standard deviation from three-point estimation
   * @param factors - Estimation factors affecting confidence
   */
  private calculateConfidenceInterval(
    expectedValue: number,
    stdDev: number,
    factors: EstimationFactors
  ): ConfidenceInterval {
    // Base confidence interval: ±2 standard deviations (95% confidence)
    const baseMin = Math.round(Math.max(0, expectedValue - 2 * stdDev));
    const baseMax = Math.round(expectedValue + 2 * stdDev);

    // Calculate confidence score based on factors
    let confidence = 0.7; // Base 70% confidence

    // Higher complexity = lower confidence
    switch (factors.complexity) {
      case 'trivial':
        confidence += 0.15;
        break;
      case 'simple':
        confidence += 0.10;
        break;
      case 'moderate':
        confidence += 0.0;
        break;
      case 'complex':
        confidence -= 0.10;
        break;
      case 'critical':
        confidence -= 0.20;
        break;
    }

    // Risk level affects confidence
    switch (factors.riskLevel) {
      case 'low':
        confidence += 0.10;
        break;
      case 'medium':
        confidence += 0.0;
        break;
      case 'high':
        confidence -= 0.15;
        break;
    }

    // Dependencies reduce confidence
    if (factors.dependencies && factors.dependencies > 0) {
      confidence -= Math.min(factors.dependencies * 0.03, 0.15);
    }

    // Clamp confidence between 0.3 and 0.95
    confidence = Math.max(0.3, Math.min(0.95, confidence));

    return {
      min: baseMin,
      max: baseMax,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Get similar tasks information (stub for future implementation)
   * Will be connected to historical data repository
   * 
   * @param title - Task title for similarity matching
   * @param tags - Optional tags for better matching
   */
  private getSimilarTasksInfo(
    title: string,
    tags?: string[]
  ): { similarTasksCount: number; userHistoryDays: number } {
    // TODO: Connect to TaskRepository for historical analysis
    // For now, return placeholder values indicating no historical data
    logger.debug(`Similar tasks lookup for: ${title} with tags: ${tags?.join(', ') || 'none'}`);
    
    return {
      similarTasksCount: 0, // Will be populated from historical data
      userHistoryDays: 30,  // Default analysis window
    };
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
