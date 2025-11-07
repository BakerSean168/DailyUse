/**
 * Theme Domain Model
 * 主题领域模型
 */

/** 主题模式 */
export type ThemeMode = 'LIGHT' | 'DARK' | 'AUTO';

/** 字体大小 */
export type FontSize = 'SMALL' | 'MEDIUM' | 'LARGE';

/** 主题配置（值对象） */
export interface ThemeConfig {
  /** 主题模式 */
  mode: ThemeMode;
  /** 主题色（十六进制颜色） */
  accentColor: string;
  /** 字体大小 */
  fontSize: FontSize;
  /** 字体家族 */
  fontFamily: string | null;
  /** 紧凑模式 */
  compactMode: boolean;
}

/** 默认主题配置 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'AUTO',
  accentColor: '#1976D2',
  fontSize: 'MEDIUM',
  fontFamily: null,
  compactMode: false,
};

/** 字体大小映射 */
export const FONT_SIZE_MAP: Record<FontSize, string> = {
  SMALL: '14px',
  MEDIUM: '16px',
  LARGE: '18px',
};
