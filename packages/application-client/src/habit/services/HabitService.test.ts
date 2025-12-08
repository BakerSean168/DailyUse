/**
 * HabitService.test.ts - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { habitService, HabitService } from './HabitService';

describe('HabitService', () => {
  beforeEach(() => {
    habitService.clearCache();
  });

  afterEach(() => {
    habitService.clearCache();
  });

  describe('createHabit', () => {
    it('should create a new habit', () => {
      const habit = habitService.createHabit('user1', {
        name: 'Morning Run',
        icon: '🏃',
        color: '#FF5733',
        category: 'health',
        frequency: 'daily',
        targetDays: 7,
      });

      expect(habit).toBeDefined();
      expect(habit.name).toBe('Morning Run');
      expect(habit.icon).toBe('🏃');
      expect(habit.userId).toBe('user1');
      expect(habit.isArchived).toBe(false);
    });

    it('should trigger onHabitCreate event', () => {
      let eventTriggered = false;
      habitService.onHabitCreate = () => {
        eventTriggered = true;
      };

      habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      expect(eventTriggered).toBe(true);
    });
  });

  describe('getHabits', () => {
    it('should return all active habits for user', () => {
      habitService.createHabit('user1', {
        name: 'Habit 1',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.createHabit('user1', {
        name: 'Habit 2',
        icon: '🏃',
        color: '#FF0000',
        category: 'health',
        frequency: 'daily',
        targetDays: 7,
      });

      const habits = habitService.getHabits('user1');
      expect(habits).toHaveLength(2);
      expect(habits[0].name).toBe('Habit 1');
      expect(habits[1].name).toBe('Habit 2');
    });

    it('should not return archived habits', () => {
      const habit1 = habitService.createHabit('user1', {
        name: 'Habit 1',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.archiveHabit(habit1.id);

      const habits = habitService.getHabits('user1');
      expect(habits).toHaveLength(0);
    });
  });

  describe('updateHabit', () => {
    it('should update habit properties', () => {
      const habit = habitService.createHabit('user1', {
        name: 'Old Name',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      const updated = habitService.updateHabit(habit.id, {
        name: 'New Name',
        icon: '🎯',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.icon).toBe('🎯');
    });

    it('should trigger onHabitUpdate event', () => {
      let eventTriggered = false;
      habitService.onHabitUpdate = () => {
        eventTriggered = true;
      };

      const habit = habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.updateHabit(habit.id, { name: 'Updated' });
      expect(eventTriggered).toBe(true);
    });
  });

  describe('archiveHabit', () => {
    it('should archive a habit', () => {
      const habit = habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.archiveHabit(habit.id);

      const habits = habitService.getHabits('user1');
      expect(habits).toHaveLength(0);

      const archived = habitService.getArchivedHabits('user1');
      expect(archived).toHaveLength(1);
      expect(archived[0].isArchived).toBe(true);
    });

    it('should trigger onHabitArchive event', () => {
      let eventTriggered = false;
      habitService.onHabitArchive = () => {
        eventTriggered = true;
      };

      const habit = habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.archiveHabit(habit.id);
      expect(eventTriggered).toBe(true);
    });
  });

  describe('restoreHabit', () => {
    it('should restore an archived habit', () => {
      const habit = habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.archiveHabit(habit.id);
      habitService.restoreHabit(habit.id);

      const habits = habitService.getHabits('user1');
      expect(habits).toHaveLength(1);
      expect(habits[0].isArchived).toBe(false);
    });

    it('should trigger onHabitRestore event', () => {
      let eventTriggered = false;
      habitService.onHabitRestore = () => {
        eventTriggered = true;
      };

      const habit = habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.archiveHabit(habit.id);
      habitService.restoreHabit(habit.id);
      expect(eventTriggered).toBe(true);
    });
  });

  describe('deleteHabit', () => {
    it('should permanently delete a habit', () => {
      const habit = habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.deleteHabit(habit.id);

      const habits = habitService.getHabits('user1');
      expect(habits).toHaveLength(0);

      const archived = habitService.getArchivedHabits('user1');
      expect(archived).toHaveLength(0);
    });

    it('should trigger onHabitDelete event', () => {
      let eventTriggered = false;
      habitService.onHabitDelete = () => {
        eventTriggered = true;
      };

      const habit = habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.deleteHabit(habit.id);
      expect(eventTriggered).toBe(true);
    });
  });

  describe('getHabitsByCategory', () => {
    it('should filter habits by category', () => {
      habitService.createHabit('user1', {
        name: 'Running',
        icon: '🏃',
        color: '#FF0000',
        category: 'health',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.createHabit('user1', {
        name: 'Reading',
        icon: '📖',
        color: '#0000FF',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      const health = habitService.getHabitsByCategory('user1', 'health');
      expect(health).toHaveLength(1);
      expect(health[0].name).toBe('Running');
    });
  });

  describe('reorderHabits', () => {
    it('should reorder habits', () => {
      const h1 = habitService.createHabit('user1', {
        name: 'Habit 1',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      const h2 = habitService.createHabit('user1', {
        name: 'Habit 2',
        icon: '🏃',
        color: '#FF0000',
        category: 'health',
        frequency: 'daily',
        targetDays: 7,
      });

      habitService.reorderHabits('user1', [h2.id, h1.id]);

      const habits = habitService.getHabits('user1');
      expect(habits[0].id).toBe(h2.id);
      expect(habits[1].id).toBe(h1.id);
    });
  });

  describe('createFromTemplate', () => {
    it('should create habit from built-in template', () => {
      const habit = habitService.createFromTemplate('user1', 'exercise');

      expect(habit).toBeDefined();
      expect(habit.name).toBe('Exercise 30min');
      expect(habit.icon).toBe('🏃');
    });

    it('should create different habits from different templates', () => {
      const exercise = habitService.createFromTemplate('user1', 'exercise');
      const reading = habitService.createFromTemplate('user1', 'reading');

      expect(exercise.name).not.toBe(reading.name);
    });
  });

  describe('getTemplates', () => {
    it('should return all built-in templates', () => {
      const templates = habitService.getTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.id === 'exercise')).toBe(true);
    });

    it('should have required template properties', () => {
      const templates = habitService.getTemplates();

      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('icon');
      });
    });
  });

  describe('cache management', () => {
    it('should cache habits', () => {
      habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      const habits1 = habitService.getHabits('user1');
      const habits2 = habitService.getHabits('user1');

      expect(habits1).toBe(habits2); // Same reference (cached)
    });

    it('should clear cache when habit is modified', () => {
      const habit = habitService.createHabit('user1', {
        name: 'Test Habit',
        icon: '📝',
        color: '#000000',
        category: 'learning',
        frequency: 'daily',
        targetDays: 7,
      });

      const habits1 = habitService.getHabits('user1');
      habitService.updateHabit(habit.id, { name: 'Updated' });
      const habits2 = habitService.getHabits('user1');

      expect(habits1 === habits2).toBe(false); // Different reference (cache cleared)
    });
  });
});
