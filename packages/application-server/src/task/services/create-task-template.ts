/**
 * Create Task Template Service
 *
 * 创建任务模板（循环任务）
 * 创建后自动生成初始实例（100天/最多100个）
 */

import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
} from '@dailyuse/domain-server/task';
import {
  TaskTemplate,
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskInstanceGenerationService,
} from '@dailyuse/domain-server/task';
import type {
  TaskTimeConfigServerDTO,
  RecurrenceRuleServerDTO,
  TaskReminderConfigServerDTO,
  TaskTemplateServerDTO,
} from '@dailyuse/contracts/task';
import { TaskType, TaskTemplateStatus } from '@dailyuse/contracts/task';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Service Input
 */
export interface CreateTaskTemplateInput {
  accountUuid: string;
  title: string;
  description?: string;
  taskType: TaskType;
  timeConfig: TaskTimeConfigServerDTO;
  recurrenceRule?: RecurrenceRuleServerDTO;
  reminderConfig?: TaskReminderConfigServerDTO;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  folderUuid?: string;
  tags?: string[];
  color?: string;
}

/**
 * Service Output
 */
export interface CreateTaskTemplateOutput {
  template: TaskTemplateServerDTO;
  instanceCount: number;
}

/**
 * Create Task Template Service
 */
export class CreateTaskTemplate {
  private static instance: CreateTaskTemplate;
  private readonly generationService: TaskInstanceGenerationService;

  private constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    templateRepository?: ITaskTemplateRepository,
    instanceRepository?: ITaskInstanceRepository,
  ): CreateTaskTemplate {
    const container = TaskContainer.getInstance();
    const templateRepo = templateRepository || container.getTemplateRepository();
    const instanceRepo = instanceRepository || container.getInstanceRepository();
    CreateTaskTemplate.instance = new CreateTaskTemplate(templateRepo, instanceRepo);
    return CreateTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateTaskTemplate {
    if (!CreateTaskTemplate.instance) {
      CreateTaskTemplate.instance = CreateTaskTemplate.createInstance();
    }
    return CreateTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateTaskTemplate.instance = undefined as unknown as CreateTaskTemplate;
  }

  async execute(input: CreateTaskTemplateInput): Promise<CreateTaskTemplateOutput> {
    // 转换值对象
    const timeConfig = TaskTimeConfig.fromServerDTO(input.timeConfig);
    const recurrenceRule = input.recurrenceRule
      ? RecurrenceRule.fromServerDTO(input.recurrenceRule)
      : undefined;
    const reminderConfig = input.reminderConfig
      ? TaskReminderConfig.fromServerDTO(input.reminderConfig)
      : undefined;

    // 使用领域模型的工厂方法创建
    const template = TaskTemplate.create({
      accountUuid: input.accountUuid,
      title: input.title,
      description: input.description,
      taskType: input.taskType,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: input.importance,
      urgency: input.urgency,
      folderUuid: input.folderUuid,
      tags: input.tags,
      color: input.color,
    });

    // 保存到仓储
    await this.templateRepository.save(template);

    let instanceCount = 0;

    // 如果状态是 ACTIVE，立即生成初始实例
    if (template.status === TaskTemplateStatus.ACTIVE) {
      instanceCount = await this.generateInitialInstances(template);
    }

    return {
      template: template.toClientDTO(),
      instanceCount,
    };
  }

  /**
   * 生成初始实例
   */
  private async generateInitialInstances(template: TaskTemplate): Promise<number> {
    try {
      const instances = this.generationService.generateInstances(template);

      if (instances.length > 0) {
        await this.instanceRepository.saveMany(instances);
        await this.templateRepository.save(template);

        // 发布事件
        eventBus.emit('task.instances.generated', {
          eventType: 'task_template.instances_generated',
          version: '1.0',
          aggregateId: template.uuid,
          occurredOn: new Date(),
          accountUuid: template.accountUuid,
          payload: {
            templateUuid: template.uuid,
            templateTitle: template.title,
            instanceCount: instances.length,
            strategy: instances.length <= 20 ? 'full' : 'summary',
          },
        });
      }

      return instances.length;
    } catch (error) {
      console.error(`❌ [CreateTaskTemplate] 生成初始实例失败:`, error);
      return 0;
    }
  }
}

/**
 * 便捷函数：创建任务模板
 */
export const createTaskTemplate = (input: CreateTaskTemplateInput): Promise<CreateTaskTemplateOutput> =>
  CreateTaskTemplate.getInstance().execute(input);
