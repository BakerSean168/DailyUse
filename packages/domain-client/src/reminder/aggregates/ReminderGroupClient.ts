/**
 * ReminderGroup 聚合根实现 (Client)
 */

import { ReminderContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';

type ReminderGroupClientDTO = ReminderContracts.ReminderGroupClientDTO;
type ReminderGroupServerDTO = ReminderContracts.ReminderGroupServerDTO;
type GroupControlMode = ReminderContracts.GroupControlMode;

const GroupControlMode = ReminderContracts.GroupControlMode;

export class ReminderGroupClient extends AggregateRoot 
  implements ReminderContracts.ReminderGroupClient {
  
  private _dto: ReminderGroupClientDTO;

  private constructor(dto: ReminderGroupClientDTO) {
    super(dto.uuid);
    this._dto = dto;
  }

  // ========== 简单属性代理 ==========
  
  public override get uuid(): string { return this._dto.uuid; }
  public get accountUuid(): string { return this._dto.accountUuid; }
  public get name(): string { return this._dto.name; }
  public get description(): string | null | undefined { return this._dto.description; }
  public get enabled(): boolean { return this._dto.enabled; }
  public get controlMode(): GroupControlMode { return this._dto.controlMode; }
  public get color(): string | null | undefined { return this._dto.color; }
  public get icon(): string | null | undefined { return this._dto.icon; }
  public get sortOrder(): number { return this._dto.sortOrder; }
  public get createdAt(): number { return this._dto.createdAt; }
  public get updatedAt(): number { return this._dto.updatedAt; }
  public get deletedAt(): number | null | undefined { return this._dto.deletedAt; }
  
  // UI 扩展属性
  public get displayName(): string { return this._dto.displayName; }
  public get statusText(): string { return this._dto.statusText; }
  public get controlModeText(): string { return this._dto.controlModeText; }

  // ========== 转换方法 ==========
  
  public toClientDTO(): ReminderGroupClientDTO {
    return this._dto;
  }
  
  public toServerDTO(): ReminderGroupServerDTO {
    return {
      uuid: this._dto.uuid,
      accountUuid: this._dto.accountUuid,
      name: this._dto.name,
      description: this._dto.description,
      enabled: this._dto.enabled,
      controlMode: this._dto.controlMode,
      color: this._dto.color,
      icon: this._dto.icon,
      sortOrder: this._dto.sortOrder,
      createdAt: this._dto.createdAt,
      updatedAt: this._dto.updatedAt,
      deletedAt: this._dto.deletedAt,
    };
  }

  // ========== 静态工厂方法 ==========
  
  public static fromServerDTO(dto: ReminderGroupServerDTO): ReminderGroupClient {
    const clientDTO: ReminderGroupClientDTO = {
      ...dto,
      displayName: dto.name || '未命名分组',
      statusText: dto.enabled ? '已启用' : '已禁用',
      controlModeText: dto.controlMode === GroupControlMode.GROUP ? '组控制' : '独立控制',
    };
    return new ReminderGroupClient(clientDTO);
  }
  
  public static fromClientDTO(dto: ReminderGroupClientDTO): ReminderGroupClient {
    return new ReminderGroupClient(dto);
  }
}
