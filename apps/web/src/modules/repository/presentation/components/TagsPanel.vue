<template>
  <div class="tags-panel">
    <div class="panel-header">
      <span class="text-subtitle-2">标签</span>
      <v-btn 
        icon="mdi-plus" 
        size="x-small" 
        variant="text"
        @click="handleAddTag"
      />
    </div>
    
    <!-- 标签列表 -->
    <div v-if="tags.length > 0" class="tags-container">
      <v-chip
        v-for="tag in tags"
        :key="tag.id"
        :color="tag.color"
        size="small"
        class="ma-1"
        closable
        @click="handleTagClick(tag)"
        @click:close="handleRemoveTag(tag)"
      >
        <v-icon start :icon="tag.icon || 'mdi-tag'" size="x-small" />
        {{ tag.name }}
        <template #append>
          <span class="text-caption ml-1">({{ tag.count || 0 }})</span>
        </template>
      </v-chip>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <v-icon icon="mdi-tag-outline" size="48" class="mb-2 text-disabled" />
      <p class="text-caption text-disabled">暂无标签</p>
      <v-btn 
        size="small" 
        variant="tonal" 
        prepend-icon="mdi-plus"
        class="mt-2"
        @click="handleAddTag"
      >
        创建标签
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Emits
const emit = defineEmits<{
  (e: 'select', tag: any): void;
  (e: 'add'): void;
  (e: 'remove', tag: any): void;
}>();

// State
const tags = ref<any[]>([]);

// Methods
function handleAddTag() {
  emit('add');
}

function handleTagClick(tag: any) {
  emit('select', tag);
}

function handleRemoveTag(tag: any) {
  emit('remove', tag);
}
</script>

<style scoped>
.tags-panel {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tags-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
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
