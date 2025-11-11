<template>
  <div class="tags-panel">
    <!-- Header -->
    <div class="panel-header">
      <span class="text-subtitle-2">标签</span>
      <v-chip
        v-if="tagCount > 0"
        size="x-small"
        variant="tonal"
        color="primary"
      >
        {{ tagCount }} 个标签
      </v-chip>
    </div>
    
    <!-- 搜索框 -->
    <v-text-field
      v-if="statistics.length > 0"
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      placeholder="搜索标签..."
      variant="outlined"
      density="compact"
      clearable
      hide-details
      class="mb-3"
    />

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="primary" />
      <p class="text-caption mt-2">加载标签中...</p>
    </div>

    <!-- 错误状态 -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mb-3"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- 标签云 -->
    <div v-else-if="filteredStatistics.length > 0" class="tags-cloud">
      <v-chip
        v-for="stat in filteredStatistics"
        :key="stat.tag"
        :variant="selectedTag === stat.tag ? 'flat' : 'tonal'"
        :color="selectedTag === stat.tag ? 'primary' : 'default'"
        size="small"
        class="ma-1"
        @click="handleSelectTag(stat.tag)"
      >
        <v-icon start icon="mdi-tag" size="x-small" />
        {{ stat.tag }}
        <v-badge
          :content="stat.count"
          inline
          color="primary"
          class="ml-1"
        />
      </v-chip>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <v-icon icon="mdi-tag-outline" size="48" class="mb-2 text-disabled" />
      <p class="text-caption text-disabled">
        {{ searchQuery ? '未找到匹配的标签' : '暂无标签' }}
      </p>
      <p v-if="!searchQuery" class="text-caption text-disabled">
        在笔记的 YAML frontmatter 中添加 tags 字段
      </p>
    </div>

    <!-- 标签过滤结果 -->
    <div v-if="selectedTag && filteredResources.length > 0" class="tag-resources">
      <v-divider class="my-3" />
      
      <div class="resources-header">
        <span class="text-caption">{{ selectedTag }}</span>
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="clearSelection"
        />
      </div>

      <v-list density="compact" class="resources-list">
        <v-list-item
          v-for="resource in filteredResources"
          :key="resource.uuid"
          @click="handleOpenResource(resource)"
        >
          <template #prepend>
            <v-icon icon="mdi-file-document-outline" size="small" />
          </template>
          <v-list-item-title class="text-body-2">
            {{ resource.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ resource.path }}
          </v-list-item-subtitle>
          <template #append>
            <span class="text-caption text-disabled">
              {{ formatDate(resource.updatedAt) }}
            </span>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useTagsStore } from '../stores/tagsStore';
import { useResourceStore } from '../stores/resourceStore';

// Props
const props = defineProps<{
  repositoryUuid?: string;
}>();

// Emits
const emit = defineEmits<{
  (e: 'select', resource: any): void;
}>();

// Stores
const tagsStore = useTagsStore();
const resourceStore = useResourceStore();

// Local state
const searchQuery = ref('');

// Computed
const statistics = computed(() => tagsStore.statistics);
const selectedTag = computed(() => tagsStore.selectedTag);
const filteredResources = computed(() => tagsStore.filteredResources);
const tagCount = computed(() => tagsStore.tagCount);
const isLoading = computed(() => tagsStore.isLoading);
const error = computed({
  get: () => tagsStore.error,
  set: (value) => {
    if (value === null) {
      tagsStore.error = null;
    }
  }
});

// 搜索过滤后的标签
const filteredStatistics = computed(() => {
  if (!searchQuery.value) return statistics.value;
  
  const query = searchQuery.value.toLowerCase();
  return statistics.value.filter(stat => 
    stat.tag.toLowerCase().includes(query)
  );
});

// Methods
async function loadData() {
  if (!props.repositoryUuid) return;
  
  await tagsStore.loadStatistics(props.repositoryUuid);
}

function handleSelectTag(tag: string) {
  if (selectedTag.value === tag) {
    tagsStore.clearSelection();
  } else {
    tagsStore.selectTag(tag);
  }
}

function clearSelection() {
  tagsStore.clearSelection();
}

async function handleOpenResource(resource: any) {
  try {
    await resourceStore.loadResourceById(resource.uuid);
    const fullResource = resourceStore.resources.find(r => r.uuid === resource.uuid);
    if (fullResource) {
      await resourceStore.openInTab(fullResource);
      emit('select', fullResource);
    }
  } catch (error) {
    console.error('Failed to open resource:', error);
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// Watchers
watch(() => props.repositoryUuid, async (newUuid) => {
  if (newUuid) {
    await loadData();
  } else {
    tagsStore.reset();
  }
}, { immediate: true });

// Lifecycle
onMounted(async () => {
  if (props.repositoryUuid) {
    await loadData();
  }
});
</script>

<style scoped lang="scss">
.tags-panel {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tags-cloud {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 3px;
  }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.text-disabled {
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.tag-resources {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.resources-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 4px;
}

.resources-list {
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 3px;
  }
}
</style>
