/**
 * Account IPC Handler Tests
 * Tests the account module IPC handlers (Account CRUD, Profile, Me)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain } from 'electron';
import { createMockEvent } from './mocks';
import { registerAccountIpcHandlers } from '../account.ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

describe('Account IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerAccountIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================
  // Core Account Handlers
  // ============================================

  describe('account:create', () => {
    it('should create an account', async () => {
      const handler = handlers.get('account:create');
      expect(handler).toBeDefined();

      const request = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await handler?.(mockEvent, request);

      expect(result).toEqual({
        uuid: 'todo',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  describe('account:get', () => {
    it('should return null for account get', async () => {
      const handler = handlers.get('account:get');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid');

      expect(result).toBeNull();
    });
  });

  describe('account:update', () => {
    it('should update an account', async () => {
      const handler = handlers.get('account:update');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid', { name: 'Updated Name' });

      expect(result).toEqual({
        uuid: 'test-uuid',
        name: 'Updated Name',
      });
    });
  });

  describe('account:delete', () => {
    it('should delete an account', async () => {
      const handler = handlers.get('account:delete');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid');

      expect(result).toEqual({ success: true });
    });
  });

  // ============================================
  // Me (Current User) Handlers
  // ============================================

  describe('account:me:get', () => {
    it('should return local desktop user', async () => {
      const handler = handlers.get('account:me:get');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent);

      expect(result).toEqual({
        uuid: 'local-user',
        email: 'local@desktop.app',
        name: 'Desktop User',
        createdAt: expect.any(String),
      });
    });
  });

  describe('account:me:update', () => {
    it('should update current user profile', async () => {
      const handler = handlers.get('account:me:update');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, { name: 'New Name' });

      expect(result).toEqual({
        success: true,
        name: 'New Name',
      });
    });
  });

  describe('account:me:change-password', () => {
    it('should return error for offline mode', async () => {
      const handler = handlers.get('account:me:change-password');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'old-pass', 'new-pass');

      expect(result).toEqual({
        success: false,
        error: 'Desktop offline mode',
      });
    });
  });

  describe('account:me:change-email', () => {
    it('should return error for offline mode', async () => {
      const handler = handlers.get('account:me:change-email');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'new@email.com');

      expect(result).toEqual({
        success: false,
        error: 'Desktop offline mode',
      });
    });
  });

  describe('account:me:verify-email', () => {
    it('should return error for offline mode', async () => {
      const handler = handlers.get('account:me:verify-email');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'token-123');

      expect(result).toEqual({
        success: false,
        error: 'Desktop offline mode',
      });
    });
  });

  describe('account:me:delete', () => {
    it('should return error for local account deletion', async () => {
      const handler = handlers.get('account:me:delete');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent);

      expect(result).toEqual({
        success: false,
        error: 'Cannot delete local account',
      });
    });
  });

  // ============================================
  // Profile Handlers
  // ============================================

  describe('account:profile:get', () => {
    it('should return null for profile get', async () => {
      const handler = handlers.get('account:profile:get');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid');

      expect(result).toBeNull();
    });
  });

  describe('account:profile:update', () => {
    it('should update profile', async () => {
      const handler = handlers.get('account:profile:update');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid', { bio: 'New bio' });

      expect(result).toEqual({
        success: true,
        bio: 'New bio',
      });
    });
  });
});
