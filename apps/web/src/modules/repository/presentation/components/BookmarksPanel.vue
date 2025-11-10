<template>
  <div class="bookmarks-panel">
    <div class="panel-header">
      <span class="text-subtitle-2">我的书签</span>
      <v-btn 
        icon="mdi-plus" 
        size="x-small" 
        variant="text"
        @click="handleAddBookmark"
      />
    </div>
    
    <!-- 书签列表 -->
    <v-list v-if="bookmarks.length > 0" density="compact" class="bookmarks-list">
      <v-list-item
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        @click="handleBookmarkClick(bookmark)"
      >
        <template #prepend>
          <v-icon :icon="bookmark.icon || 'mdi-bookmark'" size="small" />
        </template>
        <v-list-item-title>{{ bookmark.title }}</v-list-item-title>
        <template #append>
          <v-btn
            icon="mdi-close"
            size="x-small"
            variant="text"
            @click.stop="handleRemoveBookmark(bookmark)"
          />
        </template>
      </v-list-item>
    </v-list>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <v-icon icon="mdi-bookmark-outline" size="48" class="mb-2 text-disabled" />
      <p class="text-caption text-disabled">暂无书签</p>
      <v-btn 
        size="small" 
        variant="tonal" 
        prepend-icon="mdi-plus"
        class="mt-2"
        @click="handleAddBookmark"
      >
        添加书签
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Emits
const emit = defineEmits<{
  (e: 'select', bookmark: any): void;
  (e: 'add'): void;
  (e: 'remove', bookmark: any): void;
}>();

// State
const bookmarks = ref<any[]>([]);

// Methods
function handleAddBookmark() {
  emit('add');
}

function handleBookmarkClick(bookmark: any) {
  emit('select', bookmark);
}

function handleRemoveBookmark(bookmark: any) {
  emit('remove', bookmark);
}
</script>

<style scoped>
.bookmarks-panel {
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

.bookmarks-list {
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
