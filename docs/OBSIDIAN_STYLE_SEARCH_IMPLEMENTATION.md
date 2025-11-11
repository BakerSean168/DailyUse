# Obsidian风格搜索功能实现指南

**目标**: 实现Obsidian风格的高级搜索，支持 file / tag / line / section 多种搜索模式

## 📋 核心需求

### Obsidian搜索特性
1. **搜索模式选择**: file | tag | line | section | property
2. **搜索修饰符**: 
   - `file:` - 搜索文件名
   - `tag:` - 搜索标签  
   - `line:` - 搜索行内容
   - `section:` - 搜索章节标题
   - `path:` - 搜索路径
3. **组合搜索**: 支持多个搜索条件组合
4. **实时预览**: 显示匹配内容的上下文
5. **高亮显示**: 高亮匹配的关键词

### UI设计 (Obsidian风格)
```
┌────────────────────────────────────────┐
│ 🔍 [搜索框]                      [×] │
│                                         │
│ 搜索选项 ▼                             │
│ ┌─────────────────────────────────┐   │
│ │ ○ file:  搜索文件名             │   │
│ │ ○ tag:   搜索标签               │   │
│ │ ○ line:  搜索内容               │   │
│ │ ○ section: 搜索标题             │   │
│ │ ○ path:  搜索路径               │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 搜索结果 (32)                          │
│ ─────────────────────────────────────  │
│ 📝 项目计划.md                         │
│    ...包含关键词的上下文...            │
│    路径: /工作/项目A/项目计划.md       │
│                                         │
│ 📝 会议纪要.md                         │
│    ...另一段匹配内容...                │
│    路径: /工作/会议/会议纪要.md        │
└────────────────────────────────────────┘
```

---

## 🏗️ 后端API设计

### 1. 搜索请求DTO
```typescript
// apps/api/src/modules/repository/application/dto/SearchRequestDTO.ts

export interface SearchRequestDTO {
  repositoryUuid: string;
  query: string;
  
  // 搜索模式
  mode: 'all' | 'file' | 'tag' | 'line' | 'section' | 'path';
  
  // 高级选项
  caseSensitive?: boolean;
  useRegex?: boolean;
  wholeWord?: boolean;
  
  // 分页
  page?: number;
  pageSize?: number;
}
```

### 2. 搜索结果DTO
```typescript
// apps/api/src/modules/repository/application/dto/SearchResultDTO.ts

export interface SearchMatchDTO {
  lineNumber: number;
  lineContent: string;
  startIndex: number;
  endIndex: number;
  beforeContext?: string;
  afterContext?: string;
}

export interface SearchResultDTO {
  // 资源信息
  resourceUuid: string;
  resourceName: string;
  resourcePath: string;
  resourceType: 'MARKDOWN' | 'IMAGE' | 'PDF' | 'OTHER';
  
  // 匹配信息
  matchType: 'filename' | 'tag' | 'content' | 'section' | 'path';
  matches: SearchMatchDTO[];
  matchCount: number;
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  size?: number;
}

export interface SearchResponseDTO {
  results: SearchResultDTO[];
  totalResults: number;
  totalMatches: number;
  searchTime: number; // 毫秒
  query: string;
  mode: string;
}
```

