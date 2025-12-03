<!--
  EditorTabBar.vue
  编辑器标签栏组件
  
  功能：
  - 显示所有打开的标签页
  - 标签页切换
  - 标签页关闭
  - 拖拽排序（可选）
-->
<template>
  <div class="editor-tab-bar">
    <v-tabs v-model="activeTabIndex" class="tabs-container" density="compact" show-arrows>
      <v-tab
        v-for="(tab, index) in tabs"
        :key="tab.uuid"
        :value="index"
        class="editor-tab"
        @click="handleTabClick(tab)"
      >
        <div class="tab-content">
          <!-- 文件类型图标 -->
          <v-icon :icon="getFileIcon(tab.fileType)" size="small" class="mr-2" />

          <!-- 标签标题 -->
          <span class="tab-title">{{ tab.title }}</span>

          <!-- 未保存标识 -->
          <v-icon
            v-if="tab.isDirty"
            icon="mdi-circle"
            size="x-small"
            class="dirty-indicator ml-1"
          />

          <!-- 关闭按钮 -->
          <v-btn
            icon="mdi-close"
            variant="plain"
            size="x-small"
            class="close-btn ml-2"
            @click.stop="handleTabClose(tab)"
          />
        </div>
      </v-tab>
    </v-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { SimpleEditorTab } from '@dailyuse/contracts/shared';

// 使用 SimpleEditorTab 作为组件的标签类型
export type EditorTab = SimpleEditorTab;

/**
 * Props
 */
interface Props {
  tabs: EditorTab[];
  activeTab?: string; // 当前激活的标签 uuid
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: undefined,
});

/**
 * Emits
 */
interface Emits {
  (e: 'tab-click', tab: EditorTab): void;
  (e: 'tab-close', tab: EditorTab): void;
  (e: 'update:activeTab', uuid: string): void;
}

const emit = defineEmits<Emits>();

/**
 * 当前激活的标签索引
 */
const activeTabIndex = computed({
  get: () => {
    if (!props.activeTab) return 0;
    return props.tabs.findIndex((tab) => tab.uuid === props.activeTab);
  },
  set: (index: number) => {
    const tab = props.tabs[index];
    if (tab) {
      emit('update:activeTab', tab.uuid);
    }
  },
});

/**
 * 处理标签点击
 */
function handleTabClick(tab: EditorTab) {
  emit('tab-click', tab);
}

/**
 * 处理标签关闭
 */
function handleTabClose(tab: EditorTab) {
  emit('tab-close', tab);
}

/**
 * 根据文件类型获取图标
 */
function getFileIcon(fileType: string): string {
  const iconMap: Record<string, string> = {
    markdown: 'mdi-language-markdown',
    image: 'mdi-image',
    video: 'mdi-video',
    audio: 'mdi-music',
  };
  return iconMap[fileType] || 'mdi-file';
}
</script>

<style scoped lang="scss">
.editor-tab-bar {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgb(var(--v-theme-surface));
}

.tabs-container {
  :deep(.v-tab) {
    min-width: 120px;
    max-width: 200px;
    text-transform: none;

    &:hover {
      background-color: rgba(var(--v-theme-on-surface), 0.05);

      .close-btn {
        opacity: 1;
      }
    }
  }
}

.tab-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 8px;
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.dirty-indicator {
  color: rgb(var(--v-theme-warning));
}

.close-btn {
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.1);
  }
}

// 激活的标签始终显示关闭按钮
:deep(.v-tab--selected) {
  .close-btn {
    opacity: 1;
  }
}
</style>
