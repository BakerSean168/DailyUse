/**
 * Document Version API Client
 * 
 * Infrastructure Layer - API 客户端
 * 提供版本历史、比较、恢复等 API 调用
 */

import { apiClient } from '@/shared/api/instances';
import type { DocumentContracts } from '@dailyuse/contracts';

type DocumentVersionClientDTO = DocumentContracts.DocumentVersionClientDTO;
type DocumentVersionServerDTO = DocumentContracts.DocumentVersionServerDTO;
type VersionComparisonDTO = DocumentContracts.VersionComparisonDTO;
type VersionHistoryResponseDTO = DocumentContracts.VersionHistoryResponseDTO;

export class DocumentVersionApiClient {
  /**
   * 获取文档版本历史 (分页)
   */
  async getVersionHistory(
    documentUuid: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<VersionHistoryResponseDTO> {
    const { page = 1, pageSize = 20 } = params || {};
    const response = await apiClient.get<VersionHistoryResponseDTO>(
      `/documents/${documentUuid}/versions`,
      { params: { page, pageSize } }
    );
    return response.data;
  }

  /**
   * 获取单个版本详情 (包含完整内容)
   */
  async getVersionByUuid(
    documentUuid: string,
    versionUuid: string
  ): Promise<DocumentVersionServerDTO> {
    const response = await apiClient.get<DocumentVersionServerDTO>(
      `/documents/${documentUuid}/versions/${versionUuid}`
    );
    return response.data;
  }

  /**
   * 获取指定版本号的快照
   */
  async getVersionSnapshot(
    documentUuid: string,
    versionNumber: number
  ): Promise<DocumentVersionServerDTO> {
    const response = await apiClient.get<DocumentVersionServerDTO>(
      `/documents/${documentUuid}/versions/snapshot/${versionNumber}`
    );
    return response.data;
  }

  /**
   * 比较两个版本的差异 (Git-style diff)
   */
  async compareVersions(
    documentUuid: string,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionComparisonDTO> {
    const response = await apiClient.post<VersionComparisonDTO>(
      `/documents/${documentUuid}/versions/compare`,
      { fromVersion, toVersion }
    );
    return response.data;
  }

  /**
   * 恢复到指定版本 (创建新版本)
   */
  async restoreVersion(
    documentUuid: string,
    versionNumber: number
  ): Promise<DocumentVersionServerDTO> {
    const response = await apiClient.post<DocumentVersionServerDTO>(
      `/documents/${documentUuid}/versions/${versionNumber}/restore`
    );
    return response.data;
  }
}

// Export singleton instance
export const documentVersionApi = new DocumentVersionApiClient();