### 3. 搜索服务实现
```typescript
// apps/api/src/modules/repository/application/services/SearchService.ts

export class SearchService {
  constructor(
    private resourceRepository: IResourceRepository,
    private storageService: IStorageService
  ) {}
  
  /**
   * 执行搜索
   */
  async search(request: SearchRequestDTO): Promise<SearchResponseDTO> {
    const startTime = Date.now();
    const results: SearchResultDTO[] = [];
    
    // 1. 获取所有资源
    const resources = await this.resourceRepository.findByRepositoryUuid(
      request.repositoryUuid
    );
    
    // 2. 根据搜索模式筛选
    for (const resource of resources) {
      const result = await this.searchResource(resource, request);
      if (result && result.matchCount > 0) {
        results.push(result);
      }
    }
    
    // 3. 排序（按匹配数量降序）
    results.sort((a, b) => b.matchCount - a.matchCount);
    
    // 4. 分页
    const page = request.page || 1;
    const pageSize = request.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = results.slice(startIndex, startIndex + pageSize);
    
    const searchTime = Date.now() - startTime;
    const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);
    
    return {
      results: paginatedResults,
      totalResults: results.length,
      totalMatches,
      searchTime,
      query: request.query,
      mode: request.mode
    };
  }
  
  /**
   * 搜索单个资源
   */
  private async searchResource(
    resource: Resource,
    request: SearchRequestDTO
  ): Promise<SearchResultDTO | null> {
    const searchResult: SearchResultDTO = {
      resourceUuid: resource.uuid,
      resourceName: resource.name,
      resourcePath: resource.path,
      resourceType: resource.type,
      matchType: this.getMatchType(request.mode),
      matches: [],
      matchCount: 0,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
      size: resource.size
    };
    
    // 根据搜索模式执行不同的搜索逻辑
    switch (request.mode) {
      case 'file':
        this.searchInFilename(resource, request, searchResult);
        break;
        
      case 'tag':
        this.searchInTags(resource, request, searchResult);
        break;
        
      case 'path':
        this.searchInPath(resource, request, searchResult);
        break;
        
      case 'line':
      case 'section':
      case 'all':
        await this.searchInContent(resource, request, searchResult);
        break;
    }
    
    return searchResult.matchCount > 0 ? searchResult : null;
  }
  
  /**
   * 搜索文件名
   */
  private searchInFilename(
    resource: Resource,
    request: SearchRequestDTO,
    result: SearchResultDTO
  ): void {
    const searchText = request.caseSensitive 
      ? resource.name 
      : resource.name.toLowerCase();
    
    const query = request.caseSensitive 
      ? request.query 
      : request.query.toLowerCase();
    
    if (searchText.includes(query)) {
      result.matches.push({
        lineNumber: 0,
        lineContent: resource.name,
        startIndex: searchText.indexOf(query),
        endIndex: searchText.indexOf(query) + query.length
      });
      result.matchCount = 1;
    }
  }
  
  /**
   * 搜索标签
   */
  private searchInTags(
    resource: Resource,
    request: SearchRequestDTO,
    result: SearchResultDTO
  ): void {
    const tags = resource.metadata?.tags || [];
    const query = request.caseSensitive 
      ? request.query 
      : request.query.toLowerCase();
    
    tags.forEach((tag, index) => {
      const tagText = request.caseSensitive ? tag : tag.toLowerCase();
      
      if (tagText.includes(query)) {
        result.matches.push({
          lineNumber: index + 1,
          lineContent: `#${tag}`,
          startIndex: tagText.indexOf(query),
          endIndex: tagText.indexOf(query) + query.length
        });
        result.matchCount++;
      }
    });
  }
  
  /**
   * 搜索路径
   */
  private searchInPath(
    resource: Resource,
    request: SearchRequestDTO,
    result: SearchResultDTO
  ): void {
    const searchText = request.caseSensitive 
      ? resource.path 
      : resource.path.toLowerCase();
    
    const query = request.caseSensitive 
      ? request.query 
      : request.query.toLowerCase();
    
    if (searchText.includes(query)) {
      result.matches.push({
        lineNumber: 0,
        lineContent: resource.path,
        startIndex: searchText.indexOf(query),
        endIndex: searchText.indexOf(query) + query.length
      });
      result.matchCount = 1;
    }
  }
  
  /**
   * 搜索内容
   */
  private async searchInContent(
    resource: Resource,
    request: SearchRequestDTO,
    result: SearchResultDTO
  ): Promise<void> {
    // 只搜索文本类型文件
    if (resource.type !== 'MARKDOWN' && resource.type !== 'CODE') {
      return;
    }
    
    try {
      // 读取文件内容
      const content = await this.storageService.readFile(resource.storagePath);
      const lines = content.split('\n');
      
      const query = request.caseSensitive 
        ? request.query 
        : request.query.toLowerCase();
      
      lines.forEach((line, index) => {
        const lineText = request.caseSensitive ? line : line.toLowerCase();
        
        // 模式过滤
        if (request.mode === 'section') {
          // 只搜索标题行 (Markdown)
          if (!line.trim().startsWith('#')) return;
        }
        
        // 查找匹配
        let startIndex = lineText.indexOf(query);
        if (startIndex !== -1) {
          // 获取上下文
          const beforeContext = lines[index - 1] || '';
          const afterContext = lines[index + 1] || '';
          
          result.matches.push({
            lineNumber: index + 1,
            lineContent: line,
            startIndex,
            endIndex: startIndex + query.length,
            beforeContext,
            afterContext
          });
          result.matchCount++;
        }
      });
    } catch (error) {
      console.error(`Failed to read resource ${resource.uuid}:`, error);
    }
  }
  
  private getMatchType(mode: string): 'filename' | 'tag' | 'content' | 'section' | 'path' {
    const typeMap: Record<string, any> = {
      'file': 'filename',
      'tag': 'tag',
      'path': 'path',
      'section': 'section',
      'line': 'content',
      'all': 'content'
    };
    return typeMap[mode] || 'content';
  }
}
```

### 4. 搜索控制器
```typescript
// apps/api/src/modules/repository/interface/http/controllers/SearchController.ts

