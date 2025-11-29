<template>
  <v-card class="backlink-panel" elevation="0">
    <v-card-title class="d-flex align-center pa-3">
      <v-icon class="mr-2" color="primary">mdi-link-variant</v-icon>
      <span class="text-h6">反向引用</span>
      <v-chip v-if="!loading" size="small" class="ml-2">
        {{ backlinks.length }}
      </v-chip>
      <v-spacer />
      <v-btn icon="mdi-refresh" size="small" variant="text" @click="refresh" :loading="loading" />
    </v-card-title>

    <v-divider />

    <!-- 加载状态 -->
    <div v-if="loading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary" />
      <p class="text-caption text-grey mt-2">加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="backlinks.length === 0" class="pa-6 text-center">
      <v-icon size="64" color="grey-lighten-1">mdi-link-variant-off</v-icon>
      <p class="text-body-2 text-grey mt-3">暂无反向引用</p>
      <p class="text-caption text-grey">其他文档引用此文档时会显示在这里</p>
    </div>

    <!-- 反向引用列表 -->
    <v-list v-else density="compact" class="backlink-list">
      <v-list-item
        v-for="backlink in backlinks"
        :key="backlink.link.uuid"
        @click="navigateToSource(backlink)"
        class="backlink-item"
      >
        <template #prepend>
          <v-avatar size="32" color="primary" variant="tonal">
            <v-icon size="small">mdi-file-document</v-icon>
          </v-avatar>
        </template>

        <v-list-item-title class="text-body-2 font-weight-medium">
          {{ backlink.sourceDocument.title }}
        </v-list-item-title>

        <v-list-item-subtitle class="mt-1">
          <!-- 引用上下文 -->
          <div class="context-preview text-caption">
            {{ backlink.context }}
          </div>

          <!-- 元信息 -->
          <div class="d-flex align-center mt-1">
            <v-chip size="x-small" variant="outlined" class="mr-2">
              <v-icon start size="x-small">mdi-clock-outline</v-icon>
              {{ formatDate(backlink.sourceDocument.updatedAt) }}
            </v-chip>
            <v-chip v-if="backlink.link.isBroken" size="x-small" color="error" variant="tonal">
              断裂
            </v-chip>
          </div>
        </v-list-item-subtitle>

        <template #append>
          <v-btn
            icon="mdi-open-in-new"
            size="x-small"
            variant="text"
            @click.stop="navigateToSource(backlink)"
          />
        </template>
      </v-list-item>
    </v-list>

    <!-- 错误提示 -->
    <v-alert v-if="error" type="error" variant="tonal" class="ma-3">
      {{ error }}
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { documentApiClient } from '@/modules/document/api/DocumentApiClient';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';
import { DocumentContracts } from '@dailyuse/contracts/document';
import { useRouter } from 'vue-router';

type BacklinkDTO = DocumentContracts.BacklinkDTO;

// ==================== Props ====================
interface Props {
  documentUuid: string;
  autoLoad?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true,
});

// ==================== Emits ====================
const emit = defineEmits<{
  navigate: [sourceDocumentUuid: string];
}>();

// ==================== State ====================
const loading = ref(false);
const backlinks = ref<BacklinkDTO[]>([]);
const error = ref<string | null>(null);
const router = useRouter();

// ==================== Methods ====================
async function loadBacklinks() {
  if (!props.documentUuid) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await documentApiClient.getBacklinks(props.documentUuid);
    backlinks.value = response.backlinks || [];
  } catch (err: any) {
    console.error('Load backlinks failed:', err);
    error.value = err.message || '加载反向引用失败';
    backlinks.value = [];
  } finally {
    loading.value = false;
  }
}

function refresh() {
  loadBacklinks();
}

function navigateToSource(backlink: BacklinkDTO) {
  const sourceUuid = backlink.sourceDocument.uuid;
  emit('navigate', sourceUuid);
  
  // 可选：使用 router 导航
  // router.push(`/documents/${sourceUuid}`);
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} 周前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

// ==================== Watchers ====================
watch(() => props.documentUuid, (newUuid) => {
  if (newUuid && props.autoLoad) {
    loadBacklinks();
  }
});

// ==================== Lifecycle ====================
onMounted(() => {
  if (props.documentUuid && props.autoLoad) {
    loadBacklinks();
  }
});

// ==================== Expose ====================
defineExpose({
  refresh: loadBacklinks,
});
</script>

<style scoped>
.backlink-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
}

.backlink-list {
  flex: 1;
  overflow-y: auto;
}

.backlink-item {
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.backlink-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.context-preview {
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.4;
  margin-top: 4px;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

