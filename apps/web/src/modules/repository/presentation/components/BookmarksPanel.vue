<!--
 Bookmarks Panel Component
 Story 11.4: Bookmarks 功能
-->

<template>
  <div class="bookmarks-panel">
    <!-- Header -->
    <div class="panel-header pa-3">
      <div class="d-flex align-center">
        <v-icon icon="mdi-bookmark" size="small" class="mr-2" />
        <span class="text-subtitle-2 font-weight-medium">书签</span>
        <v-chip
          v-if="currentBookmarks.length > 0"
          size="x-small"
          variant="text"
          class="ml-2"
        >
          {{ currentBookmarks.length }}
        </v-chip>
      </div>
    </div>

    <v-divider />

    <!-- Bookmarks List -->
    <div class="bookmarks-content">
      <v-list v-if="currentBookmarks.length > 0" density="compact" class="pa-0">
        <v-list-item
          v-for="bookmark in currentBookmarks"
          :key="bookmark.uuid"
          @click="handleSelectBookmark(bookmark)"
          class="bookmark-item"
        >
          <template #prepend>
            <v-icon :icon="getBookmarkIcon(bookmark)" size="small" />
          </template>

          <v-list-item-title class="text-body-2">
            {{ bookmark.name }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ bookmark.targetType === 'folder' ? '文件夹' : '文件' }}
          </v-list-item-subtitle>

          <template #append>
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  size="x-small"
                  variant="text"
                  v-bind="props"
                  @click.stop
                />
              </template>

              <v-list density="compact">
                <v-list-item @click="handleRenameBookmark(bookmark)">
                  <template #prepend>
                    <v-icon icon="mdi-pencil" size="small" />
                  </template>
                  <v-list-item-title>重命名</v-list-item-title>
                </v-list-item>

                <v-list-item
                  @click="handleMoveUp(bookmark)"
                  :disabled="isFirst(bookmark)"
                >
                  <template #prepend>
                    <v-icon icon="mdi-arrow-up" size="small" />
                  </template>
                  <v-list-item-title>上移</v-list-item-title>
                </v-list-item>

                <v-list-item
                  @click="handleMoveDown(bookmark)"
                  :disabled="isLast(bookmark)"
                >
                  <template #prepend>
                    <v-icon icon="mdi-arrow-down" size="small" />
                  </template>
                  <v-list-item-title>下移</v-list-item-title>
                </v-list-item>

                <v-divider class="my-1" />

                <v-list-item @click="handleRemoveBookmark(bookmark)">
                  <template #prepend>
                    <v-icon icon="mdi-delete" size="small" color="error" />
                  </template>
                  <v-list-item-title class="text-error">删除</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </v-list>

      <!-- Empty State -->
      <div v-else class="empty-state pa-8">
        <v-icon icon="mdi-bookmark-outline" size="64" class="mb-4 text-medium-emphasis" />
        <p class="text-body-2 text-medium-emphasis mb-2">暂无书签</p>
        <p class="text-caption text-disabled">右键文件或文件夹选择"添加书签"</p>
      </div>
    </div>

    <!-- Rename Dialog -->
    <v-dialog v-model="showRenameDialog" max-width="400">
      <v-card>
        <v-card-title>重命名书签</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newBookmarkName"
            label="名称"
            variant="outlined"
            autofocus
            @keyup.enter="submitRename"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showRenameDialog = false">取消</v-btn>
          <v-btn color="primary" :disabled="!newBookmarkName.trim()" @click="submitRename">
            确定
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBookmarkStore } from '../stores/bookmarkStore';
import type { RepositoryContracts } from '@dailyuse/contracts';

type Bookmark = RepositoryContracts.Bookmark;

// Props
const props = defineProps<{
  repositoryUuid?: string;
}>();

// Emits
const emit = defineEmits<{
  select: [bookmark: Bookmark];
}>();

// Store
const bookmarkStore = useBookmarkStore();

// State
const showRenameDialog = ref(false);
const selectedBookmark = ref<Bookmark | null>(null);
const newBookmarkName = ref('');

// Computed
const currentBookmarks = computed(() => {
  if (!props.repositoryUuid) return [];
  return bookmarkStore.bookmarksByRepository(props.repositoryUuid)
    .sort((a, b) => a.order - b.order);
});

// Methods
function getBookmarkIcon(bookmark: Bookmark): string {
  if (bookmark.icon) return bookmark.icon;
  return bookmark.targetType === 'folder' ? 'mdi-folder' : 'mdi-file-document';
}

function handleSelectBookmark(bookmark: Bookmark): void {
  emit('select', bookmark);
}

function handleRenameBookmark(bookmark: Bookmark): void {
  selectedBookmark.value = bookmark;
  newBookmarkName.value = bookmark.name;
  showRenameDialog.value = true;
}

function submitRename(): void {
  if (selectedBookmark.value && newBookmarkName.value.trim()) {
    bookmarkStore.updateBookmark(selectedBookmark.value.uuid, {
      name: newBookmarkName.value.trim(),
    });
    showRenameDialog.value = false;
  }
}

function handleRemoveBookmark(bookmark: Bookmark): void {
  if (confirm(`确定要删除书签"${bookmark.name}"吗？`)) {
    bookmarkStore.removeBookmark(bookmark.uuid);
  }
}

function handleMoveUp(bookmark: Bookmark): void {
  bookmarkStore.moveUp(bookmark.uuid);
}

function handleMoveDown(bookmark: Bookmark): void {
  bookmarkStore.moveDown(bookmark.uuid);
}

function isFirst(bookmark: Bookmark): boolean {
  return currentBookmarks.value[0]?.uuid === bookmark.uuid;
}

function isLast(bookmark: Bookmark): boolean {
  const bookmarks = currentBookmarks.value;
  return bookmarks[bookmarks.length - 1]?.uuid === bookmark.uuid;
}
</script>

<style scoped>
/* 使用 Vuetify 工具类，无需自定义样式 */
</style>
