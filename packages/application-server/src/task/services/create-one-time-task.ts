/**
 * Create One-Time Task Service
 *
 * 创建一次性任务
 */

import type { ITaskTemplateRepository } from '@dailyuse/domain-server/task';
import { TaskTemplate } from '@dailyuse/domain-server/task';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Service Input
 */
export interface CreateOneTimeTaskInput {
  accountUuid: string;
  title: string;
  description?: string;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  startDate?: number;
  dueDate?: number;
  estimatedMinutes?: number;
  note?: string;
  goalUuid?: string;
  keyResultUuid?: string;
  parentTaskUuid?: string;
  folderUuid?: string;
  tags?: string[];
  color?: string;
}

/**
 * Service Output
 */
export interface CreateOneTimeTaskOutput {
  task: TaskTemplateClientDTO;
}

/**
 * Create One-Time Task Service
 */
export class CreateOneTimeTask {
  private static instance: CreateOneTimeTask;

  private constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(templateRepository?: ITaskTemplateRepository): CreateOneTimeTask {
    const container = TaskContainer.getInstance();
    const repo = templateRepository || container.getTemplateRepository();
    CreateOneTimeTask.instance = new CreateOneTimeTask(repo);
    return CreateOneTimeTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateOneTimeTask {
    if (!CreateOneTimeTask.instance) {
      CreateOneTimeTask.instance = CreateOneTimeTask.createInstance();
    }
    return CreateOneTimeTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateOneTimeTask.instance = undefined as unknown as CreateOneTimeTask;
  }

  async execute(input: CreateOneTimeTaskInput): Promise<CreateOneTimeTaskOutput> {
    // 使用领域模型的工厂方法创建一次性任务
    const task = TaskTemplate.createOneTimeTask({
      accountUuid: input.accountUuid,
      title: input.title,
      description: input.description,
      importance: input.importance,
      urgency: input.urgency,
      startDate: input.startDate,
      dueDate: input.dueDate,
      estimatedMinutes: input.estimatedMinutes,
      note: input.note,
      goalUuid: input.goalUuid,
      keyResultUuid: input.keyResultUuid,
      parentTaskUuid: input.parentTaskUuid,
      folderUuid: input.folderUuid,
      tags: input.tags,
      color: input.color,
    });

    // 保存到仓储
    await this.templateRepository.save(task);

    return {
      task: task.toClientDTO(),
    };
  }
}

/**
 * 便捷函数：创建一次性任务
 */
export const createOneTimeTask = (input: CreateOneTimeTaskInput): Promise<CreateOneTimeTaskOutput> =>
  CreateOneTimeTask.getInstance().execute(input);
