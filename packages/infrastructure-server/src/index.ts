/**
 * @dailyuse/infrastructure-server
 *
 * Server Infrastructure Layer - Ports & Adapters (Module-based)
 *
 * This package implements the Hexagonal Architecture (Ports & Adapters) pattern
 * for server-side applications, organized by business module:
 *
 * - Goal: Goal persistence
 * - Task: Task persistence
 * - Schedule: Schedule persistence
 * - Reminder: Reminder persistence
 * - Account: Account persistence
 *
 * Each module provides:
 * - Ports: Repository interface definitions
 * - Adapters: Prisma (PostgreSQL/SQLite) and Memory (testing) implementations
 */

// Modules
export * from './goal';
export * from './task';
export * from './schedule';
export * from './reminder';
export * from './account';

// Shared
export * from './shared';
