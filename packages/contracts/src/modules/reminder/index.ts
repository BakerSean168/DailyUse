/**
 * Reminder Module - Contracts
 * 提醒模块契约定义
 *
 * 统一导出所有 Reminder 模块的契约定义
 */

// ============ 枚举 ============
export * from './enums';

// ============ 值对象 ============
export * from './value-objects';

// ============ 实体 ============
export * from './entities/ReminderHistoryServer';
export * from './entities/ReminderHistoryClient';
export * from './entities/ReminderResponseServer';

// ============ 聚合根 ============
export * from './aggregates/ReminderTemplateServer';
export * from './aggregates/ReminderTemplateClient';
export * from './aggregates/ReminderGroupServer';
export * from './aggregates/ReminderGroupClient';
export * from './aggregates/ReminderStatisticsServer';
export * from './aggregates/ReminderStatisticsClient';
export * from './aggregates/UserReminderPreferencesServer';

// ============ API 请求/响应类型 ============
export * from './api-requests';

// 注意：领域事件已在聚合根文件中定义并导出
