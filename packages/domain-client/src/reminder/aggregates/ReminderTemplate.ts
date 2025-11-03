/**
 * ReminderTemplate 聚合根实现 (Client)
 * 参考 GoalClient 架构
 */

import { ReminderContracts, ImportanceLevel } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import * as ValueObjects from '../value-objects';

// 类型别名
type ReminderTemplateDTO = ReminderContracts.ReminderTemplateDTO;
type ReminderTemplateServerDTO = ReminderContracts.ReminderTemplateServerDTO;
type ReminderType = ReminderContracts.ReminderType;
type ReminderStatus = ReminderContracts.ReminderStatus;
type TriggerConfigClient = ReminderContracts.TriggerConfigClient;
type TriggerConfigClientDTO = ReminderContracts.TriggerConfigClientDTO;
type RecurrenceConfigClient = ReminderContracts.RecurrenceConfigClient;
type RecurrenceConfigClientDTO = ReminderContracts.RecurrenceConfigClientDTO;
type ActiveTimeConfigClient = ReminderContracts.ActiveTimeConfigClient;
type ActiveTimeConfigClientDTO = ReminderContracts.ActiveTimeConfigClientDTO;
type ActiveHoursConfigClient = ReminderContracts.ActiveHoursConfigClient;
type ActiveHoursConfigClientDTO = ReminderContracts.ActiveHoursConfigClientDTO;
type NotificationConfigClient = ReminderContracts.NotificationConfigClient;
type NotificationConfigClientDTO = ReminderContracts.NotificationConfigClientDTO;
type ReminderStatsClient = ReminderContracts.ReminderStatsClient;
type ReminderStatsClientDTO = ReminderContracts.ReminderStatsClientDTO;

// 枚举别名
const ReminderType = ReminderContracts.ReminderType;
const ReminderStatus = ReminderContracts.ReminderStatus;

