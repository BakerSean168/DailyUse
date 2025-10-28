/**
 * PasswordCredential 实体实现 (Client)
 * 兼容 PasswordCredentialClient 接口
 */

import { AuthenticationContracts, PasswordAlgorithm } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IPasswordCredentialClient = AuthenticationContracts.PasswordCredentialClient;
type PasswordCredentialClientDTO = AuthenticationContracts.PasswordCredentialClientDTO;

/**
 * PasswordCredential 实体 (Client)
 * 密码凭证实体
 */
export class PasswordCredential extends Entity implements IPasswordCredentialClient {
  // ===== 私有字段 =====
  private _credentialUuid: string;
  private _algorithm: PasswordAlgorithm;
  private _status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  private _failedAttempts: number;
  private _lastChangedAt: number;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    credentialUuid: string;
    algorithm: PasswordAlgorithm;
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
    failedAttempts: number;
    lastChangedAt: number;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._credentialUuid = params.credentialUuid;
    this._algorithm = params.algorithm;
    this._status = params.status;
    this._failedAttempts = params.failedAttempts;
    this._lastChangedAt = params.lastChangedAt;
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
  public get algorithm(): PasswordAlgorithm {
    return this._algorithm;
  }
  public get status(): 'ACTIVE' | 'INACTIVE' | 'LOCKED' {
    return this._status;
  }
  public get failedAttempts(): number {
    return this._failedAttempts;
  }
  public get lastChangedAt(): number {
    return this._lastChangedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建密码凭证
   */
  public static create(params: {
    credentialUuid: string;
    algorithm?: PasswordAlgorithm;
  }): PasswordCredential {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new PasswordCredential({
      uuid,
      credentialUuid: params.credentialUuid,
      algorithm: params.algorithm || PasswordAlgorithm.BCRYPT,
      status: 'ACTIVE',
      failedAttempts: 0,
      lastChangedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): PasswordCredentialClientDTO {
    return {
      uuid: this._uuid,
      credentialUuid: this._credentialUuid,
      algorithm: this._algorithm,
      status: this._status,
      failedAttempts: this._failedAttempts,
      lastChangedAt: this._lastChangedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public static fromClientDTO(dto: PasswordCredentialClientDTO): PasswordCredential {
    return new PasswordCredential({
      uuid: dto.uuid,
      credentialUuid: dto.credentialUuid,
      algorithm: dto.algorithm as PasswordAlgorithm,
      status: dto.status,
      failedAttempts: dto.failedAttempts,
      lastChangedAt: dto.lastChangedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
