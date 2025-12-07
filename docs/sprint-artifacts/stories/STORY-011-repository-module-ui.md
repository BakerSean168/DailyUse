# STORY-011: 仓库模块界面

## 📋 Story 概述

**Story ID**: STORY-011  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P2 (增强体验)  
**预估工时**: 2-3 天  
**状态**: ✅ Completed  
**前置依赖**: STORY-002, STORY-003, STORY-004

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 能够管理和查看我存储的资源（代码片段、笔记、书签等）  
**以便于** 快速访问和组织我的知识库  

---

## 📋 验收标准

### 功能验收 - 资源管理

- [ ] 资源列表展示
- [ ] 资源搜索（标题、标签、内容）
- [ ] 资源筛选（类型、标签、收藏）
- [ ] 资源排序
- [ ] 资源详情查看

### 功能验收 - 资源操作

- [ ] 创建新资源
- [ ] 编辑资源
- [ ] 删除资源
- [ ] 收藏/取消收藏
- [ ] 标签管理

### 功能验收 - 资源类型

- [ ] 代码片段（语法高亮）
- [ ] Markdown 笔记
- [ ] 书签/链接
- [ ] 文件附件

### 技术验收

- [ ] 全文搜索
- [ ] 本地文件存储
- [ ] 导入/导出功能

---

## 📐 技术设计

### 文件结构

```
apps/desktop/src/
├── renderer/
│   └── views/
│       └── repository/
│           ├── RepositoryView.vue       # 仓库主页
│           ├── ResourceDetailView.vue   # 资源详情
│           ├── ResourceEditView.vue     # 资源编辑
│           └── components/
│               ├── ResourceList.vue     # 资源列表
│               ├── ResourceCard.vue     # 资源卡片
│               ├── ResourceFilter.vue   # 筛选器
│               ├── CodeEditor.vue       # 代码编辑器
│               ├── MarkdownEditor.vue   # Markdown 编辑器
│               └── TagManager.vue       # 标签管理
│
├── shared/
│   └── composables/
│       ├── useRepository.ts             # 仓库逻辑
│       ├── useResourceEditor.ts         # 编辑器逻辑
│       └── useTags.ts                   # 标签逻辑
│
└── main/
    └── modules/
        └── repository/
            ├── repositoryIpcHandlers.ts # IPC 处理器
            └── fileStorage.ts           # 文件存储
```

### Repository Composable

```typescript
// useRepository.ts
import { ref, computed } from 'vue';
import type {
  Resource,
  ResourceType,
  ResourceFilter,
  CreateResourceRequest,
  UpdateResourceRequest,
} from '@dailyuse/contracts/repository';

export function useRepository() {
  // State
  const resources = ref<Resource[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Filter state
  const filter = ref<ResourceFilter>({
    type: undefined,
    tags: [],
    isFavorite: undefined,
    searchQuery: '',
  });
  
  // Pagination
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  
  // Computed
  const filteredResources = computed(() => {
    return resources.value; // 实际过滤在服务端完成
  });
  
  // Actions
  async function loadResources() {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await window.electronAPI.invoke<{
        items: Resource[];
        total: number;
      }>('repository:list', {
        filter: filter.value,
        page: page.value,
        pageSize: pageSize.value,
      });
      
      resources.value = result.items;
      total.value = result.total;
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }
  
  async function createResource(request: CreateResourceRequest) {
    const resource = await window.electronAPI.invoke<Resource>(
      'repository:create',
      request
    );
    resources.value.unshift(resource);
    return resource;
  }
  
  async function updateResource(id: string, request: UpdateResourceRequest) {
    const resource = await window.electronAPI.invoke<Resource>(
      'repository:update',
      { id, ...request }
    );
    
    const index = resources.value.findIndex(r => r.id === id);
    if (index !== -1) {
      resources.value[index] = resource;
    }
    return resource;
  }
  
  async function deleteResource(id: string) {
    await window.electronAPI.invoke('repository:delete', { id });
    resources.value = resources.value.filter(r => r.id !== id);
  }
  
  async function toggleFavorite(id: string) {
    const resource = resources.value.find(r => r.id === id);
    if (!resource) return;
    
    const updated = await window.electronAPI.invoke<Resource>(
      'repository:update',
      { id, isFavorite: !resource.isFavorite }
    );
    
    const index = resources.value.findIndex(r => r.id === id);
    if (index !== -1) {
      resources.value[index] = updated;
    }
  }
  
  async function search(query: string) {
    filter.value.searchQuery = query;
    page.value = 1;
    await loadResources();
  }
  
  return {
    resources: filteredResources,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    filter,
    page,
    total: computed(() => total.value),
    
    loadResources,
    createResource,
    updateResource,
    deleteResource,
    toggleFavorite,
    search,
  };
}
```

