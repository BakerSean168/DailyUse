/**
 * Goal Module Enums
 * 目标模块枚举定义
 *
 * 注意：枚举定义放在独立文件中，因为枚举通常是通用的，
 * 可以在 Server、Client、Persistence 层之间共享
 */
import { ImportanceLevel, UrgencyLevel } from '../../shared/index';
export { ImportanceLevel, UrgencyLevel };
/**
 * 目标状态枚举
 */
export declare enum GoalStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    ARCHIVED = "ARCHIVED"
}
/**
 * 关键结果值类型枚举
 */
export declare enum KeyResultValueType {
    INCREMENTAL = "INCREMENTAL",// 累积值
    ABSOLUTE = "ABSOLUTE",// 绝对值
    PERCENTAGE = "PERCENTAGE",// 百分比
    BINARY = "BINARY"
}
/**
 * 关键结果聚合计算方式枚举
 */
export declare enum AggregationMethod {
    SUM = "SUM",// 求和（默认，适合累计型）
    AVERAGE = "AVERAGE",// 求平均（适合平均值型）
    MAX = "MAX",// 求最大值（适合峰值型）
    MIN = "MIN",// 求最小值（适合低值型）
    LAST = "LAST"
}
/**
 * 提醒类型枚举
 */
export declare enum ReminderTriggerType {
    TIME_PROGRESS_PERCENTAGE = "TIME_PROGRESS_PERCENTAGE",// 时间进度百分比
    REMAINING_DAYS = "REMAINING_DAYS"
}
/**
 * 复盘类型枚举
 */
export declare enum ReviewType {
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    ANNUAL = "ANNUAL",
    ADHOC = "ADHOC"
}
/**
 * 文件夹类型枚举
 */
export declare enum FolderType {
    ALL = "ALL",// 所有目标
    ACTIVE = "ACTIVE",// 进行中
    COMPLETED = "COMPLETED",// 已完成
    ARCHIVED = "ARCHIVED",// 已归档
    CUSTOM = "CUSTOM"
}
/**
 * 专注周期状态枚举
 */
export declare enum FocusSessionStatus {
    DRAFT = "DRAFT",// 草稿（未开始）
    IN_PROGRESS = "IN_PROGRESS",// 进行中
    PAUSED = "PAUSED",// 已暂停
    COMPLETED = "COMPLETED",// 已完成
    CANCELLED = "CANCELLED"
}
//# sourceMappingURL=enums.d.ts.map