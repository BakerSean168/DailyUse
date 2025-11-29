import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDashboardConfigStore } from '../dashboardConfigStore';
import { DashboardConfigApiClient } from '../../infrastructure/api/DashboardConfigApiClient';
import type { WidgetConfig, DashboardConfigClientDTO } from '@dailyuse/contracts/dashboard';


// Mock API Client
vi.mock('../../infrastructure/api/DashboardConfigApiClient');

// Mock WidgetRegistry
vi.mock('../../infrastructure/WidgetRegistry', () => ({
  widgetRegistry: {
    getWidget: vi.fn((id: string) => {
      const widgets: Record<string, any> = {
        'task-stats': { id: 'task-stats', name: '任务统计', defaultOrder: 1 },
        'goal-stats': { id: 'goal-stats', name: '目标统计', defaultOrder: 2 },
        'reminder-stats': { id: 'reminder-stats', name: '提醒统计', defaultOrder: 3 },
      };
      return widgets[id] ?? null;
    }),
  },
}));

describe('useDashboardConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty initial state', () => {
      const store = useDashboardConfigStore();

      expect(store.config).toEqual({});
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.initialized).toBe(false);
    });
  });

  describe('loadConfig', () => {
    it('should load config successfully', async () => {
      const mockConfig: WidgetConfigData = {
        'task-stats': { visible: true, order: 1, size: 'medium' },
        'goal-stats': { visible: true, order: 2, size: 'large' },
      };

      vi.mocked(DashboardConfigApiClient.getWidgetConfig).mockResolvedValue(mockConfig);

      const store = useDashboardConfigStore();
      await store.loadConfig();

      expect(store.config).toEqual(mockConfig);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.initialized).toBe(true);
    });

    it('should handle load error', async () => {
      const mockError = new Error('网络错误');
      vi.mocked(DashboardConfigApiClient.getWidgetConfig).mockRejectedValue(mockError);

      const store = useDashboardConfigStore();

      await expect(store.loadConfig()).rejects.toThrow('网络错误');

      expect(store.loading).toBe(false);
      expect(store.error).toBe('网络错误');
      expect(store.initialized).toBe(false);
    });

    it('should skip if already loading', async () => {
      vi.mocked(DashboardConfigApiClient.getWidgetConfig).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const store = useDashboardConfigStore();

      // 启动第一次加载
      const promise1 = store.loadConfig();

      // 第二次加载应该被跳过
      await store.loadConfig();

      await promise1;

      expect(DashboardConfigApiClient.getWidgetConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateConfig', () => {
    it('should update config successfully', async () => {
      const initialConfig: WidgetConfigData = {
        'task-stats': { visible: true, order: 1, size: 'medium' },
      };

      const updatedConfig: WidgetConfigData = {
        'task-stats': { visible: false, order: 1, size: 'medium' },
      };

      vi.mocked(DashboardConfigApiClient.updateWidgetConfig).mockResolvedValue(updatedConfig);

      const store = useDashboardConfigStore();
      store.config = initialConfig;

      await store.updateConfig({
        'task-stats': { visible: false },
      });

      expect(store.config).toEqual(updatedConfig);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle update error', async () => {
      const mockError = new Error('更新失败');
      vi.mocked(DashboardConfigApiClient.updateWidgetConfig).mockRejectedValue(mockError);

      const store = useDashboardConfigStore();

      await expect(store.updateConfig({ 'task-stats': { visible: false } })).rejects.toThrow(
        '更新失败',
      );

      expect(store.error).toBe('更新失败');
    });
  });

  describe('resetConfig', () => {
    it('should reset config successfully', async () => {
      const defaultConfig: WidgetConfigData = {
        'task-stats': { visible: true, order: 1, size: 'medium' },
        'goal-stats': { visible: true, order: 2, size: 'medium' },
      };

      vi.mocked(DashboardConfigApiClient.resetWidgetConfig).mockResolvedValue(defaultConfig);

      const store = useDashboardConfigStore();
      store.config = { 'task-stats': { visible: false, order: 1, size: 'small' } };

      await store.resetConfig();

      expect(store.config).toEqual(defaultConfig);
      expect(store.error).toBeNull();
    });

    it('should handle reset error', async () => {
      const mockError = new Error('重置失败');
      vi.mocked(DashboardConfigApiClient.resetWidgetConfig).mockRejectedValue(mockError);

      const store = useDashboardConfigStore();

      await expect(store.resetConfig()).rejects.toThrow('重置失败');
      expect(store.error).toBe('重置失败');
    });
  });

  describe('Getters', () => {
    it('should return visible widgets', () => {
      const store = useDashboardConfigStore();
      store.config = {
        'task-stats': { visible: true, order: 2, size: 'medium' },
        'goal-stats': { visible: false, order: 1, size: 'large' },
        'reminder-stats': { visible: true, order: 1, size: 'small' },
      };

      const visible = store.visibleWidgets;

      expect(visible).toHaveLength(2);
      expect(visible[0].id).toBe('reminder-stats'); // order 1
      expect(visible[1].id).toBe('task-stats'); // order 2
    });

    it('should return all widgets sorted', () => {
      const store = useDashboardConfigStore();
      store.config = {
        'task-stats': { visible: true, order: 3, size: 'medium' },
        'goal-stats': { visible: false, order: 1, size: 'large' },
        'reminder-stats': { visible: true, order: 2, size: 'small' },
      };

      const all = store.allWidgetsSorted;

      expect(all).toHaveLength(3);
      expect(all[0].id).toBe('goal-stats'); // order 1
      expect(all[1].id).toBe('reminder-stats'); // order 2
      expect(all[2].id).toBe('task-stats'); // order 3
    });

    it('should get widget config by id', () => {
      const store = useDashboardConfigStore();
      store.config = {
        'task-stats': { visible: true, order: 1, size: 'medium' },
      };

      const config = store.getWidgetConfig('task-stats');

      expect(config).toEqual({ visible: true, order: 1, size: 'medium' });
    });

    it('should return null for non-existent widget', () => {
      const store = useDashboardConfigStore();

      expect(store.getWidgetConfig('non-existent')).toBeNull();
    });

    it('should check if widget is visible', () => {
      const store = useDashboardConfigStore();
      store.config = {
        'task-stats': { visible: true, order: 1, size: 'medium' },
        'goal-stats': { visible: false, order: 2, size: 'large' },
      };

      expect(store.isWidgetVisible('task-stats')).toBe(true);
      expect(store.isWidgetVisible('goal-stats')).toBe(false);
      expect(store.isWidgetVisible('non-existent')).toBe(false);
    });
  });

  describe('Convenience Methods', () => {
    it('should show widget', async () => {
      const updatedConfig: WidgetConfigData = {
        'task-stats': { visible: true, order: 1, size: 'medium' },
      };

      vi.mocked(DashboardConfigApiClient.updateWidgetConfig).mockResolvedValue(updatedConfig);

      const store = useDashboardConfigStore();
      await store.showWidget('task-stats');

      expect(DashboardConfigApiClient.updateWidgetConfig).toHaveBeenCalledWith({
        'task-stats': { visible: true },
      });
    });

    it('should hide widget', async () => {
      const updatedConfig: WidgetConfigData = {
        'task-stats': { visible: false, order: 1, size: 'medium' },
      };

      vi.mocked(DashboardConfigApiClient.updateWidgetConfig).mockResolvedValue(updatedConfig);

      const store = useDashboardConfigStore();
      await store.hideWidget('task-stats');

      expect(DashboardConfigApiClient.updateWidgetConfig).toHaveBeenCalledWith({
        'task-stats': { visible: false },
      });
    });

    it('should toggle widget visibility', async () => {
      const store = useDashboardConfigStore();
      store.config = {
        'task-stats': { visible: true, order: 1, size: 'medium' },
      };

      const updatedConfig: WidgetConfigData = {
        'task-stats': { visible: false, order: 1, size: 'medium' },
      };

      vi.mocked(DashboardConfigApiClient.updateWidgetConfig).mockResolvedValue(updatedConfig);

      await store.toggleWidget('task-stats');

      expect(DashboardConfigApiClient.updateWidgetConfig).toHaveBeenCalledWith({
        'task-stats': { visible: false },
      });
    });

    it('should reorder widgets', async () => {
      const updatedConfig: WidgetConfigData = {
        'task-stats': { visible: true, order: 3, size: 'medium' },
        'goal-stats': { visible: true, order: 1, size: 'large' },
      };

      vi.mocked(DashboardConfigApiClient.updateWidgetConfig).mockResolvedValue(updatedConfig);

      const store = useDashboardConfigStore();
      await store.reorderWidgets({
        'task-stats': 3,
        'goal-stats': 1,
      });

      expect(DashboardConfigApiClient.updateWidgetConfig).toHaveBeenCalledWith({
        'task-stats': { order: 3 },
        'goal-stats': { order: 1 },
      });
    });

    it('should resize widget', async () => {
      const updatedConfig: WidgetConfigData = {
        'task-stats': { visible: true, order: 1, size: 'large' },
      };

      vi.mocked(DashboardConfigApiClient.updateWidgetConfig).mockResolvedValue(updatedConfig);

      const store = useDashboardConfigStore();
      await store.resizeWidget('task-stats', 'large');

      expect(DashboardConfigApiClient.updateWidgetConfig).toHaveBeenCalledWith({
        'task-stats': { size: 'large' },
      });
    });

    it('should batch update multiple widgets', async () => {
      const updates = {
        'task-stats': { visible: false, size: 'large' as const },
        'goal-stats': { order: 1 },
      };

      const updatedConfig: WidgetConfigData = {
        'task-stats': { visible: false, order: 1, size: 'large' },
        'goal-stats': { visible: true, order: 1, size: 'medium' },
      };

      vi.mocked(DashboardConfigApiClient.updateWidgetConfig).mockResolvedValue(updatedConfig);

      const store = useDashboardConfigStore();
      await store.batchUpdate(updates);

      expect(DashboardConfigApiClient.updateWidgetConfig).toHaveBeenCalledWith(updates);
      expect(store.config).toEqual(updatedConfig);
    });
  });
});

