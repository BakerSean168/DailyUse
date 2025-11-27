/**
 * Goal Module Enums
 * 目标模块枚举定义
 *
 * 注意：枚举定义放在独立文件中，因为枚举通常是通用的，
 * 可以在 Server、Client、Persistence 层之间共享
 */
// ============ 目标相关枚举 ============
import { ImportanceLevel, UrgencyLevel } from '../../shared/index';
export { ImportanceLevel, UrgencyLevel };
/**
 * 目标状态枚举
 */
export var GoalStatus;
(function (GoalStatus) {
    GoalStatus["DRAFT"] = "DRAFT";
    GoalStatus["ACTIVE"] = "ACTIVE";
    GoalStatus["COMPLETED"] = "COMPLETED";
    GoalStatus["ARCHIVED"] = "ARCHIVED";
})(GoalStatus || (GoalStatus = {}));
// ============ 关键结果相关枚举 ============
/**
 * 关键结果值类型枚举
 */
export var KeyResultValueType;
(function (KeyResultValueType) {
    KeyResultValueType["INCREMENTAL"] = "INCREMENTAL";
    KeyResultValueType["ABSOLUTE"] = "ABSOLUTE";
    KeyResultValueType["PERCENTAGE"] = "PERCENTAGE";
    KeyResultValueType["BINARY"] = "BINARY";
})(KeyResultValueType || (KeyResultValueType = {}));
/**
 * 关键结果聚合计算方式枚举
 */
export var AggregationMethod;
(function (AggregationMethod) {
    AggregationMethod["SUM"] = "SUM";
    AggregationMethod["AVERAGE"] = "AVERAGE";
    AggregationMethod["MAX"] = "MAX";
    AggregationMethod["MIN"] = "MIN";
    AggregationMethod["LAST"] = "LAST";
})(AggregationMethod || (AggregationMethod = {}));
/**
 * 提醒类型枚举
 */
export var ReminderTriggerType;
(function (ReminderTriggerType) {
    ReminderTriggerType["TIME_PROGRESS_PERCENTAGE"] = "TIME_PROGRESS_PERCENTAGE";
    ReminderTriggerType["REMAINING_DAYS"] = "REMAINING_DAYS";
})(ReminderTriggerType || (ReminderTriggerType = {}));
// ============ 复盘相关枚举 ============
/**
 * 复盘类型枚举
 */
export var ReviewType;
(function (ReviewType) {
    ReviewType["WEEKLY"] = "WEEKLY";
    ReviewType["MONTHLY"] = "MONTHLY";
    ReviewType["QUARTERLY"] = "QUARTERLY";
    ReviewType["ANNUAL"] = "ANNUAL";
    ReviewType["ADHOC"] = "ADHOC";
})(ReviewType || (ReviewType = {}));
// ============ 文件夹相关枚举 ============
/**
 * 文件夹类型枚举
 */
export var FolderType;
(function (FolderType) {
    FolderType["ALL"] = "ALL";
    FolderType["ACTIVE"] = "ACTIVE";
    FolderType["COMPLETED"] = "COMPLETED";
    FolderType["ARCHIVED"] = "ARCHIVED";
    FolderType["CUSTOM"] = "CUSTOM";
})(FolderType || (FolderType = {}));
// ============ 专注周期相关枚举 ============
/**
 * 专注周期状态枚举
 */
export var FocusSessionStatus;
(function (FocusSessionStatus) {
    FocusSessionStatus["DRAFT"] = "DRAFT";
    FocusSessionStatus["IN_PROGRESS"] = "IN_PROGRESS";
    FocusSessionStatus["PAUSED"] = "PAUSED";
    FocusSessionStatus["COMPLETED"] = "COMPLETED";
    FocusSessionStatus["CANCELLED"] = "CANCELLED";
})(FocusSessionStatus || (FocusSessionStatus = {}));
//# sourceMappingURL=enums.js.map