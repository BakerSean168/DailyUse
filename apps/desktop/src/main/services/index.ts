/**
 * Main Process Services Module
 *
 * Exports application-level services that manage cross-cutting concerns
 * such as notifications and data synchronization.
 *
 * @module services
 */

export { NotificationService, initNotificationService } from './notification.service';
export type { NotificationOptions } from './notification.service';

export { initSyncManager, getSyncManager } from './sync.service';
