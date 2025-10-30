/**
 * NotificationTemplate 聚合根实现 (Client)
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { NotificationContracts as NC } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { NotificationTemplateConfigClient } from '../value-objects';

type INotificationTemplateClient = NotificationContracts.NotificationTemplateClient;
type NotificationTemplateAggregateClientDTO =
  NotificationContracts.NotificationTemplateAggregateClientDTO;
type NotificationTemplateAggregateServerDTO =
  NotificationContracts.NotificationTemplateAggregateServerDTO;
type NotificationType = NotificationContracts.NotificationType;
type NotificationCategory = NotificationContracts.NotificationCategory;

const NotificationType = NC.NotificationType;
const NotificationCategory = NC.NotificationCategory;

/**
 * NotificationTemplate 聚合根 (Client)
 */
export class NotificationTemplateClient
  extends AggregateRoot
  implements INotificationTemplateClient
{
  // ===== 私有字段 =====
  private _name: string;
  private _description?: string | null;
  private _type: NotificationType;
  private _category: NotificationCategory;
  private _template: NotificationTemplateConfigClient;
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
    template: NotificationTemplateConfigClient;
    isActive: boolean;
    isSystemTemplate: boolean;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._name = params.name;
    this._description = params.description;
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
  public get description(): string | null | undefined {
    return this._description;
  }
  public get type(): NotificationType {
    return this._type;
  }
  public get category(): NotificationCategory {
    return this._category;
  }
  public get template(): NotificationTemplateConfigClient {
    return this._template;
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

  // ===== UI 计算属性 =====

  public get displayName(): string {
    return this._description || this._name;
  }

  public get statusText(): string {
    return this._isActive ? '启用' : '禁用';
  }

  public get channelText(): string {
    return this._template.enabledChannelsList?.join(', ') || '无';
  }

  public get formattedCreatedAt(): string {
    return this.formatDateTime(this._createdAt);
  }

  public get formattedUpdatedAt(): string {
    return this.formatDateTime(this._updatedAt);
  }

  // ===== UI 业务方法 =====

  public getDisplayName(): string {
    return this.displayName;
  }

  public getStatusBadge(): { text: string; color: string } {
    if (this._isSystemTemplate) {
      return { text: '系统', color: 'purple' };
    }
    return this._isActive ? { text: '启用', color: 'green' } : { text: '禁用', color: 'gray' };
  }

  public getTypeBadge(): { text: string; color: string } {
    const typeMap: Record<NotificationType, { text: string; color: string }> = {
      [NotificationType.INFO]: { text: '信息', color: 'blue' },
      [NotificationType.SUCCESS]: { text: '成功', color: 'green' },
      [NotificationType.WARNING]: { text: '警告', color: 'orange' },
      [NotificationType.ERROR]: { text: '错误', color: 'red' },
      [NotificationType.REMINDER]: { text: '提醒', color: 'purple' },
      [NotificationType.SYSTEM]: { text: '系统', color: 'gray' },
      [NotificationType.SOCIAL]: { text: '社交', color: 'cyan' },
    };
    return typeMap[this._type] || { text: '未知', color: 'gray' };
  }

  public getChannelList(): string[] {
    return this._template.enabledChannelsList || [];
  }

  /**
   * 预览模板（客户端简化版）
   */
  public preview(variables: Record<string, any>): { title: string; content: string } {
    let title = this._template.template?.title || '';
    let content = this._template.template?.content || '';

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const strValue = String(value ?? '');
      title = title.replace(new RegExp(placeholder, 'g'), strValue);
      content = content.replace(new RegExp(placeholder, 'g'), strValue);
    }

    return { title, content };
  }

  public canEdit(): boolean {
    return !this._isSystemTemplate;
  }

  public canDelete(): boolean {
    return !this._isSystemTemplate;
  }

  public clone(): NotificationTemplateClient {
    return new NotificationTemplateClient({
      uuid: this._uuid,
      name: this._name,
      description: this._description,
      type: this._type,
      category: this._category,
      template: this._template,
      isActive: this._isActive,
      isSystemTemplate: this._isSystemTemplate,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): NotificationTemplateAggregateClientDTO {
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      type: this.type,
      category: this.category,
      template: this._template.toClientDTO(),
      isActive: this.isActive,
      isSystemTemplate: this.isSystemTemplate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      displayName: this.displayName,
      statusText: this.statusText,
      channelText: this.channelText,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
    };
  }

  public toServerDTO(): NotificationTemplateAggregateServerDTO {
    return {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      type: this.type,
      category: this.category,
      template: this._template.toServerDTO() as any,
      isActive: this.isActive,
      isSystemTemplate: this.isSystemTemplate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    name: string;
    type: NotificationType;
    category: NotificationCategory;
    template: NotificationTemplateConfigClient;
    description?: string;
    isSystemTemplate?: boolean;
  }): NotificationTemplateClient {
    return new NotificationTemplateClient({
      name: params.name,
      description: params.description,
      type: params.type,
      category: params.category,
      template: params.template,
      isActive: true,
      isSystemTemplate: params.isSystemTemplate ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  public static forCreate(): NotificationTemplateClient {
    return new NotificationTemplateClient({
      name: '',
      description: '',
      type: NotificationType.INFO,
      category: NotificationCategory.SYSTEM,
      template: NotificationTemplateConfigClient.fromClientDTO({
        template: { title: '', content: '', variables: [] },
        channels: { inApp: true, email: false, push: false, sms: false },
        emailTemplate: null,
        pushTemplate: null,
        enabledChannelsCount: 1,
        enabledChannelsList: ['应用内'],
        hasEmailTemplate: false,
        hasPushTemplate: false,
      }),
      isActive: true,
      isSystemTemplate: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  public static fromClientDTO(
    dto: NotificationTemplateAggregateClientDTO,
  ): NotificationTemplateClient {
    return new NotificationTemplateClient({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      template: NotificationTemplateConfigClient.fromClientDTO(dto.template),
      isActive: dto.isActive,
      isSystemTemplate: dto.isSystemTemplate,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromServerDTO(
    dto: NotificationTemplateAggregateServerDTO,
  ): NotificationTemplateClient {
    return new NotificationTemplateClient({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      template: NotificationTemplateConfigClient.fromServerDTO(dto.template),
      isActive: dto.isActive,
      isSystemTemplate: dto.isSystemTemplate,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== 私有辅助方法 =====

  private formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
