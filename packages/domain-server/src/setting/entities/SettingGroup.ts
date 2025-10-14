/**
 * SettingGroup Entity - Server Implementation
 * 设置分组实体 - 服务端实现
 */

import { Entity } from '@dailyuse/utils';
import type { SettingContracts } from '@dailyuse/contracts';
import { SettingItem } from './SettingItem';

type SettingGroupServerDTO = SettingContracts.SettingGroupServerDTO;
type SettingGroupPersistenceDTO = SettingContracts.SettingGroupPersistenceDTO;
type SettingGroupServer = SettingContracts.SettingGroupServer;

/**
 * 设置分组实体
 * 表示设置的层级分组结构
 */
export class SettingGroup extends Entity implements SettingGroupServer {
  private _name: string;
  private _description?: string | null;
  private _icon?: string | null;
  private _parentGroupUuid?: string | null;
  private _path: string;
  private _level: number;
  private _sortOrder: number;
  private _settings: SettingItem[];
  private _isSystemGroup: boolean;
  private _isCollapsed: boolean;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;

  private constructor(params: {
    uuid: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    parentGroupUuid?: string | null;
    path: string;
    level: number;
    sortOrder: number;
    settings: SettingItem[];
    isSystemGroup: boolean;
    isCollapsed: boolean;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid);
    this._name = params.name;
    this._description = params.description;
    this._icon = params.icon;
    this._parentGroupUuid = params.parentGroupUuid;
    this._path = params.path;
    this._level = params.level;
    this._sortOrder = params.sortOrder;
    this._settings = params.settings;
    this._isSystemGroup = params.isSystemGroup;
    this._isCollapsed = params.isCollapsed;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ============ Getters ============

  public get name(): string {
    return this._name;
  }

  public get description(): string | null | undefined {
    return this._description;
  }

  public get icon(): string | null | undefined {
    return this._icon;
  }

  public get parentGroupUuid(): string | null | undefined {
    return this._parentGroupUuid;
  }

  public get path(): string {
    return this._path;
  }

  public get level(): number {
    return this._level;
  }

  public get sortOrder(): number {
    return this._sortOrder;
  }

  public get settings(): SettingItem[] | null | undefined {
    return this._settings.length > 0 ? this._settings : null;
  }

  public get isSystemGroup(): boolean {
    return this._isSystemGroup;
  }

  public get isCollapsed(): boolean {
    return this._isCollapsed;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  public get deletedAt(): number | null | undefined {
    return this._deletedAt;
  }

  // ============ 业务方法 ============

  /**
   * 添加设置项
   */
  public addSetting(setting: SettingItem): void {
    // 检查是否已存在
    const exists = this._settings.some((s) => s.uuid === setting.uuid);
    if (exists) {
      throw new Error(`Setting ${setting.uuid} already exists in group`);
    }

    this._settings.push(setting);
    this._updatedAt = Date.now();
  }

  /**
   * 移除设置项
   */
  public removeSetting(settingUuid: string): void {
    const index = this._settings.findIndex((s) => s.uuid === settingUuid);
    if (index === -1) {
      throw new Error(`Setting ${settingUuid} not found in group`);
    }

    this._settings.splice(index, 1);
    this._updatedAt = Date.now();
  }

  /**
   * 重新排序设置项
   */
  public reorderSettings(settingUuids: string[]): void {
    // 验证所有 UUID 都存在
    const allUuids = new Set(this._settings.map((s) => s.uuid));
    for (const uuid of settingUuids) {
      if (!allUuids.has(uuid)) {
        throw new Error(`Setting ${uuid} not found in group`);
      }
    }

    // 重新排序
    const orderedSettings: SettingItem[] = [];
    for (const uuid of settingUuids) {
      const setting = this._settings.find((s) => s.uuid === uuid)!;
      orderedSettings.push(setting);
    }

    this._settings = orderedSettings;
    this._updatedAt = Date.now();
  }

  /**
   * 获取所有设置项
   */
  public getSettings(): SettingItem[] {
    return [...this._settings];
  }

  /**
   * 根据 key 获取设置项
   */
  public getSettingByKey(key: string): SettingItem | null {
    return this._settings.find((s) => s.key === key) ?? null;
  }

  /**
   * 折叠分组
   */
  public collapse(): void {
    this._isCollapsed = true;
    this._updatedAt = Date.now();
  }

  /**
   * 展开分组
   */
  public expand(): void {
    this._isCollapsed = false;
    this._updatedAt = Date.now();
  }

  /**
   * 软删除
   */
  public softDelete(): void {
    if (this._deletedAt) return;
    this._deletedAt = Date.now();
    this._updatedAt = this._deletedAt;
  }

  /**
   * 恢复
   */
  public restore(): void {
    this._deletedAt = null;
    this._updatedAt = Date.now();
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): SettingGroupServerDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      parentGroupUuid: this._parentGroupUuid,
      path: this._path,
      level: this._level,
      sortOrder: this._sortOrder,
      settings: this._settings.length > 0 ? this._settings.map((s) => s.toServerDTO()) : null,
      isSystemGroup: this._isSystemGroup,
      isCollapsed: this._isCollapsed,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): SettingGroupPersistenceDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      parent_group_uuid: this._parentGroupUuid,
      path: this._path,
      level: this._level,
      sort_order: this._sortOrder,
      settings: JSON.stringify(this._settings.map((s) => s.toServerDTO())),
      is_system_group: this._isSystemGroup,
      is_collapsed: this._isCollapsed,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      deleted_at: this._deletedAt,
    };
  }

  // ============ 工厂方法 ============

  /**
   * 创建新的设置分组
   */
  public static create(params: {
    name: string;
    description?: string;
    icon?: string;
    parentGroupUuid?: string;
    path: string;
    level: number;
    sortOrder?: number;
    isSystemGroup?: boolean;
  }): SettingGroup {
    const now = Date.now();
    return new SettingGroup({
      uuid: crypto.randomUUID(),
      name: params.name,
      description: params.description,
      icon: params.icon,
      parentGroupUuid: params.parentGroupUuid,
      path: params.path,
      level: params.level,
      sortOrder: params.sortOrder ?? 0,
      settings: [],
      isSystemGroup: params.isSystemGroup ?? false,
      isCollapsed: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  public static fromServerDTO(dto: SettingGroupServerDTO): SettingGroup {
    return new SettingGroup({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      parentGroupUuid: dto.parentGroupUuid,
      path: dto.path,
      level: dto.level,
      sortOrder: dto.sortOrder,
      settings: dto.settings ? dto.settings.map((s) => SettingItem.fromServerDTO(s)) : [],
      isSystemGroup: dto.isSystemGroup,
      isCollapsed: dto.isCollapsed,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  public static fromPersistenceDTO(dto: SettingGroupPersistenceDTO): SettingGroup {
    const settingsData = JSON.parse(dto.settings);
    return new SettingGroup({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      parentGroupUuid: dto.parent_group_uuid,
      path: dto.path,
      level: dto.level,
      sortOrder: dto.sort_order,
      settings: Array.isArray(settingsData)
        ? settingsData.map((s) => SettingItem.fromServerDTO(s))
        : [],
      isSystemGroup: dto.is_system_group,
      isCollapsed: dto.is_collapsed,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      deletedAt: dto.deleted_at,
    });
  }
}