export class SearchController {
  private static responseBuilder = createResponseBuilder();
  
  static async search(req: Request, res: Response): Promise<Response> {
    try {
      const { repositoryUuid } = req.params;
      const {
        query,
        mode = 'all',
        caseSensitive = false,
        useRegex = false,
        wholeWord = false,
        page = 1,
        pageSize = 50
      } = req.query;
      
      if (!query || typeof query !== 'string') {
        return SearchController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Query parameter is required'
        });
      }
      
      const service = SearchService.getInstance();
      
      const results = await service.search({
        repositoryUuid,
        query,
        mode: mode as any,
        caseSensitive: caseSensitive === 'true',
        useRegex: useRegex === 'true',
        wholeWord: wholeWord === 'true',
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string)
      });
      
      return SearchController.responseBuilder.sendSuccess(
        res,
        results,
        'Search completed successfully'
      );
    } catch (error) {
      logger.error('Error performing search', { error });
      return SearchController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message
      });
    }
  }
}
```

### 5. API路由
```typescript
// apps/api/src/modules/repository/interface/http/routes/searchRoutes.ts

router.get(
  '/repositories/:repositoryUuid/search',
  authMiddleware,
  SearchController.search
);
```

---

## 🎨 前端实现

### 1. 搜索面板组件
```vue
<!-- apps/web/src/modules/repository/presentation/components/SearchPanel.vue -->

<template>
  <div class="search-panel">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <v-text-field
        v-model="searchQuery"
        placeholder="搜索..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        autofocus
        class="search-input"
        @keyup.enter="performSearch"
        @update:model-value="handleInputChange"
        @focus="showSearchOptions = true"
      />
    </div>
    
    <!-- 搜索模式选择器 (点击搜索框时展开) -->
    <v-expand-transition>
      <div v-if="showSearchOptions" class="search-options">
        <v-chip-group
          v-model="searchMode"
          mandatory
          selected-class="text-primary"
          class="search-mode-chips"
        >
          <v-chip value="all" size="small" variant="outlined">
            <v-icon icon="mdi-magnify" start size="small" />
            全部
          </v-chip>
          <v-chip value="file" size="small" variant="outlined">
            <v-icon icon="mdi-file-outline" start size="small" />
            file: 文件名
          </v-chip>
          <v-chip value="tag" size="small" variant="outlined">
            <v-icon icon="mdi-tag-outline" start size="small" />
            tag: 标签
          </v-chip>
          <v-chip value="line" size="small" variant="outlined">
            <v-icon icon="mdi-text" start size="small" />
            line: 内容
          </v-chip>
          <v-chip value="section" size="small" variant="outlined">
            <v-icon icon="mdi-format-header-pound" start size="small" />
            section: 标题
          </v-chip>
          <v-chip value="path" size="small" variant="outlined">
            <v-icon icon="mdi-folder-outline" start size="small" />
            path: 路径
          </v-chip>
        </v-chip-group>
        
        <!-- 高级选项 -->
        <div class="search-advanced-options">
          <v-checkbox
            v-model="caseSensitive"
            label="区分大小写"
            density="compact"
            hide-details
          />
          <v-checkbox
            v-model="useRegex"
            label="正则表达式"
            density="compact"
            hide-details
          />
        </div>
      </div>
    </v-expand-transition>
    
    <!-- 搜索结果统计 -->
    <div v-if="searchResults.length > 0" class="search-stats">
      <span class="text-caption text-medium-emphasis">
        找到 {{ totalResults }} 个文件中的 {{ totalMatches }} 个匹配项
        <span class="text-disabled">({{ searchTime }}ms)</span>
      </span>
    </div>
    
    <!-- 搜索结果列表 -->
    <div v-if="isSearching" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="32" />
      <p class="text-caption text-disabled mt-2">搜索中...</p>
    </div>
    
    <div v-else-if="searchResults.length > 0" class="search-results">
      <v-list density="compact">
        <template v-for="result in searchResults" :key="result.resourceUuid">
          <v-list-item
            class="search-result-item"
            @click="handleResultClick(result)"
          >
            <template #prepend>
              <v-icon :icon="getResourceIcon(result.resourceType)" size="small" />
            </template>
            
            <v-list-item-title class="result-title">
              {{ result.resourceName }}
              <v-chip
                v-if="result.matchCount > 1"
                size="x-small"
                color="primary"
                variant="tonal"
                class="ml-2"
              >
                {{ result.matchCount }}
              </v-chip>
            </v-list-item-title>
            
            <v-list-item-subtitle class="result-path text-caption">
              {{ result.resourcePath }}
            </v-list-item-subtitle>
            
            <!-- 显示匹配的内容片段 -->
            <div v-if="result.matches.length > 0" class="match-previews">
              <div
                v-for="(match, index) in result.matches.slice(0, 3)"
                :key="index"
                class="match-preview"
              >
                <span class="match-line-number">{{ match.lineNumber }}:</span>
                <span class="match-content" v-html="highlightMatch(match)"></span>
              </div>
              <div v-if="result.matches.length > 3" class="more-matches">
                +{{ result.matches.length - 3 }} more matches
              </div>
            </div>
          </v-list-item>
          
          <v-divider />
        </template>
      </v-list>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <v-icon :icon="emptyStateIcon" size="48" class="mb-2 text-disabled" />
      <p class="text-caption text-disabled">{{ emptyStateText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSearchStore } from '../stores/searchStore';
import { useResourceStore } from '../stores/resourceStore';
import type { SearchResultDTO, SearchMatchDTO } from '@dailyuse/contracts';

// Props
interface Props {
  repositoryUuid: string | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'select', result: SearchResultDTO): void;
}>();

