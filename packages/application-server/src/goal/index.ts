/**
 * Goal Application Module (Server)
 *
 * Provides application services for goal management on the server side.
 * These orchestrate domain objects and repositories.
 */

// Application Services
export {
  GoalApplicationService,
  createGoalApplicationService,
  type CreateGoalParams,
  type UpdateGoalParams,
} from './use-cases';

// Event Handlers
export { GOAL_EVENT_HANDLERS_PLACEHOLDER } from './event-handlers';
