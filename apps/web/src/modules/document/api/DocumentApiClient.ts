import { apiClient } from '@/lib/api-client';
import type { DocumentContracts } from '@dailyuse/contracts';

type DocumentClientDTO = DocumentContracts.DocumentClientDTO;
type CreateDocumentDTO = DocumentContracts.CreateDocumentDTO;
type UpdateDocumentDTO = DocumentContracts.UpdateDocumentDTO;
type FindDocumentsQueryDTO = DocumentContracts.FindDocumentsQueryDTO;

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class DocumentApiClient {
  private readonly baseUrl = '/documents';

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
}

export const documentApiClient = new DocumentApiClient();
