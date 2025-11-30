<!--
  FileTreePanel.vue
  Story 11.1: 统一的文件树面板
  替代 FilesPanel，使用 TreeNodeItem 渲染完整树结构
-->

<template>
  <div class="file-tree-panel">
    <!-- 工具栏 -->
    <div class="tree-toolbar">
      <v-btn
        icon
        size="small"
        variant="text"
        title="刷新"
        @click="handleRefresh"
        :loading="isLoading"
      >
        <v-icon icon="mdi-refresh" />
      </v-btn>

      <v-btn
        icon
        size="small"
        variant="text"
        :title="isAllExpanded ? '全部折叠' : '全部展开'"
        @click="toggleExpandAll"
      >
        <v-icon :icon="isAllExpanded ? 'mdi-unfold-less-horizontal' : 'mdi-unfold-more-horizontal'" />
      </v-btn>

      <v-spacer />

      <v-btn
        icon
        size="small"
        variant="text"
        title="新建文件夹"
        @click="$emit('create-folder')"
      >
        <v-icon icon="mdi-folder-plus-outline" />
      </v-btn>

      <v-btn
        icon
        size="small"
        variant="text"
        title="新建文件"
        @click="$emit('create-resource')"
      >
        <v-icon icon="mdi-file-plus-outline" />
      </v-btn>
    </div>

    <!-- 文件树内容 -->
    <div class="tree-content">
      <!-- 加载状态 -->
      <div v-if="isLoading && treeNodes.length === 0" class="tree-loading">
        <v-progress-circular indeterminate size="32" />
        <span class="loading-text">加载文件树...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!isLoading && treeNodes.length === 0" class="tree-empty">
        <v-icon icon="mdi-folder-open-outline" size="48" class="empty-icon" />
        <span class="empty-text">暂无文件</span>
        <v-btn
          size="small"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="$emit('create-folder')"
        >
          新建文件夹
        </v-btn>
      </div>

      <!-- 文件树 -->
      <div v-else class="tree-nodes">
        <tree-node-item
          v-for="node in treeNodes"
          :key="node.uuid"
          :node="node"
          :show-file-info="showFileInfo"
          @select="handleNodeSelect"
          @toggle="handleNodeToggle"
          @open="handleNodeOpen"
          @context-menu="handleContextMenu"
        />
      </div>

      <!-- 错误提示 -->
      <v-snackbar
        v-model="showError"
        color="error"
        location="top"
        :timeout="3000"
      >
        {{ error }}
        <template #actions>
          <v-btn variant="text" @click="showError = false">关闭</v-btn>
        </template>
      </v-snackbar>
    </div>

    <!-- 右键菜单 -->
    <v-menu
      v-model="contextMenu.show"
      :style="{
        position: 'fixed',
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
      }"
      :close-on-content-click="true"
    >
      <v-list density="compact">
        <!-- 文件夹菜单 -->
        <template v-if="contextMenu.node?.type === 'folder'">
          <v-list-item prepend-icon="mdi-folder-plus-outline" @click="handleCreateFolder">
            <v-list-item-title>新建子文件夹</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-file-plus-outline" @click="handleCreateResource">
            <v-list-item-title>新建文件</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item prepend-icon="mdi-pencil-outline" @click="handleRenameFolder">
            <v-list-item-title>重命名</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-delete-outline" @click="handleDeleteFolder">
            <v-list-item-title>删除</v-list-item-title>
          </v-list-item>
        </template>

        <!-- 文件菜单 -->
        <template v-else-if="contextMenu.node?.type === 'file'">
          <v-list-item prepend-icon="mdi-open-in-new" @click="handleOpenFile">
            <v-list-item-title>打开</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item prepend-icon="mdi-pencil-outline" @click="handleRenameResource">
            <v-list-item-title>重命名</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-delete-outline" @click="handleDeleteResource">
            <v-list-item-title>删除</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { TreeNode } from '@dailyuse/contracts/repository';
import { useFileTreeStore } from '../stores/fileTreeStore';
import TreeNodeItem from './TreeNodeItem.vue';

