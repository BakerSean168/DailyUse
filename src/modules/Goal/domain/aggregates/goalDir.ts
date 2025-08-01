import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import type { IGoalDir } from "@common/modules/goal";
import { isValid } from "date-fns";

/**
 * 目标目录领域实体
 * 负责目标目录的业务逻辑和数据管理
 */
export class GoalDir extends AggregateRoot implements IGoalDir {
  private _name: string;
  private _description?: string;
  private _icon: string;
  private _color: string = 'default-color'; // 默认颜色
  private _sortConfig: {
    sortKey: string;
    sortOrder: number;
  } = {
    sortKey: 'default',
    sortOrder: 0,
  };
  private _parentUuid?: string;
  private _lifecycle: IGoalDir['lifecycle'];

  constructor(params: {
    uuid?: string;
    name?: string;
    icon?: string;
    color?: string;
    description?: string;
    parentUuid?: string;
  }) {
    super(params.uuid || GoalDir.generateId());
    const now = new Date();

    this._name = params.name || '';
    this._icon = params.icon || 'mdi-folder'; // 默认图标
    this._parentUuid = params.parentUuid;
    this._color = params.color || 'default-color';
    this._description = params.description || '';
    this._sortConfig = {
      sortKey: 'default',
      sortOrder: 0,
    };
    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
      status: "active",
    };
  }

  // Getters
  get uuid(): string {
    return this._uuid;
  }
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    if (!value.trim()) throw new Error("目录名称不能为空");
    this._name = value;
    this._lifecycle.updatedAt = new Date();
  }

  get description(): string | undefined {
    return this._description;
  }
  set description(value: string | undefined) {
    this._description = value;
    this._lifecycle.updatedAt = new Date();
  }

  get icon(): string {
    return this._icon;
  }
  set icon(value: string) {
    this._icon = value;
    this._lifecycle.updatedAt = new Date();
  }

  get parentUuid(): string | undefined {
    return this._parentUuid;
  }
  set parentUuid(value: string | undefined) {
    if (value === this.uuid) throw new Error("目录不能设置自己为父目录");
    this._parentUuid = value;
    this._lifecycle.updatedAt = new Date();
  }

  get color(): string {
    return this._color;
  }
  set color(value: string) {
    this._color = value;
    this._lifecycle.updatedAt = new Date();
  }

  get sortConfig(): { sortKey: string; sortOrder: number } {
    return this._sortConfig;
  }
  set sortConfig(value: { sortKey: string; sortOrder: number }) {
    if (!value.sortKey) throw new Error("排序键不能为空");
    this._sortConfig = value;
    this._lifecycle.updatedAt = new Date();
  }

  get lifecycle(): IGoalDir['lifecycle'] {
    return this._lifecycle;
  }



  /**
   * 保证返回 GoalDir 实例或 null
   * @param dir 可能为 DTO、实体或 null
   */
  static ensureGoalDir(dir: IGoalDir | GoalDir | null): GoalDir | null {
    if (GoalDir.isGoalDir(dir)) {
      return dir instanceof GoalDir ? dir : GoalDir.fromDTO(dir);
    } else {
      return null;
    }
  }

  /**
   * 保证返回 GoalDir 实例，永不为 null
   * @param dir 可能为 DTO、实体或 null
   */
  static ensureGoalDirNeverNull(dir: IGoalDir | GoalDir | null): GoalDir {
    if (GoalDir.isGoalDir(dir)) {
      return dir instanceof GoalDir ? dir : GoalDir.fromDTO(dir);
    } else {
      return GoalDir.forCreate();
    }
  }

  /**
   * 判断对象是否为 GoalDir 或 IGoalDir
   */
  static isGoalDir(obj: any): obj is GoalDir | IGoalDir {
    return obj instanceof GoalDir || (obj && typeof obj === 'object' && 'uuid' in obj && 'name' in obj && 'icon' in obj);
  }
  
  /**
   * 转换为数据传输对象
   */
  toDTO(): IGoalDir {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      sortConfig: { ...this._sortConfig },
      parentUuid: this._parentUuid,
      lifecycle: { ...this._lifecycle },
    };
  }

  /**
   * 从数据传输对象创建目录实例
   */
  static fromDTO(data: IGoalDir): GoalDir {
    const goalDir = new GoalDir({
      uuid: data.uuid,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color || 'default-color',
      parentUuid: data.parentUuid,
    });
    goalDir._sortConfig = {
      sortKey: data.sortConfig.sortKey || 'default',
      sortOrder: data.sortConfig.sortOrder || 0,
    };
    goalDir._lifecycle = {
      createdAt: isValid(data.lifecycle.createdAt) ? data.lifecycle.createdAt : new Date(),
      updatedAt: isValid(data.lifecycle.updatedAt) ? data.lifecycle.updatedAt : new Date(),
      status: data.lifecycle.status || "active",
    };
    return goalDir;
  }

  /**
   * 从创建数据传输对象创建目录
   */
  static forCreate(): GoalDir {
    return new GoalDir({
      name: '',
      icon: 'mdi-folder',
      parentUuid: undefined,
    });
  }

  clone(): GoalDir {
    const goalDir = new GoalDir({
      uuid: this.uuid,
      name: this._name,
      icon: this._icon,
      parentUuid: this._parentUuid,
    });
    goalDir._lifecycle = { ...this._lifecycle };
    return goalDir;
  }

  /**
   * 验证目录数据
   */
  static validate(data: IGoalDir): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push("目录名称不能为空");
    }

    if (!data.icon?.trim()) {
      errors.push("目录图标不能为空");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}