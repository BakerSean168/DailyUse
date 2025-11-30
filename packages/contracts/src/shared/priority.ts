/**
 * Priority Level - 通用优先级等级
 *
 * 5级优先级系统，适用于 Goal、Task、Reminder 等所有需要优先级的实体
 * 与 ImportanceLevel（重要性）和 UrgencyLevel（紧急性）配合使用
 */

/**
 * 优先级等级
 * Priority Level Enum
 *
 * 基于 ImportanceLevel 和 UrgencyLevel 计算得出的最终优先级
 * 计算公式见 @dailyuse/utils 中的 calculatePriority 函数
 */
export enum PriorityLevel {
  /**
   * 紧急 - 最高优先级，需要立即处理
   * 通常是 vital + critical 的组合
   */
  Critical = 'critical',

  /**
   * 高优先级 - 今天必须处理
   * 通常是 important + high 的组合
   */
  High = 'high',

  /**
   * 中等优先级 - 近期需要处理
   * 通常是 moderate + medium 的组合
   */
  Medium = 'medium',

  /**
   * 低优先级 - 可以稍后处理
   * 通常是 minor + low 的组合
   */
  Low = 'low',

  /**
   * 无优先级 - 没有具体时间要求
   * 通常是 trivial + none 的组合
   */
  None = 'none',
}

/**
 * 优先级权重映射
 */
export const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  [PriorityLevel.Critical]: 5,
  [PriorityLevel.High]: 4,
  [PriorityLevel.Medium]: 3,
  [PriorityLevel.Low]: 2,
  [PriorityLevel.None]: 1,
};

/**
 * 计算优先级结果
 */
export interface PriorityCalculationResult {
  /** 优先级等级 */
  level: PriorityLevel;
  /** 优先级分数 (0-100) */
  score: number;
}
