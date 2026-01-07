/**
 * Editor IPC Client - Editor 妯″潡 IPC 瀹㈡埛绔? * 
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
   * 鑾峰彇鏂囨。鍒楄〃
   */
  async listDocuments(): Promise<DocumentDTO[]> {
    return this.client.invoke<DocumentDTO[]>(
      EditorChannels.DOCUMENT_LIST,
      {}
    );
  }

  /**
   * 鑾峰彇鍗曚釜鏂囨。
   */
  async getDocument(uuid: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_GET,
      { uuid }
    );
  }

  /**
   * 鍒涘缓鏂囨。
   */
  async createDocument(params: CreateDocumentRequest): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_CREATE,
      params
    );
  }

  /**
   * 鏇存柊鏂囨。
   */
  async updateDocument(params: UpdateDocumentRequest): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_UPDATE,
      params
    );
  }

  /**
   * 鍒犻櫎鏂囨。
   */
  async deleteDocument(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.DOCUMENT_DELETE,
      { uuid }
    );
  }

  /**
   * 閫氳繃鍏宠仈瀹炰綋鑾峰彇鏂囨。
   */
  async getByLinkedEntity(entityType: LinkedEntityType, entityUuid: string): Promise<DocumentDTO | null> {
    return this.client.invoke<DocumentDTO | null>(
      EditorChannels.DOCUMENT_GET_BY_LINKED_ENTITY,
      { entityType, entityUuid }
    );
  }

  /**
   * 涓哄叧鑱斿疄浣撳垱寤烘枃妗?   */
  async createForLinkedEntity(params: {
    entityType: LinkedEntityType;
    entityUuid: string;
    title?: string;
    contentType?: ContentType;
  }): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_CREATE_FOR_LINKED_ENTITY,
      params
    );
  }

  /**
   * 淇濆瓨鏂囨。
   */
  async saveDocument(uuid: string, content: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.DOCUMENT_SAVE,
      { uuid, content }
    );
  }

  // ============ Content Operations ============

  /**
   * 鑾峰彇鏂囨。鍐呭
   */
  async getContent(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.GET_CONTENT,
      { uuid }
    );
  }

  /**
   * 淇濆瓨鏂囨。鍐呭
   */
  async saveContent(uuid: string, content: string): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.SAVE_CONTENT,
      { uuid, content }
    );
  }

  /**
   * 鑷姩淇濆瓨
   */
  async autoSave(uuid: string, content: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.AUTO_SAVE,
      { uuid, content }
    );
  }

  // ============ History & Versioning ============

  /**
   * 鎾ら攢
   */
  async undo(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.UNDO,
      { uuid }
    );
  }

  /**
   * 閲嶅仛
   */
  async redo(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.REDO,
      { uuid }
    );
  }

  /**
   * 鑾峰彇缂栬緫鍘嗗彶
   */
  async getHistory(uuid: string): Promise<VersionDTO[]> {
    return this.client.invoke<VersionDTO[]>(
      EditorChannels.GET_HISTORY,
      { uuid }
    );
  }

  /**
   * 鑾峰彇鐗堟湰鍒楄〃
   */
  async listVersions(uuid: string): Promise<VersionDTO[]> {
    return this.client.invoke<VersionDTO[]>(
      EditorChannels.VERSION_LIST,
      { uuid }
    );
  }

  /**
   * 鑾峰彇鐗瑰畾鐗堟湰
   */
  async getVersion(uuid: string, version: number): Promise<VersionDTO> {
    return this.client.invoke<VersionDTO>(
      EditorChannels.VERSION_GET,
      { uuid, version }
    );
  }

  /**
   * 鎭㈠鍒扮壒瀹氱増鏈?   */
  async restoreVersion(uuid: string, version: number): Promise<DocumentDTO> {
    return this.client.invoke<DocumentDTO>(
      EditorChannels.VERSION_RESTORE,
      { uuid, version }
    );
  }

  // ============ Assets ============

  /**
   * 涓婁紶鍥剧墖
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
   * 鍒犻櫎璧勬簮
   */
  async deleteAsset(assetId: string): Promise<void> {
    return this.client.invoke<void>(
      EditorChannels.DELETE_ASSET,
      { assetId }
    );
  }

  // ============ Search ============

  /**
   * 鎼滅储鏂囨。
   */
  async search(query: string): Promise<SearchResultDTO[]> {
    return this.client.invoke<SearchResultDTO[]>(
      EditorChannels.SEARCH,
      { query }
    );
  }

  // ============ Export ============

  /**
   * 瀵煎嚭涓?Markdown
   */
  async exportMarkdown(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.EXPORT_MARKDOWN,
      { uuid }
    );
  }

  /**
   * 瀵煎嚭涓?HTML
   */
  async exportHtml(uuid: string): Promise<string> {
    return this.client.invoke<string>(
      EditorChannels.EXPORT_HTML,
      { uuid }
    );
  }

  /**
   * 瀵煎嚭涓?PDF
   */
  async exportPdf(uuid: string): Promise<Uint8Array> {
    return this.client.invoke<Uint8Array>(
      EditorChannels.EXPORT_PDF,
      { uuid }
    );
  }

  /**
   * 涓虹洰鏍囧垱寤烘垨鑾峰彇鏂囨。
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
   * 蹇€熷垱寤?Markdown 鏂囨。
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
   * 璁㈤槄鏂囨。鏇存柊浜嬩欢
   */
  onDocumentUpdated(handler: (document: DocumentDTO) => void): () => void {
    return this.client.on(EditorChannels.EVENT_DOCUMENT_UPDATED, handler);
  }

  /**
   * 璁㈤槄鑷姩淇濆瓨浜嬩欢
   */
  onAutosaveCompleted(handler: (document: DocumentDTO) => void): () => void {
    return this.client.on(EditorChannels.EVENT_AUTOSAVE_COMPLETED, handler);
  }
}

// ============ Singleton Export ============

export const editorIPCClient = new EditorIPCClient();
