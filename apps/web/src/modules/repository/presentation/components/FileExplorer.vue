<template>
  <div class="file-explorer">
    <!-- 顶部工具栏 - 只有功能按钮 -->
    <div v-if="selectedRepository" class="explorer-toolbar">
      <v-btn
        icon="mdi-folder-plus-outline"
        size="small"
        variant="text"
        title="新建文件夹"
        @click="handleCreateFolder"
      />
      <v-btn
        icon="mdi-file-plus-outline"
        size="small"
        variant="text"
        title="新建资源"
        @click="handleCreateResource"
      />
      <v-spacer />
      <v-btn
        icon="mdi-dots-vertical"
        size="small"
        variant="text"
        title="更多选项"
      />
    </div>

    <div v-if="!selectedRepository" class="empty-prompt">
      <v-icon icon="mdi-folder-off-outline" size="48" class="mb-2 text-disabled" />
      <p class="text-disabled">请先选择一个仓储</p>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>

    <div v-else-if="error" class="error-state">
      <v-icon icon="mdi-alert-circle-outline" size="48" class="mb-2 text-error" />
      <p class="text-error">{{ error }}</p>
      <v-btn color="primary" size="small" @click="loadFolderTree">重试</v-btn>
    </div>

    <div v-else class="folder-tree-container">
      <v-treeview
        v-if="treeItems.length > 0"
        v-model:opened="openedFolders"
        v-model:selected="selectedFolders"
        :items="treeItems"
        item-value="id"
        item-title="title"
        activatable
        open-on-click
        density="compact"
        class="folder-tree"
      >
        <template #prepend="{ item }">
          <v-icon :icon="getFolderIcon(item)" size="small" />
        </template>

        <template #append="{ item }">
          <div class="folder-actions" @click.stop>
            <v-btn
              icon="mdi-folder-plus-outline"
              size="x-small"
              variant="text"
              @click="handleCreateSubfolder(item.raw)"
            />
            <v-btn
              icon="mdi-pencil-outline"
              size="x-small"
              variant="text"
              @click="handleRenameFolder(item.raw)"
            />
            <v-btn
              icon="mdi-delete-outline"
              size="x-small"
              variant="text"
              @click="handleDeleteFolder(item.raw)"
            />
          </div>
        </template>
      </v-treeview>

      <div v-else class="empty-folder-state">
        <v-icon icon="mdi-folder-off-outline" size="48" class="mb-2 text-disabled" />
        <p class="text-disabled">暂无文件夹</p>
        <v-btn color="primary" variant="tonal" size="small" @click="handleCreateFolder">
          <v-icon icon="mdi-plus" class="mr-1" />
          创建文件夹
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useFolderStore } from '../stores';
import { FolderApiClient } from '../../api';
import { Folder } from '@dailyuse/domain-client';

// Props
interface Props {
  selectedRepository?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedRepository: null,
});

// Emits
const emit = defineEmits<{
  (e: 'create-folder', parentUuid?: string): void;
  (e: 'rename-folder', folder: Folder): void;
  (e: 'delete-folder', folder: Folder): void;
  (e: 'select-folder', folder: Folder | null): void;
}>();

// Store
const folderStore = useFolderStore();

// Local state
const isLoading = ref(false);
const error = ref<string | null>(null);
const openedFolders = ref<string[]>([]);
const selectedFolders = ref<string[]>([]);

// Computed
const treeItems = computed(() => {
  if (!props.selectedRepository) return [];

  const folders = folderStore.getFoldersByRepositoryUuid(props.selectedRepository);
  return buildTreeItems(folders);
});

// Methods
async function loadFolderTree() {
  if (!props.selectedRepository) return;

  isLoading.value = true;
  error.value = null;

  try {
    const data = await FolderApiClient.getFolderTree(props.selectedRepository);
    const folders = data.map((dto: any) => Folder.fromServerDTO(dto));
    folderStore.setFoldersForRepository(props.selectedRepository!, folders);
  } catch (err: any) {
    error.value = err.message || '加载文件夹树失败';
    console.error('加载文件夹树失败:', err);
  } finally {
    isLoading.value = false;
  }
}

function buildTreeItems(folders: Folder[]): any[] {
  const folderMap = new Map<string, any>();
  const roots: any[] = [];

  // 第一遍：创建节点
  folders.forEach((folder) => {
    folderMap.set(folder.uuid, {
      id: folder.uuid,
      title: folder.name,
      children: [],
      raw: folder,
    });
  });

  // 第二遍：构建树形结构
  folders.forEach((folder) => {
    const node = folderMap.get(folder.uuid);
    
    if (!folder.parentUuid) {
      roots.push(node);
    } else {
      const parent = folderMap.get(folder.parentUuid);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
}

function getFolderIcon(item: any): string {
  const folder = item.raw as Folder;
  
  if (folder.metadata?.icon) {
    return folder.metadata.icon;
  }
  
  return openedFolders.value.includes(item.id)
    ? 'mdi-folder-open-outline'
    : 'mdi-folder-outline';
}

function handleCreateFolder() {
  emit('create-folder');
}

function handleCreateResource() {
  // TODO: 实现创建资源功能
  console.log('Create resource');
}

function handleCreateSubfolder(folder: Folder) {
  emit('create-folder', folder.uuid);
}

function handleRenameFolder(folder: Folder) {
  emit('rename-folder', folder);
}

function handleDeleteFolder(folder: Folder) {
  emit('delete-folder', folder);
}

// Watchers
watch(
  () => props.selectedRepository,
  (newValue) => {
    if (newValue) {
      loadFolderTree();
    } else {
      openedFolders.value = [];
      selectedFolders.value = [];
    }
  },
  { immediate: true }
);

watch(selectedFolders, (newValue) => {
  if (newValue.length > 0) {
    const folder = folderStore.getFolderByUuid(newValue[0]);
    folderStore.setSelectedFolder(folder?.uuid || null);
    emit('select-folder', folder);
  } else {
    folderStore.setSelectedFolder(null);
    emit('select-folder', null);
  }
});

// Lifecycle
onMounted(() => {
  if (props.selectedRepository) {
    loadFolderTree();
  }
});

// Expose
defineExpose({
  refresh: loadFolderTree,
});
</script>

<style scoped>
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 工具栏 - Obsidian 风格 */
.explorer-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* 状态区域 */
.empty-prompt,
.loading-state,
.error-state,
.empty-folder-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
}

/* 文件夹树容器 */
.folder-tree-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.folder-tree {
  padding: 8px;
}

.folder-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.v-treeview-node:hover .folder-actions {
  opacity: 1;
}

.text-disabled {
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.text-error {
  color: rgb(var(--v-theme-error));
}

.text-error {
  color: rgb(var(--v-theme-error));
}
</style>
