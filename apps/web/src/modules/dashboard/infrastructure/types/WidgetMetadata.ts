/**
 * Widget Metadata
 * Dashboard Widget 元数据类型定义
 */

import type { Component } from 'vue';
import { WidgetSize } from '@dailyuse/contracts/dashboard';

// Re-export WidgetSize for convenience
export { WidgetSize };

/**
 * Widget 元数据
 */
export interface WidgetMetadata {
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** Vue 组件 */
  component: Component;
  /** 默认可见 */
  defaultVisible: boolean;
  /** 默认顺序 */
  defaultOrder: number;
  /** 默认尺寸 */
  defaultSize: WidgetSize;
  /** 图标 */
  icon?: string;
  /** 分类 */
  category?: string;
}
