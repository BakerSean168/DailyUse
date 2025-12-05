/**
 * Authentication Module - Infrastructure Server
 *
 * Ports and Adapters for Authentication module persistence.
 */

// Container
export { AuthContainer } from './auth.container';

// Ports (Interfaces)
export { type IAuthCredentialRepository, type PrismaTransactionClient } from './ports/auth-credential-repository.port';
export { type IAuthSessionRepository } from './ports/auth-session-repository.port';

// Prisma Adapters
export { AuthCredentialPrismaRepository } from './adapters/prisma/auth-credential-prisma.repository';
export { AuthSessionPrismaRepository } from './adapters/prisma/auth-session-prisma.repository';

// Memory Adapters
export { AuthCredentialMemoryRepository } from './adapters/memory/auth-credential-memory.repository';
export { AuthSessionMemoryRepository } from './adapters/memory/auth-session-memory.repository';
