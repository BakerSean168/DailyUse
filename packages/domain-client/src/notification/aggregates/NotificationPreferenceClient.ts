/**
 * NotificationPreference 聚合根实现 (Client)
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { NotificationContracts as NC } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { CategoryPreferenceClient, RateLimitClient } from '../value-objects';

type INotificationPreferenceClient = NotificationContracts.NotificationPreferenceClient;
type NotificationPreferenceClientDTO = NotificationContracts.NotificationPreferenceClientDTO;
type NotificationPreferenceServerDTO = NotificationContracts.NotificationPreferenceServerDTO;
type DoNotDisturbConfigClientDTO = NotificationContracts.DoNotDisturbConfigClientDTO;
type ChannelPreferences = NotificationContracts.ChannelPreferences;
type CategoryPreferences = NotificationContracts.CategoryPreferences;

/**
 * NotificationPreference 聚合根 (Client)
 */
export class NotificationPreferenceClient
  extends AggregateRoot
  implements INotificationPreferenceClient
{
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _enabled: boolean;
  private _channels: ChannelPreferences;
  private _categories: {
    task: CategoryPreferenceClient;
    goal: CategoryPreferenceClient;
    schedule: CategoryPreferenceClient;
    reminder: CategoryPreferenceClient;
    account: CategoryPreferenceClient;
    system: CategoryPreferenceClient;
  };
  private _doNotDisturb?: DoNotDisturbConfigClientDTO | null;
  private _rateLimit?: RateLimitClient | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    enabled: boolean;
    channels: ChannelPreferences;
    categories: {
      task: CategoryPreferenceClient;
      goal: CategoryPreferenceClient;
      schedule: CategoryPreferenceClient;
      reminder: CategoryPreferenceClient;
      account: CategoryPreferenceClient;
      system: CategoryPreferenceClient;
    };
    doNotDisturb?: DoNotDisturbConfigClientDTO | null;
    rateLimit?: RateLimitClient | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._enabled = params.enabled;
    this._channels = params.channels;
    this._categories = params.categories;
    this._doNotDisturb = params.doNotDisturb;
    this._rateLimit = params.rateLimit;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get enabled(): boolean {
    return this._enabled;
  }
  public get channels(): ChannelPreferences {
    return { ...this._channels };
  }
  public get categories(): {
    task: CategoryPreferenceClient;
    goal: CategoryPreferenceClient;
    schedule: CategoryPreferenceClient;
    reminder: CategoryPreferenceClient;
    account: CategoryPreferenceClient;
    system: CategoryPreferenceClient;
  } {
    return { ...this._categories };
  }
  public get doNotDisturb(): DoNotDisturbConfigClientDTO | null | undefined {
    return this._doNotDisturb;
  }
  public get rateLimit(): RateLimitClient | null | undefined {
    return this._rateLimit;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== UI 计算属性 =====

  public get isAllEnabled(): boolean {
    return (
      this._enabled &&
      this._channels.inApp &&
      this._channels.email &&
      this._channels.push &&
      this._channels.sms
    );
  }

  public get isAllDisabled(): boolean {
    return (
      !this._enabled ||
      (!this._channels.inApp &&
        !this._channels.email &&
        !this._channels.push &&
        !this._channels.sms)
    );
  }

  public get hasDoNotDisturb(): boolean {
    return Boolean(this._doNotDisturb);
  }

  public get isInDoNotDisturbPeriod(): boolean {
    if (!this._doNotDisturb || !this._doNotDisturb.enabled) return false;

    // startTime 和 endTime 是 "HH:mm" 格式的字符串
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = this._doNotDisturb.startTime.split(':').map(Number);
    const [endHour, endMin] = this._doNotDisturb.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // 跨夜
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  public get enabledChannelsCount(): number {
    let count = 0;
    if (this._channels.inApp) count++;
    if (this._channels.email) count++;
    if (this._channels.push) count++;
    if (this._channels.sms) count++;
    return count;
  }

  public get formattedCreatedAt(): string {
    return this.formatDateTime(this._createdAt);
  }

  public get formattedUpdatedAt(): string {
    return this.formatDateTime(this._updatedAt);
  }

  // ===== UI 业务方法 =====

  public getEnabledChannels(): string[] {
    const channels: string[] = [];
    if (this._channels.inApp) channels.push('应用内');
    if (this._channels.email) channels.push('邮件');
    if (this._channels.push) channels.push('推送');
    if (this._channels.sms) channels.push('短信');
    return channels;
  }

  public getDoNotDisturbText(): string {
    if (!this._doNotDisturb || !this._doNotDisturb.enabled) {
      return '未设置';
    }
    return `${this._doNotDisturb.startTime} - ${this._doNotDisturb.endTime}`;
  }

  public getRateLimitText(): string {
    if (!this._rateLimit || !this._rateLimit.enabled) {
      return '无限制';
    }
    return `${this._rateLimit.maxPerHour || '不限'} 条/小时, ${this._rateLimit.maxPerDay || '不限'} 条/天`;
  }

  public canSendNotification(category: string, type: string, channel: string): boolean {
    // 全局开关
    if (!this._enabled) return false;

    // 渠道开关
    const channelKey = channel as keyof ChannelPreferences;
    if (channelKey in this._channels && !this._channels[channelKey]) {
      return false;
    }

    // 分类开关
    const categoryKey = category as keyof typeof this._categories;
    if (categoryKey in this._categories) {
      const categoryPref = this._categories[categoryKey];
      if (!categoryPref.enabled) return false;

      // 检查渠道偏好
      if (channel === 'inApp' && !categoryPref.channels.inApp) return false;
      if (channel === 'email' && !categoryPref.channels.email) return false;
      if (channel === 'push' && !categoryPref.channels.push) return false;
      if (channel === 'sms' && !categoryPref.channels.sms) return false;
    }

    // 免打扰检查
    if (this.isInDoNotDisturbPeriod) return false;

    return true;
  }

  public clone(): NotificationPreferenceClient {
    return new NotificationPreferenceClient({
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      enabled: this._enabled,
      channels: { ...this._channels },
      categories: { ...this._categories },
      doNotDisturb: this._doNotDisturb,
      rateLimit: this._rateLimit,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): NotificationPreferenceClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      enabled: this.enabled,
      channels: this.channels,
      categories: {
        task: this._categories.task.toClientDTO(),
        goal: this._categories.goal.toClientDTO(),
        schedule: this._categories.schedule.toClientDTO(),
        reminder: this._categories.reminder.toClientDTO(),
        account: this._categories.account.toClientDTO(),
        system: this._categories.system.toClientDTO(),
      },
      doNotDisturb: this.doNotDisturb,
      rateLimit: this._rateLimit?.toClientDTO() ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isAllEnabled: this.isAllEnabled,
      isAllDisabled: this.isAllDisabled,
      hasDoNotDisturb: this.hasDoNotDisturb,
      isInDoNotDisturbPeriod: this.isInDoNotDisturbPeriod,
      enabledChannelsCount: this.enabledChannelsCount,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
    };
  }

  public toServerDTO(): NotificationPreferenceServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      enabled: this.enabled,
      channels: this.channels,
      categories: {
        task: this._categories.task.toServerDTO() as any,
        goal: this._categories.goal.toServerDTO() as any,
        schedule: this._categories.schedule.toServerDTO() as any,
        reminder: this._categories.reminder.toServerDTO() as any,
        account: this._categories.account.toServerDTO() as any,
        system: this._categories.system.toServerDTO() as any,
      },
      doNotDisturb: this.doNotDisturb as any,
      rateLimit: (this._rateLimit?.toServerDTO() as any) ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    accountUuid: string;
    enabled?: boolean;
    channels?: Partial<ChannelPreferences>;
    categories?: Partial<CategoryPreferences>;
  }): NotificationPreferenceClient {
    const defaultCategoryPref = CategoryPreferenceClient.fromClientDTO({
      enabled: true,
      channels: { inApp: true, email: true, push: true, sms: false },
      importance: [],
      enabledChannelsCount: 3,
      enabledChannelsList: ['应用内', '邮件', '推送'],
      importanceText: '所有',
    });

    return new NotificationPreferenceClient({
      accountUuid: params.accountUuid,
      enabled: params.enabled ?? true,
      channels: {
        inApp: params.channels?.inApp ?? true,
        email: params.channels?.email ?? true,
        push: params.channels?.push ?? true,
        sms: params.channels?.sms ?? false,
      },
      categories: {
        task: defaultCategoryPref,
        goal: defaultCategoryPref,
        schedule: defaultCategoryPref,
        reminder: defaultCategoryPref,
        account: defaultCategoryPref,
        system: defaultCategoryPref,
      },
      doNotDisturb: null,
      rateLimit: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  public static forCreate(accountUuid: string): NotificationPreferenceClient {
    return NotificationPreferenceClient.create({ accountUuid });
  }

  public static fromClientDTO(dto: NotificationPreferenceClientDTO): NotificationPreferenceClient {
    return new NotificationPreferenceClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      enabled: dto.enabled,
      channels: dto.channels,
      categories: {
        task: CategoryPreferenceClient.fromClientDTO(dto.categories.task),
        goal: CategoryPreferenceClient.fromClientDTO(dto.categories.goal),
        schedule: CategoryPreferenceClient.fromClientDTO(dto.categories.schedule),
        reminder: CategoryPreferenceClient.fromClientDTO(dto.categories.reminder),
        account: CategoryPreferenceClient.fromClientDTO(dto.categories.account),
        system: CategoryPreferenceClient.fromClientDTO(dto.categories.system),
      },
      doNotDisturb: dto.doNotDisturb,
      rateLimit: dto.rateLimit ? RateLimitClient.fromClientDTO(dto.rateLimit) : null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromServerDTO(dto: NotificationPreferenceServerDTO): NotificationPreferenceClient {
    return new NotificationPreferenceClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      enabled: dto.enabled,
      channels: dto.channels,
      categories: {
        task: CategoryPreferenceClient.fromServerDTO(dto.categories.task),
        goal: CategoryPreferenceClient.fromServerDTO(dto.categories.goal),
        schedule: CategoryPreferenceClient.fromServerDTO(dto.categories.schedule),
        reminder: CategoryPreferenceClient.fromServerDTO(dto.categories.reminder),
        account: CategoryPreferenceClient.fromServerDTO(dto.categories.account),
        system: CategoryPreferenceClient.fromServerDTO(dto.categories.system),
      },
      doNotDisturb: dto.doNotDisturb as any,
      rateLimit: dto.rateLimit ? RateLimitClient.fromServerDTO(dto.rateLimit) : null,
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

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
