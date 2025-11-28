/**
 * UIConfig 值对象实现
 * 实现 UIConfigServer 接口
 */

import type {
  UIConfigClientDTO,
  UIConfigServer,
  UIConfigServerDTO,
  UIInputType,
} from '@dailyuse/contracts/setting';

/**
 * UIConfig 值对象
 * 不可变的UI配置
 */
export class UIConfig implements UIConfigServer {
  public readonly inputType: UIInputType;
  public readonly label: string;
  public readonly placeholder?: string | null;
  public readonly helpText?: string | null;
  public readonly icon?: string | null;
  public readonly order: number;
  public readonly visible: boolean;
  public readonly disabled: boolean;
  public readonly options?: Array<{ label: string; value: unknown }> | null;
  public readonly min?: number | null;
  public readonly max?: number | null;
  public readonly step?: number | null;

  private constructor(params: {
    inputType: UIInputType;
    label: string;
    placeholder?: string | null;
    helpText?: string | null;
    icon?: string | null;
    order: number;
    visible: boolean;
    disabled: boolean;
    options?: Array<{ label: string; value: unknown }> | null;
    min?: number | null;
    max?: number | null;
    step?: number | null;
  }) {
    this.inputType = params.inputType;
    this.label = params.label;
    this.placeholder = params.placeholder ?? null;
    this.helpText = params.helpText ?? null;
    this.icon = params.icon ?? null;
    this.order = params.order;
    this.visible = params.visible;
    this.disabled = params.disabled;
    this.options = params.options ?? null;
    this.min = params.min ?? null;
    this.max = params.max ?? null;
    this.step = params.step ?? null;
  }

  /**
   * 创建新的 UIConfig
   */
  public static create(params: {
    inputType: UIInputType;
    label: string;
    placeholder?: string;
    helpText?: string;
    icon?: string;
    order?: number;
    visible?: boolean;
    disabled?: boolean;
    options?: Array<{ label: string; value: unknown }>;
    min?: number;
    max?: number;
    step?: number;
  }): UIConfig {
    if (!params.label || params.label.trim().length === 0) {
      throw new Error('Label is required');
    }

    return new UIConfig({
      inputType: params.inputType,
      label: params.label.trim(),
      placeholder: params.placeholder,
      helpText: params.helpText,
      icon: params.icon,
      order: params.order ?? 0,
      visible: params.visible ?? true,
      disabled: params.disabled ?? false,
      options: params.options,
      min: params.min,
      max: params.max,
      step: params.step,
    });
  }

  /**
   * 从 ServerDTO 创建
   */
  public static fromServerDTO(dto: UIConfigServerDTO): UIConfig {
    if (!dto.label) {
      throw new Error('Label is required');
    }
    return new UIConfig({
      inputType: dto.inputType as UIInputType,
      label: dto.label,
      placeholder: dto.placeholder,
      helpText: dto.helpText,
      icon: dto.icon,
      order: dto.order,
      visible: dto.visible,
      disabled: dto.disabled,
      options: dto.options,
      min: dto.min,
      max: dto.max,
      step: dto.step,
    });
  }

  /**
   * 检查是否有选项
   */
  public hasOptions(): boolean {
    return this.options !== null && this.options !== undefined && this.options.length > 0;
  }

  /**
   * 检查是否有范围
   */
  public hasRange(): boolean {
    return (
      (this.min !== null && this.min !== undefined) || (this.max !== null && this.max !== undefined)
    );
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): UIConfigServerDTO {
    return {
      inputType: this.inputType,
      label: this.label,
      placeholder: this.placeholder,
      helpText: this.helpText,
      icon: this.icon,
      order: this.order,
      visible: this.visible,
      disabled: this.disabled,
      options: this.options,
      min: this.min,
      max: this.max,
      step: this.step,
    };
  }

  public toClientDTO(): UIConfigClientDTO {
    return {
      inputType: this.inputType,
      label: this.label,
      placeholder: this.placeholder,
      helpText: this.helpText,
      icon: this.icon,
      order: this.order,
      visible: this.visible,
      disabled: this.disabled,
      options: this.options,
      min: this.min,
      max: this.max,
      step: this.step,
    };
  }
}
