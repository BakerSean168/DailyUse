/**
 * FocusStatisticsService - Focus Session Analytics
 * 
 * Tracks and analyzes focus session data:
 * - Daily/weekly/monthly statistics
 * - Completion rates
 * - Streak tracking
 * - Time distribution analysis
 */

import { pomodoroService } from './PomodoroService';

export interface FocusStatistics {
  userId: string;
  date: Date;
  totalFocusMinutes: number;
  completedPomodoros: number;
  plannedPomodoros: number;
  longestStreak: number;
  currentStreak: number;
  morningMinutes: number; // 6-12
  afternoonMinutes: number; // 12-18
  eveningMinutes: number; // 18-24
  completionRate: number; // percentage
}

export interface TrendData {
  dates: Date[];
  values: number[];
  average: number;
  peak: number;
  lowest: number;
}

export interface TimeDistribution {
  morning: number; // percentage
  afternoon: number;
  evening: number;
}

export interface FocusReport {
  type: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalPomodoros: number;
  completionRate: number;
  bestDay: { date: Date; minutes: number } | null;
  insights: string[];
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * FocusStatisticsService - Singleton service for focus statistics
 */
export class FocusStatisticsService {
  private static instance: FocusStatisticsService;
  private cacheExpiry: number = 60 * 60 * 1000; // 1 hour
  private cache: Map<string, CacheEntry<any>> = new Map();

  private constructor() {}

  public static getInstance(): FocusStatisticsService {
    if (!FocusStatisticsService.instance) {
      FocusStatisticsService.instance = new FocusStatisticsService();
    }
    return FocusStatisticsService.instance;
  }

