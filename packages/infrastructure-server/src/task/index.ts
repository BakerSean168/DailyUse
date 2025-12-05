/**
 * Task Module - Infrastructure Server
 *
 * Ports and Adapters for Task module persistence.
 */

// Container
export { TaskContainer } from './task.container';

// Ports (Interfaces)
export { type ITaskRepository } from './ports/task-repository.port';

// Prisma Adapters
export { TaskPrismaRepository } from './adapters/prisma/task-prisma.repository';

// Memory Adapters
export { TaskMemoryRepository } from './adapters/memory/task-memory.repository';
