# Story 13.25: Editor 模块 IPC Client

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.25 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 3: 内容模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 3h |
| 前置依赖 | Story 13.24 (Editor Main Handler) |
| 关联模块 | Editor |

## 目标

创建 Editor 模块完整的 IPC Client，封装所有编辑器相关的 IPC 调用。

## 任务列表

### 1. 创建 EditorIPCClient (2h)
- [ ] 创建 `editor.ipc-client.ts`
- [ ] 实现文档管理方法
  - `createDocument()`
  - `openDocument()`
  - `saveDocument()`
  - `closeDocument()`
  - `listDocuments()`
- [ ] 实现内容操作方法
  - `getContent()`
  - `setContent()`
  - `getDocumentInfo()`
- [ ] 实现草稿管理方法
  - `saveDraft()`
  - `listDrafts()`
  - `recoverDraft()`
  - `deleteDraft()`

### 2. 创建 TemplateIPCClient (0.5h)
- [ ] 实现模板管理方法
  - `listTemplates()`
  - `getTemplate()`
  - `createTemplate()`
  - `updateTemplate()`
  - `deleteTemplate()`

### 3. 导出和索引 (0.5h)
- [ ] 创建 `index.ts` 导出
- [ ] 导出类型定义
- [ ] 创建单例实例

## 技术规范

### EditorIPCClient 实现
```typescript
// renderer/modules/editor/infrastructure/ipc/editor.ipc-client.ts
import { BaseIPCClient } from '@/shared/infrastructure/ipc';

export interface EditorDocument {
  uuid: string;
  title: string;
  content: string;
  format: 'markdown' | 'richtext' | 'plain';
  createdAt: Date;
  updatedAt: Date;
  isDirty: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateDocumentOptions {
  title?: string;
  content?: string;
  format?: 'markdown' | 'richtext' | 'plain';
  templateUuid?: string;
}

export interface DraftInfo {
  uuid: string;
  documentUuid: string;
  title: string;
  savedAt: Date;
  size: number;
}

export interface DocumentTemplate {
  uuid: string;
  name: string;
  description?: string;
  content: string;
  format: 'markdown' | 'richtext' | 'plain';
}

export class EditorIPCClient extends BaseIPCClient {
  // ===== Document Management =====
  
  async createDocument(options?: CreateDocumentOptions): Promise<EditorDocument> {
    return this.invoke('editor:create-document', options);
  }

  async openDocument(uuid: string): Promise<EditorDocument | null> {
    return this.invoke('editor:open-document', { uuid });
  }

  async saveDocument(uuid: string): Promise<{ success: boolean; error?: string }> {
    return this.invoke('editor:save-document', { uuid });
  }

  async closeDocument(uuid: string): Promise<void> {
    return this.invoke('editor:close-document', { uuid });
  }

  async listDocuments(): Promise<EditorDocument[]> {
    return this.invoke('editor:list-documents');
  }

  async getDocumentInfo(uuid: string): Promise<EditorDocument | null> {
    return this.invoke('editor:get-document-info', { uuid });
  }

  // ===== Content Operations =====

  async getContent(uuid: string): Promise<string> {
    return this.invoke('editor:get-content', { uuid });
  }

  async setContent(uuid: string, content: string): Promise<void> {
    return this.invoke('editor:set-content', { uuid, content });
  }

  async updateTitle(uuid: string, title: string): Promise<EditorDocument> {
    return this.invoke('editor:update-title', { uuid, title });
  }

  // ===== Draft Management =====

  async saveDraft(uuid: string): Promise<DraftInfo> {
    return this.invoke('editor:save-draft', { uuid });
  }

  async listDrafts(): Promise<DraftInfo[]> {
    return this.invoke('editor:list-drafts');
  }

  async recoverDraft(draftUuid: string): Promise<EditorDocument> {
    return this.invoke('editor:recover-draft', { uuid: draftUuid });
  }

  async deleteDraft(draftUuid: string): Promise<void> {
    return this.invoke('editor:delete-draft', { uuid: draftUuid });
  }

  async clearOldDrafts(maxAge?: number): Promise<number> {
    return this.invoke('editor:clear-old-drafts', { maxAge });
  }

  // ===== Template Management =====

  async listTemplates(): Promise<DocumentTemplate[]> {
    return this.invoke('editor:list-templates');
  }

  async getTemplate(uuid: string): Promise<DocumentTemplate | null> {
    return this.invoke('editor:get-template', { uuid });
  }

  async createTemplate(template: Omit<DocumentTemplate, 'uuid'>): Promise<DocumentTemplate> {
    return this.invoke('editor:create-template', template);
  }

  async updateTemplate(uuid: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    return this.invoke('editor:update-template', { uuid, ...updates });
  }

  async deleteTemplate(uuid: string): Promise<void> {
    return this.invoke('editor:delete-template', { uuid });
  }

  // ===== Auto-save Configuration =====

  async getAutoSaveConfig(): Promise<AutoSaveConfig> {
    return this.invoke('editor:get-autosave-config');
  }

  async setAutoSaveConfig(config: Partial<AutoSaveConfig>): Promise<AutoSaveConfig> {
    return this.invoke('editor:set-autosave-config', config);
  }
}

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxDrafts: number;
}

export const editorIPCClient = new EditorIPCClient();
```

### 索引文件
```typescript
// renderer/modules/editor/infrastructure/ipc/index.ts
export {
  EditorIPCClient,
  editorIPCClient,
  type EditorDocument,
  type CreateDocumentOptions,
  type DraftInfo,
  type DocumentTemplate,
  type AutoSaveConfig,
} from './editor.ipc-client';
```

## 验收标准

- [ ] 所有文档操作方法实现完成
- [ ] 草稿管理方法实现完成
- [ ] 模板管理方法实现完成
- [ ] TypeScript 类型完整
- [ ] 与 Main Process handlers 对应
- [ ] 单例实例正确导出

## 相关文件

- `renderer/modules/editor/infrastructure/ipc/editor.ipc-client.ts`
- `renderer/modules/editor/infrastructure/ipc/index.ts`
