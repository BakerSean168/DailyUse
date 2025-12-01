<!--
  FileTree - 统一文件树组件
  
  将文件夹和资源整合为统一的树形结构
  使用 DuContextMenu 提供右键菜单功能
  
  设计参考: Obsidian 文件管理器
-->

<template>
  <div class="file-tree">
    <!-- 顶部工具栏 -->
    <div class="file-tree-toolbar">
      <v-btn
        icon="mdi-file-plus-outline"
        size="small"
        variant="text"
        density="compact"
        @click="handleCreateResource"
      >
        <v-icon size="18">mdi-file-plus-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">新建笔记</v-tooltip>
      </v-btn>
      <v-btn
        icon="mdi-folder-plus-outline"
        size="small"
        variant="text"
        density="compact"
        @click="handleCreateFolder()"
      >
        <v-icon size="18">mdi-folder-plus-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">新建文件夹</v-tooltip>
      </v-btn>
      <v-btn
        icon="mdi-robot-outline"
        size="small"
        variant="text"
        density="compact"
        @click="handleAICreate"
      >
        <v-icon size="18">mdi-robot-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">AI 生成知识文档</v-tooltip>
      </v-btn>
      <v-spacer />
      <v-btn
        icon="mdi-refresh"
        size="small"
        variant="text"
        density="compact"
        :loading="fileTreeStore.isLoading"
        @click="handleRefresh"
      >
        <v-icon size="18">mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="bottom">刷新</v-tooltip>
      </v-btn>
    </div>

    <!-- 空状态 -->
    <div v-if="!repositoryUuid" class="file-tree-empty">
      <v-icon icon="mdi-folder-off-outline" size="32" class="mb-2 text-disabled" />
      <span class="text-caption text-disabled">请先选择仓储</span>
    </div>

    <!-- 加载中 -->
    <div v-else-if="fileTreeStore.isLoading && treeNodes.length === 0" class="file-tree-loading">
      <v-progress-circular indeterminate size="24" />
    </div>

    <!-- 树结构 -->
    <div v-else class="file-tree-content" @contextmenu.prevent="handleEmptyAreaContextMenu">
      <!-- 无内容时的空状态 -->
      <div v-if="treeNodes.length === 0" class="file-tree-empty">
        <v-icon icon="mdi-folder-open-outline" size="32" class="mb-2 text-disabled" />
        <span class="text-caption text-disabled">暂无文件夹</span>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          class="mt-2"
          @click="handleCreateFolder()"
        >
          + 创建文件夹
        </v-btn>
      </div>

      <!-- 递归渲染树节点 -->
      <template v-else>
        <FileTreeNode
          v-for="node in treeNodes"
          :key="node.uuid"
          :node="node"
          :level="0"
          :selected-uuid="fileTreeStore.selectedNodeUuid"
          @select="handleNodeSelect"
          @toggle="handleNodeToggle"
          @dblclick="handleNodeDblClick"
          @contextmenu="handleNodeContextMenu"
        />
      </template>
    </div>

    <!-- 右键菜单 -->
    <DuContextMenu
      v-model:show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue';
import { useFileTreeStore } from '../stores/fileTreeStore';
import { useResourceStore } from '../stores/resourceStore';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';
import FileTreeNode from './FileTreeNode.vue';
import type { TreeNode } from '@dailyuse/contracts/repository';

// Props
interface Props {
  repositoryUuid: string | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'create-folder', parentUuid?: string): void;
  (e: 'create-resource', folderUuid?: string): void;
  (e: 'rename-node', node: TreeNode): void;
  (e: 'delete-node', node: TreeNode): void;
  (e: 'open-resource', node: TreeNode): void;
  (e: 'ai-generate-knowledge', parentFolderUuid?: string): void;
}>();

// Stores
const fileTreeStore = useFileTreeStore();
const resourceStore = useResourceStore();
const bookmarkStore = useBookmarkStore();

// Computed
const treeNodes = computed(() => {
  if (!props.repositoryUuid) return [];
  return fileTreeStore.getTreeByRepository(props.repositoryUuid);
});

// Context Menu State
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  currentNode: null as TreeNode | null,
});

// ===== 事件处理 =====

/**
 * 选中节点
 */
function handleNodeSelect(node: TreeNode) {
  fileTreeStore.selectNode(node.uuid);
}

/**
 * 切换文件夹展开/折叠
 */
function handleNodeToggle(node: TreeNode) {
  if (node.type === 'folder') {
    fileTreeStore.toggleNode(node.uuid);
  }
}

/**
 * 双击节点 - 打开文件
 */
async function handleNodeDblClick(node: TreeNode) {
  if (node.type === 'file') {
    // 打开文件到编辑器
    const resource = resourceStore.resources.find((r: any) => r.uuid === node.uuid);
    if (resource) {
      await resourceStore.openInTab(resource);
    }
    emit('open-resource', node);
  } else {
    // 文件夹切换展开状态
    handleNodeToggle(node);
  }
}

/**
 * 节点右键菜单
 */
