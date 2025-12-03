/**
 * @dailyuse/ui-vue - Password Strength Composable
 *
 * Vue 3 composable wrapping @dailyuse/ui-core password strength.
 */

import { computed, type Ref, type ComputedRef, unref } from 'vue';
import {
  calculatePasswordStrength,
  generateStrongPassword,
  generatePassphrase,
  type PasswordStrengthResult,
  type PasswordStrengthOptions,
} from '@dailyuse/ui-core';

// Re-export for convenience
export { generateStrongPassword, generatePassphrase };
export type { PasswordStrengthResult, PasswordStrengthOptions };

/**
 * Type for value that can be a Ref or a plain value
 */
export type MaybeRef<T> = T | Ref<T>;

/**
 * Reactive password strength calculation
 */
export function usePasswordStrength(
  password: MaybeRef<string>,
  options?: PasswordStrengthOptions
): {
  /** Full strength result */
  strength: ComputedRef<PasswordStrengthResult>;
  /** Strength score (0-100) */
  score: ComputedRef<number>;
  /** Strength percentage for progress bars */
  percentage: ComputedRef<number>;
  /** Strength level text */
  text: ComputedRef<string>;
  /** Strength level */
  level: ComputedRef<string>;
  /** Improvement suggestions */
  suggestions: ComputedRef<string[]>;
  /** Whether password meets minimum requirements */
  isValid: ComputedRef<boolean>;
  /** Whether password is strong enough */
  isStrong: ComputedRef<boolean>;
  /** Color for strength indicator */
  color: ComputedRef<string>;
} {
  const strength = computed(() =>
    calculatePasswordStrength(unref(password), options)
  );

  const score = computed(() => strength.value.score);
  const percentage = computed(() => Math.min(100, strength.value.score));
  const text = computed(() => strength.value.text);
  const level = computed(() => strength.value.level);
  const suggestions = computed(() => strength.value.suggestions);
  const isValid = computed(() => strength.value.isValid);
  const isStrong = computed(() => strength.value.isStrong);

  const color = computed(() => {
    const s = strength.value.score;
    if (s >= 75) return 'success';
    if (s >= 50) return 'info';
    if (s >= 25) return 'warning';
    return 'error';
  });

  return {
    strength,
    score,
    percentage,
    text,
    level,
    suggestions,
    isValid,
    isStrong,
    color,
  };
}
