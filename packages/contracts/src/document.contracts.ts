export namespace DocumentContracts {
  // Server-side DTO (includes sensitive data)
  export interface DocumentServerDTO {
    uuid: string;
    accountUuid: string;
    title: string;
    content: string;
    folderPath: string;
    tags: string[];
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    currentVersion: number;
    lastVersionedAt: number | null;
    createdAt: number;
    updatedAt: number;
    deletedAt: number | null;
  }

  // Client-side DTO (public data only)
  export interface DocumentClientDTO {
    uuid: string;
    title: string;
    content: string;
    excerpt: string;
    folderPath: string;
    tags: string[];
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    currentVersion: number;
    lastVersionedAt: number | null;
    createdAt: number;
    updatedAt: number;
  }

  // Create Document DTO
  export interface CreateDocumentDTO {
    title: string;
    content?: string;
    folderPath?: string;
    tags?: string[];
  }

  // Update Document DTO
  export interface UpdateDocumentDTO {
    title?: string;
    content?: string;
    folderPath?: string;
    tags?: string[];
  }

  // Find Documents Query DTO
  export interface FindDocumentsQueryDTO {
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    folderPath?: string;
  }

  // ==================== Version Management DTOs ====================

  // Version change types
  export type VersionChangeType = 'initial' | 'major' | 'minor' | 'patch' | 'restore';

  // Version metadata
  export interface DocumentVersionMetadata {
    addedChars: number;
    deletedChars: number;
    modifiedSections: number;
  }

  // Document Version Server DTO (complete data for backend)
  export interface DocumentVersionServerDTO {
    uuid: string;
    documentUuid: string;
    versionNumber: number;
    title: string;
    content: string;
    changeType: VersionChangeType;
    changeDescription?: string;
    changedBy: string;
    restoredFrom?: string;
    metadata?: DocumentVersionMetadata;
    createdAt: number;
  }

  // Document Version Client DTO (simplified for frontend lists)
  export interface DocumentVersionClientDTO {
    uuid: string;
    versionNumber: number;
    title: string;
    changeType: VersionChangeType;
    changeDescription?: string;
    changedBy: string;
    createdAt: number;
    excerpt: string;
  }

  // Version diff line
  export interface VersionDiffLine {
    lineNumber: number;
    type: 'added' | 'removed' | 'unchanged';
    content: string;
  }

  // Version comparison result
  export interface VersionComparisonDTO {
    fromVersion: {
      versionNumber: number;
      title: string;
      createdAt: number;
    };
    toVersion: {
      versionNumber: number;
      title: string;
      createdAt: number;
    };
    diffs: VersionDiffLine[];
    summary: {
      addedLines: number;
      removedLines: number;
      unchangedLines: number;
    };
  }

  // Compare versions request
  export interface CompareVersionsRequestDTO {
    fromVersion: number;
    toVersion: number;
  }

  // Restore version request
  export interface RestoreVersionRequestDTO {
    versionNumber: number;
  }

  // Get version history query
  export interface GetVersionHistoryQueryDTO {
    page?: number;
    pageSize?: number;
  }

  // Version history response (paginated)
  export interface VersionHistoryResponseDTO {
    items: DocumentVersionClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
}
