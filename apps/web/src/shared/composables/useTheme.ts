import { ref, computed, watch } from 'vue';
import { useTheme as useVuetifyTheme } from 'vuetify';

/**
 * Theme mode options
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 * - 'auto': Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Available theme names in Vuetify configuration
 */
export type ThemeName = 'light' | 'dark' | 'darkBlue' | 'warmPaper' | 'lightBlue' | 'blueGreen';

const STORAGE_KEY = 'dailyuse-theme-preference';

interface ThemePreference {
  mode: ThemeMode;
  lightTheme?: ThemeName;
  darkTheme?: ThemeName;
}

/**
 * Composable for managing application theme
 *
 * Provides theme switching functionality with:
 * - Light/Dark/Auto modes
 * - System preference detection
 * - LocalStorage persistence
 * - Smooth transitions
 *
 * @returns Theme management functions and state
 *
 * @example
 * ```typescript
 * const { themeMode, isDark, setThemeMode, toggleTheme } = useTheme();
 *
 * // Set specific mode
 * setThemeMode('dark');
 *
 * // Toggle between light and dark
 * toggleTheme();
 *
 * // Check current state
 * if (isDark.value) {
 *   console.log('Dark mode active');
 * }
 * ```
 */
export function useTheme() {
  const vuetifyTheme = useVuetifyTheme();

  // Load saved preference or default to 'auto'
  const loadPreference = (): ThemePreference => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
    return { mode: 'auto', lightTheme: 'light', darkTheme: 'dark' };
  };

  // Save preference to localStorage
  const savePreference = (preference: ThemePreference): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  // Detect system preference
  const getSystemPreference = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Initialize state
  const preference = ref<ThemePreference>(loadPreference());
  const systemPreference = ref<'light' | 'dark'>(getSystemPreference());

  // Computed current theme mode
  const themeMode = computed<ThemeMode>(() => preference.value.mode);

  // Computed whether dark mode is active
  const isDark = computed<boolean>(() => {
    if (preference.value.mode === 'auto') {
      return systemPreference.value === 'dark';
    }
    return preference.value.mode === 'dark';
  });

  // Computed current theme name
  const currentTheme = computed<ThemeName>(() => {
    if (isDark.value) {
      return preference.value.darkTheme || 'dark';
    }
    return preference.value.lightTheme || 'light';
  });

  // Apply theme to Vuetify
  const applyTheme = (themeName: ThemeName): void => {
    // Add transition class to body
    document.body.classList.add('theme-transition');

    // Change Vuetify theme - use the recommended API
    vuetifyTheme.global.name.value = themeName;

    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300);
  };

  /**
   * Set theme mode (light/dark/auto)
   * @param mode - Theme mode to set
   */
  const setThemeMode = (mode: ThemeMode): void => {
    preference.value.mode = mode;
    savePreference(preference.value);

    // Apply the appropriate theme
    const themeName = isDark.value
      ? preference.value.darkTheme || 'dark'
      : preference.value.lightTheme || 'light';
    applyTheme(themeName);
  };

  /**
   * Set specific theme for light or dark mode
   * @param type - Whether to set light or dark theme
   * @param themeName - Name of the theme to use
   */
  const setSpecificTheme = (type: 'light' | 'dark', themeName: ThemeName): void => {
    if (type === 'light') {
      preference.value.lightTheme = themeName;
    } else {
      preference.value.darkTheme = themeName;
    }
    savePreference(preference.value);

    // Apply if currently using this type
    if (isDark.value === (type === 'dark')) {
      applyTheme(themeName);
    }
  };

  /**
   * Toggle between light and dark themes
   * (Switches mode to 'light' or 'dark', not 'auto')
   */
  const toggleTheme = (): void => {
    const newMode = isDark.value ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  /**
   * Get available themes for a specific mode
   * @param mode - 'light' or 'dark'
   * @returns Array of theme names
   */
  const getAvailableThemes = (mode: 'light' | 'dark'): ThemeName[] => {
    if (mode === 'light') {
      return ['light', 'lightBlue', 'warmPaper'];
    }
    return ['dark', 'darkBlue', 'blueGreen'];
  };

  // Watch system preference changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      systemPreference.value = e.matches ? 'dark' : 'light';

      // Re-apply theme if in auto mode
      if (preference.value.mode === 'auto') {
        const themeName = isDark.value
          ? preference.value.darkTheme || 'dark'
          : preference.value.lightTheme || 'light';
        applyTheme(themeName);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
    }
  }

  // Apply initial theme
  applyTheme(currentTheme.value);

  return {
    themeMode,
    isDark,
    currentTheme,
    systemPreference: computed(() => systemPreference.value),
    setThemeMode,
    setSpecificTheme,
    toggleTheme,
    getAvailableThemes,
  };
}
