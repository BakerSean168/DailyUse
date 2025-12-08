/**
 * HabitReminderService.test.ts - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { habitReminderService } from './HabitReminderService';

describe('HabitReminderService', () => {
  const habitId = 'habit_1';
  const userId = 'user_1';

  beforeEach(() => {
    habitReminderService.clearCache();
  });

  afterEach(() => {
    habitReminderService.clearCache();
  });

  describe('createReminder', () => {
    it('should create new reminder', () => {
      const reminder = habitReminderService.createReminder(habitId, userId, '09:00', 'notification');

      expect(reminder).toBeDefined();
      expect(reminder.habitId).toBe(habitId);
      expect(reminder.time).toBe('09:00');
      expect(reminder.type).toBe('notification');
      expect(reminder.enabled).toBe(true);
    });

    it('should trigger onReminderScheduled event', () => {
      let eventTriggered = false;
      habitReminderService.onReminderScheduled = () => {
        eventTriggered = true;
      };

      habitReminderService.createReminder(habitId, userId, '09:00');
      expect(eventTriggered).toBe(true);
    });

    it('should support different reminder types', () => {
      const notification = habitReminderService.createReminder(habitId, userId, '09:00', 'notification');
      const email = habitReminderService.createReminder(habitId, userId, '10:00', 'email');

      expect(notification.type).toBe('notification');
      expect(email.type).toBe('email');
    });

    it('should support specific days of week', () => {
      const reminder = habitReminderService.createReminder(habitId, userId, '09:00', 'notification', [1, 3, 5]); // Mon, Wed, Fri

      expect(reminder.daysOfWeek).toEqual([1, 3, 5]);
    });
  });

  describe('updateReminder', () => {
    it('should update reminder properties', () => {
      const reminder = habitReminderService.createReminder(habitId, userId, '09:00');
      const updated = habitReminderService.updateReminder(reminder.id, { time: '10:00' });

      expect(updated?.time).toBe('10:00');
    });

    it('should return null for non-existent reminder', () => {
      const updated = habitReminderService.updateReminder('non_existent', { time: '10:00' });
      expect(updated).toBeNull();
    });
  });

  describe('deleteReminder', () => {
    it('should delete reminder', () => {
      const reminder = habitReminderService.createReminder(habitId, userId, '09:00');
      const deleted = habitReminderService.deleteReminder(reminder.id);

      expect(deleted).toBe(true);
    });

    it('should trigger onReminderCancelled event', () => {
      let eventTriggered = false;
      habitReminderService.onReminderCancelled = () => {
        eventTriggered = true;
      };

      const reminder = habitReminderService.createReminder(habitId, userId, '09:00');
      habitReminderService.deleteReminder(reminder.id);
      expect(eventTriggered).toBe(true);
    });

    it('should return false for non-existent reminder', () => {
      const deleted = habitReminderService.deleteReminder('non_existent');
      expect(deleted).toBe(false);
    });
  });

  describe('getUserReminders', () => {
    it('should return all user reminders', () => {
      habitReminderService.createReminder(habitId, userId, '09:00');
      habitReminderService.createReminder(habitId, userId, '18:00');

      const reminders = habitReminderService.getUserReminders(userId);
      expect(reminders.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for user with no reminders', () => {
      const reminders = habitReminderService.getUserReminders('non_existent_user');
      expect(reminders).toHaveLength(0);
    });
  });

  describe('getHabitReminders', () => {
    it('should return reminders for specific habit', () => {
      habitReminderService.createReminder('habit_1', userId, '09:00');
      habitReminderService.createReminder('habit_2', userId, '10:00');

      const reminders = habitReminderService.getHabitReminders('habit_1', userId);
      expect(reminders.length).toBeGreaterThan(0);
      expect(reminders.every((r) => r.habitId === 'habit_1')).toBe(true);
    });
  });

  describe('getNextReminder', () => {
    it('should get next scheduled reminder', () => {
      habitReminderService.createReminder(habitId, userId, '09:00');

      const next = habitReminderService.getNextReminder(habitId, userId);
      expect(next).toBeDefined();
      expect(next instanceof Date).toBe(true);
    });

    it('should return null if no reminders enabled', () => {
      const next = habitReminderService.getNextReminder(habitId, userId);
      expect(next).toBeNull();
    });

    it('should schedule for today or future', () => {
      const reminder = habitReminderService.createReminder(habitId, userId, '23:59');
      const next = habitReminderService.getNextReminder(habitId, userId);

      expect(next).toBeDefined();
      if (next) {
        expect(next.getTime()).toBeGreaterThanOrEqual(new Date().getTime());
      }
    });
  });

  describe('smart scheduling', () => {
    it('should enable smart scheduling', () => {
      habitReminderService.createReminder(habitId, userId, '09:00');
      habitReminderService.enableSmartScheduling(habitId, userId);

      const reminders = habitReminderService.getHabitReminders(habitId, userId);
      expect(reminders[0].smart).toBe(true);
    });

    it('should disable smart scheduling', () => {
      habitReminderService.createReminder(habitId, userId, '09:00');
      habitReminderService.enableSmartScheduling(habitId, userId);
      habitReminderService.disableSmartScheduling(habitId, userId);

      const reminders = habitReminderService.getHabitReminders(habitId, userId);
      expect(reminders[0].smart).toBe(false);
    });
  });

  describe('enablement control', () => {
    it('should enable/disable reminder', () => {
      const reminder = habitReminderService.createReminder(habitId, userId, '09:00');
      habitReminderService.setReminderEnabled(reminder.id, false);

      const reminders = habitReminderService.getHabitReminders(habitId, userId);
      expect(reminders[0].enabled).toBe(false);
    });

    it('should trigger events on enablement change', () => {
      const reminder = habitReminderService.createReminder(habitId, userId, '09:00');

      let cancelledTriggered = false;
      habitReminderService.onReminderCancelled = () => {
        cancelledTriggered = true;
      };

      habitReminderService.setReminderEnabled(reminder.id, false);
      expect(cancelledTriggered).toBe(true);
    });
  });

  describe('getWeekSchedule', () => {
    it('should get schedule for next 7 days', () => {
      habitReminderService.createReminder(habitId, userId, '09:00');

      const schedule = habitReminderService.getWeekSchedule(userId);
      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('should include all scheduled reminders', () => {
      habitReminderService.createReminder('habit_1', userId, '09:00');
      habitReminderService.createReminder('habit_2', userId, '18:00');

      const schedule = habitReminderService.getWeekSchedule(userId);
      expect(schedule.length).toBeGreaterThanOrEqual(2);
    });

    it('should order reminders chronologically', () => {
      habitReminderService.createReminder(habitId, userId, '09:00');

      const schedule = habitReminderService.getWeekSchedule(userId);
      const firstSchedule = schedule[0];

      if (firstSchedule.upcomingReminders.length > 1) {
        const first = new Date(firstSchedule.upcomingReminders[0].scheduledTime);
        const second = new Date(firstSchedule.upcomingReminders[1].scheduledTime);
        expect(first.getTime()).toBeLessThanOrEqual(second.getTime());
      }
    });
  });

  describe('checkDueReminders', () => {
    it('should identify due reminders', () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      habitReminderService.createReminder(habitId, userId, currentTime);

      const due = habitReminderService.checkDueReminders(userId);
      expect(due.length).toBeGreaterThan(0);
    });

    it('should trigger onReminderTriggered event', () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let eventTriggered = false;
      habitReminderService.onReminderTriggered = () => {
        eventTriggered = true;
      };

      habitReminderService.createReminder(habitId, userId, currentTime);
      habitReminderService.checkDueReminders(userId);
      expect(eventTriggered).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should cache user reminders', () => {
      habitReminderService.createReminder(habitId, userId, '09:00');

      const reminders1 = habitReminderService.getUserReminders(userId);
      const reminders2 = habitReminderService.getUserReminders(userId);

      expect(reminders1).toBe(reminders2); // Same reference (cached)
    });
  });
});
