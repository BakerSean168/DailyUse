/**
 * Vuetify Theme Service
 * Vuetify 主题服务
 * 
 * 负责直接操作 Vuetify 的全局主题对象
 * 
 * ⚠️ 重要说明：
 * - useTheme() 必须在 Vue 组件的 setup() 中调用
 * - 在类构造函数中调用 useTheme() 会导致主题切换失败
 * - 因此我们直接通过 document.documentElement 修改主题属性
 */

import type { ThemeConfig } from '../../domain/ThemeConfig';
import { FONT_SIZE_MAP } from '../../domain/ThemeConfig';
import { LocalThemeStorage } from '../../infrastructure/LocalThemeStorage';

export class VuetifyThemeService {
  private systemThemeQuery: MediaQueryList;
  private systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

  constructor() {
    this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = this.getCurrentTheme();
    console.log('🎨 [VuetifyThemeService] 初始化完成，当前主题:', currentTheme);
  }

  /**
   * 获取当前主题名称
   */
  private getCurrentTheme(): string {
    // Vuetify 3 会在 html 元素上添加 .v-theme--{themeName} 类名
    const htmlElement = document.documentElement;
    const classList = Array.from(htmlElement.classList);
    const themeClass = classList.find(cls => cls.startsWith('v-theme--'));
    if (themeClass) {
      return themeClass.replace('v-theme--', '');
    }
    return 'dark'; // 默认值
  }

  /**
   * 设置主题名称
   * 通过修改 html 元素的类名来切换主题
   */
  private setThemeName(themeName: string): void {
    const htmlElement = document.documentElement;
    
    // 移除旧的主题类名
    const classList = Array.from(htmlElement.classList);
    classList.forEach(cls => {
      if (cls.startsWith('v-theme--')) {
        htmlElement.classList.remove(cls);
      }
    });
    
    // 添加新的主题类名
    htmlElement.classList.add(`v-theme--${themeName}`);
    
    // 同时更新 data-theme 属性（方便 CSS 使用）
    htmlElement.setAttribute('data-theme', themeName);
    
    console.log(`  ✅ 主题已切换: ${themeName}`);
  }

  /**
   * 应用主题配置到 Vuetify
   */
  applyTheme(config: Partial<ThemeConfig>): void {
    console.log('🎨 [VuetifyThemeService] 应用主题配置:', config);

    // 1. 应用主题模式
    if (config.mode !== undefined) {
      this.applyThemeMode(config.mode);
    }

    // 2. 应用主题色
    if (config.accentColor !== undefined) {
      this.applyAccentColor(config.accentColor);
    }

    // 3. 应用字体大小
    if (config.fontSize !== undefined) {
      this.applyFontSize(config.fontSize);
    }

    // 4. 应用字体家族
    if (config.fontFamily !== undefined && config.fontFamily) {
      this.applyFontFamily(config.fontFamily);
    }

    // 5. 应用紧凑模式
    if (config.compactMode !== undefined) {
      this.applyCompactMode(config.compactMode);
    }

    console.log('✅ [VuetifyThemeService] 主题配置已应用，当前主题:', this.getCurrentTheme());
  }

  /**
   * 应用主题模式
   */
  private applyThemeMode(mode: ThemeConfig['mode']): void {
    if (mode === 'AUTO') {
      // 跟随系统
      const systemTheme = LocalThemeStorage.getSystemPreference();
      this.setThemeName(systemTheme);
      console.log(`  ↳ 主题模式: AUTO (系统: ${systemTheme})`);

      // 监听系统主题变化
      this.watchSystemTheme();
    } else {
      // 固定主题（LIGHT 或 DARK）
      const themeName = mode.toLowerCase(); // 'light' or 'dark'
      this.setThemeName(themeName);
      console.log(`  ↳ 主题模式: ${mode} -> ${themeName}`);

      // 取消监听系统主题
      this.unwatchSystemTheme();
    }
  }

  /**
   * 应用主题色
   * 通过 CSS 变量修改主题色
   */
  applyAccentColor(color: string): void {
    console.log(`  ↳ 更新主题色: ${color}`);
    
    // 设置 CSS 变量（Vuetify 3 使用 RGB 格式）
    const root = document.documentElement;
    
    // 将 HEX 颜色转换为 RGB
    const rgb = this.hexToRgb(color);
    if (rgb) {
      root.style.setProperty('--v-theme-primary', `${rgb.r},${rgb.g},${rgb.b}`);
      console.log(`  ↳ 主题色已更新: ${color} (RGB: ${rgb.r},${rgb.g},${rgb.b})`);
    }
  }

  /**
   * HEX 转 RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * 应用字体大小
   */
  applyFontSize(fontSize: ThemeConfig['fontSize']): void {
    const size = FONT_SIZE_MAP[fontSize] || '16px';
    const root = document.documentElement;
    root.style.setProperty('--font-size-base', size);
    console.log(`  ↳ 字体大小: ${fontSize} (${size})`);
  }

  /**
   * 应用字体家族
   */
  private applyFontFamily(fontFamily: string): void {
    const root = document.documentElement;
    root.style.setProperty('--font-family-base', fontFamily);
    document.body.style.fontFamily = fontFamily;
    console.log(`  ↳ 字体家族: ${fontFamily}`);
  }

  /**
   * 应用紧凑模式
   */
  applyCompactMode(enabled: boolean): void {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('compact-mode');
      console.log('  ↳ 紧凑模式: 开启');
    } else {
      root.classList.remove('compact-mode');
      console.log('  ↳ 紧凑模式: 关闭');
    }
  }

  /**
   * 监听系统主题变化
   */
  private watchSystemTheme(): void {
    if (this.systemThemeListener) return; // 已经在监听

    this.systemThemeListener = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      this.setThemeName(newTheme);
      console.log(`🌗 [VuetifyThemeService] 系统主题变化: ${newTheme}`);

      // 发送事件
      window.dispatchEvent(
        new CustomEvent('theme:system-changed', {
          detail: { theme: newTheme },
        })
      );
    };

    this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
    console.log('👂 [VuetifyThemeService] 开始监听系统主题变化');
  }

  /**
   * 取消监听系统主题变化
   */
  private unwatchSystemTheme(): void {
    if (this.systemThemeListener) {
      this.systemThemeQuery.removeEventListener('change', this.systemThemeListener);
      this.systemThemeListener = null;
      console.log('🔇 [VuetifyThemeService] 停止监听系统主题变化');
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.unwatchSystemTheme();
  }
}
