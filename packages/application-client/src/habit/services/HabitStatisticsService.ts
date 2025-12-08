/**
 * HabitStatisticsService - Habit Analytics & Insights
 * 
 * Provides comprehensive statistics and analytics:
 * - Completion rates
 * - Trends and patterns
 * - Performance insights
 * - Comparative analytics
 */

import { habitCheckInService } from './HabitCheckInService';
import { habitStreakService } from './HabitStreakService';

export interface HabitStatistics {
  habitId: string;
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  totalDays: number;
  checkedInDays: number;
  missedDays: number;
  completionRate: number; // 0-100
  currentStreak: number;
  longestStreak: number;
  averageCheckInsPerWeek: number;
  bestDay: string; // Day of week
  bestTime: string; // HH:MM
  trends: TrendData[];
}

export interface TrendData {
  date: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

export interface HabitInsight {
  type: 'positive' | 'warning' | 'critical';
  message: string;
  recommendation?: string;
}

export interface PerformanceScore {
  overall: number; // 0-100
  consistency: number; // 0-100
  streakQuality: number; // 0-100
  momentum: number; // 0-100
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * HabitStatisticsService - Singleton service for habit analytics
 */
export class HabitStatisticsService {
  private static instance: HabitStatisticsService;
  private cacheExpiry: number = 60 * 60 * 1000; // 1 hour
  private cache: Map<string, CacheEntry<any>> = new Map();

  private constructor() {}

  public static getInstance(): HabitStatisticsService {
    if (!HabitStatisticsService.instance) {
      HabitStatisticsService.instance = new HabitStatisticsService();
    }
    return HabitStatisticsService.instance;
  }

  /**
   * Get statistics for a period
   */
  public getStatistics(
    habitId: string,
    userId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): HabitStatistics {
    const cacheKey = `stats_${habitId}_${period}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const now = new Date();
    let startDate: Date;
    let totalDays: number;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        totalDays = 1;
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        totalDays = 7;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        totalDays = this.getDaysInMonth(now);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        totalDays = this.isLeapYear(now.getFullYear()) ? 366 : 365;
        break;
    }

    const checkIns = habitCheckInService.getCheckInHistory(habitId, startDate, now);
    const checkedInDays = new Set(checkIns.map((c) => c.date)).size;
    const missedDays = totalDays - checkedInDays;
    const completionRate = (checkedInDays / totalDays) * 100;

    const streak = habitStreakService.getStreak(habitId, userId);
    const averageCheckInsPerWeek = (checkedInDays / (totalDays / 7)).toFixed(1);

    // Find best day
    const dayStats = new Map<string, number>();
    checkIns.forEach((checkIn) => {
      const date = new Date(checkIn.date);
      const dayName = this.getDayName(date);
      dayStats.set(dayName, (dayStats.get(dayName) || 0) + 1);
    });

    const bestDay =
      Array.from(dayStats.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Find best time (from check-in times)
    const timeStats = new Map<string, number>();
    checkIns.forEach((checkIn) => {
      const time = checkIn.checkedAt.substring(11, 13); // HH
      timeStats.set(time, (timeStats.get(time) || 0) + 1);
    });

    const bestTime =
      Array.from(timeStats.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '00';

    // Calculate trends
    const trends = this.calculateTrends(checkIns, period);

    const stats: HabitStatistics = {
      habitId,
      userId,
      period,
      totalDays,
      checkedInDays,
      missedDays,
      completionRate: parseFloat(completionRate.toFixed(1)),
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      averageCheckInsPerWeek: parseFloat(averageCheckInsPerWeek as string),
      bestDay,
      bestTime: `${bestTime}:00`,
      trends,
    };

    this.cache.set(cacheKey, { result: stats, timestamp: Date.now() });
    return stats;
  }

  /**
   * Get performance score
   */
  public getPerformanceScore(
    habitId: string,
    userId: string,
    period: 'week' | 'month' = 'month'
  ): PerformanceScore {
    const cacheKey = `score_${habitId}_${period}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const stats = this.getStatistics(habitId, userId, period);
    const streak = habitStreakService.getStreak(habitId, userId);

    // Consistency: completion rate
    const consistency = stats.completionRate;

    // Streak Quality: ratio of current to longest streak
    const streakQuality =
      streak.longestStreak > 0 ? (streak.currentStreak / streak.longestStreak) * 100 : 0;

    // Momentum: trend in last 7 days
    const recentStats = this.getStatistics(habitId, userId, 'week');
    const momentum = recentStats.completionRate;

    // Overall: weighted average
    const overall = (consistency * 0.4 + streakQuality * 0.3 + momentum * 0.3).toFixed(1);

    const score: PerformanceScore = {
      overall: Math.min(100, parseFloat(overall as string)),
      consistency: Math.min(100, consistency),
      streakQuality: Math.min(100, streakQuality),
      momentum: Math.min(100, momentum),
    };

    this.cache.set(cacheKey, { result: score, timestamp: Date.now() });
    return score;
  }

