/**
 * Account Module - Infrastructure Server
 *
 * Ports and Adapters for Account module persistence.
 */

// Container
export { AccountContainer } from './account.container';

// Ports (Interfaces)
export { type IAccountRepository } from './ports/account-repository.port';

// Prisma Adapters
export { AccountPrismaRepository } from './adapters/prisma/account-prisma.repository';

// Memory Adapters
export { AccountMemoryRepository } from './adapters/memory/account-memory.repository';
