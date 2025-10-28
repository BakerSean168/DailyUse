/**
 * AuthSession 聚合根实现 (Client)
 * 兼容 AuthSessionClient 接口
 */

import { AuthenticationContracts, SessionStatus } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { RefreshToken } from '../entities/RefreshToken';
import { DeviceInfo } from '../value-objects/DeviceInfo';
import { SessionHistory } from '../entities/SessionHistory';

type IAuthSessionClient = AuthenticationContracts.AuthSessionClient;
type AuthSessionClientDTO = AuthenticationContracts.AuthSessionClientDTO;
type AuthSessionServerDTO = AuthenticationContracts.AuthSessionServerDTO;

/**
 * AuthSession 聚合根 (Client)
 *
 * DDD 聚合根职责：
 * - 管理会话信息
 * - 管理子实体（刷新令牌、会话历史等）
 * - 提供会话相关的业务逻辑
 */
export class AuthSession extends AggregateRoot implements IAuthSessionClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _accessToken: string;
  private _accessTokenExpiresAt: number;
  private _refreshToken: RefreshToken;
  private _device: DeviceInfo;
  private _status: SessionStatus;
  private _ipAddress: string;
  private _location: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  private _lastActivityAt: number;
  private _lastActivityType: string | null;
  private _history: SessionHistory[];
  private _createdAt: number;
  private _expiresAt: number;
  private _revokedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: RefreshToken;
    device: DeviceInfo;
    status: SessionStatus;
    ipAddress: string;
    location?: {
      country?: string | null;
      region?: string | null;
      city?: string | null;
      timezone?: string | null;
    } | null;
    lastActivityAt: number;
    lastActivityType?: string | null;
    history: SessionHistory[];
    createdAt: number;
    expiresAt: number;
    revokedAt?: number | null;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._accessToken = params.accessToken;
    this._accessTokenExpiresAt = params.accessTokenExpiresAt;
    this._refreshToken = params.refreshToken;
    this._device = params.device;
    this._status = params.status;
    this._ipAddress = params.ipAddress;
    this._location = params.location ?? null;
    this._lastActivityAt = params.lastActivityAt;
    this._lastActivityType = params.lastActivityType ?? null;
    this._history = params.history;
    this._createdAt = params.createdAt;
    this._expiresAt = params.expiresAt;
    this._revokedAt = params.revokedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get accessToken(): string {
    return this._accessToken;
  }
  public get accessTokenExpiresAt(): number {
    return this._accessTokenExpiresAt;
  }
  public get refreshToken(): RefreshToken {
    return this._refreshToken;
  }
  public get device(): DeviceInfo {
    return this._device;
  }
  public get status(): SessionStatus {
    return this._status;
  }
  public get ipAddress(): string {
    return this._ipAddress;
  }
  public get location(): AuthSession['_location'] {
    return this._location ? { ...this._location } : null;
  }
  public get lastActivityAt(): number {
    return this._lastActivityAt;
  }
  public get lastActivityType(): string | null {
    return this._lastActivityType;
  }
  public get history(): SessionHistory[] {
    return [...this._history];
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get expiresAt(): number {
    return this._expiresAt;
  }
  public get revokedAt(): number | null {
    return this._revokedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的会话
   */
  public static create(params: {
    accountUuid: string;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: RefreshToken;
    device: DeviceInfo;
    ipAddress: string;
    expiresAt: number;
  }): AuthSession {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    return new AuthSession({
      uuid,
      accountUuid: params.accountUuid,
      accessToken: params.accessToken,
      accessTokenExpiresAt: params.accessTokenExpiresAt,
      refreshToken: params.refreshToken,
      device: params.device,
      status: SessionStatus.ACTIVE,
      ipAddress: params.ipAddress,
      lastActivityAt: now,
      history: [],
      createdAt: now,
      expiresAt: params.expiresAt,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  public clone(): AuthSession {
    return AuthSession.fromClientDTO(this.toClientDTO());
  }

  // ===== 业务方法 =====

  /**
   * 刷新访问令牌
   */
  public refreshAccessToken(newToken: string, expiresAt: number): void {
    this._accessToken = newToken;
    this._accessTokenExpiresAt = expiresAt;
    this._lastActivityAt = Date.now();
  }

  /**
   * 更新刷新令牌
   */
  public updateRefreshToken(refreshToken: RefreshToken): void {
    this._refreshToken = refreshToken;
  }

  /**
   * 记录活动
   */
  public recordActivity(activityType?: string): void {
    const now = Date.now();
    this._lastActivityAt = now;
    this._lastActivityType = activityType ?? null;
  }

  /**
   * 撤销会话
   */
  public revoke(): void {
    this._status = SessionStatus.REVOKED;
    this._revokedAt = Date.now();
  }

  /**
   * 锁定会话
   */
  public lock(): void {
    this._status = SessionStatus.LOCKED;
  }

  /**
   * 解锁会话
   */
  public unlock(): void {
    if (this._status === SessionStatus.LOCKED) {
      this._status = SessionStatus.ACTIVE;
    }
  }

  /**
   * 设置会话为过期
   */
  public expire(): void {
    this._status = SessionStatus.EXPIRED;
  }

  /**
   * 更新位置信息
   */
  public updateLocation(location: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  }): void {
    this._location = { ...location };
  }

  /**
   * 添加会话历史
   */
  public addHistory(history: SessionHistory): void {
    this._history.push(history);
  }

  /**
   * 检查访问令牌是否过期
   */
  public isAccessTokenExpired(): boolean {
    return Date.now() > this._accessTokenExpiresAt;
  }

  /**
   * 检查会话是否过期
   */
  public isExpired(): boolean {
    return Date.now() > this._expiresAt || this._status === SessionStatus.EXPIRED;
  }

  /**
   * 检查会话是否激活
   */
  public isActive(): boolean {
    return this._status === SessionStatus.ACTIVE && !this.isExpired();
  }

  /**
   * 检查会话是否被撤销
   */
  public isRevoked(): boolean {
    return this._status === SessionStatus.REVOKED;
  }

  /**
   * 检查会话是否被锁定
   */
  public isLocked(): boolean {
    return this._status === SessionStatus.LOCKED;
  }

  /**
   * 获取会话剩余时间（秒）
   */
  public getRemainingTime(): number {
    const remaining = this._expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * 获取访问令牌剩余时间（秒）
   */
  public getAccessTokenRemainingTime(): number {
    const remaining = this._accessTokenExpiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): AuthSessionClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      accessToken: this._accessToken,
      accessTokenExpiresAt: this._accessTokenExpiresAt,
      refreshToken: this._refreshToken,
      device: this._device,
      status: this._status,
      ipAddress: this._ipAddress,
      location: this._location ? { ...this._location } : null,
      lastActivityAt: this._lastActivityAt,
      lastActivityType: this._lastActivityType,
      history: this._history,
      createdAt: this._createdAt,
      expiresAt: this._expiresAt,
      revokedAt: this._revokedAt,
    };
  }

  public static fromClientDTO(dto: AuthSessionClientDTO): AuthSession {
    return new AuthSession({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      accessToken: dto.accessToken,
      accessTokenExpiresAt: dto.accessTokenExpiresAt,
      refreshToken:
        dto.refreshToken instanceof RefreshToken
          ? dto.refreshToken
          : RefreshToken.fromClientDTO(dto.refreshToken.toClientDTO()),
      device: dto.device instanceof DeviceInfo ? dto.device : DeviceInfo.fromClientDTO(dto.device.toClientDTO()),
      status: dto.status as SessionStatus,
      ipAddress: dto.ipAddress,
      location: dto.location,
      lastActivityAt: dto.lastActivityAt,
      lastActivityType: dto.lastActivityType,
      history: dto.history.map((h) =>
        h instanceof SessionHistory ? h : SessionHistory.fromClientDTO(h.toClientDTO()),
      ),
      createdAt: dto.createdAt,
      expiresAt: dto.expiresAt,
      revokedAt: dto.revokedAt,
    });
  }

  public static fromServerDTO(dto: AuthSessionServerDTO): AuthSession {
    return new AuthSession({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      accessToken: dto.accessToken,
      accessTokenExpiresAt: dto.accessTokenExpiresAt,
      refreshToken:
        dto.refreshToken instanceof RefreshToken
          ? dto.refreshToken
          : RefreshToken.fromClientDTO(dto.refreshToken as any),
      device: dto.device instanceof DeviceInfo ? dto.device : DeviceInfo.fromClientDTO(dto.device as any),
      status: dto.status as SessionStatus,
      ipAddress: dto.ipAddress,
      location: dto.location,
      lastActivityAt: dto.lastActivityAt,
      lastActivityType: dto.lastActivityType,
      history: dto.history.map((h) => (h instanceof SessionHistory ? h : SessionHistory.fromClientDTO(h as any))),
      createdAt: dto.createdAt,
      expiresAt: dto.expiresAt,
      revokedAt: dto.revokedAt,
    });
  }
}