// Props
interface Props {
  repositoryUuid: string | null;
  showFileInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showFileInfo: false,
});

// Emits
const emit = defineEmits<{
  'create-folder': [];
  'create-resource': [];
  'rename-folder': [uuid: string];
  'delete-folder': [uuid: string];
  'rename-resource': [uuid: string];
  'delete-resource': [uuid: string];
  'select-node': [node: TreeNode];
  'open-file': [node: TreeNode];
}>();

// Store
const fileTreeStore = useFileTreeStore();

// State
const showError = ref(false);
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  node: null as TreeNode | null,
});

// Computed
const treeNodes = computed(() => {
  if (!props.repositoryUuid) return [];
  return fileTreeStore.getTreeByRepository(props.repositoryUuid);
});

const isLoading = computed(() => fileTreeStore.isLoading);

const error = computed({
  get: () => fileTreeStore.error,
  set: (value) => (showError.value = !!value),
});

const isAllExpanded = computed(() => {
  if (!props.repositoryUuid) return false;
  const folderNodes = fileTreeStore.getFolderNodes(props.repositoryUuid);
  return folderNodes.every(folder => fileTreeStore.isNodeExpanded(folder.uuid));
});

// Methods
async function loadTree() {
  if (!props.repositoryUuid) return;
  
  try {
    await fileTreeStore.loadTree(props.repositoryUuid);
  } catch (error: any) {
    showError.value = true;
  }
}

async function handleRefresh() {
  await loadTree();
}

function toggleExpandAll() {
  if (!props.repositoryUuid) return;
  
  if (isAllExpanded.value) {
    fileTreeStore.collapseAll();
  } else {
    fileTreeStore.expandAll(props.repositoryUuid);
  }
}

function handleNodeSelect(node: TreeNode) {
  emit('select-node', node);
}

function handleNodeToggle(node: TreeNode) {
  // Store 已经处理了展开/折叠状态
}

function handleNodeOpen(node: TreeNode) {
  if (node.type === 'file') {
    emit('open-file', node);
  }
}

function handleContextMenu(event: { node: TreeNode; mouseEvent: MouseEvent }) {
  contextMenu.value = {
    show: true,
    x: event.mouseEvent.clientX,
    y: event.mouseEvent.clientY,
    node: event.node,
  };
}

function handleCreateFolder() {
  emit('create-folder');
  contextMenu.value.show = false;
}

function handleCreateResource() {
  emit('create-resource');
  contextMenu.value.show = false;
}

function handleRenameFolder() {
  if (contextMenu.value.node) {
    emit('rename-folder', contextMenu.value.node.uuid);
  }
  contextMenu.value.show = false;
}

function handleDeleteFolder() {
  if (contextMenu.value.node) {
    emit('delete-folder', contextMenu.value.node.uuid);
  }
  contextMenu.value.show = false;
}

function handleRenameResource() {
  if (contextMenu.value.node) {
    emit('rename-resource', contextMenu.value.node.uuid);
  }
  contextMenu.value.show = false;
}

function handleDeleteResource() {
  if (contextMenu.value.node) {
    emit('delete-resource', contextMenu.value.node.uuid);
  }
  contextMenu.value.show = false;
}

function handleOpenFile() {
  if (contextMenu.value.node && contextMenu.value.node.type === 'file') {
    emit('open-file', contextMenu.value.node);
  }
  contextMenu.value.show = false;
}

// Watch
watch(() => props.repositoryUuid, (newUuid) => {
  if (newUuid) {
    loadTree();
  }
}, { immediate: true });

// Lifecycle
onMounted(() => {
  if (props.repositoryUuid) {
    loadTree();
  }
});
</script>

<style scoped lang="scss">
.file-tree-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgb(var(--v-theme-surface));
}

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: rgb(var(--v-theme-surface));
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 4px;
}

.tree-loading,
.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  padding: 32px 16px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.loading-text {
  font-size: 14px;
}

.empty-icon {
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.tree-nodes {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>



