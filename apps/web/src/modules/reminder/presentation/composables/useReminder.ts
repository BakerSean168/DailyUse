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

  async function createReminderTemplate(request: ReminderContracts.CreateReminderTemplateRequestDTO) {
    return await reminderTemplateApplicationService.createReminderTemplate(request);
  }

  async function getReminderTemplates(options?: { forceRefresh?: boolean }) {
    return await reminderTemplateApplicationService.getReminderTemplates(options);
  }

  return {
    isLoading,
    error,
    reminderTemplates,
    statistics,
    createReminderTemplate,
    getReminderTemplates,
  };
}
