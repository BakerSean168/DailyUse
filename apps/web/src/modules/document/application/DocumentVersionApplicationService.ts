// @ts-nocheck
/**
 * Document Version Application Service
 * Pattern A: ApplicationService only handles API calls and DTO transformation
 * UI feedback (success/error messages) should be handled by Composables
 */

import { documentVersionApi } from '../../infrastructure/api/DocumentVersionApiClient';

export class DocumentVersionApplicationService {
  private static instance: DocumentVersionApplicationService;

  private constructor() {}

  public static getInstance(): DocumentVersionApplicationService {
    if (!DocumentVersionApplicationService.instance) {
      DocumentVersionApplicationService.instance = new DocumentVersionApplicationService();
    }
    return DocumentVersionApplicationService.instance;
  }

  /**
   * 获取文档版本历史 (分页)
   */
  async getVersionHistory(
    documentUuid: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<VersionHistoryResponseDTO> {
    return await documentVersionApi.getVersionHistory(documentUuid, params);
  }

  /**
   * 获取单个版本详情 (包含完整内容)
   */
  async getVersionByUuid(
    documentUuid: string,
    versionUuid: string
  ): Promise<DocumentVersionServerDTO> {
    return await documentVersionApi.getVersionByUuid(documentUuid, versionUuid);
  }

  /**
   * 获取指定版本号的快照
   */
  async getVersionSnapshot(
    documentUuid: string,
    versionNumber: number
  ): Promise<DocumentVersionServerDTO> {
    return await documentVersionApi.getVersionSnapshot(documentUuid, versionNumber);
  }

  /**
   * 比较两个版本的差异 (Git-style diff)
   */
  async compareVersions(
    documentUuid: string,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionComparisonDTO> {
    return await documentVersionApi.compareVersions(documentUuid, fromVersion, toVersion);
  }

  /**
   * 恢复到指定版本 (创建新版本)
   */
  async restoreVersion(
    documentUuid: string,
    versionNumber: number
  ): Promise<DocumentVersionServerDTO> {
    return await documentVersionApi.restoreVersion(documentUuid, versionNumber);
  }
}

// Singleton instance for easy import
export const documentVersionApplicationService = DocumentVersionApplicationService.getInstance();
