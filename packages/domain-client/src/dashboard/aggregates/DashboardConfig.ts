/**
 * DashboardConfig 聚合根实现 (Client)
 */

import { WidgetSize } from '@dailyuse/contracts/dashboard';
import type {
  DashboardConfigClient,
  DashboardConfigClientDTO,
  DashboardConfigServerDTO,
  WidgetConfigDTO,
  WidgetConfigData,
} from '@dailyuse/contracts/dashboard';
import { AggregateRoot } from '@dailyuse/utils';
import { WidgetConfig } from '../value-objects';

// 类型别名

export class DashboardConfig extends AggregateRoot implements DashboardConfigClient {
  private _accountUuid: string;
  private _widgetConfig: Map<string, WidgetConfig>;
  private _createdAt: number;
  private _updatedAt: number;

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    widgetConfig: WidgetConfigData;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._widgetConfig = new Map();
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;

    // 初始化 Widget 配置
    Object.entries(params.widgetConfig).forEach(([widgetId, config]) => {
      this._widgetConfig.set(widgetId, WidgetConfig.fromDTO(config));
    });
  }

  // ===== 静态工厂方法 =====

  /**
   * 从 Client DTO 创建实例
   */
  static fromDTO(dto: DashboardConfigDTO): DashboardConfig {
    return new DashboardConfig({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      widgetConfig: dto.widgetConfig,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 Server DTO 创建实例
   */
  static fromServerDTO(dto: DashboardConfigServerDTO): DashboardConfig {
    return new DashboardConfig({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      widgetConfig: dto.widgetConfig,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 创建默认配置
   */
  static createDefault(accountUuid: string): DashboardConfig {
    const now = Date.now();
    const defaultConfig: WidgetConfigData = {
      'task-stats': { visible: true, order: 1, size: WidgetSize.MEDIUM },
      'goal-stats': { visible: true, order: 2, size: WidgetSize.MEDIUM },
      'reminder-stats': { visible: true, order: 3, size: WidgetSize.SMALL },
      'schedule-stats': { visible: true, order: 4, size: WidgetSize.SMALL },
    };

    return new DashboardConfig({
      accountUuid,
      widgetConfig: defaultConfig,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== Getter 属性 =====

  override get uuid(): string {
    return this._uuid;
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get widgetConfig(): WidgetConfigData {
    const config: WidgetConfigData = {};
    this._widgetConfig.forEach((value, key) => {
      config[key] = value.toDTO();
    });
    return config;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // ===== 计算属性 =====

  /**
   * 获取可见的 Widget ID 列表（按 order 排序）
   */
  getVisibleWidgetIds(): string[] {
    return Array.from(this._widgetConfig.entries())
      .filter(([_, config]) => config.visible)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([widgetId]) => widgetId);
  }

  /**
   * 获取 Widget 总数
   */
  getWidgetCount(): number {
    return this._widgetConfig.size;
  }

  /**
   * 获取可见的 Widget 数量
   */
  getVisibleWidgetCount(): number {
    return Array.from(this._widgetConfig.values()).filter((config) => config.visible).length;
  }

  /**
   * 获取指定 Widget 的配置
   */
  getWidgetConfig(widgetId: string): WidgetConfigDTO | null {
    const config = this._widgetConfig.get(widgetId);
    return config ? config.toDTO() : null;
  }

  /**
   * 检查 Widget 是否可见
   */
  isWidgetVisible(widgetId: string): boolean {
    const config = this._widgetConfig.get(widgetId);
    return config ? config.visible : false;
  }

  // ===== 业务方法 =====

  /**
   * 更新 Widget 配置（部分更新）
   */
  updateWidgetConfig(updates: Partial<WidgetConfigData>): DashboardConfig {
    Object.entries(updates).forEach(([widgetId, updateConfig]) => {
      if (!updateConfig) return;

      const currentConfig = this._widgetConfig.get(widgetId);

      if (!currentConfig) {
        // Widget 不存在，创建新配置
        this._widgetConfig.set(
          widgetId,
          WidgetConfig.fromDTO({
            visible: updateConfig.visible ?? true,
            order: updateConfig.order ?? this._widgetConfig.size + 1,
            size: updateConfig.size ?? WidgetSize.MEDIUM,
          }),
        );
      } else {
        // Widget 存在，合并更新
        const newConfig = WidgetConfig.fromDTO({
          visible: updateConfig.visible ?? currentConfig.visible,
          order: updateConfig.order ?? currentConfig.order,
          size: updateConfig.size ?? currentConfig.size,
        });
        this._widgetConfig.set(widgetId, newConfig);
      }
    });

    this._updatedAt = Date.now();
    return this;
  }

  /**
   * 显示 Widget
   */
  showWidget(widgetId: string): DashboardConfig {
    const config = this._widgetConfig.get(widgetId);
    if (config) {
      this._widgetConfig.set(widgetId, config.withVisible(true));
      this._updatedAt = Date.now();
    }
    return this;
  }

  /**
   * 隐藏 Widget
   */
  hideWidget(widgetId: string): DashboardConfig {
    const config = this._widgetConfig.get(widgetId);
    if (config) {
      this._widgetConfig.set(widgetId, config.withVisible(false));
      this._updatedAt = Date.now();
    }
    return this;
  }

  /**
   * 重新排序 Widget
   */
  reorderWidget(widgetId: string, newOrder: number): DashboardConfig {
    const config = this._widgetConfig.get(widgetId);
    if (config) {
      this._widgetConfig.set(widgetId, config.withOrder(newOrder));
      this._updatedAt = Date.now();
    }
    return this;
  }

  /**
   * 调整 Widget 尺寸
   */
  resizeWidget(widgetId: string, size: WidgetSize): DashboardConfig {
    const config = this._widgetConfig.get(widgetId);
    if (config) {
      this._widgetConfig.set(widgetId, config.withSize(size));
      this._updatedAt = Date.now();
    }
    return this;
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): DashboardConfig {
    const defaultConfig = DashboardConfig.createDefault(this._accountUuid);
    this._widgetConfig = defaultConfig._widgetConfig;
    this._updatedAt = Date.now();
    return this;
  }

  // ===== 转换方法 =====

  /**
   * 转换为 DTO
   */
  toDTO(): DashboardConfigDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      widgetConfig: this.widgetConfig,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      visibleWidgetIds: this.getVisibleWidgetIds(),
      widgetCount: this.getWidgetCount(),
      visibleWidgetCount: this.getVisibleWidgetCount(),
    };
  }

  /**
   * 克隆实例
   */
  clone(): DashboardConfig {
    return DashboardConfig.fromDTO(this.toDTO());
  }
}
