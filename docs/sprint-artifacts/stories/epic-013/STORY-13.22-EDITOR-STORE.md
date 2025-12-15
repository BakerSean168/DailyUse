# Story 13.22: Editor Store & 富文本集成

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.22 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | High |
| 预估工时 | 6h |
| 状态 | Backlog |

## 目标

创建 Editor Store 并集成富文本编辑器。

## 任务列表

- [ ] 1. 创建 Editor Store
- [ ] 2. 集成 Tiptap/ProseMirror 编辑器
- [ ] 3. 实现图片拖拽上传
- [ ] 4. 实现版本历史 UI
- [ ] 5. 添加单元测试

## 技术设计

### Editor Store

```typescript
export const useEditorStore = defineStore('editor', {
  state: () => ({
    currentDocument: null as DocumentDTO | null,
    isDirty: false,
    versions: [] as DocumentVersion[],
    autoSaveEnabled: true,
    autoSaveInterval: 30000, // 30秒
    loading: false,
  }),

  actions: {
    async loadDocument(uuid: string) {
      const client = this.getDocumentClient();
      this.currentDocument = await client.get(uuid);
      this.isDirty = false;
    },

    async saveDocument() {
      if (!this.currentDocument || !this.isDirty) return;
      
      const client = this.getDocumentClient();
      await client.update(this.currentDocument.uuid, this.currentDocument.content);
      this.isDirty = false;
    },

    updateContent(content: string) {
      if (this.currentDocument) {
        this.currentDocument.content = content;
        this.isDirty = true;
      }
    },

    async uploadImage(file: File) {
      const base64 = await fileToBase64(file);
      const client = this.getMediaClient();
      return client.uploadImage(base64);
    },
  },
});
```

## 验收标准

- [ ] Store 功能完整
- [ ] 富文本编辑正常
- [ ] 图片上传正常
- [ ] 自动保存功能正常
- [ ] 版本历史可查看和恢复

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/editor/store/editor.store.ts` | 新建 |
| `renderer/modules/editor/components/RichTextEditor.vue` | 新建 |
| `renderer/modules/editor/components/VersionHistory.vue` | 新建 |
| `renderer/modules/editor/composables/useEditorAutoSave.ts` | 新建 |

## 依赖关系

- **前置依赖**: Story 13.21
- **后续依赖**: 无
