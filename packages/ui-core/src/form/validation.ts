/**
 * Form validation rules - Framework agnostic
 */

export type ValidationRule = (value: unknown) => boolean | string;

export interface ValidationRules {
  required: (message?: string) => ValidationRule;
  email: (message?: string) => ValidationRule;
  minLength: (min: number, message?: string) => ValidationRule;
  maxLength: (max: number, message?: string) => ValidationRule;
  pattern: (regex: RegExp, message?: string) => ValidationRule;
  numeric: (message?: string) => ValidationRule;
  alphanumeric: (message?: string) => ValidationRule;
}

/**
 * Pre-built validation rules
 */
export const VALIDATION_RULES: ValidationRules = {
  required: (message = '此字段为必填项') => {
    return (value: unknown): boolean | string => {
      if (value === null || value === undefined) return message;
      if (typeof value === 'string' && value.trim() === '') return message;
      if (Array.isArray(value) && value.length === 0) return message;
      return true;
    };
  },

  email: (message = '请输入有效的邮箱地址') => {
    return (value: unknown): boolean | string => {
      if (!value) return true; // Let required handle empty
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(value)) || message;
    };
  },

  minLength: (min: number, message?: string) => {
    const msg = message || `最少需要 ${min} 个字符`;
    return (value: unknown): boolean | string => {
      if (!value) return true;
      return String(value).length >= min || msg;
    };
  },

  maxLength: (max: number, message?: string) => {
    const msg = message || `最多允许 ${max} 个字符`;
    return (value: unknown): boolean | string => {
      if (!value) return true;
      return String(value).length <= max || msg;
    };
  },

  pattern: (regex: RegExp, message = '格式不正确') => {
    return (value: unknown): boolean | string => {
      if (!value) return true;
      return regex.test(String(value)) || message;
    };
  },

  numeric: (message = '请输入数字') => {
    return (value: unknown): boolean | string => {
      if (!value) return true;
      return /^\d+$/.test(String(value)) || message;
    };
  },

  alphanumeric: (message = '只允许字母和数字') => {
    return (value: unknown): boolean | string => {
      if (!value) return true;
      return /^[a-zA-Z0-9]+$/.test(String(value)) || message;
    };
  },
};

export interface FormValidationStore {
  validateField: (value: unknown, rules: ValidationRule[]) => string | true;
  requiredRule: (message?: string) => ValidationRule;
  emailRule: (message?: string) => ValidationRule;
  minLengthRule: (min: number, message?: string) => ValidationRule;
  maxLengthRule: (max: number, message?: string) => ValidationRule;
}

/**
 * Create a form validation store
 */
export function createFormValidation(): FormValidationStore {
  return {
    validateField: (value: unknown, rules: ValidationRule[]): string | true => {
      for (const rule of rules) {
        const result = rule(value);
        if (typeof result === 'string') {
          return result;
        }
        if (result === false) {
          return '验证失败';
        }
      }
      return true;
    },
    requiredRule: VALIDATION_RULES.required,
    emailRule: VALIDATION_RULES.email,
    minLengthRule: VALIDATION_RULES.minLength,
    maxLengthRule: VALIDATION_RULES.maxLength,
  };
}
