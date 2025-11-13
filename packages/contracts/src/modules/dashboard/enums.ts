/**
 * Dashboard Module Enums
 * Dashboard 模块枚举
 */

/**
 * Widget 尺寸枚举
 */
export enum WidgetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

/**
 * Widget 尺寸显示文本映射
 */
export const WidgetSizeText: Record<WidgetSize, string> = {
  [WidgetSize.SMALL]: '小',
  [WidgetSize.MEDIUM]: '中',
  [WidgetSize.LARGE]: '大',
};
