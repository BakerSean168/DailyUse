/**
 * Notification IPC Handler Tests
 * Tests the notification module IPC handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain, Notification } from 'electron';
import { createMockEvent } from './mocks';
import { registerNotificationIpcHandlers } from '../notification.ipc-handlers';

// Mock Notification class
const mockNotificationInstance = {
  show: vi.fn(),
};

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  Notification: vi.fn(() => mockNotificationInstance),
}));

describe('Notification IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();
    mockNotificationInstance.show.mockClear();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerNotificationIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('notification:show', () => {
    it('should show a notification with provided options', async () => {
      const handler = handlers.get('notification:show');
      expect(handler).toBeDefined();

      const options = {
        title: 'Test Notification',
        body: 'This is a test',
        silent: false,
      };

      const result = await handler?.(mockEvent, options);

      expect(Notification).toHaveBeenCalledWith({
        title: 'Test Notification',
        body: 'This is a test',
        icon: undefined,
        silent: false,
      });
      expect(mockNotificationInstance.show).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should use default title when not provided', async () => {
      const handler = handlers.get('notification:show');

      await handler?.(mockEvent, { body: 'Test body' });

      expect(Notification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'DailyUse',
          body: 'Test body',
        }),
      );
    });
  });

  describe('notification:list', () => {
    it('should return empty notifications list', async () => {
      const handler = handlers.get('notification:list');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, {});

      expect(result).toEqual({ notifications: [], total: 0 });
    });
  });

  describe('notification:get', () => {
    it('should return null for notification get', async () => {
      const handler = handlers.get('notification:get');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid');

      expect(result).toBeNull();
    });
  });

  describe('notification:mark-read', () => {
    it('should mark notification as read', async () => {
      const handler = handlers.get('notification:mark-read');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid');

      expect(result).toEqual({ success: true });
    });
  });

  describe('notification:mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      const handler = handlers.get('notification:mark-all-read');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent);

      expect(result).toEqual({ success: true, count: 0 });
    });
  });

  describe('notification:delete', () => {
    it('should delete a notification', async () => {
      const handler = handlers.get('notification:delete');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid');

      expect(result).toEqual({ success: true });
    });
  });

  describe('notification:get-unread-count', () => {
    it('should return unread count', async () => {
      const handler = handlers.get('notification:get-unread-count');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent);

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('notification:get-preferences', () => {
    it('should return notification preferences', async () => {
      const handler = handlers.get('notification:get-preferences');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent);

      expect(result).toEqual({
        enabled: true,
        sound: true,
        desktop: true,
        email: false,
        types: {},
      });
    });
  });

  describe('notification:update-preferences', () => {
    it('should update notification preferences', async () => {
      const handler = handlers.get('notification:update-preferences');
      expect(handler).toBeDefined();

      const preferences = {
        enabled: false,
        sound: false,
      };

      const result = await handler?.(mockEvent, preferences);

      expect(result).toEqual({
        success: true,
        enabled: false,
        sound: false,
      });
    });
  });
});