function handleNodeContextMenu(event: MouseEvent, node: TreeNode) {
  event.preventDefault();
  event.stopPropagation();

  console.log('🖱️ [FileTree] 右键菜单触发:', { node: node.name, type: node.type, x: event.clientX, y: event.clientY });

  contextMenu.currentNode = node;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;

  if (node.type === 'folder') {
    // 文件夹菜单
    contextMenu.items = [
      {
        title: '新建笔记',
        icon: 'mdi-file-plus-outline',
        action: () => emit('create-resource', node.uuid),
      },
      {
        title: '新建子文件夹',
        icon: 'mdi-folder-plus-outline',
        action: () => emit('create-folder', node.uuid),
      },
      {
        title: '🤖 AI 生成知识文档',
        icon: 'mdi-robot-outline',
        action: () => emit('ai-generate-knowledge', node.uuid),
      },
      { divider: true },
      {
        title: '重命名',
        icon: 'mdi-pencil-outline',
        shortcut: 'F2',
        action: () => emit('rename-node', node),
      },
      {
        title: bookmarkStore.hasBookmark(node.uuid) ? '已添加书签' : '添加到书签',
        icon: bookmarkStore.hasBookmark(node.uuid) ? 'mdi-bookmark' : 'mdi-bookmark-outline',
        iconColor: bookmarkStore.hasBookmark(node.uuid) ? 'primary' : undefined,
        disabled: bookmarkStore.hasBookmark(node.uuid),
        action: () => handleAddToBookmarks(node),
      },
      { divider: true },
      {
        title: '删除',
        icon: 'mdi-delete-outline',
        danger: true,
        action: () => emit('delete-node', node),
      },
    ];
  } else {
    // 文件菜单
    contextMenu.items = [
      {
        title: '打开',
        icon: 'mdi-open-in-new',
        action: () => handleNodeDblClick(node),
      },
      { divider: true },
      {
        title: '重命名',
        icon: 'mdi-pencil-outline',
        shortcut: 'F2',
        action: () => emit('rename-node', node),
      },
      {
        title: bookmarkStore.hasBookmark(node.uuid) ? '已添加书签' : '添加到书签',
        icon: bookmarkStore.hasBookmark(node.uuid) ? 'mdi-bookmark' : 'mdi-bookmark-outline',
        iconColor: bookmarkStore.hasBookmark(node.uuid) ? 'primary' : undefined,
        disabled: bookmarkStore.hasBookmark(node.uuid),
        action: () => handleAddToBookmarks(node),
      },
      { divider: true },
      {
        title: '删除',
        icon: 'mdi-delete-outline',
        danger: true,
        action: () => emit('delete-node', node),
      },
    ];
  }

  contextMenu.show = true;
  console.log('🖱️ [FileTree] 菜单已显示:', { items: contextMenu.items.length, x: contextMenu.x, y: contextMenu.y });
}

/**
 * 空白区域右键菜单
 */
function handleEmptyAreaContextMenu(event: MouseEvent) {
  if (!props.repositoryUuid) return;

  contextMenu.currentNode = null;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;

  contextMenu.items = [
    {
      title: '新建笔记',
      icon: 'mdi-file-plus-outline',
      action: () => emit('create-resource'),
    },
    {
      title: '新建文件夹',
      icon: 'mdi-folder-plus-outline',
      action: () => emit('create-folder'),
    },
    {
      title: '🤖 AI 生成知识文档',
      icon: 'mdi-robot-outline',
      action: () => emit('ai-generate-knowledge'),
    },
    { divider: true },
    {
      title: '刷新',
      icon: 'mdi-refresh',
      action: handleRefresh,
    },
  ];

  contextMenu.show = true;
}

/**
 * 添加到书签
 */
function handleAddToBookmarks(node: TreeNode) {
  if (!props.repositoryUuid || bookmarkStore.hasBookmark(node.uuid)) return;

  bookmarkStore.addBookmark({
    name: node.name,
    targetUuid: node.uuid,
    targetType: node.type === 'folder' ? 'folder' : 'resource',
    repositoryUuid: props.repositoryUuid,
    icon: node.type === 'folder' ? 'mdi-folder-outline' : 'mdi-language-markdown',
  });
}

/**
 * 创建文件夹
 */
function handleCreateFolder(parentUuid?: string) {
  emit('create-folder', parentUuid);
}

/**
 * 创建资源
 */
function handleCreateResource() {
  const selectedNode = fileTreeStore.getSelectedNode;
  const folderUuid = selectedNode?.type === 'folder' ? selectedNode.uuid : undefined;
  emit('create-resource', folderUuid);
}

/**
 * AI 生成知识文档（工具栏按钮 - 在根目录创建）
 */
function handleAICreate() {
  emit('ai-generate-knowledge', undefined);
}

/**
 * 刷新文件树
 */
async function handleRefresh() {
  if (props.repositoryUuid) {
    await fileTreeStore.refreshTree(props.repositoryUuid);
  }
}

// ===== 生命周期 =====

// 监听仓储变化，加载文件树
watch(
  () => props.repositoryUuid,
  async (newUuid) => {
    if (newUuid) {
      await fileTreeStore.loadTree(newUuid);
    }
  },
  { immediate: true }
);

// 暴露刷新方法
defineExpose({
  refresh: handleRefresh,
});
</script>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.file-tree-toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 2px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  flex-shrink: 0;
}

.file-tree-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
}

.file-tree-empty,
.file-tree-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  flex: 1;
}

.text-disabled {
  color: rgba(var(--v-theme-on-surface), 0.38);
}
</style>
