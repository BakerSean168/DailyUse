/**
 * RefreshToken 实体实现 (Client)
 * 兼容 RefreshTokenClient 接口
 */

import { AuthenticationContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IRefreshTokenClient = AuthenticationContracts.RefreshTokenClient;
type RefreshTokenClientDTO = AuthenticationContracts.RefreshTokenClientDTO;

/**
 * RefreshToken 实体 (Client)
 * 刷新令牌实体
 */
export class RefreshToken extends Entity implements IRefreshTokenClient {
  // ===== 私有字段 =====
  private _sessionUuid: string;
  private _token: string;
  private _expiresAt: number;
  private _createdAt: number;
  private _usedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    sessionUuid: string;
    token: string;
    expiresAt: number;
    createdAt: number;
    usedAt?: number | null;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._sessionUuid = params.sessionUuid;
    this._token = params.token;
    this._expiresAt = params.expiresAt;
    this._createdAt = params.createdAt;
    this._usedAt = params.usedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get sessionUuid(): string {
    return this._sessionUuid;
  }
  public get token(): string {
    return this._token;
  }
  public get expiresAt(): number {
    return this._expiresAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get usedAt(): number | null {
    return this._usedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建刷新令牌
   */
  public static create(params: { sessionUuid: string; token: string; expiresAt: number }): RefreshToken {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new RefreshToken({
      uuid,
      sessionUuid: params.sessionUuid,
      token: params.token,
      expiresAt: params.expiresAt,
      createdAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): RefreshTokenClientDTO {
    return {
      uuid: this._uuid,
      sessionUuid: this._sessionUuid,
      token: this._token,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      usedAt: this._usedAt,
    };
  }

  public static fromClientDTO(dto: RefreshTokenClientDTO): RefreshToken {
    return new RefreshToken({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      token: dto.token,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      usedAt: dto.usedAt,
    });
  }
}
