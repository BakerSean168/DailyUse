<!--
  LinkPreviewPopover - 链接预览弹出层
  
  鼠标悬停在 [[link]] 或 ![[embed]] 时显示内容预览
-->

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible && content"
        class="link-preview-popover"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- 预览头部 -->
        <div class="preview-header">
          <v-icon :icon="previewIcon" size="16" class="mr-1" />
          <span class="preview-title">{{ displayTitle }}</span>
        </div>

        <!-- 预览内容 -->
        <div class="preview-body">
          <!-- 图片预览 -->
          <img
            v-if="contentType === 'image'"
            :src="content.url"
            :alt="content.name"
            class="preview-image"
            @error="handleImageError"
          />

          <!-- 笔记预览 -->
          <div v-else-if="contentType === 'markdown'" class="preview-markdown">
            <div v-if="content.excerpt" class="preview-excerpt" v-html="renderedExcerpt"></div>
            <div v-else class="preview-empty">
              <v-icon icon="mdi-file-document-outline" size="24" class="text-disabled" />
              <span class="text-caption text-disabled">空笔记</span>
            </div>
          </div>

          <!-- 其他媒体类型 -->
          <div v-else class="preview-other">
            <v-icon :icon="previewIcon" size="32" class="text-disabled mb-2" />
            <span class="preview-name">{{ content.name }}</span>
            <span v-if="content.size" class="preview-size">{{ formatSize(content.size) }}</span>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="preview-footer">
          <v-btn size="x-small" variant="text" @click.stop="handleOpen">
            打开
          </v-btn>
          <v-btn size="x-small" variant="text" @click.stop="handleCopyLink">
            复制链接
          </v-btn>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';

// Props
interface Props {
  /** 是否可见 */
  visible: boolean;
  /** 预览内容 */
  content: PreviewContent | null;
  /** 显示位置 */
  position: { x: number; y: number };
}

interface PreviewContent {
  type: 'markdown' | 'image' | 'audio' | 'video' | 'pdf' | 'other';
  name: string;
  url?: string;
  excerpt?: string;
  size?: number;
  uuid?: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'open', content: PreviewContent): void;
  (e: 'copy-link', content: PreviewContent): void;
}>();

// State
const isHovering = ref(false);
const imageError = ref(false);

// Computed
const contentType = computed(() => props.content?.type || 'other');

const previewIcon = computed(() => {
  const iconMap: Record<string, string> = {
    markdown: 'mdi-file-document-outline',
    image: 'mdi-image-outline',
    audio: 'mdi-music-note',
    video: 'mdi-video-outline',
    pdf: 'mdi-file-pdf-box',
    other: 'mdi-file-outline',
  };
  return iconMap[contentType.value] || 'mdi-file-outline';
});

const displayTitle = computed(() => {
  const name = props.content?.name || '';
  // 移除扩展名
  return name.replace(/\.[^/.]+$/, '');
});

const renderedExcerpt = computed(() => {
  if (!props.content?.excerpt) return '';
  try {
    // 只渲染前 500 字符，避免预览过长
    const excerpt = props.content.excerpt.slice(0, 500);
    return marked(excerpt);
  } catch {
    return props.content.excerpt;
  }
});

// Methods
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function handleMouseEnter() {
  isHovering.value = true;
}

function handleMouseLeave() {
  isHovering.value = false;
  // 延迟关闭，允许用户移动到弹出层
  setTimeout(() => {
    if (!isHovering.value) {
      emit('update:visible', false);
    }
  }, 100);
}

function handleImageError() {
  imageError.value = true;
}

function handleOpen() {
  if (props.content) {
    emit('open', props.content);
    emit('update:visible', false);
  }
}

function handleCopyLink() {
  if (props.content) {
    emit('copy-link', props.content);
  }
}
</script>

<style scoped>
.link-preview-popover {
  position: fixed;
  z-index: 9999;
  width: 320px;
  max-height: 400px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.preview-title {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
  max-height: 280px;
}

/* 图片预览 */
.preview-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
}

/* Markdown 预览 */
.preview-markdown {
  font-size: 13px;
  line-height: 1.6;
}

.preview-excerpt {
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.preview-excerpt :deep(h1),
.preview-excerpt :deep(h2),
.preview-excerpt :deep(h3) {
  font-size: 1.1em;
  margin: 8px 0;
}

.preview-excerpt :deep(p) {
  margin: 8px 0;
}

.preview-excerpt :deep(code) {
  font-size: 0.85em;
  background: rgba(var(--v-theme-on-surface), 0.05);
  padding: 2px 4px;
  border-radius: 3px;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

/* 其他类型预览 */
.preview-other {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  text-align: center;
}

.preview-name {
  font-size: 13px;
  word-break: break-all;
}

.preview-size {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-top: 4px;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
  gap: 4px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