### Code Editor 组件

```vue
<!-- components/CodeEditor.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import * as monaco from 'monaco-editor';

interface Props {
  modelValue: string;
  language?: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  language: 'javascript',
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorContainer = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

onMounted(() => {
  if (!editorContainer.value) return;
  
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    readOnly: props.readonly,
    theme: 'vs-dark',
    minimap: { enabled: false },
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
  });
  
  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor!.getValue());
  });
});

watch(() => props.language, (newLang) => {
  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel()!, newLang);
  }
});

watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue);
  }
});
</script>

<template>
  <div ref="editorContainer" class="code-editor" />
</template>

<style scoped>
.code-editor {
  width: 100%;
  height: 400px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}
</style>
```

### 资源详情视图

```vue
<!-- views/ResourceDetailView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CodeEditor } from '../components/CodeEditor.vue';
import { MarkdownViewer } from '../components/MarkdownViewer.vue';
import type { Resource } from '@dailyuse/contracts/repository';

const route = useRoute();
const router = useRouter();

const resource = ref<Resource | null>(null);
const loading = ref(true);

const isCode = computed(() => resource.value?.type === 'code');
const isMarkdown = computed(() => resource.value?.type === 'markdown');
const isBookmark = computed(() => resource.value?.type === 'bookmark');

onMounted(async () => {
  const id = route.params.id as string;
  resource.value = await window.electronAPI.invoke<Resource>(
    'repository:get',
    { id }
  );
  loading.value = false;
});

function edit() {
  router.push(`/repository/${resource.value?.id}/edit`);
}

async function toggleFavorite() {
  if (!resource.value) return;
  
  resource.value = await window.electronAPI.invoke<Resource>(
    'repository:update',
    { 
      id: resource.value.id, 
      isFavorite: !resource.value.isFavorite 
    }
  );
}
</script>

<template>
  <div class="resource-detail" v-if="resource">
    <header class="resource-header">
      <h1>{{ resource.title }}</h1>
      <div class="actions">
        <button @click="toggleFavorite">
          {{ resource.isFavorite ? '★' : '☆' }}
        </button>
        <button @click="edit">编辑</button>
      </div>
    </header>
    
    <div class="resource-tags">
      <span 
        v-for="tag in resource.tags" 
        :key="tag" 
        class="tag"
      >
        {{ tag }}
      </span>
    </div>
    
    <div class="resource-content">
      <CodeEditor 
        v-if="isCode"
        :modelValue="resource.content"
        :language="resource.language"
        readonly
      />
      
      <MarkdownViewer 
        v-else-if="isMarkdown"
        :content="resource.content"
      />
      
      <a 
        v-else-if="isBookmark" 
        :href="resource.url" 
        target="_blank"
        class="bookmark-link"
      >
        {{ resource.url }}
      </a>
    </div>
  </div>
</template>
```

---

## 🏗️ 技术实现方案 (架构师补充)

> 本节由架构师 Agent 补充，提供详细技术实现指导

### 1. IPC 通道与服务映射 (15 通道)

