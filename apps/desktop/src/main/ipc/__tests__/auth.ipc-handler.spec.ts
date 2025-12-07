/**
 * Auth IPC Handler 测试
 *
 * 测试 Auth 模块的 IPC 通道处理
 * Desktop 应用采用离线模式，大部分认证功能返回错误/占位响应
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { createMockEvent } from './mocks';
import { registerAuthIpcHandlers } from '../auth.ipc-handlers';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

describe('Auth IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerAuthIpcHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('通道注册', () => {
    it('应该注册所有核心 auth 通道', () => {
      expect(handlers.has('auth:login')).toBe(true);
      expect(handlers.has('auth:register')).toBe(true);
      expect(handlers.has('auth:logout')).toBe(true);
      expect(handlers.has('auth:refresh-token')).toBe(true);
      expect(handlers.has('auth:verify-token')).toBe(true);
      expect(handlers.has('auth:get-status')).toBe(true);
    });

    it('应该注册所有 2FA 通道', () => {
      expect(handlers.has('auth:2fa:enable')).toBe(true);
      expect(handlers.has('auth:2fa:disable')).toBe(true);
      expect(handlers.has('auth:2fa:verify')).toBe(true);
      expect(handlers.has('auth:2fa:get-status')).toBe(true);
      expect(handlers.has('auth:2fa:generate-backup-codes')).toBe(true);
    });

    it('应该注册所有 API Key 通道', () => {
      expect(handlers.has('auth:api-key:create')).toBe(true);
      expect(handlers.has('auth:api-key:list')).toBe(true);
      expect(handlers.has('auth:api-key:revoke')).toBe(true);
    });
  });

  describe('auth:login', () => {
    it('应该返回离线模式错误', async () => {
      const handler = handlers.get('auth:login')!;
      const result = await handler(mockEvent, {
        username: 'test',
        password: 'password',
      }) as { success: boolean; error?: string };

      expect(result.success).toBe(false);
      expect(result.error).toContain('offline');
    });
  });

  describe('auth:register', () => {
    it('应该返回离线模式错误', async () => {
      const handler = handlers.get('auth:register')!;
      const result = await handler(mockEvent, {
        username: 'newuser',
        email: 'new@test.com',
        password: 'password',
      }) as { success: boolean; error?: string };

      expect(result.success).toBe(false);
      expect(result.error).toContain('offline');
    });
  });

  describe('auth:logout', () => {
    it('应该成功登出', async () => {
      const handler = handlers.get('auth:logout')!;
      const result = await handler(mockEvent) as { success: boolean };

      expect(result.success).toBe(true);
    });
  });

  describe('auth:get-status', () => {
    it('应该返回未认证状态', async () => {
      const handler = handlers.get('auth:get-status')!;
      const result = await handler(mockEvent) as { authenticated: boolean; user: unknown };

      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });
  });

  describe('auth:verify-token', () => {
    it('应该返回 token 无效', async () => {
      const handler = handlers.get('auth:verify-token')!;
      const result = await handler(mockEvent, 'some-token') as { valid: boolean };

      expect(result.valid).toBe(false);
    });
  });

  describe('auth:2fa:get-status', () => {
    it('应该返回 2FA 未启用', async () => {
      const handler = handlers.get('auth:2fa:get-status')!;
      const result = await handler(mockEvent) as { enabled: boolean; method: unknown };

      expect(result.enabled).toBe(false);
      expect(result.method).toBeNull();
    });
  });

  describe('auth:api-key:list', () => {
    it('应该返回空的 API Key 列表', async () => {
      const handler = handlers.get('auth:api-key:list')!;
      const result = await handler(mockEvent) as { apiKeys: unknown[]; total: number };

      expect(result.apiKeys).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('auth:api-key:revoke', () => {
    it('应该成功撤销 API Key', async () => {
      const handler = handlers.get('auth:api-key:revoke')!;
      const result = await handler(mockEvent, 'key-id') as { success: boolean };

      expect(result.success).toBe(true);
    });
  });
});
