import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DashboardContracts } from '@dailyuse/contracts';
import type { WidgetMetadata } from '../infrastructure/types/WidgetMetadata';
import { DashboardConfigApiClient } from '../infrastructure/api/DashboardConfigApiClient';
import { widgetRegistry } from '../infrastructure/WidgetRegistry';

// 从 contracts 导入类型
type WidgetConfigData = DashboardContracts.WidgetConfigData;
type WidgetConfig = DashboardContracts.WidgetConfigDTO;

/**
 * Dashboard Widget 配置管理 Store
 *
 * 职责：
 * 1. 管理用户的 Widget 配置状态
 * 2. 与后端 API 同步配置数据
 * 3. 提供 Widget 可见性、顺序、尺寸的计算属性
 * 4. 提供配置更新、重置的方法
 *
 * 使用示例：
 * ```typescript
 * const configStore = useDashboardConfigStore();
 *
 * // 加载配置
 * await configStore.loadConfig();
 *
 * // 获取可见的 Widgets
 * const widgets = configStore.visibleWidgets;
 *
 * // 隐藏某个 Widget
 * await configStore.hideWidget('reminder-stats');
 *
 * // 重新排序
 * await configStore.reorderWidgets({
 *   'task-stats': 3,
 *   'goal-stats': 1
 * });
 * ```
 */
