/**
 * Reminder Application Services - Barrel Export
 * 提醒应用服务层 - 统一导出
 *
 * 按照 DDD 应用服务层最佳实践：
 * - 每个服务专注于一个业务能力/用例
 * - 不是按聚合根划分（避免出现 God Service）
 * - 清晰的职责分离
 *
 * 服务列表：
 * - ReminderTemplateApplicationService: 模板 CRUD 和状态管理
 * - ReminderStatisticsApplicationService: 统计数据查询
 */

export * from './ReminderTemplateApplicationService';
export * from './ReminderStatisticsApplicationService';

// 便捷导入：导出所有单例实例
export { reminderTemplateApplicationService } from './ReminderTemplateApplicationService';
export { reminderStatisticsApplicationService } from './ReminderStatisticsApplicationService';
