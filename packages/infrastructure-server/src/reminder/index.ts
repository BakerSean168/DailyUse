/**
 * Reminder Module - Infrastructure Server
 *
 * Ports and Adapters for Reminder module persistence.
 */

// Ports (Interfaces)
export { type IReminderRepository } from './ports/reminder-repository.port';

// Prisma Adapters
export { ReminderPrismaRepository } from './adapters/prisma/reminder-prisma.repository';

// Memory Adapters
export { ReminderMemoryRepository } from './adapters/memory/reminder-memory.repository';
