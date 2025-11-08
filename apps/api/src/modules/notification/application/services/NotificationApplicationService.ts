// @ts-nocheck
import {
  NotificationDomainService,
  NotificationPreferenceDomainService,
} from '@dailyuse/domain-server';
import { NotificationContainer } from '../../infrastructure/di/NotificationContainer';
import { createLogger } from '@dailyuse/utils';
import { NotificationContracts } from '@dailyuse/contracts';
import type {
  INotificationPreferenceRepository,
  NotificationRepository as INotificationRepository,
  NotificationRepository as INotificationTemplateRepository,
} from '@dailyuse/domain-server';

// =================================================================
// Contract Type Aliases
// =================================================================

type NotificationClientDTO = NotificationContracts.NotificationClientDTO;
type NotificationPreferenceClientDTO = NotificationContracts.NotificationPreferenceClientDTO;
type NotificationServerDTO = NotificationContracts.NotificationServerDTO;
type NotificationPreferenceServerDTO = NotificationContracts.NotificationPreferenceServerDTO;
type NotificationChannelServerDTO = NotificationContracts.NotificationChannelServerDTO;
type NotificationChannelClientDTO = NotificationContracts.NotificationChannelClientDTO;
type NotificationHistoryServerDTO = NotificationContracts.NotificationHistoryServerDTO;
type NotificationHistoryClientDTO = NotificationContracts.NotificationHistoryClientDTO;
type NotificationActionServerDTO = NotificationContracts.NotificationActionServerDTO;
type NotificationActionClientDTO = NotificationContracts.NotificationActionClientDTO;
type NotificationMetadataServerDTO = NotificationContracts.NotificationMetadataServerDTO;
type NotificationMetadataClientDTO = NotificationContracts.NotificationMetadataClientDTO;
type ChannelErrorServerDTO = NotificationContracts.ChannelErrorServerDTO;
type ChannelErrorClientDTO = NotificationContracts.ChannelErrorClientDTO;
type ChannelResponseServerDTO = NotificationContracts.ChannelResponseServerDTO;
type ChannelResponseClientDTO = NotificationContracts.ChannelResponseClientDTO;
type CategoryPreferenceServerDTO = NotificationContracts.CategoryPreferenceServerDTO;
type CategoryPreferenceClientDTO = NotificationContracts.CategoryPreferenceClientDTO;
type DoNotDisturbConfigServerDTO = NotificationContracts.DoNotDisturbConfigServerDTO;
type DoNotDisturbConfigClientDTO = NotificationContracts.DoNotDisturbConfigClientDTO;
type RateLimitServerDTO = NotificationContracts.RateLimitServerDTO;
type RateLimitClientDTO = NotificationContracts.RateLimitClientDTO;
type NotificationChannelType = NotificationContracts.NotificationChannelType;
type NotificationCategory = NotificationContracts.NotificationCategory;
type NotificationType = NotificationContracts.NotificationType;
type RelatedEntityType = NotificationContracts.RelatedEntityType;

// =================================================================
// TEMPORARY DTO CONVERTERS
// TODO: Move this logic to a dedicated NotificationClient entity in the domain-client package.
// =================================================================

function toRateLimitClientDTO(serverDTO: RateLimitServerDTO): RateLimitClientDTO {
  return {
    ...serverDTO,
    limitText: `${serverDTO.maxPerHour}/hour, ${serverDTO.maxPerDay}/day`,
  };
}

function toDoNotDisturbConfigClientDTO(
  serverDTO: DoNotDisturbConfigServerDTO,
): DoNotDisturbConfigClientDTO {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = serverDTO.startTime.split(':').map(Number);
  const startTimeMinutes = startHour * 60 + startMinute;

  const [endHour, endMinute] = serverDTO.endTime.split(':').map(Number);
  const endTimeMinutes = endHour * 60 + endMinute;

  const isActive =
    serverDTO.enabled &&
    serverDTO.daysOfWeek.includes(dayOfWeek) &&
    currentTime >= startTimeMinutes &&
    currentTime <= endTimeMinutes;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysOfWeekText = serverDTO.daysOfWeek.map((d) => days[d]).join(', ');

  return {
    ...serverDTO,
    timeRangeText: `${serverDTO.startTime} - ${serverDTO.endTime}`,
    daysOfWeekText,
    isActive,
  };
}

function toCategoryPreferenceClientDTO(
  serverDTO: CategoryPreferenceServerDTO,
): CategoryPreferenceClientDTO {
  const enabledChannelsList = Object.entries(serverDTO.channels)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);

  return {
    ...serverDTO,
    enabledChannelsCount: enabledChannelsList.length,
    enabledChannelsList,
    importanceText: serverDTO.importance.join(', '),
  };
}

