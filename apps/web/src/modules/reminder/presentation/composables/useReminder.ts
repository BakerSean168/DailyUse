import { computed } from 'vue';
import { useReminderStore } from '../stores/reminderStore';
import {
  reminderTemplateApplicationService,
  reminderStatisticsApplicationService,
  reminderSyncApplicationService,
} from '../../application/services';
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO, CreateReminderTemplateRequest, UpdateReminderTemplateRequest } from '@dailyuse/contracts/reminder';

export function useReminder() {
  const reminderStore = useReminderStore();

  const isLoading = computed(() => reminderStore.isLoading);
  const error = computed(() => reminderStore.error);
  const reminderTemplates = computed(() => reminderStore.reminderTemplates);
  const reminderGroups = computed(() => reminderStore.reminderGroups);
  const statistics = computed(() => reminderStore.statistics);

  /**
   * 按 UUID 获取提醒模板
   * 返回响应式计算属性，确保组件始终获取最新数据
   */
  function getReminderTemplateByUuid(uuid: string) {
    return computed(() => reminderStore.getReminderTemplateByUuid(uuid));
  }

  /**
   * 按 UUID 获取提醒分组
   * 返回响应式计算属性，确保组件始终获取最新数据
   */
  function getReminderGroupByUuid(uuid: string) {
    return computed(() => reminderStore.getReminderGroupByUuid(uuid));
  }

  /**
   * 初始化 Reminder 模块
   */
  async function initialize() {
    reminderStore.initialize();
    // 使用同步服务初始化数据
    reminderSyncApplicationService.initializeEventListeners();
    await reminderSyncApplicationService.syncAllTemplatesAndGroups();
  }

  /**
   * 刷新所有数据
   */
  async function refreshAll() {
    // 使用同步服务刷新所有数据
    await reminderSyncApplicationService.refreshAll();
  }

  async function createReminderTemplate(request: CreateReminderTemplateRequest) {
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
    request: UpdateReminderTemplateRequest,
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
    return await reminderTemplateApplicationService.getUpcomingReminders(options);
  }

  return {
    isLoading,
    error,
    reminderTemplates,
    reminderGroups,
    statistics,
    getReminderTemplateByUuid,
    getReminderGroupByUuid,
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

