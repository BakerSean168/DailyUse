/**
 * ReminderGroup 聚合根实现 (Client)
 */

import { ReminderContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import * as ValueObjects from '../value-objects';

type ReminderGroupClientDTO = ReminderContracts.ReminderGroupClientDTO;
type ReminderGroupServerDTO = ReminderContracts.ReminderGroupServerDTO;
type GroupStatsClient = ReminderContracts.GroupStatsClient;
type ControlMode = ReminderContracts.ControlMode;
type ReminderStatus = ReminderContracts.ReminderStatus;

const ControlMode = ReminderContracts.ControlMode;
const ReminderStatus = ReminderContracts.ReminderStatus;

export class ReminderGroupClient extends AggregateRoot 
  implements ReminderContracts.ReminderGroupClient {
  
  private _accountUuid: string;
  private _name: string;
  private _description?: string | null;
  private _color?: string | null;
  private _icon?: string | null;
  private _controlMode: ControlMode;
  private _enabled: boolean;
  private _status: ReminderStatus;
  private _order: number;
  private _stats: ValueObjects.GroupStatsClient;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;

  private constructor(params: {
    uuid: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    controlMode: ControlMode;
    enabled: boolean;
    status: ReminderStatus;
    order: number;
    stats: ValueObjects.GroupStatsClient;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid);
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description;
    this._color = params.color;
    this._icon = params.icon;
    this._controlMode = params.controlMode;
    this._enabled = params.enabled;
    this._status = params.status;
    this._order = params.order;
    this._stats = params.stats;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ========== 基础属性 Getters ==========
  
  public override get uuid(): string { return this._uuid; }
  public get accountUuid(): string { return this._accountUuid; }
  public get name(): string { return this._name; }
  public get description(): string | null | undefined { return this._description; }
  public get color(): string | null | undefined { return this._color; }
  public get icon(): string | null | undefined { return this._icon; }
  public get controlMode(): ControlMode { return this._controlMode; }
  public get enabled(): boolean { return this._enabled; }
  public get status(): ReminderStatus { return this._status; }
  public get order(): number { return this._order; }
  public get stats(): ValueObjects.GroupStatsClient { return this._stats; }
  public get createdAt(): number { return this._createdAt; }
  public get updatedAt(): number { return this._updatedAt; }
  public get deletedAt(): number | null | undefined { return this._deletedAt; }
  
  // ========== UI 扩展属性 ==========
  
  public get displayName(): string {
    return this._name || '未命名分组';
  }
  
  public get controlModeText(): string {
    return this._controlMode === ControlMode.GROUP ? '组控制' : '个体控制';
  }
  
  public get statusText(): string {
    return this._status === ReminderStatus.ACTIVE ? '活跃' : '已暂停';
  }
  
  public get templateCountText(): string {
    return this._stats.templateCountText;
  }
  
  public get activeStatusText(): string {
    return this._stats.activeStatusText;
  }
  
  public get controlDescription(): string {
    return this._controlMode === ControlMode.GROUP 
      ? '所有提醒统一启用' 
      : '提醒独立控制';
  }

  // ========== UI 业务方法 ==========

  public getStatusBadge(): { text: string; color: string } {
    return this._status === ReminderStatus.ACTIVE
      ? { text: '活跃', color: 'success' }
      : { text: '已暂停', color: 'warning' };
  }

  public getControlModeBadge(): { text: string; color: string; icon: string } {
    return this._controlMode === ControlMode.GROUP
      ? { text: '组控制', color: 'primary', icon: 'mdi-group' }
      : { text: '个体控制', color: 'info', icon: 'mdi-account' };
  }

  public getIcon(): string {
    return this._icon || 'mdi-folder';
  }

  public getColorStyle(): string {
    return this._color || '#2196F3';
  }

  public canSwitchMode(): boolean {
    return true;
  }

  public canEnableAll(): boolean {
    return !this._enabled && this._controlMode === ControlMode.GROUP;
  }

  public canPauseAll(): boolean {
    return this._enabled && this._controlMode === ControlMode.GROUP;
  }

  public canEdit(): boolean {
    return !this._deletedAt;
  }

  public canDelete(): boolean {
    return !this._deletedAt && this._stats.totalTemplates === 0;
  }

  public hasTemplates(): boolean {
    return this._stats.totalTemplates > 0;
  }

  public isGroupControlled(): boolean {
    return this._controlMode === ControlMode.GROUP;
  }

  // ========== 转换方法 ==========
  
  public toClientDTO(): ReminderGroupClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      color: this._color,
      icon: this._icon,
      controlMode: this._controlMode,
      enabled: this._enabled,
      status: this._status,
      order: this._order,
      stats: this._stats.toClientDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      displayName: this.displayName,
      controlModeText: this.controlModeText,
      statusText: this.statusText,
      templateCountText: this.templateCountText,
      activeStatusText: this.activeStatusText,
      controlDescription: this.controlDescription,
    };
  }
  
  public toServerDTO(): ReminderGroupServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      color: this._color,
      icon: this._icon,
      controlMode: this._controlMode,
      enabled: this._enabled,
      status: this._status,
      order: this._order,
      stats: this._stats.toServerDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  // ========== 静态工厂方法 ==========
  
  public static fromServerDTO(dto: ReminderGroupServerDTO): ReminderGroupClient {
    return new ReminderGroupClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      controlMode: dto.controlMode,
      enabled: dto.enabled,
      status: dto.status,
      order: dto.order,
      stats: ValueObjects.GroupStatsClient.fromServerDTO(dto.stats),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }
  
  public static fromClientDTO(dto: ReminderGroupClientDTO): ReminderGroupClient {
    return new ReminderGroupClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      controlMode: dto.controlMode,
      enabled: dto.enabled,
      status: dto.status,
      order: dto.order,
      stats: ValueObjects.GroupStatsClient.fromClientDTO(dto.stats),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }
}