  /**
   * Get insights for habit
   */
  public getInsights(habitId: string, userId: string): HabitInsight[] {
    const insights: HabitInsight[] = [];

    const stats = this.getStatistics(habitId, userId, 'month');
    const streak = habitStreakService.getStreak(habitId, userId);

    // Check completion rate
    if (stats.completionRate === 100) {
      insights.push({
        type: 'positive',
        message: `Perfect month! 🎉 You've maintained a ${streak.currentStreak}-day streak.`,
      });
    } else if (stats.completionRate >= 80) {
      insights.push({
        type: 'positive',
        message: `Great consistency! ${stats.completionRate.toFixed(0)}% completion rate.`,
        recommendation: 'Keep it up! You are almost at 100% this month.',
      });
    } else if (stats.completionRate >= 50) {
      insights.push({
        type: 'warning',
        message: `Moderate progress: ${stats.completionRate.toFixed(0)}% completion.`,
        recommendation: `You've missed ${stats.missedDays} days. Try to build momentum.`,
      });
    } else {
      insights.push({
        type: 'critical',
        message: `Low completion: ${stats.completionRate.toFixed(0)}%.`,
        recommendation: 'Consider adjusting your habit goals or find a better reminder time.',
      });
    }

    // Check streak status
    if (streak.currentStreak > 14) {
      insights.push({
        type: 'positive',
        message: `Impressive! ${streak.currentStreak}-day streak is forming.`,
      });
    }

    // Check best/worst times
    const weekStats = this.getStatistics(habitId, userId, 'week');
    if (weekStats.bestDay !== 'N/A') {
      insights.push({
        type: 'positive',
        message: `${weekStats.bestDay} is your strongest day for this habit.`,
      });
    }

    return insights;
  }

  /**
   * Compare two periods
   */
  public comparePeriods(
    habitId: string,
    userId: string,
    period1: 'week' | 'month',
    period2: 'week' | 'month'
  ): { improvement: number; comparison: string } {
    const stats1 = this.getStatistics(habitId, userId, period1);
    const stats2 = this.getStatistics(habitId, userId, period2);

    const improvement = stats1.completionRate - stats2.completionRate;
    const comparison =
      improvement > 0
        ? `↑ Improved by ${improvement.toFixed(1)}%`
        : improvement < 0
          ? `↓ Declined by ${Math.abs(improvement).toFixed(1)}%`
          : 'No change';

    return { improvement, comparison };
  }

  /**
   * Get streak milestones achieved
   */
  public getAchievedMilestones(habitId: string, userId: string): number[] {
    const streak = habitStreakService.getStreak(habitId, userId);
    const achieved: number[] = [];

    const milestones = [7, 14, 30, 50, 100, 365, 500, 1000];
    for (const milestone of milestones) {
      if (streak.longestStreak >= milestone) {
        achieved.push(milestone);
      }
    }

    return achieved;
  }

  /**
   * Clear cache
   */
  public clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Set cache expiry (in minutes)
   */
  public setCacheExpiry(minutes: number): void {
    this.cacheExpiry = minutes * 60 * 1000;
  }

  // ==================== Private Methods ====================

  private calculateTrends(checkIns: any[], period: string): TrendData[] {
    const trends: TrendData[] = [];
    const dailyCounts = new Map<string, number>();

    checkIns.forEach((checkIn) => {
      dailyCounts.set(checkIn.date, (dailyCounts.get(checkIn.date) || 0) + 1);
    });

    const sortedDates = Array.from(dailyCounts.keys()).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const value = dailyCounts.get(date) || 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (i > 0) {
        const prevValue = dailyCounts.get(sortedDates[i - 1]) || 0;
        if (value > prevValue) trend = 'up';
        else if (value < prevValue) trend = 'down';
      }

      trends.push({ date, value, trend });
    }

    return trends;
  }

  private getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}

export const habitStatisticsService = HabitStatisticsService.getInstance();
