/**
 * Notification 聚合根实现 (Client)
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { NotificationContracts as NC } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { NotificationActionClient, NotificationMetadataClient } from '../value-objects';

type INotificationClient = NotificationContracts.NotificationClient;
type NotificationClientDTO = NotificationContracts.NotificationClientDTO;
type NotificationServerDTO = NotificationContracts.NotificationServerDTO;
type NotificationType = NotificationContracts.NotificationType;
type NotificationCategory = NotificationContracts.NotificationCategory;
type NotificationStatus = NotificationContracts.NotificationStatus;
type RelatedEntityType = NotificationContracts.RelatedEntityType;
type ImportanceLevel = NotificationContracts.ImportanceLevel;
type UrgencyLevel = NotificationContracts.UrgencyLevel;
type NotificationActionClientDTO = NotificationContracts.NotificationActionClientDTO;
type NotificationMetadataClientDTO = NotificationContracts.NotificationMetadataClientDTO;

const NotificationType = NC.NotificationType;
const NotificationCategory = NC.NotificationCategory;
const NotificationStatus = NC.NotificationStatus;
const ImportanceLevel = NC.ImportanceLevel;
const UrgencyLevel = NC.UrgencyLevel;

/**
 * Notification 聚合根 (Client)
 */
export class NotificationClient extends AggregateRoot implements INotificationClient {
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
  private _readAt?: number | null;
  private _relatedEntityType?: RelatedEntityType | null;
  private _relatedEntityUuid?: string | null;
  private _actions?: NotificationActionClient[] | null;
  private _metadata?: NotificationMetadataClient | null;
  private _expiresAt?: number | null;
  private _createdAt: number;
  private _updatedAt: number;
  private _sentAt?: number | null;
  private _deliveredAt?: number | null;
  private _deletedAt?: number | null;

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
    actions?: NotificationActionClient[] | null;
    metadata?: NotificationMetadataClient | null;
    expiresAt?: number | null;
    createdAt: number;
    updatedAt: number;
    sentAt?: number | null;
    deliveredAt?: number | null;
    deletedAt?: number | null;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._content = params.content;
    this._type = params.type;
    this._category = params.category;
    this._importance = params.importance;
    this._urgency = params.urgency;
    this._status = params.status;
    this._isRead = params.isRead;
    this._readAt = params.readAt;
    this._relatedEntityType = params.relatedEntityType;
    this._relatedEntityUuid = params.relatedEntityUuid;
    this._actions = params.actions;
    this._metadata = params.metadata;
    this._expiresAt = params.expiresAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._sentAt = params.sentAt;
    this._deliveredAt = params.deliveredAt;
    this._deletedAt = params.deletedAt;
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
  public get readAt(): number | null | undefined {
    return this._readAt;
  }
  public get relatedEntityType(): RelatedEntityType | null | undefined {
    return this._relatedEntityType;
  }
  public get relatedEntityUuid(): string | null | undefined {
    return this._relatedEntityUuid;
  }
  public get actions(): NotificationActionClient[] | null | undefined {
    return this._actions;
  }
  public get metadata(): NotificationMetadataClient | null | undefined {
    return this._metadata;
  }
  public get expiresAt(): number | null | undefined {
    return this._expiresAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get sentAt(): number | null | undefined {
    return this._sentAt;
  }
  public get deliveredAt(): number | null | undefined {
    return this._deliveredAt;
  }
  public get deletedAt(): number | null | undefined {
    return this._deletedAt;
  }

  // ===== UI 计算属性 =====

  public get isDeleted(): boolean {
    return Boolean(this._deletedAt);
  }

  public get isExpired(): boolean {
    if (!this._expiresAt) return false;
    return Date.now() > this._expiresAt;
  }

  public get isPending(): boolean {
    return this._status === NotificationStatus.PENDING;
  }

  public get isSent(): boolean {
    return this._status === NotificationStatus.SENT;
  }

  public get isDelivered(): boolean {
    return this._status === NotificationStatus.DELIVERED;
  }

  public get statusText(): string {
    const statusMap: Record<NotificationStatus, string> = {
      [NotificationStatus.PENDING]: '待发送',
      [NotificationStatus.SENT]: '已发送',
      [NotificationStatus.DELIVERED]: '已送达',
      [NotificationStatus.READ]: '已读',
      [NotificationStatus.FAILED]: '失败',
      [NotificationStatus.CANCELLED]: '已取消',
    };
    return statusMap[this._status] || '未知';
  }

  public get typeText(): string {
    const typeMap: Record<NotificationType, string> = {
      [NotificationType.INFO]: '信息',
      [NotificationType.SUCCESS]: '成功',
      [NotificationType.WARNING]: '警告',
      [NotificationType.ERROR]: '错误',
      [NotificationType.REMINDER]: '提醒',
      [NotificationType.SYSTEM]: '系统',
      [NotificationType.SOCIAL]: '社交',
    };
    return typeMap[this._type] || '未知';
  }

  public get categoryText(): string {
    const categoryMap: Record<NotificationCategory, string> = {
      [NotificationCategory.TASK]: '任务',
      [NotificationCategory.GOAL]: '目标',
      [NotificationCategory.SCHEDULE]: '日程',
      [NotificationCategory.REMINDER]: '提醒',
      [NotificationCategory.ACCOUNT]: '账户',
      [NotificationCategory.SYSTEM]: '系统',
      [NotificationCategory.OTHER]: '其他',
    };
    return categoryMap[this._category] || '其他';
  }

  public get importanceText(): string {
    const importanceMap: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: '极其重要',
      [ImportanceLevel.Important]: '非常重要',
      [ImportanceLevel.Moderate]: '中等重要',
      [ImportanceLevel.Minor]: '不太重要',
      [ImportanceLevel.Trivial]: '无关紧要',
    };
    return importanceMap[this._importance] || '中等重要';
  }

