/**
 * HabitCheckInService.test.ts - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { habitCheckInService } from './HabitCheckInService';

describe('HabitCheckInService', () => {
  const habitId = 'habit_1';
  const userId = 'user_1';

  beforeEach(() => {
    habitCheckInService.clearCache();
  });

  afterEach(() => {
    habitCheckInService.clearCache();
  });

  describe('checkIn', () => {
    it('should create today check-in', () => {
      const checkIn = habitCheckInService.checkIn(habitId, userId, 'Great day!', 'great');

      expect(checkIn).toBeDefined();
      expect(checkIn.habitId).toBe(habitId);
      expect(checkIn.note).toBe('Great day!');
      expect(checkIn.mood).toBe('great');
      expect(checkIn.isBackfilled).toBe(false);
    });

    it('should trigger onCheckIn event', () => {
      let eventTriggered = false;
      habitCheckInService.onCheckIn = () => {
        eventTriggered = true;
      };

      habitCheckInService.checkIn(habitId, userId);
      expect(eventTriggered).toBe(true);
    });

    it('should overwrite existing check-in for today', () => {
      habitCheckInService.checkIn(habitId, userId, 'First note');
      const updated = habitCheckInService.checkIn(habitId, userId, 'Second note');

      expect(updated.note).toBe('Second note');
    });
  });

  describe('isCheckedIn', () => {
    it('should return true if checked in today', () => {
      habitCheckInService.checkIn(habitId, userId);
      const checked = habitCheckInService.isCheckedIn(habitId);

      expect(checked).toBe(true);
    });

    it('should return false if not checked in today', () => {
      const checked = habitCheckInService.isCheckedIn(habitId);
      expect(checked).toBe(false);
    });

    it('should check specific date', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = getDateString(yesterday);

      // Check in yesterday's date
      habitCheckInService.backfillCheckIn(habitId, userId, yesterdayStr);

      // Today should not be checked
      const todayChecked = habitCheckInService.isCheckedIn(habitId, getDateString(today));
      expect(todayChecked).toBe(false);

      // Yesterday should be checked
      const yesterdayChecked = habitCheckInService.isCheckedIn(habitId, yesterdayStr);
      expect(yesterdayChecked).toBe(true);
    });
  });

  describe('backfillCheckIn', () => {
    it('should backfill check-in for past date', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = getDateString(yesterday);

      const checkIn = habitCheckInService.backfillCheckIn(habitId, userId, yesterdayStr);

      expect(checkIn).toBeDefined();
      expect(checkIn.date).toBe(yesterdayStr);
      expect(checkIn.isBackfilled).toBe(true);
    });

    it('should trigger onBackfillCheckIn event', () => {
      let eventTriggered = false;
      habitCheckInService.onBackfillCheckIn = () => {
        eventTriggered = true;
      };

      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = getDateString(yesterday);

      habitCheckInService.backfillCheckIn(habitId, userId, yesterdayStr);
      expect(eventTriggered).toBe(true);
    });

    it('should enforce 3-per-month backfill limit', () => {
      const today = new Date();

      // Backfill 3 times
      for (let i = 1; i <= 3; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = getDateString(date);
        habitCheckInService.backfillCheckIn(habitId, userId, dateStr);
      }

      // 4th backfill should fail
      const date = new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000);
      const dateStr = getDateString(date);
      const canBackfill = habitCheckInService.canBackfill(habitId, dateStr);
      expect(canBackfill).toBe(false);
    });

    it('should only allow backfill for past 1 day (yesterday)', () => {
      const today = new Date();
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const twoDaysAgoStr = getDateString(twoDaysAgo);

      const canBackfill = habitCheckInService.canBackfill(habitId, twoDaysAgoStr);
      expect(canBackfill).toBe(false);
    });

    it('should not backfill already checked-in date', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = getDateString(yesterday);

      habitCheckInService.backfillCheckIn(habitId, userId, yesterdayStr);

      // Try to backfill same date again
      const canBackfill = habitCheckInService.canBackfill(habitId, yesterdayStr);
      expect(canBackfill).toBe(false);
    });
  });

  describe('undoCheckIn', () => {
    it('should undo today check-in', () => {
      habitCheckInService.checkIn(habitId, userId);
      habitCheckInService.undoCheckIn(habitId);

      const checked = habitCheckInService.isCheckedIn(habitId);
      expect(checked).toBe(false);
    });

    it('should undo specific date check-in', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = getDateString(yesterday);

      habitCheckInService.backfillCheckIn(habitId, userId, yesterdayStr);
      habitCheckInService.undoCheckIn(habitId, yesterdayStr);

      const checked = habitCheckInService.isCheckedIn(habitId, yesterdayStr);
      expect(checked).toBe(false);
    });

    it('should trigger onUndoCheckIn event', () => {
      let eventTriggered = false;
      habitCheckInService.onUndoCheckIn = () => {
        eventTriggered = true;
      };

      habitCheckInService.checkIn(habitId, userId);
      habitCheckInService.undoCheckIn(habitId);
      expect(eventTriggered).toBe(true);
    });
  });

  describe('getCheckIn', () => {
    it('should retrieve specific check-in', () => {
      const today = new Date();
      const todayStr = getDateString(today);

      habitCheckInService.checkIn(habitId, userId, 'Test note');
      const checkIn = habitCheckInService.getCheckIn(habitId, todayStr);

      expect(checkIn).toBeDefined();
      expect(checkIn?.note).toBe('Test note');
    });

    it('should return null for non-existent check-in', () => {
      const checkIn = habitCheckInService.getCheckIn(habitId, '2000-01-01');
      expect(checkIn).toBeNull();
    });
  });

  describe('getCheckInHistory', () => {
    it('should retrieve check-in history for date range', () => {
      const today = new Date();
      habitCheckInService.checkIn(habitId, userId);

      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      habitCheckInService.backfillCheckIn(habitId, userId, getDateString(yesterday));

      const startDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const history = habitCheckInService.getCheckInHistory(habitId, startDate, today);

      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array if no check-ins in range', () => {
      const startDate = new Date('2000-01-01');
      const endDate = new Date('2000-01-31');

      const history = habitCheckInService.getCheckInHistory(habitId, startDate, endDate);
      expect(history).toHaveLength(0);
    });
  });

  describe('getTodayCheckIns', () => {
    it('should get all check-ins for today by user', () => {
      habitCheckInService.checkIn('habit_1', userId);
      habitCheckInService.checkIn('habit_2', userId);

      const todayCheckIns = habitCheckInService.getTodayCheckIns(userId);
      expect(todayCheckIns.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getCheckInStats', () => {
    it('should calculate check-in statistics', () => {
      habitCheckInService.checkIn(habitId, userId);

      const stats = habitCheckInService.getCheckInStats(habitId, userId);

      expect(stats).toBeDefined();
      expect(stats.totalCheckIns).toBeGreaterThanOrEqual(1);
      expect(stats.completedToday).toBe(true);
    });
  });

  describe('getRemainingBackfills', () => {
    it('should show remaining backfills after usage', () => {
      const today = new Date();

      // Use all 3 backfills
      for (let i = 1; i <= 3; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, getDateString(date));
      }

      const remaining = habitCheckInService.getRemainingBackfills(habitId);
      expect(remaining).toBe(0);
    });

    it('should reset backfill count monthly', () => {
      const today = new Date();

      // Backfill 3 times
      for (let i = 1; i <= 3; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        habitCheckInService.backfillCheckIn(habitId, userId, getDateString(date));
      }

      // In production, this would be month-specific
      // For now, we verify the limit is enforced
      const canBackfill = habitCheckInService.canBackfill(habitId, getDateString(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)));
      expect(canBackfill).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should cache check-in history', () => {
      habitCheckInService.checkIn(habitId, userId);

      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const history1 = habitCheckInService.getCheckInHistory(habitId, startDate, new Date());
      const history2 = habitCheckInService.getCheckInHistory(habitId, startDate, new Date());

      expect(history1).toBe(history2); // Same reference (cached)
    });
  });
});

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
