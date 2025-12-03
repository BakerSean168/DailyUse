/**
 * @dailyuse/ui-vue - Composables
 *
 * Vue 3 composables for DailyUse headless UI.
 */

// Form Validation
export {
  useFormValidation,
  useFormValidationAll,
  useFormRules,
  // Re-exported from core
  type ValidationRule,
  type ValidationResult,
  required,
  minLength,
  maxLength,
  pattern,
  email,
  phone,
  url,
  combine,
  validate,
  validateAll,
} from './useFormValidation';

// Password Strength
export {
  usePasswordStrength,
  generateStrongPassword,
  generatePassphrase,
  type PasswordStrengthResult,
  type PasswordStrengthOptions,
} from './usePasswordStrength';

// Loading
export {
  useLoading,
  useGlobalLoading,
  useAdvancedLoading,
  useButtonLoading,
  useTableLoading,
} from './useLoading';

// Message
export {
  useMessage,
  useGlobalMessage,
  useSnackbar,
  getGlobalMessage,
  type MessageState,
  type Message,
  type MessageOptions,
  type MessageType,
  type SnackbarState,
} from './useMessage';

// Dialog
export {
  useDialog,
  useGlobalDialog,
  getGlobalDialog,
  type DialogState,
  type DialogOptions,
  type DialogButton,
  type DialogType,
  type DeleteConfirmOptions,
} from './useDialog';

// Color Picker
export {
  useColorPicker,
  useColor,
  // Re-exported utilities
  hexToRGB,
  rgbToHex,
  rgbToHSL,
  hslToRGB,
  rgbToHSV,
  hsvToRGB,
  formatRGB,
  formatRGBA,
  formatHSL,
  formatHSLA,
  parseColor,
  getContrastColor,
  lighten,
  darken,
  generatePalette,
  MATERIAL_COLORS,
  BASIC_COLORS,
  type ColorPickerState,
  type RGB,
  type HSL,
  type HSV,
  type ColorFormat,
} from './useColorPicker';
