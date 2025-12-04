/**
 * List Reminder Templates Service
 *
 * 获取提醒模板列表
 */

import type { IReminderTemplateRepository, ReminderTemplate } from '@dailyuse/domain-server/reminder';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ReminderContainer } from '../ReminderContainer';

/**
 * Service Input
 */
export interface ListReminderTemplatesInput {
  accountUuid: string;
  groupUuid?: string;
  activeOnly?: boolean;
  includeHistory?: boolean;
}

/**
 * Service Output
 */
export interface ListReminderTemplatesOutput {
  templates: ReminderTemplateClientDTO[];
  total: number;
}

/**
 * List Reminder Templates Service
 */
export class ListReminderTemplates {
  private static instance: ListReminderTemplates;

  private constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(templateRepository?: IReminderTemplateRepository): ListReminderTemplates {
    const container = ReminderContainer.getInstance();
    const repo = templateRepository || container.getReminderTemplateRepository();
    ListReminderTemplates.instance = new ListReminderTemplates(repo);
    return ListReminderTemplates.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListReminderTemplates {
    if (!ListReminderTemplates.instance) {
      ListReminderTemplates.instance = ListReminderTemplates.createInstance();
    }
    return ListReminderTemplates.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListReminderTemplates.instance = undefined as unknown as ListReminderTemplates;
  }

  async execute(input: ListReminderTemplatesInput): Promise<ListReminderTemplatesOutput> {
    let templates: ReminderTemplate[];

    if (input.groupUuid) {
      templates = await this.templateRepository.findByGroupUuid(input.groupUuid, {
        includeHistory: input.includeHistory,
      });
    } else if (input.activeOnly) {
      templates = await this.templateRepository.findActive(input.accountUuid);
    } else {
      templates = await this.templateRepository.findByAccountUuid(input.accountUuid, {
        includeHistory: input.includeHistory,
      });
    }

    return {
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    };
  }
}

/**
 * 便捷函数：列出提醒模板
 */
export const listReminderTemplates = (input: ListReminderTemplatesInput): Promise<ListReminderTemplatesOutput> =>
  ListReminderTemplates.getInstance().execute(input);
