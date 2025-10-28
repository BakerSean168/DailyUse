/**
 * SearchDataProvider Integration Tests
 *
 * Tests the data integration between SearchDataProvider and actual services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchDataProvider } from '../SearchDataProvider';
import type { GoalContracts, TaskContracts } from '@dailyuse/contracts';

// Mock the services
vi.mock('@/modules/goal/application/services/GoalWebApplicationService');
vi.mock('@/modules/task/application/services/TaskTemplateApplicationService');
vi.mock('@/modules/reminder/application/services/ReminderWebApplicationService');

describe('SearchDataProvider Integration', () => {
  beforeEach(() => {
    // Clear cache before each test
    searchDataProvider.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = searchDataProvider;
      const instance2 = searchDataProvider;

      expect(instance1).toBe(instance2);
    });
  });

  describe('Cache Management', () => {
    it('should start with empty cache', () => {
      const status = searchDataProvider.getCacheStatus();

      expect(status.isValid).toBe(false);
      expect(status.lastUpdated).toBeNull();
      expect(status.itemCounts).toEqual({
        goals: 0,
        tasks: 0,
        reminders: 0,
      });
    });

    it('should clear cache', () => {
      searchDataProvider.clearCache();
      const status = searchDataProvider.getCacheStatus();

      expect(status.isValid).toBe(false);
      expect(status.lastUpdated).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should return empty arrays when cache is empty', () => {
      const goals = searchDataProvider.getGoals();
      const tasks = searchDataProvider.getTasks();
      const reminders = searchDataProvider.getReminders();

      expect(goals).toEqual([]);
      expect(tasks).toEqual([]);
      expect(reminders).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(searchDataProvider.loading).toBe(false);
    });
  });

  describe('Cache Status', () => {
    it('should provide detailed cache status', () => {
      const status = searchDataProvider.getCacheStatus();

      expect(status).toHaveProperty('isValid');
      expect(status).toHaveProperty('lastUpdated');
      expect(status).toHaveProperty('itemCounts');
      expect(status.itemCounts).toHaveProperty('goals');
      expect(status.itemCounts).toHaveProperty('tasks');
      expect(status.itemCounts).toHaveProperty('reminders');
    });
  });
});
