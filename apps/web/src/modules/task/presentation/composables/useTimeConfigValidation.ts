import { ref, computed } from 'vue';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskTimeConfigClientDTO } from '@dailyuse/contracts/task';

// Note: any and TaskTimeType are not exported, using any for now
// TODO: Fix type imports when contracts are updated

/**
 * 时间配置验证组合式函数
 * 重构后专注于用户体验验证，核心业务验证移到聚合根中
 */
export function useTimeConfigValidation() {
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);

  /**
   * UI层面的用户体验验证 - 主要是实时反馈和建议
   */
  const validateUserExperience = (timeConfig: any): void => {
    warnings.value = [];

    // 时间设置的用户体验检查
    if (timeConfig.time.timeType === 'specificTime' && timeConfig.time.startTime) {
      const hour = parseInt(timeConfig.time.startTime.split(':')[0]);
      if (hour < 6 || hour > 23) {
        warnings.value.push('任务时间较早或较晚，请确认是否合适');
      }
      if (hour >= 12 && hour <= 14) {
        warnings.value.push('午休时间安排任务，请注意是否会被打扰');
      }
    }

    // 时间段类型的用户体验检查
    if (timeConfig.time.timeType === 'timeRange') {
      if (timeConfig.time.startTime && timeConfig.time.endTime) {
        const duration = calculateDurationMinutes(
          timeConfig.time.startTime,
          timeConfig.time.endTime,
        );

        if (duration > 480) {
          // 8小时
          warnings.value.push('任务时长超过8小时，建议分解为较小的任务');
        } else if (duration < 15) {
          warnings.value.push('任务时长不足15分钟，可能过于简短');
        }

        if (duration > 120 && timeConfig.schedule.mode === 'daily') {
          warnings.value.push('每日重复的长时间任务，请确认是否现实');
        }
      }
    }

    // 调度设置的用户体验建议
    if (timeConfig.schedule.mode === 'intervalDays' && timeConfig.schedule.intervalDays) {
      if (timeConfig.schedule.intervalDays > 30) {
        warnings.value.push('间隔天数较长，可能导致任务被遗忘');
      }
    }

    // 日期范围的用户体验检查
    if (timeConfig.date.endDate) {
      const durationDays = Math.ceil(
        (timeConfig.date.endDate.getTime() - timeConfig.date.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (durationDays > 365) {
        warnings.value.push('任务期间超过一年，建议考虑是否需要分阶段');
      }
    }
  };

  /**
   * 调用聚合根的业务验证 - 这会抛出错误如果验证失败
   */
  const validateBusinessRules = (timeConfig: any): boolean => {
    try {
      // 这里应该调用 TaskTemplate 聚合根的验证方法
      // 在实际使用时，这些验证会在提交数据到聚合根时进行

      // 基础的业务规则验证（模拟聚合根验证）
      if (!timeConfig.time.timeType) {
        throw new Error('必须指定时间类型');
      }

      if (!timeConfig.schedule.mode) {
        throw new Error('必须指定调度模式');
      }

      if (!timeConfig.timezone) {
        throw new Error('必须指定时区');
      }

      if (!timeConfig.date.startDate) {
        throw new Error('必须设置开始日期');
      }

      // 时间段类型的业务验证
      if (timeConfig.time.timeType === 'timeRange') {
        if (!timeConfig.time.startTime) {
          throw new Error('时间段任务必须设置开始时间');
        }
        if (!timeConfig.time.endTime) {
          throw new Error('时间段任务必须设置结束时间');
        }

        const duration = calculateDurationMinutes(
          timeConfig.time.startTime,
          timeConfig.time.endTime,
        );
        if (duration <= 0) {
          throw new Error('结束时间必须晚于开始时间');
        }
        if (duration > 1440) {
          // 24小时
          throw new Error('单个任务持续时间不能超过24小时');
        }
      }

      // 日期范围验证
      if (timeConfig.date.endDate) {
        if (timeConfig.date.endDate.getTime() <= timeConfig.date.startDate.getTime()) {
          throw new Error('结束日期必须晚于开始日期');
        }
      }

      // 调度配置验证
      if (timeConfig.schedule.mode === 'intervalDays') {
        if (!timeConfig.schedule.intervalDays || timeConfig.schedule.intervalDays < 1) {
          throw new Error('间隔天数必须大于0');
        }
        if (timeConfig.schedule.intervalDays > 365) {
          throw new Error('间隔天数不能超过365天');
        }
      }

      if (timeConfig.schedule.mode === 'weekly') {
        if (!timeConfig.schedule.weekdays || timeConfig.schedule.weekdays.length === 0) {
          throw new Error('周重复必须选择至少一个星期');
        }
      }

      if (timeConfig.schedule.mode === 'monthly') {
        if (!timeConfig.schedule.monthDays || timeConfig.schedule.monthDays.length === 0) {
          throw new Error('月重复必须选择至少一天');
        }
      }

      errors.value = [];
      return true;
    } catch (error: any) {
      errors.value = [error.message];
      return false;
    }
  };

  /**
   * 综合验证方法
   */
  const validateTimeConfig = (timeConfig: any): boolean => {
    validateUserExperience(timeConfig);
    return validateBusinessRules(timeConfig);
  };

  /**
   * 快速检查时间冲突 (简单的UI层检查)
   */
  const checkBasicTimeConflict = (
    timeConfig: any,
    otherTimes: any[] = [],
  ): boolean => {
    if (timeConfig.time.timeType === 'allDay') return true;

    // 简单的重叠检查（同一天内）
    for (const other of otherTimes) {
      if (other.time.timeType === 'allDay') continue;

      // 检查是否在同一天
      const sameDay =
        timeConfig.date.startDate.toDateString() === other.date.startDate.toDateString();
      if (!sameDay) continue;

      if (timeConfig.time.startTime && other.time.startTime) {
        const start1 = timeStringToMinutes(timeConfig.time.startTime);
        const end1 = timeConfig.time.endTime
          ? timeStringToMinutes(timeConfig.time.endTime)
          : start1 + 60;
        const start2 = timeStringToMinutes(other.time.startTime);
        const end2 = other.time.endTime ? timeStringToMinutes(other.time.endTime) : start2 + 60;

        if (start1 < end2 && end1 > start2) {
          warnings.value.push('存在时间重叠的任务，请注意安排');
          break;
        }
      }
    }

    return true;
  };

  /**
   * 重置验证状态
   */
  const resetValidation = () => {
    errors.value = [];
    warnings.value = [];
  };

  /**
   * 计算持续时间（分钟）
   */
  const calculateDurationMinutes = (startTime: string, endTime: string): number => {
    const start = timeStringToMinutes(startTime);
    const end = timeStringToMinutes(endTime);
    return end - start;
  };

  /**
   * 将时间字符串转换为分钟数
   */
  const timeStringToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isValid = computed(() => errors.value.length === 0);
  const hasWarnings = computed(() => warnings.value.length > 0);

  return {
    // 状态
    errors,
    warnings,
    isValid,
    hasWarnings,

    // 方法
    validateTimeConfig,
    validateUserExperience,
    validateBusinessRules,
    checkBasicTimeConflict,
    resetValidation,
  };
}

