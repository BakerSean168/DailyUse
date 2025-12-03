/**
 * @dailyuse/ui-core - Form Validation
 *
 * Framework-agnostic validation rules and helpers.
 * These are pure functions that can be used with any UI framework.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Validation rule function type (framework-agnostic).
 * Returns true for valid, or an error message string for invalid.
 */
export type ValidationRule<T = unknown> = (value: T) => true | string;

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validation rule factory options
 */
export interface ValidationOptions {
  required?: {
    message?: string;
  };
  minLength?: {
    length: number;
    message?: string;
  };
  maxLength?: {
    length: number;
    message?: string;
  };
  pattern?: {
    regex: RegExp;
    message?: string;
  };
  custom?: ValidationRule<string>;
}

// ============================================================================
// Core Validation Primitives
// ============================================================================

/**
 * Create a required field validation rule
 */
export function required(message = '此栏必填'): ValidationRule<unknown> {
  return (value) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return message;
    }
    return true;
  };
}

/**
 * Create a minimum length validation rule
 */
export function minLength(
  length: number,
  message?: string
): ValidationRule<string> {
  const errorMessage = message ?? `长度不能小于 ${length} 个字符`;
  return (value) => {
    if (!value || value.length < length) {
      return errorMessage;
    }
    return true;
  };
}

/**
 * Create a maximum length validation rule
 */
export function maxLength(
  length: number,
  message?: string
): ValidationRule<string> {
  const errorMessage = message ?? `长度不能超过 ${length} 个字符`;
  return (value) => {
    if (value && value.length > length) {
      return errorMessage;
    }
    return true;
  };
}

/**
 * Create a pattern validation rule
 */
export function pattern(
  regex: RegExp,
  message = '格式不正确'
): ValidationRule<string> {
  return (value) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return true;
  };
}

/**
 * Create a range validation rule for numbers
 */
export function range(
  min: number,
  max: number,
  message?: string
): ValidationRule<number> {
  const errorMessage = message ?? `必须在 ${min} 到 ${max} 之间`;
  return (value) => {
    if (value < min || value > max) {
      return errorMessage;
    }
    return true;
  };
}

// ============================================================================
// Common Validators (Pre-built)
// ============================================================================

/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex (Chinese mobile)
 */
export const PHONE_REGEX = /^1[3-9]\d{9}$/;

/**
 * URL validation regex
 */
export const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

/**
 * Create an email validation rule
 */
export function email(message = '邮箱格式不正确'): ValidationRule<string> {
  return pattern(EMAIL_REGEX, message);
}

/**
 * Create a phone validation rule
 */
export function phone(message = '手机号码格式不正确'): ValidationRule<string> {
  return pattern(PHONE_REGEX, message);
}

/**
 * Create a URL validation rule
 */
export function url(message = 'URL 格式不正确'): ValidationRule<string> {
  return pattern(URL_REGEX, message);
}

// ============================================================================
// Username Validation Rules
// ============================================================================

/**
 * Create username validation rules
 */
export function usernameRules(
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    requiredMessage?: string;
    minLengthMessage?: string;
    maxLengthMessage?: string;
    patternMessage?: string;
  } = {}
): ValidationRule<string>[] {
  const {
    minLength: minLen = 3,
    maxLength: maxLen = 20,
    required: isRequired = true,
    requiredMessage = '用户名必填',
    minLengthMessage = `用户名长度不能小于 ${minLen} 个字符`,
    maxLengthMessage = `用户名长度不能超过 ${maxLen} 个字符`,
    patternMessage = '用户名只能包含字母、数字和下划线',
  } = options;

  const rules: ValidationRule<string>[] = [];

  if (isRequired) {
    rules.push(required(requiredMessage) as ValidationRule<string>);
  }

  rules.push(
    minLength(minLen, minLengthMessage),
    maxLength(maxLen, maxLengthMessage),
    pattern(/^[a-zA-Z0-9_]+$/, patternMessage)
  );

  return rules;
}

// ============================================================================
// Password Validation Rules
// ============================================================================

/**
 * Create password validation rules
 */
export function passwordRules(
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  } = {}
): ValidationRule<string>[] {
  const {
    minLength: minLen = 6,
    maxLength: maxLen = 50,
    required: isRequired = true,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = options;

  const rules: ValidationRule<string>[] = [];

  if (isRequired) {
    rules.push(required('密码必填') as ValidationRule<string>);
  }

  rules.push(
    minLength(minLen, `密码长度不能小于 ${minLen} 个字符`),
    maxLength(maxLen, `密码长度不能超过 ${maxLen} 个字符`)
  );

  if (requireUppercase) {
    rules.push(pattern(/[A-Z]/, '密码必须包含至少一个大写字母'));
  }

  if (requireLowercase) {
    rules.push(pattern(/[a-z]/, '密码必须包含至少一个小写字母'));
  }

  if (requireNumber) {
    rules.push(pattern(/\d/, '密码必须包含至少一个数字'));
  }

  if (requireSpecial) {
    rules.push(
      pattern(/[!@#$%^&*(),.?":{}|<>]/, '密码必须包含至少一个特殊字符')
    );
  }

  return rules;
}

// ============================================================================
// Email/Phone Validation Rules
// ============================================================================

/**
 * Create email validation rules
 */
export function emailRules(
  options: {
    required?: boolean;
    requiredMessage?: string;
    formatMessage?: string;
  } = {}
): ValidationRule<string>[] {
  const {
    required: isRequired = true,
    requiredMessage = '邮箱必填',
    formatMessage = '邮箱格式不正确',
  } = options;

  const rules: ValidationRule<string>[] = [];

  if (isRequired) {
    rules.push(required(requiredMessage) as ValidationRule<string>);
  }

  rules.push(email(formatMessage));

  return rules;
}

/**
 * Create phone validation rules
 */
export function phoneRules(
  options: {
    required?: boolean;
    requiredMessage?: string;
    formatMessage?: string;
  } = {}
): ValidationRule<string>[] {
  const {
    required: isRequired = true,
    requiredMessage = '手机号码必填',
    formatMessage = '手机号码格式不正确',
  } = options;

  const rules: ValidationRule<string>[] = [];

  if (isRequired) {
    rules.push(required(requiredMessage) as ValidationRule<string>);
  }

  rules.push(phone(formatMessage));

  return rules;
}

// ============================================================================
// Validation Execution
// ============================================================================

/**
 * Run a single validation rule
 */
export function validateSingle<T>(
  value: T,
  rule: ValidationRule<T>
): ValidationResult {
  const result = rule(value);
  if (result === true) {
    return { isValid: true, errors: [] };
  }
  return { isValid: false, errors: [result] };
}

/**
 * Run multiple validation rules (stop on first error)
 */
export function validate<T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    const result = rule(value);
    if (result !== true) {
      errors.push(result);
      break; // Stop on first error (common UX pattern)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Run multiple validation rules (collect all errors)
 */
export function validateAll<T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    const result = rule(value);
    if (result !== true) {
      errors.push(result);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Combine multiple rules into one
 */
export function combine<T>(...rules: ValidationRule<T>[]): ValidationRule<T> {
  return (value) => {
    for (const rule of rules) {
      const result = rule(value);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}
