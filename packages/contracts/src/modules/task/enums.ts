/**
 * Task Module Enums
 * 任务模块枚举定义
 */

// ============ 从 shared 导入并重新导出 ============
import { ImportanceLevel, UrgencyLevel } from '../../shared/index';
export { ImportanceLevel, UrgencyLevel };

// ============ 任务类型枚举 ============

/**
 * 任务类型
 */
export enum TaskType {
  ONE_TIME = 'ONE_TIME', // 单次任务
  RECURRING = 'RECURRING', // 重复任务
}

/**
 * 时间类型
 */
export enum TimeType {
  ALL_DAY = 'ALL_DAY', // 全天任务
  timePoint = 'TIME_POINT', // 时间点任务
  timeRange = 'TIME_RANGE', // 时间段任务
}

// ============ 状态枚举 ============

/**
 * 任务模板状态
 */
export enum TaskTemplateStatus {
  ACTIVE = 'ACTIVE', // 激活
  PAUSED = 'PAUSED', // 暂停
  ARCHIVED = 'ARCHIVED', // 归档
  DELETED = 'DELETED', // 删除
}

/**
 * 任务实例状态
 */
export enum TaskInstanceStatus {
  PENDING = 'PENDING', // 待处理
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  COMPLETED = 'COMPLETED', // 已完成
  SKIPPED = 'SKIPPED', // 已跳过
  EXPIRED = 'EXPIRED', // 已过期
}

// ============ 重复规则枚举 ============

/**
 * 重复频率
 */
export enum RecurrenceFrequency {
  DAILY = 'DAILY', // 每天
  WEEKLY = 'WEEKLY', // 每周
  MONTHLY = 'MONTHLY', // 每月
  YEARLY = 'YEARLY', // 每年
}

/**
 * 星期几
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// ============ 提醒枚举 ============

/**
 * 提醒类型
 */
export enum ReminderType {
  ABSOLUTE = 'ABSOLUTE', // 绝对时间提醒
  RELATIVE = 'RELATIVE', // 相对时间提醒
}

/**
 * 相对时间单位
 */
export enum ReminderTimeUnit {
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
}

// ============ 依赖关系枚举 ============

/**
 * 依赖类型
 * 定义任务之间的依赖关系类型
 */
export enum DependencyType {
  /**
   * 完成-开始（最常见）
   * Predecessor 完成后，Successor 才能开始
   * Example: "写代码" 完成后，"代码审查" 才能开始
   */
  FINISH_TO_START = 'FINISH_TO_START',

  /**
   * 开始-开始
   * Predecessor 开始后，Successor 才能开始
   * Example: "设计" 开始后，"原型开发" 才能开始
   */
  START_TO_START = 'START_TO_START',

  /**
   * 完成-完成
   * Predecessor 完成后，Successor 才能完成
   * Example: "前端开发" 完成后，"整体测试" 才能完成
   */
  FINISH_TO_FINISH = 'FINISH_TO_FINISH',

  /**
   * 开始-完成（少见）
   * Predecessor 开始后，Successor 才能完成
   * Example: "交接培训" 开始后，"旧系统维护" 才能完成
   */
  START_TO_FINISH = 'START_TO_FINISH',
}

/**
 * 依赖状态
 * 表示任务的依赖满足情况
 */
export enum DependencyStatus {
  /**
   * 无依赖
   * 任务没有前置依赖，可以立即开始
   */
  NONE = 'NONE',

  /**
   * 等待中
   * 任务有前置依赖，但前置任务尚未完成
   */
  WAITING = 'WAITING',

  /**
   * 就绪
   * 所有前置依赖已满足，任务可以开始
   */
  READY = 'READY',

  /**
   * 被阻塞
   * 前置任务被阻塞或有问题，导致此任务也被阻塞
   */
  BLOCKED = 'BLOCKED',
}
