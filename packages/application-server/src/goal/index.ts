/**
 * Goal Application Module (Server)
 *
 * Provides services for goal management on the server side.
 * Each service orchestrates domain objects and repositories.
 */

// ============================================================
// Container (from infrastructure-server)
// ============================================================
export { GoalContainer } from '@dailyuse/infrastructure-server';

// ============================================================
// Services (按用例划分)
// ============================================================
export {
  // Create
  CreateGoal,
  createGoal,
  type CreateGoalInput,
  type CreateGoalOutput,
  // Get
  GetGoal,
  getGoal,
  type GetGoalInput,
  type GetGoalOutput,
  // List
  ListGoals,
  listGoals,
  type ListGoalsInput,
  type ListGoalsOutput,
  // Update
  UpdateGoal,
  updateGoal,
  type UpdateGoalInput,
  type UpdateGoalOutput,
  // Delete
  DeleteGoal,
  deleteGoal,
  type DeleteGoalInput,
  type DeleteGoalOutput,
  type CheckDependenciesOutput,
  // Archive
  ArchiveGoal,
  archiveGoal,
  type ArchiveGoalInput,
  type ArchiveGoalOutput,
  // Activate
  ActivateGoal,
  activateGoal,
  type ActivateGoalInput,
  type ActivateGoalOutput,
  // Complete
  CompleteGoal,
  completeGoal,
  type CompleteGoalInput,
  type CompleteGoalOutput,
  // Search
  SearchGoals,
  searchGoals,
  type SearchGoalsInput,
  type SearchGoalsOutput,
  // Legacy (向后兼容)
  GoalApplicationService,
  createGoalApplicationService,
  type CreateGoalParams,
  type UpdateGoalParams,
} from './services';

// ============================================================
// Mappers
// ============================================================
export { GoalMapper, type GoalPersistenceDTO } from './mappers';

// ============================================================
// Event Handlers
// ============================================================
export { GOAL_EVENT_HANDLERS_PLACEHOLDER } from './event-handlers';

