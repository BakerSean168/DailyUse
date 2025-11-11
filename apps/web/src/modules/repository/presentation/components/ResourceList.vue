<template>
  <v-card class="resource-list" elevation="0">
    <!-- 资源列表 -->
    <v-list density="compact" class="resource-items">
      <v-list-item
        v-for="resource in filteredResources"
        :key="resource.uuid"
        :value="resource.uuid"
        :active="resource.uuid === selectedResourceUuid"
        @click="openResource(resource)"
        @dblclick="openResourceInTab(resource)"
      >
        <!-- 资源图标 -->
        <template #prepend>
          <v-icon :icon="getResourceIcon(resource.type)" size="small" />
        </template>

        <!-- 资源名称 -->
        <v-list-item-title>{{ resource.name }}</v-list-item-title>

        <!-- 资源信息 -->
        <v-list-item-subtitle v-if="resource.metadata?.wordCount">
          {{ resource.metadata.wordCount }} 字
        </v-list-item-subtitle>

        <!-- 操作菜单 -->
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
              <v-list-item @click="openResourceInTab(resource)">
                <template #prepend>
                  <v-icon icon="mdi-open-in-new" />
                </template>
                <v-list-item-title>在新标签页打开</v-list-item-title>
              </v-list-item>

              <v-list-item @click="renameResource(resource)">
                <template #prepend>
                  <v-icon icon="mdi-rename-box" />
                </template>
                <v-list-item-title>重命名</v-list-item-title>
              </v-list-item>

              <v-list-item @click="moveResource(resource)">
                <template #prepend>
                  <v-icon icon="mdi-folder-move" />
                </template>
                <v-list-item-title>移动</v-list-item-title>
              </v-list-item>

              <v-divider />

              <v-list-item @click="addToBookmarks(resource)">
                <template #prepend>
                  <v-icon 
                    :icon="bookmarkStore.hasBookmark(resource.uuid) ? 'mdi-bookmark' : 'mdi-bookmark-outline'" 
                    :color="bookmarkStore.hasBookmark(resource.uuid) ? 'primary' : undefined"
                  />
                </template>
                <v-list-item-title>
                  {{ bookmarkStore.hasBookmark(resource.uuid) ? '已添加书签' : '添加到书签' }}
                </v-list-item-title>
              </v-list-item>

              <v-divider />

              <v-list-item @click="deleteResource(resource)" class="text-error">
                <template #prepend>
                  <v-icon icon="mdi-delete" color="error" />
                </template>
                <v-list-item-title>删除</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-list-item>

      <!-- 空状态 -->
      <v-list-item v-if="filteredResources.length === 0">
        <v-list-item-title class="text-center text-grey">
          暂无资源
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { useResourceStore } from '../stores/resourceStore';
import { useBookmarkStore } from '../stores/bookmarkStore';

const props = defineProps<{
  repositoryUuid: string;
}>();

const resourceStore = useResourceStore();
const bookmarkStore = useBookmarkStore();

const resources = computed(() => resourceStore.resources);
const selectedResourceUuid = computed(() => resourceStore.selectedResource?.uuid);

// 显示所有资源
const filteredResources = computed(() => resources.value);

/**
 * 打开资源 (单击)
 */
function openResource(resource: RepositoryContracts.ResourceClientDTO) {
  // 选中但不打开编辑器
  resourceStore.selectedResource = resource;
}

/**
 * 在新标签页打开资源 (双击 / 菜单)
 */
async function openResourceInTab(resource: RepositoryContracts.ResourceClientDTO) {
  await resourceStore.openInTab(resource);
}

/**
 * 获取资源图标
 */
function getResourceIcon(type: string): string {
  const iconMap: Record<string, string> = {
    MARKDOWN: 'mdi-language-markdown',
    IMAGE: 'mdi-image',
    VIDEO: 'mdi-video',
    AUDIO: 'mdi-music',
    PDF: 'mdi-file-pdf-box',
    LINK: 'mdi-link',
    CODE: 'mdi-code-braces',
    OTHER: 'mdi-file',
  };
  return iconMap[type] || 'mdi-file';
}

/**
 * 重命名资源
 */
function renameResource(resource: RepositoryContracts.ResourceClientDTO) {
  const newName = prompt('请输入新名称:', resource.name);
  if (newName && newName !== resource.name) {
    // TODO: 实现重命名 API
    console.log('Rename resource:', resource.uuid, newName);
  }
}

/**
 * 移动资源
 */
function moveResource(resource: RepositoryContracts.ResourceClientDTO) {
  // TODO: 实现移动对话框
  console.log('Move resource:', resource.uuid);
}

/**
 * 删除资源
 */
async function deleteResource(resource: RepositoryContracts.ResourceClientDTO) {
  const confirmed = confirm(`确定要删除 "${resource.name}" 吗？`);
  if (confirmed) {
    try {
      await resourceStore.deleteResource(resource.uuid);
      // 同时删除书签
      bookmarkStore.removeBookmarkByTarget(resource.uuid);
    } catch (error) {
      console.error('Failed to delete resource:', error);
      alert('删除失败，请稍后重试');
    }
  }
}

/**
 * 添加到书签
 */
function addToBookmarks(resource: RepositoryContracts.ResourceClientDTO) {
  if (bookmarkStore.hasBookmark(resource.uuid)) {
    // 已存在，不再添加
    return;
  }
  
  bookmarkStore.addBookmark({
    name: resource.name,
    targetUuid: resource.uuid,
    targetType: 'resource',
    repositoryUuid: props.repositoryUuid,
    icon: getResourceIcon(resource.type),
  });
  
  console.log('已添加到书签:', resource.name);
}
</script>

<style scoped>
.resource-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resource-items {
  flex: 1;
  overflow-y: auto;
}
</style>
