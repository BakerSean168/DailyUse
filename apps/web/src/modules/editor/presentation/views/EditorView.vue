<!--
  EditorView - Markdown Editor Integration View
  
  Presentation Layer - View
  集成所有编辑器组件的完整示例视图
-->
<template>
  <v-container fluid class="editor-view pa-0">
    <v-card class="editor-card" elevation="0">
      <!-- 工具栏 -->
      <EditorToolbar
        :view-mode="viewMode"
        :is-saving="isSaving"
        :save-status="saveStatus"
        @insert-text="handleInsertText"
        @wrap-selection="handleWrapSelection"
        @view-mode-change="handleViewModeChange"
        @save="handleSave"
      />

      <!-- 分屏布局 -->
      <EditorSplitView
        :view-mode="viewMode"
        :initial-split-position="50"
        @split-position-change="handleSplitPositionChange"
      >
        <!-- 编辑器插槽 -->
        <template #editor>
          <div class="editor-container">
            <MarkdownEditor
              v-model="content"
              :dark-mode="isDarkMode"
              @update:model-value="handleContentChange"
              @editor-ready="handleEditorReady"
            />
          </div>
        </template>

        <!-- 预览插槽 -->
        <template #preview>
          <div class="preview-container">
            <EditorPreview :content="content" :dark-mode="isDarkMode" />
          </div>
        </template>
      </EditorSplitView>

      <!-- 状态栏 -->
      <v-divider />
      <div class="status-bar">
        <div class="status-left">
          <v-chip size="x-small" variant="text">
            字数: {{ wordCount }}
          </v-chip>
          <v-chip size="x-small" variant="text">
            字符: {{ characterCount }}
          </v-chip>
          <v-chip size="x-small" variant="text">
            行数: {{ lineCount }}
          </v-chip>
        </div>
        <div class="status-right">
          <v-chip v-if="hasUnsavedChanges" size="x-small" color="warning" variant="text">
            未保存
          </v-chip>
          <v-chip v-if="lastSaved" size="x-small" variant="text">
            上次保存: {{ formatLastSaved }}
          </v-chip>
          <v-chip v-if="autoSaveEnabled" size="x-small" color="success" variant="text">
            自动保存已启用
          </v-chip>
        </div>
      </div>
    </v-card>

    <!-- 冲突提示对话框 -->
    <v-dialog v-model="showConflictDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">编辑冲突</v-card-title>
        <v-card-text>
          检测到其他用户正在编辑此文档，您的更改可能会覆盖他们的内容。请刷新页面查看最新版本。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showConflictDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="handleRefresh">刷新页面</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTheme } from 'vuetify';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import EditorToolbar from '../components/EditorToolbar.vue';
import EditorPreview from '../components/EditorPreview.vue';
import EditorSplitView from '../components/EditorSplitView.vue';
import { useMarkdownEditor } from '../composables/useMarkdownEditor';
import { useAutoSave } from '../composables/useAutoSave';

// ==================== Props ====================
interface Props {
  /** 文档 UUID（用于保存） */
  documentUuid?: string;
  /** 初始内容 */
  initialContent?: string;
}

const props = withDefaults(defineProps<Props>(), {
  documentUuid: '',
  initialContent: '',
});

// ==================== Emits ====================
const emit = defineEmits<{
  'save': [content: string];
  'content-change': [content: string];
}>();

// ==================== Composables ====================
const theme = useTheme();
const {
  content,
  hasUnsavedChanges,
  editorViewRef,
  wordCount,
  characterCount,
  lineCount,
  setEditorView,
  updateContent,
  insertText,
  wrapSelection,
  resetUnsavedChanges,
} = useMarkdownEditor(props.initialContent);

const {
  isSaving,
  lastSaved,
  saveStatus,
  autoSaveEnabled,
  saveError,
  save,
  startAutoSave,
  stopAutoSave,
} = useAutoSave({
  interval: 30000, // 30 秒自动保存
  saveFn: async (content: string) => {
    emit('save', content);
    // 模拟保存逻辑，实际应调用 API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, conflict: false };
  },
  content: () => content.value,
  hasChanges: () => hasUnsavedChanges.value,
});

// ==================== State ====================
const viewMode = ref<'edit' | 'preview' | 'split'>('split');
const showConflictDialog = ref(false);

// ==================== Computed ====================
const isDarkMode = computed(() => theme.global.current.value.dark);

const formatLastSaved = computed(() => {
  if (!lastSaved.value) return '';
  const now = new Date();
  const diff = now.getTime() - lastSaved.value.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  return `${hours}小时前`;
});

// ==================== Methods ====================
function handleEditorReady(view: any) {
  setEditorView(view);
}

function handleContentChange(newContent: string) {
  updateContent(newContent);
  emit('content-change', newContent);
}

function handleInsertText(text: string) {
  insertText(text);
}

function handleWrapSelection(prefix: string, suffix: string) {
  wrapSelection(prefix, suffix);
}

function handleViewModeChange(mode: 'edit' | 'preview' | 'split') {
  viewMode.value = mode;
}

function handleSplitPositionChange(position: number) {
  console.log('Split position changed:', position);
}

async function handleSave() {
  const success = await save();
  if (success) {
    resetUnsavedChanges();
  }
}

function handleRefresh() {
  window.location.reload();
}

// ==================== Watchers ====================
watch(saveStatus, (status) => {
  if (status === 'conflict') {
    showConflictDialog.value = true;
  }
});

// ==================== Lifecycle ====================
// 启动自动保存
startAutoSave();
</script>

<style scoped>
.editor-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container,
.preview-container {
  height: calc(100vh - 120px); /* 减去工具栏和状态栏高度 */
  overflow: auto;
  padding: 16px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  background-color: #f5f5f5;
  min-height: 32px;
}

.status-left,
.status-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 暗色模式 */
:deep(.v-theme--dark) .status-bar {
  background-color: #1e1e1e;
}
</style>
