/**
 * Goal Services (Server)
 *
 * Server-side services for goal operations.
 * Each service represents a single business operation.
 *
 * Pattern:
 * - Each service is a class with a single `execute` method
 * - Dependencies are injected via constructor
 * - Returns DTOs, not domain objects
 */

// ============================================================
// Services
// ============================================================

export {
  CreateGoal,
  createGoal,
  type CreateGoalInput,
  type CreateGoalOutput,
} from './create-goal';

export {
  GetGoal,
  getGoal,
  type GetGoalInput,
  type GetGoalOutput,
} from './get-goal';

export {
  ListGoals,
  listGoals,
  type ListGoalsInput,
  type ListGoalsOutput,
} from './list-goals';

export {
  UpdateGoal,
  updateGoal,
  type UpdateGoalInput,
  type UpdateGoalOutput,
} from './update-goal';

export {
  DeleteGoal,
  deleteGoal,
  type DeleteGoalInput,
  type DeleteGoalOutput,
  type CheckDependenciesOutput,
} from './delete-goal';

export {
  ArchiveGoal,
  archiveGoal,
  type ArchiveGoalInput,
  type ArchiveGoalOutput,
} from './archive-goal';

export {
  ActivateGoal,
  activateGoal,
  type ActivateGoalInput,
  type ActivateGoalOutput,
} from './activate-goal';

export {
  CompleteGoal,
  completeGoal,
  type CompleteGoalInput,
  type CompleteGoalOutput,
} from './complete-goal';

export {
  SearchGoals,
  searchGoals,
  type SearchGoalsInput,
  type SearchGoalsOutput,
} from './search-goals';

// ============================================================
// Legacy: GoalApplicationService (保留向后兼容)
// ============================================================

export {
  GoalApplicationService,
  createGoalApplicationService,
  type CreateGoalParams,
  type UpdateGoalParams,
} from './GoalApplicationService';

