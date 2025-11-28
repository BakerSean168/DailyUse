/**
 * Notification 聚合根实现
 * 实现 NotificationServer 接口
 */

import type { RelatedEntityType, NotificationActionServer, NotificationActionServerDTO, NotificationMetadataServer, NotificationMetadataServerDTO, NotificationPersistenceDTO, NotificationServer, NotificationServerDTO } from '@dailyuse/contracts/notification';
import { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';
import { NotificationType } from '@dailyuse/contracts/notification';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot, createLogger } from '@dailyuse/utils';
import { NotificationAction } from '../value-objects/NotificationAction';
import { NotificationMetadata } from '../value-objects/NotificationMetadata';
import { NotificationChannel } from '../entities/NotificationChannel';
import { NotificationHistory } from '../entities/NotificationHistory';

const logger = createLogger('Notification');

/**
 * Notification 聚合根
 */
export class Notification extends AggregateRoot implements NotificationServer {
  // ===== 私有字段 =====
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
  private _actions: NotificationAction[] | null;
  private _metadata: NotificationMetadata | null;
  private _expiresAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;
  private _sentAt: number | null;
  private _deliveredAt: number | null;
  private _deletedAt: number | null;

  // ===== 子实体集合 =====
  private _channels: NotificationChannel[];
  private _history: NotificationHistory[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    status: NotificationStatus;
    isRead: boolean;
    readAt?: number | null;
    relatedEntityType?: RelatedEntityType | null;
    relatedEntityUuid?: string | null;
    actions?: NotificationAction[] | null;
    metadata?: NotificationMetadata | null;
    expiresAt?: number | null;
    createdAt: number;
    updatedAt: number;
    sentAt?: number | null;
    deliveredAt?: number | null;
    deletedAt?: number | null;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._content = params.content;
    this._type = params.type;
    this._category = params.category;
    this._importance = params.importance;
    this._urgency = params.urgency;
    this._status = params.status;
    this._isRead = params.isRead;
    this._readAt = params.readAt ?? null;
    this._relatedEntityType = params.relatedEntityType ?? null;
    this._relatedEntityUuid = params.relatedEntityUuid ?? null;
    this._actions = params.actions ?? null;
    this._metadata = params.metadata ?? null;
    this._expiresAt = params.expiresAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._sentAt = params.sentAt ?? null;
    this._deliveredAt = params.deliveredAt ?? null;
    this._deletedAt = params.deletedAt ?? null;
    this._channels = [];
    this._history = [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get content(): string {
    return this._content;
  }
  public get type(): NotificationType {
    return this._type;
  }
  public get category(): NotificationCategory {
    return this._category;
  }
  public get importance(): ImportanceLevel {
    return this._importance;
  }
  public get urgency(): UrgencyLevel {
    return this._urgency;
  }
  public get status(): NotificationStatus {
    return this._status;
  }
  public get isRead(): boolean {
    return this._isRead;
  }
  public get readAt(): number | null {
    return this._readAt;
  }
  public get relatedEntityType(): RelatedEntityType | null {
    return this._relatedEntityType;
  }
  public get relatedEntityUuid(): string | null {
    return this._relatedEntityUuid;
  }
  public get actions(): NotificationActionServer[] | null {
    return this._actions ?? null;
  }
  public get metadata(): NotificationMetadataServer | null {
    return this._metadata ?? null;
  }
  public get expiresAt(): number | null {
    return this._expiresAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get sentAt(): number | null {
    return this._sentAt;
  }
  public get deliveredAt(): number | null {
    return this._deliveredAt;
  }
  public get deletedAt(): number | null {
    return this._deletedAt;
  }
  public get channels(): NotificationChannel[] | null {
    return this._channels.length > 0 ? [...this._channels] : null;
  }
  public get history(): NotificationHistory[] | null {
    return this._history.length > 0 ? [...this._history] : null;
  }

  // ===== 工厂方法（创建子实体） =====

  public createChannel(params: {
    channelType: string;
    recipient?: string;
    maxRetries?: number;
  }): NotificationChannel {
    const channel = NotificationChannel.create({
      notificationUuid: this.uuid,
      channelType: params.channelType as any,
      recipient: params.recipient,
      maxRetries: params.maxRetries,
    });
    this._channels.push(channel);
    return channel;
  }

  public createHistory(params: { action: string; details?: any }): NotificationHistory {
    const history = NotificationHistory.create({
      notificationUuid: this.uuid,
      action: params.action,
      details: params.details,
    });
    this._history.push(history);
    return history;
  }

  // ===== 子实体管理方法 =====

  public addChannel(channel: NotificationChannel): void {
    this._channels.push(channel);
  }

  public removeChannel(channelUuid: string): NotificationChannel | null {
    const index = this._channels.findIndex((c) => c.uuid === channelUuid);
    if (index === -1) return null;
    const [removed] = this._channels.splice(index, 1);
    return removed;
  }

  public getAllChannels(): NotificationChannel[] {
    return [...this._channels];
  }

  public getChannelByType(type: string): NotificationChannel | null {
    return this._channels.find((c) => c.channelType === type) ?? null;
  }

  public addHistory(action: string, details?: any): void {
    const history = this.createHistory({ action, details });
    this._history.push(history);
  }

  public getHistory(): NotificationHistory[] {
    return [...this._history];
  }

  // ===== 业务方法 =====

  public async send(): Promise<void> {
    logger.info('📨 [聚合根] 发送通知', {
      uuid: this._uuid,
      title: this._title,
      status: this._status,
      accountUuid: this._accountUuid,
    });

    if (this._status !== NotificationStatus.PENDING) {
      logger.error('❌ [聚合根] 通知状态不允许发送', {
        uuid: this._uuid,
        currentStatus: this._status,
        expectedStatus: NotificationStatus.PENDING,
      });
      throw new Error('只能发送待发送状态的通知');
    }

    this._status = NotificationStatus.SENT;
    this._sentAt = Date.now();
    this.addHistory('SENT', { sentAt: this._sentAt });

    logger.info('✅ [聚合根] 通知已标记为已发送', {
      uuid: this._uuid,
      status: this._status,
      sentAt: new Date(this._sentAt).toISOString(),
    });
  }

  public markAsRead(): void {
    if (this._isRead) return;

    this._isRead = true;
    this._readAt = Date.now();
    this._status = NotificationStatus.READ;
    this.addHistory('READ', { readAt: this._readAt });
  }

  public markAsUnread(): void {
    if (!this._isRead) return;

    this._isRead = false;
    this._readAt = null;
    this._status = NotificationStatus.DELIVERED;
    this.addHistory('UNREAD');
  }

  public cancel(): void {
    if (this._status === NotificationStatus.DELIVERED || this._status === NotificationStatus.READ) {
      throw new Error('无法取消：通知已交付或已读');
    }

    this._status = NotificationStatus.CANCELLED;
    this.addHistory('CANCELLED');
  }

  public softDelete(): void {
    this._deletedAt = Date.now();
    this.addHistory('DELETED', { deletedAt: this._deletedAt });
  }

  public restore(): void {
    if (!this._deletedAt) {
      throw new Error('通知未被删除，无需恢复');
    }

    this._deletedAt = null;
    this.addHistory('RESTORED');
  }

  public isExpired(): boolean {
    if (!this._expiresAt) return false;
    return Date.now() > this._expiresAt;
  }

  public isPending(): boolean {
    return this._status === NotificationStatus.PENDING;
  }

  public isSent(): boolean {
    return this._status === NotificationStatus.SENT;
  }

  public isDelivered(): boolean {
    return this._status === NotificationStatus.DELIVERED;
  }

  public hasBeenRead(): boolean {
    return this._isRead;
  }

  public async executeAction(actionId: string): Promise<void> {
    const action = this._actions?.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`操作 ${actionId} 不存在`);
    }

    this.addHistory('ACTION_EXECUTED', { actionId, action: action.toContract() });
  }

  // ===== 转换方法 =====

  public toServerDTO(includeChildren = false): NotificationServerDTO {
    const dto: NotificationServerDTO = {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      title: this.title,
      content: this.content,
      type: this.type,
      category: this.category,
      importance: this.importance,
      urgency: this.urgency,
      status: this.status,
      isRead: this.isRead,
      readAt: this.readAt,
      relatedEntityType: this.relatedEntityType,
      relatedEntityUuid: this.relatedEntityUuid,
      actions: this.actions,
      metadata: this.metadata,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      deletedAt: this.deletedAt,
    };

    if (includeChildren) {
      dto.channels = this._channels.map((c) => c.toServerDTO());
      dto.history = this._history.map((h) => h.toServerDTO());
    }

    return dto;
  }

  public toPersistenceDTO(): NotificationPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      title: this.title,
      content: this.content,
      type: this.type,
      category: this.category,
      importance: this.importance,
      urgency: this.urgency,
      status: this.status,
      isRead: this.isRead,
      readAt: this.readAt,
      relatedEntityType: this.relatedEntityType,
      relatedEntityUuid: this.relatedEntityUuid,
      actions: this.actions ? JSON.stringify(this.actions) : null,
      metadata: this.metadata ? JSON.stringify(this.metadata) : null,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      deletedAt: this.deletedAt,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    accountUuid: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    actions?: NotificationActionDTO[];
    metadata?: NotificationMetadataDTO;
    expiresAt?: number;
  }): Notification {
    logger.info('🔨 [聚合根] 创建 Notification 实例', {
      accountUuid: params.accountUuid,
      title: params.title,
      type: params.type,
      category: params.category,
      relatedEntityType: params.relatedEntityType,
      relatedEntityUuid: params.relatedEntityUuid,
    });

    const now = Date.now();
    const notification = new Notification({
      accountUuid: params.accountUuid,
      title: params.title,
      content: params.content,
      type: params.type,
      category: params.category,
      importance: params.importance ?? ImportanceLevel.Moderate,
      urgency: params.urgency ?? UrgencyLevel.Low,
      status: NotificationStatus.PENDING,
      isRead: false,
      relatedEntityType: params.relatedEntityType,
      relatedEntityUuid: params.relatedEntityUuid,
      actions: params.actions?.map((a) => NotificationAction.fromContract(a)) ?? null,
      metadata: params.metadata ? NotificationMetadata.fromContract(params.metadata) : null,
      expiresAt: params.expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    notification.addHistory('CREATED', { createdAt: now });

    logger.info('✅ [聚合根] Notification 实例已创建', {
      uuid: notification.uuid,
      status: notification.status,
      createdAt: new Date(notification.createdAt).toISOString(),
    });

    return notification;
  }

  public static fromServerDTO(dto: NotificationServerDTO): Notification {
    const notification = new Notification({
      uuid: dto.uuid,
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
      actions: dto.actions?.map((a) => NotificationAction.fromContract(a)) ?? null,
      metadata: dto.metadata ? NotificationMetadata.fromContract(dto.metadata) : null,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      sentAt: dto.sentAt,
      deliveredAt: dto.deliveredAt,
      deletedAt: dto.deletedAt,
    });

    if (dto.channels) {
      notification._channels = dto.channels.map((c) => NotificationChannel.fromServerDTO(c));
    }
    if (dto.history) {
      notification._history = dto.history.map((h) => NotificationHistory.fromServerDTO(h));
    }

    return notification;
  }

  public static fromPersistenceDTO(dto: NotificationPersistenceDTO): Notification {
    return new Notification({
      uuid: dto.uuid,
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
      actions: dto.actions
        ? JSON.parse(dto.actions).map((a: any) => NotificationAction.fromContract(a))
        : null,
      metadata: dto.metadata ? NotificationMetadata.fromContract(JSON.parse(dto.metadata)) : null,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      sentAt: dto.sentAt,
      deliveredAt: dto.deliveredAt,
      deletedAt: dto.deletedAt,
    });
  }
}
