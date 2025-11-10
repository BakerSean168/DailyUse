<template>
  <v-card class="file-explorer" flat>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-folder-outline" class="mr-2" />
      <span>文件夹</span>
      <v-spacer />
      <v-btn
        v-if="selectedRepository"
        icon="mdi-plus"
        size="small"
        variant="text"
        @click="handleCreateFolder"
      />
    </v-card-title>

    <v-card-text v-if="!selectedRepository" class="text-center text-disabled">
      <v-icon icon="mdi-folder-off-outline" size="64" class="mb-2" />
      <p>请先选择一个仓储</p>
    </v-card-text>

    <v-card-text v-else-if="isLoading" class="text-center">
      <v-progress-circular indeterminate color="primary" />
    </v-card-text>

    <v-card-text v-else-if="error" class="text-center text-error">
      <v-icon icon="mdi-alert-circle-outline" size="48" class="mb-2" />
      <p>{{ error }}</p>
      <v-btn color="primary" @click="loadFolderTree">重试</v-btn>
    </v-card-text>

    <v-card-text v-else class="pa-0">
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

      <div v-else class="text-center text-disabled pa-4">
        <v-icon icon="mdi-folder-off-outline" size="48" class="mb-2" />
        <p>暂无文件夹</p>
        <v-btn color="primary" variant="tonal" @click="handleCreateFolder">
          <v-icon icon="mdi-plus" class="mr-1" />
          创建文件夹
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useFolderStore } from '../stores';
import { FolderApiClient } from '../../api';
import type { Folder } from '@dailyuse/domain-client';

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
    const response = await FolderApiClient.getFolderTree(props.selectedRepository);
    
    if (response.success && response.data) {
      const folders = response.data.map((dto) => Folder.fromServerDTO(dto));
      folderStore.setFoldersForRepository(props.selectedRepository!, folders);
    } else {
      error.value = response.message || '加载文件夹树失败';
    }
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
  height: 100%;
  display: flex;
  flex-direction: column;
}

.folder-tree {
  overflow-y: auto;
}

.folder-actions {
  display: flex;
  gap: 4px;
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
</style>