export const useDashboardConfigStore = defineStore('dashboardConfig', () => {
  // ===== State =====

  /**
   * Widget 配置数据
   * Key: Widget ID
   * Value: Widget 配置 (visible, order, size)
   */
  const config = ref<WidgetConfigData>({});

  /**
   * 加载状态
   */
  const loading = ref(false);

  /**
   * 错误信息
   */
  const error = ref<string | null>(null);

  /**
   * 是否已初始化 (已加载过配置)
   */
  const initialized = ref(false);

  // ===== Getters =====

  /**
   * 获取所有可见的 Widgets (包含元数据)
   * 按 order 排序
   */
  const visibleWidgets = computed<Array<WidgetMetadata & { config: WidgetConfig }>>(() => {
    return Object.entries(config.value)
      .filter(([_id, widgetConfig]) => widgetConfig.visible)
      .map(([id, widgetConfig]) => {
        const metadata = widgetRegistry.getWidget(id);
        if (!metadata) {
          console.warn(`[DashboardConfigStore] Widget "${id}" not found in registry`);
          return null;
        }
        return {
          ...metadata,
          config: widgetConfig,
        };
      })
      .filter((widget): widget is WidgetMetadata & { config: WidgetConfig } => widget !== null)
      .sort((a, b) => a.config.order - b.config.order);
  });

  /**
   * 获取所有 Widgets (按 order 排序)
   * 包含隐藏的 Widgets
   */
  const allWidgetsSorted = computed<Array<WidgetMetadata & { config: WidgetConfig }>>(() => {
    return Object.entries(config.value)
      .map(([id, widgetConfig]) => {
        const metadata = widgetRegistry.getWidget(id);
        if (!metadata) return null;
        return {
          ...metadata,
          config: widgetConfig,
        };
      })
      .filter((widget): widget is WidgetMetadata & { config: WidgetConfig } => widget !== null)
      .sort((a, b) => a.config.order - b.config.order);
  });

  /**
   * 获取指定 Widget 的配置
   */
  const getWidgetConfig = (id: string): WidgetConfig | null => {
    return config.value[id] ?? null;
  };

  /**
   * 检查 Widget 是否可见
   */
  const isWidgetVisible = (id: string): boolean => {
    return config.value[id]?.visible ?? false;
  };

  // ===== Actions =====

  /**
   * 加载 Widget 配置
   * 从后端 API 获取用户的配置
   *
   * @throws Error 如果加载失败
   */
  const loadConfig = async (): Promise<void> => {
    if (loading.value) {
      console.warn('[DashboardConfigStore] 已经在加载中，跳过此次请求');
      return;
    }

    const startTime = performance.now();
    console.log('[DashboardConfigStore] 开始加载配置...');

    loading.value = true;
    error.value = null;

    try {
      const data = await DashboardConfigApiClient.getWidgetConfig();
      config.value = data;
      initialized.value = true;

      const duration = performance.now() - startTime;
      console.log(`[DashboardConfigStore] 配置加载成功，耗时: ${duration.toFixed(2)}ms`, data);
    } catch (err) {
      const duration = performance.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      error.value = errorMessage;
      console.error(`[DashboardConfigStore] 配置加载失败，耗时: ${duration.toFixed(2)}ms`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新 Widget 配置 (部分更新)
   *
   * @param updates 要更新的配置
   * @throws Error 如果更新失败
   */
  const updateConfig = async (
    updates: Partial<Record<string, Partial<WidgetConfig>>>,
  ): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const updatedConfig = await DashboardConfigApiClient.updateWidgetConfig(updates);
      config.value = updatedConfig;
      console.log('[DashboardConfigStore] Config updated successfully:', updatedConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      error.value = errorMessage;
      console.error('[DashboardConfigStore] Failed to update config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重置配置为系统默认值
   *
   * @throws Error 如果重置失败
   */
  const resetConfig = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const defaultConfig = await DashboardConfigApiClient.resetWidgetConfig();
      config.value = defaultConfig;
      console.log('[DashboardConfigStore] Config reset to default:', defaultConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      error.value = errorMessage;
      console.error('[DashboardConfigStore] Failed to reset config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ===== 便捷方法 =====

  /**
   * 显示指定 Widget
   *
   * @param id Widget ID
   */
  const showWidget = async (id: string): Promise<void> => {
    await updateConfig({
      [id]: { visible: true },
    });
  };

  /**
   * 隐藏指定 Widget
   *
   * @param id Widget ID
   */
  const hideWidget = async (id: string): Promise<void> => {
    await updateConfig({
      [id]: { visible: false },
    });
  };

  /**
   * 切换 Widget 可见性
   *
   * @param id Widget ID
   */
  const toggleWidget = async (id: string): Promise<void> => {
    const currentConfig = getWidgetConfig(id);
    if (!currentConfig) {
      console.warn(`[DashboardConfigStore] Widget "${id}" not found in config`);
      return;
    }

    await updateConfig({
      [id]: { visible: !currentConfig.visible },
    });
  };

  /**
   * 重新排序 Widgets
   *
   * @param orders Widget ID 到新顺序的映射
   * @example
   * ```typescript
   * await reorderWidgets({
   *   'task-stats': 3,
   *   'goal-stats': 1,
   *   'reminder-stats': 2
   * });
   * ```
   */
  const reorderWidgets = async (orders: Record<string, number>): Promise<void> => {
    const updates: Partial<Record<string, Partial<WidgetConfig>>> = {};

    Object.entries(orders).forEach(([id, order]) => {
      updates[id] = { order };
    });

    await updateConfig(updates);
  };

  /**
   * 调整 Widget 尺寸
   *
   * @param id Widget ID
   * @param size 新尺寸
   */
  const resizeWidget = async (id: string, size: WidgetConfig['size']): Promise<void> => {
    await updateConfig({
      [id]: { size },
    });
  };

  /**
   * 批量更新多个 Widget 的配置
   *
   * @param updates Widget 配置更新映射
   * @example
   * ```typescript
   * await batchUpdate({
   *   'task-stats': { visible: false, size: 'large' },
   *   'goal-stats': { order: 1 }
   * });
   * ```
   */
  const batchUpdate = async (
    updates: Partial<Record<string, Partial<WidgetConfig>>>,
  ): Promise<void> => {
    await updateConfig(updates);
  };

  return {
    // State
    config,
    loading,
    error,
    initialized,

    // Getters
    visibleWidgets,
    allWidgetsSorted,
    getWidgetConfig,
    isWidgetVisible,

    // Actions
    loadConfig,
    updateConfig,
    resetConfig,

    // Convenience methods
    showWidget,
    hideWidget,
    toggleWidget,
    reorderWidgets,
    resizeWidget,
    batchUpdate,
  };
});
