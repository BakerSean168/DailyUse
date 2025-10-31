/**
 * 账户表单校验规则 - 使用通用校验系统
 *
 * 这个文件展示了如何将我们的通用校验系统适配到 Vuetify 的校验规则格式
 */

// @ts-nocheck - Validation utils not yet configured
import { BuiltinValidators, type ValidationRule } from '@dailyuse/utils/validation';

/**
 * 将我们的ValidationRule转换为Vuetify的校验函数格式
 */
function createVuetifyRule(rule: ValidationRule) {
  return async (value: any) => {
    if ('validator' in rule && typeof rule.validator === 'function') {
      try {
        const result = await rule.validator(value, {});

        if (typeof result === 'boolean') {
          return result || rule.message || 'Validation failed';
        }

        if (typeof result === 'string') {
          return result;
        }

        if (typeof result === 'object' && 'valid' in result) {
          return result.valid || result.message || 'Validation failed';
        }

        return true;
      } catch (error) {
        console.error('Validation error:', error);
        return rule.message || 'Validation failed';
      }
    }

    return true;
  };
}

/**
 * 将多个ValidationRule转换为Vuetify规则数组
 */
function createVuetifyRules(rules: ValidationRule[]) {
  return rules.map(createVuetifyRule);
}

/**
 * 用户名校验规则
 */
export const usernameValidationRules: ValidationRule[] = [
  BuiltinValidators.required('用户名不能为空'),
  BuiltinValidators.minLength(3, '用户名长度不能少于3个字符'),
  BuiltinValidators.maxLength(20, '用户名长度不能超过20个字符'),
  BuiltinValidators.pattern(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
];

/**
 * 密码校验规则
 */
export const passwordValidationRules: ValidationRule[] = [
  BuiltinValidators.required('密码不能为空'),
  BuiltinValidators.minLength(8, '密码长度不能少于8个字符'),
  BuiltinValidators.maxLength(20, '密码长度不能超过20个字符'),
  BuiltinValidators.pattern(/[a-z]/, '密码必须包含小写字母'),
  BuiltinValidators.pattern(/[A-Z]/, '密码必须包含大写字母'),
  BuiltinValidators.pattern(/\d/, '密码必须包含数字'),
];

/**
 * 邮箱校验规则
 */
export const emailValidationRules: ValidationRule[] = [
  BuiltinValidators.required('请输入邮箱'),
  BuiltinValidators.email('请输入有效的邮箱地址'),
];

/**
 * 为Vuetify兼容的规则（保持原有接口）
 */
export const usernameRules = [
  (v: string) => !!v || '用户名不能为空',
  (v: string) => v.length >= 3 || '用户名长度不能少于3个字符',
  (v: string) => v.length <= 20 || '用户名长度不能超过20个字符',
  (v: string) => /^[a-zA-Z0-9_]+$/.test(v) || '用户名只能包含字母、数字和下划线',
];

export const passwordRules = [
  (v: string) => !!v || '密码不能为空',
  (v: string) => v.length >= 8 || '密码长度不能少于8个字符',
  (v: string) => v.length <= 20 || '密码长度不能超过20个字符',
  (v: string) => /[a-z]/.test(v) || '密码必须包含小写字母',
  (v: string) => /[A-Z]/.test(v) || '密码必须包含大写字母',
  (v: string) => /\d/.test(v) || '密码必须包含数字',
];

export const emailRules = [
  (v: string) => !!v || '请输入邮箱',
  (v: string) => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址',
];

/**
 * 高级用法：使用我们的通用校验系统创建更复杂的规则
 */
export const advancedUsernameRules: ValidationRule[] = [
  ...usernameValidationRules,
  {
    type: 'async',
    message: '用户名已存在',
    validator: async (value: string) => {
      // 模拟异步检查用户名是否存在
      if (['admin', 'test', 'user', 'root'].includes(value.toLowerCase())) {
        return false;
      }

      // 在实际应用中，这里会调用API检查用户名
      // const response = await api.checkUsername(value);
      // return response.available;

      return true;
    },
    debounce: 500, // 防抖500ms
  },
];

export const advancedPasswordRules: ValidationRule[] = [
  ...passwordValidationRules,
  {
    type: 'custom',
    message: '密码不能包含用户名',
    validator: (value: string, formData: any) => {
      const username = formData.username || '';
      if (!username || !value) return true;
      return !value.toLowerCase().includes(username.toLowerCase());
    },
    trigger: ['change', 'blur'],
  },
  {
    type: 'custom',
    message: '密码强度不足（建议包含特殊字符）',
    severity: 'warning', // 警告级别，不阻止提交
    validator: (value: string) => {
      return /[!@#$%^&*(),.?":{}|<>]/.test(value);
    },
  },
];

/**
 * 确认密码校验规则工厂函数
 */
export function createConfirmPasswordRules(
  passwordFieldName: string = 'password',
): ValidationRule[] {
  return [
    BuiltinValidators.required('请确认密码'),
    {
      type: 'custom',
      message: '两次输入的密码不一致',
      validator: (value: string, formData: any) => {
        return value === formData[passwordFieldName];
      },
      trigger: ['change', 'blur'],
    },
  ];
}

/**
 * 手机号校验规则
 */
export const phoneValidationRules: ValidationRule[] = [
  BuiltinValidators.phone('请输入有效的手机号码'),
];

/**
 * 完整的注册表单校验配置示例
 */
export const registrationFormConfig = {
  fields: [
    {
      name: 'username',
      rules: advancedUsernameRules,
    },
    {
      name: 'email',
      rules: emailValidationRules,
    },
    {
      name: 'password',
      rules: advancedPasswordRules,
    },
    {
      name: 'confirmPassword',
      rules: createConfirmPasswordRules('password'),
    },
    {
      name: 'phone',
      rules: phoneValidationRules,
    },
  ],
  globalRules: [
    {
      type: 'custom',
      message: '邮箱和手机号至少填写一个',
      validator: (value: any, formData: any) => {
        return !!(formData.email || formData.phone);
      },
      trigger: ['submit'],
    },
  ] as ValidationRule[],
  defaultTrigger: ['change'] as const,
};

/**
 * 导出用于Vuetify的转换函数
 */
export { createVuetifyRule, createVuetifyRules };
