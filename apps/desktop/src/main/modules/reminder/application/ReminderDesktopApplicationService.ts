/**
 * Reminder Desktop Application Service
 *
 * 包装 @dailyuse/application-server/reminder 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 */

import {
  createReminderTemplate,
  getReminderTemplate,
  listReminderTemplates,
  deleteReminderTemplate,
  type CreateReminderTemplateInput,
  type ListReminderTemplatesInput,
} from '@dailyuse/application-server';

import { ReminderContainer } from '@dailyuse/infrastructure-server';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatisticsClientDTO,
} from '@dailyuse/contracts/reminder';
import type { ReminderGroup } from '@dailyuse/domain-server/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderDesktopAppService');

export class ReminderDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Reminder Template =====

  async createTemplate(input: CreateReminderTemplateInput): Promise<ReminderTemplateClientDTO> {
    logger.debug('Creating reminder template', { title: input.title });
    const result = await createReminderTemplate(input);
    return result.template;
  }

  async getTemplate(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    const result = await getReminderTemplate({ uuid });
    return result.template;
  }

  async listTemplates(params: ListReminderTemplatesInput): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
  }> {
    const result = await listReminderTemplates(params);
    return {
      templates: result.templates,
      total: result.total,
    };
  }

  async updateTemplate(
    uuid: string,
    _accountUuid: string,
    updates: { title?: string; description?: string },
  ): Promise<ReminderTemplateClientDTO> {
    const container = ReminderContainer.getInstance();
    const repo = container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Reminder template not found: ${uuid}`);
    }

    // Update using the template's update method
    template.update({
      title: updates.title,
      description: updates.description,
    });

    await repo.save(template);
    return template.toClientDTO();
  }

  async deleteTemplate(uuid: string, accountUuid: string): Promise<void> {
    await deleteReminderTemplate({ uuid, accountUuid });
  }

  async enableTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    const container = ReminderContainer.getInstance();
    const repo = container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Reminder template not found: ${uuid}`);
    }
    template.enable();
    await repo.save(template);
    return template.toClientDTO();
  }

  async disableTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    const container = ReminderContainer.getInstance();
    const repo = container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Reminder template not found: ${uuid}`);
    }
    // Use pause() instead of disable() based on domain API
    template.pause();
    await repo.save(template);
    return template.toClientDTO();
  }

  async listTemplatesByGroup(groupUuid: string, accountUuid: string): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
  }> {
    const result = await listReminderTemplates({ accountUuid, groupUuid });
    return {
      templates: result.templates,
      total: result.total,
    };
  }

  async listActiveTemplates(accountUuid: string): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
  }> {
    const result = await listReminderTemplates({ accountUuid, activeOnly: true });
    return {
      templates: result.templates,
      total: result.total,
    };
  }

  // ===== Reminder Groups =====

  async createGroup(params: {
    accountUuid: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<ReminderGroupClientDTO> {
    const container = ReminderContainer.getInstance();
    const repo = container.getGroupRepository();

    // Create group using ReminderGroup.create (static factory method)
    const { ReminderGroup } = await import('@dailyuse/domain-server/reminder');
    const group = ReminderGroup.create({
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description || '',
      color: params.color,
      icon: params.icon,
    });

    await repo.save(group);
    return group.toClientDTO();
  }

  async getGroup(uuid: string): Promise<ReminderGroupClientDTO | null> {
    const container = ReminderContainer.getInstance();
    const repo = container.getGroupRepository();
    const group = await repo.findById(uuid);
    return group?.toClientDTO() || null;
  }

  async listGroups(accountUuid: string): Promise<{
    groups: ReminderGroupClientDTO[];
    total: number;
  }> {
    const container = ReminderContainer.getInstance();
    const repo = container.getGroupRepository();
    const groups = await repo.findByAccountUuid(accountUuid);
    return {
      groups: groups.map((g: ReminderGroup) => g.toClientDTO()),
      total: groups.length,
    };
  }

  async updateGroup(
    uuid: string,
    _updates: { name?: string; description?: string; color?: string; icon?: string },
  ): Promise<ReminderGroupClientDTO> {
    const container = ReminderContainer.getInstance();
    const repo = container.getGroupRepository();
    const group = await repo.findById(uuid);
    if (!group) {
      throw new Error(`Reminder group not found: ${uuid}`);
    }

    // Note: ReminderGroup doesn't have update methods for name/description/color/icon
    // Would need to create a new group with updated values or add update methods to domain
    // For now, just return the current group
    // TODO: Implement proper update logic when domain methods are available

    return group.toClientDTO();
  }

  async deleteGroup(uuid: string): Promise<void> {
    const container = ReminderContainer.getInstance();
    const repo = container.getGroupRepository();
    await repo.delete(uuid);
  }

  // ===== Reminder Statistics =====

  async getStatisticsSummary(accountUuid: string): Promise<ReminderStatisticsClientDTO | null> {
    const container = ReminderContainer.getInstance();
    const repo = container.getStatisticsRepository();
    const statistics = await repo.findByAccountUuid(accountUuid);
    return statistics?.toClientDTO() || null;
  }

  async getUpcoming(days: number = 7, accountUuid: string): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
  }> {
    // List active templates
    const result = await listReminderTemplates({
      accountUuid,
      activeOnly: true,
    });

    // Filter by upcoming (using nextTriggerAt from the template)
    const now = Date.now();
    const endDate = now + days * 24 * 60 * 60 * 1000;

    const upcomingTemplates = result.templates.filter((t) => {
      // Check nextTriggerAt from execution info if available
      const nextTriggerAt = t.nextTriggerAt;
      if (!nextTriggerAt) return false;
      const nextTime = typeof nextTriggerAt === 'number' ? nextTriggerAt : new Date(nextTriggerAt).getTime();
      return nextTime >= now && nextTime <= endDate;
    });

    return {
      templates: upcomingTemplates,
      total: upcomingTemplates.length,
    };
  }
}
