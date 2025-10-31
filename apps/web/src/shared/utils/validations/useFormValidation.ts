/**
 * Vue 3 组合函数 - 使用通用校验系统
 *
 * 这个文件提供了在Vue 3中使用我们通用校验系统的组合函数
 */

// @ts-nocheck - Validation utils not yet configured
import { ref, computed, watch, reactive, type Ref } from 'vue';
import {
  FormValidator,
  type FormConfig,
  type ValidationRule,
  type ValidationTrigger,
} from '@dailyuse/utils/validation';

/**
 * Vue字段状态接口
 */
export interface VueFieldState {
  value: Ref<any>;
  error: Ref<string | undefined>;
  errors: Ref<string[]>;
  warnings: Ref<string[]>;
  valid: Ref<boolean>;
  touched: Ref<boolean>;
  dirty: Ref<boolean>;
  validating: Ref<boolean>;
}

/**
 * Vue表单状态接口
 */
export interface VueFormState {
  values: Record<string, Ref<any>>;
  fields: Record<string, VueFieldState>;
  valid: Ref<boolean>;
  validating: Ref<boolean>;
  touched: Ref<boolean>;
  dirty: Ref<boolean>;
  errors: Ref<string[]>;
  summary: Ref<string>;
}

/**
 * Vue表单方法接口
 */
export interface VueFormMethods {
  validateField: (fieldName: string, trigger?: ValidationTrigger) => Promise<void>;
  validateForm: (trigger?: ValidationTrigger) => Promise<boolean>;
  resetField: (fieldName: string) => void;
  resetForm: () => void;
  setFieldValue: (fieldName: string, value: any) => void;
  setFieldError: (fieldName: string, error: string) => void;
  clearFieldError: (fieldName: string) => void;
  getVuetifyRules: (fieldName: string) => Array<(value: any) => true | string>;
}

/**
 * 使用表单校验的组合函数选项
 */
