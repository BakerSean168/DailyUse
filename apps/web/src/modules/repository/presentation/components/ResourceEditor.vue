<template>
  <v-card class="resource-editor" :loading="isLoading">
    <!-- 编辑器工具栏 -->
    <v-toolbar density="compact" color="surface">
      <v-toolbar-title v-if="resource">
        <v-icon :icon="resource.icon" size="small" class="mr-2" />
        {{ resource.name }}
      </v-toolbar-title>

      <v-spacer />

      <!-- 保存状态指示器 -->
      <v-chip
        v-if="isSaving"
        size="small"
        color="orange"
        variant="flat"
        class="mr-2"
      >
        <v-icon icon="mdi-loading" class="mr-1 rotating" size="small" />
        保存中...
      </v-chip>
      <v-chip
        v-else-if="hasUnsavedChanges"
        size="small"
        color="grey"
        variant="flat"
        class="mr-2"
      >
        <v-icon icon="mdi-circle" class="mr-1" size="small" />
        未保存
      </v-chip>
      <v-chip v-else size="small" color="success" variant="flat" class="mr-2">
        <v-icon icon="mdi-check" class="mr-1" size="small" />
        已保存
      </v-chip>

      <!-- 字数统计 -->
      <v-chip
        v-if="resource?.metadata?.wordCount"
        size="small"
        variant="text"
        class="mr-2"
      >
        {{ resource.metadata.wordCount }} 字
      </v-chip>

      <!-- 阅读时间 -->
      <v-chip
        v-if="resource?.metadata?.readingTime"
        size="small"
        variant="text"
      >
        约 {{ resource.metadata.readingTime }} 分钟
      </v-chip>
    </v-toolbar>

    <!-- Milkdown 编辑器容器 -->
    <v-card-text class="editor-container">
      <div ref="editorRef" class="milkdown-editor"></div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResourceStore } from '../stores/resourceStore';
import { useMilkdown } from '../composables/useMilkdown';

const props = defineProps<{
  resourceUuid: string;
}>();

const resourceStore = useResourceStore();

const isLoading = computed(() => resourceStore.isLoading);
const isSaving = computed(() => resourceStore.isSaving);
const resource = computed(() => resourceStore.selectedResource);
const hasUnsavedChanges = computed(() => {
  const tab = resourceStore.openTabs.find((t) => t.uuid === props.resourceUuid);
  return tab?.isDirty || false;
});

// Milkdown 编辑器
const { editorRef } = useMilkdown({
  content: resource.value?.content || '',
  onChange: (markdown) => {
    // 500ms 防抖保存 (Story 10-2 AC #5)
    resourceStore.saveContent(props.resourceUuid, markdown);
  },
});

// 监听资源变化，更新编辑器内容
watch(
  () => resource.value?.content,
  (newContent) => {
    if (newContent !== undefined) {
      // TODO: 更新 Milkdown 编辑器内容
    }
  }
);
</script>

<style scoped>
.resource-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.milkdown-editor {
  min-height: 500px;
  max-width: 900px;
  margin: 0 auto;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
