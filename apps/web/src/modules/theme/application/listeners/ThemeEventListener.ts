/**
 * Theme Event Listener
 * 主题事件监听器
 * 
 * 负责监听来自其他模块（如 Setting）的主题相关事件
 */

import { eventBus } from '@dailyuse/utils';
import { THEME_EVENTS } from '../events/ThemeEvents';
import type {
  ThemeChangedPayload,
  SystemThemeChangedPayload,
  ThemeModeChangedPayload,
  AccentColorChangedPayload,
  FontSizeChangedPayload,
  CompactModeChangedPayload,
} from '../events/ThemeEvents';
import { VuetifyThemeService } from '../services/VuetifyThemeService';
import type { ThemeConfig } from '../../domain/ThemeConfig';

export class ThemeEventListener {
  private vuetifyService: VuetifyThemeService;
  private isListening = false;

  constructor(vuetifyService: VuetifyThemeService) {
    this.vuetifyService = vuetifyService;
  }

  /**
   * 开始监听主题事件
   */
  startListening(): void {
    if (this.isListening) {
      console.warn('⚠️ [ThemeEventListener] 已在监听中');
      return;
    }

    console.log('👂 [ThemeEventListener] 开始监听主题事件...');

    // 监听完整主题变更
    eventBus.on(
      THEME_EVENTS.CHANGED,
      this.handleThemeChanged.bind(this)
    );

    // 监听系统主题变更
    eventBus.on(
      THEME_EVENTS.SYSTEM_CHANGED,
      this.handleSystemThemeChanged.bind(this)
    );

    // 监听主题模式变更
    eventBus.on(
      THEME_EVENTS.MODE_CHANGED,
      this.handleModeChanged.bind(this)
    );

    // 监听主题色变更
    eventBus.on(
      THEME_EVENTS.ACCENT_COLOR_CHANGED,
      this.handleAccentColorChanged.bind(this)
    );

    // 监听字体大小变更
    eventBus.on(
      THEME_EVENTS.FONT_SIZE_CHANGED,
      this.handleFontSizeChanged.bind(this)
    );

    // 监听紧凑模式变更
    eventBus.on(
      THEME_EVENTS.COMPACT_MODE_CHANGED,
      this.handleCompactModeChanged.bind(this)
    );

    this.isListening = true;
    console.log('✅ [ThemeEventListener] 主题事件监听器已启动');
  }

  /**
   * 停止监听主题事件
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    console.log('🔇 [ThemeEventListener] 停止监听主题事件...');

    eventBus.off(THEME_EVENTS.CHANGED, this.handleThemeChanged);
    eventBus.off(THEME_EVENTS.SYSTEM_CHANGED, this.handleSystemThemeChanged);
    eventBus.off(THEME_EVENTS.MODE_CHANGED, this.handleModeChanged);
    eventBus.off(THEME_EVENTS.ACCENT_COLOR_CHANGED, this.handleAccentColorChanged);
    eventBus.off(THEME_EVENTS.FONT_SIZE_CHANGED, this.handleFontSizeChanged);
    eventBus.off(THEME_EVENTS.COMPACT_MODE_CHANGED, this.handleCompactModeChanged);

    this.isListening = false;
    console.log('✅ [ThemeEventListener] 主题事件监听器已停止');
  }

  /**
   * 处理完整主题变更
   */
  private handleThemeChanged(payload: ThemeChangedPayload): void {
    console.log('🎨 [ThemeEventListener] 收到主题变更事件:', {
      source: payload.source,
      current: payload.current,
    });

    // 应用完整主题配置
    this.vuetifyService.applyTheme(payload.current);
  }

  /**
   * 处理系统主题变更
   */
  private handleSystemThemeChanged(payload: SystemThemeChangedPayload): void {
    console.log('🌗 [ThemeEventListener] 收到系统主题变更事件:', payload.theme);
    // 系统主题变更由 VuetifyThemeService 内部处理
  }

  /**
   * 处理主题模式变更
   */
  private handleModeChanged(payload: ThemeModeChangedPayload): void {
    console.log('🎨 [ThemeEventListener] 收到主题模式变更事件:', {
      mode: payload.mode,
      source: payload.source,
    });

    // 调用 applyTheme 方法，传入部分配置
    this.vuetifyService.applyTheme({
      mode: payload.mode,
    } as Partial<ThemeConfig>);
  }

  /**
   * 处理主题色变更
   */
  private handleAccentColorChanged(payload: AccentColorChangedPayload): void {
    console.log('🎨 [ThemeEventListener] 收到主题色变更事件:', {
      color: payload.color,
      source: payload.source,
    });

    // 只更新主题色
    this.vuetifyService.applyAccentColor(payload.color);
  }

  /**
   * 处理字体大小变更
   */
  private handleFontSizeChanged(payload: FontSizeChangedPayload): void {
    console.log('🎨 [ThemeEventListener] 收到字体大小变更事件:', {
      fontSize: payload.fontSize,
      source: payload.source,
    });

    // 只更新字体大小
    this.vuetifyService.applyFontSize(payload.fontSize);
  }

  /**
   * 处理紧凑模式变更
   */
  private handleCompactModeChanged(payload: CompactModeChangedPayload): void {
    console.log('🎨 [ThemeEventListener] 收到紧凑模式变更事件:', {
      enabled: payload.enabled,
      source: payload.source,
    });

    // 只更新紧凑模式
    this.vuetifyService.applyCompactMode(payload.enabled);
  }
}
