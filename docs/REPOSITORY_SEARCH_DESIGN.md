# Repository 搜索功能 - Obsidian 风格设计

**作者**: Sally (UX Designer) + Winston (Architect)  
**日期**: 2025-11-11  
**状态**: 设计方案

---

## 🎯 目标

实现 Obsidian 风格的高级搜索功能，支持多种搜索类型和灵活的组合查询。

---

## 📸 Obsidian 搜索特性分析

### 搜索类型

| 搜索类型 | 语法示例 | 说明 |
|---------|---------|------|
| **file:** | `file:README` | 匹配文件名 |
| **tag:** | `tag:#project` | 搜索标签 |
| **line:** | `line:(obsidian plugin)` | 搜索关键词在同一行 |
| **section:** | `section:(## 介绍)` | 搜索在同一标题下的内容 |
| **path:** | `path:docs/project/` | 匹配文件路径 |
| **[property]** | `[author]:sean` | 匹配YAML frontmatter属性 |

### UI特征

1. **搜索框聚焦时自动显示选项菜单**
2. **搜索历史记录**
3. **结果高亮显示匹配文本**
4. **结果分组（按文件）**
5. **实时搜索（debounce 300ms）**

---

## �� UI/UX 设计

### 组件结构

```
SearchPanel.vue
├── SearchInput (搜索框 + 类型选择)
├── SearchOptions (搜索类型菜单)
├── SearchHistory (历史记录)
└── SearchResults (结果列表)
    ├── ResultGroup (按文件分组)
    └── ResultItem (单个匹配项)
```

### 视觉设计

