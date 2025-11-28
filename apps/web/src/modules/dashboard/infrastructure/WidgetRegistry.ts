import type { WidgetMetadata } from './types/WidgetMetadata';
import type { WidgetConfig, DashboardConfigClientDTO, WidgetDefinition } from '@dailyuse/contracts/dashboard';
import { WidgetSize } from '@dailyuse/contracts/dashboard';

/**
 * Widget 注册表 (Singleton)
 *
 * 职责：
 * 1. 管理所有可用的 Dashboard Widgets
 * 2. 提供 Widget 组件的注册和查询功能
 * 3. 确保 Widget ID 的唯一性
 *
 * 使用示例：
 * ```typescript
 * // 注册 Widget
 * WidgetRegistry.getInstance().registerWidget({
 *   id: 'task-stats',
 *   name: '任务统计',
 *   component: TaskStatsWidget,
 *   defaultVisible: true,
 *   defaultOrder: 1,
 *   defaultSize: 'medium'
 * });
 *
 * // 获取 Widget
 * const widget = WidgetRegistry.getInstance().getWidget('task-stats');
 *
 * // 获取所有 Widgets
 * const allWidgets = WidgetRegistry.getInstance().getAllWidgets();
 * ```
 */
export class WidgetRegistry {
  private static instance: WidgetRegistry | null = null;

  /**
   * Widget 存储 Map
   * Key: Widget ID
   * Value: Widget 元数据
   */
  private readonly widgets: Map<string, WidgetMetadata>;

  /**
   * 私有构造函数 (确保单例模式)
   */
  private constructor() {
    this.widgets = new Map<string, WidgetMetadata>();
  }

  /**
   * 获取单例实例
   * @returns WidgetRegistry 实例
   */
  public static getInstance(): WidgetRegistry {
    if (WidgetRegistry.instance === null) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  /**
   * 注册 Widget
   *
   * @param metadata Widget 元数据
   * @throws Error 如果 Widget ID 已存在
   *
   * @example
   * ```typescript
   * registry.registerWidget({
   *   id: 'task-stats',
   *   name: '任务统计',
   *   component: TaskStatsWidget,
   *   defaultVisible: true,
   *   defaultOrder: 1,
   *   defaultSize: 'medium',
   *   icon: 'i-heroicons-chart-bar',
   *   category: 'statistics'
   * });
   * ```
   */
  public registerWidget(metadata: WidgetMetadata): void {
    if (this.widgets.has(metadata.id)) {
      console.warn(
        `[WidgetRegistry] Widget with ID "${metadata.id}" is already registered. Overwriting...`,
      );
    }

    // 验证必填字段
    if (!metadata.id || !metadata.name || !metadata.component) {
      throw new Error(
        '[WidgetRegistry] Widget registration failed: id, name, and component are required',
      );
    }

    this.widgets.set(metadata.id, metadata);
    console.log(`[WidgetRegistry] Widget "${metadata.id}" registered successfully`);
  }

  /**
   * 获取指定 ID 的 Widget
   *
   * @param id Widget ID
   * @returns Widget 元数据，如果不存在返回 null
   *
   * @example
   * ```typescript
   * const widget = registry.getWidget('task-stats');
   * if (widget) {
   *   console.log(widget.name); // '任务统计'
   * }
   * ```
   */
  public getWidget(id: string): WidgetMetadata | null {
    return this.widgets.get(id) ?? null;
  }

  /**
   * 获取所有已注册的 Widgets
   *
   * @returns Widget 元数据数组 (按 defaultOrder 排序)
   *
   * @example
   * ```typescript
   * const allWidgets = registry.getAllWidgets();
   * console.log(allWidgets.length); // 4
   * ```
   */
  public getAllWidgets(): WidgetMetadata[] {
    return Array.from(this.widgets.values()).sort((a, b) => a.defaultOrder - b.defaultOrder);
  }

  /**
   * 检查 Widget 是否已注册
   *
   * @param id Widget ID
   * @returns 是否已注册
   *
   * @example
   * ```typescript
   * if (registry.hasWidget('task-stats')) {
   *   console.log('Widget exists!');
   * }
   * ```
   */
  public hasWidget(id: string): boolean {
    return this.widgets.has(id);
  }

  /**
   * 注销 Widget
   *
   * @param id Widget ID
   * @returns 是否成功注销
   *
   * @example
   * ```typescript
   * registry.unregisterWidget('custom-widget');
   * ```
   */
  public unregisterWidget(id: string): boolean {
    if (!this.widgets.has(id)) {
      console.warn(`[WidgetRegistry] Widget "${id}" not found, cannot unregister`);
      return false;
    }

    this.widgets.delete(id);
    console.log(`[WidgetRegistry] Widget "${id}" unregistered successfully`);
    return true;
  }

  /**
   * 获取指定分类的所有 Widgets
   *
   * @param category Widget 分类
   * @returns 该分类的所有 Widgets
   *
   * @example
   * ```typescript
   * const statsWidgets = registry.getWidgetsByCategory('statistics');
   * ```
   */
  public getWidgetsByCategory(category: string): WidgetMetadata[] {
    return this.getAllWidgets().filter((widget) => widget.category === category);
  }

  /**
   * 清空所有 Widgets (仅用于测试)
   *
   * @internal
   */
  public clear(): void {
    this.widgets.clear();
    console.warn('[WidgetRegistry] All widgets cleared (TEST ONLY)');
  }

  /**
   * 获取 Widget 数量
   *
   * @returns 已注册的 Widget 数量
   */
  public get count(): number {
    return this.widgets.size;
  }
}

/**
 * 导出单例实例便捷访问
 *
 * @example
 * ```typescript
 * import { widgetRegistry } from './infrastructure/WidgetRegistry';
 *
 * widgetRegistry.registerWidget({ ... });
 * ```
 */
export const widgetRegistry = WidgetRegistry.getInstance();



