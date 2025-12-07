/**
 * Goal IPC Handler 测试
 *
 * 测试 Goal 模块的 IPC 通道处理
 * 简化版本 - 不依赖实际的 Container 和 Repository
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { createMockEvent } from './mocks';
import { registerGoalIpcHandlers } from '../goal.ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

// Mock infrastructure-server 模块
vi.mock('@dailyuse/infrastructure-server', () => ({
  GoalContainer: {
    getInstance: vi.fn(() => ({
      getGoalRepository: vi.fn(() => ({
        save: vi.fn(),
        findById: vi.fn().mockResolvedValue(null),
        findByAccountUuid: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
      })),
      getStatisticsRepository: vi.fn(() => ({
        getByAccountUuid: vi.fn().mockResolvedValue({
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          archivedGoals: 0,
        }),
      })),
    })),
    resetInstance: vi.fn(),
  },
}));

describe('Goal IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerGoalIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('通道注册', () => {
    it('应该注册所有 goal 核心通道', () => {
      expect(handlers.has('goal:create')).toBe(true);
      expect(handlers.has('goal:list')).toBe(true);
      expect(handlers.has('goal:get')).toBe(true);
      expect(handlers.has('goal:update')).toBe(true);
      expect(handlers.has('goal:delete')).toBe(true);
    });

    it('应该注册所有 goal 状态通道', () => {
      expect(handlers.has('goal:activate')).toBe(true);
      expect(handlers.has('goal:complete')).toBe(true);
      expect(handlers.has('goal:archive')).toBe(true);
    });

    it('应该注册其他 goal 通道', () => {
      expect(handlers.has('goal:search')).toBe(true);
      expect(handlers.has('goal:pause')).toBe(true);
    });
  });

  describe('goal:create', () => {
    it('应该有创建 handler', async () => {
      const handler = handlers.get('goal:create');
      expect(handler).toBeDefined();
    });
  });

  describe('goal:list', () => {
    it('应该返回目标列表', async () => {
      const handler = handlers.get('goal:list')!;
      const result = await handler(mockEvent, { accountUuid: 'test-account' });
      
      // 当前实现返回空列表
      expect(result).toBeDefined();
    });
  });

  describe('goal:get', () => {
    it('应该有获取 handler', async () => {
      const handler = handlers.get('goal:get');
      expect(handler).toBeDefined();
    });
  });

  describe('goal:update', () => {
    it('应该有更新 handler', async () => {
      const handler = handlers.get('goal:update');
      expect(handler).toBeDefined();
    });
  });

  describe('goal:delete', () => {
    it('应该有删除 handler', async () => {
      const handler = handlers.get('goal:delete');
      expect(handler).toBeDefined();
    });
  });

  describe('goal:activate', () => {
    it('应该有激活 handler', () => {
      expect(handlers.has('goal:activate')).toBe(true);
    });
  });

  describe('goal:complete', () => {
    it('应该有完成 handler', () => {
      expect(handlers.has('goal:complete')).toBe(true);
    });
  });

  describe('goal:archive', () => {
    it('应该有归档 handler', () => {
      expect(handlers.has('goal:archive')).toBe(true);
    });
  });
});
