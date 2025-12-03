/**
 * 通用表单校验系统
 * Universal Form Validation System
 *
 * 一个框架无关的前端表单校验解决方案，支持同步/异步校验、
 * 自定义规则、国际化、事件系统等功能
 */

// 核心类型定义
export type {
  ValidationRule,
  RequiredRule,
  LengthRule,
  PatternRule,
  NumberRule,
  RangeRule,
  ValidationResult,
  FieldValidationResult,
  FormValidationResult,
  ValidationTrigger,
  ValidationSeverity,
  FieldConfig,
  FormConfig,
  IFormValidator,
  ValidationEventType,
  ValidationEvent,
  ValidationEventListener,
} from './types';

// 核心校验器
export { FormValidator } from './form-validator';

// 内置校验规则
export { BuiltinValidators } from './builtin-validators';

// 框架适配器 - React 相关功能暂时禁用
// export type {
//   ReactFieldState,
//   ReactFormState,
//   ReactFormMethods,
//   ReactFormReturn,
//   UseFormValidationOptions,
// } from './adapters/react-adapter';

// export {
//   useFormValidation as useReactFormValidation,
//   useFieldValidation as useReactFieldValidation,
// } from './adapters/react-adapter';

/**
 * 快速开始工具函数
 */
import type { ValidationRule } from './types';
import { FormValidator } from './form-validator';
import { BuiltinValidators } from './builtin-validators';

export function createSimpleValidator(fieldName: string, rules: ValidationRule[]) {
  const config = {
    fields: [{ name: fieldName, rules }],
  };
  return new FormValidator(config);
}

/**
 * 常用校验规则快捷方式
 */
export const validators = BuiltinValidators;

/**
 * 默认配置
 */
export const defaultConfig = {
  validateOnChange: true,
  validateOnBlur: true,
  validateOnMount: false,
  defaultSeverity: 'error' as const,
  defaultTrigger: ['change'] as const,
};

/**
 * 版本信息
 */
export const version = '1.0.0';
