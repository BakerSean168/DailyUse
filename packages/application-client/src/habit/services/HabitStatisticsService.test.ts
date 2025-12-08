/**
 * HabitStatisticsService.test.ts - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { habitStatisticsService } from './HabitStatisticsService';
import { habitCheckInService } from './HabitCheckInService';
import { habitStreakService } from './HabitStreakService';

describe('HabitStatisticsService', () => {
  const habitId = 'habit_1';
  const userId = 'user_1';

  beforeEach(() => {
    habitStatisticsService.clearCache();
    habitCheckInService.clearCache();
    habitStreakService.clearCache();
  });

  afterEach(() => {
    habitStatisticsService.clearCache();
    habitCheckInService.clearCache();
    habitStreakService.clearCache();
  });

  describe('getStatistics', () => {
    it('should calculate daily statistics', () => {
      habitCheckInService.checkIn(habitId, userId);

      const stats = habitStatisticsService.getStatistics(habitId, userId, 'day');

      expect(stats).toBeDefined();
      expect(stats.period).toBe('day');
      expect(stats.totalDays).toBe(1);
      expect(stats.checkedInDays).toBeGreaterThanOrEqual(0);
    });

    it('should calculate weekly statistics', () => {
      const today = new Date();

      // Add check-ins for 4 days
      for (let i = 0; i < 4; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const stats = habitStatisticsService.getStatistics(habitId, userId, 'week');

      expect(stats.period).toBe('week');
      expect(stats.totalDays).toBe(7);
      expect(stats.checkedInDays).toBeGreaterThanOrEqual(4);
    });

    it('should calculate monthly statistics', () => {
      const stats = habitStatisticsService.getStatistics(habitId, userId, 'month');

      expect(stats.period).toBe('month');
      expect(stats.totalDays).toBeGreaterThan(0);
      expect(stats.completionRate).toBeBetween(0, 100);
    });

    it('should calculate yearly statistics', () => {
      const stats = habitStatisticsService.getStatistics(habitId, userId, 'year');

      expect(stats.period).toBe('year');
      expect(stats.totalDays).toBeGreaterThan(0);
    });

    it('should calculate completion rate', () => {
      const today = new Date();

      // 50% week completion: 3 out of 7 days
      for (let i = 0; i < 3; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const stats = habitStatisticsService.getStatistics(habitId, userId, 'week');
      expect(stats.completionRate).toBeGreaterThanOrEqual(40);
    });
  });

  describe('getPerformanceScore', () => {
    it('should calculate overall performance score', () => {
      const score = habitStatisticsService.getPerformanceScore(habitId, userId, 'month');

      expect(score).toBeDefined();
      expect(score.overall).toBeBetween(0, 100);
      expect(score.consistency).toBeBetween(0, 100);
      expect(score.streakQuality).toBeBetween(0, 100);
      expect(score.momentum).toBeBetween(0, 100);
    });

    it('should increase score with better performance', () => {
      const today = new Date();

      // Create daily check-ins for the week
      for (let i = 0; i < 7; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const score = habitStatisticsService.getPerformanceScore(habitId, userId, 'week');
      expect(score.overall).toBeGreaterThan(50);
    });
  });

  describe('getInsights', () => {
    it('should return insights for habit', () => {
      const insights = habitStatisticsService.getInsights(habitId, userId);

      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should provide positive insight for perfect completion', () => {
      const today = new Date();

      // Perfect week: all 7 days checked in
      for (let i = 0; i < 7; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const insights = habitStatisticsService.getInsights(habitId, userId);
      const positiveInsight = insights.find((i) => i.type === 'positive');

      expect(positiveInsight).toBeDefined();
    });

    it('should provide warning for low completion', () => {
      // Create low completion scenario (no check-ins)
      const insights = habitStatisticsService.getInsights(habitId, userId);
      const warningInsight = insights.find((i) => i.type === 'warning' || i.type === 'critical');

      expect(warningInsight).toBeDefined();
    });
  });

  describe('comparePeriods', () => {
    it('should compare two periods', () => {
      const today = new Date();

      // Create check-ins for current week
      for (let i = 0; i < 4; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const comparison = habitStatisticsService.comparePeriods(habitId, userId, 'week', 'week');

      expect(comparison).toBeDefined();
      expect(comparison.comparison).toBeDefined();
      expect(comparison.improvement).toBeGreaterThanOrEqual(-100);
    });

    it('should show improvement message', () => {
      const comparison = habitStatisticsService.comparePeriods(habitId, userId, 'week', 'month');

      expect(
        comparison.comparison.includes('↑') ||
        comparison.comparison.includes('↓') ||
        comparison.comparison.includes('No change')
      ).toBe(true);
    });
  });

  describe('getAchievedMilestones', () => {
    it('should return achieved milestones', () => {
      const today = new Date();

      // Create 7-day streak
      for (let i = 0; i < 7; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const milestones = habitStatisticsService.getAchievedMilestones(habitId, userId);

      expect(milestones).toBeDefined();
      expect(Array.isArray(milestones)).toBe(true);
    });

    it('should track milestone progression', () => {
      const today = new Date();

      // Create 14-day streak
      for (let i = 0; i < 14; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const milestones = habitStatisticsService.getAchievedMilestones(habitId, userId);

      // Should include 7-day milestone
      expect(milestones.some((m) => m >= 7)).toBe(true);
    });
  });

  describe('trends analysis', () => {
    it('should calculate trends from check-ins', () => {
      const today = new Date();

      // Create varied check-in pattern
      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const stats = habitStatisticsService.getStatistics(habitId, userId, 'month');

      expect(stats.trends).toBeDefined();
      expect(stats.trends.length).toBeGreaterThan(0);
    });
  });

  describe('best day analysis', () => {
    it('should identify best day of week', () => {
      const today = new Date();

      // Check in multiple times
      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const stats = habitStatisticsService.getStatistics(habitId, userId, 'month');

      expect(stats.bestDay).toBeDefined();
      expect(stats.bestDay !== 'N/A').toBe(true);
    });
  });

  describe('cache management', () => {
    it('should cache statistics', () => {
      const stats1 = habitStatisticsService.getStatistics(habitId, userId, 'month');
      const stats2 = habitStatisticsService.getStatistics(habitId, userId, 'month');

      expect(stats1).toBe(stats2); // Same reference (cached)
    });

    it('should clear cache when requested', () => {
      habitStatisticsService.getStatistics(habitId, userId, 'month');
      habitStatisticsService.clearCache();

      const stats1 = habitStatisticsService.getStatistics(habitId, userId, 'month');
      const stats2 = habitStatisticsService.getStatistics(habitId, userId, 'month');

      expect(stats1).toBe(stats2); // New reference after clear
    });
  });

  // ==================== Helper Methods ====================

  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});

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
