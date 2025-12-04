/**
 * Goal Module - Infrastructure Server
 *
 * Ports and Adapters for Goal module persistence.
 */

// Ports (Interfaces)
export { type IGoalRepository } from './ports/goal-repository.port';

// Prisma Adapters
export { GoalPrismaRepository } from './adapters/prisma/goal-prisma.repository';

// Memory Adapters
export { GoalMemoryRepository } from './adapters/memory/goal-memory.repository';
