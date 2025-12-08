/**
 * HabitHeatmapService - GitHub-style Heatmap Data Generation
 * 
 * Generates heatmap visualization data:
 * - Year view (GitHub-style)
 * - Month view
 * - Week view
 */

import { habitCheckInService } from './HabitCheckInService';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0: no activity, 1-4: intensity levels
}

export interface HeatmapWeek {
  days: HeatmapDay[];
}

export interface YearHeatmap {
  year: number;
  weeks: HeatmapWeek[];
  minCount: number;
  maxCount: number;
}

export interface MonthHeatmap {
  year: number;
  month: number;
  days: HeatmapDay[];
  minCount: number;
  maxCount: number;
}

export interface WeekHeatmap {
  year: number;
  week: number;
  days: HeatmapDay[];
  minCount: number;
  maxCount: number;
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * HabitHeatmapService - Singleton service for heatmap generation
 */
export class HabitHeatmapService {
  private static instance: HabitHeatmapService;
  private cacheExpiry: number = 60 * 60 * 1000; // 1 hour
  private cache: Map<string, CacheEntry<any>> = new Map();

  private constructor() {}

  public static getInstance(): HabitHeatmapService {
    if (!HabitHeatmapService.instance) {
      HabitHeatmapService.instance = new HabitHeatmapService();
    }
    return HabitHeatmapService.instance;
  }

  /**
   * Generate GitHub-style year heatmap
   */
  public generateYearHeatmap(habitId: string, year: number): YearHeatmap {
    const cacheKey = `heatmap_year_${habitId}_${year}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const checkIns = habitCheckInService.getCheckInHistory(habitId, startDate, endDate);

    // Count check-ins per day
    const dailyCounts = new Map<string, number>();
    checkIns.forEach((checkIn) => {
      dailyCounts.set(checkIn.date, (dailyCounts.get(checkIn.date) || 0) + 1);
    });

    // Find min/max for intensity calculation
    const counts = Array.from(dailyCounts.values());
    const minCount = Math.min(...counts, 0);
    const maxCount = Math.max(...counts, 1);

    // Build weeks
    const weeks: HeatmapWeek[] = [];
    let currentWeek: HeatmapDay[] = [];

    const currentDate = new Date(startDate);
    while (currentDate.getFullYear() === year) {
      const dateStr = this.getDateString(currentDate);
      const count = dailyCounts.get(dateStr) || 0;
      const level = this.calculateIntensity(count, minCount, maxCount);

      currentWeek.push({ date: dateStr, count, level });

      if (currentWeek.length === 7) {
        weeks.push({ days: currentWeek });
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push({ days: currentWeek });
    }

    const heatmap: YearHeatmap = {
      year,
      weeks,
      minCount,
      maxCount,
    };

    this.cache.set(cacheKey, { result: heatmap, timestamp: Date.now() });
    return heatmap;
  }

  /**
   * Generate month heatmap (calendar view)
   */
  public generateMonthHeatmap(habitId: string, year: number, month: number): MonthHeatmap {
    const cacheKey = `heatmap_month_${habitId}_${year}_${month}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const checkIns = habitCheckInService.getCheckInHistory(habitId, startDate, endDate);

    // Count check-ins per day
    const dailyCounts = new Map<string, number>();
    checkIns.forEach((checkIn) => {
      dailyCounts.set(checkIn.date, (dailyCounts.get(checkIn.date) || 0) + 1);
    });

    // Find min/max for intensity calculation
    const counts = Array.from(dailyCounts.values());
    const minCount = Math.min(...counts, 0);
    const maxCount = Math.max(...counts, 1);

    // Build days for the month
    const days: HeatmapDay[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = this.getDateString(currentDate);
      const count = dailyCounts.get(dateStr) || 0;
      const level = this.calculateIntensity(count, minCount, maxCount);

      days.push({ date: dateStr, count, level });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const heatmap: MonthHeatmap = {
      year,
      month,
      days,
      minCount,
      maxCount,
    };

    this.cache.set(cacheKey, { result: heatmap, timestamp: Date.now() });
    return heatmap;
  }

  /**
   * Generate week heatmap (7-day view)
   */
  public generateWeekHeatmap(habitId: string, year: number, week: number): WeekHeatmap {
    const cacheKey = `heatmap_week_${habitId}_${year}_${week}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const startDate = this.getWeekStartDate(year, week);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const checkIns = habitCheckInService.getCheckInHistory(habitId, startDate, endDate);

    // Count check-ins per day
    const dailyCounts = new Map<string, number>();
    checkIns.forEach((checkIn) => {
      dailyCounts.set(checkIn.date, (dailyCounts.get(checkIn.date) || 0) + 1);
    });

    // Find min/max for intensity calculation
    const counts = Array.from(dailyCounts.values());
    const minCount = Math.min(...counts, 0);
    const maxCount = Math.max(...counts, 1);

    // Build 7 days
    const days: HeatmapDay[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const dateStr = this.getDateString(currentDate);
      const count = dailyCounts.get(dateStr) || 0;
      const level = this.calculateIntensity(count, minCount, maxCount);

      days.push({ date: dateStr, count, level });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const heatmap: WeekHeatmap = {
      year,
      week,
      days,
      minCount,
      maxCount,
    };

    this.cache.set(cacheKey, { result: heatmap, timestamp: Date.now() });
    return heatmap;
  }

  /**
   * Get current week heatmap
   */
  public getCurrentWeekHeatmap(habitId: string): WeekHeatmap {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    return this.generateWeekHeatmap(habitId, year, week);
  }

  /**
   * Get current month heatmap
   */
  public getCurrentMonthHeatmap(habitId: string): MonthHeatmap {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return this.generateMonthHeatmap(habitId, year, month);
  }

  /**
   * Get current year heatmap
   */
  public getCurrentYearHeatmap(habitId: string): YearHeatmap {
    const now = new Date();
    const year = now.getFullYear();
    return this.generateYearHeatmap(habitId, year);
  }

  /**
   * Get consecutive days of activity
   */
  public getConsecutiveDays(habitId: string): number {
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let count = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = this.getDateString(currentDate);
      const checkIn = habitCheckInService.getCheckIn(habitId, dateStr);

      if (checkIn) {
        count++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
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

  private calculateIntensity(count: number, min: number, max: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0;

    const range = max - min || 1;
    const normalized = (count - min) / range;

    if (normalized <= 0.25) return 1;
    if (normalized <= 0.5) return 2;
    if (normalized <= 0.75) return 3;
    return 4;
  }

  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private getWeekStartDate(year: number, week: number): Date {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
  }
}

export const habitHeatmapService = HabitHeatmapService.getInstance();
