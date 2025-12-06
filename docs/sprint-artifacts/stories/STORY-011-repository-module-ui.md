# STORY-011: 仓库模块界面

## 📋 Story 概述

**Story ID**: STORY-011  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P2 (增强体验)  
**预估工时**: 2-3 天  
**状态**: 🔵 Ready for Dev  
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
