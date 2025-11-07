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
export type { ThemeChangedEvent, SystemThemeChangedEvent, ThemeEvent } from './application/events/ThemeEvents';

// Composables
export { useTheme } from './composables/useTheme';

// Initialization
export { registerThemeInitializationTasks } from './initialization';
