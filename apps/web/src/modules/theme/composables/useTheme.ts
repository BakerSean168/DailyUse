/**
 * useTheme Composable
 * 主题组合式函数
 * 
 * 提供响应式的主题访问和更新接口
 */

import { computed, ref } from 'vue';
import { ThemeApplicationService } from '../application/services/ThemeApplicationService';
import type { ThemeConfig, ThemeMode, FontSize } from '../domain/ThemeConfig';

export function useTheme() {
  const themeService = ThemeApplicationService.getInstance();
  
  // 当前主题配置（响应式）
  const currentTheme = computed<ThemeConfig>(() => themeService.getCurrentTheme());

  // 各个属性的快捷访问
  const mode = computed<ThemeMode>(() => currentTheme.value.mode);
  const accentColor = computed<string>(() => currentTheme.value.accentColor);
  const fontSize = computed<FontSize>(() => currentTheme.value.fontSize);
  const fontFamily = computed<string | null>(() => currentTheme.value.fontFamily);
  const compactMode = computed<boolean>(() => currentTheme.value.compactMode);

  /**
   * 设置主题模式
   */
  const setMode = async (newMode: ThemeMode) => {
    await themeService.updateTheme({ mode: newMode });
  };

  /**
   * 设置主题色
   */
  const setAccentColor = async (color: string) => {
    await themeService.updateTheme({ accentColor: color });
  };

  /**
   * 设置字体大小
   */
  const setFontSize = async (size: FontSize) => {
    await themeService.updateTheme({ fontSize: size });
  };

  /**
   * 设置字体家族
   */
  const setFontFamily = async (family: string | null) => {
    await themeService.updateTheme({ fontFamily: family });
  };

  /**
   * 切换紧凑模式
   */
  const toggleCompactMode = async () => {
    await themeService.updateTheme({ compactMode: !compactMode.value });
  };

  /**
   * 批量更新主题
   */
  const updateTheme = async (updates: Partial<ThemeConfig>) => {
    await themeService.updateTheme(updates);
  };

  return {
    // 当前主题
    currentTheme,
    mode,
    accentColor,
    fontSize,
    fontFamily,
    compactMode,

    // 更新方法
    setMode,
    setAccentColor,
    setFontSize,
    setFontFamily,
    toggleCompactMode,
    updateTheme,
  };
}