#### Repository 核心 (6 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `repository:create` | RepositoryService.create() | 创建知识库 |
| `repository:list` | RepositoryService.list() | 列出知识库 |
| `repository:get` | RepositoryService.get() | 获取知识库详情 |
| `repository:update` | RepositoryService.update() | 更新知识库 |
| `repository:delete` | RepositoryService.delete() | 删除知识库 |
| `repository:search` | RepositoryService.search() | 全文搜索 |

#### Folder 管理 (4 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `repository:folder:create` | FolderService.create() | 创建文件夹 |
| `repository:folder:list` | FolderService.list() | 列出文件夹 |
| `repository:folder:update` | FolderService.update() | 更新文件夹 |
| `repository:folder:delete` | FolderService.delete() | 删除文件夹 |

#### Resource 管理 (5 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `repository:resource:create` | ResourceService.create() | 创建资源 |
| `repository:resource:list` | ResourceService.list() | 列出资源 |
| `repository:resource:get` | ResourceService.get() | 获取资源 |
| `repository:resource:update` | ResourceService.update() | 更新资源 |
| `repository:resource:delete` | ResourceService.delete() | 删除资源 |

### 2. 数据模型

```typescript
// packages/contracts/src/repository/repository.types.ts

export type ResourceType = 
  | 'code'       // 代码片段
  | 'markdown'   // Markdown 文档
  | 'bookmark'   // 书签/链接
  | 'note'       // 普通笔记
  | 'file';      // 文件附件

export interface Repository {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  repositoryId: string;
  parentId?: string;  // null = 根目录
  name: string;
  order: number;
  createdAt: Date;
}

export interface Resource {
  id: string;
  repositoryId: string;
  folderId?: string;
  
  type: ResourceType;
  title: string;
  content: string;
  
  // 代码类型特有
  language?: string;
  
  // 书签类型特有
  url?: string;
  favicon?: string;
  
  // 文件类型特有
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  
  // 通用
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  
  // 全文搜索用
  searchableText?: string;  // 自动生成
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. SQLite 全文搜索 (FTS5)

```sql
-- 创建 FTS 虚拟表
CREATE VIRTUAL TABLE resource_fts USING fts5(
  title,
  content,
  tags,
  content='resources',
  content_rowid='id'
);

-- 触发器自动同步
CREATE TRIGGER resources_ai AFTER INSERT ON resources BEGIN
  INSERT INTO resource_fts(rowid, title, content, tags)
  VALUES (new.id, new.title, new.content, new.tags);
END;

CREATE TRIGGER resources_ad AFTER DELETE ON resources BEGIN
  INSERT INTO resource_fts(resource_fts, rowid, title, content, tags)
  VALUES ('delete', old.id, old.title, old.content, old.tags);
END;

CREATE TRIGGER resources_au AFTER UPDATE ON resources BEGIN
  INSERT INTO resource_fts(resource_fts, rowid, title, content, tags)
  VALUES ('delete', old.id, old.title, old.content, old.tags);
  INSERT INTO resource_fts(rowid, title, content, tags)
  VALUES (new.id, new.title, new.content, new.tags);
END;

-- 搜索查询
SELECT r.*, 
       highlight(resource_fts, 0, '<mark>', '</mark>') as titleHighlight,
       highlight(resource_fts, 1, '<mark>', '</mark>') as contentHighlight,
       rank
FROM resource_fts
JOIN resources r ON resource_fts.rowid = r.id
WHERE resource_fts MATCH ?
ORDER BY rank;
```

### 4. Monaco Editor 集成

```typescript
// apps/desktop/src/renderer/components/CodeEditor.vue
// Monaco 按需加载配置

// vite.config.ts
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  plugins: [
    monacoEditorPlugin({
      languageWorkers: ['json', 'typescript', 'html', 'css'],
      customDistPath: (root) => `${root}/public/monacoeditorwork`,
    }),
  ],
});