// Store
const searchStore = useSearchStore();
const resourceStore = useResourceStore();

// State
const searchQuery = ref('');
const searchMode = ref<'all' | 'file' | 'tag' | 'line' | 'section' | 'path'>('all');
const caseSensitive = ref(false);
const useRegex = ref(false);
const showSearchOptions = ref(false);

// Computed
const isSearching = computed(() => searchStore.isSearching);
const searchResults = computed(() => searchStore.results);
const totalResults = computed(() => searchStore.totalResults);
const totalMatches = computed(() => searchStore.totalMatches);
const searchTime = computed(() => searchStore.searchTime);

const emptyStateIcon = computed(() => {
  return searchQuery.value ? 'mdi-file-search-outline' : 'mdi-magnify';
});

const emptyStateText = computed(() => {
  return searchQuery.value 
    ? '未找到匹配结果' 
    : '输入关键词开始搜索';
});

// Methods
async function performSearch() {
  if (!props.repositoryUuid || !searchQuery.value.trim()) {
    searchStore.clearResults();
    return;
  }
  
  await searchStore.search({
    repositoryUuid: props.repositoryUuid,
    query: searchQuery.value,
    mode: searchMode.value,
    caseSensitive: caseSensitive.value,
    useRegex: useRegex.value
  });
}

function handleInputChange(value: string) {
  if (!value) {
    searchStore.clearResults();
    showSearchOptions.value = false;
  }
}

function handleResultClick(result: SearchResultDTO) {
  emit('select', result);
  // 打开资源
  resourceStore.openResourceByUuid(result.resourceUuid);
}

function getResourceIcon(type: string): string {
  const iconMap: Record<string, string> = {
    MARKDOWN: 'mdi-language-markdown',
    IMAGE: 'mdi-image',
    PDF: 'mdi-file-pdf-box',
    OTHER: 'mdi-file'
  };
  return iconMap[type] || 'mdi-file';
}

/**
 * 高亮匹配的文本
 */
