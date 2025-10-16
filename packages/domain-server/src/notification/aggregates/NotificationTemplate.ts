/**
 * NotificationTemplate 聚合根实现
 * 实现 NotificationTemplateServer 接口
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { NotificationType, NotificationCategory } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { NotificationTemplateConfig } from '../value-objects/NotificationTemplateConfig';

type INotificationTemplateServer = NotificationContracts.NotificationTemplateServer;
type NotificationTemplateServerDTO = NotificationContracts.NotificationTemplateAggregateServerDTO;
type NotificationTemplatePersistenceDTO =
  NotificationContracts.NotificationTemplateAggregatePersistenceDTO;
type NotificationTemplateConfigDTO = NotificationContracts.NotificationTemplateConfigServerDTO;

/**
 * NotificationTemplate 聚合根
 * 负责通知模板的创建、更新和管理
 */
export class NotificationTemplate extends AggregateRoot implements INotificationTemplateServer {
  // ===== 私有字段 =====
  private _name: string;
  private _description: string | null;
  private _type: NotificationType;
  private _category: NotificationCategory;
  private _template: NotificationTemplateConfig;
  private _isActive: boolean;
  private _isSystemTemplate: boolean;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    name: string;
    description?: string | null;
    type: NotificationType;
    category: NotificationCategory;
    template: NotificationTemplateConfig;
    isActive: boolean;
    isSystemTemplate: boolean;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._name = params.name;
    this._description = params.description ?? null;
    this._type = params.type;
    this._category = params.category;
    this._template = params.template;
    this._isActive = params.isActive;
    this._isSystemTemplate = params.isSystemTemplate;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string | null {
    return this._description;
  }
  public get type(): NotificationType {
    return this._type;
  }
  public get category(): NotificationCategory {
    return this._category;
  }
  public get template(): NotificationTemplateConfigDTO {
    return this._template.toContract();
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get isSystemTemplate(): boolean {
    return this._isSystemTemplate;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 业务方法 =====

  /**
   * 激活模板
   */
  public activate(): void {
    if (this._isActive) return;
    this._isActive = true;
    this._updatedAt = Date.now();
  }

  /**
   * 停用模板
   */
  public deactivate(): void {
    if (!this._isActive) return;
    this._isActive = false;
    this._updatedAt = Date.now();
  }

  /**
   * 更新模板配置
   */
  public updateTemplate(template: Partial<NotificationTemplateConfigDTO>): void {
    const current = this._template.toContract();
    const updated = { ...current, ...template };
    this._template = NotificationTemplateConfig.fromContract(updated);
    this._updatedAt = Date.now();
  }

  /**
   * 渲染模板
   */
  public render(variables: Record<string, any>): { title: string; content: string } {
    return this._template.render(variables);
  }

  /**
   * 渲染邮件模板
   */
  public renderEmail(variables: Record<string, any>): {
    subject: string;
    htmlBody: string;
    textBody?: string;
  } {
    const emailTemplate = this._template.emailTemplate;
    if (!emailTemplate) {
      throw new Error('该模板未配置邮件模板');
    }

    let subject = emailTemplate.subject;
    let htmlBody = emailTemplate.htmlBody ?? '';
    let textBody = emailTemplate.textBody ?? undefined;

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(pattern, String(value ?? ''));
      htmlBody = htmlBody.replace(pattern, String(value ?? ''));
      if (textBody !== undefined) {
        textBody = textBody.replace(pattern, String(value ?? ''));
      }
    }

    return { subject, htmlBody, textBody };
  }

  /**
   * 渲染推送模板
   */
  public renderPush(variables: Record<string, any>): { title: string; body: string } {
    const pushTemplate = this._template.pushTemplate;
    if (!pushTemplate) {
      throw new Error('该模板未配置推送模板');
    }

    let title = pushTemplate.title;
    let body = pushTemplate.body;

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      title = title.replace(pattern, String(value ?? ''));
      body = body.replace(pattern, String(value ?? ''));
    }

    return { title, body };
  }

