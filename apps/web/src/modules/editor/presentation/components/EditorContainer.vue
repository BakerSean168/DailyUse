<!--
  EditorContainer.vue
  编辑器容器组件
  
  功能：
  - 多标签页管理
  - 根据文件类型渲染不同的查看器/编辑器
  - 内容自动保存
-->
<template>
  <div class="editor-container">
    <!-- 标签栏 -->
    <editor-tab-bar
      v-if="tabs.length > 0"
      :tabs="tabs"
      :active-tab="activeTabUuid"
      @tab-click="handleTabClick"
      @tab-close="handleTabClose"
      @update:active-tab="activeTabUuid = $event"
    />

    <!-- 编辑器内容区 -->
    <div class="editor-content-area">
      <template v-if="activeTab">
        <!-- Markdown 编辑器 -->
        <markdown-editor
          v-if="activeTab.fileType === 'markdown'"
          v-model="activeTab.content"
          :placeholder="`编辑 ${activeTab.title ?? '文档'}...`"
          @change="handleContentChange"
        />

        <!-- 媒体查看器 -->
        <media-viewer
          v-else
          :file-path="activeTab.filePath"
          :file-type="activeTab.fileType"
          :file-name="activeTab.title"
        />
      </template>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <v-icon icon="mdi-file-document-outline" size="64" class="mb-4" />
        <div class="text-h6 mb-2">没有打开的文件</div>
        <div class="text-caption">从左侧文件列表中选择一个文件开始编辑</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import EditorTabBar, { type EditorTab } from './EditorTabBar.vue';
import MarkdownEditor from './MarkdownEditor.vue';
import MediaViewer from './MediaViewer.vue';

/**
 * Props
 */
interface Props {
  // 可以从外部传入初始标签页
  initialTabs?: EditorTab[];
}

const props = withDefaults(defineProps<Props>(), {
  initialTabs: () => [],
});

/**
 * Emits
 */
interface Emits {
  (e: 'content-change', tab: EditorTab): void;
  (e: 'tab-close', tab: EditorTab): void;
  (e: 'save-request', tab: EditorTab): void;
}

const emit = defineEmits<Emits>();

/**
 * 标签页列表
 */
const tabs = ref<EditorTab[]>([...props.initialTabs]);

/**
 * 当前激活的标签 UUID
 */
const activeTabUuid = ref<string | undefined>(
  tabs.value.length > 0 ? tabs.value[0].uuid : undefined,
);

/**
 * 当前激活的标签
 */
const activeTab = computed(() => {
  if (!activeTabUuid.value) return null;
  return tabs.value.find((tab) => tab.uuid === activeTabUuid.value) || null;
});

/**
 * 打开文件
 */
function openFile(file: {
  uuid?: string;
  title: string;
  fileType: 'markdown' | 'image' | 'video' | 'audio';
  filePath: string;
  content?: string;
}) {
  // 检查是否已经打开
  const existingTab = tabs.value.find((tab) => tab.filePath === file.filePath);
  if (existingTab) {
    activeTabUuid.value = existingTab.uuid;
    return existingTab;
  }

  // 创建新标签页
  const newTab: EditorTab = {
    uuid: file.uuid || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: file.title,
    fileType: file.fileType,
    filePath: file.filePath,
    content: file.content || '',
    isDirty: false,
    isPinned: false,
  };

  tabs.value.push(newTab);
  activeTabUuid.value = newTab.uuid;

  return newTab;
}

/**
 * 关闭标签页
 */
function closeTab(tabUuid: string) {
  const index = tabs.value.findIndex((tab) => tab.uuid === tabUuid);
  if (index === -1) return;

  const tab = tabs.value[index];

  // 如果有未保存的更改，提示用户
  if (tab.isDirty) {
    const confirmed = confirm(`文件 "${tab.title}" 有未保存的更改，确定要关闭吗？`);
    if (!confirmed) return;
  }

  tabs.value.splice(index, 1);
  emit('tab-close', tab);

  // 如果关闭的是当前激活的标签，切换到相邻标签
  if (activeTabUuid.value === tabUuid) {
    if (tabs.value.length > 0) {
      // 优先切换到右侧标签，如果没有则切换到左侧
      const newIndex = Math.min(index, tabs.value.length - 1);
      activeTabUuid.value = tabs.value[newIndex].uuid;
    } else {
      activeTabUuid.value = undefined;
    }
  }
}

/**
 * 关闭所有标签页
 */
function closeAllTabs() {
  // 检查是否有未保存的更改
  const dirtyTabs = tabs.value.filter((tab) => tab.isDirty);
  if (dirtyTabs.length > 0) {
    const confirmed = confirm(`有 ${dirtyTabs.length} 个文件有未保存的更改，确定要全部关闭吗？`);
    if (!confirmed) return;
  }

  tabs.value = [];
  activeTabUuid.value = undefined;
}

/**
 * 处理标签点击
 */
function handleTabClick(tab: EditorTab) {
  activeTabUuid.value = tab.uuid;
}

/**
 * 处理标签关闭
 */
function handleTabClose(tab: EditorTab) {
  closeTab(tab.uuid);
}

/**
 * 处理内容变化
 */
function handleContentChange(newContent: string) {
  if (!activeTab.value) return;

  activeTab.value.content = newContent;
  activeTab.value.isDirty = true;

  emit('content-change', activeTab.value);

  // 自动保存（可选，延迟 2 秒）
  // debounceAutoSave();
}

/**
 * 保存当前文件
 */
function saveCurrentFile() {
  if (!activeTab.value) return;

  emit('save-request', activeTab.value);
  activeTab.value.isDirty = false;
}

/**
 * 保存所有文件
 */
function saveAllFiles() {
  const dirtyTabs = tabs.value.filter((tab) => tab.isDirty);
  dirtyTabs.forEach((tab) => {
    emit('save-request', tab);
    tab.isDirty = false;
  });
}

/**
 * 暴露方法供父组件调用
 */
defineExpose({
  openFile,
  closeTab,
  closeAllTabs,
  saveCurrentFile,
  saveAllFiles,
  tabs,
  activeTab,
});
</script>

<style scoped lang="scss">
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgb(var(--v-theme-surface));
}

.editor-content-area {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(var(--v-theme-on-surface), 0.6);

  .v-icon {
    color: rgba(var(--v-theme-on-surface), 0.3);
  }
}
</style>
