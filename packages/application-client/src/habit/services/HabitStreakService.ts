/**
 * HabitStreakService - Habit Streak Calculation & Tracking
 * 
 * Manages streak calculations:
 * - Current streak tracking
 * - Longest streak records
 * - Milestone detection (7, 30, 100 days, etc.)
 */

import { habitCheckInService, HabitCheckIn } from './HabitCheckInService';

export interface HabitStreak {
  habitId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckedInDate?: string;
  streakStartDate?: string;
  milestones: StreakMilestone[];
}

export interface StreakMilestone {
  days: number;
  achievedAt: Date;
  notified: boolean;
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

const MILESTONE_DAYS = [7, 14, 30, 50, 100, 365, 500, 1000];

/**
 * HabitStreakService - Singleton service for streak management
 */
export class HabitStreakService {
  private static instance: HabitStreakService;
  private cacheExpiry: number = 60 * 60 * 1000; // 1 hour
  private cache: Map<string, CacheEntry<any>> = new Map();

  private streaks: Map<string, HabitStreak> = new Map(); // habitId -> streak

  // Events
  onMilestoneUnlocked: (milestone: StreakMilestone, habitId: string) => void = () => {};

  private constructor() {}

  public static getInstance(): HabitStreakService {
    if (!HabitStreakService.instance) {
      HabitStreakService.instance = new HabitStreakService();
    }
    return HabitStreakService.instance;
  }

  /**
   * Get streak for habit
   */
  public getStreak(habitId: string, userId: string): HabitStreak {
    const cacheKey = `streak_${habitId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    let streak = this.streaks.get(habitId);
    if (!streak) {
      streak = this.calculateStreak(habitId, userId);
      this.streaks.set(habitId, streak);
    }

    this.cache.set(cacheKey, { result: streak, timestamp: Date.now() });
    return streak;
  }

  /**
   * Calculate streak from check-in history
   */
  public calculateStreak(habitId: string, userId: string): HabitStreak {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // Look back 1 year

    const checkIns = habitCheckInService.getCheckInHistory(habitId, startDate, endDate);
    const sortedDates = checkIns
      .map((c) => c.date)
      .sort()
      .reverse(); // Newest first

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let tempStartDate: string | undefined;
    let lastDate: string | undefined;

    // Check if today or yesterday is checked in
    const today = this.getDateString(new Date());
    const yesterday = this.getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

    if (sortedDates.length === 0) {
      return {
        habitId,
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        milestones: [],
      };
    }

    // Reverse to process chronologically
    sortedDates.reverse();

    for (const date of sortedDates) {
      if (!lastDate) {
        tempStreak = 1;
        tempStartDate = date;
      } else {
        const daysDiff = this.getDaysDiff(new Date(lastDate), new Date(date));

        if (daysDiff === 1) {
          // Consecutive
          tempStreak++;
        } else {
          // Broken streak
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
          tempStartDate = date;
        }
      }
      lastDate = date;
    }

    // Final streak segment
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // Check if current streak is active
    if (sortedDates[sortedDates.length - 1] === today) {
      currentStreak = tempStreak;
    } else if (sortedDates[sortedDates.length - 1] === yesterday) {
      currentStreak = tempStreak; // Yesterday's check-in counts
    } else {
      currentStreak = 0; // Streak is broken
    }

    // Check for milestones
    const milestones = this.detectMilestones(currentStreak, userId, habitId);

    const streak: HabitStreak = {
      habitId,
      userId,
      currentStreak,
      longestStreak,
      totalCheckIns: sortedDates.length,
      lastCheckedInDate: sortedDates[sortedDates.length - 1],
      streakStartDate: tempStartDate,
      milestones,
    };

    this.streaks.set(habitId, streak);
    return streak;
  }

  /**
   * Get all streaks for user
   */
  public getUserStreaks(userId: string, habits: any[]): HabitStreak[] {
    return habits.map((habit) => this.getStreak(habit.id, userId));
  }

  /**
   * Get best streak among user's habits
   */
  public getBestStreak(userId: string, habits: any[]): HabitStreak | undefined {
    const streaks = this.getUserStreaks(userId, habits);
    return streaks.reduce((best, current) => {
      return current.currentStreak > best.currentStreak ? current : best;
    });
  }

  /**
   * Get longest streak among user's habits (all-time)
   */
  public getLongestStreak(userId: string, habits: any[]): HabitStreak | undefined {
    const streaks = this.getUserStreaks(userId, habits);
    return streaks.reduce((best, current) => {
      return current.longestStreak > best.longestStreak ? current : best;
    });
  }

  /**
   * Get total check-ins across all habits
   */
  public getTotalCheckIns(userId: string, habits: any[]): number {
    const streaks = this.getUserStreaks(userId, habits);
    return streaks.reduce((sum, s) => sum + s.totalCheckIns, 0);
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

  private detectMilestones(currentStreak: number, userId: string, habitId: string): StreakMilestone[] {
    const milestones: StreakMilestone[] = [];

    for (const days of MILESTONE_DAYS) {
      if (currentStreak >= days) {
        milestones.push({
          days,
          achievedAt: new Date(),
          notified: false,
        });
      }
    }

    return milestones;
  }

  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDaysDiff(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
  }
}

export const habitStreakService = HabitStreakService.getInstance();
