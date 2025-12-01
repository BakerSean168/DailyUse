<template>
  <teleport to="body">
    <transition name="obsidian-fade">
      <div
        v-if="modelValue"
        class="obsidian-dialog-overlay"
        :class="{ 'fullscreen-mode': isFullscreen, 'minimized-mode': isMinimized }"
        @click.self="handleOverlayClick"
      >
        <div
          ref="dialogRef"
          class="obsidian-dialog"
          :class="dialogClasses"
          :style="dialogStyle"
          @mousedown="handleMouseDown"
        >
          <!-- Header - Draggable Area -->
          <div
            class="obsidian-dialog-header"
            @mousedown.prevent="startDrag"
            @dblclick="toggleFullscreen"
          >
            <div class="header-left">
              <v-icon v-if="icon" size="20" class="header-icon">{{ icon }}</v-icon>
              <span class="header-title">{{ title }}</span>
            </div>
            <div class="header-actions">
              <slot name="header-actions" />
              <button
                class="header-btn"
                @click.stop="toggleMinimize"
                :title="isMinimized ? '恢复' : '最小化'"
              >
                <v-icon size="16">{{ isMinimized ? 'mdi-window-restore' : 'mdi-window-minimize' }}</v-icon>
              </button>
              <button
                class="header-btn"
                @click.stop="toggleFullscreen"
                :title="isFullscreen ? '退出全屏' : '全屏'"
              >
                <v-icon size="16">{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
              </button>
              <button
                v-if="closable"
                class="header-btn close-btn"
                @click.stop="close"
                title="关闭"
              >
                <v-icon size="16">mdi-close</v-icon>
              </button>
            </div>
          </div>

          <!-- Content - Collapsible -->
          <transition name="content-collapse">
            <div v-show="!isMinimized" class="obsidian-dialog-content">
              <slot />
            </div>
          </transition>

          <!-- Footer - Optional -->
          <transition name="content-collapse">
            <div v-if="!isMinimized && $slots.footer" class="obsidian-dialog-footer">
              <slot name="footer" />
            </div>
          </transition>

          <!-- Resize Handle -->
          <div
            v-if="resizable && !isFullscreen && !isMinimized"
            class="resize-handle"
            @mousedown.prevent="startResize"
          >
            <v-icon size="14" color="rgba(var(--v-theme-on-surface), 0.3)">mdi-resize-bottom-right</v-icon>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  icon?: string;
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  closable?: boolean;
  persistent?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  startFullscreen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  icon: '',
  width: 720,
  height: 560,
  minWidth: 360,
  minHeight: 240,
  maxWidth: undefined,
  maxHeight: undefined,
  closable: true,
  persistent: false,
  resizable: true,
  draggable: true,
  startFullscreen: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
  (e: 'fullscreen-change', isFullscreen: boolean): void;
  (e: 'minimize-change', isMinimized: boolean): void;
}>();

// State
const dialogRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(props.startFullscreen);
const isMinimized = ref(false);

// Position and Size
const position = ref({ x: 0, y: 0 });
const size = ref({
  width: typeof props.width === 'number' ? props.width : parseInt(props.width),
  height: typeof props.height === 'number' ? props.height : parseInt(props.height),
});

// Dragging State
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const positionStart = ref({ x: 0, y: 0 });

// Resizing State
const isResizing = ref(false);
const resizeStart = ref({ x: 0, y: 0 });
const sizeStart = ref({ width: 0, height: 0 });

// Computed
const dialogClasses = computed(() => ({
  'is-dragging': isDragging.value,
  'is-resizing': isResizing.value,
  'is-fullscreen': isFullscreen.value,
  'is-minimized': isMinimized.value,
}));

const dialogStyle = computed(() => {
  if (isFullscreen.value) {
    return {};
  }

  if (isMinimized.value) {
    return {
      width: `${size.value.width}px`,
      transform: `translate(${position.value.x}px, ${position.value.y}px)`,
    };
  }

  return {
    width: `${size.value.width}px`,
    height: `${size.value.height}px`,
    transform: `translate(${position.value.x}px, ${position.value.y}px)`,
  };
});

// Methods
function close() {
  emit('update:modelValue', false);
  emit('close');
}

function handleOverlayClick() {
  if (!props.persistent) {
    close();
  }
}

function handleMouseDown() {
  // Bring to front if multiple dialogs (future enhancement)
}

function toggleFullscreen() {
  if (isMinimized.value) {
    isMinimized.value = false;
  }
  isFullscreen.value = !isFullscreen.value;
  emit('fullscreen-change', isFullscreen.value);
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
  emit('minimize-change', isMinimized.value);
}

