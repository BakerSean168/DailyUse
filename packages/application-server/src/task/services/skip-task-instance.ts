/**
 * Skip Task Instance Service
 *
 * 跳过任务实例
 */

import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Service Input
 */
export interface SkipTaskInstanceInput {
  uuid: string;
  reason?: string;
}

/**
 * Service Output
 */
export interface SkipTaskInstanceOutput {
  instance: TaskInstanceClientDTO;
}

/**
 * Skip Task Instance Service
 */
export class SkipTaskInstance {
  private static instance: SkipTaskInstance;

  private constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(instanceRepository?: ITaskInstanceRepository): SkipTaskInstance {
    const container = TaskContainer.getInstance();
    const repo = instanceRepository || container.getInstanceRepository();
    SkipTaskInstance.instance = new SkipTaskInstance(repo);
    return SkipTaskInstance.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SkipTaskInstance {
    if (!SkipTaskInstance.instance) {
      SkipTaskInstance.instance = SkipTaskInstance.createInstance();
    }
    return SkipTaskInstance.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SkipTaskInstance.instance = undefined as unknown as SkipTaskInstance;
  }

  async execute(input: SkipTaskInstanceInput): Promise<SkipTaskInstanceOutput> {
    const instance = await this.instanceRepository.findByUuid(input.uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${input.uuid} not found`);
    }

    if (!instance.canSkip()) {
      throw new Error('Cannot skip this task instance');
    }

    instance.skip(input.reason);
    await this.instanceRepository.save(instance);

    return {
      instance: instance.toClientDTO(),
    };
  }
}

/**
 * 便捷函数：跳过任务实例
 */
export const skipTaskInstance = (input: SkipTaskInstanceInput): Promise<SkipTaskInstanceOutput> =>
  SkipTaskInstance.getInstance().execute(input);
