/**
 * Theme Events
 * 主题事件定义
 * 
 * 使用全局事件总线实现模块间解耦
 */

import type { ThemeConfig } from '../../domain/ThemeConfig';

/** 主题变更事件名称 */
export const THEME_EVENTS = {
  /** 主题配置变更 */
  CHANGED: 'theme:changed',
  /** 系统主题偏好变更 */
  SYSTEM_CHANGED: 'theme:system-changed',
  /** 主题模式变更 */
  MODE_CHANGED: 'theme:mode-changed',
  /** 主题色变更 */
  ACCENT_COLOR_CHANGED: 'theme:accent-color-changed',
  /** 字体大小变更 */
  FONT_SIZE_CHANGED: 'theme:font-size-changed',
  /** 紧凑模式变更 */
  COMPACT_MODE_CHANGED: 'theme:compact-mode-changed',
} as const;

/** 主题变更事件载荷 */
export interface ThemeChangedPayload {
  /** 之前的主题配置 */
  previous: ThemeConfig | null;
  /** 当前的主题配置 */
  current: ThemeConfig;
  /** 变更来源 */
  source: 'user' | 'system' | 'storage' | 'setting';
}

/** 系统主题偏好变更事件载荷 */
export interface SystemThemeChangedPayload {
  /** 系统主题 */
  theme: 'light' | 'dark';
}

/** 主题模式变更事件载荷 */
export interface ThemeModeChangedPayload {
  mode: ThemeConfig['mode'];
  source: 'user' | 'setting';
}

/** 主题色变更事件载荷 */
export interface AccentColorChangedPayload {
  color: string;
  source: 'user' | 'setting';
}

/** 字体大小变更事件载荷 */
export interface FontSizeChangedPayload {
  fontSize: ThemeConfig['fontSize'];
  source: 'user' | 'setting';
}

/** 紧凑模式变更事件载荷 */
export interface CompactModeChangedPayload {
  enabled: boolean;
  source: 'user' | 'setting';
}

