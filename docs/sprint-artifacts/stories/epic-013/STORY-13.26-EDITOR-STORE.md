# Story 13.26: Editor 模块 Store 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.26 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 3: 内容模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.25 (Editor IPC Client) |
| 关联模块 | Editor |

## 目标

实现 Editor 模块的 Zustand Store，管理文档编辑状态、草稿、模板等。

## 任务列表

### 1. 创建 editorStore (2.5h)
- [ ] 定义 State 接口
- [ ] 实现文档状态管理
  - 打开文档列表
  - 当前活动文档
  - dirty 状态追踪
- [ ] 实现文档操作 Actions
  - `createDocument()`
  - `openDocument()`
  - `saveDocument()`
  - `closeDocument()`
  - `setActiveDocument()`
- [ ] 实现内容操作 Actions
  - `updateContent()`
  - `markDirty()`
  - `markClean()`

### 2. 实现草稿状态管理 (0.5h)
- [ ] 草稿列表状态
- [ ] `saveDraft()` action
- [ ] `recoverDraft()` action
- [ ] `deleteDraft()` action

### 3. 实现模板状态管理 (0.5h)
- [ ] 模板列表状态
- [ ] `loadTemplates()` action
- [ ] `createFromTemplate()` action

### 4. 实现自动保存配置 (0.5h)
- [ ] 自动保存配置状态
- [ ] `updateAutoSaveConfig()` action
- [ ] 自动保存计时器集成

## 技术规范

