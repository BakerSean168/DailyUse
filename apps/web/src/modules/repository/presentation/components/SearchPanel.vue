<template>
  <div class="search-panel">
    <v-text-field
      v-model="searchQuery"
      placeholder="搜索文件和内容..."
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      class="mb-3"
      @keyup.enter="handleSearch"
      @update:model-value="handleInputChange"
    />
    
    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="search-results">
      <div class="text-caption text-medium-emphasis mb-2">
        找到 {{ searchResults.length }} 个结果
      </div>
      <v-list density="compact">
        <v-list-item
          v-for="result in searchResults"
          :key="result.id"
          @click="handleResultClick(result)"
        >
          <template #prepend>
            <v-icon icon="mdi-file-document-outline" size="small" />
          </template>
          <v-list-item-title>{{ result.title }}</v-list-item-title>
          <v-list-item-subtitle class="text-truncate">
            {{ result.preview }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <v-icon icon="mdi-magnify" size="48" class="mb-2 text-disabled" />
      <p class="text-caption text-disabled">
        {{ searchQuery ? '未找到匹配结果' : '输入关键词开始搜索' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Emits
const emit = defineEmits<{
  (e: 'select', result: any): void;
}>();

// State
const searchQuery = ref('');
const searchResults = ref<any[]>([]);

// Methods
function handleInputChange(value: string) {
  if (!value) {
    searchResults.value = [];
  }
}

function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }
  
  // TODO: 实现真实搜索逻辑
  console.log('搜索:', searchQuery.value);
  
  // 模拟搜索结果（临时）
  searchResults.value = [];
}

function handleResultClick(result: any) {
  emit('select', result);
}
</script>

<style scoped>
.search-panel {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-results {
  flex: 1;
  overflow-y: auto;
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
