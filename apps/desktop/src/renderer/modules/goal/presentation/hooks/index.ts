/**
 * Goal Presentation Hooks - Index
 * 
 * EPIC-015 重构: 移除 State 类型导出
 * - State 类型已移除，统一使用 Store 状态
 * - 仅导出 Hook 和 Return 类型
 */

export { useGoal, type UseGoalReturn } from './useGoal';
export { useGoalFolder, type UseGoalFolderReturn } from './useGoalFolder';
export {
  useKeyResult,
  type UseKeyResultReturn,
  type CreateKeyResultInput,
  type UpdateKeyResultInput,
  type CreateRecordInput,
} from './useKeyResult';
export {
  useGoalReview,
  type UseGoalReviewReturn,
  type CreateReviewInput,
  type UpdateReviewInput,
} from './useGoalReview';
