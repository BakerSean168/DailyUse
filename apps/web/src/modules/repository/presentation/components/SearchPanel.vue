<!--
 Search Panel Component
 Story 11.2: Obsidian 风格搜索
-->

<template>
  <v-card
    class="search-panel"
    elevation="0"
    rounded="lg"
  >
    <!-- Search Input -->
    <v-card-text class="pa-4">
      <v-text-field
        v-model="localQuery"
        density="compact"
        variant="outlined"
        placeholder="搜索仓储内容..."
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        autofocus
        @keydown.enter="handleSearch"
        @keydown.esc="$emit('close')"
      />

      <!-- Mode Chips -->
      <div class="mode-chips mt-3">
        <v-chip
          v-for="mode in searchModes"
          :key="mode.value"
          :variant="selectedMode === mode.value ? 'elevated' : 'outlined'"
          :color="selectedMode === mode.value ? 'primary' : 'default'"
          size="small"
          class="mr-2"
          @click="selectMode(mode.value)"
        >
          <v-icon start :icon="mode.icon" size="small" />
          {{ mode.label }}
        </v-chip>
      </div>

      <!-- Search Mode Help Text (Story 11.6) -->
      <v-alert
        v-if="searchModeHelp"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-2 text-caption"
        closable
      >
        {{ searchModeHelp }}
      </v-alert>

      <!-- Advanced Options -->
      <div class="advanced-options mt-3" v-if="showAdvanced">
        <v-checkbox
          v-model="caseSensitive"
          label="区分大小写"
          density="compact"
          hide-details
        />
        <v-checkbox
          v-model="useRegex"
          label="使用正则表达式"
          density="compact"
          hide-details
        />
      </div>
    </v-card-text>

    <v-divider />

    <!-- Search Results -->
    <v-card-text class="search-results pa-0">
      <!-- Loading State -->
      <div v-if="searchStore.isSearching" class="text-center pa-8">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-caption text-medium-emphasis mt-2">搜索中...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="searchStore.isEmpty" class="text-center pa-8">
        <v-icon icon="mdi-magnify" size="48" class="text-medium-emphasis" />
        <div class="text-body-2 text-medium-emphasis mt-2">未找到匹配结果</div>
      </div>

      <!-- Results List -->
      <v-list v-else-if="searchStore.hasResults" density="compact" class="pa-0">
        <v-list-item
          v-for="result in searchStore.results"
          :key="result.resourceUuid"
          @click="handleSelectResult(result)"
          class="search-result-item"
        >
          <template #prepend>
            <v-icon :icon="getFileIcon(result.resourceType)" size="small" />
          </template>

          <v-list-item-title class="result-name">
            <span v-html="highlightMatch(result.resourceName)" />
          </v-list-item-title>

          <v-list-item-subtitle class="result-path text-caption">
            {{ result.resourcePath }}
          </v-list-item-subtitle>

          <!-- Match Preview -->
          <div v-if="result.matches.length > 0" class="match-preview mt-1">
            <div
              v-for="(match, idx) in result.matches.slice(0, 3)"
              :key="idx"
              class="match-line text-caption"
            >
              <span class="line-number">{{ match.lineNumber }}:</span>
              <span v-html="highlightMatchInLine(match)" />
            </div>
            <div v-if="result.matches.length > 3" class="text-caption text-medium-emphasis">
              +{{ result.matches.length - 3 }} more matches
            </div>
          </div>

          <template #append>
            <v-chip size="x-small" variant="text">
              {{ result.matchCount }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>

      <!-- No Search Yet -->
      <div v-else class="text-center pa-8">
        <v-icon icon="mdi-text-search" size="48" class="text-medium-emphasis" />
        <div class="text-body-2 text-medium-emphasis mt-2">输入关键词开始搜索</div>
      </div>
    </v-card-text>

    <!-- Footer Stats -->
    <v-divider v-if="searchStore.hasResults" />
    <v-card-actions v-if="searchStore.hasResults" class="text-caption text-medium-emphasis px-4">
      <span>
        找到 {{ searchStore.totalResults }} 个文件，共 {{ searchStore.totalMatches }} 处匹配
      </span>
      <v-spacer />
      <span>{{ searchStore.searchTime }}ms</span>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useSearchStore } from '../stores/searchStore';
