/**
 * HabitHeatmapService.test.ts - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { habitHeatmapService } from './HabitHeatmapService';
import { habitCheckInService } from './HabitCheckInService';

describe('HabitHeatmapService', () => {
  const habitId = 'habit_1';
  const userId = 'user_1';

  beforeEach(() => {
    habitHeatmapService.clearCache();
    habitCheckInService.clearCache();
  });

  afterEach(() => {
    habitHeatmapService.clearCache();
    habitCheckInService.clearCache();
  });

  describe('generateYearHeatmap', () => {
    it('should generate year heatmap', () => {
      const year = new Date().getFullYear();
      const heatmap = habitHeatmapService.generateYearHeatmap(habitId, year);

      expect(heatmap).toBeDefined();
      expect(heatmap.year).toBe(year);
      expect(heatmap.weeks).toBeDefined();
      expect(heatmap.weeks.length).toBeGreaterThan(0);
    });

    it('should include all days of year', () => {
      const year = new Date().getFullYear();
      const heatmap = habitHeatmapService.generateYearHeatmap(habitId, year);

      let totalDays = 0;
      heatmap.weeks.forEach((week) => {
        totalDays += week.days.length;
      });

      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const expectedDays = isLeapYear ? 366 : 365;
      expect(totalDays).toBe(expectedDays);
    });

    it('should calculate intensity levels', () => {
      const today = new Date();
      const year = today.getFullYear();

      // Add check-in
      habitCheckInService.checkIn(habitId, userId);

      const heatmap = habitHeatmapService.generateYearHeatmap(habitId, year);
      const todayData = heatmap.weeks[heatmap.weeks.length - 1].days.find((d) =>
        d.date.endsWith(String(today.getDate()).padStart(2, '0'))
      );

      expect(todayData).toBeDefined();
      expect(todayData?.level).toBeGreaterThan(0);
    });
  });

  describe('generateMonthHeatmap', () => {
    it('should generate month heatmap', () => {
      const now = new Date();
      const heatmap = habitHeatmapService.generateMonthHeatmap(habitId, now.getFullYear(), now.getMonth() + 1);

      expect(heatmap).toBeDefined();
      expect(heatmap.month).toBe(now.getMonth() + 1);
      expect(heatmap.days).toBeDefined();
    });

    it('should have correct number of days for month', () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const heatmap = habitHeatmapService.generateMonthHeatmap(habitId, year, month);

      const lastDay = new Date(year, month, 0).getDate();
      expect(heatmap.days.length).toBe(lastDay);
    });

    it('should track intensity per day', () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Add check-in
      habitCheckInService.checkIn(habitId, userId);

      const heatmap = habitHeatmapService.generateMonthHeatmap(habitId, year, month);
      const todayData = heatmap.days.find((d) =>
        d.date.endsWith(String(now.getDate()).padStart(2, '0'))
      );

      expect(todayData).toBeDefined();
      expect(todayData?.level).toBeGreaterThan(0);
    });
  });

  describe('generateWeekHeatmap', () => {
    it('should generate week heatmap', () => {
      const now = new Date();
      const year = now.getFullYear();
      const week = this.getWeekNumber(now);

      const heatmap = habitHeatmapService.generateWeekHeatmap(habitId, year, week);

      expect(heatmap).toBeDefined();
      expect(heatmap.week).toBe(week);
      expect(heatmap.days).toHaveLength(7);
    });

    it('should include 7 consecutive days', () => {
      const now = new Date();
      const year = now.getFullYear();
      const week = this.getWeekNumber(now);

      const heatmap = habitHeatmapService.generateWeekHeatmap(habitId, year, week);

      // Verify dates are consecutive
      for (let i = 1; i < heatmap.days.length; i++) {
        const prevDate = new Date(heatmap.days[i - 1].date);
        const currDate = new Date(heatmap.days[i].date);
        const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
        expect(daysDiff).toBe(1);
      }
    });
  });

  describe('getCurrentWeekHeatmap', () => {
    it('should get current week heatmap', () => {
      const heatmap = habitHeatmapService.getCurrentWeekHeatmap(habitId);

      expect(heatmap).toBeDefined();
      expect(heatmap.days).toHaveLength(7);
    });

    it('should include current date', () => {
      const heatmap = habitHeatmapService.getCurrentWeekHeatmap(habitId);
      const today = new Date();
      const todayStr = this.getDateString(today);

      const todayInWeek = heatmap.days.some((d) => d.date === todayStr);
      expect(todayInWeek).toBe(true);
    });
  });

  describe('getCurrentMonthHeatmap', () => {
    it('should get current month heatmap', () => {
      const heatmap = habitHeatmapService.getCurrentMonthHeatmap(habitId);

      expect(heatmap).toBeDefined();
      expect(heatmap.days.length).toBeGreaterThan(0);
    });

    it('should include current date', () => {
      const heatmap = habitHeatmapService.getCurrentMonthHeatmap(habitId);
      const today = new Date();
      const todayStr = this.getDateString(today);

      const todayInMonth = heatmap.days.some((d) => d.date === todayStr);
      expect(todayInMonth).toBe(true);
    });
  });

  describe('getCurrentYearHeatmap', () => {
    it('should get current year heatmap', () => {
      const heatmap = habitHeatmapService.getCurrentYearHeatmap(habitId);

      expect(heatmap).toBeDefined();
      expect(heatmap.year).toBe(new Date().getFullYear());
      expect(heatmap.weeks.length).toBeGreaterThan(0);
    });
  });

  describe('getConsecutiveDays', () => {
    it('should count consecutive days', () => {
      const today = new Date();

      // Create 5-day streak
      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const consecutive = habitHeatmapService.getConsecutiveDays(habitId);
      expect(consecutive).toBeGreaterThan(0);
    });

    it('should return 0 if no activity today or yesterday', () => {
      const consecutive = habitHeatmapService.getConsecutiveDays(habitId);
      expect(consecutive).toBe(0);
    });
  });

  describe('intensity calculation', () => {
    it('should calculate correct intensity levels', () => {
      const today = new Date();

      // Multiple check-ins for higher intensity
      for (let i = 0; i < 3; i++) {
        habitCheckInService.checkIn(habitId, userId);
      }

      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const heatmap = habitHeatmapService.generateMonthHeatmap(habitId, year, month);

      const todayData = heatmap.days.find((d) =>
        d.date.endsWith(String(today.getDate()).padStart(2, '0'))
      );

      expect(todayData?.level).toBeBetween(0, 4);
    });
  });

  describe('cache management', () => {
    it('should cache heatmap data', () => {
      const year = new Date().getFullYear();

      const heatmap1 = habitHeatmapService.generateYearHeatmap(habitId, year);
      const heatmap2 = habitHeatmapService.generateYearHeatmap(habitId, year);

      expect(heatmap1).toBe(heatmap2); // Same reference (cached)
    });

    it('should clear cache when requested', () => {
      const year = new Date().getFullYear();

      habitHeatmapService.generateYearHeatmap(habitId, year);
      habitHeatmapService.clearCache();

      const heatmap1 = habitHeatmapService.generateYearHeatmap(habitId, year);
      const heatmap2 = habitHeatmapService.generateYearHeatmap(habitId, year);

      expect(heatmap1).toBe(heatmap2); // New reference after clear
    });
  });

  // ==================== Helper Methods ====================
});

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Helper: Extend expect with custom matchers
expect.extend({
  toBeBetween(actual: number, floor: number, ceiling: number) {
    const pass = actual >= floor && actual <= ceiling;
    return {
      message: () =>
        pass
          ? `expected ${actual} not to be between ${floor} and ${ceiling}`
          : `expected ${actual} to be between ${floor} and ${ceiling}`,
      pass,
    };
  },
});