function centerDialog() {
  if (typeof window === 'undefined') return;
  
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  position.value = {
    x: (windowWidth - size.value.width) / 2,
    y: (windowHeight - size.value.height) / 2,
  };
}

// Dragging
function startDrag(e: MouseEvent) {
  if (!props.draggable || isFullscreen.value) return;

  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  positionStart.value = { ...position.value };

  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return;

  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;

  position.value = {
    x: positionStart.value.x + dx,
    y: positionStart.value.y + dy,
  };
}

function stopDrag() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
}

// Resizing
function startResize(e: MouseEvent) {
  if (!props.resizable) return;

  isResizing.value = true;
  resizeStart.value = { x: e.clientX, y: e.clientY };
  sizeStart.value = { ...size.value };

  window.addEventListener('mousemove', onResize);
  window.addEventListener('mouseup', stopResize);
}

function onResize(e: MouseEvent) {
  if (!isResizing.value) return;

  const dx = e.clientX - resizeStart.value.x;
  const dy = e.clientY - resizeStart.value.y;

  let newWidth = sizeStart.value.width + dx;
  let newHeight = sizeStart.value.height + dy;

  // Apply constraints
  newWidth = Math.max(props.minWidth, newWidth);
  newHeight = Math.max(props.minHeight, newHeight);

  if (props.maxWidth) {
    newWidth = Math.min(props.maxWidth, newWidth);
  }
  if (props.maxHeight) {
    newHeight = Math.min(props.maxHeight, newHeight);
  }

  size.value = { width: newWidth, height: newHeight };
}

function stopResize() {
  isResizing.value = false;
  window.removeEventListener('mousemove', onResize);
  window.removeEventListener('mouseup', stopResize);
}

// Keyboard
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue && props.closable && !props.persistent) {
    close();
  }
  if (e.key === 'F11' && props.modelValue) {
    e.preventDefault();
    toggleFullscreen();
  }
}

// Watchers
watch(() => props.modelValue, (visible) => {
  if (visible) {
    centerDialog();
    isMinimized.value = false;
    if (props.startFullscreen) {
      isFullscreen.value = true;
    }
  }
});

// Lifecycle
onMounted(() => {
  centerDialog();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('mousemove', onResize);
  window.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
.obsidian-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.obsidian-dialog-overlay.fullscreen-mode {
  background: transparent;
  backdrop-filter: none;
}

.obsidian-dialog-overlay.minimized-mode {
  pointer-events: none;
  background: transparent;
  backdrop-filter: none;
}

.obsidian-dialog-overlay.minimized-mode .obsidian-dialog {
  pointer-events: auto;
}

.obsidian-dialog {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.obsidian-dialog.is-dragging,
.obsidian-dialog.is-resizing {
  user-select: none;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.25),
    0 12px 32px rgba(0, 0, 0, 0.15);
}

.obsidian-dialog.is-fullscreen {
  position: fixed !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  border-radius: 0;
  transform: none !important;
}

.obsidian-dialog.is-minimized {
  height: auto !important;
}

/* Header */
.obsidian-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-primary), 0.04) 100%
  );
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: move;
  user-select: none;
}

.obsidian-dialog.is-fullscreen .obsidian-dialog-header {
  cursor: default;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header-icon {
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s ease;
}

.header-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.header-btn.close-btn:hover {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

/* Content */
.obsidian-dialog-content {
  flex: 1;
  overflow: auto;
  padding: 0;
  color: rgb(var(--v-theme-on-surface));
}

/* Scrollbar styling */
.obsidian-dialog-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.obsidian-dialog-content::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.obsidian-dialog-content::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.2);
  border-radius: 4px;
}

.obsidian-dialog-content::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.35);
}

/* Footer */
.obsidian-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.resize-handle:hover {
  opacity: 1;
}

/* Animations */
.obsidian-fade-enter-active,
.obsidian-fade-leave-active {
  transition: opacity 0.2s ease;
}

.obsidian-fade-enter-active .obsidian-dialog,
.obsidian-fade-leave-active .obsidian-dialog {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}

.obsidian-fade-enter-from,
.obsidian-fade-leave-to {
  opacity: 0;
}

.obsidian-fade-enter-from .obsidian-dialog {
  transform: scale(0.95) translateY(10px);
}

.obsidian-fade-leave-to .obsidian-dialog {
  transform: scale(0.98) translateY(5px);
}

.content-collapse-enter-active,
.content-collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.content-collapse-enter-from,
.content-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .obsidian-dialog {
    width: calc(100vw - 32px) !important;
    max-width: none !important;
    max-height: calc(100vh - 80px) !important;
  }
}
</style>
