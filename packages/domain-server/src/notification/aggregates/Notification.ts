/**
 * Notification 聚合根实现 (Server)
 * 通知聚合根 - 负责管理单个通知的生命周期
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

type NotificationType = NotificationContracts.NotificationType;
type NotificationCategory = NotificationContracts.NotificationCategory;
type NotificationStatus = NotificationContracts.NotificationStatus;
type RelatedEntityType = NotificationContracts.RelatedEntityType;
type NotificationServerDTO = NotificationContracts.NotificationServerDTO;
type NotificationClientDTO = NotificationContracts.NotificationClientDTO;
type NotificationPersistenceDTO = NotificationContracts.NotificationPersistenceDTO;

/**
 * Notification 聚合根
 *
 * DDD 聚合根职责：
 * - 管理通知的生命周期
 * - 执行业务规则
 * - 是事务边界
 */
export class Notification extends AggregateRoot {
  private _accountUuid: string;
  private _title: string;
  private _content: string;
  private _type: NotificationType;
  private _category: NotificationCategory;
  private _importance: ImportanceLevel;
  private _urgency: UrgencyLevel;
  private _status: NotificationStatus;
  private _isRead: boolean;
  private _readAt: number | null;
  private _relatedEntityType: RelatedEntityType | null;
  private _relatedEntityUuid: string | null;
  private _metadata: Record<string, any> | null;
  private _expiresAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;
  private _sentAt: number | null;
  private _deliveredAt: number | null;
  private _deletedAt: number | null;

