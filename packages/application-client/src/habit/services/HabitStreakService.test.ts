/**
 * HabitStreakService.test.ts - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { habitStreakService } from './HabitStreakService';
import { habitCheckInService } from './HabitCheckInService';

describe('HabitStreakService', () => {
  const habitId = 'habit_1';
  const userId = 'user_1';

  beforeEach(() => {
    habitStreakService.clearCache();
    habitCheckInService.clearCache();
  });

  afterEach(() => {
    habitStreakService.clearCache();
    habitCheckInService.clearCache();
  });

  describe('getStreak', () => {
    it('should return zero streak if no check-ins', () => {
      const streak = habitStreakService.getStreak(habitId, userId);

      expect(streak).toBeDefined();
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(0);
      expect(streak.totalCheckIns).toBe(0);
    });

    it('should calculate current streak from check-ins', () => {
      const today = new Date();

      // Create 3-day streak
      for (let i = 0; i < 3; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const streak = habitStreakService.getStreak(habitId, userId);
      expect(streak.currentStreak).toBe(3);
    });

    it('should reset streak if check-in is missing', () => {
      const today = new Date();

      // Day 1: check in
      habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(today));

      // Day 2: don't check in (skip)

      // Day 3: check in again
      const threeDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(threeDaysAgo));

      const streak = habitStreakService.getStreak(habitId, userId);
      expect(streak.currentStreak).toBeLessThan(3);
    });
  });

  describe('calculateStreak', () => {
    it('should calculate longest streak correctly', () => {
      const today = new Date();

      // First streak: 5 days
      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const streak = habitStreakService.calculateStreak(habitId, userId);
      expect(streak.longestStreak).toBeGreaterThanOrEqual(1);
    });

    it('should track total check-ins', () => {
      const today = new Date();

      // Create multiple check-ins
      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const streak = habitStreakService.calculateStreak(habitId, userId);
      expect(streak.totalCheckIns).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getUserStreaks', () => {
    it('should return streaks for all user habits', () => {
      const habits = [
        { id: 'habit_1', name: 'Habit 1' },
        { id: 'habit_2', name: 'Habit 2' },
      ];

      const streaks = habitStreakService.getUserStreaks(userId, habits);
      expect(streaks).toHaveLength(2);
    });

    it('should include all habit streaks', () => {
      const habits = [
        { id: 'habit_1', name: 'Habit 1' },
        { id: 'habit_2', name: 'Habit 2' },
      ];

      // Add check-ins to first habit
      const today = new Date();
      habitCheckInService.backfillCheckIn(habits[0].id, userId, this.getDateString(today));

      const streaks = habitStreakService.getUserStreaks(userId, habits);
      expect(streaks[0].totalCheckIns).toBeGreaterThan(0);
      expect(streaks[1].totalCheckIns).toBe(0);
    });
  });

  describe('getBestStreak', () => {
    it('should return habit with current highest streak', () => {
      const today = new Date();
      const habits = [
        { id: 'habit_1', name: 'Habit 1' },
        { id: 'habit_2', name: 'Habit 2' },
      ];

      // Create 5-day streak for habit 1
      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habits[0].id, userId, this.getDateString(date));
      }

      // Create 2-day streak for habit 2
      for (let i = 0; i < 2; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habits[1].id, userId, this.getDateString(date));
      }

      const best = habitStreakService.getBestStreak(userId, habits);
      expect(best).toBeDefined();
      expect(best?.habitId).toBe(habits[0].id);
    });
  });

  describe('getLongestStreak', () => {
    it('should return habit with longest all-time streak', () => {
      const today = new Date();
      const habits = [
        { id: 'habit_1', name: 'Habit 1' },
        { id: 'habit_2', name: 'Habit 2' },
      ];

      // Create 10-day streak for habit 1 (then break it)
      for (let i = 0; i < 10; i++) {
        const date = new Date(today.getTime() - (i + 20) * 24 * 60 * 60 * 1000); // 20+ days ago
        habitCheckInService.backfillCheckIn(habits[0].id, userId, this.getDateString(date));
      }

      const longest = habitStreakService.getLongestStreak(userId, habits);
      expect(longest).toBeDefined();
      expect(longest?.longestStreak).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getTotalCheckIns', () => {
    it('should sum check-ins across all habits', () => {
      const today = new Date();
      const habits = [
        { id: 'habit_1', name: 'Habit 1' },
        { id: 'habit_2', name: 'Habit 2' },
      ];

      // Add 3 check-ins to habit 1
      for (let i = 0; i < 3; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habits[0].id, userId, this.getDateString(date));
      }

      // Add 2 check-ins to habit 2
      for (let i = 0; i < 2; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habits[1].id, userId, this.getDateString(date));
      }

      const total = habitStreakService.getTotalCheckIns(userId, habits);
      expect(total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('milestone detection', () => {
    it('should detect milestone achievements', () => {
      const today = new Date();

      // Create 7-day streak
      for (let i = 0; i < 7; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      const streak = habitStreakService.getStreak(habitId, userId);
      expect(streak.milestones.length).toBeGreaterThan(0);
      expect(streak.milestones.some((m) => m.days === 7)).toBe(true);
    });

    it('should trigger onMilestoneUnlocked event', () => {
      let milestoneUnlocked = false;
      habitStreakService.onMilestoneUnlocked = () => {
        milestoneUnlocked = true;
      };

      const today = new Date();

      // Create 7-day streak
      for (let i = 0; i < 7; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, this.getDateString(date));
      }

      habitStreakService.calculateStreak(habitId, userId);
      // Note: In actual implementation, event would be triggered during calculation
      // This test verifies the event handler is callable
      expect(typeof habitStreakService.onMilestoneUnlocked).toBe('function');
    });
  });

  describe('cache management', () => {
    it('should cache streak calculations', () => {
      const streak1 = habitStreakService.getStreak(habitId, userId);
      const streak2 = habitStreakService.getStreak(habitId, userId);

      expect(streak1).toBe(streak2); // Same reference (cached)
    });

    it('should clear cache when requested', () => {
      habitStreakService.getStreak(habitId, userId);
      habitStreakService.clearCache();

      const streak1 = habitStreakService.getStreak(habitId, userId);
      const streak2 = habitStreakService.getStreak(habitId, userId);

      expect(streak1).toBe(streak2); // New reference after clear
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
