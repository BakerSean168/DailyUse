/**
 * List Task Templates Service
 *
 * 获取任务模板列表（按账户）
 * 获取时自动检查并补充实例
 */

import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
  TaskTemplate,
} from '@dailyuse/domain-server/task';
import { TaskInstanceGenerationService } from '@dailyuse/domain-server/task';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Service Input
 */
export interface ListTaskTemplatesInput {
  accountUuid: string;
  status?: TaskTemplateStatus;
  folderUuid?: string;
  goalUuid?: string;
  tags?: string[];
  activeOnly?: boolean;
}

/**
 * Service Output
 */
export interface ListTaskTemplatesOutput {
  templates: TaskTemplateClientDTO[];
  total: number;
}

/**
 * List Task Templates Service
 */
export class ListTaskTemplates {
  private static instance: ListTaskTemplates;
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
  ): ListTaskTemplates {
    const container = TaskContainer.getInstance();
    const templateRepo = templateRepository || container.getTemplateRepository();
    const instanceRepo = instanceRepository || container.getInstanceRepository();
    ListTaskTemplates.instance = new ListTaskTemplates(templateRepo, instanceRepo);
    return ListTaskTemplates.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListTaskTemplates {
    if (!ListTaskTemplates.instance) {
      ListTaskTemplates.instance = ListTaskTemplates.createInstance();
    }
    return ListTaskTemplates.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListTaskTemplates.instance = undefined as unknown as ListTaskTemplates;
  }

  async execute(input: ListTaskTemplatesInput): Promise<ListTaskTemplatesOutput> {
    let templates: TaskTemplate[];

    // 根据不同条件查询
    if (input.status) {
      templates = await this.templateRepository.findByStatus(input.accountUuid, input.status);
    } else if (input.folderUuid) {
      templates = await this.templateRepository.findByFolder(input.folderUuid);
    } else if (input.goalUuid) {
      templates = await this.templateRepository.findByGoal(input.goalUuid);
    } else if (input.tags && input.tags.length > 0) {
      templates = await this.templateRepository.findByTags(input.accountUuid, input.tags);
    } else if (input.activeOnly) {
      templates = await this.templateRepository.findActiveTemplates(input.accountUuid);
    } else {
      templates = await this.templateRepository.findByAccount(input.accountUuid);
    }

    // 自动检查并补充每个 ACTIVE 模板的实例（异步执行，不阻塞）
    for (const template of templates) {
      if (template.status === TaskTemplateStatus.ACTIVE) {
        this.checkAndRefillInstances(template).catch((error) => {
          console.error(`❌ 补充模板 "${template.title}" 实例失败:`, error);
        });
      }
    }

    return {
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    };
  }

  /**
   * 检查并补充模板实例
   */
  private async checkAndRefillInstances(template: TaskTemplate): Promise<void> {
    try {
      if (this.generationService.shouldRefillInstances(template)) {
        const instances = this.generationService.generateInstances(template);

        if (instances.length > 0) {
          await this.instanceRepository.saveMany(instances);
          await this.templateRepository.save(template);

          eventBus.emit('task.instances.generated', {
            eventType: 'task_template.instances_generated',
            aggregateId: template.uuid,
            accountUuid: template.accountUuid,
            payload: {
              templateUuid: template.uuid,
              templateTitle: template.title,
              instanceCount: instances.length,
            },
          });
        }
      }
    } catch (error) {
      console.error(`❌ [ListTaskTemplates] 补充实例失败:`, error);
    }
  }
}

/**
 * 便捷函数：列出任务模板
 */
export const listTaskTemplates = (input: ListTaskTemplatesInput): Promise<ListTaskTemplatesOutput> =>
  ListTaskTemplates.getInstance().execute(input);
