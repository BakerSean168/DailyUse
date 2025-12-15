# Story 13.21: Editor 模块 IPC Client

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.21 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | High |
| 预估工时 | 6h |
| 状态 | Backlog |

## 目标

为 Editor 模块创建 IPC Client，支持富文本编辑和文档管理。

## 背景

Editor 模块负责任务描述、笔记等富文本内容的编辑。在桌面端需要支持本地文件关联和图片嵌入等功能。

## 任务列表

- [ ] 1. 实现 `DocumentIPCClient`
  - [ ] create(input) - 创建文档
  - [ ] get(uuid) - 获取文档
  - [ ] update(uuid, content) - 更新文档
  - [ ] delete(uuid) - 删除文档
  - [ ] getHistory(uuid) - 获取历史版本
  - [ ] restoreVersion(uuid, versionId) - 恢复版本
- [ ] 2. 实现 `EditorMediaIPCClient`
  - [ ] uploadImage(file) - 上传图片
  - [ ] uploadFromClipboard() - 从剪贴板上传
  - [ ] getMediaUrl(uuid) - 获取媒体 URL
  - [ ] deleteMedia(uuid) - 删除媒体
- [ ] 3. 实现 `EditorTemplateIPCClient`
  - [ ] listTemplates() - 列出模板
  - [ ] createTemplate(input) - 创建模板
  - [ ] applyTemplate(templateUuid) - 应用模板
- [ ] 4. DI 配置
- [ ] 5. 单元测试

## 技术设计

### DocumentIPCClient

```typescript
export class DocumentIPCClient extends BaseIPCClient {
  async create(input: CreateDocumentInput): Promise<DocumentDTO> {
    return this.invoke(IPC_CHANNELS.EDITOR.DOCUMENT.CREATE, input);
  }

  async get(uuid: string): Promise<DocumentDTO | null> {
    return this.invoke(IPC_CHANNELS.EDITOR.DOCUMENT.GET, { uuid });
  }

  async update(uuid: string, content: string): Promise<DocumentDTO> {
    return this.invoke(IPC_CHANNELS.EDITOR.DOCUMENT.UPDATE, { uuid, content });
  }

  async getHistory(uuid: string): Promise<DocumentVersion[]> {
    return this.invoke(IPC_CHANNELS.EDITOR.DOCUMENT.HISTORY, { uuid });
  }

  async restoreVersion(uuid: string, versionId: string): Promise<DocumentDTO> {
    return this.invoke(IPC_CHANNELS.EDITOR.DOCUMENT.RESTORE, { uuid, versionId });
  }

  async saveLocally(uuid: string, path: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.EDITOR.DOCUMENT.SAVE_LOCALLY, { uuid, path });
  }
}
```

### EditorMediaIPCClient

```typescript
export class EditorMediaIPCClient extends BaseIPCClient {
  async uploadImage(base64: string): Promise<MediaDTO> {
    return this.invoke(IPC_CHANNELS.EDITOR.MEDIA.UPLOAD, { data: base64 });
  }

  async uploadFromClipboard(): Promise<MediaDTO | null> {
    return this.invoke(IPC_CHANNELS.EDITOR.MEDIA.UPLOAD_CLIPBOARD);
  }

  async uploadFromFile(): Promise<MediaDTO | null> {
    return this.invoke(IPC_CHANNELS.EDITOR.MEDIA.UPLOAD_FILE);
  }

  async getMediaUrl(uuid: string): Promise<string> {
    return this.invoke(IPC_CHANNELS.EDITOR.MEDIA.GET_URL, { uuid });
  }

  async deleteMedia(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.EDITOR.MEDIA.DELETE, { uuid });
  }
}
```

## 验收标准

- [ ] 文档 CRUD 完整
- [ ] 图片上传功能正常
- [ ] 版本历史功能正常
- [ ] 模板功能正常
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/editor/infrastructure/ipc/document.ipc-client.ts` | 新建 |
| `renderer/modules/editor/infrastructure/ipc/editor-media.ipc-client.ts` | 新建 |
| `renderer/modules/editor/infrastructure/ipc/editor-template.ipc-client.ts` | 新建 |
| `renderer/modules/editor/di/` | 新建 | DI 配置 |

## 依赖关系

- **前置依赖**: Stories 13.1, 13.4
- **后续依赖**: Story 13.22 (Editor Store)