  public get urgencyText(): string {
    const urgencyMap: Record<UrgencyLevel, string> = {
      [UrgencyLevel.Critical]: '非常紧急',
      [UrgencyLevel.High]: '高度紧急',
      [UrgencyLevel.Medium]: '中等紧急',
      [UrgencyLevel.Low]: '低度紧急',
      [UrgencyLevel.None]: '无期限',
    };
    return urgencyMap[this._urgency] || '低度紧急';
  }

  public get timeAgo(): string {
    return this.formatTimeAgo(this._createdAt);
  }

  public get formattedCreatedAt(): string {
    return this.formatDateTime(this._createdAt);
  }

  public get formattedUpdatedAt(): string {
    return this.formatDateTime(this._updatedAt);
  }

  public get formattedSentAt(): string | undefined {
    return this._sentAt ? this.formatDateTime(this._sentAt) : undefined;
  }

  public get channels(): any {
    return null; // 客户端不实现子实体集合，使用 API 按需加载
  }

  public get history(): any {
    return null;
  }

  // ===== 工厂方法（创建子实体） - 已在下方UI方法中实现 =====

  // ===== 子实体管理方法 =====

  public addChannel(): void {
    throw new Error('addChannel not implemented on client');
  }

  public removeChannel(): any {
    throw new Error('removeChannel not implemented on client');
    return null;
  }

  public getAllChannels(): any[] {
    return []; // 客户端返回空数组
  }

  public getChannelByType(): any {
    return null;
  }

  public getHistory(): any[] {
    return [];
  }

  // ===== UI 业务方法 =====

  public getStatusBadge(): { text: string; color: string } {
    const badgeMap: Record<NotificationStatus, { text: string; color: string }> = {
      [NotificationStatus.PENDING]: { text: '待发送', color: 'gray' },
      [NotificationStatus.SENT]: { text: '已发送', color: 'blue' },
      [NotificationStatus.DELIVERED]: { text: '已送达', color: 'green' },
      [NotificationStatus.READ]: { text: '已读', color: 'green' },
      [NotificationStatus.FAILED]: { text: '失败', color: 'red' },
      [NotificationStatus.CANCELLED]: { text: '已取消', color: 'orange' },
    };
    return badgeMap[this._status] || { text: '未知', color: 'gray' };
  }

