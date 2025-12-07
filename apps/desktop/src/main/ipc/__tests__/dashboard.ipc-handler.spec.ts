/**
 * Dashboard IPC Handler Tests
 * Tests the dashboard module IPC handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain } from 'electron';
import { createMockEvent } from './mocks';
import { registerDashboardIpcHandlers } from '../dashboard.ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

describe('Dashboard IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerDashboardIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('dashboard:get-overview', () => {
    it('should return dashboard overview with all sections', async () => {
      const handler = handlers.get('dashboard:get-overview');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent);

      expect(result).toEqual({
        goals: { total: 0, active: 0, completed: 0 },
        tasks: { total: 0, completed: 0, pending: 0, overdue: 0 },
        schedule: { todayEvents: 0, upcomingEvents: 0 },
        reminders: { active: 0, snoozed: 0 },
      });
    });
  });

  describe('dashboard:get-today', () => {
    it('should return today data with date and empty arrays', async () => {
      const handler = handlers.get('dashboard:get-today');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent);

      expect(result).toHaveProperty('date');
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.tasks).toEqual([]);
      expect(result.events).toEqual([]);
      expect(result.reminders).toEqual([]);
      expect(result.goals).toEqual([]);
    });
  });

  describe('dashboard:get-stats', () => {
    it('should return stats for specified period', async () => {
      const handler = handlers.get('dashboard:get-stats');
      expect(handler).toBeDefined();

      const period = 'week';
      const result = await handler?.(mockEvent, period);

      expect(result).toEqual({
        period: 'week',
        productivity: 0,
        tasksCompleted: 0,
        goalsProgress: 0,
        timeTracked: 0,
      });
    });

    it('should return stats for month period', async () => {
      const handler = handlers.get('dashboard:get-stats');

      const result = await handler?.(mockEvent, 'month');

      expect(result.period).toBe('month');
    });
  });

  describe('dashboard:get-recent-activity', () => {
    it('should return empty activities list', async () => {
      const handler = handlers.get('dashboard:get-recent-activity');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 10);

      expect(result).toEqual({ activities: [], total: 0 });
    });
  });

  describe('dashboard:get-widgets', () => {
    it('should return empty widgets list', async () => {
      const handler = handlers.get('dashboard:get-widgets');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent);

      expect(result).toEqual({ widgets: [] });
    });
  });

  describe('dashboard:update-widgets', () => {
    it('should update and return widgets', async () => {
      const handler = handlers.get('dashboard:update-widgets');
      expect(handler).toBeDefined();

      const widgets = [
        { id: 'widget-1', type: 'goals', position: { x: 0, y: 0 } },
        { id: 'widget-2', type: 'tasks', position: { x: 1, y: 0 } },
      ];

      const result = await handler?.(mockEvent, widgets);

      expect(result).toEqual({
        success: true,
        widgets,
      });
    });
  });
});
