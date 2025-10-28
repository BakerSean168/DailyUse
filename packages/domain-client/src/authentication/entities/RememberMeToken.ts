/**
 * RememberMeToken 实体实现 (Client)
 * 兼容 RememberMeTokenClient 接口
 */

import { AuthenticationContracts, RememberMeTokenStatus } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';
import { DeviceInfo } from '../value-objects/DeviceInfo';

type IRememberMeTokenClient = AuthenticationContracts.RememberMeTokenClient;
type RememberMeTokenClientDTO = AuthenticationContracts.RememberMeTokenClientDTO;

/**
 * RememberMeToken 实体 (Client)
 * 记住我令牌实体
 */
export class RememberMeToken extends Entity implements IRememberMeTokenClient {
  // ===== 私有字段 =====
  private _credentialUuid: string;
  private _accountUuid: string;
  private _tokenSeries: string;
  private _device: DeviceInfo;
  private _status: RememberMeTokenStatus;
  private _usageCount: number;
  private _lastUsedAt: number | null;
  private _lastUsedIp: string | null;
  private _expiresAt: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _revokedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    credentialUuid: string;
    accountUuid: string;
    tokenSeries: string;
    device: DeviceInfo;
    status: RememberMeTokenStatus;
    usageCount: number;
    lastUsedAt?: number | null;
    lastUsedIp?: string | null;
    expiresAt: number;
    createdAt: number;
    updatedAt: number;
    revokedAt?: number | null;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._credentialUuid = params.credentialUuid;
    this._accountUuid = params.accountUuid;
    this._tokenSeries = params.tokenSeries;
    this._device = params.device;
    this._status = params.status;
    this._usageCount = params.usageCount;
    this._lastUsedAt = params.lastUsedAt ?? null;
    this._lastUsedIp = params.lastUsedIp ?? null;
    this._expiresAt = params.expiresAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._revokedAt = params.revokedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get credentialUuid(): string {
    return this._credentialUuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get tokenSeries(): string {
    return this._tokenSeries;
  }
  public get device(): DeviceInfo {
    return this._device;
  }
  public get status(): RememberMeTokenStatus {
    return this._status;
  }
  public get usageCount(): number {
    return this._usageCount;
  }
  public get lastUsedAt(): number | null {
    return this._lastUsedAt;
  }
  public get lastUsedIp(): string | null {
    return this._lastUsedIp;
  }
  public get expiresAt(): number {
    return this._expiresAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get revokedAt(): number | null {
    return this._revokedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建记住我令牌
   */
  public static create(params: {
    credentialUuid: string;
    accountUuid: string;
    tokenSeries: string;
    device: DeviceInfo;
    expiresAt: number;
  }): RememberMeToken {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new RememberMeToken({
      uuid,
      credentialUuid: params.credentialUuid,
      accountUuid: params.accountUuid,
      tokenSeries: params.tokenSeries,
      device: params.device,
      status: RememberMeTokenStatus.ACTIVE,
      usageCount: 0,
      expiresAt: params.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): RememberMeTokenClientDTO {
    return {
      uuid: this._uuid,
      credentialUuid: this._credentialUuid,
      accountUuid: this._accountUuid,
      tokenSeries: this._tokenSeries,
      device: this._device.toClientDTO(),
      status: this._status,
      usageCount: this._usageCount,
      lastUsedAt: this._lastUsedAt,
      lastUsedIp: this._lastUsedIp,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      revokedAt: this._revokedAt,
    };
  }

  public static fromClientDTO(dto: RememberMeTokenClientDTO): RememberMeToken {
    return new RememberMeToken({
      uuid: dto.uuid,
      credentialUuid: dto.credentialUuid,
      accountUuid: dto.accountUuid,
      tokenSeries: dto.tokenSeries,
      device: DeviceInfo.fromClientDTO(dto.device),
      status: dto.status as RememberMeTokenStatus,
      usageCount: dto.usageCount,
      lastUsedAt: dto.lastUsedAt,
      lastUsedIp: dto.lastUsedIp,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      revokedAt: dto.revokedAt,
    });
  }
}