import type { RepositoryClientDTO, ResourceClientDTO, FolderClientDTO } from '@dailyuse/contracts/repository';

type SearchMode = SearchMode;
type SearchResultItem = SearchResultItem;
type SearchMatch = SearchMatch;

// Props
const props = defineProps<{
  repositoryUuid: string;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  select: [result: SearchResultItem];
}>();

// Store
const searchStore = useSearchStore();

// Local State
const localQuery = ref('');
const selectedMode = ref<SearchMode>('all');
const caseSensitive = ref(false);
const useRegex = ref(false);
const showAdvanced = ref(false);

// Search Modes
const searchModes = [
  { value: 'all' as SearchMode, label: '全部', icon: 'mdi-file-search' },
  { value: 'file' as SearchMode, label: '文件名', icon: 'mdi-file' },
  { value: 'tag' as SearchMode, label: '标签', icon: 'mdi-tag' },
  { value: 'line' as SearchMode, label: '行内容', icon: 'mdi-text' },
  { value: 'section' as SearchMode, label: '章节', icon: 'mdi-format-header-pound' },
  { value: 'path' as SearchMode, label: '路径', icon: 'mdi-folder' },
  { value: 'property' as SearchMode, label: '属性', icon: 'mdi-code-brackets' }, // Story 11.6: YAML property search
];

// Story 11.6: Search Mode Help Text
const searchModeHelp = computed(() => {
  switch (selectedMode.value) {
    case 'line':
      return '💡 行内容搜索：输入多个关键词（空格分隔），匹配同一行包含所有关键词的内容';
    case 'section':
      return '💡 章节搜索：搜索同一 Markdown 标题（#）下的内容，结果将显示所在章节名称';
    case 'property':
      return '💡 属性搜索：格式 [属性名]:值，例如 [author]:sean 搜索 YAML frontmatter 中的属性';
    default:
      return '';
  }
});

// Debounced Search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch([localQuery, selectedMode, caseSensitive, useRegex], () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(() => {
    if (localQuery.value.trim()) {
      handleSearch();
    } else {
      searchStore.clearResults();
    }
  }, 300);
});

// Methods
function selectMode(mode: SearchMode) {
  selectedMode.value = mode;
}

function handleSearch() {
  if (!localQuery.value.trim()) return;

  searchStore.search(
    props.repositoryUuid,
    localQuery.value,
    selectedMode.value,
    {
      caseSensitive: caseSensitive.value,
      useRegex: useRegex.value,
    }
  );
}

function handleSelectResult(result: SearchResultItem) {
  emit('select', result);
}

function getFileIcon(type: string): string {
  const iconMap: Record<string, string> = {
    markdown: 'mdi-language-markdown',
    text: 'mdi-file-document',
    image: 'mdi-file-image',
    video: 'mdi-file-video',
    audio: 'mdi-file-music',
    pdf: 'mdi-file-pdf-box',
    code: 'mdi-file-code',
  };
  return iconMap[type] || 'mdi-file';
}

function highlightMatch(text: string): string {
  if (!localQuery.value.trim()) return text;
  
  const query = caseSensitive.value ? localQuery.value : localQuery.value.toLowerCase();
  const searchText = caseSensitive.value ? text : text.toLowerCase();
  
  const index = searchText.indexOf(query);
  if (index === -1) return text;
  
  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);
  
  return `${before}<mark class="search-highlight">${match}</mark>${after}`;
}

function highlightMatchInLine(match: SearchMatch): string {
  const { lineContent, startIndex, endIndex } = match;
  
  const before = lineContent.substring(0, startIndex);
  const matchText = lineContent.substring(startIndex, endIndex);
  const after = lineContent.substring(endIndex);
  
  return `${before}<mark class="search-highlight">${matchText}</mark>${after}`;
}
</script>

<style scoped>
/* 使用 Vuetify 工具类，无需自定义样式 */
</style>

