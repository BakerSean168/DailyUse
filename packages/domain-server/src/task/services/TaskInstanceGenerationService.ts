/**
 * TaskInstanceGenerationService - 任务实例生成服务
 *
 * 领域服务职责：
 * - 根据任务模板生成任务实例
 * - 处理重复规则
 * - 管理实例生成的业务逻辑
 */

import { TaskTemplate, TaskInstance } from '../aggregates';
import type { ITaskTemplateRepository, ITaskInstanceRepository } from '../repositories';

export class TaskInstanceGenerationService {
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  /**
   * 为所有活跃模板生成实例（到指定日期）
   */
  async generateInstancesForActiveTemplates(accountUuid: string, toDate: number): Promise<void> {
    // 获取所有活跃的模板
    const templates = await this.templateRepository.findActiveTemplates(accountUuid);

    // 为每个模板生成实例
    for (const template of templates) {
      await this.generateInstancesForTemplate(template, toDate);
    }
  }

  /**
   * 为指定模板生成实例
   */
  async generateInstancesForTemplate(
    template: TaskTemplate,
    toDate: number,
  ): Promise<TaskInstance[]> {
    // 计算起始日期
    const fromDate = template.lastGeneratedDate
      ? template.lastGeneratedDate + 86400000 // 从上次生成日期的下一天开始
      : Date.now(); // 或者从现在开始

    // 确保不超前生成太多（如果设置了提前生成天数）
    const generateAheadDays = template.generateAheadDays ?? 30; // 默认30天
    const maxToDate = Date.now() + generateAheadDays * 86400000;
    const actualToDate = Math.min(toDate, maxToDate);

    // 生成实例
    const instances = template.generateInstances(fromDate, actualToDate);

    // 保存实例
    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
    }

    return instances;
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
   */
  async checkAndGenerateInstances(): Promise<void> {
    // 计算需要生成到的日期（默认提前7天）
    const toDate = Date.now() + 7 * 86400000;

    // 查找需要生成实例的模板
    const templates = await this.templateRepository.findNeedGenerateInstances(toDate);

    // 为每个模板生成实例
    for (const template of templates) {
      await this.generateInstancesForTemplate(template, toDate);
    }
  }
}
