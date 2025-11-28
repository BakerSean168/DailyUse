/**
 * Folder Metadata Value Object - Client Implementation
 * 文件夹元数据值对象 - 客户端实现
 */
import { FolderMetadataClient, FolderMetadataClientDTO, FolderMetadataServerDTO } from '@dailyuse/contracts/repository';

export class FolderMetadata implements FolderMetadataClient {
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

  // ===== UI 计算属性 =====
  get hasIcon(): boolean {
    return !!this._icon;
  }

  get hasColor(): boolean {
    return !!this._color;
  }

  get displayIcon(): string {
    return this._icon || '📁';
  }

  get displayColor(): string {
    return this._color || '#FFA500';
  }

  // ===== 扩展属性访问 =====
  [key: string]: unknown;

  // ===== DTO 转换 =====
  toClientDTO(): FolderMetadataClientDTO {
    return {
      icon: this._icon,
      color: this._color,
      ...this._extensible,
      hasIcon: this.hasIcon,
      hasColor: this.hasColor,
      displayIcon: this.displayIcon,
      displayColor: this.displayColor,
    };
  }

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

  static fromClientDTO(dto: FolderMetadataClientDTO): FolderMetadata {
    const { icon, color, hasIcon, hasColor, displayIcon, displayColor, ...rest } = dto;
    return new FolderMetadata(icon, color, rest);
  }

  static create(params?: Partial<FolderMetadataServerDTO>): FolderMetadata {
    return new FolderMetadata(params?.icon, params?.color, {});
  }
}
