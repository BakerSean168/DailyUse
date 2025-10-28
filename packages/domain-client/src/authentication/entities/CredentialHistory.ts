/**
 * CredentialHistory 实体实现 (Client)
 * 兼容 CredentialHistoryClient 接口
 */

import { AuthenticationContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type ICredentialHistoryClient = AuthenticationContracts.CredentialHistoryClient;
type CredentialHistoryClientDTO = AuthenticationContracts.CredentialHistoryClientDTO;

/**
 * CredentialHistory 实体 (Client)
 * 凭证历史记录实体
 */
export class CredentialHistory extends Entity implements ICredentialHistoryClient {
  // ===== 私有字段 =====
  private _credentialUuid: string;
  private _action: string;
  private _details: any | null;
  private _ipAddress: string | null;
  private _userAgent: string | null;
  private _createdAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    credentialUuid: string;
    action: string;
    details?: any | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._credentialUuid = params.credentialUuid;
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
  public get credentialUuid(): string {
    return this._credentialUuid;
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
   * 创建凭证历史记录
   */
  public static create(params: {
    credentialUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): CredentialHistory {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new CredentialHistory({
      uuid,
      credentialUuid: params.credentialUuid,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): CredentialHistoryClientDTO {
    return {
      uuid: this._uuid,
      credentialUuid: this._credentialUuid,
      action: this._action,
      details: this._details,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      createdAt: this._createdAt,
    };
  }

  public static fromClientDTO(dto: CredentialHistoryClientDTO): CredentialHistory {
    return new CredentialHistory({
      uuid: dto.uuid,
      credentialUuid: dto.credentialUuid,
      action: dto.action,
      details: dto.details,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      createdAt: dto.createdAt,
    });
  }
}
