import { useMemo } from 'react';
import {
  createFormValidation,
  VALIDATION_RULES,
  type ValidationRule,
  type ValidationRules,
} from '@dailyuse/ui-core';

export interface UseFormValidationReturn {
  /** All validation rules */
  rules: ValidationRules;
  /** Validate a single field */
  validateField: (value: unknown, fieldRules: ValidationRule[]) => string | true;
  /** Create a required rule with custom message */
  requiredRule: (message?: string) => ValidationRule;
  /** Create an email rule with custom message */
  emailRule: (message?: string) => ValidationRule;
  /** Create a min length rule */
  minLengthRule: (min: number, message?: string) => ValidationRule;
  /** Create a max length rule */
  maxLengthRule: (max: number, message?: string) => ValidationRule;
}

/**
 * React hook for form validation
 * Wraps @dailyuse/ui-core form validation logic
 */
export function useFormValidation(): UseFormValidationReturn {
  const core = useMemo(() => createFormValidation(), []);

  return {
    rules: VALIDATION_RULES,
    validateField: core.validateField,
    requiredRule: core.requiredRule,
    emailRule: core.emailRule,
    minLengthRule: core.minLengthRule,
    maxLengthRule: core.maxLengthRule,
  };
}
