<!--
  TreeNodeItem.vue
  Story 11.1: 统一的文件树节点组件
  递归渲染文件夹和文件
-->

<template>
  <div class="tree-node-item">
    <!-- 节点内容 -->
    <div
      class="node-content"
      :class="{
        'node-selected': isSelected,
        'node-folder': node.type === 'folder',
        'node-file': node.type === 'file',
      }"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @contextmenu.prevent="handleContextMenu"
    >
      <!-- 展开/折叠图标（仅文件夹） -->
      <v-btn
        v-if="node.type === 'folder'"
        icon
        size="x-small"
        variant="text"
        class="expand-toggle"
        @click.stop="toggleExpand"
      >
        <v-icon :icon="isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'" size="18" />
      </v-btn>
      <span v-else class="file-indent" />

      <!-- 图标 -->
      <v-icon :icon="getNodeIcon" :color="getIconColor" size="20" class="node-icon" />

      <!-- 节点名称 -->
      <span class="node-name" :title="node.path">{{ node.name }}</span>

      <!-- 文件元数据（可选） -->
      <span v-if="node.type === 'file' && showFileInfo" class="file-info">
        <span v-if="node.size" class="file-size">{{ formatFileSize(node.size) }}</span>
        <span v-if="node.updatedAt" class="file-date">{{ formatDate(node.updatedAt) }}</span>
      </span>
    </div>

    <!-- 子节点（递归渲染） -->
    <div v-if="node.type === 'folder' && isExpanded && node.children" class="node-children">
      <tree-node-item
        v-for="child in node.children"
        :key="child.uuid"
        :node="child"
        :level="level + 1"
        :show-file-info="showFileInfo"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @open="$emit('open', $event)"
        @contextMenu="$emit('contextMenu', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TreeNode } from '@dailyuse/contracts/repository';
import { useFileTreeStore } from '../stores/fileTreeStore';

// Props
interface Props {
  node: TreeNode;
  level?: number;
  showFileInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  showFileInfo: false,
});

// Emits
const emit = defineEmits<{
  select: [node: TreeNode];
  toggle: [node: TreeNode];
  open: [node: TreeNode];
  contextMenu: [event: { node: TreeNode; mouseEvent: MouseEvent }];
}>();

// Store
const fileTreeStore = useFileTreeStore();

// Computed
const isSelected = computed(() => {
  return fileTreeStore.selectedNodeUuid === props.node.uuid;
});

const isExpanded = computed(() => {
  return props.node.type === 'folder' && fileTreeStore.isNodeExpanded(props.node.uuid);
});

const getNodeIcon = computed(() => {
  if (props.node.type === 'folder') {
    return isExpanded.value ? 'mdi-folder-open' : 'mdi-folder';
  }
  
  // 文件图标根据扩展名
  const ext = props.node.extension?.toLowerCase();
  const iconMap: Record<string, string> = {
    md: 'mdi-language-markdown',
    txt: 'mdi-file-document-outline',
    json: 'mdi-code-json',
    js: 'mdi-language-javascript',
    ts: 'mdi-language-typescript',
    vue: 'mdi-vuejs',
    html: 'mdi-language-html5',
    css: 'mdi-language-css3',
    png: 'mdi-file-image',
    jpg: 'mdi-file-image',
    pdf: 'mdi-file-pdf-box',
  };
  
  return iconMap[ext || ''] || 'mdi-file-outline';
});

const getIconColor = computed(() => {
  if (props.node.type === 'folder') {
    return isExpanded.value ? 'primary' : 'grey';
  }
  
  // 文件图标颜色
  const ext = props.node.extension?.toLowerCase();
  const colorMap: Record<string, string> = {
    md: 'blue',
    txt: 'grey',
    json: 'orange',
    js: 'yellow',
    ts: 'blue',
    vue: 'green',
    html: 'orange',
    css: 'blue',
    png: 'purple',
    jpg: 'purple',
    pdf: 'red',
  };
  
  return colorMap[ext || ''] || 'grey';
});

// Methods
function handleClick() {
  emit('select', props.node);
  fileTreeStore.selectNode(props.node.uuid);
}

function handleDoubleClick() {
  if (props.node.type === 'file') {
    emit('open', props.node);
  } else {
    toggleExpand();
  }
}

function toggleExpand() {
  if (props.node.type === 'folder') {
    emit('toggle', props.node);
    fileTreeStore.toggleNode(props.node.uuid);
  }
}

function handleContextMenu(event: MouseEvent) {
  emit('contextMenu', { node: props.node, mouseEvent: event });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
</script>

<style scoped lang="scss">
.tree-node-item {
  width: 100%;
}

.node-content {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s ease;
  user-select: none;

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.05);
  }

  &.node-selected {
    background-color: rgba(var(--v-theme-primary), 0.12);
    
    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.16);
    }
  }

  &:active {
    background-color: rgba(var(--v-theme-on-surface), 0.12);
  }
}

.expand-toggle {
  margin-right: 2px;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
}

.file-indent {
  width: 28px;
  flex-shrink: 0;
}

.node-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.node-name {
  flex: 1;
  font-size: 14px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  flex-shrink: 0;
}

.file-size,
.file-date {
  white-space: nowrap;
}

.node-children {
  padding-left: 16px;
}
</style>