  private constructor(props: NotificationProps, uuid?: string) {
    super(uuid || AggregateRoot.generateUUID());
    
    this._accountUuid = props.accountUuid;
    this._title = props.title;
    this._content = props.content;
    this._type = props.type;
    this._category = props.category || 'GENERAL';
    this._importance = props.importance || ImportanceLevel.NORMAL;
    this._urgency = props.urgency || UrgencyLevel.NORMAL;
    this._status = props.status || 'PENDING';
    this._isRead = props.isRead || false;
    this._readAt = props.readAt || null;
    this._relatedEntityType = props.relatedEntityType || null;
    this._relatedEntityUuid = props.relatedEntityUuid || null;
    this._metadata = props.metadata || null;
    this._expiresAt = props.expiresAt || null;
    this._createdAt = props.createdAt || Date.now();
    this._updatedAt = props.updatedAt || Date.now();
    this._sentAt = props.sentAt || null;
    this._deliveredAt = props.deliveredAt || null;
    this._deletedAt = props.deletedAt || null;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新通知
   */
  static create(props: CreateNotificationProps): Notification {
    const notification = new Notification({
      accountUuid: props.accountUuid,
      title: props.title,
      content: props.content,
      type: props.type,
      category: props.category,
      importance: props.importance,
      urgency: props.urgency,
      relatedEntityType: props.relatedEntityType,
      relatedEntityUuid: props.relatedEntityUuid,
      metadata: props.metadata,
      expiresAt: props.expiresAt,
      status: 'PENDING',
      isRead: false,
    });

    return notification;
  }

  /**
   * 从持久化数据恢复
   */
  static fromPersistence(dto: NotificationPersistenceDTO): Notification {
    return new Notification({
      accountUuid: dto.accountUuid,
      title: dto.title,
      content: dto.content,
      type: dto.type,
      category: dto.category,
      importance: dto.importance,
      urgency: dto.urgency,
      status: dto.status,
      isRead: dto.isRead,
      readAt: dto.readAt,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityUuid: dto.relatedEntityUuid,
      metadata: dto.metadata ? JSON.parse(dto.metadata as any) : null,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      sentAt: dto.sentAt,
      deliveredAt: dto.deliveredAt,
      deletedAt: dto.deletedAt,
    }, dto.uuid);
  }

  // ===== Getters =====

  get accountUuid(): string { return this._accountUuid; }
  get title(): string { return this._title; }
  get content(): string { return this._content; }
  get type(): NotificationType { return this._type; }
  get category(): NotificationCategory { return this._category; }
  get importance(): ImportanceLevel { return this._importance; }
  get urgency(): UrgencyLevel { return this._urgency; }
  get status(): NotificationStatus { return this._status; }
  get isRead(): boolean { return this._isRead; }
  get readAt(): number | null { return this._readAt; }
  get relatedEntityType(): RelatedEntityType | null { return this._relatedEntityType; }
  get relatedEntityUuid(): string | null { return this._relatedEntityUuid; }
  get metadata(): Record<string, any> | null { return this._metadata; }
  get expiresAt(): number | null { return this._expiresAt; }
  get createdAt(): number { return this._createdAt; }
  get updatedAt(): number { return this._updatedAt; }
  get sentAt(): number | null { return this._sentAt; }
  get deliveredAt(): number | null { return this._deliveredAt; }
  get deletedAt(): number | null { return this._deletedAt; }

  // ===== 业务方法 =====

  /**
   * 标记为已读
   */
  markAsRead(): void {
    if (this._isRead) {
      return; // 已经是已读状态
    }

    this._isRead = true;
    this._readAt = Date.now();
    this._updatedAt = Date.now();

    if (this._status === 'SENT') {
      this._status = 'READ';
    }
  }

  /**
   * 标记为已发送
   */
  markAsSent(): void {
    if (this._status !== 'PENDING') {
      return;
    }

    this._status = 'SENT';
    this._sentAt = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 标记为已送达
   */
  markAsDelivered(): void {
    this._deliveredAt = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 软删除
   */
  softDelete(): void {
    this._deletedAt = Date.now();
    this._status = 'DELETED';
    this._updatedAt = Date.now();
  }

  /**
   * 检查是否过期
   */
  isExpired(): boolean {
    if (!this._expiresAt) {
      return false;
    }
    return Date.now() > this._expiresAt;
  }

  // ===== DTO 转换 =====

  toServerDTO(): NotificationServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      content: this._content,
      type: this._type,
      category: this._category,
      importance: this._importance,
      urgency: this._urgency,
      status: this._status,
      isRead: this._isRead,
      readAt: this._readAt,
      relatedEntityType: this._relatedEntityType,
      relatedEntityUuid: this._relatedEntityUuid,
      metadata: this._metadata as any,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      sentAt: this._sentAt,
      deliveredAt: this._deliveredAt,
      deletedAt: this._deletedAt,
    };
  }

  toClientDTO(): NotificationClientDTO {
    return {
      uuid: this.uuid,
      title: this._title,
      content: this._content,
      type: this._type,
      category: this._category,
      importance: this._importance,
      urgency: this._urgency,
      status: this._status,
      isRead: this._isRead,
      readAt: this._readAt ? new Date(this._readAt).toISOString() : null,
      relatedEntityType: this._relatedEntityType,
      relatedEntityUuid: this._relatedEntityUuid,
      metadata: this._metadata as any,
      expiresAt: this._expiresAt ? new Date(this._expiresAt).toISOString() : null,
      createdAt: new Date(this._createdAt).toISOString(),
      updatedAt: new Date(this._updatedAt).toISOString(),
    };
  }

  toPersistence(): NotificationPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      content: this._content,
      type: this._type,
      category: this._category,
      importance: this._importance,
      urgency: this._urgency,
      status: this._status,
      isRead: this._isRead,
      readAt: this._readAt,
      relatedEntityType: this._relatedEntityType,
      relatedEntityUuid: this._relatedEntityUuid,
      metadata: this._metadata ? JSON.stringify(this._metadata) : null,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      sentAt: this._sentAt,
      deliveredAt: this._deliveredAt,
      deletedAt: this._deletedAt,
    };
  }
}

// ===== Props 类型定义 =====

interface NotificationProps {
  accountUuid: string;
  title: string;
  content: string;
  type: NotificationType;
  category?: NotificationCategory;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  status?: NotificationStatus;
  isRead?: boolean;
  readAt?: number | null;
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityUuid?: string | null;
  metadata?: Record<string, any> | null;
  expiresAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
  sentAt?: number | null;
  deliveredAt?: number | null;
  deletedAt?: number | null;
}

interface CreateNotificationProps {
  accountUuid: string;
  title: string;
  content: string;
  type: NotificationType;
  category?: NotificationCategory;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityUuid?: string | null;
  metadata?: Record<string, any> | null;
  expiresAt?: number | null;
}
