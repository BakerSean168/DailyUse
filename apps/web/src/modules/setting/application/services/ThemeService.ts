/**
 * Theme Service - 最简化版本
 * 
 * 设计原则：
 * 1. 直接使用 Vuetify 的 useTheme() API（必须在 Vue 组件中初始化）
 * 2. 提供单例模式，避免重复创建
 * 3. 只负责调用 Vuetify API，不处理业务逻辑
 * 
 * ⚠️ 重要：必须在 Vue 组件的 setup() 中调用 initialize()
 * 
 * 📖 初始化流程：
 * 1. App.vue setup() 中：themeService.initialize() 
 *    → 获取 Vuetify 主题实例
 * 
 * 2. App.vue onMounted() 中：settingStore.initializeSettings()
 *    → 加载用户设置（包括主题设置）
 *    → 自动调用 themeService.applySettings() 应用主题
 * 
 * 3. 用户在设置页面修改主题：
 *    → userSettingStore.updateAppearance({ theme: 'LIGHT' })
 *    → 直接调用 themeService.setMode('LIGHT') 立即生效
 *    → 同时保存到后端
 */

import { useTheme } from 'vuetify';
import type { ThemeInstance } from 'vuetify';

interface ThemeSettings {
  mode: 'LIGHT' | 'DARK' | 'AUTO';
  accentColor?: string;
  fontSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  compactMode?: boolean;
}

export class ThemeService {
  private static instance: ThemeService | null = null;
  private theme: ThemeInstance | null = null;
  private systemThemeQuery: MediaQueryList;
  private systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

  private constructor() {
    this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  /**
   * 初始化主题服务
   * ⚠️ 必须在 Vue 组件的 setup() 中调用
   */
  initialize(): void {
    if (this.theme) return; // 已初始化
    
    try {
      this.theme = useTheme();
      console.log('✅ [ThemeService] 初始化成功');
      console.log('  当前主题:', this.theme.global.name.value);
      console.log('  可用主题:', this.getAvailableThemes());
    } catch (error) {
      console.error('❌ [ThemeService] 初始化失败，useTheme() 必须在 Vue 组件的 setup() 中调用:', error);
    }
  }

  /**
   * 获取所有可用主题列表
   */
  getAvailableThemes(): string[] {
    if (!this.theme) return [];
    return Object.keys(this.theme.themes.value);
  }

  /**
   * 检查主题是否存在
   */
  hasTheme(themeName: string): boolean {
    if (!this.theme) return false;
    return themeName in this.theme.themes.value;
  }

  /**
   * 获取当前主题名称
   */
  getCurrentTheme(): string {
    if (!this.theme) return 'dark';
    return this.theme.global.name.value;
  }

  /**
   * 应用完整的主题设置（用于初始化）
   * 这个方法会在用户设置加载完成后被调用
   */
  applySettings(settings: ThemeSettings): void {
    console.log('🎨 [ThemeService] 应用主题设置:', settings);
    
    this.setMode(settings.mode);
    
    if (settings.accentColor) {
      this.setAccentColor(settings.accentColor);
    }
    
    if (settings.fontSize) {
      this.setFontSize(settings.fontSize);
    }
    
    if (settings.compactMode !== undefined) {
      this.setCompactMode(settings.compactMode);
    }
    
    console.log('✅ [ThemeService] 主题设置已全部应用');
  }

  /**
   * 切换主题模式
   */
  setMode(mode: 'LIGHT' | 'DARK' | 'AUTO'): void {
    if (!this.theme) {
      console.warn('⚠️ [ThemeService] 未初始化，跳过主题切换');
      return;
    }

    if (mode === 'AUTO') {
      // 跟随系统
      const systemTheme = this.getSystemPreference();
      this.theme.global.name.value = systemTheme;
      this.watchSystemTheme();
      console.log(`🎨 [ThemeService] 主题模式: AUTO (系统: ${systemTheme})`);
    } else {
      // 固定主题
      const themeName = mode.toLowerCase();
      this.theme.global.name.value = themeName;
      this.unwatchSystemTheme();
      console.log(`🎨 [ThemeService] 主题模式: ${mode}`);
    }
  }

  /**
   * 设置具体的主题样式（直接切换 Vuetify 主题）
   * @param themeName - 主题名称（light, dark, darkBlue, warmPaper, lightBlue, blueGreen）
   */
  setThemeStyle(themeName: string): void {
    if (!this.theme) {
      console.warn('⚠️ [ThemeService] 未初始化，跳过主题样式切换');
      return;
    }

    // 检查主题是否存在
    if (!this.hasTheme(themeName)) {
      console.error(`❌ [ThemeService] 主题 "${themeName}" 不存在`);
      return;
    }

    // 直接切换主题
    this.theme.global.name.value = themeName;
    console.log(`🎨 [ThemeService] 主题样式已切换: ${themeName}`);
  }

  /**
   * 设置主题色
   */
  setAccentColor(color: string): void {
    if (!this.theme) {
      console.warn('⚠️ [ThemeService] 未初始化，跳过主题色修改');
      return;
    }

    // 更新所有主题的 primary 颜色
    Object.keys(this.theme.themes.value).forEach((themeName) => {
      const themeColors = this.theme!.themes.value[themeName]?.colors;
      if (themeColors) {
        themeColors.primary = color;
      }
    });

    console.log(`🎨 [ThemeService] 主题色: ${color}`);
  }

  /**
   * 设置字体大小
   */
  setFontSize(fontSize: 'SMALL' | 'MEDIUM' | 'LARGE'): void {
    const sizeMap = {
      SMALL: '14px',
      MEDIUM: '16px',
      LARGE: '18px',
    };
    
    const size = sizeMap[fontSize];
    document.documentElement.style.setProperty('--font-size-base', size);
    console.log(`🎨 [ThemeService] 字体大小: ${fontSize} (${size})`);
  }

  /**
   * 设置紧凑模式
   */
  setCompactMode(enabled: boolean): void {
    if (enabled) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
    console.log(`🎨 [ThemeService] 紧凑模式: ${enabled ? '开启' : '关闭'}`);
  }

  /**
   * 获取系统主题偏好
   */
  private getSystemPreference(): 'light' | 'dark' {
    return this.systemThemeQuery.matches ? 'dark' : 'light';
  }

  /**
   * 监听系统主题变化
   */
  private watchSystemTheme(): void {
    if (this.systemThemeListener || !this.theme) return;

    this.systemThemeListener = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      if (this.theme) {
        this.theme.global.name.value = newTheme;
      }
      console.log(`🌗 [ThemeService] 系统主题变化: ${newTheme}`);
    };

    this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
  }

  /**
   * 取消监听系统主题变化
   */
  private unwatchSystemTheme(): void {
    if (this.systemThemeListener) {
      this.systemThemeQuery.removeEventListener('change', this.systemThemeListener);
      this.systemThemeListener = null;
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.unwatchSystemTheme();
    this.theme = null;
    ThemeService.instance = null;
  }
}

/**
 * 获取主题服务实例的便捷函数
 */
export function getThemeService(): ThemeService {
  return ThemeService.getInstance();
}
