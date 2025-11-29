<template>
  <v-menu
    v-model="isVisible"
    :close-on-content-click="false"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    location="bottom start"
    :attach="true"
    min-width="320"
    max-width="480"
  >
    <v-list density="compact" class="link-suggestion-list">
      <!-- 搜索加载状态 -->
      <v-list-item v-if="loading">
        <v-progress-circular indeterminate size="20" class="mr-2" />
        <span class="text-caption">搜索中...</span>
      </v-list-item>

      <!-- 搜索结果列表 -->
      <v-list-item
        v-for="(doc, index) in filteredDocuments"
        :key="doc.uuid"
        :value="doc.uuid"
        :active="selectedIndex === index"
        @click="selectDocument(doc)"
        @mouseenter="selectedIndex = index"
        class="suggestion-item"
      >
        <template #prepend>
          <v-icon size="small">mdi-file-document-outline</v-icon>
        </template>

        <v-list-item-title class="text-body-2">
          {{ doc.title }}
        </v-list-item-title>

        <v-list-item-subtitle class="text-caption">
          {{ doc.folderPath || '/' }}
          <v-chip v-if="doc.tags?.length" size="x-small" class="ml-2">
            {{ doc.tags[0] }}
          </v-chip>
        </v-list-item-subtitle>
      </v-list-item>

      <!-- 无结果提示 -->
      <v-list-item v-if="!loading && filteredDocuments.length === 0 && searchQuery">
        <v-list-item-title class="text-caption text-grey">
          未找到匹配文档
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          按 Enter 创建新文档 "{{ searchQuery }}"
        </v-list-item-subtitle>
      </v-list-item>

      <!-- 提示信息 -->
      <v-divider v-if="filteredDocuments.length > 0" />
      <v-list-item class="text-caption text-grey pa-2">
        <v-icon size="small" class="mr-1">mdi-keyboard</v-icon>
        ↑↓ 导航 | Enter 选择 | Esc 取消
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { documentApiClient } from '@/modules/document/api/DocumentApiClient';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';


// ==================== Props ====================
interface Props {
  visible: boolean;
  searchQuery: string;
  position: { x: number; y: number };
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  searchQuery: '',
  position: () => ({ x: 0, y: 0 }),
});

// ==================== Emits ====================
const emit = defineEmits<{
  select: [document: DocumentClientDTO | null];
  close: [];
  createNew: [title: string];
}>();

// ==================== State ====================
const isVisible = ref(false);
const loading = ref(false);
const documents = ref<DocumentClientDTO[]>([]);
const selectedIndex = ref(0);

// ==================== Computed ====================
const filteredDocuments = computed(() => {
  if (!props.searchQuery.trim()) return documents.value;

  const query = props.searchQuery.toLowerCase();
  return documents.value.filter(doc =>
    doc.title.toLowerCase().includes(query) ||
    doc.folderPath?.toLowerCase().includes(query) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(query))
  );
});

// ==================== Methods ====================
async function searchDocumentsImpl(query: string) {
  if (!query || query.length < 1) {
    documents.value = [];
    return;
  }

  loading.value = true;
  try {
    const results = await documentApiClient.searchDocuments(query, 10);
    documents.value = results;
    selectedIndex.value = 0;
  } catch (error) {
    console.error('Search documents failed:', error);
    documents.value = [];
  } finally {
    loading.value = false;
  }
}

// 使用 VueUse 的防抖函数，延迟 300ms 执行搜索
const searchDocuments = useDebounceFn(searchDocumentsImpl, 300);

function selectDocument(doc: DocumentClientDTO) {
  emit('select', doc);
  close();
}

function selectCurrent() {
  if (filteredDocuments.value.length > 0) {
    const selected = filteredDocuments.value[selectedIndex.value];
    selectDocument(selected);
  } else if (props.searchQuery.trim()) {
    // 创建新文档
    emit('createNew', props.searchQuery.trim());
    close();
  }
}

function close() {
  isVisible.value = false;
  emit('close');
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isVisible.value) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(
        selectedIndex.value + 1,
        filteredDocuments.value.length - 1
      );
      break;

    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;

    case 'Enter':
      event.preventDefault();
      selectCurrent();
      break;

    case 'Escape':
      event.preventDefault();
      close();
      break;
  }
}

// ==================== Watchers ====================
watch(() => props.visible, (visible) => {
  isVisible.value = visible;
  if (visible) {
    selectedIndex.value = 0;
  }
});

watch(() => props.searchQuery, (query) => {
  if (query) {
    searchDocuments(query);
  } else {
    documents.value = [];
  }
});

// ==================== Lifecycle ====================
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.link-suggestion-list {
  max-height: 400px;
  overflow-y: auto;
}

.suggestion-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.12);
}
</style>

