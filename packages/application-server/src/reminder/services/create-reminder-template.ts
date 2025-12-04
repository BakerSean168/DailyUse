/**
 * Create Reminder Template Service
 *
 * 创建提醒模板
 */

import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server/reminder';
import { ReminderDomainService } from '@dailyuse/domain-server/reminder';
import type {
  ReminderTemplateClientDTO,
  ReminderType,
  TriggerConfigServerDTO,
  ActiveTimeConfigServerDTO,
  NotificationConfigServerDTO,
  RecurrenceConfigServerDTO,
  ActiveHoursConfigServerDTO,
} from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '../ReminderContainer';

/**
 * Service Input
 */
export interface CreateReminderTemplateInput {
  accountUuid: string;
  title: string;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  activeTime: ActiveTimeConfigServerDTO;
  notificationConfig: NotificationConfigServerDTO;
  description?: string;
  recurrence?: RecurrenceConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO;
  importanceLevel?: ImportanceLevel;
  tags?: string[];
  color?: string;
  icon?: string;
  groupUuid?: string;
}

/**
 * Service Output
 */
export interface CreateReminderTemplateOutput {
  template: ReminderTemplateClientDTO;
}

/**
 * Create Reminder Template Service
 */
export class CreateReminderTemplate {
  private static instance: CreateReminderTemplate;
  private readonly domainService: ReminderDomainService;

  private constructor(
    templateRepository: IReminderTemplateRepository,
    groupRepository: IReminderGroupRepository,
    statisticsRepository: IReminderStatisticsRepository,
  ) {
    this.domainService = new ReminderDomainService(
      templateRepository,
      groupRepository,
      statisticsRepository,
    );
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    templateRepository?: IReminderTemplateRepository,
    groupRepository?: IReminderGroupRepository,
    statisticsRepository?: IReminderStatisticsRepository,
  ): CreateReminderTemplate {
    const container = ReminderContainer.getInstance();
    const templateRepo = templateRepository || container.getReminderTemplateRepository();
    const groupRepo = groupRepository || container.getGroupRepository();
    const statsRepo = statisticsRepository || container.getStatisticsRepository();
    CreateReminderTemplate.instance = new CreateReminderTemplate(templateRepo, groupRepo, statsRepo);
    return CreateReminderTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateReminderTemplate {
    if (!CreateReminderTemplate.instance) {
      CreateReminderTemplate.instance = CreateReminderTemplate.createInstance();
    }
    return CreateReminderTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateReminderTemplate.instance = undefined as unknown as CreateReminderTemplate;
  }

  async execute(input: CreateReminderTemplateInput): Promise<CreateReminderTemplateOutput> {
    const template = await this.domainService.createReminderTemplate(input);

    // 发布领域事件
    const events = template.getDomainEvents();
    for (const event of events) {
      const payload = event.payload as Record<string, unknown>;
      await eventBus.publish({
        ...event,
        payload: {
          ...payload,
          reminderData: template.toServerDTO(),
        },
      });
    }

    return {
      template: template.toClientDTO(),
    };
  }
}

/**
 * 便捷函数：创建提醒模板
 */
export const createReminderTemplate = (input: CreateReminderTemplateInput): Promise<CreateReminderTemplateOutput> =>
  CreateReminderTemplate.getInstance().execute(input);
