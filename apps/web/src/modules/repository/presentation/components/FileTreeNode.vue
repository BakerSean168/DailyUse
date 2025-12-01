<!--
  FileTreeNode - 文件树节点组件
  
  递归渲染树节点，支持文件夹和文件
  参考 Obsidian 文件管理器的交互风格
-->

<template>
  <div
    class="tree-node"
    :class="{
      'tree-node--folder': node.type === 'folder',
      'tree-node--file': node.type === 'file',
      'tree-node--selected': isSelected,
      'tree-node--expanded': isExpanded,
    }"
  >
    <!-- 节点行 -->
    <div
      class="tree-node-row"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="handleClick"
      @dblclick="handleDblClick"
      @contextmenu.prevent.stop="handleContextMenu"
    >
      <!-- 展开/折叠箭头 (仅文件夹) -->
      <span
        v-if="node.type === 'folder'"
        class="tree-node-arrow"
        :class="{ 'tree-node-arrow--expanded': isExpanded }"
        @click.stop="handleToggle"
      >
        <v-icon size="14">mdi-chevron-right</v-icon>
      </span>
      <span v-else class="tree-node-arrow tree-node-arrow--placeholder"></span>

      <!-- 图标 -->
      <span class="tree-node-icon">
        <v-icon :icon="nodeIcon" size="16" />
      </span>

      <!-- 名称 -->
      <span class="tree-node-name" :title="node.name">
        {{ displayName }}
      </span>
    </div>

    <!-- 子节点 (文件夹展开时) -->
    <div v-if="node.type === 'folder' && isExpanded && node.children?.length" class="tree-node-children">
      <FileTreeNode
        v-for="child in sortedChildren"
        :key="child.uuid"
        :node="child"
        :level="level + 1"
        :selected-uuid="selectedUuid"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @dblclick="$emit('dblclick', $event)"
        @contextmenu="(event, node) => $emit('contextmenu', event, node)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFileTreeStore } from '../stores/fileTreeStore';
import type { TreeNode } from '@dailyuse/contracts/repository';

// Props
interface Props {
  node: TreeNode;
  level: number;
  selectedUuid: string | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'select', node: TreeNode): void;
  (e: 'toggle', node: TreeNode): void;
  (e: 'dblclick', node: TreeNode): void;
  (e: 'contextmenu', event: MouseEvent, node: TreeNode): void;
}>();

// Store
const fileTreeStore = useFileTreeStore();

// Computed
const isSelected = computed(() => props.selectedUuid === props.node.uuid);
const isExpanded = computed(() => fileTreeStore.isNodeExpanded(props.node.uuid));

/**
 * 节点图标
 */
const nodeIcon = computed(() => {
  if (props.node.type === 'folder') {
    return isExpanded.value ? 'mdi-folder-open-outline' : 'mdi-folder-outline';
  }
  
  // 根据文件扩展名返回图标
  const ext = props.node.extension?.toLowerCase();
  const iconMap: Record<string, string> = {
    md: 'mdi-language-markdown',
    markdown: 'mdi-language-markdown',
    txt: 'mdi-file-document-outline',
    jpg: 'mdi-image',
    jpeg: 'mdi-image',
    png: 'mdi-image',
    gif: 'mdi-image',
    svg: 'mdi-image',
    webp: 'mdi-image',
    mp4: 'mdi-video',
    webm: 'mdi-video',
    mp3: 'mdi-music',
    wav: 'mdi-music',
    pdf: 'mdi-file-pdf-box',
    json: 'mdi-code-json',
    js: 'mdi-language-javascript',
    ts: 'mdi-language-typescript',
    vue: 'mdi-vuejs',
    html: 'mdi-language-html5',
    css: 'mdi-language-css3',
  };
  
  return iconMap[ext || ''] || 'mdi-file-outline';
});

/**
 * 显示名称 (隐藏 .md 扩展名)
 */
const displayName = computed(() => {
  if (props.node.type === 'file' && props.node.name.endsWith('.md')) {
    return props.node.name.slice(0, -3);
  }
  return props.node.name;
});

/**
 * 排序的子节点 - 文件夹在前，文件在后，同类型按名称排序
 */
const sortedChildren = computed(() => {
  if (!props.node.children) return [];
  
  return [...props.node.children].sort((a, b) => {
    // 文件夹优先
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    // 同类型按名称排序
    return a.name.localeCompare(b.name, 'zh-CN');
  });
});

// ===== 事件处理 =====

function handleClick() {
  emit('select', props.node);
}

function handleDblClick() {
  emit('dblclick', props.node);
}

function handleToggle() {
  emit('toggle', props.node);
}

function handleContextMenu(event: MouseEvent) {
  console.log('🖱️ [FileTreeNode] contextmenu 事件触发:', { name: props.node.name });
  emit('contextmenu', event, props.node);
}
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.tree-node-row {
  display: flex;
  align-items: center;
  height: 28px;
  padding-right: 8px;
  cursor: pointer;
  border-radius: 4px;
  margin: 1px 4px;
  transition: background-color 0.1s ease;
}

.tree-node-row:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.tree-node--selected > .tree-node-row {
  background-color: rgba(var(--v-theme-primary), 0.12);
}

.tree-node--selected > .tree-node-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.16);
}

/* 展开箭头 */
.tree-node-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transition: transform 0.15s ease;
  opacity: 0.5;
}

.tree-node-arrow:hover {
  opacity: 1;
}

.tree-node-arrow--expanded {
  transform: rotate(90deg);
}

.tree-node-arrow--placeholder {
  visibility: hidden;
}

/* 图标 */
.tree-node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 4px;
  opacity: 0.7;
}

.tree-node--folder > .tree-node-row > .tree-node-icon {
  color: rgb(var(--v-theme-warning));
  opacity: 0.9;
}

/* 名称 */
.tree-node-name {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 子节点容器 - 无需额外样式，缩进通过 level 控制 */
</style>
