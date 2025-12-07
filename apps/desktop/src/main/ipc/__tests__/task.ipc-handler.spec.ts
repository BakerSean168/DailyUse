/**
 * Task IPC Handler 测试
 *
 * 测试 Task 模块的 IPC 通道处理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { createMockEvent } from './mocks';
import { registerTaskIpcHandlers } from '../task.ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

describe('Task IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerTaskIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('通道注册', () => {
    it('应该注册所有 task-template 通道', () => {
      expect(handlers.has('task-template:create')).toBe(true);
      expect(handlers.has('task-template:list')).toBe(true);
      expect(handlers.has('task-template:get')).toBe(true);
      expect(handlers.has('task-template:update')).toBe(true);
      expect(handlers.has('task-template:delete')).toBe(true);
      expect(handlers.has('task-template:archive')).toBe(true);
      expect(handlers.has('task-template:restore')).toBe(true);
      expect(handlers.has('task-template:duplicate')).toBe(true);
      expect(handlers.has('task-template:search')).toBe(true);
      expect(handlers.has('task-template:batch-update')).toBe(true);
    });

    it('应该注册所有 task-instance 通道', () => {
      expect(handlers.has('task-instance:create')).toBe(true);
      expect(handlers.has('task-instance:list')).toBe(true);
      expect(handlers.has('task-instance:get')).toBe(true);
      expect(handlers.has('task-instance:update')).toBe(true);
      expect(handlers.has('task-instance:delete')).toBe(true);
    });
  });

  // ===== Task Template Tests =====

  describe('task-template:create', () => {
    it('应该创建任务模板', async () => {
      const handler = handlers.get('task-template:create')!;
      const request = {
        title: 'Test Task Template',
        description: 'Test description',
      };

      const result = await handler(mockEvent, request) as { uuid: string; title: string };

      expect(result).toHaveProperty('uuid');
      expect(result.title).toBe('Test Task Template');
    });
  });

  describe('task-template:list', () => {
    it('应该返回任务模板列表', async () => {
      const handler = handlers.get('task-template:list')!;
      const result = await handler(mockEvent, {}) as unknown[];

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('task-template:get', () => {
    it('应该根据 UUID 获取任务模板', async () => {
      const handler = handlers.get('task-template:get')!;
      const result = await handler(mockEvent, 'test-uuid');

      // 当前实现返回 null
      expect(result).toBeNull();
    });
  });

  describe('task-template:update', () => {
    it('应该更新任务模板', async () => {
      const handler = handlers.get('task-template:update')!;
      const result = await handler(mockEvent, 'test-uuid', {
        title: 'Updated Title',
      }) as { uuid: string; title: string };

      expect(result.uuid).toBe('test-uuid');
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('task-template:delete', () => {
    it('应该删除任务模板', async () => {
      const handler = handlers.get('task-template:delete')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  describe('task-template:archive', () => {
    it('应该归档任务模板', async () => {
      const handler = handlers.get('task-template:archive')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  describe('task-template:restore', () => {
    it('应该恢复已归档的任务模板', async () => {
      const handler = handlers.get('task-template:restore')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  describe('task-template:duplicate', () => {
    it('应该复制任务模板', async () => {
      const handler = handlers.get('task-template:duplicate')!;
      const result = await handler(mockEvent, 'test-uuid') as { uuid: string };

      expect(result).toHaveProperty('uuid');
    });
  });

  describe('task-template:search', () => {
    it('应该搜索任务模板', async () => {
      const handler = handlers.get('task-template:search')!;
      const result = await handler(mockEvent, 'query', {}) as { templates: unknown[]; total: number };

      expect(result.templates).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('task-template:batch-update', () => {
    it('应该批量更新任务模板', async () => {
      const handler = handlers.get('task-template:batch-update')!;
      const updates = [
        { uuid: '1', title: 'Updated 1' },
        { uuid: '2', title: 'Updated 2' },
      ];
      const result = await handler(mockEvent, updates) as { success: boolean; count: number };

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
  });

  // ===== Task Instance Tests =====

  describe('task-instance:create', () => {
    it('应该创建任务实例', async () => {
      const handler = handlers.get('task-instance:create')!;
      const request = {
        templateUuid: 'template-1',
        scheduledDate: Date.now(),
      };

      const result = await handler(mockEvent, request) as { uuid: string };

      expect(result).toHaveProperty('uuid');
    });
  });

  describe('task-instance:list', () => {
    it('应该返回任务实例列表', async () => {
      const handler = handlers.get('task-instance:list')!;
      const result = await handler(mockEvent, {}) as { instances: unknown[]; total: number };

      expect(result.instances).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('task-instance:get', () => {
    it('应该根据 UUID 获取任务实例', async () => {
      const handler = handlers.get('task-instance:get')!;
      const result = await handler(mockEvent, 'test-uuid');

      expect(result).toBeNull();
    });
  });

  describe('task-instance:update', () => {
    it('应该更新任务实例', async () => {
      const handler = handlers.get('task-instance:update')!;
      const result = await handler(mockEvent, 'test-uuid', {
        status: 'completed',
      }) as { uuid: string };

      expect(result.uuid).toBe('test-uuid');
    });
  });

  describe('task-instance:delete', () => {
    it('应该删除任务实例', async () => {
      const handler = handlers.get('task-instance:delete')!;
      const result = await handler(mockEvent, 'test-uuid') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });
});