// 使用 Web Worker 提升性能
// apps/desktop/src/renderer/utils/monaco-worker.ts
self.MonacoEnvironment = {
  getWorker: function (workerId, label) {
    const getWorkerModule = (moduleUrl: string, label: string) => {
      return new Worker(
        self.MonacoEnvironment.getWorkerUrl(moduleUrl, label),
        { type: 'module' }
      );
    };
    
    switch (label) {
      case 'json':
        return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker', label);
      case 'typescript':
      case 'javascript':
        return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker', label);
      case 'html':
        return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker', label);
      case 'css':
        return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker', label);
      default:
        return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker', label);
    }
  },
};
```

### 5. Composable 实现

#### useRepository.ts

```typescript
// apps/desktop/src/renderer/composables/useRepository.ts
import { ref, computed } from 'vue';

export function useRepository(repositoryId?: string) {
  const repositories = ref<Repository[]>([]);
  const currentRepository = ref<Repository | null>(null);
  const folders = ref<Folder[]>([]);
  const resources = ref<Resource[]>([]);
  const isLoading = ref(false);
  
  // 树形结构 (文件树)
  const folderTree = computed(() => {
    return buildTree(folders.value);
  });
  
  async function loadRepositories() {
    repositories.value = await window.electronAPI.invoke<Repository[]>(
      'repository:list'
    );
  }
  
  async function loadRepository(id: string) {
    isLoading.value = true;
    try {
      const [repo, folderList, resourceList] = await Promise.all([
        window.electronAPI.invoke<Repository>('repository:get', { id }),
        window.electronAPI.invoke<Folder[]>('repository:folder:list', { repositoryId: id }),
        window.electronAPI.invoke<Resource[]>('repository:resource:list', { repositoryId: id }),
      ]);
      
      currentRepository.value = repo;
      folders.value = folderList;
      resources.value = resourceList;
    } finally {
      isLoading.value = false;
    }
  }
  
  async function createFolder(name: string, parentId?: string) {
    const folder = await window.electronAPI.invoke<Folder>(
      'repository:folder:create',
      { 
        repositoryId: currentRepository.value!.id, 
        name, 
        parentId 
      }
    );
    folders.value.push(folder);
    return folder;
  }
  
  async function createResource(data: Partial<Resource>) {
    const resource = await window.electronAPI.invoke<Resource>(
      'repository:resource:create',
      { 
        repositoryId: currentRepository.value!.id,
        ...data 
      }
    );
    resources.value.push(resource);
    return resource;
  }
  
  async function search(query: string) {
    return window.electronAPI.invoke<{
      resources: Resource[];
      highlights: Record<string, { title: string; content: string }>;
    }>('repository:search', { 
      repositoryId: currentRepository.value?.id,
      query 
    });
  }
  
  return {
    repositories,
    currentRepository,
    folders,
    resources,
    folderTree,
    isLoading,
    loadRepositories,
    loadRepository,
    createFolder,
    createResource,
    search,
  };
}

