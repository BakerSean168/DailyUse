/**
 * AuthCredential 聚合根实现 (Client)
 * 兼容 AuthCredentialClient 接口
 */

import {
  AuthenticationContracts,
  CredentialType,
  CredentialStatus,
  TwoFactorMethod,
  BiometricType,
} from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { PasswordCredential } from '../entities/PasswordCredential';
import { ApiKeyCredential } from '../entities/ApiKeyCredential';
import { RememberMeToken } from '../entities/RememberMeToken';
import { CredentialHistory } from '../entities/CredentialHistory';

type IAuthCredentialClient = AuthenticationContracts.AuthCredentialClient;
type AuthCredentialClientDTO = AuthenticationContracts.AuthCredentialClientDTO;
type AuthCredentialServerDTO = AuthenticationContracts.AuthCredentialServerDTO;

/**
 * AuthCredential 聚合根 (Client)
 *
 * DDD 聚合根职责：
 * - 管理认证凭证信息
 * - 管理子实体（密码凭证、API密钥、记住我令牌等）
 * - 提供认证相关的业务逻辑
 */
export class AuthCredential extends AggregateRoot implements IAuthCredentialClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _type: CredentialType;
  private _passwordCredential: PasswordCredential | null;
  private _apiKeyCredentials: ApiKeyCredential[];
  private _rememberMeTokens: RememberMeToken[];
  private _twoFactor: {
    enabled: boolean;
    method: TwoFactorMethod;
    verifiedAt?: number | null;
  } | null;
  private _biometric: {
    enabled: boolean;
    type: BiometricType;
    deviceId?: string | null;
    enrolledAt?: number | null;
  } | null;
  private _status: CredentialStatus;
  private _security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null;
    lockedUntil?: number | null;
    lastPasswordChangeAt?: number | null;
  };
  private _history: CredentialHistory[];
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    type: CredentialType;
    passwordCredential?: PasswordCredential | null;
    apiKeyCredentials: ApiKeyCredential[];
    rememberMeTokens: RememberMeToken[];
    twoFactor?: {
      enabled: boolean;
      method: TwoFactorMethod;
      verifiedAt?: number | null;
    } | null;
    biometric?: {
      enabled: boolean;
      type: BiometricType;
      deviceId?: string | null;
      enrolledAt?: number | null;
    } | null;
    status: CredentialStatus;
    security: {
      requirePasswordChange: boolean;
      passwordExpiresAt?: number | null;
      failedLoginAttempts: number;
      lastFailedLoginAt?: number | null;
      lockedUntil?: number | null;
      lastPasswordChangeAt?: number | null;
    };
    history: CredentialHistory[];
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._type = params.type;
    this._passwordCredential = params.passwordCredential ?? null;
    this._apiKeyCredentials = params.apiKeyCredentials;
    this._rememberMeTokens = params.rememberMeTokens;
    this._twoFactor = params.twoFactor ?? null;
    this._biometric = params.biometric ?? null;
    this._status = params.status;
    this._security = params.security;
    this._history = params.history;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get type(): CredentialType {
    return this._type;
  }
  public get passwordCredential(): PasswordCredential | null {
    return this._passwordCredential;
  }
  public get apiKeyCredentials(): ApiKeyCredential[] {
    return [...this._apiKeyCredentials];
  }
  public get rememberMeTokens(): RememberMeToken[] {
    return [...this._rememberMeTokens];
  }
  public get twoFactor(): AuthCredential['_twoFactor'] {
    return this._twoFactor ? { ...this._twoFactor } : null;
  }
  public get biometric(): AuthCredential['_biometric'] {
    return this._biometric ? { ...this._biometric } : null;
  }
  public get status(): CredentialStatus {
    return this._status;
  }
  public get security(): AuthCredential['_security'] {
    return { ...this._security };
  }
  public get history(): CredentialHistory[] {
    return [...this._history];
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的认证凭证
   */
  public static create(params: { accountUuid: string; type: CredentialType }): AuthCredential {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    return new AuthCredential({
      uuid,
      accountUuid: params.accountUuid,
      type: params.type,
      apiKeyCredentials: [],
      rememberMeTokens: [],
      status: CredentialStatus.ACTIVE,
      security: {
        requirePasswordChange: false,
        failedLoginAttempts: 0,
      },
      history: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  public clone(): AuthCredential {
    return AuthCredential.fromClientDTO(this.toClientDTO());
  }

  // ===== 业务方法 =====

  /**
   * 添加 API 密钥
   */
  public addApiKey(apiKey: ApiKeyCredential): void {
    this._apiKeyCredentials.push(apiKey);
    this._updatedAt = Date.now();
  }

  /**
   * 移除 API 密钥
   */
  public removeApiKey(apiKeyUuid: string): boolean {
    const index = this._apiKeyCredentials.findIndex((k) => k.uuid === apiKeyUuid);
    if (index === -1) return false;
    this._apiKeyCredentials.splice(index, 1);
    this._updatedAt = Date.now();
    return true;
  }

  /**
   * 获取 API 密钥
   */
  public getApiKey(uuid: string): ApiKeyCredential | null {
    return this._apiKeyCredentials.find((k) => k.uuid === uuid) ?? null;
  }

  /**
   * 添加记住我令牌
   */
  public addRememberMeToken(token: RememberMeToken): void {
    this._rememberMeTokens.push(token);
    this._updatedAt = Date.now();
  }

  /**
   * 移除记住我令牌
   */
  public removeRememberMeToken(tokenUuid: string): boolean {
    const index = this._rememberMeTokens.findIndex((t) => t.uuid === tokenUuid);
    if (index === -1) return false;
    this._rememberMeTokens.splice(index, 1);
    this._updatedAt = Date.now();
    return true;
  }

  /**
   * 清除所有记住我令牌
   */
  public clearRememberMeTokens(): void {
    this._rememberMeTokens = [];
    this._updatedAt = Date.now();
  }

  /**
   * 启用两步验证
   */
  public enableTwoFactor(method: TwoFactorMethod): void {
    this._twoFactor = {
      enabled: true,
      method,
      verifiedAt: Date.now(),
    };
    this._updatedAt = Date.now();
  }

  /**
   * 禁用两步验证
   */
  public disableTwoFactor(): void {
    this._twoFactor = null;
    this._updatedAt = Date.now();
  }

  /**
   * 启用生物识别
   */
  public enableBiometric(type: BiometricType, deviceId: string): void {
    this._biometric = {
      enabled: true,
      type,
      deviceId,
      enrolledAt: Date.now(),
    };
    this._updatedAt = Date.now();
  }

  /**
   * 禁用生物识别
   */
  public disableBiometric(): void {
    this._biometric = null;
    this._updatedAt = Date.now();
  }

  /**
   * 激活凭证
   */
  public activate(): void {
    this._status = CredentialStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  /**
   * 暂停凭证
   */
  public suspend(): void {
    this._status = CredentialStatus.SUSPENDED;
    this._updatedAt = Date.now();
  }

  /**
   * 撤销凭证
   */
  public revoke(): void {
    this._status = CredentialStatus.REVOKED;
    this._updatedAt = Date.now();
  }

  /**
   * 设置凭证过期
   */
  public expire(): void {
    this._status = CredentialStatus.EXPIRED;
    this._updatedAt = Date.now();
  }

  /**
   * 记录登录失败
   */
  public recordFailedLogin(): void {
    this._security.failedLoginAttempts += 1;
    this._security.lastFailedLoginAt = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 重置失败尝试次数
   */
  public resetFailedAttempts(): void {
    this._security.failedLoginAttempts = 0;
    this._security.lastFailedLoginAt = null;
    this._updatedAt = Date.now();
  }

  /**
   * 锁定凭证
   */
  public lock(durationMinutes: number): void {
    const now = Date.now();
    this._security.lockedUntil = now + durationMinutes * 60 * 1000;
    this._updatedAt = now;
  }

  /**
   * 解锁凭证
   */
  public unlock(): void {
    this._security.lockedUntil = null;
    this._security.failedLoginAttempts = 0;
    this._updatedAt = Date.now();
  }

  /**
   * 检查凭证是否被锁定
   */
  public isLocked(): boolean {
    if (!this._security.lockedUntil) return false;
    return Date.now() < this._security.lockedUntil;
  }

  /**
   * 要求更改密码
   */
  public requirePasswordChange(): void {
    this._security.requirePasswordChange = true;
    this._updatedAt = Date.now();
  }

  /**
   * 记录密码更改
   */
  public recordPasswordChange(): void {
    this._security.requirePasswordChange = false;
    this._security.lastPasswordChangeAt = Date.now();
    this._security.passwordExpiresAt = null;
    this._updatedAt = Date.now();
  }

  /**
   * 设置密码过期时间
   */
  public setPasswordExpiration(expiresAt: number): void {
    this._security.passwordExpiresAt = expiresAt;
    this._updatedAt = Date.now();
  }

  /**
   * 检查密码是否过期
   */
  public isPasswordExpired(): boolean {
    if (!this._security.passwordExpiresAt) return false;
    return Date.now() > this._security.passwordExpiresAt;
  }

  /**
   * 添加历史记录
   */
  public addHistory(history: CredentialHistory): void {
    this._history.push(history);
    this._updatedAt = Date.now();
  }

  /**
   * 检查凭证是否激活
   */
  public isActive(): boolean {
    return this._status === CredentialStatus.ACTIVE && !this.isLocked() && !this.isPasswordExpired();
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): AuthCredentialClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      type: this._type,
      passwordCredential: this._passwordCredential?.toClientDTO() || null,
      apiKeyCredentials: this._apiKeyCredentials.map((k) => k.toClientDTO()),
      rememberMeTokens: this._rememberMeTokens.map((t) => t.toClientDTO()),
      twoFactor: this._twoFactor ? { ...this._twoFactor } : null,
      biometric: this._biometric ? { ...this._biometric } : null,
      status: this._status,
      security: { ...this._security },
      history: this._history.map((h) => h.toClientDTO()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public static fromClientDTO(dto: AuthCredentialClientDTO): AuthCredential {
    return new AuthCredential({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      type: dto.type as CredentialType,
      passwordCredential: dto.passwordCredential
        ? PasswordCredential.fromClientDTO(dto.passwordCredential)
        : null,
      apiKeyCredentials: dto.apiKeyCredentials.map((k) => ApiKeyCredential.fromClientDTO(k)),
      rememberMeTokens: dto.rememberMeTokens.map((t) => RememberMeToken.fromClientDTO(t)),
      twoFactor: dto.twoFactor
        ? {
            ...dto.twoFactor,
            method: dto.twoFactor.method as TwoFactorMethod,
          }
        : null,
      biometric: dto.biometric
        ? {
            ...dto.biometric,
            type: dto.biometric.type as BiometricType,
          }
        : null,
      status: dto.status as CredentialStatus,
      security: { ...dto.security },
      history: dto.history.map((h) => CredentialHistory.fromClientDTO(h)),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromServerDTO(dto: AuthCredentialServerDTO): AuthCredential {
    return new AuthCredential({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      type: dto.type as CredentialType,
      passwordCredential: dto.passwordCredential
        ? PasswordCredential.fromClientDTO(dto.passwordCredential)
        : null,
      apiKeyCredentials: dto.apiKeyCredentials.map((k) => ApiKeyCredential.fromClientDTO(k)),
      rememberMeTokens: dto.rememberMeTokens.map((t) => RememberMeToken.fromClientDTO(t)),
      twoFactor: dto.twoFactor
        ? {
            ...dto.twoFactor,
            method: dto.twoFactor.method as TwoFactorMethod,
          }
        : null,
      biometric: dto.biometric
        ? {
            ...dto.biometric,
            type: dto.biometric.type as BiometricType,
          }
        : null,
      status: dto.status as CredentialStatus,
      security: { ...dto.security },
      history: dto.history.map((h) => CredentialHistory.fromClientDTO(h)),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
