/**
 * Dashboard Module - Infrastructure Server
 *
 * Ports and Adapters for Dashboard module persistence.
 */

// Container
export { DashboardContainer, type IStatisticsCacheService } from './dashboard.container';

// Ports (Interfaces)
export { type IDashboardConfigRepository } from './ports/dashboard-config-repository.port';

// Prisma Adapters
export { DashboardConfigPrismaRepository } from './adapters/prisma/dashboard-config-prisma.repository';

// Memory Adapters
export { DashboardConfigMemoryRepository } from './adapters/memory/dashboard-config-memory.repository';
