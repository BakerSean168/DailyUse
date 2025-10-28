/**
 * ApiKeyCredential 实体实现 (Client)
 * 兼容 ApiKeyCredentialClient 接口
 */

import { AuthenticationContracts, ApiKeyStatus } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IApiKeyCredentialClient = AuthenticationContracts.ApiKeyCredentialClient;
type ApiKeyCredentialClientDTO = AuthenticationContracts.ApiKeyCredentialClientDTO;

/**
 * ApiKeyCredential 实体 (Client)
 * API 密钥凭证实体
 */
export class ApiKeyCredential extends Entity implements IApiKeyCredentialClient {
  // ===== 私有字段 =====
  private _credentialUuid: string;
  private _name: string;
  private _keyPrefix: string;
  private _status: ApiKeyStatus;
  private _lastUsedAt: number | null;
  private _expiresAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    credentialUuid: string;
    name: string;
    keyPrefix: string;
    status: ApiKeyStatus;
    lastUsedAt?: number | null;
    expiresAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._credentialUuid = params.credentialUuid;
    this._name = params.name;
    this._keyPrefix = params.keyPrefix;
    this._status = params.status;
    this._lastUsedAt = params.lastUsedAt ?? null;
    this._expiresAt = params.expiresAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get credentialUuid(): string {
    return this._credentialUuid;
  }
  public get name(): string {
    return this._name;
  }
  public get keyPrefix(): string {
    return this._keyPrefix;
  }
  public get status(): ApiKeyStatus {
    return this._status;
  }
  public get lastUsedAt(): number | null {
    return this._lastUsedAt;
  }
  public get expiresAt(): number | null {
    return this._expiresAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建 API 密钥凭证
   */
  public static create(params: {
    credentialUuid: string;
    name: string;
    keyPrefix: string;
    expiresAt?: number;
  }): ApiKeyCredential {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new ApiKeyCredential({
      uuid,
      credentialUuid: params.credentialUuid,
      name: params.name,
      keyPrefix: params.keyPrefix,
      status: ApiKeyStatus.ACTIVE,
      expiresAt: params.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): ApiKeyCredentialClientDTO {
    return {
      uuid: this._uuid,
      credentialUuid: this._credentialUuid,
      name: this._name,
      keyPrefix: this._keyPrefix,
      status: this._status,
      lastUsedAt: this._lastUsedAt,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public static fromClientDTO(dto: ApiKeyCredentialClientDTO): ApiKeyCredential {
    return new ApiKeyCredential({
      uuid: dto.uuid,
      credentialUuid: dto.credentialUuid,
      name: dto.name,
      keyPrefix: dto.keyPrefix,
      status: dto.status as ApiKeyStatus,
      lastUsedAt: dto.lastUsedAt,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
