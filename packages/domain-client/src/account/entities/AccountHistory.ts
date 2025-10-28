/**
 * AccountHistory 实体实现 (Client)
 * 兼容 AccountHistoryClient 接口
 */

import { AccountContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IAccountHistoryClient = AccountContracts.AccountHistoryClient;
type AccountHistoryClientDTO = AccountContracts.AccountHistoryClientDTO;

/**
 * AccountHistory 实体 (Client)
 * 账户历史记录实体
 */
export class AccountHistory extends Entity implements IAccountHistoryClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _action: string;
  private _details: any | null;
  private _ipAddress: string | null;
  private _userAgent: string | null;
  private _createdAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    action: string;
    details?: any | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._accountUuid = params.accountUuid;
    this._action = params.action;
    this._details = params.details ?? null;
    this._ipAddress = params.ipAddress ?? null;
    this._userAgent = params.userAgent ?? null;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get action(): string {
    return this._action;
  }
  public get details(): any | null {
    return this._details;
  }
  public get ipAddress(): string | null {
    return this._ipAddress;
  }
  public get userAgent(): string | null {
    return this._userAgent;
  }
  public get createdAt(): number {
    return this._createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建账户历史记录
   */
  public static create(params: {
    accountUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): AccountHistory {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new AccountHistory({
      uuid,
      accountUuid: params.accountUuid,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): AccountHistoryClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      action: this._action,
      details: this._details,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      createdAt: this._createdAt,
    };
  }

  public static fromClientDTO(dto: AccountHistoryClientDTO): AccountHistory {
    return new AccountHistory({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      action: dto.action,
      details: dto.details,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      createdAt: dto.createdAt,
    });
  }
}
