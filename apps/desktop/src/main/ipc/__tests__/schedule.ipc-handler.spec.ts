/**
 * Schedule IPC Handler 测试
 *
 * 测试 Schedule 模块的 IPC 通道处理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { createMockEvent } from './mocks';
import { registerScheduleIpcHandlers } from '../schedule.ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

describe('Schedule IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerScheduleIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('通道注册', () => {
    it('应该注册所有 schedule:task 通道', () => {
      expect(handlers.has('schedule:task:create')).toBe(true);
      expect(handlers.has('schedule:task:list')).toBe(true);
      expect(handlers.has('schedule:task:get')).toBe(true);
      expect(handlers.has('schedule:task:update')).toBe(true);
      expect(handlers.has('schedule:task:delete')).toBe(true);
      expect(handlers.has('schedule:task:list-by-date')).toBe(true);
      expect(handlers.has('schedule:task:list-by-range')).toBe(true);
      expect(handlers.has('schedule:task:reschedule')).toBe(true);
      expect(handlers.has('schedule:task:batch-reschedule')).toBe(true);
    });

    it('应该注册所有 schedule:event 通道', () => {
      expect(handlers.has('schedule:event:create')).toBe(true);
      expect(handlers.has('schedule:event:list')).toBe(true);
      expect(handlers.has('schedule:event:get')).toBe(true);
      expect(handlers.has('schedule:event:update')).toBe(true);
      expect(handlers.has('schedule:event:delete')).toBe(true);
      expect(handlers.has('schedule:event:list-by-date')).toBe(true);
    });
  });

  // ===== Schedule Task Tests =====

  describe('schedule:task:create', () => {
    it('应该创建调度任务', async () => {
      const handler = handlers.get('schedule:task:create')!;
      const request = {
        title: 'Test Schedule Task',
        scheduledDate: Date.now(),
      };

      const result = await handler(mockEvent, request) as { uuid: string; title: string };

      expect(result).toHaveProperty('uuid');
      expect(result.title).toBe('Test Schedule Task');
    });
  });

  describe('schedule:task:list', () => {
    it('应该返回调度任务列表', async () => {
      const handler = handlers.get('schedule:task:list')!;
      const result = await handler(mockEvent, {}) as { items: unknown[]; total: number };

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('schedule:task:get', () => {
    it('应该根据 UUID 获取调度任务', async () => {
      const handler = handlers.get('schedule:task:get')!;
      const result = await handler(mockEvent, 'test-uuid');

      expect(result).toBeNull();
    });
  });

  describe('schedule:task:list-by-date', () => {
    it('应该按日期获取调度任务', async () => {
      const handler = handlers.get('schedule:task:list-by-date')!;
      const result = await handler(mockEvent, Date.now()) as { items: unknown[]; total: number };

      expect(result.items).toEqual([]);
    });
  });

  describe('schedule:task:list-by-range', () => {
    it('应该按日期范围获取调度任务', async () => {
      const handler = handlers.get('schedule:task:list-by-range')!;
      const startDate = Date.now();
      const endDate = startDate + 7 * 24 * 60 * 60 * 1000; // 7 days later

      const result = await handler(mockEvent, startDate, endDate) as { items: unknown[] };

      expect(result.items).toEqual([]);
    });
  });

  describe('schedule:task:reschedule', () => {
    it('应该重新安排调度任务', async () => {
      const handler = handlers.get('schedule:task:reschedule')!;
      const result = await handler(
        mockEvent,
        'test-uuid',
        Date.now(),
        '10:00'
      ) as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  describe('schedule:task:batch-reschedule', () => {
    it('应该批量重新安排调度任务', async () => {
      const handler = handlers.get('schedule:task:batch-reschedule')!;
      const updates = [
        { uuid: '1', newDate: Date.now() },
        { uuid: '2', newDate: Date.now() + 86400000 },
      ];

      const result = await handler(mockEvent, updates) as { success: boolean; count: number };

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
  });

  // ===== Schedule Event Tests =====

  describe('schedule:event:create', () => {
    it('应该创建日程事件', async () => {
      const handler = handlers.get('schedule:event:create')!;
      const request = {
        title: 'Test Event',
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
      };

      const result = await handler(mockEvent, request) as { uuid: string };

      expect(result).toHaveProperty('uuid');
    });
  });

  describe('schedule:event:list', () => {
    it('应该返回日程事件列表', async () => {
      const handler = handlers.get('schedule:event:list')!;
      const result = await handler(mockEvent, {}) as { events: unknown[]; total: number };

      expect(result.events).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('schedule:event:delete', () => {
    it('应该删除日程事件', async () => {
      const handler = handlers.get('schedule:event:delete')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });
});