function toChannelResponseClientDTO(serverDTO: ChannelResponseServerDTO): ChannelResponseClientDTO {
  const isSuccess =
    !!serverDTO.statusCode && serverDTO.statusCode >= 200 && serverDTO.statusCode < 300;
  return {
    ...serverDTO,
    isSuccess,
    statusText: isSuccess ? 'Success' : 'Failed',
  };
}

function toChannelErrorClientDTO(serverDTO: ChannelErrorServerDTO): ChannelErrorClientDTO {
  return {
    ...serverDTO,
    displayMessage: serverDTO.message, // Simple mapping for now
    isRetryable: false, // Default to not retryable
  };
}

function toNotificationMetadataClientDTO(
  serverDTO: NotificationMetadataServerDTO,
): NotificationMetadataClientDTO {
  return {
    ...serverDTO,
    hasIcon: !!serverDTO.icon,
    hasImage: !!serverDTO.image,
    hasBadge: !!serverDTO.badge,
  };
}

function toNotificationActionClientDTO(
  serverDTO: NotificationActionServerDTO,
): NotificationActionClientDTO {
  return {
    ...serverDTO,
    // These are client-side properties, so we provide defaults.
    typeText: serverDTO.type,
    icon: '',
  };
}

function toNotificationChannelClientDTO(
  serverDTO: NotificationChannelServerDTO,
): NotificationChannelClientDTO {
  return {
    ...serverDTO,
    isPending: serverDTO.status === 'PENDING',
    isSent: serverDTO.status === 'SENT',
    isDelivered: serverDTO.status === 'DELIVERED',
    isFailed: serverDTO.status === 'FAILED',
    statusText: serverDTO.status,
    channelTypeText: serverDTO.channelType,
    canRetry: serverDTO.status === 'FAILED' && serverDTO.sendAttempts < serverDTO.maxRetries,
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
    formattedSentAt: serverDTO.sentAt ? new Date(serverDTO.sentAt).toISOString() : undefined,
    formattedDeliveredAt: serverDTO.deliveredAt
      ? new Date(serverDTO.deliveredAt).toISOString()
      : undefined,
    error: serverDTO.error ? toChannelErrorClientDTO(serverDTO.error) : null,
    response: serverDTO.response ? toChannelResponseClientDTO(serverDTO.response) : null,
  };
}

function toNotificationHistoryClientDTO(
  serverDTO: NotificationHistoryServerDTO,
): NotificationHistoryClientDTO {
  return {
    ...serverDTO,
    actionText: serverDTO.action,
    timeAgo: '', // Should be calculated on the client
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
  };
}

function toNotificationClientDTO(serverDTO: NotificationServerDTO): NotificationClientDTO {
  const isDeleted = !!serverDTO.deletedAt;
  const isExpired = serverDTO.expiresAt ? serverDTO.expiresAt < Date.now() : false;

  return {
    ...serverDTO,
    isDeleted,
    isExpired,
    isPending: serverDTO.status === 'PENDING',
    isSent: serverDTO.status === 'SENT',
    isDelivered: serverDTO.status === 'DELIVERED',
    statusText: serverDTO.status,
    typeText: serverDTO.type,
    categoryText: serverDTO.category,
    importanceText: serverDTO.importance,
    urgencyText: serverDTO.urgency,
    timeAgo: '',
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
    formattedUpdatedAt: new Date(serverDTO.updatedAt).toISOString(),
    formattedSentAt: serverDTO.sentAt ? new Date(serverDTO.sentAt).toISOString() : undefined,
    metadata: serverDTO.metadata ? toNotificationMetadataClientDTO(serverDTO.metadata) : null,
    actions: serverDTO.actions ? serverDTO.actions.map(toNotificationActionClientDTO) : null,
    channels: serverDTO.channels ? serverDTO.channels.map(toNotificationChannelClientDTO) : null,
    history: serverDTO.history ? serverDTO.history.map(toNotificationHistoryClientDTO) : null,
  };
}