### editorStore 实现
```typescript
// renderer/modules/editor/presentation/stores/editorStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  editorIPCClient,
  type EditorDocument,
  type CreateDocumentOptions,
  type DraftInfo,
  type DocumentTemplate,
  type AutoSaveConfig,
} from '../../infrastructure/ipc';

interface EditorState {
  // Document State
  openDocuments: EditorDocument[];
  activeDocumentUuid: string | null;
  
  // Draft State
  drafts: DraftInfo[];
  
  // Template State
  templates: DocumentTemplate[];
  
  // Auto-save Config
  autoSaveConfig: AutoSaveConfig;
  
  // UI State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface EditorActions {
  // Document Operations
  createDocument: (options?: CreateDocumentOptions) => Promise<EditorDocument>;
  openDocument: (uuid: string) => Promise<EditorDocument | null>;
  saveDocument: (uuid?: string) => Promise<void>;
  saveAllDocuments: () => Promise<void>;
  closeDocument: (uuid: string, force?: boolean) => Promise<boolean>;
  setActiveDocument: (uuid: string | null) => void;
  
  // Content Operations
  updateContent: (uuid: string, content: string) => void;
  markDirty: (uuid: string) => void;
  markClean: (uuid: string) => void;
  
  // Draft Operations
  loadDrafts: () => Promise<void>;
  saveDraft: (uuid?: string) => Promise<void>;
  recoverDraft: (draftUuid: string) => Promise<void>;
  deleteDraft: (draftUuid: string) => Promise<void>;
  
  // Template Operations
  loadTemplates: () => Promise<void>;
  createFromTemplate: (templateUuid: string) => Promise<EditorDocument>;
  
  // Config
  updateAutoSaveConfig: (config: Partial<AutoSaveConfig>) => Promise<void>;
  
  // Selectors
  getActiveDocument: () => EditorDocument | null;
  getDocument: (uuid: string) => EditorDocument | undefined;
  hasUnsavedChanges: () => boolean;
  getUnsavedDocuments: () => EditorDocument[];
}

type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  openDocuments: [],
  activeDocumentUuid: null,
  drafts: [],
  templates: [],
  autoSaveConfig: {
    enabled: true,
    intervalMs: 30000,
    maxDrafts: 10,
  },
  isLoading: false,
  isSaving: false,
  error: null,
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ===== Document Operations =====
      
      createDocument: async (options) => {
        set({ isLoading: true, error: null });
        try {
          const doc = await editorIPCClient.createDocument(options);
          set((state) => ({
            openDocuments: [...state.openDocuments, doc],
            activeDocumentUuid: doc.uuid,
            isLoading: false,
          }));
          return doc;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      openDocument: async (uuid) => {
        // Check if already open
        const existing = get().openDocuments.find((d) => d.uuid === uuid);
        if (existing) {
          set({ activeDocumentUuid: uuid });
          return existing;
        }

        set({ isLoading: true, error: null });
        try {
          const doc = await editorIPCClient.openDocument(uuid);
          if (doc) {
            set((state) => ({
              openDocuments: [...state.openDocuments, doc],
              activeDocumentUuid: doc.uuid,
              isLoading: false,
            }));
          }
          return doc;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      saveDocument: async (uuid) => {
        const targetUuid = uuid ?? get().activeDocumentUuid;
        if (!targetUuid) return;

        set({ isSaving: true, error: null });
        try {
          await editorIPCClient.saveDocument(targetUuid);
          set((state) => ({
            openDocuments: state.openDocuments.map((d) =>
              d.uuid === targetUuid ? { ...d, isDirty: false, updatedAt: new Date() } : d
            ),
            isSaving: false,
          }));
        } catch (error) {
          set({ error: (error as Error).message, isSaving: false });
          throw error;
        }
      },

      saveAllDocuments: async () => {
        const dirtyDocs = get().openDocuments.filter((d) => d.isDirty);
        for (const doc of dirtyDocs) {
          await get().saveDocument(doc.uuid);
        }
      },

      closeDocument: async (uuid, force = false) => {
        const doc = get().openDocuments.find((d) => d.uuid === uuid);
        if (!doc) return true;

        if (doc.isDirty && !force) {
          // Return false to indicate unsaved changes
          return false;
        }

        await editorIPCClient.closeDocument(uuid);
        set((state) => {
          const remaining = state.openDocuments.filter((d) => d.uuid !== uuid);
          const newActive = state.activeDocumentUuid === uuid
            ? remaining[remaining.length - 1]?.uuid ?? null
            : state.activeDocumentUuid;
          return {
            openDocuments: remaining,
            activeDocumentUuid: newActive,
          };
        });
        return true;
      },

      setActiveDocument: (uuid) => {
        set({ activeDocumentUuid: uuid });
      },

      // ===== Content Operations =====

      updateContent: (uuid, content) => {
        set((state) => ({
          openDocuments: state.openDocuments.map((d) =>
            d.uuid === uuid ? { ...d, content, isDirty: true } : d
          ),
        }));
      },

      markDirty: (uuid) => {
        set((state) => ({
          openDocuments: state.openDocuments.map((d) =>
            d.uuid === uuid ? { ...d, isDirty: true } : d
          ),
        }));
      },

      markClean: (uuid) => {
        set((state) => ({
          openDocuments: state.openDocuments.map((d) =>
            d.uuid === uuid ? { ...d, isDirty: false } : d
          ),
        }));
      },

      // ===== Draft Operations =====

      loadDrafts: async () => {
        const drafts = await editorIPCClient.listDrafts();
        set({ drafts });
      },

      saveDraft: async (uuid) => {
        const targetUuid = uuid ?? get().activeDocumentUuid;
        if (!targetUuid) return;
        const draft = await editorIPCClient.saveDraft(targetUuid);
        set((state) => ({
          drafts: [draft, ...state.drafts].slice(0, state.autoSaveConfig.maxDrafts),
        }));
      },

      recoverDraft: async (draftUuid) => {
        const doc = await editorIPCClient.recoverDraft(draftUuid);
        set((state) => ({
          openDocuments: [...state.openDocuments, doc],
          activeDocumentUuid: doc.uuid,
        }));
      },

      deleteDraft: async (draftUuid) => {
        await editorIPCClient.deleteDraft(draftUuid);
        set((state) => ({
          drafts: state.drafts.filter((d) => d.uuid !== draftUuid),
        }));
      },

      // ===== Template Operations =====

      loadTemplates: async () => {
        const templates = await editorIPCClient.listTemplates();
        set({ templates });
      },

      createFromTemplate: async (templateUuid) => {
        return get().createDocument({ templateUuid });
      },

      // ===== Config =====

      updateAutoSaveConfig: async (config) => {
        const updated = await editorIPCClient.setAutoSaveConfig(config);
        set({ autoSaveConfig: updated });
      },

      // ===== Selectors =====

      getActiveDocument: () => {
        const { openDocuments, activeDocumentUuid } = get();
        return openDocuments.find((d) => d.uuid === activeDocumentUuid) ?? null;
      },

      getDocument: (uuid) => {
        return get().openDocuments.find((d) => d.uuid === uuid);
      },

      hasUnsavedChanges: () => {
        return get().openDocuments.some((d) => d.isDirty);
      },

      getUnsavedDocuments: () => {
        return get().openDocuments.filter((d) => d.isDirty);
      },
    }),
    {
      name: 'editor-store',
      partialize: (state) => ({
        autoSaveConfig: state.autoSaveConfig,
        // Don't persist documents - they're managed by main process
      }),
    }
  )
);
```

### 索引文件
```typescript
// renderer/modules/editor/presentation/stores/index.ts
export { useEditorStore } from './editorStore';
```

## 验收标准

- [ ] 文档状态管理正常
- [ ] 多文档标签页支持
- [ ] dirty 状态正确追踪
- [ ] 草稿功能正常工作
- [ ] 模板功能正常工作
- [ ] 自动保存配置持久化
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/editor/presentation/stores/editorStore.ts`
- `renderer/modules/editor/presentation/stores/index.ts`
