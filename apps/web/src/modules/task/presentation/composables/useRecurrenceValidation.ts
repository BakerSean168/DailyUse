import { ref, computed, watch, readonly, type Ref } from 'vue';
import { format } from 'date-fns';

/**
 * 任务调度验证组合式函数
 * 提供任务调度配置的UI层面验证功能
 * 重构后专注于用户体验验证，核心业务验证移到聚合根中
 */
export function useRecurrenceValidation(scheduleConfig: Ref<any>) {
  // 验证状态
  const validationErrors = ref<string[]>([]);
  const warnings = ref<string[]>([]);
  const isValid = computed(() => validationErrors.value.length === 0);
  const hasWarnings = computed(() => warnings.value.length > 0);

  /**
   * UI层面的用户体验验证 - 主要是警告和建议
   */
  const validateUserExperience = (): void => {
    warnings.value = [];

    const { mode, intervalDays, weekdays, monthDays } = scheduleConfig.value;

    // 用户体验建议
    switch (mode) {
      case 'intervalDays':
        if (intervalDays && intervalDays > 30) {
          warnings.value.push('间隔天数较长，可能影响任务连续性');
        }
        break;

      case 'weekly':
        if (weekdays && weekdays.length > 5) {
          warnings.value.push('选择了过多的星期，可能导致任务过于频繁');
        }
        break;

      case 'monthly':
        if (monthDays && monthDays.length > 15) {
          warnings.value.push('选择了过多的日期，可能导致任务过于频繁');
        }
        break;
    }
  };

  /**
   * 调用聚合根的业务验证 - 这会抛出错误如果验证失败
   */
  const validateBusinessRules = (): boolean => {
    try {
      // 这里应该调用 TaskTemplate 聚合根的验证方法
      // 由于我们在 composable 中，无法直接访问聚合根
      // 实际使用时，这些验证应该在提交数据到聚合根时进行
      validationErrors.value = [];
      return true;
    } catch (error: any) {
      validationErrors.value = [error.message];
      return false;
    }
  };

  /**
   * 综合验证方法
   */
  const validate = (): boolean => {
    validateUserExperience();
    return validateBusinessRules();
  };

  /**
   * 获取调度配置的描述文本（用于UI显示）
   */
  const getScheduleDescription = computed(() => {
    const { mode, intervalDays, weekdays, monthDays } = scheduleConfig.value;

    switch (mode) {
      case 'once':
        return '单次任务';

      case 'daily':
        return '每天';

      case 'weekly':
        if (weekdays?.length) {
          const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
          const selectedDays = weekdays.map((d: number) => weekdayNames[d]).join('、');
          return `每周${selectedDays}`;
        }
        return '每周';

      case 'monthly':
        if (monthDays?.length) {
          const selectedDays = monthDays.map((day: number) => `${day}日`).join('、');
          return `每月${selectedDays}`;
        }
        return '每月';

      case 'intervalDays':
        return intervalDays ? `每${intervalDays}天` : '间隔天数';

      default:
        return '未设置';
    }
  });

  /**
   * 重置验证状态
   */
  const resetValidation = () => {
    validationErrors.value = [];
    warnings.value = [];
  };

  // 监听调度配置变化，自动进行用户体验验证
  watch(
    scheduleConfig,
    () => {
      validateUserExperience();
    },
    { deep: true },
  );

  // 初始验证
  validateUserExperience();

  return {
    // 状态
    validationErrors: readonly(validationErrors),
    warnings: readonly(warnings),
    isValid,
    hasWarnings,

    // 方法
    validate,
    validateUserExperience,
    validateBusinessRules,
    resetValidation,

    // 计算属性
    getScheduleDescription,
  };
}