  public getDisplayTitle(): string {
    return this._title;
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

  public getTypeIcon(): string {
    const iconMap: Record<NotificationType, string> = {
      [NotificationType.INFO]: 'i-carbon-information',
      [NotificationType.SUCCESS]: 'i-carbon-checkmark-filled',
      [NotificationType.WARNING]: 'i-carbon-warning',
      [NotificationType.ERROR]: 'i-carbon-error',
      [NotificationType.REMINDER]: 'i-carbon-reminder',
      [NotificationType.SYSTEM]: 'i-carbon-settings',
      [NotificationType.SOCIAL]: 'i-carbon-user-multiple',
    };
    return iconMap[this._type] || 'i-carbon-notification';
  }

  public getCategoryIcon(): string {
    const iconMap: Record<NotificationCategory, string> = {
      [NotificationCategory.TASK]: 'i-carbon-task',
      [NotificationCategory.GOAL]: 'i-carbon-trophy',
      [NotificationCategory.SCHEDULE]: 'i-carbon-calendar',
      [NotificationCategory.REMINDER]: 'i-carbon-reminder',
      [NotificationCategory.ACCOUNT]: 'i-carbon-user',
      [NotificationCategory.SYSTEM]: 'i-carbon-settings',
      [NotificationCategory.OTHER]: 'i-carbon-document',
    };
    return iconMap[this._category] || 'i-carbon-notification';
  }

  public getTimeText(): string {
    return this.timeAgo;
  }

  public canMarkAsRead(): boolean {
    return !this._isRead && !this.isDeleted;
  }

  public canDelete(): boolean {
    return !this.isDeleted;
  }

  public canExecuteActions(): boolean {
    return Boolean(this._actions && this._actions.length > 0 && !this.isDeleted);
  }

  public markAsRead(): void {
    this._isRead = true;
    this._readAt = Date.now();
    this._status = NotificationStatus.READ;
  }

  public markAsUnread(): void {
    this._isRead = false;
    this._readAt = null;
  }

  public delete(): void {
    this._deletedAt = Date.now();
  }

  public softDelete(): void {
    this._deletedAt = Date.now();
  }

  public executeAction(actionId: string): void {
    // 客户端简化实现 - 实际执行由 API 处理
    console.log('Execute action:', actionId);
  }

  public navigate(): void {
    // 客户端简化实现 - 实际导航由路由处理
    if (this._relatedEntityType && this._relatedEntityUuid) {
      console.log('Navigate to:', this._relatedEntityType, this._relatedEntityUuid);
    }
  }

  public createChannel(): any {
    throw new Error('createChannel not implemented on client');
  }

  public createHistory(): any {
    throw new Error('createHistory not implemented on client');
  }

  public clone(): NotificationClient {
    return new NotificationClient({
      uuid: this._uuid,
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
      actions: this._actions,
      metadata: this._metadata,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      sentAt: this._sentAt,
      deliveredAt: this._deliveredAt,
      deletedAt: this._deletedAt,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): NotificationClientDTO {
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
      actions: this.actions,
      metadata: this.metadata,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      deletedAt: this.deletedAt,
      isDeleted: this.isDeleted,
      isExpired: this.isExpired,
      isPending: this.isPending,
      isSent: this.isSent,
      isDelivered: this.isDelivered,
      statusText: this.statusText,
      typeText: this.typeText,
      categoryText: this.categoryText,
      importanceText: this.importanceText,
      urgencyText: this.urgencyText,
      timeAgo: this.timeAgo,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
      formattedSentAt: this.formattedSentAt,
      channels: null,
      history: null,
    };
  }

  public toServerDTO(): NotificationServerDTO {
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
      actions: this._actions?.map((a) => a.toServerDTO()) || null,
      metadata: this._metadata?.toServerDTO() || null,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      deletedAt: this.deletedAt,
      channels: null,
      history: null,
    };
  }

  // ===== 静态工厂方法 =====

  public static fromClientDTO(dto: NotificationClientDTO): NotificationClient {
    return new NotificationClient({
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
      actions: dto.actions?.map((a) => NotificationActionClient.fromClientDTO(a)) || null,
      metadata: dto.metadata ? NotificationMetadataClient.fromClientDTO(dto.metadata) : null,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      sentAt: dto.sentAt,
      deliveredAt: dto.deliveredAt,
      deletedAt: dto.deletedAt,
    });
  }

  public static fromServerDTO(dto: NotificationServerDTO): NotificationClient {
    return new NotificationClient({
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
      actions: dto.actions?.map((a) => NotificationActionClient.fromServerDTO(a)) || null,
      metadata: dto.metadata ? NotificationMetadataClient.fromServerDTO(dto.metadata) : null,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      sentAt: dto.sentAt,
      deliveredAt: dto.deliveredAt,
      deletedAt: dto.deletedAt,
    });
  }

  // ===== 私有辅助方法 =====

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return '刚刚';
  }

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
