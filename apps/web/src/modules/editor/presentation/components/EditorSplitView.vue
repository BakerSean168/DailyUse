<!--
  EditorSplitView Component
  
  Presentation Layer - Component
  分屏编辑器布局：支持仅编辑、仅预览、左右分屏三种模式
-->
<template>
  <div class="editor-split-view">
    <!-- 编辑区域 -->
    <div v-if="showEditor" class="editor-pane" :style="editorStyle">
      <slot name="editor"></slot>
    </div>

    <!-- 可调整分隔条 -->
    <div v-if="showEditor && showPreview" class="divider" @mousedown="startResize">
      <div class="divider-handle"></div>
    </div>

    <!-- 预览区域 -->
    <div v-if="showPreview" class="preview-pane" :style="previewStyle">
      <slot name="preview"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// ==================== Props ====================
interface Props {
  /** 视图模式: edit | preview | split */
  viewMode?: 'edit' | 'preview' | 'split';
  /** 初始分隔位置（百分比） */
  initialSplitPosition?: number;
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'split',
  initialSplitPosition: 50,
});

// ==================== Emits ====================
const emit = defineEmits<{
  'split-position-change': [position: number];
}>();

// ==================== State ====================
const splitPosition = ref(props.initialSplitPosition);
const isResizing = ref(false);

// ==================== Computed ====================
const showEditor = computed(() => {
  return props.viewMode === 'edit' || props.viewMode === 'split';
});

const showPreview = computed(() => {
  return props.viewMode === 'preview' || props.viewMode === 'split';
});

const editorStyle = computed(() => {
  if (props.viewMode === 'edit') return { width: '100%' };
  if (props.viewMode === 'split') return { width: `${splitPosition.value}%` };
  return {};
});

const previewStyle = computed(() => {
  if (props.viewMode === 'preview') return { width: '100%' };
  if (props.viewMode === 'split') return { width: `${100 - splitPosition.value}%` };
  return {};
});

// ==================== Methods ====================
function startResize(e: MouseEvent) {
  isResizing.value = true;
  e.preventDefault();
  document.body.style.cursor = 'col-resize';
}

function onMouseMove(e: MouseEvent) {
  if (!isResizing.value) return;

  const container = document.querySelector('.editor-split-view') as HTMLElement;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;

  // 限制范围 20% - 80%
  splitPosition.value = Math.max(20, Math.min(80, newPosition));
  emit('split-position-change', splitPosition.value);
}

function onMouseUp() {
  isResizing.value = false;
  document.body.style.cursor = '';
}

// ==================== Lifecycle ====================
onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});
</script>

<style scoped>
.editor-split-view {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.editor-pane,
.preview-pane {
  height: 100%;
  overflow: auto;
}

.editor-pane {
  border-right: 1px solid #e0e0e0;
}

.divider {
  width: 8px;
  background-color: #f5f5f5;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.2s;
}

.divider:hover {
  background-color: #e0e0e0;
}

.divider-handle {
  width: 2px;
  height: 40px;
  background-color: #9e9e9e;
  border-radius: 1px;
}

.divider:hover .divider-handle {
  background-color: #757575;
}

/* 暗色模式 */
:deep(.v-theme--dark) .editor-pane {
  border-right-color: #424242;
}

:deep(.v-theme--dark) .divider {
  background-color: #2c2c2c;
}

:deep(.v-theme--dark) .divider:hover {
  background-color: #3a3a3a;
}

:deep(.v-theme--dark) .divider-handle {
  background-color: #616161;
}

:deep(.v-theme--dark) .divider:hover .divider-handle {
  background-color: #9e9e9e;
}
</style>