// 构建文件树
function buildTree(folders: Folder[]): FolderNode[] {
  const map = new Map<string | undefined, FolderNode[]>();
  
  for (const folder of folders) {
    const parentId = folder.parentId;
    if (!map.has(parentId)) {
      map.set(parentId, []);
    }
    map.get(parentId)!.push({
      ...folder,
      children: [],
    });
  }
  
  function attachChildren(nodes: FolderNode[]): FolderNode[] {
    return nodes.map(node => ({
      ...node,
      children: attachChildren(map.get(node.id) || []),
    }));
  }
  
  return attachChildren(map.get(undefined) || []);
}
```

### 6. 导入/导出功能

```typescript
// apps/desktop/src/main/services/repository-io.service.ts
import { dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

interface ExportFormat {
  version: '1.0';
  repository: Repository;
  folders: Folder[];
  resources: Resource[];
  attachments?: Record<string, string>; // resourceId -> base64
}

export class RepositoryIOService {
  async exportRepository(repositoryId: string): Promise<string | null> {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '导出知识库',
      defaultPath: `repository-${Date.now()}.zip`,
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    });
    
    if (canceled || !filePath) return null;
    
    const data = await this.gatherExportData(repositoryId);
    const zip = new AdmZip();
    
    // 添加 metadata
    zip.addFile('metadata.json', Buffer.from(JSON.stringify(data, null, 2)));
    
    // 添加附件文件
    for (const resource of data.resources) {
      if (resource.type === 'file' && resource.filePath) {
        const fileContent = await fs.promises.readFile(resource.filePath);
        zip.addFile(`files/${resource.id}/${path.basename(resource.filePath)}`, fileContent);
      }
    }
    
    zip.writeZip(filePath);
    return filePath;
  }
  
  async importRepository(importPath?: string): Promise<Repository | null> {
    let filePath = importPath;
    
    if (!filePath) {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '导入知识库',
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
        properties: ['openFile'],
      });
      
      if (canceled || filePaths.length === 0) return null;
      filePath = filePaths[0];
    }
    
    const zip = new AdmZip(filePath);
    const metadataEntry = zip.getEntry('metadata.json');
    
    if (!metadataEntry) {
      throw new Error('Invalid repository archive');
    }
    
    const data: ExportFormat = JSON.parse(metadataEntry.getData().toString());
    
    // 创建知识库
    const repository = await this.repositoryService.create(data.repository);
    
    // 创建文件夹 (按层级)
    const folderIdMap = new Map<string, string>();
    for (const folder of data.folders) {
      const newFolder = await this.folderService.create({
        ...folder,
        repositoryId: repository.id,
        parentId: folder.parentId ? folderIdMap.get(folder.parentId) : undefined,
      });
      folderIdMap.set(folder.id, newFolder.id);
    }
    
    // 创建资源
    for (const resource of data.resources) {
      await this.resourceService.create({
        ...resource,
        repositoryId: repository.id,
        folderId: resource.folderId ? folderIdMap.get(resource.folderId) : undefined,
      });
    }
    
    return repository;
  }
}
```

### 7. 大文件处理

```typescript
// 分页加载资源列表
async function loadResourcesPaginated(options: {
  repositoryId: string;
  folderId?: string;
  page: number;
  pageSize: number;
}) {
  return window.electronAPI.invoke<{
    items: Resource[];
    total: number;
    hasMore: boolean;
  }>('repository:resource:list', options);
}

// 虚拟滚动配置 (使用 @tanstack/vue-virtual)
import { useVirtualizer } from '@tanstack/vue-virtual';

const parentRef = ref<HTMLElement | null>(null);

const rowVirtualizer = useVirtualizer({
  count: resources.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 80, // 每行高度
  overscan: 5,
});
```

---

## 📝 Task 分解

### Task 11.1: 资源列表界面 (1 天)

**子任务**:
- [ ] 创建 RepositoryView.vue
- [ ] 创建 ResourceList.vue
- [ ] 创建 ResourceCard.vue
- [ ] 创建 ResourceFilter.vue
- [ ] 实现 useRepository.ts

### Task 11.2: 资源详情/编辑 (1 天)

**子任务**:
- [ ] 创建 ResourceDetailView.vue
- [ ] 创建 ResourceEditView.vue
- [ ] 创建 CodeEditor.vue (Monaco)
- [ ] 创建 MarkdownEditor.vue
- [ ] 实现 useResourceEditor.ts

### Task 11.3: 标签与搜索 (0.5-1 天)

**子任务**:
- [ ] 创建 TagManager.vue
- [ ] 实现 useTags.ts
- [ ] 实现全文搜索 IPC
- [ ] 导入/导出功能

---

## 🔗 依赖关系

### 前置依赖

- ⏳ STORY-002/003/004 (基础架构)

### 后续影响

- 🔜 知识管理功能

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| Monaco 打包体积 | 中 | 中 | 按需加载 + Worker |
| 大文件性能 | 低 | 中 | 虚拟滚动 + 分页 |

---

## ✅ 完成定义 (DoD)

- [ ] 资源 CRUD 正常工作
- [ ] 代码编辑器语法高亮
- [ ] 搜索/筛选功能正常
- [ ] 代码已提交并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Phase 3 (Week 6-7)
