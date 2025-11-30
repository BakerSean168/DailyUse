/**
 * Theme Module Exports
 * 主题模块导出
 */

// Domain
export type { ThemeConfig, ThemeMode, FontSize } from './domain/ThemeConfig';
export { DEFAULT_THEME_CONFIG, FONT_SIZE_MAP } from './domain/ThemeConfig';

// Infrastructure
export { LocalThemeStorage } from './infrastructure/LocalThemeStorage';

// Application Services
export { ThemeApplicationService } from './application/services/ThemeApplicationService';
export { VuetifyThemeService } from './application/services/VuetifyThemeService';

// Events
export {
  THEME_EVENTS,
} from './application/events/ThemeEvents';
export type {
  ThemeChangedPayload,
  SystemThemeChangedPayload,
  ThemeModeChangedPayload,
  AccentColorChangedPayload,
  FontSizeChangedPayload,
  CompactModeChangedPayload,
} from './application/events/ThemeEvents';

// 直接导入类型来重导出兼容别名
import type {
  ThemeChangedPayload as _ThemeChangedPayload,
  SystemThemeChangedPayload as _SystemThemeChangedPayload,
} from './application/events/ThemeEvents';

// Type aliases for backward compatibility
export type ThemeChangedEvent = _ThemeChangedPayload;
export type SystemThemeChangedEvent = _SystemThemeChangedPayload;
export type ThemeEvent = _ThemeChangedPayload | _SystemThemeChangedPayload;

// Composables
export { useTheme } from './composables/useTheme';

// Initialization
export { registerThemeInitializationTasks } from './initialization';
