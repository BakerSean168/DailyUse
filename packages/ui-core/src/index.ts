/**
 * @dailyuse/ui-core
 *
 * Framework-agnostic headless UI logic for DailyUse applications.
 *
 * This package provides pure TypeScript implementations of UI state machines
 * and logic that can be used with any UI framework (Vue, React, Solid, etc.).
 *
 * @example
 * ```ts
 * import { createDialogController, createMessageController } from '@dailyuse/ui-core';
 * import { passwordRules, validate } from '@dailyuse/ui-core/form';
 *
 * // Create controllers
 * const dialog = createDialogController();
 * const messages = createMessageController();
 *
 * // Use validation
 * const rules = passwordRules({ minLength: 8 });
 * const result = validate('password123', rules);
 * ```
 */

// Core exports (most commonly used)
export {
  // Dialog
  createDialogController,
  createConfirmDialog,
  createAlertDialog,
  createPromptDialog,
  createDeleteConfirmDialog,
  type DialogController,
  type DialogState,
  type DialogOptions,
  type DialogButton,
  type DialogType,
  type DeleteConfirmOptions,
} from './dialog';

export {
  // Message
  createMessageController,
  createSnackbarController,
  type MessageController,
  type MessageState,
  type Message,
  type MessageOptions,
  type MessageType,
  type SnackbarController,
  type SnackbarState,
  type CreateMessageControllerOptions,
} from './message';

export {
  // Loading
  createLoadingController,
  createGlobalLoadingController,
  createButtonLoadingController,
  createTableLoadingController,
  createLoadingWrapper,
  withLoading,
  type LoadingController,
  type LoadingState,
  type GlobalLoadingController,
  type ButtonLoadingController,
  type ButtonLoadingState,
  type TableLoadingController,
  type TableLoadingState,
} from './loading';

export {
  // Form Validation
  required,
  minLength,
  maxLength,
  pattern,
  range,
  email,
  phone,
  url,
  combine,
  validate,
  validateAll,
  validateSingle,
  usernameRules,
  passwordRules,
  emailRules,
  phoneRules,
  type ValidationRule,
  type ValidationResult,
  type ValidationOptions,
  EMAIL_REGEX,
  PHONE_REGEX,
  URL_REGEX,
} from './form';

export {
  // Password
  calculatePasswordScore,
  calculatePasswordStrength,
  getStrengthLevel,
  getPasswordSuggestions,
  generateStrongPassword,
  generatePassphrase,
  type PasswordStrengthResult,
  type PasswordStrengthLevel,
  type PasswordStrengthOptions,
} from './form';

export {
  // Color Picker
  createColorPickerController,
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
  type ColorPickerController,
  type ColorPickerState,
  type RGB,
  type HSL,
  type HSV,
  type RGBA,
  type HSLA,
  type ColorFormat,
} from './color-picker';
