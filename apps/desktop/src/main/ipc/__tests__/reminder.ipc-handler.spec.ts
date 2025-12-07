/**
 * Reminder IPC Handler 测试
 *
 * 测试 Reminder 模块的 IPC 通道处理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { createMockEvent } from './mocks';
import { registerReminderIpcHandlers } from '../reminder.ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

describe('Reminder IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerReminderIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('通道注册', () => {
    it('应该注册所有 reminder:template 通道', () => {
      expect(handlers.has('reminder:template:create')).toBe(true);
      expect(handlers.has('reminder:template:list')).toBe(true);
      expect(handlers.has('reminder:template:get')).toBe(true);
      expect(handlers.has('reminder:template:update')).toBe(true);
      expect(handlers.has('reminder:template:delete')).toBe(true);
      expect(handlers.has('reminder:template:activate')).toBe(true);
      expect(handlers.has('reminder:template:deactivate')).toBe(true);
    });

    it('应该注册所有 reminder:upcoming 通道', () => {
      expect(handlers.has('reminder:upcoming:list')).toBe(true);
      expect(handlers.has('reminder:upcoming:get-next')).toBe(true);
      expect(handlers.has('reminder:upcoming:dismiss')).toBe(true);
      expect(handlers.has('reminder:upcoming:snooze')).toBe(true);
      expect(handlers.has('reminder:upcoming:acknowledge')).toBe(true);
    });

    it('应该注册所有 reminder:group 通道', () => {
      expect(handlers.has('reminder:group:create')).toBe(true);
      expect(handlers.has('reminder:group:list')).toBe(true);
    });
  });

  // ===== Reminder Template Tests =====

  describe('reminder:template:create', () => {
    it('应该创建提醒模板', async () => {
      const handler = handlers.get('reminder:template:create')!;
      const request = {
        title: 'Test Reminder',
        message: 'Test message',
      };

      const result = await handler(mockEvent, request) as { uuid: string; title: string };

      expect(result).toHaveProperty('uuid');
      expect(result.title).toBe('Test Reminder');
    });
  });

  describe('reminder:template:list', () => {
    it('应该返回提醒模板列表', async () => {
      const handler = handlers.get('reminder:template:list')!;
      const result = await handler(mockEvent, {}) as { templates: unknown[]; total: number };

      expect(result.templates).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('reminder:template:get', () => {
    it('应该根据 UUID 获取提醒模板', async () => {
      const handler = handlers.get('reminder:template:get')!;
      const result = await handler(mockEvent, 'test-uuid');

      expect(result).toBeNull();
    });
  });

  describe('reminder:template:activate', () => {
    it('应该激活提醒模板', async () => {
      const handler = handlers.get('reminder:template:activate')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  describe('reminder:template:deactivate', () => {
    it('应该停用提醒模板', async () => {
      const handler = handlers.get('reminder:template:deactivate')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  // ===== Upcoming Reminder Tests =====

  describe('reminder:upcoming:list', () => {
    it('应该返回即将到来的提醒列表', async () => {
      const handler = handlers.get('reminder:upcoming:list')!;
      const result = await handler(mockEvent, {}) as { 
        reminders: unknown[]; 
        total: number;
        fromDate: number;
        toDate: number;
      };

      expect(result.reminders).toEqual([]);
      expect(result.total).toBe(0);
      expect(result).toHaveProperty('fromDate');
      expect(result).toHaveProperty('toDate');
    });
  });

  describe('reminder:upcoming:get-next', () => {
    it('应该返回下一个即将到来的提醒', async () => {
      const handler = handlers.get('reminder:upcoming:get-next')!;
      const result = await handler(mockEvent, 5) as { reminders: unknown[] };

      expect(result.reminders).toEqual([]);
    });
  });

  describe('reminder:upcoming:dismiss', () => {
    it('应该忽略提醒', async () => {
      const handler = handlers.get('reminder:upcoming:dismiss')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  describe('reminder:upcoming:snooze', () => {
    it('应该延迟提醒', async () => {
      const handler = handlers.get('reminder:upcoming:snooze')!;
      const result = await handler(mockEvent, 'test-uuid', 15 * 60 * 1000) as { 
        success: boolean; 
        newTime: number | null 
      };

      expect(result.success).toBe(true);
    });
  });

  describe('reminder:upcoming:acknowledge', () => {
    it('应该确认提醒', async () => {
      const handler = handlers.get('reminder:upcoming:acknowledge')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  // ===== Reminder Group Tests =====

  describe('reminder:group:create', () => {
    it('应该创建提醒分组', async () => {
      const handler = handlers.get('reminder:group:create')!;
      const request = {
        name: 'Test Group',
        color: '#FF5733',
      };

      const result = await handler(mockEvent, request) as { uuid: string; name: string };

      expect(result).toHaveProperty('uuid');
      expect(result.name).toBe('Test Group');
    });
  });

  describe('reminder:group:list', () => {
    it('应该返回提醒分组列表', async () => {
      const handler = handlers.get('reminder:group:list')!;
      const result = await handler(mockEvent, {}) as { groups: unknown[]; total: number };

      expect(result.groups).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
