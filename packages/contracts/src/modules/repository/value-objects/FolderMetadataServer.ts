/**
 * Folder Metadata Value Object - Server
 * 文件夹元数据值对象 - 服务端
 */

// ============ Server DTO ============
export interface FolderMetadataServerDTO {
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

// ============ Server 接口 ============
export interface FolderMetadataServer {
  icon?: string;
  color?: string;
  [key: string]: unknown;

  toServerDTO(): FolderMetadataServerDTO;
}

// ============ Server Static ============
export interface FolderMetadataServerStatic {
  create(params?: Partial<FolderMetadataServerDTO>): FolderMetadataServer;
  fromServerDTO(dto: FolderMetadataServerDTO): FolderMetadataServer;
}
