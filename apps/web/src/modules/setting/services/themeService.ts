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

  // 监听 settings.value?.appearance（深层监听整个 settings 对象）
  // 这样可以捕获整个对象被替换的情况
  watch(
    () => settingStore.settings?.appearance,
    (appearance) => {
      if (!appearance) {
        console.log('⏭️ [Theme] 外观设置为空，跳过应用');
        return;
      }

      console.log('🎨 [Theme] 应用外观设置:', appearance);

      // 1. 应用主题模式
      if (appearance.theme === 'AUTO') {
        // 跟随系统
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme.global.name.value = prefersDark ? 'dark' : 'light';
        console.log(`  ↳ 主题模式: AUTO (系统: ${prefersDark ? 'dark' : 'light'})`);
      } else {
        theme.global.name.value = appearance.theme.toLowerCase();
        console.log(`  ↳ 主题模式: ${appearance.theme}`);
      }

      // 2. 应用主题色（Vuetify 主题颜色）
      if (appearance.accentColor) {
        // 更新所有主题的 primary 颜色
        Object.keys(theme.themes.value).forEach((themeName) => {
          theme.themes.value[themeName].colors.primary = appearance.accentColor;
        });
        console.log(`  ↳ 主题色: ${appearance.accentColor}`);
      }

      // 3. 应用字体大小
      const root = document.documentElement;
      const fontSizeMap = {
        SMALL: '14px',
        MEDIUM: '16px',
        LARGE: '18px',
      };
      const fontSize = fontSizeMap[appearance.fontSize as keyof typeof fontSizeMap] || '16px';
      root.style.setProperty('--font-size-base', fontSize);
      console.log(`  ↳ 字体大小: ${appearance.fontSize} (${fontSize})`);

      // 4. 应用字体家族
      if (appearance.fontFamily) {
        root.style.setProperty('--font-family-base', appearance.fontFamily);
        document.body.style.fontFamily = appearance.fontFamily;
        console.log(`  ↳ 字体家族: ${appearance.fontFamily}`);
      }

      // 5. 应用紧凑模式
      if (appearance.compactMode) {
        root.classList.add('compact-mode');
        console.log('  ↳ 紧凑模式: 开启');
      } else {
        root.classList.remove('compact-mode');
        console.log('  ↳ 紧凑模式: 关闭');
      }
    },
    { immediate: true, deep: true },
  );

  // 监听系统主题变化（当设置为 AUTO 时）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const appearance = settingStore.settings?.appearance;
    if (appearance?.theme === 'AUTO') {
      theme.global.name.value = e.matches ? 'dark' : 'light';
      console.log(`🌗 [Theme] 系统主题变化: ${e.matches ? 'dark' : 'light'}`);
    }
  });
}

/**
 * 应用区域设置
 */
export function applyLocaleSettings(settingStore: ReturnType<typeof useUserSettingStore>) {
  watch(
    () => settingStore.settings?.locale,
    (locale) => {
      if (!locale) {
        console.log('⏭️ [Locale] 区域设置为空，跳过应用');
        return;
      }

      console.log('🌍 [Locale] 应用区域设置:', locale);

      // TODO: 集成 vue-i18n
      // import { i18n } from '@/shared/i18n';
      // i18n.global.locale.value = locale.language;
    },
    { immediate: true, deep: true },
  );
}

/**
 * 初始化主题服务
 */
export function initializeThemeService(settingStore: ReturnType<typeof useUserSettingStore>) {
  console.log('🎨 [Theme] 初始化主题服务...');

  // 应用主题设置
  applyThemeSettings(settingStore);

  // 应用区域设置
  applyLocaleSettings(settingStore);

  console.log('✅ [Theme] 主题服务初始化完成');
}

