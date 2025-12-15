# Story 13.24: Editor Main Process IPC Handler 完善

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.24 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 3: 内容模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.1 (IPC Client 基础架构) |
| 关联模块 | Editor |

## 目标

完善 Editor 模块的 Main Process 实现，确保所有文档编辑相关的 IPC handlers 正常工作。

## 背景

Editor 模块提供富文本/Markdown 编辑功能，用于 Goal 描述、Task 详情等内容编辑。Main Process 负责文档持久化、草稿管理、模板管理等。

## 任务列表

### 1. 审查现有 EditorDesktopApplicationService (0.5h)
- [ ] 审查 `EditorDesktopApplicationService.ts` 实现
- [ ] 确认文档管理方法完整性
- [ ] 确认自动保存逻辑
- [ ] 确认模板管理功能

### 2. 完善 IPC Handlers (2h)
- [ ] 创建/完善 `editor-ipc-handler.ts`
- [ ] 实现文档 CRUD handlers
  - `editor:create-document`
  - `editor:open-document`
  - `editor:save-document`
  - `editor:close-document`
  - `editor:list-documents`
- [ ] 实现内容操作 handlers
  - `editor:get-content`
  - `editor:set-content`
  - `editor:get-document-info`
- [ ] 实现自动保存/草稿 handlers
  - `editor:save-draft`
  - `editor:list-drafts`
  - `editor:recover-draft`
  - `editor:delete-draft`

### 3. 实现模板管理 handlers (1h)
- [ ] `editor:list-templates`
- [ ] `editor:get-template`
- [ ] `editor:create-template`
- [ ] `editor:update-template`
- [ ] `editor:delete-template`

### 4. 更新类型定义 (0.5h)
- [ ] 更新 `electron.d.ts` 添加 Editor 相关类型
- [ ] 确保 IPC 通道类型完整

## 技术规范

### IPC Handler 实现
```typescript
// main/modules/editor/ipc/editor-ipc-handler.ts
import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { EditorDesktopApplicationService } from '../application/EditorDesktopApplicationService';

export class EditorIPCHandler extends BaseIPCHandler {
  private editorService: EditorDesktopApplicationService;

  constructor() {
    super('EditorIPCHandler');
    this.editorService = new EditorDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Document Management
    ipcMain.handle('editor:create-document', async (_, options) => {
      return this.handleRequest(
        'editor:create-document',
        () => this.editorService.createDocument(options)
      );
    });

    ipcMain.handle('editor:open-document', async (_, uuid: string) => {
      return this.handleRequest(
        'editor:open-document',
        () => this.editorService.openDocument(uuid)
      );
    });

    ipcMain.handle('editor:save-document', async (_, uuid: string) => {
      return this.handleRequest(
        'editor:save-document',
        () => this.editorService.saveDocument(uuid)
      );
    });

    ipcMain.handle('editor:close-document', async (_, uuid: string) => {
      return this.handleRequest(
        'editor:close-document',
        () => this.editorService.closeDocument(uuid)
      );
    });

    ipcMain.handle('editor:list-documents', async () => {
      return this.handleRequest(
        'editor:list-documents',
        () => this.editorService.listDocuments()
      );
    });

    // Content Operations
    ipcMain.handle('editor:get-content', async (_, uuid: string) => {
      return this.handleRequest(
        'editor:get-content',
        () => this.editorService.getContent(uuid)
      );
    });

    ipcMain.handle('editor:set-content', async (_, payload: { uuid: string; content: string }) => {
      return this.handleRequest(
        'editor:set-content',
        () => this.editorService.setContent(payload.uuid, payload.content)
      );
    });

    // Draft Management
    ipcMain.handle('editor:save-draft', async (_, uuid: string) => {
      return this.handleRequest(
        'editor:save-draft',
        () => this.editorService.saveDraft(uuid)
      );
    });

    ipcMain.handle('editor:list-drafts', async () => {
      return this.handleRequest(
        'editor:list-drafts',
        () => this.editorService.listDrafts()
      );
    });

    ipcMain.handle('editor:recover-draft', async (_, uuid: string) => {
      return this.handleRequest(
        'editor:recover-draft',
        () => this.editorService.recoverDraft(uuid)
      );
    });

    // Template Management
    ipcMain.handle('editor:list-templates', async () => {
      return this.handleRequest(
        'editor:list-templates',
        () => this.editorService.listTemplates()
      );
    });

    ipcMain.handle('editor:get-template', async (_, uuid: string) => {
      return this.handleRequest(
        'editor:get-template',
        () => this.editorService.getTemplate(uuid)
      );
    });

    ipcMain.handle('editor:create-template', async (_, template) => {
      return this.handleRequest(
        'editor:create-template',
        () => this.editorService.createTemplate(template)
      );
    });

    this.logger.info('Registered Editor IPC handlers');
  }
}

export const editorIPCHandler = new EditorIPCHandler();
```

### 类型定义
```typescript
// electron.d.ts (additions)
interface EditorAPI {
  createDocument: (options?: CreateDocumentOptions) => Promise<EditorDocument>;
  openDocument: (uuid: string) => Promise<EditorDocument | null>;
  saveDocument: (uuid: string) => Promise<SaveResult>;
  closeDocument: (uuid: string) => Promise<void>;
  listDocuments: () => Promise<EditorDocument[]>;
  getContent: (uuid: string) => Promise<string>;
  setContent: (uuid: string, content: string) => Promise<void>;
  saveDraft: (uuid: string) => Promise<DraftInfo>;
  listDrafts: () => Promise<DraftInfo[]>;
  recoverDraft: (uuid: string) => Promise<EditorDocument>;
  listTemplates: () => Promise<DocumentTemplate[]>;
  getTemplate: (uuid: string) => Promise<DocumentTemplate | null>;
  createTemplate: (template: CreateTemplateInput) => Promise<DocumentTemplate>;
}

interface CreateDocumentOptions {
  title?: string;
  content?: string;
  format?: 'markdown' | 'richtext' | 'plain';
  templateUuid?: string;
}

interface EditorDocument {
  uuid: string;
  title: string;
  content: string;
  format: 'markdown' | 'richtext' | 'plain';
  createdAt: Date;
  updatedAt: Date;
  isDirty: boolean;
}
```

## 验收标准

- [ ] 所有 IPC handlers 注册成功
- [ ] 文档 CRUD 操作正常
- [ ] 草稿自动保存和恢复正常
- [ ] 模板管理功能完整
- [ ] TypeScript 类型检查通过
- [ ] 错误处理正确

## 相关文件

- `main/modules/editor/ipc/editor-ipc-handler.ts`
- `main/modules/editor/application/EditorDesktopApplicationService.ts`
- `electron.d.ts`
