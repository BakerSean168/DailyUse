/**
 * ReminderGroup 聚合根实现 (Client)
 */

import {
  ControlMode,
  ReminderStatus,
} from '@dailyuse/contracts/reminder';
import type {
  ReminderGroupClient,
  ReminderGroupClientDTO,
  ReminderGroupServerDTO,
} from '@dailyuse/contracts/reminder';
import { AggregateRoot } from '@dailyuse/utils';
import * as ValueObjects from '../value-objects';

// 枚举常量使用 Enum 后缀，避免与类型名冲突

export class ReminderGroup extends AggregateRoot 
  implements ReminderGroupClient {
  
  private _accountUuid: string;
  private _name: string;
  private _description?: string | null;
  private _color?: string | null;
  private _icon?: string | null;
  private _controlMode: ControlMode;
  private _enabled: boolean;
  private _status: ReminderStatus;
  private _order: number;
  private _stats: ValueObjects.GroupStats;
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
    stats: ValueObjects.GroupStats;
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
  public get stats(): ValueObjects.GroupStats { return this._stats; }
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

  // ========== 修改方法 ==========
  
  public updateName(name: string): void {
    this._name = name;
    this._updatedAt = Date.now();
  }
  
  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
  }
  
  public updateColor(color: string | null): void {
    this._color = color;
    this._updatedAt = Date.now();
  }
  
  public updateIcon(icon: string | null): void {
    this._icon = icon;
    this._updatedAt = Date.now();
  }
  
  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this._status = enabled ? ReminderStatus.ACTIVE : ReminderStatus.PAUSED;
    this._updatedAt = Date.now();
  }
  
  public setEnableMode(mode: ControlMode): void {
    this._controlMode = mode;
    this._updatedAt = Date.now();
  }
  
  public switchControlMode(): void {
    this._controlMode = this._controlMode === ControlMode.GROUP 
      ? ControlMode.INDIVIDUAL 
      : ControlMode.GROUP;
    this._updatedAt = Date.now();
  }
  
  public enable(): void {
    this._enabled = true;
    this._status = ReminderStatus.ACTIVE;
    this._updatedAt = Date.now();
  }
  
  public pause(): void {
    this._enabled = false;
    this._status = ReminderStatus.PAUSED;
    this._updatedAt = Date.now();
  }
  
  public toggleEnabled(): void {
    this._enabled = !this._enabled;
    this._status = this._enabled ? ReminderStatus.ACTIVE : ReminderStatus.PAUSED;
    this._updatedAt = Date.now();
  }
  
  public updateOrder(order: number): void {
    this._order = order;
    this._updatedAt = Date.now();
  }
  
  public updateStats(stats: ValueObjects.GroupStats): void {
    this._stats = stats;
    this._updatedAt = Date.now();
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
  
  public static fromServerDTO(dto: ReminderGroupServerDTO): ReminderGroup {
    return new ReminderGroup({
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
      stats: ValueObjects.GroupStats.fromServerDTO(dto.stats),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }
  
  public static fromClientDTO(dto: ReminderGroupClientDTO): ReminderGroup {
    return new ReminderGroup({
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
      stats: ValueObjects.GroupStats.fromClientDTO(dto.stats),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }
}
