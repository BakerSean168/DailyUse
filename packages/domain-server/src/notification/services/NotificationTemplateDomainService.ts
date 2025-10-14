/**
 * NotificationTemplate 领域服务
 *
 * 管理通知模板的业务逻辑
 */

import type { INotificationTemplateRepository } from '../repositories/INotificationTemplateRepository';
import { NotificationTemplate } from '../aggregates/NotificationTemplate';
import type { NotificationContracts } from '@dailyuse/contracts';

type NotificationType = NotificationContracts.NotificationType;
type NotificationCategory = NotificationContracts.NotificationCategory;
type NotificationTemplateConfigDTO = NotificationContracts.NotificationTemplateConfigServerDTO;

/**
 * NotificationTemplateDomainService
 */
export class NotificationTemplateDomainService {
  constructor(
    private readonly templateRepo: INotificationTemplateRepository,
    // private readonly eventBus: IEventBus,
  ) {}

  /**
   * 创建新模板
   */
  public async createTemplate(params: {
    name: string;
    type: NotificationType;
    category: NotificationCategory;
    template: NotificationTemplateConfigDTO;
    description?: string;
    isSystemTemplate?: boolean;
  }): Promise<NotificationTemplate> {
    // 1. 验证：检查名称是否已被使用
    const isNameUsed = await this.templateRepo.isNameUsed(params.name);
    if (isNameUsed) {
      throw new Error(`Template name is already in use: ${params.name}`);
    }

    // 2. 创建聚合根
    const template = NotificationTemplate.create(params);

    // 3. 持久化
    await this.templateRepo.save(template);

    // 4. 触发领域事件
    // await this.eventBus.publish({
    //   type: 'notification.template.created',
    //   aggregateId: template.uuid,
    //   timestamp: Date.now(),
    //   payload: {
    //     template: template.toServerDTO(),
    //   },
    // });

    return template;
  }

  /**
   * 获取模板
   */
  public async getTemplate(uuid: string): Promise<NotificationTemplate | null> {
    return await this.templateRepo.findById(uuid);
  }

  /**
   * 通过名称获取模板
   */
  public async getTemplateByName(name: string): Promise<NotificationTemplate | null> {
    return await this.templateRepo.findByName(name);
  }

  /**
   * 获取所有模板
   */
  public async getAllTemplates(options?: {
    includeInactive?: boolean;
  }): Promise<NotificationTemplate[]> {
    return await this.templateRepo.findAll(options);
  }

  /**
   * 获取分类模板
   */
  public async getTemplatesByCategory(
    category: NotificationCategory,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    return await this.templateRepo.findByCategory(category, options);
  }

  /**
   * 获取类型模板
   */
  public async getTemplatesByType(
    type: NotificationType,
    options?: { activeOnly?: boolean },
  ): Promise<NotificationTemplate[]> {
    return await this.templateRepo.findByType(type, options);
  }

  /**
   * 获取系统预设模板
   */
  public async getSystemTemplates(): Promise<NotificationTemplate[]> {
    return await this.templateRepo.findSystemTemplates();
  }

  /**
   * 更新模板配置
   */
  public async updateTemplateConfig(
    uuid: string,
    template: Partial<NotificationTemplateConfigDTO>,
  ): Promise<NotificationTemplate> {
    const templateEntity = await this.templateRepo.findById(uuid);
    if (!templateEntity) {
      throw new Error(`Template not found: ${uuid}`);
    }

    templateEntity.updateTemplate(template);
    await this.templateRepo.save(templateEntity);

    return templateEntity;
  }

  /**
   * 激活模板
   */
  public async activateTemplate(uuid: string): Promise<void> {
    const template = await this.templateRepo.findById(uuid);
    if (!template) {
      throw new Error(`Template not found: ${uuid}`);
    }

    template.activate();
    await this.templateRepo.save(template);

    // await this.eventBus.publish({
    //   type: 'notification.template.activation.changed',
    //   aggregateId: uuid,
    //   timestamp: Date.now(),
    //   payload: {
    //     templateUuid: uuid,
    //     isActive: true,
    //   },
    // });
  }

  /**
   * 停用模板
   */
  public async deactivateTemplate(uuid: string): Promise<void> {
    const template = await this.templateRepo.findById(uuid);
    if (!template) {
      throw new Error(`Template not found: ${uuid}`);
    }

    template.deactivate();
    await this.templateRepo.save(template);

    // await this.eventBus.publish({
    //   type: 'notification.template.activation.changed',
    //   aggregateId: uuid,
    //   timestamp: Date.now(),
    //   payload: {
    //     templateUuid: uuid,
    //     isActive: false,
    //   },
    // });
  }

  /**
   * 删除模板
   */
  public async deleteTemplate(uuid: string): Promise<void> {
    const template = await this.templateRepo.findById(uuid);
    if (!template) {
      throw new Error(`Template not found: ${uuid}`);
    }

    if (template.isSystemTemplate) {
      throw new Error('Cannot delete system template');
    }

    await this.templateRepo.delete(uuid);
  }

  /**
   * 预览模板渲染
   */
  public async previewTemplate(
    uuid: string,
    variables: Record<string, any>,
  ): Promise<{ title: string; content: string }> {
    const template = await this.templateRepo.findById(uuid);
    if (!template) {
      throw new Error(`Template not found: ${uuid}`);
    }

    // 验证变量
    const validation = template.validateVariables(variables);
    if (!validation.isValid) {
      throw new Error(`Missing template variables: ${validation.missingVariables.join(', ')}`);
    }

    return template.render(variables);
  }

  /**
   * 预览邮件模板
   */
  public async previewEmailTemplate(
    uuid: string,
    variables: Record<string, any>,
  ): Promise<{ subject: string; htmlBody: string; textBody?: string }> {
    const template = await this.templateRepo.findById(uuid);
    if (!template) {
      throw new Error(`Template not found: ${uuid}`);
    }

    return template.renderEmail(variables);
  }

  /**
   * 预览推送模板
   */
  public async previewPushTemplate(
    uuid: string,
    variables: Record<string, any>,
  ): Promise<{ title: string; body: string }> {
    const template = await this.templateRepo.findById(uuid);
    if (!template) {
      throw new Error(`Template not found: ${uuid}`);
    }

    return template.renderPush(variables);
  }

  /**
   * 验证模板变量
   */
  public async validateTemplateVariables(
    uuid: string,
    variables: Record<string, any>,
  ): Promise<{ isValid: boolean; missingVariables: string[] }> {
    const template = await this.templateRepo.findById(uuid);
    if (!template) {
      throw new Error(`Template not found: ${uuid}`);
    }

    return template.validateVariables(variables);
  }

  /**
   * 统计模板数量
   */
  public async countTemplates(options?: { activeOnly?: boolean }): Promise<number> {
    return await this.templateRepo.count(options);
  }
}
