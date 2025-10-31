// @ts-nocheck
/**
 * DocumentVersionRepository Interface
 * 
 * Repository 接口 - 文档版本仓储
 * 定义版本数据访问的契约
 */

import type { DocumentVersion } from './DocumentVersion';

export interface FindVersionsOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'versionNumber' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentVersionRepository {
  /**
   * 保存版本
   */
  save(version: DocumentVersion): Promise<void>;

  /**
   * 根据文档 UUID 查找版本列表 (分页)
   */
  findByDocumentUuid(
    documentUuid: string,
    options?: FindVersionsOptions,
  ): Promise<DocumentVersion[]>;

  /**
   * 根据版本 UUID 查找单个版本
   */
  findByUuid(uuid: string): Promise<DocumentVersion | null>;

  /**
   * 根据文档 UUID 和版本号查找
   */
  findByVersionNumber(
    documentUuid: string,
    versionNumber: number,
  ): Promise<DocumentVersion | null>;

  /**
   * 统计文档的版本总数
   */
  countByDocumentUuid(documentUuid: string): Promise<number>;
}
