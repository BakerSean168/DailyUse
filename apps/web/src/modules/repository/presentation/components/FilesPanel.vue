<!--
  FilesPanel - 文件面板
  
  使用统一的 FileTree 组件替代分离的 FileExplorer + ResourceList
-->

<template>
  <div class="files-panel">
    <FileTree
      ref="fileTreeRef"
      :repository-uuid="selectedRepository"
      @create-folder="$emit('create-folder', $event)"
      @create-resource="$emit('create-resource', $event)"
      @rename-node="handleRenameNode"
      @delete-node="handleDeleteNode"
      @open-resource="handleOpenResource"
      @ai-generate-knowledge="$emit('ai-generate-knowledge', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FileTree from './FileTree.vue';
import type { TreeNode } from '@dailyuse/contracts/repository';

// Props
interface Props {
  selectedRepository: string | null;
}

defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'create-folder', parentUuid?: string): void;
  (e: 'create-resource', folderUuid?: string): void;
  (e: 'rename-folder', node: TreeNode): void;
  (e: 'delete-folder', node: TreeNode): void;
  (e: 'rename-resource', node: TreeNode): void;
  (e: 'delete-resource', node: TreeNode): void;
  (e: 'select-folder', node: TreeNode | null): void;
  (e: 'ai-generate-knowledge', parentFolderUuid?: string): void;
}>();

// Refs
const fileTreeRef = ref<InstanceType<typeof FileTree> | null>(null);

// 处理重命名节点
function handleRenameNode(node: TreeNode) {
  if (node.type === 'folder') {
    emit('rename-folder', node);
  } else {
    emit('rename-resource', node);
  }
}

// 处理删除节点
function handleDeleteNode(node: TreeNode) {
  if (node.type === 'folder') {
    emit('delete-folder', node);
  } else {
    emit('delete-resource', node);
  }
}

// 处理打开资源
function handleOpenResource(node: TreeNode) {
  console.log('打开资源:', node.name);
}

// Expose refresh method
defineExpose({
  refresh: () => fileTreeRef.value?.refresh(),
});
</script>

<style scoped>
.files-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
