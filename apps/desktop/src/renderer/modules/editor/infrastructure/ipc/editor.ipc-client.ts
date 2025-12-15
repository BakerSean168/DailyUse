/**
 * Editor IPC Client - Editor 模块 IPC 客户端
 * 
 * @module renderer/modules/editor/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { EditorChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface DocumentDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  contentType: ContentType;
  linkedEntityType?: LinkedEntityType;
  linkedEntityUuid?: string;
  metadata: DocumentMetadataDTO;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export type ContentType = 'plain_text' | 'markdown' | 'rich_text' | 'code';
export type LinkedEntityType = 'task' | 'goal' | 'schedule' | 'note';

export interface DocumentMetadataDTO {
  wordCount: number;
  characterCount: number;
  lineCount: number;
  readingTimeMinutes: number;
  language?: string;
  tags?: string[];
  lastEditedPosition?: EditorPositionDTO;
}

export interface EditorPositionDTO {
  line: number;
  column: number;
  offset: number;
}

export interface VersionDTO {
  version: number;
  content: string;
  updatedAt: number;
}

export interface SearchResultDTO {
  documentUuid: string;
  matches: SearchMatchDTO[];
  totalMatches: number;
}

export interface SearchMatchDTO {
  line: number;
  column: number;
  length: number;
  preview: string;
}

export interface CreateDocumentRequest {
  title: string;
  content?: string;
  contentType?: ContentType;
}

export interface UpdateDocumentRequest {
  uuid: string;
  title?: string;
  content?: string;
}

// ============ Editor IPC Client ============

/**
 * Editor IPC Client
 */
export class EditorIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Document CRUD ============

  /**
   * 获取文档列表
   */
  async listDocuments(): Promise<DocumentDTO[]> {
    return this.client.invoke<DocumentDTO[]>(
      EditorChannels.DOCUMENT_LIST,
      {}
    );
  }

  /**
   * 获取单个文档
   */
  async getDocument(uuid: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_GET,
      { uuid }
    );
  }

  /**
   * 创建文档
   */
  async createDocument(params: CreateDocumentRequest): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_CREATE,
      params
    );
  }

  /**
   * 更新文档
   */
  async updateDocument(params: UpdateDocumentRequest): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_UPDATE,
      params
    );
  }

  /**
   * 删除文档
   */
  async deleteDocument(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.DOCUMENT_DELETE,
      { uuid }
    );
  }

  // ============ Content Operations ============

  /**
   * 获取文档内容
   */
  async getContent(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.GET_CONTENT,
      { uuid }
    );
  }

  /**
   * 保存文档内容
   */
  async saveContent(uuid: string, content: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.SAVE_CONTENT,
      { uuid, content }
    );
  }

  /**
   * 自动保存
   */
  async autoSave(uuid: string, content: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.AUTO_SAVE,
      { uuid, content }
    );
  }

  // ============ History & Versioning ============

  /**
   * 撤销
   */
  async undo(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.UNDO,
      { uuid }
    );
  }

  /**
   * 重做
   */
  async redo(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.REDO,
      { uuid }
    );
  }

  /**
   * 获取编辑历史
   */
  async getHistory(uuid: string): Promise<VersionDTO[]> {
    return this.client.invoke<VersionDTO[]>(
      EditorChannels.GET_HISTORY,
      { uuid }
    );
  }

  /**
   * 获取版本列表
   */
  async listVersions(uuid: string): Promise<VersionDTO[]> {
    return this.client.invoke<VersionDTO[]>(
      EditorChannels.VERSION_LIST,
      { uuid }
    );
  }

  /**
   * 获取特定版本
   */
  async getVersion(uuid: string, version: number): Promise<VersionDTO> {
    return this.client.invoke<VersionDTO>(
      EditorChannels.VERSION_GET,
      { uuid, version }
    );
  }

  /**
   * 恢复到特定版本
   */
  async restoreVersion(uuid: string, version: number): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.VERSION_RESTORE,
      { uuid, version }
    );
  }

  // ============ Assets ============

  /**
   * 上传图片
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    const buffer = await file.arrayBuffer();
    return this.client.invoke(
      EditorChannels.UPLOAD_IMAGE,
      { 
        name: file.name, 
        type: file.type,
        data: Array.from(new Uint8Array(buffer))
      }
    );
  }

  /**
   * 删除资源
   */
  async deleteAsset(assetId: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.DELETE_ASSET,
      { assetId }
    );
  }

  // ============ Search ============

  /**
   * 搜索文档
   */
  async search(query: string): Promise<SearchResultDTO[]> {
    return this.client.invoke<SearchResultDTO[]>(
      EditorChannels.SEARCH,
      { query }
    );
  }

  // ============ Export ============

  /**
   * 导出为 Markdown
   */
  async exportMarkdown(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.EXPORT_MARKDOWN,
      { uuid }
    );
  }

  /**
   * 导出为 HTML
   */
  async exportHtml(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.EXPORT_HTML,
      { uuid }
    );
  }

  /**
   * 导出为 PDF
   */
  async exportPdf(uuid: string): Promise<Uint8Array> {
    return this.client.invoke<Uint8Array>(
      EditorChannels.EXPORT_PDF,
      { uuid }
    );
  }
}

// ============ Singleton Export ============

export const editorIPCClient = new EditorIPCClient();
  }

  /**
   * 为目标创建或获取文档
   */
  async getOrCreateForGoal(goalUuid: string, title?: string): Promise<DocumentDTO> {
    const existing = await this.getByLinkedEntity('goal', goalUuid);
    if (existing) return existing;
    return this.createForLinkedEntity({
      entityType: 'goal',
      entityUuid: goalUuid,
      title: title || 'Goal Notes',
      contentType: 'markdown',
    });
  }

  /**
   * 快速创建 Markdown 文档
   */
  async quickCreateMarkdown(params: {
    accountUuid: string;
    title: string;
    content?: string;
  }): Promise<DocumentDTO> {
    return this.createDocument({
      ...params,
      content: params.content || '',
      contentType: 'markdown',
    });
  }

  // ============ Event Subscriptions ============

  /**
   * 订阅文档更新事件
   */
  onDocumentUpdated(handler: (document: DocumentDTO) => void): () => void {
    return this.client.on(EditorChannels.EVENT_DOCUMENT_UPDATED, handler);
  }

  /**
   * 订阅自动保存事件
   */
  onAutosaveCompleted(handler: (document: DocumentDTO) => void): () => void {
    return this.client.on(EditorChannels.EVENT_AUTOSAVE_COMPLETED, handler);
  }
}

// ============ Singleton Export ============

export const editorIPCClient = new EditorIPCClient();
