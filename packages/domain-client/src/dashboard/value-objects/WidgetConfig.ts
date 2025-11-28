/**
 * WidgetConfig 值对象实现 (Client)
 */
import { WidgetConfigClient, WidgetConfigDTO, WidgetSize } from '@dailyuse/contracts/dashboard';

/**
 * Widget 配置值对象 (Client)
 */
export class WidgetConfig implements WidgetConfigClient {
  readonly visible: boolean;
  readonly order: number;
  readonly size: WidgetSize;

  private constructor(params: { visible: boolean; order: number; size: WidgetSize }) {
    this.visible = params.visible;
    this.order = params.order;
    this.size = params.size;
  }

  // ===== 静态工厂方法 =====

  /**
   * 从 DTO 创建实例
   */
  static fromDTO(dto: WidgetConfigDTO): WidgetConfig {
    return new WidgetConfig({
      visible: dto.visible,
      order: dto.order,
      size: dto.size,
    });
  }

  /**
   * 创建默认配置
   */
  static createDefault(
    order: number,
    size: WidgetSize = WidgetSize.MEDIUM,
  ): WidgetConfig {
    return new WidgetConfig({
      visible: true,
      order,
      size,
    });
  }

  // ===== 实例方法 =====

  /**
   * 转换为 DTO
   */
  toDTO(): WidgetConfigDTO {
    return {
      visible: this.visible,
      order: this.order,
      size: this.size,
    };
  }

  /**
   * 克隆配置
   */
  clone(): WidgetConfig {
    return new WidgetConfig({
      visible: this.visible,
      order: this.order,
      size: this.size,
    });
  }

  /**
   * 是否与另一个配置相等
   */
  equals(other: WidgetConfig): boolean {
    return this.visible === other.visible && this.order === other.order && this.size === other.size;
  }

  /**
   * 更新可见性
   */
  withVisible(visible: boolean): WidgetConfig {
    return new WidgetConfig({
      ...this,
      visible,
    });
  }

  /**
   * 更新顺序
   */
  withOrder(order: number): WidgetConfig {
    return new WidgetConfig({
      ...this,
      order,
    });
  }

  /**
   * 更新尺寸
   */
  withSize(size: WidgetSize): WidgetConfig {
    return new WidgetConfig({
      ...this,
      size,
    });
  }
}
