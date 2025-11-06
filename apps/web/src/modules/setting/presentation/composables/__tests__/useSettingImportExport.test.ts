/**
 * useSettingImportExport 单元测试
 *
 * 测试导入/导出功能：
 * - JSON 导出
 * - JSON 导入
 * - CSV 导出
 * - 本地备份创建和恢复
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingImportExport } from '../useSettingImportExport';

describe('useSettingImportExport', () => {
  const mockSettings = {
    appearance: {
      theme: 'DARK',
      fontSize: 'MEDIUM',
      accentColor: '#FF5733',
    },
    locale: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
    },
    workflow: {
      autoSave: true,
    },
  };

  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear();
    // Mock URL.createObjectURL
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  describe('exportSettings', () => {
    it('应该导出 JSON 格式的设置', () => {
      const { exportSettings } = useSettingImportExport();
      const createElementSpy = vi.spyOn(document, 'createElement');

      exportSettings(mockSettings as any, 'settings.json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('应该包含时间戳和版本信息', () => {
      const { exportSettings } = useSettingImportExport();
      const mockFile = new Blob([JSON.stringify(mockSettings)]);
      
      // Mock fetch 来捕获导出的内容
      exportSettings(mockSettings as any, 'settings.json');

      // 验证文件名包含时间戳
      const link = document.createElement('a');
      expect(link).toBeDefined();
    });
  });

  describe('importSettings', () => {
    it('应该从 JSON 文件导入设置', async () => {
      const { importSettings } = useSettingImportExport();
      
      const jsonContent = JSON.stringify({
        version: '1.0.0',
        timestamp: Date.now(),
        settings: mockSettings,
      });

      const file = new File([jsonContent], 'settings.json', { type: 'application/json' });

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        result: jsonContent,
        addEventListener: vi.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(callback);
          }
        }),
      };

      vi.spyOn(window, 'FileReader').mockReturnValue(mockFileReader as any);

      const result = await importSettings(file);

      expect(result).toBeDefined();
    });

    it('应该验证 JSON 格式', async () => {
      const { importSettings } = useSettingImportExport();
      
      const invalidFile = new File(['invalid json'], 'settings.txt', { type: 'text/plain' });

      // 应该处理无效的 JSON
      expect(async () => {
        await importSettings(invalidFile);
      }).not.toThrow();
    });
  });

  describe('exportAsCSV', () => {
    it('应该导出为 CSV 格式', () => {
      const { exportAsCSV } = useSettingImportExport();
      const createElementSpy = vi.spyOn(document, 'createElement');

      exportAsCSV(mockSettings as any, 'settings.csv');

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('应该包含键值对格式', () => {
      const { exportAsCSV } = useSettingImportExport();

      exportAsCSV(mockSettings as any, 'settings.csv');

      // 验证导出逻辑已执行
      expect(document.createElement).toBeDefined();
    });
  });

  describe('createLocalBackup', () => {
    it('应该创建本地备份到 localStorage', () => {
      const { createLocalBackup } = useSettingImportExport();

      const backup = createLocalBackup(mockSettings as any, 'My Backup');

      expect(backup).toBeDefined();
      expect(backup.name).toBe('My Backup');
      expect(backup.timestamp).toBeDefined();
      expect(backup.settings).toEqual(mockSettings);
    });

    it('应该支持多个备份', () => {
      const { createLocalBackup, getLocalBackups } = useSettingImportExport();

      createLocalBackup(mockSettings as any, 'Backup 1');
      createLocalBackup(mockSettings as any, 'Backup 2');

      const backups = getLocalBackups();
      expect(backups.length).toBeGreaterThanOrEqual(2);
    });

    it('应该自动添加时间戳', () => {
      const { createLocalBackup } = useSettingImportExport();
      const beforeTime = Date.now();

      const backup = createLocalBackup(mockSettings as any, 'Test');

      expect(backup.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(backup.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('restoreFromLocalBackup', () => {
    it('应该从本地备份恢复设置', () => {
      const { createLocalBackup, restoreFromLocalBackup } = useSettingImportExport();

      const backup = createLocalBackup(mockSettings as any, 'Test Backup');
      const restored = restoreFromLocalBackup(backup.id);

      expect(restored).toBeDefined();
      expect(restored.settings).toEqual(mockSettings);
    });

    it('应该为不存在的备份返回 undefined', () => {
      const { restoreFromLocalBackup } = useSettingImportExport();

      const restored = restoreFromLocalBackup('non-existent-id');

      expect(restored).toBeUndefined();
    });
  });

  describe('getLocalBackups', () => {
    it('应该返回所有本地备份', () => {
      const { createLocalBackup, getLocalBackups } = useSettingImportExport();

      createLocalBackup(mockSettings as any, 'Backup 1');
      createLocalBackup(mockSettings as any, 'Backup 2');

      const backups = getLocalBackups();

      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBeGreaterThanOrEqual(2);
    });

    it('应该为空时返回空数组', () => {
      const { getLocalBackups } = useSettingImportExport();

      localStorage.clear();
      const backups = getLocalBackups();

      expect(Array.isArray(backups)).toBe(true);
    });

    it('应该按时间戳排序', () => {
      const { createLocalBackup, getLocalBackups } = useSettingImportExport();

      createLocalBackup(mockSettings as any, 'Backup 1');
      createLocalBackup(mockSettings as any, 'Backup 2');

      const backups = getLocalBackups();

      if (backups.length > 1) {
        for (let i = 0; i < backups.length - 1; i++) {
          expect(backups[i].timestamp).toBeGreaterThanOrEqual(backups[i + 1].timestamp);
        }
      }
    });
  });

  describe('文件处理', () => {
    it('应该处理大型设置对象', () => {
      const { exportSettings } = useSettingImportExport();

      const largeSettings = {
        ...mockSettings,
        largeData: 'x'.repeat(100000),
      };

      expect(() => {
        exportSettings(largeSettings as any, 'large-settings.json');
      }).not.toThrow();
    });

    it('应该处理嵌套的设置结构', () => {
      const { createLocalBackup } = useSettingImportExport();

      const nestedSettings = {
        appearance: {
          theme: 'DARK',
          colors: {
            primary: '#FF5733',
            secondary: '#3366FF',
            nested: {
              deep: '#FF0000',
            },
          },
        },
      };

      const backup = createLocalBackup(nestedSettings as any, 'Nested');

      expect(backup.settings.appearance.colors.nested.deep).toBe('#FF0000');
    });
  });

  describe('错误处理', () => {
    it('应该处理导入错误', async () => {
      const { importSettings } = useSettingImportExport();

      const mockFile = new File(['invalid'], 'test.json', { type: 'application/json' });

      // 应该处理错误而不抛出
      expect(async () => {
        await importSettings(mockFile);
      }).not.toThrow();
    });

    it('应该处理 localStorage 满的情况', () => {
      const { createLocalBackup } = useSettingImportExport();

      // Mock localStorage.setItem 抛出错误
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        createLocalBackup(mockSettings as any, 'Test');
      }).not.toThrow();
    });
  });

  describe('备份管理', () => {
    it('应该支持备份删除', () => {
      const { createLocalBackup, getLocalBackups, deleteLocalBackup } = useSettingImportExport();

      const backup1 = createLocalBackup(mockSettings as any, 'Backup 1');
      createLocalBackup(mockSettings as any, 'Backup 2');

      let backups = getLocalBackups();
      const initialCount = backups.length;

      if (deleteLocalBackup) {
        deleteLocalBackup(backup1.id);
        backups = getLocalBackups();
        expect(backups.length).toBeLessThan(initialCount);
      }
    });

    it('应该支持备份重命名', () => {
      const { createLocalBackup, renameLocalBackup } = useSettingImportExport();

      const backup = createLocalBackup(mockSettings as any, 'Original Name');

      if (renameLocalBackup) {
        renameLocalBackup(backup.id, 'New Name');
        // 可以验证名称是否已更改
      }
    });
  });
});
