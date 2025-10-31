/**
 * Theme Service
 * 主题应用服务 - 将用户设置的主题应用到应用程序
 */

import { watch } from 'vue';
import { useTheme } from 'vuetify';
import type { useUserSettingStore } from '../presentation/stores/userSettingStore';

/**
 * 应用主题设置
 */
export function applyThemeSettings(settingStore: ReturnType<typeof useUserSettingStore>) {
  const theme = useTheme();

  // 监听外观设置变化
  watch(
    () => settingStore.appearance,
    (appearance) => {
      // 1. 应用主题模式
      if (appearance.theme === 'AUTO') {
        // 跟随系统
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme.global.name.value = prefersDark ? 'dark' : 'light';
      } else {
        theme.global.name.value = appearance.theme.toLowerCase();
      }

      // 2. 应用主题色（Vuetify 主题颜色）
      if (appearance.accentColor) {
        // 更新 primary 颜色
        theme.themes.value.light.colors.primary = appearance.accentColor;
        theme.themes.value.dark.colors.primary = appearance.accentColor;
      }

      // 3. 应用字体大小
      const root = document.documentElement;
      const fontSizeMap = {
        SMALL: '14px',
        MEDIUM: '16px',
        LARGE: '18px',
      };
      root.style.setProperty('--font-size-base', fontSizeMap[appearance.fontSize as keyof typeof fontSizeMap] || '16px');

      // 4. 应用字体家族
      if (appearance.fontFamily) {
        root.style.setProperty('--font-family-base', appearance.fontFamily);
        document.body.style.fontFamily = appearance.fontFamily;
      }

      // 5. 应用紧凑模式
      if (appearance.compactMode) {
        root.classList.add('compact-mode');
      } else {
        root.classList.remove('compact-mode');
      }
    },
    { immediate: true, deep: true },
  );

  // 监听系统主题变化（当设置为 AUTO 时）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (settingStore.appearance.theme === 'AUTO') {
      theme.global.name.value = e.matches ? 'dark' : 'light';
    }
  });
}

/**
 * 应用区域设置
 */
export function applyLocaleSettings(settingStore: ReturnType<typeof useUserSettingStore>) {
  watch(
    () => settingStore.locale,
    (locale) => {
      // 这里可以集成 i18n
      // import { i18n } from '@/shared/i18n';
      // i18n.global.locale.value = locale.language;
      
      console.log('区域设置已更新:', locale);
    },
    { immediate: true, deep: true },
  );
}

/**
 * 初始化主题服务
 */
export function initializeThemeService(settingStore: ReturnType<typeof useUserSettingStore>) {
  // 应用主题设置
  applyThemeSettings(settingStore);
  
  // 应用区域设置
  applyLocaleSettings(settingStore);

  console.log('✅ 主题服务已初始化');
}
