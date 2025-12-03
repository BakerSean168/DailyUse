/**
 * @dailyuse/ui-vue
 * 
 * Vue 3 composables wrapping @dailyuse/ui-core headless logic.
 * This package provides reactive Vue composables that can be used
 * by any Vue-based UI library (Vuetify, Element Plus, etc.)
 */

// Re-export core types for convenience
export type {
  ValidationRule,
  ValidationRules,
  PasswordStrengthLevel,
  PasswordStrengthResult,
  LoadingState,
  LoadingStore,
  MessageType,
  MessageOptions,
  MessageState,
  MessageStore,
  DialogState,
  DialogStore,
  ColorPickerState,
  ColorPickerStore,
  UseColorPickerOptions,
} from '@dailyuse/ui-core';

// Export core utilities
export {
  VALIDATION_RULES,
  generatePassword,
  generateStrongPassword,
  generatePassphrase,
  isLightColor,
  hexToRgb,
  rgbToHex,
} from '@dailyuse/ui-core';

// Export Vue composables
export { useFormValidation, type UseFormValidationReturn } from './composables/useFormValidation';
export { usePasswordStrength, type UsePasswordStrengthReturn } from './composables/usePasswordStrength';
export { useLoading, type UseLoadingReturn } from './composables/useLoading';
export { useMessage, type UseMessageReturn } from './composables/useMessage';
export { useDialog, type UseDialogReturn } from './composables/useDialog';
export { useColorPicker, type UseColorPickerReturn } from './composables/useColorPicker';
