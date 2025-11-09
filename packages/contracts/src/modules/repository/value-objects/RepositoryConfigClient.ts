/**
 * Repository Config Value Object - Client
 * 仓储配置值对象 - 客户端
 */
import type { RepositoryConfigServerDTO } from './RepositoryConfigServer';

// ============ Client DTO ============
export interface RepositoryConfigClientDTO {
  searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;

  // UI 计算字段
  searchEngineText: string;
  gitStatusText: string;
  syncStatusText: string;
}

// ============ Client 接口 ============
export interface RepositoryConfigClient {
  searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  enableGit: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  [key: string]: unknown;

  // UI 计算属性
  searchEngineText: string;
  gitStatusText: string;
  syncStatusText: string;

  toClientDTO(): RepositoryConfigClientDTO;
  toServerDTO(): RepositoryConfigServerDTO;
}

// ============ Client Static ============
export interface RepositoryConfigClientStatic {
  fromServerDTO(dto: RepositoryConfigServerDTO): RepositoryConfigClient;
  fromClientDTO(dto: RepositoryConfigClientDTO): RepositoryConfigClient;
}
