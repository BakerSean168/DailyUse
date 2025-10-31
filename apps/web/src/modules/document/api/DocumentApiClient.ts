// @ts-nocheck
import { apiClient } from '@/shared/api/instances';
import { DocumentContracts } from '@dailyuse/contracts';

type DocumentClientDTO = DocumentContracts.DocumentClientDTO;
type CreateDocumentDTO = DocumentContracts.CreateDocumentDTO;
type UpdateDocumentDTO = DocumentContracts.UpdateDocumentDTO;
type FindDocumentsQueryDTO = DocumentContracts.FindDocumentsQueryDTO;
type BacklinksResponseDTO = DocumentContracts.BacklinksResponseDTO;
type LinkGraphResponseDTO = DocumentContracts.LinkGraphResponseDTO;
type BrokenLinksResponseDTO = DocumentContracts.BrokenLinksResponseDTO;
type RepairLinkRequestDTO = DocumentContracts.RepairLinkRequestDTO;

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class DocumentApiClient {
  private readonly baseUrl = '/documents';

  // ==================== 基础 CRUD ====================

  async createDocument(dto: CreateDocumentDTO): Promise<DocumentClientDTO> {
    const response = await apiClient.post(this.baseUrl, dto);
    return response.data.data;
  }

  async findDocuments(query: FindDocumentsQueryDTO): Promise<PaginatedResult<DocumentClientDTO>> {
    const response = await apiClient.get(this.baseUrl, { params: query });
    return response.data.data;
  }

  async findDocumentByUuid(uuid: string): Promise<DocumentClientDTO> {
    const response = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return response.data.data;
  }

  async updateDocument(uuid: string, dto: UpdateDocumentDTO): Promise<DocumentClientDTO> {
    const response = await apiClient.put(`${this.baseUrl}/${uuid}`, dto);
    return response.data.data;
  }

  async deleteDocument(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ==================== 双向链接 APIs ====================

  /**
   * 获取文档的反向引用（哪些文档引用了当前文档）
   */
  async getBacklinks(documentUuid: string): Promise<BacklinksResponseDTO> {
    const response = await apiClient.get(`${this.baseUrl}/${documentUuid}/backlinks`);
    return response.data;
  }

  /**
   * 获取文档的链接图谱（递归获取关联文档网络）
   */
  async getLinkGraph(documentUuid: string, depth: number = 2): Promise<LinkGraphResponseDTO> {
    const response = await apiClient.get(`${this.baseUrl}/${documentUuid}/link-graph`, {
      params: { depth },
    });
    return response.data;
  }

  /**
   * 获取所有断裂的链接（目标文档已删除）
   */
  async getBrokenLinks(): Promise<BrokenLinksResponseDTO> {
    const response = await apiClient.get(`${this.baseUrl}/links/broken`);
    return response.data;
  }

  /**
   * 修复断裂的链接（指向新的目标文档）
   */
  async repairLink(linkUuid: string, dto: RepairLinkRequestDTO): Promise<void> {
    await apiClient.put(`${this.baseUrl}/links/${linkUuid}/repair`, dto);
  }

  /**
   * 搜索文档标题（用于链接自动补全）
   */
  async searchDocuments(query: string, limit: number = 10): Promise<DocumentClientDTO[]> {
    const response = await apiClient.get(`${this.baseUrl}`, {
      params: { 
        search: query,
        pageSize: limit,
        page: 1,
      },
    });
    return response.data.data.items || [];
  }
}

export const documentApiClient = new DocumentApiClient();