export interface UseFormValidationOptions {
  config: FormConfig;
  initialValues?: Record<string, any>;
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Vue表单校验组合函数
 */
export function useFormValidation(options: UseFormValidationOptions) {
  const {
    config,
    initialValues = {},
    validateOnMount = false,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  // 创建校验器实例
  const validator = new FormValidator(config);

  // 创建响应式状态
  const values = reactive<Record<string, Ref<any>>>({});
  const fields = reactive<Record<string, VueFieldState>>({});

  // 全局状态
  const globalValid = ref(true);
  const globalValidating = ref(false);
  const globalTouched = ref(false);
  const globalDirty = ref(false);
  const globalErrors = ref<string[]>([]);
  const globalSummary = ref('');

  // 初始化字段
  config.fields.forEach((fieldConfig) => {
    const fieldName = fieldConfig.name;
    const initialValue = initialValues[fieldName];

    // 创建字段值响应式引用
    const fieldValue = ref(initialValue);
    values[fieldName] = fieldValue;

    // 创建字段状态
    const fieldState: VueFieldState = {
      value: fieldValue,
      error: ref<string | undefined>(),
      errors: ref<string[]>([]),
      warnings: ref<string[]>([]),
      valid: ref(true),
      touched: ref(false),
      dirty: ref(false),
      validating: ref(false),
    };

    fields[fieldName] = fieldState;

    // 监听字段值变化
    let isInitializing = true;
    watch(
      fieldValue,
      async (newValue, oldValue) => {
        if (isInitializing) {
          isInitializing = false;
          return;
        }

        // 标记为已修改
        fieldState.dirty.value = true;
        globalDirty.value = true;

        // 根据配置决定是否触发校验
        if (validateOnChange && fieldState.touched.value) {
          await validateField(fieldName, 'change');
        }
      },
      { deep: true },
    );
  });

  // 计算全局状态
  const state: VueFormState = {
    values,
    fields,
    valid: computed(() => Object.values(fields).every((field: VueFieldState) => field.valid.value)),
    validating: computed(() =>
      Object.values(fields).some((field: VueFieldState) => field.validating.value),
    ),
    touched: computed(() =>
      Object.values(fields).some((field: VueFieldState) => field.touched.value),
    ),
    dirty: computed(() => Object.values(fields).some((field: VueFieldState) => field.dirty.value)),
    errors: computed(() =>
      Object.values(fields).flatMap((field: VueFieldState) => field.errors.value),
    ),
    summary: globalSummary,
  };

  /**
   * 校验单个字段
   */
  async function validateField(
    fieldName: string,
    trigger: ValidationTrigger = 'change',
  ): Promise<void> {
    const fieldState = fields[fieldName];
    if (!fieldState) {
      console.warn(`Field ${fieldName} not found`);
      return;
    }

    fieldState.validating.value = true;

    try {
      const formData = getFormData();
      const result = await validator.validateField(
        fieldName,
        fieldState.value.value,
        formData,
        trigger,
      );

      // 更新字段状态
      updateFieldState(fieldName, result);
    } catch (error) {
      console.error(`Validation error for field ${fieldName}:`, error);
      fieldState.error.value = 'Validation failed';
      fieldState.valid.value = false;
    } finally {
      fieldState.validating.value = false;
    }
  }

  /**
   * 校验整个表单
   */
  async function validateForm(trigger: ValidationTrigger = 'submit'): Promise<boolean> {
    globalValidating.value = true;

    try {
      const formData = getFormData();
      const result = await validator.validateForm(formData, trigger);

      // 更新所有字段状态
      Object.keys(result.fields).forEach((fieldName) => {
        updateFieldState(fieldName, result.fields[fieldName]);
      });

      // 更新全局状态
      globalValid.value = result.valid;
      globalErrors.value = result.errors;
      globalSummary.value = result.summary;

      return result.valid;
    } catch (error) {
      console.error('Form validation error:', error);
      globalValid.value = false;
      globalSummary.value = 'Validation failed';
      return false;
    } finally {
      globalValidating.value = false;
    }
  }

  /**
   * 重置字段
   */
  function resetField(fieldName: string): void {
    const fieldState = fields[fieldName];
    if (!fieldState) return;

    fieldState.value.value = initialValues[fieldName];
    fieldState.error.value = undefined;
    fieldState.errors.value = [];
    fieldState.warnings.value = [];
    fieldState.valid.value = true;
    fieldState.touched.value = false;
    fieldState.dirty.value = false;
    fieldState.validating.value = false;
  }

  /**
   * 重置整个表单
   */
  function resetForm(): void {
    Object.keys(fields).forEach((fieldName) => {
      resetField(fieldName);
    });

    globalValid.value = true;
    globalValidating.value = false;
    globalTouched.value = false;
    globalDirty.value = false;
    globalErrors.value = [];
    globalSummary.value = '';
  }

  /**
   * 设置字段值
   */
  function setFieldValue(fieldName: string, value: any): void {
    const fieldState = fields[fieldName];
    if (fieldState) {
      fieldState.value.value = value;
    }
  }

  /**
   * 设置字段错误
   */
  function setFieldError(fieldName: string, error: string): void {
    const fieldState = fields[fieldName];
    if (fieldState) {
      fieldState.error.value = error;
      fieldState.errors.value = [error];
      fieldState.valid.value = false;
    }
  }

  /**
   * 清除字段错误
   */
  function clearFieldError(fieldName: string): void {
    const fieldState = fields[fieldName];
    if (fieldState) {
      fieldState.error.value = undefined;
      fieldState.errors.value = [];
      fieldState.valid.value = true;
    }
  }

  /**
   * 获取Vuetify兼容的校验规则
   */
  function getVuetifyRules(fieldName: string): Array<(value: any) => true | string> {
    const fieldConfig = config.fields.find((field) => field.name === fieldName);
    if (!fieldConfig) return [];

    return fieldConfig.rules.map(async (rule) => {
      return async (value: any) => {
        try {
          if ('validator' in rule && typeof rule.validator === 'function') {
            const formData = getFormData();
            const result = await rule.validator(value, formData);

            if (typeof result === 'boolean') {
              return result || rule.message || 'Validation failed';
            }

            if (typeof result === 'string') {
              return result;
            }

            if (typeof result === 'object' && 'valid' in result) {
              return result.valid || result.message || 'Validation failed';
            }
          }

          return true;
        } catch (error) {
          console.error('Vuetify rule validation error:', error);
          return rule.message || 'Validation failed';
        }
      };
    });
  }

  // ===== 辅助方法 =====

  /**
   * 获取表单数据
   */
  function getFormData(): Record<string, any> {
    const formData: Record<string, any> = {};
    Object.keys(values).forEach((fieldName) => {
      formData[fieldName] = values[fieldName].value;
    });
    return formData;
  }

  /**
   * 更新字段状态
   */
  function updateFieldState(fieldName: string, result: any): void {
    const fieldState = fields[fieldName];
    if (!fieldState) return;

    fieldState.valid.value = result.valid;
    fieldState.errors.value = result.errors;
    fieldState.warnings.value = result.warnings || [];
    fieldState.error.value = result.firstError;
  }

  /**
   * 处理字段聚焦
   */
  function handleFieldFocus(fieldName: string): void {
    const fieldState = fields[fieldName];
    if (fieldState) {
      fieldState.touched.value = true;
      globalTouched.value = true;
    }
  }

  /**
   * 处理字段失焦
   */
  async function handleFieldBlur(fieldName: string): Promise<void> {
    handleFieldFocus(fieldName); // 标记为已触摸
    if (validateOnBlur) {
      await validateField(fieldName, 'blur');
    }
  }

  // 初始校验
  if (validateOnMount) {
    validateForm('change');
  }

  const methods: VueFormMethods = {
    validateField,
    validateForm,
    resetField,
    resetForm,
    setFieldValue,
    setFieldError,
    clearFieldError,
    getVuetifyRules,
  };

  return {
    state,
    methods,
    // 额外的辅助方法
    handleFieldFocus,
    handleFieldBlur,
    getFormData,
  };
}

/**
 * 简化版本：单字段校验组合函数
 */
export function useFieldValidation(fieldName: string, rules: ValidationRule[], initialValue?: any) {
  const config: FormConfig = {
    fields: [{ name: fieldName, rules }],
  };

  const form = useFormValidation({
    config,
    initialValues: { [fieldName]: initialValue },
  });

  const field = form.state.fields[fieldName];

  return {
    value: field.value,
    error: field.error,
    errors: field.errors,
    warnings: field.warnings,
    valid: field.valid,
    touched: field.touched,
    dirty: field.dirty,
    validating: field.validating,
    validate: (trigger?: ValidationTrigger) => form.methods.validateField(fieldName, trigger),
    reset: () => form.methods.resetField(fieldName),
    setValue: (value: any) => form.methods.setFieldValue(fieldName, value),
    setError: (error: string) => form.methods.setFieldError(fieldName, error),
    clearError: () => form.methods.clearFieldError(fieldName),
    vuetifyRules: form.methods.getVuetifyRules(fieldName),
  };
}
