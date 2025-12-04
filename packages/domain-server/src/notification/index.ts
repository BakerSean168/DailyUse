/**
 * Notification Domain Server - 导出
 */

// Aggregates
export * from './aggregates/Notification';
export { NotificationPreference } from './aggregates/NotificationPreference';
export { NotificationTemplate } from './aggregates/NotificationTemplate';

// Entities
export { NotificationChannel } from './entities/NotificationChannel';
export { NotificationHistory } from './entities/NotificationHistory';

// Repositories
export * from './repositories/NotificationRepository.interface';
export type { INotificationRepository } from './repositories/INotificationRepository';
export type { INotificationTemplateRepository } from './repositories/INotificationTemplateRepository';
export type { INotificationPreferenceRepository } from './repositories/INotificationPreferenceRepository';

// Services
export * from './services';