function toNotificationPreferenceClientDTO(
  serverDTO: NotificationPreferenceServerDTO,
): NotificationPreferenceClientDTO {
  const { doNotDisturb, categories, channels, rateLimit } = serverDTO;

  const clientCategories = {
    task: toCategoryPreferenceClientDTO(categories.task),
    goal: toCategoryPreferenceClientDTO(categories.goal),
    schedule: toCategoryPreferenceClientDTO(categories.schedule),
    reminder: toCategoryPreferenceClientDTO(categories.reminder),
    account: toCategoryPreferenceClientDTO(categories.account),
    system: toCategoryPreferenceClientDTO(categories.system),
  };

  const isAllEnabled = Object.values(clientCategories).every((cat) =>
    Object.values(cat.channels).every((channel) => channel),
  );
  const isAllDisabled = Object.values(clientCategories).every(
    (cat) => !Object.values(cat.channels).some((channel) => channel),
  );

  const now = new Date();
  const isInDoNotDisturbPeriod =
    !!doNotDisturb && doNotDisturb.enabled && doNotDisturb.startTime && doNotDisturb.endTime
      ? now >= new Date(doNotDisturb.startTime) && now <= new Date(doNotDisturb.endTime)
      : false;

  const enabledChannelsCount = Object.values(channels).filter(Boolean).length;

  return {
    ...serverDTO,
    doNotDisturb: doNotDisturb ? toDoNotDisturbConfigClientDTO(doNotDisturb) : null,
    rateLimit: rateLimit ? toRateLimitClientDTO(rateLimit) : null,
    categories: clientCategories,
    isAllEnabled,
    isAllDisabled,
    hasDoNotDisturb: !!doNotDisturb && doNotDisturb.enabled,
    isInDoNotDisturbPeriod,
    enabledChannelsCount,
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
    formattedUpdatedAt: new Date(serverDTO.updatedAt).toISOString(),
  };
}

const logger = createLogger('NotificationApplicationService');

/**
 * Notification 应用服务
 */
export class NotificationApplicationService {
  private static instance: NotificationApplicationService;
  private domainService: NotificationDomainService;
  private preferenceService: NotificationPreferenceDomainService;
  private notificationRepository: INotificationRepository;
  private templateRepository: INotificationTemplateRepository;
  private preferenceRepository: INotificationPreferenceRepository;

  private constructor(
    notificationRepository: INotificationRepository,
    templateRepository: INotificationTemplateRepository,
    preferenceRepository: INotificationPreferenceRepository,
  ) {
    this.notificationRepository = notificationRepository;
    this.templateRepository = templateRepository;
    this.preferenceRepository = preferenceRepository;
    this.preferenceService = new NotificationPreferenceDomainService(preferenceRepository);
    this.domainService = new NotificationDomainService(
      notificationRepository,
      templateRepository,
      preferenceRepository,
    );
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    notificationRepository?: INotificationRepository,
    templateRepository?: INotificationTemplateRepository,
    preferenceRepository?: INotificationPreferenceRepository,
  ): Promise<NotificationApplicationService> {
    const container = NotificationContainer.getInstance();
    const notificationRepo = notificationRepository || container.getNotificationRepository();
    const templateRepo = templateRepository || container.getNotificationTemplateRepository();
    const preferenceRepo = preferenceRepository || container.getNotificationPreferenceRepository();

    NotificationApplicationService.instance = new NotificationApplicationService(
      notificationRepo,
      templateRepo,
      preferenceRepo,
    );
    return NotificationApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<NotificationApplicationService> {
    if (!NotificationApplicationService.instance) {
      NotificationApplicationService.instance =
        await NotificationApplicationService.createInstance();
    }
    return NotificationApplicationService.instance;
  }

  async createNotification(params: {
    accountUuid: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    channels?: NotificationChannelType[];
  }): Promise<NotificationClientDTO> {
    logger.info('📬 [应用服务] 接收创建通知请求', {
      accountUuid: params.accountUuid,
      title: params.title,
      type: params.type,
      category: params.category,
      relatedEntityType: params.relatedEntityType,
      relatedEntityUuid: params.relatedEntityUuid,
      channels: params.channels,
    });

    const notification = await this.domainService.createAndSendNotification(params);
    const clientDTO = toNotificationClientDTO(notification.toServerDTO());

    logger.info('✅✅✅ [应用服务] 通知创建完成，返回给调用方', {
      notificationUuid: clientDTO.uuid,
      accountUuid: clientDTO.accountUuid,
      title: clientDTO.title,
      status: clientDTO.status,
      statusText: clientDTO.statusText,
    });

    // 通过 SSE 推送通知给前端
    try {
      const { SSEConnectionManager } = await import('../../interface/http/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      const sent = sseManager.sendMessage(params.accountUuid, 'notification:created', {
        notification: clientDTO,
        timestamp: new Date().toISOString(),
      });

      if (sent) {
        logger.info('📡 [SSE推送] 通知已推送给前端', {
          accountUuid: params.accountUuid,
          notificationUuid: clientDTO.uuid,
        });
      } else {
        logger.warn('⚠️ [SSE推送] 用户未连接SSE，推送失败', {
          accountUuid: params.accountUuid,
          notificationUuid: clientDTO.uuid,
        });
      }
    } catch (error) {
      logger.error('❌ [SSE推送] SSE 推送失败', {
        error: error instanceof Error ? error.message : String(error),
        accountUuid: params.accountUuid,
      });
    }

    return clientDTO;
  }

  async createNotificationFromTemplate(params: {
    accountUuid: string;
    templateUuid: string;
    variables: Record<string, any>;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    channels?: NotificationChannelType[];
  }): Promise<NotificationClientDTO> {
    const notification = await this.domainService.createNotificationFromTemplate(params);
    return toNotificationClientDTO(notification.toServerDTO());
  }