  /**
   * 验证变量是否满足模板要求
   */
  public validateVariables(variables: Record<string, any>): {
    isValid: boolean;
    missingVariables: string[];
  } {
    return this._template.validateVariables(variables);
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationTemplateServerDTO {
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      type: this.type,
      category: this.category,
      template: this.template,
      isActive: this.isActive,
      isSystemTemplate: this.isSystemTemplate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toPersistenceDTO(): NotificationTemplatePersistenceDTO {
    const templateDTO = this._template.toContract();
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      type: this.type,
      category: this.category,
      isActive: this.isActive,
      isSystemTemplate: this.isSystemTemplate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,

      // Flattened template config
      templateTitle: templateDTO.template.title,
      templateContent: templateDTO.template.content,
      templateVariables: templateDTO.template.variables
        ? JSON.stringify(templateDTO.template.variables)
        : undefined,
      templateLayout: undefined, // layout/style are not in the source DTO
      templateStyle: undefined,

      // Email specific
      templateEmailSubject: templateDTO.emailTemplate?.subject,
      templateEmailHtmlBody: templateDTO.emailTemplate?.htmlBody,
      templateEmailTextBody: templateDTO.emailTemplate?.textBody ?? undefined,

      // Push specific
      templatePushTitle: templateDTO.pushTemplate?.title,
      templatePushBody: templateDTO.pushTemplate?.body,
      templatePushIcon: templateDTO.pushTemplate?.icon ?? undefined,
      templatePushSound: templateDTO.pushTemplate?.sound ?? undefined,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    name: string;
    type: NotificationType;
    category: NotificationCategory;
    template: NotificationTemplateConfigDTO;
    description?: string;
    isSystemTemplate?: boolean;
  }): NotificationTemplate {
    const now = Date.now();
    return new NotificationTemplate({
      name: params.name,
      description: params.description ?? null,
      type: params.type,
      category: params.category,
      template: NotificationTemplateConfig.fromContract(params.template),
      isActive: true,
      isSystemTemplate: params.isSystemTemplate ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromServerDTO(dto: NotificationTemplateServerDTO): NotificationTemplate {
    return new NotificationTemplate({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      category: dto.category,
      template: NotificationTemplateConfig.fromContract(dto.template),
      isActive: dto.isActive,
      isSystemTemplate: dto.isSystemTemplate,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromPersistenceDTO(dto: NotificationTemplatePersistenceDTO): NotificationTemplate {
    const template: NotificationContracts.TemplateContent = {
      title: dto.templateTitle,
      content: dto.templateContent,
      variables: dto.templateVariables ? JSON.parse(dto.templateVariables) : [],
    };

    const emailTemplate: NotificationContracts.EmailTemplateContent | null =
      dto.templateEmailSubject && dto.templateEmailHtmlBody
        ? {
            subject: dto.templateEmailSubject,
            htmlBody: dto.templateEmailHtmlBody,
            textBody: dto.templateEmailTextBody,
          }
        : null;

    const pushTemplate: NotificationContracts.PushTemplateContent | null =
      dto.templatePushTitle && dto.templatePushBody
        ? {
            title: dto.templatePushTitle,
            body: dto.templatePushBody,
            icon: dto.templatePushIcon,
            sound: dto.templatePushSound,
          }
        : null;

    const templateConfigDTO: NotificationTemplateConfigDTO = {
      template,
      channels: { inApp: true, email: !!emailTemplate, push: !!pushTemplate, sms: false }, // Infer channels
      emailTemplate,
      pushTemplate,
    };

    return new NotificationTemplate({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      category: dto.category,
      template: NotificationTemplateConfig.fromContract(templateConfigDTO),
      isActive: dto.isActive,
      isSystemTemplate: dto.isSystemTemplate,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
