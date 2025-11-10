/**
 * Folder 实体实现 (Client)
 */
import { RepositoryContracts } from '@dailyuse/contracts';
import { FolderMetadata } from '../value-objects';

// 类型别名
type FolderClient = RepositoryContracts.FolderClient;
type FolderClientDTO = RepositoryContracts.FolderClientDTO;
type FolderServerDTO = RepositoryContracts.FolderServerDTO;

export class Folder implements FolderClient {
  // ===== 私有字段 =====
  private _uuid: string;
  private _repositoryUuid: string;
  private _parentUuid: string | null;
  private _name: string;
  private _path: string;
  private _order: number;
  private _isExpanded: boolean;
  private _metadata: FolderMetadata;
  private _createdAt: number;
  private _updatedAt: number;
  private _children: FolderClient[] | null;

  // ===== 私有构造函数 =====
  private constructor(
    uuid: string,
    repositoryUuid: string,
    parentUuid: string | null,
    name: string,
    path: string,
    order: number,
    isExpanded: boolean,
    metadata: FolderMetadata,
    createdAt: number,
    updatedAt: number,
    children: FolderClient[] | null = null,
  ) {
    this._uuid = uuid;
    this._repositoryUuid = repositoryUuid;
    this._parentUuid = parentUuid;
    this._name = name;
    this._path = path;
    this._order = order;
    this._isExpanded = isExpanded;
    this._metadata = metadata;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._children = children;
  }

  // ===== Getters =====
  get uuid(): string {
    return this._uuid;
  }

  get repositoryUuid(): string {
    return this._repositoryUuid;
  }

  get parentUuid(): string | null {
    return this._parentUuid;
  }

  get name(): string {
    return this._name;
  }

  get path(): string {
    return this._path;
  }

  get order(): number {
    return this._order;
  }

  get isExpanded(): boolean {
    return this._isExpanded;
  }

  get metadata(): FolderMetadata {
    return this._metadata;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  get children(): FolderClient[] | null {
    return this._children;
  }

  // ===== UI 计算属性 =====
  get depth(): number {
    return this._path.split('/').filter(p => p.length > 0).length;
  }

  get isRoot(): boolean {
    return this._parentUuid === null;
  }

  get hasChildren(): boolean {
    return this._children !== null && this._children.length > 0;
  }

  get pathParts(): string[] {
    return this._path.split('/').filter(p => p.length > 0);
  }

  get displayName(): string {
    return this._metadata.displayIcon + ' ' + this._name;
  }

  get createdAtText(): string {
    return new Date(this._createdAt).toLocaleString();
  }

  get updatedAtText(): string {
    return new Date(this._updatedAt).toLocaleString();
  }

  // ===== 业务方法 =====
  rename(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new Error('Folder name cannot be empty');
    }
    this._name = newName;
    this._updatedAt = Date.now();
  }

  moveTo(newParentUuid: string | null): void {
    this._parentUuid = newParentUuid;
    this._updatedAt = Date.now();
  }

  updateMetadata(metadata: Partial<RepositoryContracts.FolderMetadataServerDTO>): void {
    const currentDTO = this._metadata.toServerDTO();
    const merged = { ...currentDTO, ...metadata };
    this._metadata = FolderMetadata.fromServerDTO(merged);
    this._updatedAt = Date.now();
  }

  setExpanded(isExpanded: boolean): void {
    this._isExpanded = isExpanded;
    this._updatedAt = Date.now();
  }

  // ===== DTO 转换 =====
  toClientDTO(): FolderClientDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      parentUuid: this._parentUuid,
      name: this._name,
      path: this._path,
      order: this._order,
      isExpanded: this._isExpanded,
      metadata: this._metadata.toClientDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      children: this._children?.map(c => (c as any).toClientDTO()) || null,
      depth: this.depth,
      isRoot: this.isRoot,
      hasChildren: this.hasChildren,
      pathParts: this.pathParts,
      displayName: this.displayName,
      createdAtText: this.createdAtText,
      updatedAtText: this.updatedAtText,
    };
  }

  toServerDTO(): FolderServerDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      parentUuid: this._parentUuid,
      name: this._name,
      path: this._path,
      order: this._order,
      isExpanded: this._isExpanded,
      metadata: this._metadata.toServerDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      children: this._children?.map(c => (c as any).toServerDTO()) || null,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: FolderServerDTO): Folder {
    return new Folder(
      dto.uuid,
      dto.repositoryUuid,
      dto.parentUuid ?? null,
      dto.name,
      dto.path,
      dto.order,
      dto.isExpanded,
      FolderMetadata.fromServerDTO(dto.metadata),
      dto.createdAt,
      dto.updatedAt,
      dto.children?.map(c => Folder.fromServerDTO(c)) || null,
    );
  }

  static fromClientDTO(dto: FolderClientDTO): Folder {
    return new Folder(
      dto.uuid,
      dto.repositoryUuid,
      dto.parentUuid ?? null,
      dto.name,
      dto.path,
      dto.order,
      dto.isExpanded,
      FolderMetadata.fromClientDTO(dto.metadata),
      dto.createdAt,
      dto.updatedAt,
      dto.children?.map(c => Folder.fromClientDTO(c)) || null,
    );
  }
}