  /**
   * Get statistics for a specific date
   */
  public getDailyStatistics(date: Date, userId: string = 'default'): FocusStatistics {
    const cacheKey = `stats_daily_${date.toISOString()}_${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const sessions = pomodoroService.getSessionsByDate(date);
    const workSessions = sessions.filter((s) => s.phase === 'work');

    const totalFocusSeconds = workSessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.duration, 0);

    const completedPomodoros = workSessions.filter((s) => s.status === 'completed').length;

    const morningMinutes = this.getMinutesForPeriod(sessions, 6, 12);
    const afternoonMinutes = this.getMinutesForPeriod(sessions, 12, 18);
    const eveningMinutes = this.getMinutesForPeriod(sessions, 18, 24);

    const stats: FocusStatistics = {
      userId,
      date,
      totalFocusMinutes: Math.floor(totalFocusSeconds / 60),
      completedPomodoros,
      plannedPomodoros: workSessions.length,
      longestStreak: this.calculateLongestStreak(date),
      currentStreak: this.calculateCurrentStreak(date),
      morningMinutes,
      afternoonMinutes,
      eveningMinutes,
      completionRate: workSessions.length > 0 ? (completedPomodoros / workSessions.length) * 100 : 0,
    };

    this.cache.set(cacheKey, { result: stats, timestamp: Date.now() });
    return stats;
  }

  /**
   * Get weekly statistics
   */
  public getWeeklyStatistics(startDate: Date, userId: string = 'default'): FocusStatistics[] {
    const stats: FocusStatistics[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      stats.push(this.getDailyStatistics(current, userId));
      current.setDate(current.getDate() + 1);
    }

    return stats;
  }

  /**
   * Get monthly statistics
   */
  public getMonthlyStatistics(year: number, month: number, userId: string = 'default'): FocusStatistics[] {
    const stats: FocusStatistics[] = [];
    const date = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month, 1);

    while (date < nextMonth) {
      stats.push(this.getDailyStatistics(new Date(date), userId));
      date.setDate(date.getDate() + 1);
    }

    return stats;
  }

  /**
   * Get focus trend over a period (days)
   */
  public getFocusTrend(days: number = 30): TrendData {
    const dates: Date[] = [];
    const values: number[] = [];
    const current = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(new Date(date));

      const stats = this.getDailyStatistics(date);
      values.push(stats.totalFocusMinutes);
    }

    const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const peak = Math.max(...values, 0);
    const lowest = Math.min(...values.filter((v) => v > 0), 0) || 0;

    return {
      dates,
      values,
      average: Math.round(average),
      peak,
      lowest,
    };
  }

  /**
   * Get completion rate trend
   */
  public getCompletionRateTrend(weeks: number = 12): TrendData {
    const dates: Date[] = [];
    const values: number[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      dates.push(new Date(weekStart));

      const stats = this.getWeeklyStatistics(weekStart);
      const avgRate = stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length || 0;
      values.push(Math.round(avgRate));
    }

    const average = values.reduce((a, b) => a + b, 0) / values.length || 0;
    const peak = Math.max(...values, 0);
    const lowest = Math.min(...values.filter((v) => v > 0), 100) || 0;

    return {
      dates,
      values,
      average: Math.round(average),
      peak,
      lowest,
    };
  }

  /**
   * Get time distribution for a period
   */
  public getTimeDistribution(days: number = 7): TimeDistribution {
    const stats = [];
    const current = new Date();

    for (let i = 0; i < days; i++) {
      stats.push(this.getDailyStatistics(new Date(current)));
      current.setDate(current.getDate() - 1);
    }

    const totalMorning = stats.reduce((sum, s) => sum + s.morningMinutes, 0);
    const totalAfternoon = stats.reduce((sum, s) => sum + s.afternoonMinutes, 0);
    const totalEvening = stats.reduce((sum, s) => sum + s.eveningMinutes, 0);
    const total = totalMorning + totalAfternoon + totalEvening || 1;

    return {
      morning: Math.round((totalMorning / total) * 100),
      afternoon: Math.round((totalAfternoon / total) * 100),
      evening: Math.round((totalEvening / total) * 100),
    };
  }

  /**
   * Generate daily report
   */
  public generateDailyReport(date: Date): FocusReport {
    const stats = this.getDailyStatistics(date);
    const sessions = pomodoroService.getSessionsByDate(date);
    const workSessions = sessions.filter((s) => s.phase === 'work' && s.status === 'completed');

    const bestDay = workSessions.length > 0 ? { date, minutes: stats.totalFocusMinutes } : null;

    const insights: string[] = [];
    if (stats.totalFocusMinutes >= 480) {
      insights.push('🎉 Excellent focus day! You achieved 8+ hours of deep work.');
    } else if (stats.totalFocusMinutes >= 300) {
      insights.push('👏 Great focus session! You completed 5+ hours of work.');
    } else if (stats.totalFocusMinutes === 0) {
      insights.push('⏱️ No focus sessions today. Start a Pomodoro to track your work!');
    }

    if (stats.completionRate >= 80) {
      insights.push('✨ High completion rate! Keep up this momentum.');
    } else if (stats.completionRate < 50 && stats.plannedPomodoros > 0) {
      insights.push('⚠️ Consider shorter focus sessions for better completion.');
    }

    return {
      type: 'daily',
      startDate: date,
      endDate: date,
      totalMinutes: stats.totalFocusMinutes,
      totalPomodoros: stats.completedPomodoros,
      completionRate: stats.completionRate,
      bestDay,
      insights,
    };
  }

  /**
   * Generate weekly report
   */
  public generateWeeklyReport(startDate: Date): FocusReport {
    const stats = this.getWeeklyStatistics(startDate);
    const totalMinutes = stats.reduce((sum, s) => sum + s.totalFocusMinutes, 0);
    const totalPomodoros = stats.reduce((sum, s) => sum + s.completedPomodoros, 0);
    const avgRate = stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length || 0;

    const bestDay = stats.reduce((best, current) => {
      return current.totalFocusMinutes > best.totalFocusMinutes ? current : best;
    });

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const insights: string[] = [];
    if (totalMinutes >= 2400) {
      insights.push('🏆 Weekly powerhouse! You logged 40+ hours of focused work.');
    } else if (totalMinutes >= 1500) {
      insights.push('⭐ Solid week! You maintained consistent focus habits.');
    }

    if (avgRate >= 85) {
      insights.push('🎯 Excellent task completion rate this week.');
    }

    return {
      type: 'weekly',
      startDate,
      endDate,
      totalMinutes,
      totalPomodoros,
      completionRate: avgRate,
      bestDay: { date: bestDay.date, minutes: bestDay.totalFocusMinutes },
      insights,
    };
  }

  /**
   * Generate monthly report
   */
  public generateMonthlyReport(year: number, month: number): FocusReport {
    const startDate = new Date(year, month - 1, 1);
    const stats = this.getMonthlyStatistics(year, month);

    const totalMinutes = stats.reduce((sum, s) => sum + s.totalFocusMinutes, 0);
    const totalPomodoros = stats.reduce((sum, s) => sum + s.completedPomodoros, 0);
    const avgRate = stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length || 0;

    const bestDay = stats.reduce((best, current) => {
      return current.totalFocusMinutes > best.totalFocusMinutes ? current : best;
    });

    const endDate = new Date(year, month, 0);

    const insights: string[] = [];
    if (totalMinutes >= 10000) {
      insights.push('🏅 Exceptional month! 166+ hours of deep focus work.');
    } else if (totalMinutes >= 6000) {
      insights.push('🌟 Productive month with strong commitment to your goals.');
    }

    return {
      type: 'monthly',
      startDate,
      endDate,
      totalMinutes,
      totalPomodoros,
      completionRate: avgRate,
      bestDay: { date: bestDay.date, minutes: bestDay.totalFocusMinutes },
      insights,
    };
  }

  /**
   * Export to CSV
   */
  public exportToCSV(startDate: Date, endDate: Date): string {
    const stats = this.getMonthlyStatistics(startDate.getFullYear(), startDate.getMonth() + 1);
    const filtered = stats.filter((s) => s.date >= startDate && s.date <= endDate);

    let csv = 'Date,Focus Minutes,Completed Pomodoros,Planned Pomodoros,Completion Rate (%)\n';

    filtered.forEach((s) => {
      csv += `${s.date.toISOString().split('T')[0]},${s.totalFocusMinutes},${s.completedPomodoros},${s.plannedPomodoros},${s.completionRate.toFixed(1)}\n`;
    });

    return csv;
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

  private getMinutesForPeriod(sessions: any[], startHour: number, endHour: number): number {
    return sessions
      .filter((s) => {
        const hour = s.startedAt.getHours();
        return hour >= startHour && hour < endHour && s.phase === 'work' && s.status === 'completed';
      })
      .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
  }

  private calculateLongestStreak(date: Date): number {
    let streak = 0;
    let maxStreak = 0;
    let current = new Date(date);

    for (let i = 0; i < 365; i++) {
      const stats = this.getDailyStatistics(new Date(current));
      if (stats.completedPomodoros > 0) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
      current.setDate(current.getDate() - 1);
    }

    return maxStreak;
  }

  private calculateCurrentStreak(date: Date): number {
    let streak = 0;
    let current = new Date(date);

    for (let i = 0; i < 365; i++) {
      const stats = this.getDailyStatistics(new Date(current));
      if (stats.completedPomodoros > 0) {
        streak++;
      } else {
        break;
      }
      current.setDate(current.getDate() - 1);
    }

    return streak;
  }
}

/**
 * BadgeService - Achievement Badge Management
 */
export interface Badge {
  id: string;
  type: 'streak' | 'count' | 'duration' | 'special';
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: Date;
  progress: number;
  notified: boolean;
}

export class BadgeService {
  private static instance: BadgeService;
  private badges: Map<string, Badge> = new Map();
  private userBadges: Map<string, UserBadge[]> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes

  // Events
  onBadgeUnlocked: (badge: Badge, userId: string) => void = () => {};

  private constructor() {
    this.initializeBadges();
  }

  public static getInstance(): BadgeService {
    if (!BadgeService.instance) {
      BadgeService.instance = new BadgeService();
    }
    return BadgeService.instance;
  }

  /**
   * Get all badges
   */
  public getAllBadges(): Badge[] {
    return Array.from(this.badges.values());
  }

  /**
   * Get user badges
   */
  public getUserBadges(userId: string): UserBadge[] {
    return this.userBadges.get(userId) || [];
  }

  /**
   * Get unlocked badges
   */
  public getUnlockedBadges(userId: string): Badge[] {
    const userBadges = this.getUserBadges(userId);
    return userBadges.map((ub) => this.badges.get(ub.badgeId)!).filter(Boolean);
  }

  /**
   * Get locked badges
   */
  public getLockedBadges(userId: string): Badge[] {
    const unlockedIds = new Set(this.getUnlockedBadges(userId).map((b) => b.id));
    return this.getAllBadges().filter((b) => !unlockedIds.has(b.id));
  }

  /**
   * Check and unlock badges
   */
  public checkBadgeUnlocks(userId: string, statistics: FocusStatistics): Badge[] {
    const unlockedBadges: Badge[] = [];

    this.badges.forEach((badge) => {
      const isUnlocked = this.isBadgeUnlocked(userId, badge.id);

      if (!isUnlocked && this.meetsBadgeRequirement(badge, statistics)) {
        this.unlockBadge(userId, badge.id);
        unlockedBadges.push(badge);
        this.onBadgeUnlocked(badge, userId);
      }
    });

    return unlockedBadges;
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

  // ==================== Private Methods ====================

  private initializeBadges(): void {
    const badgeDefs: Badge[] = [
      // Streak badges
      { id: 'streak-7', type: 'streak', name: '初心不改', description: '7 days streak', icon: '🔥', requirement: 7, category: 'streak' },
      { id: 'streak-30', type: 'streak', name: '坚持如一', description: '30 days streak', icon: '💪', requirement: 30, category: 'streak' },
      { id: 'streak-100', type: 'streak', name: '专注大师', description: '100 days streak', icon: '👑', requirement: 100, category: 'streak' },

      // Pomodoro count badges
      { id: 'pomodoro-10', type: 'count', name: '番茄新手', description: '10 pomodoros', icon: '🍅', requirement: 10, category: 'count' },
      { id: 'pomodoro-50', type: 'count', name: '番茄达人', description: '50 pomodoros', icon: '🎯', requirement: 50, category: 'count' },
      { id: 'pomodoro-100', type: 'count', name: '番茄专家', description: '100 pomodoros', icon: '⭐', requirement: 100, category: 'count' },
      { id: 'pomodoro-500', type: 'count', name: '番茄大师', description: '500 pomodoros', icon: '💎', requirement: 500, category: 'count' },

      // Duration badges
      { id: 'daily-3h', type: 'duration', name: '专注三小时', description: '3 hour focus day', icon: '⏰', requirement: 180, category: 'duration' },
      { id: 'daily-5h', type: 'duration', name: '专注五小时', description: '5 hour focus day', icon: '🌟', requirement: 300, category: 'duration' },
      { id: 'daily-8h', type: 'duration', name: '专注八小时', description: '8 hour focus day', icon: '🚀', requirement: 480, category: 'duration' },

      // Special badges
      { id: 'early-bird', type: 'special', name: '早起的鸟儿', description: 'Morning focus', icon: '🐦', requirement: 1, category: 'special' },
      { id: 'night-owl', type: 'special', name: '深夜工作狂', description: 'Evening focus', icon: '🦉', requirement: 1, category: 'special' },
    ];

    badgeDefs.forEach((badge) => this.badges.set(badge.id, badge));
  }

  private unlockBadge(userId: string, badgeId: string): void {
    if (!this.userBadges.has(userId)) {
      this.userBadges.set(userId, []);
    }

    const userBadges = this.userBadges.get(userId)!;
    if (!userBadges.some((ub) => ub.badgeId === badgeId)) {
      userBadges.push({
        id: `ubadge_${userId}_${badgeId}`,
        userId,
        badgeId,
        unlockedAt: new Date(),
        progress: 100,
        notified: false,
      });
    }

    this.clearCache('userBadges');
  }

  private isBadgeUnlocked(userId: string, badgeId: string): boolean {
    const userBadges = this.userBadges.get(userId) || [];
    return userBadges.some((ub) => ub.badgeId === badgeId);
  }

  private meetsBadgeRequirement(badge: Badge, statistics: FocusStatistics): boolean {
    switch (badge.type) {
      case 'streak':
        return statistics.currentStreak >= badge.requirement;
      case 'count':
        return statistics.completedPomodoros >= badge.requirement;
      case 'duration':
        return statistics.totalFocusMinutes >= badge.requirement;
      default:
        return false;
    }
  }
}

export const focusStatisticsService = FocusStatisticsService.getInstance();
export const badgeService = BadgeService.getInstance();
