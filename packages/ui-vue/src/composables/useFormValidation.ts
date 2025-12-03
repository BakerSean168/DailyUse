/**
 * @dailyuse/ui-vue - Form Validation Composables
 *
 * Vue 3 composables wrapping @dailyuse/ui-core form validation.
 */

import { computed, type Ref, type ComputedRef, unref } from 'vue';
import {
  type ValidationRule,
  type ValidationResult,
  validate,
  validateAll,
  usernameRules,
  passwordRules,
  emailRules,
  phoneRules,
  required,
  minLength,
  maxLength,
  pattern,
  email,
  phone,
  url,
  combine,
} from '@dailyuse/ui-core';

// Re-export core utilities for convenience
export {
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
};

/**
 * Type for value that can be a Ref or a plain value
 */
export type MaybeRef<T> = T | Ref<T>;

/**
 * Create reactive form validation
 */
export function useFormValidation<T>(
  value: MaybeRef<T>,
  rules: ValidationRule<T>[]
): {
  result: ComputedRef<ValidationResult>;
  isValid: ComputedRef<boolean>;
  errors: ComputedRef<string[]>;
  firstError: ComputedRef<string | undefined>;
} {
  const result = computed(() => validate(unref(value), rules));
  const isValid = computed(() => result.value.isValid);
  const errors = computed(() => result.value.errors);
  const firstError = computed(() => result.value.errors[0]);

  return {
    result,
    isValid,
    errors,
    firstError,
  };
}

/**
 * Create reactive form validation that collects all errors
 */
export function useFormValidationAll<T>(
  value: MaybeRef<T>,
  rules: ValidationRule<T>[]
): {
  result: ComputedRef<ValidationResult>;
  isValid: ComputedRef<boolean>;
  errors: ComputedRef<string[]>;
} {
  const result = computed(() => validateAll(unref(value), rules));
  const isValid = computed(() => result.value.isValid);
  const errors = computed(() => result.value.errors);

  return {
    result,
    isValid,
    errors,
  };
}

/**
 * Get pre-configured form validation rules
 *
 * Returns Vuetify-compatible rule arrays that can be used directly
 * with v-text-field and other Vuetify form components.
 */
export function useFormRules() {
  return {
    /**
     * Username validation rules
     */
    username: usernameRules(),

    /**
     * Password validation rules
     */
    password: passwordRules(),

    /**
     * Email validation rules
     */
    email: emailRules(),

    /**
     * Phone validation rules
     */
    phone: phoneRules(),

    /**
     * Required field rule
     */
    required: [required()],

    /**
     * Create custom rules
     */
    custom: {
      username: usernameRules,
      password: passwordRules,
      email: emailRules,
      phone: phoneRules,
    },
  };
}
