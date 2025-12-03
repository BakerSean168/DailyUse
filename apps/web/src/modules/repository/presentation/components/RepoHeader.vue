<template>
  <div class="repo-header">
    <!-- 左侧：视图切换按钮 -->
    <div class="header-left">
      <v-btn-toggle
        v-model="currentView"
        mandatory
        density="compact"
        @update:model-value="handleViewChange"
      >
        <v-btn value="preview" size="small">
          <v-icon size="small">mdi-book-open-page-variant</v-icon>
          <span class="ml-1">编辑预览</span>
        </v-btn>
        <v-btn value="manage" size="small">
          <v-icon size="small">mdi-view-grid</v-icon>
          <span class="ml-1">管理视图</span>
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- 右侧：搜索和操作按钮 -->
    <div class="header-right">
      <v-text-field
        v-model="searchQuery"
        density="compact"
        placeholder="搜索..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        clearable
        class="search-field"
        @update:model-value="handleSearch"
      />

      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="refreshing"
        @click="handleRefresh"
      />

      <v-menu>
        <template #activator="{ props }">
          <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
        </template>
        <v-list density="compact">
          <v-list-item @click="handleSync">
            <template #prepend>
              <v-icon>mdi-sync</v-icon>
            </template>
            <v-list-item-title>同步</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleExport">
            <template #prepend>
              <v-icon>mdi-export</v-icon>
            </template>
            <v-list-item-title>导出</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleImport">
            <template #prepend>
              <v-icon>mdi-import</v-icon>
            </template>
            <v-list-item-title>导入</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { createDebounce } from '@dailyuse/utils';
import { useMessage } from '@dailyuse/ui-vuetify';

const props = defineProps<{
  modelValue: 'preview' | 'manage';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: 'preview' | 'manage'];
  search: [query: string];
  refresh: [];
  sync: [];
  export: [];
  import: [];
}>();

const message = useMessage();

// 当前视图
const currentView = ref(props.modelValue);
const searchQuery = ref('');
const refreshing = ref(false);

// 监听父组件的变化
watch(
  () => props.modelValue,
  (newValue) => {
    currentView.value = newValue;
  },
);

// 视图切换
function handleViewChange(view: 'preview' | 'manage') {
  emit('update:modelValue', view);
}

// 搜索防抖
const { debouncedFn: handleSearch } = createDebounce((query: string) => {
  emit('search', query);
}, 300);

// 刷新
async function handleRefresh() {
  refreshing.value = true;
  try {
    emit('refresh');
    await new Promise((resolve) => setTimeout(resolve, 500));
  } finally {
    refreshing.value = false;
  }
}

// 同步
function handleSync() {
  emit('sync');
  message.info('同步功能开发中');
}

// 导出
function handleExport() {
  emit('export');
  message.info('导出功能开发中');
}

// 导入
function handleImport() {
  emit('import');
  message.info('导入功能开发中');
}
</script>

<style scoped>
.repo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgb(var(--v-theme-surface));
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-field {
  width: 250px;
}
</style>
