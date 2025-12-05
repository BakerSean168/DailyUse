/**
 * Repository Module - Infrastructure Server
 *
 * Ports and Adapters for Repository module persistence.
 */

// Container
export { RepositoryContainer } from './repository.container';

// Ports (Interfaces)
export { type IFolderRepository } from './ports/folder-repository.port';
export { type IRepositoryRepository } from './ports/repository-repository.port';
export { type IRepositoryStatisticsRepository } from './ports/repository-statistics-repository.port';
export { type IResourceRepository } from './ports/resource-repository.port';

// Prisma Adapters
export { FolderPrismaRepository } from './adapters/prisma/folder-prisma.repository';
export { RepositoryPrismaRepository } from './adapters/prisma/repository-prisma.repository';
export { RepositoryStatisticsPrismaRepository } from './adapters/prisma/repository-statistics-prisma.repository';
export { ResourcePrismaRepository } from './adapters/prisma/resource-prisma.repository';

// Memory Adapters
export { FolderMemoryRepository } from './adapters/memory/folder-memory.repository';
export { RepositoryMemoryRepository } from './adapters/memory/repository-memory.repository';
export { RepositoryStatisticsMemoryRepository } from './adapters/memory/repository-statistics-memory.repository';
export { ResourceMemoryRepository } from './adapters/memory/resource-memory.repository';
