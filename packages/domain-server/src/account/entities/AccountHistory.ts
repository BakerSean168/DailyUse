/**
 * AccountHistory 实体实现
 * 实现 AccountHistoryServer 接口
 */

import { AccountContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IAccountHistoryServer = AccountContracts.AccountHistoryServer;
type AccountHistoryServerDTO = AccountContracts.AccountHistoryServerDTO;
type AccountHistoryClientDTO = AccountContracts.AccountHistoryClientDTO;
type AccountHistoryPersistenceDTO = AccountContracts.AccountHistoryPersistenceDTO;

export class AccountHistory extends Entity implements IAccountHistoryServer {
  private _accountUuid: string;
  private _action: string;
  private _details: any | null;
  private _ipAddress: string | null;
  private _userAgent: string | null;
  private _createdAt: number;

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    action: string;
    details?: any | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._accountUuid = params.accountUuid;
    this._action = params.action;
    this._details = params.details ?? null;
    this._ipAddress = params.ipAddress ?? null;
    this._userAgent = params.userAgent ?? null;
    this._createdAt = params.createdAt;
  }

  // Getters
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

  // Factory methods
  public static create(params: {
    accountUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): AccountHistory {
    return new AccountHistory({
      accountUuid: params.accountUuid,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: Date.now(),
    });
  }

  public static fromServerDTO(dto: AccountHistoryServerDTO): AccountHistory {
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

  public static fromPersistenceDTO(dto: AccountHistoryPersistenceDTO): AccountHistory {
    return new AccountHistory({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      action: dto.action,
      details: dto.details ? JSON.parse(dto.details) : null,
      ipAddress: dto.ip_address,
      userAgent: dto.user_agent,
      createdAt: dto.createdAt,
    });
  }

  // DTO conversion
  public toServerDTO(): AccountHistoryServerDTO {
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

  public toPersistenceDTO(): AccountHistoryPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      action: this._action,
      details: this._details ? JSON.stringify(this._details) : null,
      ip_address: this._ipAddress,
      user_agent: this._userAgent,
      createdAt: this._createdAt,
    };
  }
}
