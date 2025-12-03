/**
 * @dailyuse/infrastructure-server
 *
 * Server Infrastructure Layer - Ports & Adapters
 *
 * This package implements the Hexagonal Architecture (Ports & Adapters) pattern
 * for server-side applications. It provides:
 *
 * - Ports: Repository and service interface definitions
 * - Adapters: Concrete implementations for different environments
 *   - Prisma: PostgreSQL/SQLite via Prisma ORM
 *   - Memory: In-memory implementations for testing
 */

// Ports (interfaces)
export * from './ports';

// Adapters
export * as prismaAdapters from './adapters/prisma';
export * as memoryAdapters from './adapters/memory';
