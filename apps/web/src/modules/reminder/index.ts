/**
 * Reminder 模块统一导出
 * 按照 DDD 分层架构组织导出
 */

// ===== Application Layer =====
export * from './application/services';

// 便捷别名导出（保持向后兼容）
export {
  reminderTemplateApplicationService as getReminderTemplateService,
  reminderStatisticsApplicationService as getReminderStatisticsService,
} from './application/services';

// ===== Presentation Layer =====
export * from './presentation/stores/reminderStore';
export * from './presentation/composables/useReminder';

// ===== Infrastructure Layer =====
export { reminderApiClient } from './infrastructure/api/reminderApiClient';


// 导出初始化相关
export { registerReminderInitializationTasks } from './initialization';

// 导出类型
export type { ReminderStore } from './presentation/stores/reminderStore';

/**
 * 初始化 Reminder 模块
 * 应用启动时调用此方法来加载所有提醒数据
 */
export async function initializeReminderModule(): Promise<void> {
  try {
    console.log('正在初始化 Reminder 模块...');
    // Reminder 模块已拆分，不再需要统一的初始化方法
    // 各个服务独立初始化
    console.log('Reminder 模块初始化完成');
  } catch (error) {
    console.error('Reminder 模块初始化失败:', error);
    throw error;
  }
}