```vue
<!-- SearchPanel.vue - 完整实现 -->
<template>
  <div class="search-panel">
    <!-- 搜索输入区 -->
    <div class="search-input-wrapper">
      <v-menu
        v-model="showOptions"
        location="bottom"
        :close-on-content-click="false"
        max-width="320"
      >
        <template #activator="{ props }">
          <v-text-field
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Search..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            v-bind="props"
            @focus="handleFocus"
            @input="handleInput"
            @keydown.enter="handleSearch"
          >
            <template #append-inner>
              <v-chip
                v-if="searchType !== 'all'"
                size="x-small"
                variant="tonal"
                color="primary"
                closable
                @click:close="resetSearchType"
              >
                {{ searchType }}
              </v-chip>
            </template>
          </v-text-field>
        </template>

        <!-- 搜索类型选项 -->
        <v-card>
          <v-card-title class="text-subtitle-2 py-2">
            Search options
          </v-card-title>
          <v-divider />
          <v-list density="compact">
            <v-list-item
              v-for="option in searchOptions"
              :key="option.type"
              :active="searchType === option.type"
              @click="setSearchType(option.type)"
            >
              <template #prepend>
                <v-icon :icon="option.icon" size="small" />
              </template>
              <v-list-item-title>
                <span class="font-weight-medium">{{ option.type }}:</span>
                {{ option.description }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>

      <!-- 搜索设置按钮 -->
      <v-btn
        icon="mdi-tune-variant"
        size="small"
        variant="text"
        class="ml-2"
        @click="showAdvancedSettings = true"
      />
    </div>

    <!-- 搜索历史 -->
    <div v-if="!searchResults.length && searchHistory.length" class="search-history">
      <v-list-subheader>History</v-list-subheader>
      <v-list density="compact">
        <v-list-item
          v-for="(item, index) in searchHistory"
          :key="index"
          @click="applyHistorySearch(item)"
        >
          <template #prepend>
            <v-icon icon="mdi-history" size="small" color="grey" />
          </template>
          <v-list-item-title class="text-body-2">
            {{ item }}
          </v-list-item-title>
          <template #append>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click.stop="removeFromHistory(index)"
            />
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searching" class="search-loading">
      <v-progress-circular indeterminate size="32" />
      <p class="text-caption text-grey mt-2">Searching...</p>
    </div>

    <div v-else-if="searchResults.length" class="search-results">
      <div class="results-header">
        <span class="text-caption text-grey">
          {{ totalMatches }} results in {{ searchResults.length }} files
        </span>
      </div>

      <v-list density="compact" class="results-list">
        <!-- 按文件分组 -->
        <div
          v-for="(fileResult, index) in searchResults"
          :key="fileResult.fileUuid"
          class="result-group"
        >
          <v-list-item
            class="file-header"
            @click="toggleFileGroup(fileResult.fileUuid)"
          >
            <template #prepend>
              <v-icon
                :icon="fileResult.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                size="small"
              />
              <v-icon icon="mdi-language-markdown" size="small" color="accent" class="ml-2" />
            </template>
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ fileResult.fileName }}
            </v-list-item-title>
            <template #append>
              <v-chip size="x-small" variant="text">
                {{ fileResult.matches.length }}
              </v-chip>
            </template>
          </v-list-item>

          <!-- 匹配项列表 -->
          <v-expand-transition>
            <div v-show="fileResult.expanded" class="match-items">
              <v-list-item
                v-for="(match, matchIndex) in fileResult.matches"
                :key="matchIndex"
                class="match-item"
                @click="handleResultClick(fileResult, match)"
              >
                <v-list-item-title class="match-content">
                  <div class="match-line">
                    <!-- 高亮显示匹配文本 -->
                    <span v-html="highlightMatch(match.text, searchQuery)" />
                  </div>
                  <div class="match-meta">
                    <span class="text-caption text-grey">
                      Line {{ match.lineNumber }}
                      <template v-if="match.section">
                        • {{ match.section }}
                      </template>
                    </span>
                  </div>
                </v-list-item-title>
              </v-list-item>
            </div>
          </v-expand-transition>

          <v-divider v-if="index < searchResults.length - 1" class="my-2" />
        </div>
      </v-list>
    </div>

    <!-- 空状态 -->
    <div v-else-if="hasSearched" class="empty-state">
      <v-icon icon="mdi-file-search-outline" size="48" color="grey-lighten-1" />
      <p class="text-body-2 text-grey mt-2">No results found</p>
    </div>

    <!-- 高级设置对话框 -->
    <v-dialog v-model="showAdvancedSettings" max-width="500">
      <v-card>
        <v-card-title>Advanced Search Settings</v-card-title>
        <v-card-text>
          <v-checkbox
            v-model="settings.caseSensitive"
            label="Case sensitive"
            density="compact"
            hide-details
          />
          <v-checkbox
            v-model="settings.wholeWord"
            label="Match whole word"
            density="compact"
            hide-details
          />
          <v-checkbox
            v-model="settings.regex"
            label="Use regular expression"
            density="compact"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAdvancedSettings = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { debounce } from 'lodash-es';

interface SearchOption {
  type: string;
  icon: string;
  description: string;
}

interface SearchMatch {
  text: string;
  lineNumber: number;
  section?: string;
  startIndex: number;
  endIndex: number;
}

interface FileSearchResult {
  fileUuid: string;
  fileName: string;
  filePath: string;
  matches: SearchMatch[];
  expanded: boolean;
}

const searchQuery = ref('');
const searchType = ref('all');
const showOptions = ref(false);
const showAdvancedSettings = ref(false);
const searching = ref(false);
const hasSearched = ref(false);
const searchResults = ref<FileSearchResult[]>([]);
const searchHistory = ref<string[]>([]);
const searchInputRef = ref();

const settings = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false
});

const searchOptions: SearchOption[] = [
  { type: 'all', icon: 'mdi-magnify', description: 'search all content' },
  { type: 'file', icon: 'mdi-file-outline', description: 'match file name' },
  { type: 'tag', icon: 'mdi-tag-outline', description: 'search for tags' },
  { type: 'line', icon: 'mdi-text', description: 'keywords on same line' },
  { type: 'section', icon: 'mdi-format-header-1', description: 'under same heading' },
  { type: 'path', icon: 'mdi-folder-outline', description: 'match path' }
];

const totalMatches = computed(() => {
  return searchResults.value.reduce((sum, file) => sum + file.matches.length, 0);
});

function handleFocus() {
  showOptions.value = true;
}

const handleInput = debounce(() => {
  if (searchQuery.value.trim()) {
    performSearch();
  }
}, 300);

function handleSearch() {
  if (searchQuery.value.trim()) {
    performSearch();
    addToHistory(searchQuery.value);
  }
}

async function performSearch() {
  searching.value = true;
  hasSearched.value = true;

  try {
    // TODO: 调用搜索API
    const results = await SearchApiClient.search({
      query: searchQuery.value,
      type: searchType.value,
      ...settings.value
    });

    searchResults.value = results.map((r: any) => ({
      ...r,
      expanded: true  // 默认展开
    }));
  } catch (error) {
    console.error('Search failed:', error);
  } finally {
    searching.value = false;
  }
}

function setSearchType(type: string) {
  searchType.value = type;
  showOptions.value = false;
  searchInputRef.value?.focus();
}

function resetSearchType() {
  searchType.value = 'all';
}

function toggleFileGroup(fileUuid: string) {
  const fileResult = searchResults.value.find(r => r.fileUuid === fileUuid);
  if (fileResult) {
    fileResult.expanded = !fileResult.expanded;
  }
}

function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addToHistory(query: string) {
  const fullQuery = searchType.value !== 'all' ? `${searchType.value}:${query}` : query;
  
  // 移除重复项
  const index = searchHistory.value.indexOf(fullQuery);
  if (index > -1) {
    searchHistory.value.splice(index, 1);
  }
  
  // 添加到开头
  searchHistory.value.unshift(fullQuery);
  
  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10);
  }
  
  // 保存到 localStorage
  localStorage.setItem('search-history', JSON.stringify(searchHistory.value));
}

function applyHistorySearch(query: string) {
  // 解析历史记录（可能包含类型前缀）
  const match = query.match(/^(\w+):(.+)$/);
  if (match) {
    searchType.value = match[1];
    searchQuery.value = match[2];
  } else {
    searchQuery.value = query;
  }
  
  performSearch();
}

function removeFromHistory(index: number) {
  searchHistory.value.splice(index, 1);
  localStorage.setItem('search-history', JSON.stringify(searchHistory.value));
}

function handleResultClick(fileResult: FileSearchResult, match: SearchMatch) {
  // 打开文件并跳转到指定行
  emit('select', {
    fileUuid: fileResult.fileUuid,
    lineNumber: match.lineNumber
  });
}

// 加载搜索历史
const savedHistory = localStorage.getItem('search-history');
if (savedHistory) {
  searchHistory.value = JSON.parse(savedHistory);
}

const emit = defineEmits<{
  select: [result: { fileUuid: string; lineNumber: number }];
}>();
</script>

<style scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  overflow: hidden;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.search-history {
  margin-bottom: 12px;
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
}

.search-results {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.results-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.results-list {
  flex: 1;
  overflow-y: auto;
}

.result-group {
  margin-bottom: 8px;
}

.file-header {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  cursor: pointer;
}

.file-header:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.8);
}

.match-items {
  padding-left: 24px;
}

.match-item {
  cursor: pointer;
  border-left: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.match-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  border-left-color: rgb(var(--v-theme-primary));
}

.match-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.match-line {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.match-meta {
  font-size: 11px;
}

:deep(.search-highlight) {
  background-color: rgba(var(--v-theme-warning), 0.3);
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
}
</style>
```