export class ReminderTemplate extends AggregateRoot 
  implements ReminderContracts.ReminderTemplate {
  
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _title: string;
  private _description?: string | null;
  private _type: ReminderType;
  private _trigger: TriggerConfigClient;
  private _recurrence?: RecurrenceConfigClient | null;
  private _activeTime: ActiveTimeConfigClient;
  private _activeHours?: ActiveHoursConfigClient | null;
  private _notificationConfig: NotificationConfigClient;
  private _selfEnabled: boolean;
  private _status: ReminderStatus;
  private _groupUuid?: string | null;
  private _importanceLevel: ImportanceLevel;
  private _tags: string[];
  private _color?: string | null;
  private _icon?: string | null;
  private _nextTriggerAt?: number | null;
  private _stats: ReminderStatsClient;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    type: ReminderType;
    trigger: TriggerConfigClient;
    recurrence?: RecurrenceConfigClient | null;
    activeTime: ActiveTimeConfigClient;
    activeHours?: ActiveHoursConfigClient | null;
    notificationConfig: NotificationConfigClient;
    selfEnabled: boolean;
    status: ReminderStatus;
    groupUuid?: string | null;
    importanceLevel: ImportanceLevel;
    tags?: string[];
    color?: string | null;
    icon?: string | null;
    nextTriggerAt?: number | null;
    stats: ReminderStatsClient;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid || crypto.randomUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._type = params.type;
    this._trigger = params.trigger;
    this._recurrence = params.recurrence ?? null;
    this._activeTime = params.activeTime;
    this._activeHours = params.activeHours ?? null;
    this._notificationConfig = params.notificationConfig;
    this._selfEnabled = params.selfEnabled;
    this._status = params.status;
    this._groupUuid = params.groupUuid;
    this._importanceLevel = params.importanceLevel;
    this._tags = params.tags ?? [];
    this._color = params.color;
    this._icon = params.icon;
    this._nextTriggerAt = params.nextTriggerAt;
    this._stats = params.stats;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ===== Getters =====
  
  public override get uuid(): string { return this._uuid; }
  public get accountUuid(): string { return this._accountUuid; }
  public get title(): string { return this._title; }
  public get description(): string | null | undefined { return this._description; }
  public get type(): ReminderType { return this._type; }
  public get trigger(): TriggerConfigClient { return this._trigger; }
  public get recurrence(): RecurrenceConfigClient | null | undefined { return this._recurrence; }
  public get activeTime(): ActiveTimeConfigClient { return this._activeTime; }
  public get activeHours(): ActiveHoursConfigClient | null | undefined { return this._activeHours; }
  public get notificationConfig(): NotificationConfigClient { return this._notificationConfig; }
  public get selfEnabled(): boolean { return this._selfEnabled; }
  public get status(): ReminderStatus { return this._status; }
  public get effectiveEnabled(): boolean { return this._selfEnabled && this._status === ReminderStatus.ACTIVE; }
  public get groupUuid(): string | null | undefined { return this._groupUuid; }
  public get importanceLevel(): ImportanceLevel { return this._importanceLevel; }
  public get tags(): string[] { return [...this._tags]; }
  public get color(): string | null | undefined { return this._color; }
  public get icon(): string | null | undefined { return this._icon; }
  public get nextTriggerAt(): number | null | undefined { return this._nextTriggerAt; }
  public get stats(): ReminderStatsClient { return this._stats; }
  public get createdAt(): number { return this._createdAt; }
  public get updatedAt(): number { return this._updatedAt; }
  public get deletedAt(): number | null | undefined { return this._deletedAt; }

  // ===== UI 扩展属性 =====
  
  public get displayTitle(): string {
    return this._title || '未命名提醒';
  }
  
  public get typeText(): string {
    return this._type === ReminderType.ONE_TIME ? '一次性' : '循环';
  }
  
  public get triggerText(): string {
    return this._trigger.displayText;
  }
  
  public get recurrenceText(): string | null | undefined {
    return this._recurrence?.displayText;
  }
  
  public get statusText(): string {
    return this._status === ReminderStatus.ACTIVE ? '活跃' : '已暂停';
  }
  
  public get importanceText(): string {
    const map: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: '关键',
      [ImportanceLevel.Important]: '重要',
      [ImportanceLevel.Moderate]: '中等',
      [ImportanceLevel.Minor]: '次要',
      [ImportanceLevel.Trivial]: '琐碎',
    };
    return map[this._importanceLevel];
  }
  
  public get nextTriggerText(): string | null | undefined {
    if (!this._nextTriggerAt) return null;
    const diff = this._nextTriggerAt - Date.now();
    if (diff < 0) return '已过期';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟后`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时后`;
    return `${Math.floor(diff / 86400000)} 天后`;
  }
  
  public get isActive(): boolean {
    return this._status === ReminderStatus.ACTIVE && this._selfEnabled;
  }
  
  public get isPaused(): boolean {
    return this._status === ReminderStatus.PAUSED;
  }
  
  public get lastTriggeredText(): string | null | undefined {
    if (!this._stats.lastTriggeredAt) return null;
    const diff = Date.now() - this._stats.lastTriggeredAt;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  }
  
  public get controlledByGroup(): boolean {
    return !!this._groupUuid;
  }

  // ===== UI 业务方法 =====
  
  public getStatusBadge(): { text: string; color: string; icon: string } {
    if (this._status === ReminderStatus.ACTIVE) {
      return { text: '活跃', color: 'success', icon: 'mdi-check-circle' };
    } else {
      return { text: '已暂停', color: 'warning', icon: 'mdi-pause-circle' };
    }
  }
  
  public getImportanceBadge(): { text: string; color: string } {
    return { text: this.importanceText, color: 'info' };
  }
  
  public getTriggerDisplay(): string {
    return this.triggerText;
  }
  
  public getNextTriggerDisplay(): string {
    return this.nextTriggerText || '未设置';
  }
  
  public canEnable(): boolean {
    return !this._selfEnabled;
  }
  
  public canPause(): boolean {
    return this._selfEnabled && this._status === ReminderStatus.ACTIVE;
  }
  
  public canEdit(): boolean {
    return !this._deletedAt;
  }
  
  public canDelete(): boolean {
    return !this._deletedAt;
  }

  // ===== 修改方法 =====
  
  public updateTitle(title: string): void {
    this._title = title;
    this._updatedAt = Date.now();
  }
  
  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
  }
  
  public updateBasicInfo(params: {
    title?: string;
    description?: string | null;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    color?: string | null;
    icon?: string | null;
  }): void {
    if (params.title !== undefined) this._title = params.title;
    if (params.description !== undefined) this._description = params.description;
    if (params.importanceLevel !== undefined) this._importanceLevel = params.importanceLevel;
    if (params.tags !== undefined) this._tags = [...params.tags];
    if (params.color !== undefined) this._color = params.color;
    if (params.icon !== undefined) this._icon = params.icon;
    this._updatedAt = Date.now();
  }
  
  public updateTrigger(trigger: TriggerConfigClient): void {
    this._trigger = trigger;
    this._updatedAt = Date.now();
  }
  
  public updateRecurrence(recurrence: RecurrenceConfigClient | null): void {
    this._recurrence = recurrence;
    this._updatedAt = Date.now();
  }
  
  public toggleEnabled(): void {
    this._selfEnabled = !this._selfEnabled;
    this._status = this._selfEnabled ? ReminderStatus.ACTIVE : ReminderStatus.PAUSED;
    this._updatedAt = Date.now();
  }
  
  public enable(): void {
    this._selfEnabled = true;
    this._status = ReminderStatus.ACTIVE;
    this._updatedAt = Date.now();
  }
  
  public pause(): void {
    this._selfEnabled = false;
    this._status = ReminderStatus.PAUSED;
    this._updatedAt = Date.now();
  }

  // ===== 转换方法 =====
  
  public toClientDTO(): ReminderTemplateDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      type: this._type,
      trigger: this._trigger,
      recurrence: this._recurrence,
      activeTime: this._activeTime,
      activeHours: this._activeHours,
      notificationConfig: this._notificationConfig,
      selfEnabled: this._selfEnabled,
      status: this._status,
      effectiveEnabled: this.effectiveEnabled,
      groupUuid: this._groupUuid,
      importanceLevel: this._importanceLevel,
      tags: [...this._tags],
      color: this._color,
      icon: this._icon,
      nextTriggerAt: this._nextTriggerAt,
      stats: this._stats,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      history: null,
      displayTitle: this.displayTitle,
      typeText: this.typeText,
      triggerText: this.triggerText,
      recurrenceText: this.recurrenceText,
      statusText: this.statusText,
      importanceText: this.importanceText,
      nextTriggerText: this.nextTriggerText,
      isActive: this.isActive,
      isPaused: this.isPaused,
      lastTriggeredText: this.lastTriggeredText,
      controlledByGroup: this.controlledByGroup,
    };
  }
  
  public toServerDTO(): ReminderTemplateServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      type: this._type,
      trigger: this._trigger as any,
      recurrence: this._recurrence as any,
      activeTime: this._activeTime as any,
      activeHours: this._activeHours as any,
      notificationConfig: this._notificationConfig as any,
      selfEnabled: this._selfEnabled,
      status: this._status,
      groupUuid: this._groupUuid,
      importanceLevel: this._importanceLevel,
      tags: [...this._tags],
      color: this._color,
      icon: this._icon,
      nextTriggerAt: this._nextTriggerAt,
      stats: this._stats as any,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  // ===== 静态工厂方法 =====
  
  /**
   * 创建空白模板（用于前端新建）
   */
  public static forCreate(): ReminderTemplate {
    const now = Date.now();
    return new ReminderTemplate({
      uuid: crypto.randomUUID(),
      accountUuid: '', // 占位符
      title: '',
      description: null,
      type: ReminderType.ONE_TIME,
      trigger: ValueObjects.TriggerConfigClient.fromClientDTO({
        type: ReminderContracts.TriggerType.FIXED_TIME,
        fixedTime: { time: '09:00' },
        interval: null,
        displayText: '每天 09:00',
      }),
      recurrence: null,
      activeTime: ValueObjects.ActiveTimeConfigClient.fromClientDTO({
        startDate: now,
        endDate: null,
        displayText: '立即生效',
        isActive: true,
      }),
      activeHours: null,
      notificationConfig: ValueObjects.NotificationConfigClient.fromClientDTO({
        channels: [ReminderContracts.NotificationChannel.IN_APP],
        title: '',
        body: '',
        sound: null,
        vibration: null,
        actions: null,
        channelsText: '应用内通知',
        hasSoundEnabled: false,
        hasVibrationEnabled: false,
      }),
      selfEnabled: true,
      status: ReminderStatus.ACTIVE,
      groupUuid: null,
      importanceLevel: ImportanceLevel.Moderate,
      tags: [],
      color: null,
      icon: null,
      nextTriggerAt: null,
      stats: ValueObjects.ReminderStatsClient.fromClientDTO({
        totalTriggers: 0,
        lastTriggeredAt: null,
        totalTriggersText: '未触发',
        lastTriggeredText: null,
      }),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }
  
  /**
   * 从 ServerDTO 创建
   */
  public static fromServerDTO(dto: ReminderTemplateServerDTO): ReminderTemplate {
    return new ReminderTemplate({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      trigger: ValueObjects.TriggerConfigClient.fromServerDTO(dto.trigger as any),
      recurrence: dto.recurrence ? ValueObjects.RecurrenceConfigClient.fromServerDTO(dto.recurrence as any) : null,
      activeTime: ValueObjects.ActiveTimeConfigClient.fromServerDTO(dto.activeTime as any),
      activeHours: dto.activeHours ? ValueObjects.ActiveHoursConfigClient.fromServerDTO(dto.activeHours as any) : null,
      notificationConfig: ValueObjects.NotificationConfigClient.fromServerDTO(dto.notificationConfig as any),
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      groupUuid: dto.groupUuid,
      importanceLevel: dto.importanceLevel,
      tags: dto.tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt,
      stats: ValueObjects.ReminderStatsClient.fromServerDTO(dto.stats as any),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }
  
  /**
   * 从 ClientDTO 创建
   */
  public static fromClientDTO(dto: ReminderTemplateDTO): ReminderTemplate {
    return new ReminderTemplate({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      trigger: ValueObjects.TriggerConfigClient.fromClientDTO(dto.trigger),
      recurrence: dto.recurrence ? ValueObjects.RecurrenceConfigClient.fromClientDTO(dto.recurrence) : null,
      activeTime: ValueObjects.ActiveTimeConfigClient.fromClientDTO(dto.activeTime),
      activeHours: dto.activeHours ? ValueObjects.ActiveHoursConfigClient.fromClientDTO(dto.activeHours) : null,
      notificationConfig: ValueObjects.NotificationConfigClient.fromClientDTO(dto.notificationConfig),
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      groupUuid: dto.groupUuid,
      importanceLevel: dto.importanceLevel,
      tags: dto.tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt,
      stats: ValueObjects.ReminderStatsClient.fromClientDTO(dto.stats),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }
  
  /**
   * 克隆实例
   */
  public clone(): ReminderTemplate {
    return ReminderTemplate.fromClientDTO(this.toClientDTO());
  }
}
