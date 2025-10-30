/**
 * Task Priority Value Object
 * 任务优先级值对象
 */

/**
 * 优先级等级
 */
export enum PriorityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * 任务优先级
 */
export interface TaskPriority {
  /**
   * 优先级等级
   */
  level: PriorityLevel;

  /**
   * 优先级分数 (0-100)
   */
  score: number;
}

/**
 * 优先级计算参数
 */
export interface PriorityCalculationParams {
  /**
   * 重要性 (0-4)
   */
  importance: number;

  /**
   * 紧急程度 (0-4)
   */
  urgency: number;

  /**
   * 截止日期 (Unix timestamp)
   */
  dueDate?: number;

  /**
   * 当前时间 (Unix timestamp, 用于计算时间权重)
   */
  currentTime?: number;
}
