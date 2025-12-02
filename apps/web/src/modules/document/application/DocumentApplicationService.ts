/**
 * Document Application Service
 * 文档应用服务 - 负责文档的 CRUD 操作
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 */

// @ts-nocheck
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';
import { documentApiClient } from '../api/DocumentApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('DocumentApplicationService');

export interface FindDocumentsQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  folderPath?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateDocumentRequest {
  title: string;
  content?: string;
  folderPath?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  folderPath?: string;
}

export class DocumentApplicationService {
  private static instance: DocumentApplicationService;

  private constructor() {}

  static getInstance(): DocumentApplicationService {
    if (!DocumentApplicationService.instance) {
      DocumentApplicationService.instance = new DocumentApplicationService();
    }
    return DocumentApplicationService.instance;
  }

  /**
   * 查询文档列表
   */
  async findDocuments(query: FindDocumentsQuery = {}): Promise<PaginatedResult<DocumentClientDTO>> {
    logger.info('Finding documents', query);
    const result = await documentApiClient.findDocuments({
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      folderPath: query.folderPath,
    });
    logger.info('Documents found', { total: result.total });
    return result;
  }

  /**
   * 根据 UUID 查询文档
   */
  async findDocumentByUuid(uuid: string): Promise<DocumentClientDTO> {
    logger.info('Finding document by UUID', { uuid });
    const document = await documentApiClient.findDocumentByUuid(uuid);
    logger.info('Document found', { uuid });
    return document;
  }

  /**
   * 创建文档
   */
  async createDocument(dto: CreateDocumentRequest): Promise<DocumentClientDTO> {
    logger.info('Creating document', { title: dto.title });
    const document = await documentApiClient.createDocument(dto);
    logger.info('Document created', { uuid: document.uuid });
    return document;
  }

  /**
   * 更新文档
   */
  async updateDocument(uuid: string, dto: UpdateDocumentRequest): Promise<DocumentClientDTO> {
    logger.info('Updating document', { uuid });
    const document = await documentApiClient.updateDocument(uuid, dto);
    logger.info('Document updated', { uuid });
    return document;
  }

  /**
   * 删除文档
   */
  async deleteDocument(uuid: string): Promise<void> {
    logger.info('Deleting document', { uuid });
    await documentApiClient.deleteDocument(uuid);
    logger.info('Document deleted', { uuid });
  }

  /**
   * 搜索文档标题
   */
  async searchDocuments(query: string, limit: number = 10): Promise<DocumentClientDTO[]> {
    logger.info('Searching documents', { query, limit });
    const documents = await documentApiClient.searchDocuments(query, limit);
    logger.info('Documents searched', { count: documents.length });
    return documents;
  }
}

export const documentApplicationService = DocumentApplicationService.getInstance();
