/**
 * TaskInstanceGenerationService - 任务实例生成服务
 *
 * 领域服务职责：
 * - 根据任务模板生成任务实例
 * - 处理重复规则
 * - 管理实例生成的业务逻辑
 * - 自动维护每个模板未来 100 天内的所有实例
 */

import { TaskTemplate, TaskInstance } from '../aggregates';
import type { ITaskTemplateRepository, ITaskInstanceRepository } from '../repositories';
import { TaskContracts } from '@dailyuse/contracts';

const {
  TARGET_GENERATE_AHEAD_DAYS,
  REFILL_THRESHOLD_DAYS,
} = TaskContracts.TASK_INSTANCE_GENERATION_CONFIG;

export class TaskInstanceGenerationService {
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  /**
   * 为所有活跃模板生成实例（到指定日期）
   */
  async generateInstancesForActiveTemplates(accountUuid: string): Promise<void> {
    // 获取所有活跃的模板
    const templates = await this.templateRepository.findActiveTemplates(accountUuid);

    // 为每个模板生成实例
    for (const template of templates) {
      await this.generateInstancesForTemplate(template);
    }
  }

  /**
   * 为指定模板生成实例
   * 新策略：自动维护未来 100 天内的所有实例
   * 
   * @param template 任务模板
   * @param forceGenerate 是否强制重新生成（删除现有并重新生成）
   */
  async generateInstancesForTemplate(
    template: TaskTemplate,
    forceGenerate: boolean = false,
  ): Promise<TaskInstance[]> {
    const now = Date.now();
    
    // 1. 如果是强制生成，删除所有未完成的实例
    if (forceGenerate) {
      const existingInstances = await this.instanceRepository.findByTemplate(template.uuid);
      const pendingUuids = existingInstances
        .filter(inst => inst.status === 'PENDING')
        .map(inst => inst.uuid);
      if (pendingUuids.length > 0) {
        await this.instanceRepository.deleteMany(pendingUuids);
        console.log(
          `🗑️ [TaskInstanceGenerationService] 已删除模板 "${template.title}" 的 ${pendingUuids.length} 个未完成实例`,
        );
      }
    }

    // 2. 计算起始日期：从上次生成日期的下一天，或从今天开始
    const fromDate = template.lastGeneratedDate
      ? template.lastGeneratedDate + 86400000
      : now;

    // 3. 计算目标结束日期：未来 100 天
    const toDate = now + TARGET_GENERATE_AHEAD_DAYS * 86400000;

    // 4. 如果起始日期已经超过目标日期，说明已经生成够了
    if (fromDate > toDate) {
      console.log(
        `[TaskInstanceGenerationService] 模板 "${template.title}" 已生成到 ${new Date(fromDate).toLocaleDateString()}，无需补充`,
      );
      return [];
    }

    // 5. 生成实例
    const instances = template.generateInstances(fromDate, toDate);

    // 6. 保存实例
    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
      
      console.log(
        `✅ [TaskInstanceGenerationService] 为模板 "${template.title}" 生成了 ${instances.length} 个实例（${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}）`,
      );
    } else {
      console.log(
        `[TaskInstanceGenerationService] 模板 "${template.title}" 在指定范围内无实例（非重复任务或已过期）`,
      );
    }

    return instances;
  }

  /**
   * 检查并补充模板的实例
   * 当最远实例的日期 < 今天 + 100 天时，自动补充
   */
  async checkAndRefillInstances(templateUuid: string): Promise<void> {
    const template = await this.templateRepository.findByUuid(templateUuid);
    if (!template) {
      return;
    }

    // 只为 ACTIVE 状态的模板补充实例
    if (template.status !== 'ACTIVE') {
      return;
    }

    const now = Date.now();
    const targetDate = now + TARGET_GENERATE_AHEAD_DAYS * 86400000;
    
    // 检查最远实例的日期
    const lastGenerated = template.lastGeneratedDate || 0;
    const daysRemaining = Math.floor((lastGenerated - now) / 86400000);
    
    // 如果剩余天数少于阈值，触发补充
    if (daysRemaining < REFILL_THRESHOLD_DAYS) {
      console.log(
        `🔄 [TaskInstanceGenerationService] 模板 "${template.title}" 实例只到 ${new Date(lastGenerated).toLocaleDateString()}（还有 ${daysRemaining} 天），开始补充到 ${new Date(targetDate).toLocaleDateString()}...`,
      );
      await this.generateInstancesForTemplate(template, false);
    } else {
      console.log(
        `[TaskInstanceGenerationService] 模板 "${template.title}" 实例已充足（还有 ${daysRemaining} 天）`,
      );
    }
  }

  /**
   * 为指定日期范围生成所有实例
   */
  async generateInstancesForDateRange(
    accountUuid: string,
    fromDate: number,
    toDate: number,
  ): Promise<Map<string, TaskInstance[]>> {
    const templates = await this.templateRepository.findActiveTemplates(accountUuid);
    const result = new Map<string, TaskInstance[]>();

    for (const template of templates) {
      const instances = template.generateInstances(fromDate, toDate);
      if (instances.length > 0) {
        await this.instanceRepository.saveMany(instances);
        await this.templateRepository.save(template);
        result.set(template.uuid, instances);
      }
    }

    return result;
  }

  /**
   * 重新生成模板的所有实例
   */
  async regenerateTemplateInstances(
    templateUuid: string,
    fromDate: number,
    toDate: number,
  ): Promise<TaskInstance[]> {
    // 查找模板
    const template = await this.templateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error(`Template ${templateUuid} not found`);
    }

    // 删除现有实例
    await this.instanceRepository.deleteByTemplate(templateUuid);

    // 重新生成
    const instances = template.generateInstances(fromDate, toDate);
    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
    }

    return instances;
  }

  /**
   * 检查并生成待生成的实例
   * 遍历所有 ACTIVE 模板，补充实例到目标数量
   */
  async checkAndGenerateInstances(): Promise<void> {
    // 查找所有需要补充的模板
    const templates = await this.templateRepository.findActiveTemplates(''); // 需要修改为支持所有账户
    
    console.log(
      `[TaskInstanceGenerationService] 开始检查 ${templates.length} 个活跃模板的实例数量`,
    );

    for (const template of templates) {
      try {
        await this.checkAndRefillInstances(template.uuid);
      } catch (error) {
        console.error(
          `❌ [TaskInstanceGenerationService] 检查模板 "${template.title}" 失败:`,
          error,
        );
      }
    }
  }
}
