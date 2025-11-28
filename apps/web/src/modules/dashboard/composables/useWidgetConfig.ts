import { computed, watch } from 'vue';
import { useDashboardConfigStore } from '../stores/dashboardConfigStore';
import type { WidgetConfig, DashboardConfigClientDTO, WidgetDefinition } from '@dailyuse/contracts/dashboard';

// 本地类型别名（无需导出，web 应用不生成 .d.ts）
type WidgetConfig = WidgetConfigDTO;

/**
 * Widget 配置管理 Composable
 *
 * 封装 dashboardConfigStore，提供更便捷的 API
 *
 * 功能：
 * - 自动加载配置
 * - 响应式的配置状态
 * - 便捷的更新方法
 *
 * 使用示例：
 * ```vue
 * <script setup>
 * const {
 *   visibleWidgets,
 *   loading,
 *   hideWidget,
 *   reorderWidgets
 * } = useWidgetConfig({ autoLoad: true });
 * </script>
 * ```
 */
export function useWidgetConfig(
  options: {
    /**
     * 是否自动加载配置
     * @default false
     */
    autoLoad?: boolean;
  } = {},
) {
  const { autoLoad = false } = options;

  const store = useDashboardConfigStore();

  // 如果启用自动加载且未初始化，则加载配置
  if (autoLoad && !store.initialized) {
    store.loadConfig().catch((err) => {
      console.error('[useWidgetConfig] Auto-load failed:', err);
    });
  }

  // ===== Computed Properties =====

  /**
   * 可见的 Widgets (响应式)
   */
  const visibleWidgets = computed(() => store.visibleWidgets);

  /**
   * 所有 Widgets (按顺序，包含隐藏的)
   */
  const allWidgets = computed(() => store.allWidgetsSorted);

  /**
   * 加载状态
   */
  const loading = computed(() => store.loading);

  /**
   * 错误信息
   */
  const error = computed(() => store.error);

  /**
   * 是否已初始化
   */
  const initialized = computed(() => store.initialized);

  /**
   * 原始配置数据
   */
  const config = computed(() => store.config);

  // ===== Methods =====

  /**
   * 手动加载配置
   */
  const loadConfig = async () => {
    await store.loadConfig();
  };

  /**
   * 重新加载配置 (强制刷新)
   */
  const reloadConfig = async () => {
    await store.loadConfig();
  };

  /**
   * 显示 Widget
   */
  const showWidget = async (id: string) => {
    await store.showWidget(id);
  };

  /**
   * 隐藏 Widget
   */
  const hideWidget = async (id: string) => {
    await store.hideWidget(id);
  };

  /**
   * 切换 Widget 可见性
   */
  const toggleWidget = async (id: string) => {
    await store.toggleWidget(id);
  };

  /**
   * 重新排序 Widgets
   */
  const reorderWidgets = async (orders: Record<string, number>) => {
    await store.reorderWidgets(orders);
  };

  /**
   * 调整 Widget 尺寸
   */
  const resizeWidget = async (id: string, size: WidgetConfig['size']) => {
    await store.resizeWidget(id, size);
  };

  /**
   * 批量更新配置
   */
  const batchUpdate = async (updates: Partial<Record<string, Partial<WidgetConfig>>>) => {
    await store.batchUpdate(updates);
  };

  /**
   * 重置配置为默认值
   */
  const resetConfig = async () => {
    await store.resetConfig();
  };

  /**
   * 获取指定 Widget 的配置
   */
  const getWidgetConfig = (id: string) => {
    return store.getWidgetConfig(id);
  };

  /**
   * 检查 Widget 是否可见
   */
  const isWidgetVisible = (id: string) => {
    return store.isWidgetVisible(id);
  };

  // ===== Watchers (可选) =====

  /**
   * 监听配置变化 (用于调试或外部同步)
   *
   * @param callback 配置变化回调
   * @returns 停止监听的函数
   */
  const watchConfig = (callback: (newConfig: typeof config.value) => void) => {
    return watch(
      config,
      (newConfig) => {
        callback(newConfig);
      },
      { deep: true },
    );
  };

  return {
    // State
    visibleWidgets,
    allWidgets,
    loading,
    error,
    initialized,
    config,

    // Methods
    loadConfig,
    reloadConfig,
    showWidget,
    hideWidget,
    toggleWidget,
    reorderWidgets,
    resizeWidget,
    batchUpdate,
    resetConfig,
    getWidgetConfig,
    isWidgetVisible,
    watchConfig,
  };
}

