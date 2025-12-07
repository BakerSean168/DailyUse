/**
 * Setting IPC Handler 测试
 *
 * 测试 Setting 模块的 IPC 通道处理
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ipcMain } from 'electron';
import * as fs from 'fs';
import { createMockEvent } from './mocks';
import { registerSettingIpcHandlers } from '../setting.ipc-handlers';

// Mock fs 模块
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
  },
  app: {
    getPath: vi.fn(() => '/mock/userData'),
  },
}));

describe('Setting IPC Handlers', () => {
  let handlers: Map<string, Function>;
  const mockEvent = createMockEvent();

  beforeEach(() => {
    handlers = new Map();
    vi.clearAllMocks();

    // 默认 mock：设置文件不存在
    vi.mocked(fs.existsSync).mockReturnValue(false);

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      handlers.set(channel, handler);
    });

    registerSettingIpcHandlers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('通道注册', () => {
    it('应该注册所有 setting 通道', () => {
      expect(handlers.has('setting:get-all')).toBe(true);
      expect(handlers.has('setting:get')).toBe(true);
      expect(handlers.has('setting:set')).toBe(true);
      expect(handlers.has('setting:update')).toBe(true);
    });
  });

  describe('setting:get-all', () => {
    it('应该返回默认设置（当文件不存在时）', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const handler = handlers.get('setting:get-all')!;
      const result = await handler(mockEvent) as Record<string, unknown>;

      expect(result).toHaveProperty('theme', 'system');
      expect(result).toHaveProperty('language', 'zh-CN');
      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('general');
    });

    it('应该返回保存的设置', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        theme: 'dark',
        language: 'en-US',
      }));

      const handler = handlers.get('setting:get-all')!;
      const result = await handler(mockEvent) as Record<string, unknown>;

      expect(result.theme).toBe('dark');
      expect(result.language).toBe('en-US');
    });

    it('应该在读取失败时返回默认设置', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });

      const handler = handlers.get('setting:get-all')!;
      const result = await handler(mockEvent) as Record<string, unknown>;

      // 应该返回默认设置
      expect(result).toHaveProperty('theme', 'system');
    });
  });

  describe('setting:get', () => {
    it('应该返回指定键的值', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        theme: 'dark',
      }));

      const handler = handlers.get('setting:get')!;
      const result = await handler(mockEvent, 'theme');

      expect(result).toBe('dark');
    });

    it('应该在键不存在时返回 null', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const handler = handlers.get('setting:get')!;
      const result = await handler(mockEvent, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('setting:set', () => {
    it('应该保存设置并返回成功', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const handler = handlers.get('setting:set')!;
      const result = await handler(mockEvent, 'theme', 'dark') as { success: boolean };

      expect(result.success).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('应该在保存失败时返回失败', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Write error');
      });

      const handler = handlers.get('setting:set')!;
      const result = await handler(mockEvent, 'theme', 'dark') as { success: boolean };

      expect(result.success).toBe(false);
    });
  });

  describe('setting:update', () => {
    it('应该批量更新设置', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const handler = handlers.get('setting:update')!;
      const result = await handler(mockEvent, {
        theme: 'dark',
        language: 'en-US',
      }) as { success: boolean };

      expect(result.success).toBe(true);
      
      // 验证写入的内容包含更新的值
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData.theme).toBe('dark');
      expect(writtenData.language).toBe('en-US');
    });
  });
});
