/**
 * Goal Folder IPC Handler Tests
 * Tests the goal folder module IPC handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ipcMain } from 'electron';
import { createMockEvent } from './mocks';
import { registerGoalFolderIpcHandlers } from '../goal-folder.ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

vi.mock('@dailyuse/infrastructure-server', () => ({
  GoalContainer: {
    getInstance: vi.fn(() => ({
      __goalFolderRepository: undefined,
    })),
  },
}));

describe('Goal Folder IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerGoalFolderIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('goalFolder:create', () => {
    it('should create a goal folder', async () => {
      const handler = handlers.get('goalFolder:create');
      expect(handler).toBeDefined();

      const request = {
        name: 'Work Goals',
        parentUuid: null,
        color: '#FF5733',
      };

      const result = await handler?.(mockEvent, request);

      expect(result).toEqual({
        uuid: 'todo',
        name: 'Work Goals',
        parentUuid: null,
        color: '#FF5733',
      });
    });
  });

  describe('goalFolder:list', () => {
    it('should return empty folder list', async () => {
      const handler = handlers.get('goalFolder:list');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, {});

      expect(result).toEqual({ folders: [], total: 0 });
    });
  });

  describe('goalFolder:get', () => {
    it('should return null for folder get', async () => {
      const handler = handlers.get('goalFolder:get');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid');

      expect(result).toBeNull();
    });
  });

  describe('goalFolder:update', () => {
    it('should update a goal folder', async () => {
      const handler = handlers.get('goalFolder:update');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid', { name: 'Updated Name' });

      expect(result).toEqual({
        uuid: 'test-uuid',
        name: 'Updated Name',
      });
    });
  });

  describe('goalFolder:delete', () => {
    it('should delete a goal folder', async () => {
      const handler = handlers.get('goalFolder:delete');
      expect(handler).toBeDefined();

      const result = await handler?.(mockEvent, 'test-uuid');

      expect(result).toEqual({ success: true });
    });
  });
});