---

## 🔧 后端 API 设计

### 搜索端点

```typescript
// POST /api/search
interface SearchRequest {
  repositoryUuid: string;
  query: string;
  type: 'all' | 'file' | 'tag' | 'line' | 'section' | 'path';
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

interface SearchResponse {
  success: true;
  data: {
    results: Array<{
      fileUuid: string;
      fileName: string;
      filePath: string;
      matches: Array<{
        text: string;          // 匹配的文本片段（含上下文）
        lineNumber: number;    // 行号
        section?: string;      // 所在标题
        startIndex: number;    // 匹配开始位置
        endIndex: number;      // 匹配结束位置
      }>;
    }>;
    totalMatches: number;
  };
}
```

### Controller 实现

```typescript
@Post('search')
async searchResources(
  @Body() searchDto: SearchRequest
): Promise<ApiResponse<SearchResponse>> {
  const results = await this.searchService.search(searchDto);
  
  return {
    success: true,
    data: {
      results,
      totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0)
    }
  };
}
```

### Service 实现要点

```typescript
async search(params: SearchRequest): Promise<SearchResult[]> {
  // 1. 根据搜索类型构建查询
  switch (params.type) {
    case 'file':
      return this.searchByFileName(params);
    case 'tag':
      return this.searchByTag(params);
    case 'line':
      return this.searchByLine(params);
    case 'section':
      return this.searchBySection(params);
    case 'path':
      return this.searchByPath(params);
    default:
      return this.searchAll(params);
  }
}

private async searchAll(params: SearchRequest): Promise<SearchResult[]> {
  // 获取仓储中所有资源
  const resources = await this.resourceRepository.findMany({
    where: { repositoryUuid: params.repositoryUuid }
  });
  
  const results: SearchResult[] = [];
  
  for (const resource of resources) {
    // 读取文件内容
    const content = await this.readResourceContent(resource.uuid);
    
    // 搜索匹配项
    const matches = this.findMatches(content, params.query, params);
    
    if (matches.length > 0) {
      results.push({
        fileUuid: resource.uuid,
        fileName: resource.name,
        filePath: resource.path,
        matches
      });
    }
  }
  
  return results;
}

private findMatches(
  content: string,
  query: string,
  options: SearchRequest
): SearchMatch[] {
  const lines = content.split('\n');
  const matches: SearchMatch[] = [];
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 跟踪当前标题
    if (line.startsWith('#')) {
      currentSection = line.replace(/^#+\s*/, '');
    }
    
    // 搜索匹配
    const regex = options.regex
      ? new RegExp(query, options.caseSensitive ? 'g' : 'gi')
      : new RegExp(escapeRegex(query), options.caseSensitive ? 'g' : 'gi');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        text: this.getContextText(lines, i),
        lineNumber: i + 1,
        section: currentSection || undefined,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }
  
  return matches;
}

private getContextText(lines: string[], index: number, contextLines = 1): string {
  const start = Math.max(0, index - contextLines);
  const end = Math.min(lines.length, index + contextLines + 1);
  return lines.slice(start, end).join('\n');
}
```

---

## 🚀 实施步骤

### Phase 1: 基础搜索 (P0)
- [ ] 创建 SearchPanel.vue 组件
- [ ] 实现全文搜索 API
- [ ] 搜索结果高亮显示
- [ ] 搜索历史记录

### Phase 2: 高级搜索 (P1)
- [ ] file: 文件名搜索
- [ ] tag: 标签搜索
- [ ] path: 路径搜索
- [ ] 搜索设置（大小写敏感、正则）

### Phase 3: 精准搜索 (P2)
- [ ] line: 同行关键词搜索
- [ ] section: 同标题下搜索
- [ ] [property]: YAML属性搜索
- [ ] 搜索性能优化（索引）

---

**文档结束**
