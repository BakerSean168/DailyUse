/**
 * ResourceReferenceClient 实体实现
 * 实现 ResourceReferenceClient 接口
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryContracts as RC } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IResourceReferenceClient = RepositoryContracts.ResourceReferenceClient;
type ResourceReferenceClientDTO = RepositoryContracts.ResourceReferenceClientDTO;
type ResourceReferenceServerDTO = RepositoryContracts.ResourceReferenceServerDTO;
type ReferenceType = RepositoryContracts.ReferenceType;

/**
 * ResourceReferenceClient 实体
 * 兼容 IResourceReferenceClient 接口（但不直接实现，因为接口中包含静态方法）
 */
export class ResourceReference extends Entity implements IResourceReferenceClient {
  // ===== 私有字段 =====
  private _sourceResourceUuid: string;
  private _targetResourceUuid: string;
  private _referenceType: ReferenceType;
  private _description: string | null;
  private _createdAt: number;
  private _updatedAt: number | null;
  private _lastVerifiedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    sourceResourceUuid: string;
    targetResourceUuid: string;
    referenceType: ReferenceType;
    description?: string | null;
    createdAt: number;
    updatedAt?: number | null;
    lastVerifiedAt?: number | null;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._sourceResourceUuid = params.sourceResourceUuid;
    this._targetResourceUuid = params.targetResourceUuid;
    this._referenceType = params.referenceType;
    this._description = params.description ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt ?? null;
    this._lastVerifiedAt = params.lastVerifiedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get sourceResourceUuid(): string {
    return this._sourceResourceUuid;
  }
  public get targetResourceUuid(): string {
    return this._targetResourceUuid;
  }
  public get referenceType(): ReferenceType {
    return this._referenceType;
  }
  public get description(): string | null {
    return this._description;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number | null {
    return this._updatedAt;
  }
  public get lastVerifiedAt(): number | null {
    return this._lastVerifiedAt;
  }

  // UI 属性
  public get referenceTypeLabel(): string {
    const labels: Record<ReferenceType, string> = {
      [RC.ReferenceType.LINK]: '链接',
      [RC.ReferenceType.EMBED]: '嵌入',
      [RC.ReferenceType.RELATED]: '相关',
      [RC.ReferenceType.DEPENDENCY]: '依赖',
    };
    return labels[this._referenceType] || '未知';
  }

  public get formattedCreatedAt(): string {
    return this.formatDate(this._createdAt);
  }

  public get formattedLastVerified(): string | undefined {
    return this._lastVerifiedAt ? this.formatDate(this._lastVerifiedAt) : undefined;
  }

  public get isVerified(): boolean {
    if (!this._lastVerifiedAt) return false;
    // 如果最后验证时间在30天内，认为是已验证的
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return this._lastVerifiedAt > thirtyDaysAgo;
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  // ===== 工厂方法 =====

  /**
   * 创建用于创建表单的空 ResourceReference 实例
   */
  public static forCreate(sourceResourceUuid: string): ResourceReference {
    const uuid = Entity.generateUUID();
    return new ResourceReference({
      uuid,
      sourceResourceUuid,
      targetResourceUuid: '',
      referenceType: RC.ReferenceType.LINK,
      description: null,
      createdAt: Date.now(),
      updatedAt: null,
      lastVerifiedAt: null,
    });
  }

  /**
   * 克隆当前实体（用于编辑表单）
   */
  public clone(): ResourceReference {
    return ResourceReference.fromClientDTO(this.toClientDTO());
  }

  /**
   * 创建新的 ResourceReferenceClient 实体
   */
  public static create(params: {
    sourceResourceUuid: string;
    targetResourceUuid: string;
    referenceType: ReferenceType;
    description?: string;
  }): ResourceReference {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new ResourceReference({
      uuid,
      sourceResourceUuid: params.sourceResourceUuid,
      targetResourceUuid: params.targetResourceUuid,
      referenceType: params.referenceType,
      description: params.description,
      createdAt: now,
    });
  }

  // ===== 转换方法 =====

  public toServerDTO(): ResourceReferenceServerDTO {
    return {
      uuid: this._uuid,
      sourceResourceUuid: this._sourceResourceUuid,
      targetResourceUuid: this._targetResourceUuid,
      referenceType: this._referenceType,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastVerifiedAt: this._lastVerifiedAt,
    };
  }

  public toClientDTO(): ResourceReferenceClientDTO {
    return {
      uuid: this._uuid,
      sourceResourceUuid: this._sourceResourceUuid,
      targetResourceUuid: this._targetResourceUuid,
      referenceType: this._referenceType,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastVerifiedAt: this._lastVerifiedAt,
      referenceTypeLabel: this.referenceTypeLabel,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedLastVerified: this.formattedLastVerified,
      isVerified: this.isVerified,
    };
  }

  public static fromServerDTO(dto: ResourceReferenceServerDTO): ResourceReference {
    return new ResourceReference({
      uuid: dto.uuid,
      sourceResourceUuid: dto.sourceResourceUuid,
      targetResourceUuid: dto.targetResourceUuid,
      referenceType: dto.referenceType,
      description: dto.description,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastVerifiedAt: dto.lastVerifiedAt,
    });
  }

  public static fromClientDTO(dto: ResourceReferenceClientDTO): ResourceReference {
    return new ResourceReference({
      uuid: dto.uuid,
      sourceResourceUuid: dto.sourceResourceUuid,
      targetResourceUuid: dto.targetResourceUuid,
      referenceType: dto.referenceType,
      description: dto.description,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastVerifiedAt: dto.lastVerifiedAt,
    });
  }
}
