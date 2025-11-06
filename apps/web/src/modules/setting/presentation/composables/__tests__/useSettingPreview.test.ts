/**
 * useSettingPreview 单元测试
 *
 * 测试实时设置预览的所有功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingPreview } from '../useSettingPreview';

describe('useSettingPreview', () => {
  let htmlElement: HTMLElement;

  beforeEach(() => {
    htmlElement = document.documentElement;
    htmlElement.className = '';
    htmlElement.style.cssText = '';
  });

  describe('applyThemePreview', () => {
    it('应该应用 DARK 主题类', () => {
      const { applyThemePreview } = useSettingPreview();
      applyThemePreview('DARK');
      expect(htmlElement.classList.contains('dark-theme')).toBe(true);
    });

    it('应该应用 LIGHT 主题类', () => {
      const { applyThemePreview } = useSettingPreview();
      applyThemePreview('LIGHT');
      expect(htmlElement.classList.contains('light-theme')).toBe(true);
    });

    it('应该应用 AUTO 主题类', () => {
      const { applyThemePreview } = useSettingPreview();
      applyThemePreview('AUTO');
      expect(htmlElement.classList.contains('auto-theme')).toBe(true);
    });

    it('应该移除旧主题类', () => {
      const { applyThemePreview } = useSettingPreview();
      applyThemePreview('DARK');
      applyThemePreview('LIGHT');
      expect(htmlElement.classList.contains('dark-theme')).toBe(false);
      expect(htmlElement.classList.contains('light-theme')).toBe(true);
    });

    it('应该处理多次快速切换', () => {
      const { applyThemePreview } = useSettingPreview();
      applyThemePreview('DARK');
      applyThemePreview('LIGHT');
      applyThemePreview('AUTO');
      applyThemePreview('DARK');
      
      expect(htmlElement.classList.contains('dark-theme')).toBe(true);
      expect(htmlElement.classList.contains('light-theme')).toBe(false);
      expect(htmlElement.classList.contains('auto-theme')).toBe(false);
    });
  });

  describe('applyFontSizePreview', () => {
    it('应该应用小字体类', () => {
      const { applyFontSizePreview } = useSettingPreview();
      applyFontSizePreview('SMALL');
      expect(htmlElement.classList.contains('font-small')).toBe(true);
    });

    it('应该应用中字体类', () => {
      const { applyFontSizePreview } = useSettingPreview();
      applyFontSizePreview('MEDIUM');
      expect(htmlElement.classList.contains('font-medium')).toBe(true);
    });

    it('应该应用大字体类', () => {
      const { applyFontSizePreview } = useSettingPreview();
      applyFontSizePreview('LARGE');
      expect(htmlElement.classList.contains('font-large')).toBe(true);
    });

    it('应该替换旧的字体大小类', () => {
      const { applyFontSizePreview } = useSettingPreview();
      applyFontSizePreview('SMALL');
      applyFontSizePreview('LARGE');
      
      expect(htmlElement.classList.contains('font-small')).toBe(false);
      expect(htmlElement.classList.contains('font-large')).toBe(true);
    });
  });

  describe('applyAccentColorPreview', () => {
    it('应该设置颜色 CSS 变量', () => {
      const { applyAccentColorPreview } = useSettingPreview();
      applyAccentColorPreview('#FF5733');
      expect(htmlElement.style.getPropertyValue('--accent-color')).toBe('#FF5733');
    });

    it('应该支持 RGB 颜色格式', () => {
      const { applyAccentColorPreview } = useSettingPreview();
      applyAccentColorPreview('rgb(255, 87, 51)');
      expect(htmlElement.style.getPropertyValue('--accent-color')).toBe('rgb(255, 87, 51)');
    });

    it('应该更新存在的颜色变量', () => {
      const { applyAccentColorPreview } = useSettingPreview();
      applyAccentColorPreview('#FF5733');
      applyAccentColorPreview('#3366FF');
      expect(htmlElement.style.getPropertyValue('--accent-color')).toBe('#3366FF');
    });
  });

  describe('applyCompactModePreview', () => {
    it('应该应用紧凑模式类', () => {
      const { applyCompactModePreview } = useSettingPreview();
      applyCompactModePreview(true);
      expect(htmlElement.classList.contains('compact-mode')).toBe(true);
    });

    it('应该移除紧凑模式类', () => {
      const { applyCompactModePreview } = useSettingPreview();
      applyCompactModePreview(true);
      applyCompactModePreview(false);
      expect(htmlElement.classList.contains('compact-mode')).toBe(false);
    });

    it('应该切换紧凑模式', () => {
      const { applyCompactModePreview } = useSettingPreview();
      applyCompactModePreview(true);
      expect(htmlElement.classList.contains('compact-mode')).toBe(true);
      
      applyCompactModePreview(false);
      expect(htmlElement.classList.contains('compact-mode')).toBe(false);
    });
  });

  describe('applyFontFamilyPreview', () => {
    it('应该设置字体族 CSS 变量', () => {
      const { applyFontFamilyPreview } = useSettingPreview();
      applyFontFamilyPreview("'Helvetica Neue', sans-serif");
      expect(htmlElement.style.getPropertyValue('--font-family')).toBeTruthy();
    });

    it('应该处理系统字体', () => {
      const { applyFontFamilyPreview } = useSettingPreview();
      applyFontFamilyPreview('-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
      expect(htmlElement.style.getPropertyValue('--font-family')).toBeTruthy();
    });
  });

  describe('resetPreview', () => {
    it('应该移除所有预览类和样式', () => {
      const { 
        applyThemePreview, 
        applyFontSizePreview,
        applyCompactModePreview,
        applyAccentColorPreview,
        resetPreview 
      } = useSettingPreview();
      
      applyThemePreview('DARK');
      applyFontSizePreview('LARGE');
      applyCompactModePreview(true);
      applyAccentColorPreview('#FF5733');
      
      resetPreview();
      
      expect(htmlElement.classList.contains('dark-theme')).toBe(false);
      expect(htmlElement.classList.contains('font-large')).toBe(false);
      expect(htmlElement.classList.contains('compact-mode')).toBe(false);
      expect(htmlElement.style.getPropertyValue('--accent-color')).toBe('');
    });

    it('应该在空状态下安全重置', () => {
      const { resetPreview } = useSettingPreview();
      expect(() => resetPreview()).not.toThrow();
    });
  });

  describe('applyAllPreview', () => {
    it('应该同时应用所有预览', () => {
      const { applyAllPreview } = useSettingPreview();
      
      const settings = {
        theme: 'DARK',
        fontSize: 'LARGE',
        accentColor: '#FF5733',
        compactMode: true,
        fontFamily: 'Arial',
      };

      applyAllPreview(settings as any);

      expect(htmlElement.classList.contains('dark-theme')).toBe(true);
      expect(htmlElement.classList.contains('font-large')).toBe(true);
      expect(htmlElement.classList.contains('compact-mode')).toBe(true);
    });

    it('应该处理部分设置', () => {
      const { applyAllPreview } = useSettingPreview();
      
      const partialSettings = {
        theme: 'LIGHT',
        fontSize: 'SMALL',
      };

      expect(() => applyAllPreview(partialSettings as any)).not.toThrow();
    });

    it('应该处理空对象', () => {
      const { applyAllPreview } = useSettingPreview();
      expect(() => applyAllPreview({} as any)).not.toThrow();
    });
  });

  describe('边界情况', () => {
    it('应该处理未知的主题值', () => {
      const { applyThemePreview } = useSettingPreview();
      expect(() => applyThemePreview('UNKNOWN' as any)).not.toThrow();
    });

    it('应该处理未知的字体大小值', () => {
      const { applyFontSizePreview } = useSettingPreview();
      expect(() => applyFontSizePreview('UNKNOWN' as any)).not.toThrow();
    });

    it('应该处理无效的颜色值', () => {
      const { applyAccentColorPreview } = useSettingPreview();
      expect(() => applyAccentColorPreview('invalid-color')).not.toThrow();
    });
  });
});
