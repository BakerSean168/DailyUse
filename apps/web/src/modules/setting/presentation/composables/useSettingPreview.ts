/**
 * 设置实时预览 Composable
 * 支持主题、字体等设置的实时预览
 */

import { ref, watch, computed } from 'vue';
import type { UserSettingClientDTO } from '@dailyuse/contracts';

export interface PreviewSettings {
  theme: string;
  fontSize: string;
  fontFamily?: string | null;
  accentColor: string;
  compactMode: boolean;
}

export function useSettingPreview(initialSettings: PreviewSettings) {
  // 预览设置
  const previewSettings = ref<PreviewSettings>({ ...initialSettings });
  
  // 是否启用预览
  const previewEnabled = ref(true);

  // 应用预览主题
  const applyThemePreview = (theme: string) => {
    previewSettings.value.theme = theme;
    
    // 应用到 DOM
    const htmlElement = document.documentElement;
    
    if (theme === 'DARK') {
      htmlElement.classList.add('dark-theme');
      htmlElement.classList.remove('light-theme');
    } else if (theme === 'LIGHT') {
      htmlElement.classList.add('light-theme');
      htmlElement.classList.remove('dark-theme');
    } else {
      // AUTO - 跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        htmlElement.classList.add('dark-theme');
        htmlElement.classList.remove('light-theme');
      } else {
        htmlElement.classList.add('light-theme');
        htmlElement.classList.remove('dark-theme');
      }
    }
  };

  // 应用预览字体
  const applyFontSizePreview = (fontSize: string) => {
    previewSettings.value.fontSize = fontSize;
    
    const htmlElement = document.documentElement;
    
    // 移除所有字体大小类
    htmlElement.classList.remove('font-small', 'font-medium', 'font-large');
    
    // 添加新的字体大小类
    const sizeClassMap: Record<string, string> = {
      'SMALL': 'font-small',
      'MEDIUM': 'font-medium',
      'LARGE': 'font-large',
    };
    
    const sizeClass = sizeClassMap[fontSize];
    if (sizeClass) {
      htmlElement.classList.add(sizeClass);
    }
  };

  // 应用预览强调色
  const applyAccentColorPreview = (color: string) => {
    previewSettings.value.accentColor = color;
    document.documentElement.style.setProperty('--accent-color', color);
  };

  // 应用预览紧凑模式
  const applyCompactModePreview = (compact: boolean) => {
    previewSettings.value.compactMode = compact;
    
    const htmlElement = document.documentElement;
    if (compact) {
      htmlElement.classList.add('compact-mode');
    } else {
      htmlElement.classList.remove('compact-mode');
    }
  };

  // 应用预览字体族
  const applyFontFamilyPreview = (fontFamily?: string | null) => {
    previewSettings.value.fontFamily = fontFamily;
    
    if (fontFamily) {
      document.documentElement.style.fontFamily = fontFamily;
    } else {
      document.documentElement.style.fontFamily = '';
    }
  };

  // 重置预览到初始值
  const resetPreview = () => {
    previewSettings.value = { ...initialSettings };
    applyThemePreview(initialSettings.theme);
    applyFontSizePreview(initialSettings.fontSize);
    applyAccentColorPreview(initialSettings.accentColor);
    applyCompactModePreview(initialSettings.compactMode);
    applyFontFamilyPreview(initialSettings.fontFamily);
  };

  // 立即应用所有预览
  const applyAllPreview = (settings: PreviewSettings) => {
    applyThemePreview(settings.theme);
    applyFontSizePreview(settings.fontSize);
    applyAccentColorPreview(settings.accentColor);
    applyCompactModePreview(settings.compactMode);
    applyFontFamilyPreview(settings.fontFamily);
  };

  return {
    previewSettings,
    previewEnabled,
    applyThemePreview,
    applyFontSizePreview,
    applyAccentColorPreview,
    applyCompactModePreview,
    applyFontFamilyPreview,
    resetPreview,
    applyAllPreview,
  };
}
