/**
 * RememberMeToken 实体实现
 * 实现 RememberMeTokenServer 接口
 */

import { AuthenticationContracts } from '@dailyuse/contracts';
import { Entity, generateUUID } from '@dailyuse/utils';
import { DeviceInfo } from '../value-objects/DeviceInfo';
import crypto from 'crypto';

type IRememberMeTokenServer = AuthenticationContracts.RememberMeTokenServer;
type RememberMeTokenServerDTO = AuthenticationContracts.RememberMeTokenServerDTO;
type RememberMeTokenPersistenceDTO = AuthenticationContracts.RememberMeTokenPersistenceDTO;

export class RememberMeToken extends Entity implements IRememberMeTokenServer {
  public readonly credentialUuid: string;
  public readonly accountUuid: string;
  public readonly token: string;
  public readonly tokenSeries: string;
  public readonly device: DeviceInfo;
  private _status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';
  private _usageCount: number;
  private _lastUsedAt: number | null;
  private _lastUsedIp: string | null;
  public readonly expiresAt: number;
  public readonly createdAt: number;
  private _updatedAt: number;
  private _revokedAt: number | null;

  constructor(params: {
    uuid?: string;
    credentialUuid: string;
    accountUuid: string;
    token: string;
    tokenSeries: string;
    device: DeviceInfo;
    status?: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';
    usageCount?: number;
    lastUsedAt?: number | null;
    lastUsedIp?: string | null;
    expiresAt: number;
    createdAt?: number;
    updatedAt?: number;
    revokedAt?: number | null;
  }) {
    super(params.uuid ?? generateUUID());
    this.credentialUuid = params.credentialUuid;
    this.accountUuid = params.accountUuid;
    this.token = params.token;
    this.tokenSeries = params.tokenSeries;
    this.device = params.device;
    this._status = params.status ?? 'ACTIVE';
    this._usageCount = params.usageCount ?? 0;
    this._lastUsedAt = params.lastUsedAt ?? null;
    this._lastUsedIp = params.lastUsedIp ?? null;
    this.expiresAt = params.expiresAt;
    this.createdAt = params.createdAt ?? Date.now();
    this._updatedAt = params.updatedAt ?? Date.now();
    this._revokedAt = params.revokedAt ?? null;
  }

  public get status(): 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED' {
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

  public get updatedAt(): number {
    return this._updatedAt;
  }

  public get revokedAt(): number | null {
    return this._revokedAt;
  }

  // Factory methods
  public static create(params: {
    credentialUuid: string;
    accountUuid: string;
    plainToken: string;
    tokenSeries: string;
    device: DeviceInfo;
    expiresInDays: number;
  }): RememberMeToken {
    const hashedToken = crypto.createHash('sha256').update(params.plainToken).digest('hex');
    const expiresAt = Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000;

    return new RememberMeToken({
      uuid: generateUUID(),
      credentialUuid: params.credentialUuid,
      accountUuid: params.accountUuid,
      token: hashedToken,
      tokenSeries: params.tokenSeries,
      device: params.device,
      expiresAt,
    });
  }

  public static fromServerDTO(dto: RememberMeTokenServerDTO): RememberMeToken {
    return new RememberMeToken({
      uuid: dto.uuid,
      credentialUuid: dto.credentialUuid,
      accountUuid: dto.accountUuid,
      token: dto.token,
      tokenSeries: dto.tokenSeries,
      device: DeviceInfo.fromServerDTO(dto.device as any),
      status: dto.status,
      usageCount: dto.usageCount,
      lastUsedAt: dto.lastUsedAt,
      lastUsedIp: dto.lastUsedIp,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      revokedAt: dto.revokedAt,
    });
  }

  public static fromPersistenceDTO(dto: RememberMeTokenPersistenceDTO): RememberMeToken {
    const deviceData = typeof dto.device === 'string' ? JSON.parse(dto.device) : dto.device;
    return new RememberMeToken({
      uuid: dto.uuid,
      credentialUuid: dto.credential_uuid,
      accountUuid: dto.account_uuid,
      token: dto.token,
      tokenSeries: dto.token_series,
      device: DeviceInfo.fromServerDTO(deviceData),
      status: dto.status,
      usageCount: dto.usage_count,
      lastUsedAt: dto.last_used_at,
      lastUsedIp: dto.last_used_ip,
      expiresAt: dto.expires_at,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      revokedAt: dto.revoked_at,
    });
  }

  // Business methods
  public verifyToken(plainToken: string): boolean {
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    return this.token === hashedToken;
  }

  public verifyDevice(deviceFingerprint: string): boolean {
    return this.device.matchesFingerprint(deviceFingerprint);
  }

  public isExpired(): boolean {
    return Date.now() > this.expiresAt;
  }

  public isValid(): boolean {
    return this._status === 'ACTIVE' && !this.isExpired();
  }

  public recordUsage(ipAddress: string): void {
    this._usageCount++;
    this._lastUsedAt = Date.now();
    this._lastUsedIp = ipAddress;
    this._updatedAt = Date.now();
  }

  public markAsUsed(): void {
    this._status = 'USED';
    this._updatedAt = Date.now();
  }

  public revoke(): void {
    this._status = 'REVOKED';
    this._revokedAt = Date.now();
    this._updatedAt = Date.now();
  }

  // DTO conversion
  public toServerDTO(): RememberMeTokenServerDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      accountUuid: this.accountUuid,
      token: this.token,
      tokenSeries: this.tokenSeries,
      device: this.device as any,
      status: this._status,
      usageCount: this._usageCount,
      lastUsedAt: this._lastUsedAt,
      lastUsedIp: this._lastUsedIp,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      revokedAt: this._revokedAt,
    };
  }

  public toClientDTO(): RememberMeTokenServerDTO {
    return {
      uuid: this.uuid,
      credentialUuid: this.credentialUuid,
      accountUuid: this.accountUuid,
      token: this.token,
      tokenSeries: this.tokenSeries,
      device: this.device as any,
      status: this._status,
      usageCount: this._usageCount,
      lastUsedAt: this._lastUsedAt,
      lastUsedIp: this._lastUsedIp,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      revokedAt: this._revokedAt,
    };
  }

  public toPersistenceDTO(): RememberMeTokenPersistenceDTO {
    return {
      uuid: this.uuid,
      credential_uuid: this.credentialUuid,
      account_uuid: this.accountUuid,
      token: this.token,
      token_series: this.tokenSeries,
      device: JSON.stringify(this.device.toServerDTO()),
      status: this._status,
      usage_count: this._usageCount,
      last_used_at: this._lastUsedAt,
      last_used_ip: this._lastUsedIp,
      expires_at: this.expiresAt,
      created_at: this.createdAt,
      updated_at: this._updatedAt,
      revoked_at: this._revokedAt,
    };
  }
}
