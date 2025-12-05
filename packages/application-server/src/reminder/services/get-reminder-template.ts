/**
 * Get Reminder Template Service
 *
 * 获取提醒模板详情
 */

import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ReminderContainer } from '@dailyuse/infrastructure-server';

/**
 * Service Input
 */
export interface GetReminderTemplateInput {
  uuid: string;
}

/**
 * Service Output
 */
export interface GetReminderTemplateOutput {
  template: ReminderTemplateClientDTO | null;
}

/**
 * Get Reminder Template Service
 */
export class GetReminderTemplate {
  private static instance: GetReminderTemplate;

  private constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(templateRepository?: IReminderTemplateRepository): GetReminderTemplate {
    const container = ReminderContainer.getInstance();
    const repo = templateRepository || container.getTemplateRepository();
    GetReminderTemplate.instance = new GetReminderTemplate(repo);
    return GetReminderTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetReminderTemplate {
    if (!GetReminderTemplate.instance) {
      GetReminderTemplate.instance = GetReminderTemplate.createInstance();
    }
    return GetReminderTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetReminderTemplate.instance = undefined as unknown as GetReminderTemplate;
  }

  async execute(input: GetReminderTemplateInput): Promise<GetReminderTemplateOutput> {
    const template = await this.templateRepository.findById(input.uuid);

    return {
      template: template ? template.toClientDTO() : null,
    };
  }
}

/**
 * 便捷函数：获取提醒模板
 */
export const getReminderTemplate = (input: GetReminderTemplateInput): Promise<GetReminderTemplateOutput> =>
  GetReminderTemplate.getInstance().execute(input);
