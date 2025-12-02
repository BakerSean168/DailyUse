/**
 * useTheme Composable
 * 主题管理的统一接口
 */

import { computed } from 'vue';
import { useTheme as useVuetifyTheme } from 'vuetify';
import { useSettingStore } from '../stores/settingStore';

export interface ThemeOption {
  label: string;
  value: string;
  icon: string;
}

export function useTheme() {
  const vuetifyTheme = useVuetifyTheme();
  const settingStore = useSettingStore();

  /**
   * 当前主题模式
   */
  const themeMode = computed({
    get: () => settingStore.themeMode || 'system',
    set: async (value: string) => {
      await settingStore.setTheme(value);
    },
  });

  /**
   * 当前语言
   */
  const locale = computed({
    get: () => settingStore.language || 'zh-CN',
    set: async (value: 'en-US' | 'zh-CN') => {
      await settingStore.setLanguage(value);
    },
  });

  /**
   * 当前是否为深色模式
   */
  const isDark = computed(() => {
    if (themeMode.value === 'dark') return true;
    if (themeMode.value === 'light') return false;
    // system mode
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  /**
   * 切换主题（在浅色和深色之间）
   */
  async function toggleTheme() {
    const current = themeMode.value;
    if (current === 'system') {
      // 从系统模式切换到明确模式
      themeMode.value = isDark.value ? 'light' : 'dark';
    } else {
      themeMode.value = current === 'light' ? 'dark' : 'light';
    }
  }

  /**
   * 应用主题到 Vuetify
   */
  function applyTheme(mode: string) {
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      (vuetifyTheme as any).change(prefersDark ? 'dark' : 'light');
    } else {
      (vuetifyTheme as any).change(mode);
    }
  }

  /**
   * 可用的主题列表
   */
  const themes: ThemeOption[] = [
    { label: '浅色', value: 'light', icon: 'mdi-white-balance-sunny' },
    { label: '深色', value: 'dark', icon: 'mdi-weather-night' },
    { label: '跟随系统', value: 'system', icon: 'mdi-theme-light-dark' },
  ];

  /**
   * 可用的语言列表
   */
  const locales = [
    { label: '简体中文', value: 'zh-CN', flag: '🇨🇳' },
    { label: 'English', value: 'en-US', flag: '🇺🇸' },
  ];

  /**
   * 当前主题选项
   */
  const currentTheme = computed(() => {
    return themes.find((t) => t.value === themeMode.value) || themes[2];
  });

  /**
   * 当前语言选项
   */
  const currentLocale = computed(() => {
    return locales.find((l) => l.value === locale.value) || locales[0];
  });

  return {
    // 状态
    themeMode,
    locale,
    isDark,

    // 选项
    themes,
    locales,
    currentTheme,
    currentLocale,

    // 方法
    toggleTheme,
    applyTheme,
  };
}
