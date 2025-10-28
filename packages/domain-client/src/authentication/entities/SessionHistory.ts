/**
 * SessionHistory 实体实现 (Client)
 * 兼容 SessionHistoryClient 接口
 */

import { AuthenticationContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type ISessionHistoryClient = AuthenticationContracts.SessionHistoryClient;
type SessionHistoryClientDTO = AuthenticationContracts.SessionHistoryClientDTO;

/**
 * SessionHistory 实体 (Client)
 * 会话历史记录实体
 */
export class SessionHistory extends Entity implements ISessionHistoryClient {
  // ===== 私有字段 =====
  private _sessionUuid: string;
  private _action: string;
  private _details: any | null;
  private _ipAddress: string | null;
  private _userAgent: string | null;
  private _createdAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    sessionUuid: string;
    action: string;
    details?: any | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._sessionUuid = params.sessionUuid;
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
  public get sessionUuid(): string {
    return this._sessionUuid;
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
   * 创建会话历史记录
   */
  public static create(params: {
    sessionUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): SessionHistory {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new SessionHistory({
      uuid,
      sessionUuid: params.sessionUuid,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: now,
    });
  }

  // ===== DTO 转换方法 =====

  public toClientDTO(): SessionHistoryClientDTO {
    return {
      uuid: this._uuid,
      sessionUuid: this._sessionUuid,
      action: this._action,
      details: this._details,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      createdAt: this._createdAt,
    };
  }

  public static fromClientDTO(dto: SessionHistoryClientDTO): SessionHistory {
    return new SessionHistory({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      action: dto.action,
      details: dto.details,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      createdAt: dto.createdAt,
    });
  }
}