  async sendBulkNotifications(
    notificationsData: Array<{
      accountUuid: string;
      title: string;
      content: string;
      type: NotificationType;
      category: NotificationCategory;
      relatedEntityType?: RelatedEntityType;
      relatedEntityUuid?: string;
      channels?: NotificationChannelType[];
    }>,
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.sendBulkNotifications(notificationsData);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getNotification(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<NotificationClientDTO | null> {
    const notification = await this.domainService.getNotification(uuid, options);
    return notification ? toNotificationClientDTO(notification.toServerDTO()) : null;
  }

  async getUserNotifications(
    accountUuid: string,
    options?: { includeRead?: boolean; limit?: number; offset?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getUserNotifications(accountUuid, options);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getUnreadNotifications(
    accountUuid: string,
    options?: { limit?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getUnreadNotifications(accountUuid, options);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getUnreadCount(accountUuid: string): Promise<number> {
    return this.domainService.getUnreadCount(accountUuid);
  }

  async getCategoryStats(accountUuid: string): Promise<Record<NotificationCategory, number>> {
    return this.domainService.getCategoryStats(accountUuid);
  }

  async markAsRead(uuid: string): Promise<void> {
    await this.domainService.markAsRead(uuid);
  }

  async markManyAsRead(uuids: string[]): Promise<void> {
    await this.domainService.markManyAsRead(uuids);
  }

  async markAllAsRead(accountUuid: string): Promise<void> {
    await this.domainService.markAllAsRead(accountUuid);
  }

  async deleteNotification(uuid: string, soft = true): Promise<void> {
    await this.domainService.deleteNotification(uuid, soft);
  }

  async deleteManyNotifications(uuids: string[], soft = true): Promise<void> {
    await this.domainService.deleteManyNotifications(uuids, soft);
  }

  async executeNotificationAction(notificationUuid: string, actionId: string): Promise<void> {
    await this.domainService.executeNotificationAction(notificationUuid, actionId);
  }

  async getNotificationsByRelatedEntity(
    relatedEntityType: string,
    relatedEntityUuid: string,
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getNotificationsByRelatedEntity(
      relatedEntityType,
      relatedEntityUuid,
    );
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async cleanupExpiredNotifications(): Promise<number> {
    return this.domainService.cleanupExpiredNotifications();
  }

  async cleanupDeletedNotifications(daysAgo = 30): Promise<number> {
    return this.domainService.cleanupDeletedNotifications(daysAgo);
  }

  async getPreference(accountUuid: string): Promise<NotificationPreferenceClientDTO | null> {
    const preference = await this.preferenceService.getPreference(accountUuid);
    return preference ? toNotificationPreferenceClientDTO(preference.toServerDTO()) : null;
  }

  async getOrCreatePreference(accountUuid: string): Promise<NotificationPreferenceClientDTO> {
    const preference = await this.preferenceService.getOrCreatePreference(accountUuid);
    return toNotificationPreferenceClientDTO(preference.toServerDTO());
  }

  async updatePreference(
    accountUuid: string,
    updates: Partial<{
      channelPreferences: NotificationContracts.ChannelPreferences;
      categoryPreferences: Record<
        NotificationCategory,
        Partial<NotificationContracts.CategoryPreferenceServerDTO>
      >;
      doNotDisturbConfig: Partial<NotificationContracts.DoNotDisturbConfigServerDTO>;
    }>,
  ): Promise<NotificationPreferenceClientDTO> {
    if (updates.channelPreferences) {
      await this.preferenceService.updateChannels(accountUuid, updates.channelPreferences);
    }
    if (updates.categoryPreferences) {
      for (const [category, preference] of Object.entries(updates.categoryPreferences)) {
        await this.preferenceService.updateCategoryPreference(
          accountUuid,
          category as NotificationCategory,
          preference,
        );
      }
    }
    if (updates.doNotDisturbConfig) {
      const pref = await this.preferenceService.getOrCreatePreference(accountUuid);
      const currentDnd = pref.doNotDisturb;
      if (currentDnd) {
        const newDnd = { ...currentDnd, ...updates.doNotDisturbConfig };

        if (newDnd.enabled && newDnd.startTime && newDnd.endTime && newDnd.daysOfWeek) {
          await this.preferenceService.enableDoNotDisturb(
            accountUuid,
            newDnd.startTime,
            newDnd.endTime,
            newDnd.daysOfWeek,
          );
        } else if (newDnd.enabled === false) {
          await this.preferenceService.disableDoNotDisturb(accountUuid);
        }
      }
    }

    const preference = await this.preferenceService.getOrCreatePreference(accountUuid);
    return toNotificationPreferenceClientDTO(preference.toServerDTO());
  }
}
