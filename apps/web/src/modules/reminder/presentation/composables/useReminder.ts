import { computed } from 'vue';
import { useReminderStore } from '../stores/reminderStore';
import {
  reminderTemplateApplicationService,
  reminderStatisticsApplicationService,
} from '../../application/services';
import type { ReminderContracts } from '@dailyuse/contracts';

export function useReminder() {
  const reminderStore = useReminderStore();

  const isLoading = computed(() => reminderStore.isLoading);
  const error = computed(() => reminderStore.error);
  const reminderTemplates = computed(() => reminderStore.reminderTemplates);
  const statistics = computed(() => reminderStore.statistics);

  /**
   * 初始化 Reminder 模块
   */
  async function initialize() {
    reminderStore.initialize();
    await refreshAll();
  }

  /**
   * 刷新所有数据
   */
  async function refreshAll() {
    // 只刷新模板列表，统计数据需要 accountUuid（暂时不刷新）
    await getReminderTemplates({ forceRefresh: true });
  }

  async function createReminderTemplate(request: ReminderContracts.CreateReminderTemplateRequestDTO) {
    return await reminderTemplateApplicationService.createReminderTemplate(request);
  }

  async function getReminderTemplates(options?: { forceRefresh?: boolean }) {
    return await reminderTemplateApplicationService.getReminderTemplates(options);
  }

  /**
   * 删除提醒模板
   */
  async function deleteTemplate(uuid: string) {
    return await reminderTemplateApplicationService.deleteReminderTemplate(uuid);
  }

  /**
   * 更新提醒模板
   */
  async function updateTemplate(
    uuid: string,
    request: ReminderContracts.UpdateReminderTemplateRequestDTO,
  ) {
    return await reminderTemplateApplicationService.updateReminderTemplate(uuid, request);
  }

  /**
   * 切换模板启用状态
   */
  async function toggleTemplateStatus(uuid: string, enabled: boolean) {
    return await reminderTemplateApplicationService.toggleTemplateEnabled(uuid, enabled);
  }

  /**
   * 获取即将到来的提醒（基于调度计算）
   */
  async function getUpcomingReminders(options?: {
    limit?: number;
    days?: number;
    importanceLevel?: string;
    type?: string;
  }) {
    const { reminderApiClient } = await import('../../infrastructure/api/reminderApiClient');
    return await reminderApiClient.getUpcomingReminders(options);
  }

  return {
    isLoading,
    error,
    reminderTemplates,
    statistics,
    initialize,
    refreshAll,
    createReminderTemplate,
    getReminderTemplates,
    deleteTemplate,
    updateTemplate,
    toggleTemplateStatus,
    getUpcomingReminders,
  };
}
