/**
 * Theme Debug Helper
 * 主题调试助手
 * 
 * 在浏览器控制台中使用:
 * window.themeDebug.switchToLight()
 * window.themeDebug.switchToDark()
 * window.themeDebug.switchToAuto()
 * window.themeDebug.setColor('#FF5722')
 * window.themeDebug.getInfo()
 */

import { eventBus } from '@dailyuse/utils';
import { THEME_EVENTS } from '../application/events/ThemeEvents';
import type {
  ThemeModeChangedPayload,
  AccentColorChangedPayload,
} from '../application/events/ThemeEvents';

export const themeDebug = {
  /**
   * 切换到浅色主题
   */
  switchToLight() {
    console.log('🎨 [Debug] 切换到浅色主题');
    const payload: ThemeModeChangedPayload = {
      mode: 'LIGHT',
      source: 'user',
    };
    eventBus.emit(THEME_EVENTS.MODE_CHANGED, payload);
  },

  /**
   * 切换到深色主题
   */
  switchToDark() {
    console.log('🎨 [Debug] 切换到深色主题');
    const payload: ThemeModeChangedPayload = {
      mode: 'DARK',
      source: 'user',
    };
    eventBus.emit(THEME_EVENTS.MODE_CHANGED, payload);
  },

  /**
   * 切换到自动主题
   */
  switchToAuto() {
    console.log('🎨 [Debug] 切换到自动主题');
    const payload: ThemeModeChangedPayload = {
      mode: 'AUTO',
      source: 'user',
    };
    eventBus.emit(THEME_EVENTS.MODE_CHANGED, payload);
  },

  /**
   * 设置主题色
   */
  setColor(color: string) {
    console.log('🎨 [Debug] 设置主题色:', color);
    const payload: AccentColorChangedPayload = {
      color,
      source: 'user',
    };
    eventBus.emit(THEME_EVENTS.ACCENT_COLOR_CHANGED, payload);
  },

  /**
   * 获取主题信息
   */
  getInfo() {
    // 使用 Vuetify 的 useTheme
    const vuetifyTheme = (window as any).__vuetify_theme__;
    if (vuetifyTheme) {
      console.log('📊 [Debug] 主题信息:', {
        currentTheme: vuetifyTheme.global.name.value,
        availableThemes: Object.keys(vuetifyTheme.themes.value),
        primaryColor: vuetifyTheme.themes.value[vuetifyTheme.global.name.value]?.colors?.primary,
      });
    } else {
      console.log('⚠️ [Debug] 无法获取 Vuetify 主题信息');
    }
  },

  /**
   * 列出所有主题事件
   */
  listEvents() {
    console.log('📋 [Debug] 主题事件列表:', THEME_EVENTS);
  },
};

// 挂载到 window 对象供调试使用
if (typeof window !== 'undefined') {
  (window as any).themeDebug = themeDebug;
  console.log('🐛 [Debug] 主题调试助手已加载，使用 window.themeDebug 访问');
  console.log('  - window.themeDebug.switchToLight()');
  console.log('  - window.themeDebug.switchToDark()');
  console.log('  - window.themeDebug.switchToAuto()');
  console.log('  - window.themeDebug.setColor("#FF5722")');
  console.log('  - window.themeDebug.getInfo()');
}