function highlightMatch(match: SearchMatchDTO): string {
  const { lineContent, startIndex, endIndex } = match;
  
  const before = lineContent.substring(0, startIndex);
  const matched = lineContent.substring(startIndex, endIndex);
  const after = lineContent.substring(endIndex);
  
  return `${escapeHtml(before)}<mark class="search-highlight">${escapeHtml(matched)}</mark>${escapeHtml(after)}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 点击外部关闭搜索选项
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.search-panel')) {
    showSearchOptions.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.search-panel {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-input-wrapper {
  margin-bottom: 8px;
}

.search-options {
  padding: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 4px;
  margin-bottom: 12px;
}

.search-mode-chips {
  margin-bottom: 8px;
}

.search-advanced-options {
  display: flex;
  gap: 16px;
}

.search-stats {
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: 8px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
}

.search-result-item {
  cursor: pointer;
  padding: 12px 8px;
}

.search-result-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.result-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.result-path {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 11px;
}

.match-previews {
  margin-top: 8px;
  padding-left: 28px;
}

.match-preview {
  font-size: 12px;
  line-height: 1.6;
  margin-bottom: 4px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.match-line-number {
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-right: 8px;
  font-size: 11px;
}

.match-content {
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.match-content :deep(.search-highlight) {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: 500;
}

.more-matches {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-style: italic;
  margin-top: 4px;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.text-disabled {
  color: rgba(var(--v-theme-on-surface), 0.38);
}
</style>
```

### 2. 搜索Store
```typescript
// apps/web/src/modules/repository/presentation/stores/searchStore.ts

import { defineStore } from 'pinia';
import { SearchApiClient } from '../../api/SearchApiClient';
import type { SearchRequestDTO, SearchResponseDTO, SearchResultDTO } from '@dailyuse/contracts';

export const useSearchStore = defineStore('search', {
  state: () => ({
    results: [] as SearchResultDTO[],
    totalResults: 0,
    totalMatches: 0,
    searchTime: 0,
    isSearching: false,
    error: null as string | null,
    lastQuery: '',
    lastMode: 'all' as string
  }),
  
  actions: {
    async search(request: Omit<SearchRequestDTO, 'page' | 'pageSize'>) {
      this.isSearching = true;
      this.error = null;
      this.lastQuery = request.query;
      this.lastMode = request.mode;
      
      try {
        const response = await SearchApiClient.search(request);
        
        this.results = response.results;
        this.totalResults = response.totalResults;
        this.totalMatches = response.totalMatches;
        this.searchTime = response.searchTime;
      } catch (error: any) {
        this.error = error.message;
        console.error('Search failed:', error);
      } finally {
        this.isSearching = false;
      }
    },
    
    clearResults() {
      this.results = [];
      this.totalResults = 0;
      this.totalMatches = 0;
      this.searchTime = 0;
      this.lastQuery = '';
    }
  }
});
```

### 3. API Client
```typescript
// apps/web/src/modules/repository/api/SearchApiClient.ts

export class SearchApiClient {
  static async search(request: {
    repositoryUuid: string;
    query: string;
    mode?: string;
    caseSensitive?: boolean;
    useRegex?: boolean;
  }): Promise<SearchResponseDTO> {
    const params = new URLSearchParams({
      query: request.query,
      mode: request.mode || 'all',
      caseSensitive: String(request.caseSensitive || false),
      useRegex: String(request.useRegex || false)
    });
    
    return await apiClient.get(
      `/repositories/${request.repositoryUuid}/search?${params.toString()}`
    );
  }
}
```

---

## 🎯 实施步骤

### Phase 1: 后端实现 ✅
1. 创建 SearchRequestDTO 和 SearchResponseDTO
2. 实现 SearchService
3. 实现 SearchController
4. 注册搜索路由

### Phase 2: 前端实现 ✅
1. 创建 SearchApiClient
2. 创建 searchStore
3. 重构 SearchPanel.vue (Obsidian风格)
4. 添加搜索模式选择器
5. 实现高亮显示

### Phase 3: 交互优化 ⏳
1. 实时搜索 (防抖)
2. 搜索历史记录
3. 键盘快捷键 (Ctrl+F)
4. 搜索结果导航 (上下箭头)

---

## 📝 关键要点

### 后端要点
1. **性能优化**: 只搜索文本类型文件
2. **上下文提取**: 返回匹配行的上下文
3. **分页支持**: 避免一次返回过多结果
4. **索引优化**: 未来可考虑全文索引

### 前端要点
1. **Obsidian风格**: Chip选择器 + 简洁布局
2. **高亮显示**: 使用 `<mark>` 标签高亮匹配文本
3. **防抖搜索**: 避免频繁请求
4. **状态管理**: Store统一管理搜索状态

### 交互细节
1. **焦点展开**: 点击搜索框自动展开选项
2. **Enter搜索**: 按Enter键执行搜索
3. **清除按钮**: 点击×清空搜索内容和结果
4. **点击跳转**: 点击结果直接打开对应资源
