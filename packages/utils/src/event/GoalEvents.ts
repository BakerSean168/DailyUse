/**
 * Goal 相关的事件定义
 *
 * @deprecated 请直接从 @dailyuse/contracts/goal 导入
 * 此文件保留用于向后兼容，将在未来版本中移除
 *
 * 迁移示例：
 * ```typescript
 * // 旧的导入方式
 * import { GoalEvents, GoalAggregateRefreshEvent } from '@dailyuse/utils';
 *
 * // 新的导入方式
 * import { GoalEvents, GoalAggregateRefreshEvent } from '@dailyuse/contracts/goal';
 * ```
 */
export {
  GoalEvents,
  type GoalAggregateRefreshEvent,
  type GoalAggregateRefreshReason,
  type GoalEventType,
} from '@dailyuse/contracts/goal';
