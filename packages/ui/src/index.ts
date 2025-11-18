// Components - Account
export { default as DuAvatar } from './components/account/DuAvatar.vue';
export { default as DuLoginForm } from './components/account/DuLoginForm.vue';
export { default as DuRegistrationForm } from './components/account/DuRegistrationForm.vue';
export { default as DuProfileForm } from './components/account/DuProfileForm.vue';
export { default as DuPasswordResetForm } from './components/account/DuPasswordResetForm.vue';

// Components - Dialog
export { default as DuDialog } from './components/dialog/DuDialog.vue';
export { default as DuConfirmDialog } from './components/dialog/DuConfirmDialog.vue';

// Components - Feedback
export { default as DuSnackbar } from './components/feedback/DuSnackbar.vue';
export { default as DuMessageProvider } from './components/feedback/DuMessageProvider.vue';
export { default as DuLoadingOverlay } from './components/feedback/DuLoadingOverlay.vue';

// Components - Form
export { default as DuTextField } from './components/form/DuTextField.vue';

// Components - Pickers
export { default as ColorPicker } from './components/ColorPicker.vue';
export { default as IconPicker } from './components/IconPicker.vue';

// Composables
export { useSnackbar } from './composables/useSnackbar';
export { useFormRules } from './composables/useFormValidation';
export { usePasswordStrength, generateStrongPassword } from './composables/usePasswordStrength';
export {
  useMessage,
  getGlobalMessage,
  type MessageType,
  type MessageOptions,
  type ConfirmOptions,
  type MessageInstance,
} from './composables/useMessage';
export {
  useLoading,
  useGlobalLoading,
  getGlobalLoading,
  useAdvancedLoading,
  useButtonLoading,
  useTableLoading,
  type LoadingOverlayOptions,
} from './composables/useLoading';

// Types
export type {
  SnackbarOptions,
  FormRule,
  UserBasicInfo,
  RegistrationData,
  LoginData,
  PasswordStrength,
  SexOption,
} from './types';

// Constants
export const UI_VERSION = '1.0.0';

// Default configurations
export const DEFAULT_SNACKBAR_OPTIONS: Partial<import('./types').SnackbarOptions> = {
  timeout: 5000,
  color: 'info',
};

export const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 64,
  '3xl': 80,
  '4xl': 96,
} as const;

export const PASSWORD_STRENGTH_COLORS = {
  weak: 'error',
  medium: 'warning',
  strong: 'success',
  'very-strong': 'success',
} as const;

export const STATUS_COLORS = {
  online: 'success',
  busy: 'warning',
  away: 'orange',
  offline: 'grey',
} as const;
