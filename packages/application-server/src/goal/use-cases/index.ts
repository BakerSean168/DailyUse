/**
 * Goal Use Cases (Server)
 *
 * Server-side use cases for goal operations.
 * Each use case represents a single business operation.
 *
 * Pattern:
 * - Each use case is a class with a single `execute` method
 * - Dependencies are injected via constructor
 * - Returns DTOs, not domain objects
 */

export { GoalApplicationService, createGoalApplicationService } from './GoalApplicationService';
