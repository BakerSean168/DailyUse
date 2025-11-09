/**
 * Folder Metadata Value Object - Server Implementation
 * 文件夹元数据值对象 - 服务端实现
 */
import { RepositoryContracts } from '@dailyuse/contracts';

type FolderMetadataServer = RepositoryContracts.FolderMetadataServer;
type FolderMetadataServerDTO = RepositoryContracts.FolderMetadataServerDTO;

export class FolderMetadata implements FolderMetadataServer {
  // ===== 私有字段 =====
  private _icon?: string;
  private _color?: string;
  private _extensible: Record<string, unknown>;

  // ===== 私有构造函数 =====
  private constructor(
    icon?: string,
    color?: string,
    extensible?: Record<string, unknown>,
  ) {
    this._icon = icon;
    this._color = color;
    this._extensible = extensible || {};
  }

  // ===== Getters =====
  get icon(): string | undefined {
    return this._icon;
  }

  get color(): string | undefined {
    return this._color;
  }

  // ===== 扩展属性访问 =====
  [key: string]: unknown;

  // ===== DTO 转换 =====
  toServerDTO(): FolderMetadataServerDTO {
    return {
      icon: this._icon,
      color: this._color,
      ...this._extensible,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: FolderMetadataServerDTO): FolderMetadata {
    const { icon, color, ...rest } = dto;
    return new FolderMetadata(icon, color, rest);
  }

  static create(params?: Partial<FolderMetadataServerDTO>): FolderMetadata {
    return new FolderMetadata(params?.icon, params?.color, {});
  }
}
