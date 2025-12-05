/**
 * @dailyuse/application-client
 *
 * Client Application Layer - Use Cases and Application Services
 * 
 * This package contains application-level logic for client applications
 * (Web frontend, Desktop renderer process). It orchestrates domain objects
 * and provides a clean API for presentation layer.
 *
 * Architecture:
 * - Use Cases: Single-purpose operations (CQRS pattern)
 * - Composables: Vue reactive wrappers for use cases
 * - Event Handlers: Client-side event processing
 * - Mappers: DTO to Domain object mapping
 */

// Goal module
export * from './goal';

// Task module
export * from './task';

// Schedule module
export * from './schedule';

// Reminder module
export * from './reminder';

// Account module
export * from './account';

// Authentication module
export * from './authentication/services';

// Notification module
export * from './notification';

// AI module
export * from './ai';

// Dashboard module
export * from './dashboard';

// Repository module
export * from './repository';

// Setting module
export * from './setting';
