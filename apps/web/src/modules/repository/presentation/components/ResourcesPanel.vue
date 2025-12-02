<!--
  ResourcesPanel - 资源管理面板
  
  显示仓储中的所有非笔记资源（图片、音频、视频等）
  支持类型过滤和网格/列表视图切换
-->

<template>
  <div class="resources-panel">
    <!-- 顶部工具栏 -->
    <div class="resources-toolbar">
      <!-- 搜索框 -->
      <v-text-field
        v-model="searchQuery"
        density="compact"
        variant="outlined"
        placeholder="搜索资源..."
        hide-details
        single-line
        class="search-input"
        :prepend-inner-icon="searchQuery ? undefined : 'mdi-magnify'"
        clearable
      />

      <!-- 类型过滤 -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            size="small"
            variant="text"
            density="compact"
          >
            <v-icon size="18">mdi-filter-outline</v-icon>
            <v-tooltip activator="parent" location="bottom">类型过滤</v-tooltip>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="type in resourceTypeOptions"
            :key="type.value"
            @click="toggleTypeFilter(type.value)"
          >
            <template #prepend>
              <v-checkbox-btn
                :model-value="isTypeFiltered(type.value)"
                density="compact"
              />
            </template>
            <v-list-item-title>
              <v-icon :icon="type.icon" size="small" class="mr-2" />
              {{ type.label }}
            </v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item @click="clearFilter">
            <v-list-item-title class="text-caption">清除过滤</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- 视图切换 - 单按钮切换 -->
      <v-btn
        size="small"
        variant="text"
        density="compact"
        @click="toggleDisplayMode"
      >
        <v-icon size="18">{{ displayMode === 'grid' ? 'mdi-view-list-outline' : 'mdi-view-grid-outline' }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ displayMode === 'grid' ? '列表视图' : '网格视图' }}
        </v-tooltip>
      </v-btn>

      <v-spacer />

      <!-- 上传按钮 -->
      <v-btn
        size="small"
        variant="text"
        density="compact"
        @click="handleUpload"
      >
        <v-icon size="18">mdi-upload-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">上传资源</v-tooltip>
      </v-btn>

      <!-- 刷新 -->
      <v-btn
        size="small"
        variant="text"
        density="compact"
        :loading="isLoading"
        @click="handleRefresh"
      >
        <v-icon size="18">mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="bottom">刷新</v-tooltip>
      </v-btn>
    </div>

    <!-- 空状态 -->
    <div v-if="!repositoryUuid" class="resources-empty">
      <v-icon icon="mdi-folder-off-outline" size="48" class="mb-2 text-disabled" />
      <span class="text-caption text-disabled">请先选择仓储</span>
    </div>

    <!-- 加载中 -->
    <div v-else-if="isLoading && filteredResources.length === 0" class="resources-loading">
      <v-progress-circular indeterminate size="32" />
    </div>

    <!-- 无资源 -->
    <div v-else-if="filteredResources.length === 0" class="resources-empty">
      <v-icon icon="mdi-image-off-outline" size="48" class="mb-2 text-disabled" />
      <span class="text-body-2 text-disabled">暂无资源文件</span>
      <span class="text-caption text-disabled mt-1">上传图片、音频、视频等文件</span>
      <v-btn
        variant="tonal"
        color="primary"
        size="small"
        class="mt-3"
        @click="handleUpload"
      >
        <v-icon icon="mdi-upload" class="mr-1" />
        上传资源
      </v-btn>
    </div>

    <!-- 资源网格/列表 -->
    <div v-else class="resources-content" :class="{ 'grid-view': displayMode === 'grid' }">
      <!-- 网格视图 -->
      <template v-if="displayMode === 'grid'">
        <div
          v-for="resource in filteredResources"
          :key="resource.uuid"
          class="resource-card"
          @click="handleResourceClick(resource)"
          @contextmenu.prevent="handleContextMenu($event, resource)"
        >
          <!-- 预览图 -->
          <div class="resource-preview">
            <v-icon
              v-if="resource.type !== 'IMAGE'"
              :icon="getResourceIcon(resource.type)"
              size="32"
              class="text-disabled"
            />
            <img
              v-else
              :src="getResourcePreviewUrl(resource)"
              :alt="resource.name"
              class="preview-image"
            />
          </div>
          <!-- 名称 -->
          <div class="resource-name text-truncate">
            {{ resource.name }}
          </div>
          <!-- 类型标签 -->
          <v-chip
            size="x-small"
            :color="getResourceColor(resource.type)"
            variant="tonal"
            class="resource-type-chip"
          >
            {{ getResourceTypeLabel(resource.type) }}
          </v-chip>
        </div>
      </template>

      <!-- 列表视图 -->
      <template v-else>
        <v-list density="compact">
          <v-list-item
            v-for="resource in filteredResources"
            :key="resource.uuid"
            @click="handleResourceClick(resource)"
            @contextmenu.prevent="handleContextMenu($event, resource)"
          >
            <template #prepend>
              <v-avatar size="32" rounded="sm" :color="getResourceColor(resource.type)">
                <v-icon
                  v-if="resource.type !== 'IMAGE'"
                  :icon="getResourceIcon(resource.type)"
                  size="18"
                  color="white"
                />
                <img
                  v-else
                  :src="getResourcePreviewUrl(resource)"
                  :alt="resource.name"
                  class="list-preview-image"
                />
              </v-avatar>
            </template>
            <v-list-item-title>{{ resource.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatFileSize(resource.size) }} · {{ formatDate(resource.updatedAt) }}
            </v-list-item-subtitle>
            <template #append>
              <v-chip
                size="x-small"
                :color="getResourceColor(resource.type)"
                variant="tonal"
              >
                {{ getResourceTypeLabel(resource.type) }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </div>

    <!-- 右键菜单 -->
    <DuContextMenu
      v-model:show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
    />

    <!-- 上传对话框 -->
    <v-dialog v-model="showUploadDialog" max-width="500">
      <v-card>
        <v-card-title>上传资源</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="uploadFiles"
            label="选择文件"
            multiple
            show-size
            accept="image/*,audio/*,video/*,.pdf"
            prepend-icon="mdi-paperclip"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showUploadDialog = false">取消</v-btn>
          <v-btn
            color="primary"
            :loading="isUploading"
            :disabled="!uploadFiles?.length"
            @click="handleUploadSubmit"
          >
            上传
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 资源预览对话框 -->
    <v-dialog v-model="showPreviewDialog" max-width="800">
      <v-card v-if="previewResource">
        <v-card-title class="d-flex align-center">
          <v-icon :icon="getResourceIcon(previewResource.type)" class="mr-2" />
          {{ previewResource.name }}
          <v-spacer />
          <v-btn icon size="small" variant="text" @click="showPreviewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <!-- 图片预览 -->
          <img
            v-if="previewResource.type === 'IMAGE'"
            :src="getResourcePreviewUrl(previewResource)"
            :alt="previewResource.name"
            class="preview-dialog-image"
          />
          <!-- 音频预览 -->
          <audio
            v-else-if="previewResource.type === 'AUDIO'"
            :src="getResourcePreviewUrl(previewResource)"
            controls
            class="preview-dialog-audio"
          />
          <!-- 视频预览 -->
          <video
            v-else-if="previewResource.type === 'VIDEO'"
            :src="getResourcePreviewUrl(previewResource)"
            controls
            class="preview-dialog-video"
          />
          <!-- 其他类型 -->
          <div v-else class="preview-dialog-other">
            <v-icon :icon="getResourceIcon(previewResource.type)" size="64" class="mb-4" />
            <p>无法预览此类型文件</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="handleCopyResourceLink">
            <v-icon class="mr-1">mdi-link</v-icon>
            复制链接
          </v-btn>
          <v-btn variant="text" @click="handleInsertToEditor">
            <v-icon class="mr-1">mdi-file-document-plus-outline</v-icon>
            插入到笔记
          </v-btn>
          <v-spacer />
          <v-btn color="error" variant="text" @click="handleDeleteResource">
            <v-icon class="mr-1">mdi-delete-outline</v-icon>
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ResourceType } from '@dailyuse/contracts/repository';
import { useResourceStore } from '../stores/resourceStore';
import { useRepositoryViewStore } from '../stores/repositoryViewStore';
import { uploadResources, generateEmbedSyntax, getFileType } from '../../application/services/ResourceUploadService';
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';

// Props
interface Props {
  repositoryUuid: string | null;
}

const props = defineProps<Props>();

// Stores
const resourceStore = useResourceStore();
const viewStore = useRepositoryViewStore();

// State
const displayMode = ref<'grid' | 'list'>('grid');
const showUploadDialog = ref(false);
const showPreviewDialog = ref(false);
const uploadFiles = ref<File[]>([]);
const isUploading = ref(false);
const previewResource = ref<any>(null);
const searchQuery = ref('');

// 切换显示模式
function toggleDisplayMode() {
  displayMode.value = displayMode.value === 'grid' ? 'list' : 'grid';
}

// Context Menu
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  currentResource: null as any,
});

// Resource Types Options
const resourceTypeOptions = [
  { value: ResourceType.IMAGE, label: '图片', icon: 'mdi-image-outline' },
  { value: ResourceType.VIDEO, label: '视频', icon: 'mdi-video-outline' },
  { value: ResourceType.AUDIO, label: '音频', icon: 'mdi-music-note' },
  { value: ResourceType.PDF, label: 'PDF', icon: 'mdi-file-pdf-box' },
  { value: ResourceType.LINK, label: '链接', icon: 'mdi-link-variant' },
  { value: ResourceType.CODE, label: '代码', icon: 'mdi-code-braces' },
  { value: ResourceType.OTHER, label: '其他', icon: 'mdi-file-outline' },
];

// Computed
const isLoading = computed(() => resourceStore.isLoading);

const filteredResources = computed(() => {
  if (!props.repositoryUuid) return [];
  
  const allResources = resourceStore.resources.filter(
    (r: any) => r.repositoryUuid === props.repositoryUuid
  );
  
  // 过滤掉笔记类型
  let resources = allResources.filter((r: any) => r.type !== ResourceType.MARKDOWN);
  
  // 应用类型过滤器
  const filterTypes = viewStore.resourceFilter.types;
  if (filterTypes.length > 0) {
    resources = resources.filter((r: any) => filterTypes.includes(r.type));
  }
  
  // 应用搜索过滤
  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    resources = resources.filter((r: any) => 
      r.name.toLowerCase().includes(query) ||
      r.path?.toLowerCase().includes(query)
    );
  }
  
  return resources;
});

// Methods
function isTypeFiltered(type: ResourceType): boolean {
  return viewStore.resourceFilter.types.includes(type);
}

function toggleTypeFilter(type: ResourceType) {
  if (isTypeFiltered(type)) {
    viewStore.removeResourceTypeFilter(type);
  } else {
    viewStore.addResourceTypeFilter(type);
  }
}

function clearFilter() {
  viewStore.clearResourceTypeFilter();
}

function getResourceIcon(type: string): string {
  const iconMap: Record<string, string> = {
    IMAGE: 'mdi-image-outline',
    VIDEO: 'mdi-video-outline',
    AUDIO: 'mdi-music-note',
    PDF: 'mdi-file-pdf-box',
    LINK: 'mdi-link-variant',
    CODE: 'mdi-code-braces',
    OTHER: 'mdi-file-outline',
  };
  return iconMap[type] || 'mdi-file-outline';
}

function getResourceColor(type: string): string {
  const colorMap: Record<string, string> = {
    IMAGE: 'blue',
    VIDEO: 'purple',
    AUDIO: 'orange',
    PDF: 'red',
    LINK: 'teal',
    CODE: 'green',
    OTHER: 'grey',
  };
  return colorMap[type] || 'grey';
}

function getResourceTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    IMAGE: '图片',
    VIDEO: '视频',
    AUDIO: '音频',
    PDF: 'PDF',
    LINK: '链接',
    CODE: '代码',
    OTHER: '其他',
  };
  return labelMap[type] || '未知';
}

function getResourcePreviewUrl(resource: any): string {
  // TODO: 实现实际的资源 URL 获取
  return resource.path || `/api/resources/${resource.uuid}/content`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function handleResourceClick(resource: any) {
  previewResource.value = resource;
  showPreviewDialog.value = true;
}

function handleContextMenu(event: MouseEvent, resource: any) {
  contextMenu.currentResource = resource;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  
  contextMenu.items = [
    {
      title: '预览',
      icon: 'mdi-eye-outline',
      action: () => handleResourceClick(resource),
    },
    {
      title: '复制链接',
      icon: 'mdi-link',
      action: () => handleCopyResourceLink(),
    },
    {
      title: '插入到笔记',
      icon: 'mdi-file-document-plus-outline',
      action: () => handleInsertToEditor(),
    },
    { divider: true },
    {
      title: '重命名',
      icon: 'mdi-pencil-outline',
      action: () => handleRenameResource(resource),
    },
    {
      title: '删除',
      icon: 'mdi-delete-outline',
      danger: true,
      action: () => handleDeleteResource(),
    },
  ];
  
  contextMenu.show = true;
}

function handleUpload() {
  showUploadDialog.value = true;
  uploadFiles.value = [];
}

async function handleUploadSubmit() {
  if (!uploadFiles.value?.length || !props.repositoryUuid) return;
  
  isUploading.value = true;
  try {
    const results = await uploadResources(
      uploadFiles.value,
      props.repositoryUuid,
      undefined, // folderPath
      (progress, currentFile) => {
        console.log(`📤 上传进度: ${progress}% - ${currentFile}`);
      }
    );
    
    console.log('✅ 上传完成:', results);
    showUploadDialog.value = false;
    
    // 刷新资源列表
    await handleRefresh();
  } catch (error) {
    console.error('上传失败:', error);
    alert('上传失败，请重试');
  } finally {
    isUploading.value = false;
  }
}

async function handleRefresh() {
  if (props.repositoryUuid) {
    await resourceStore.loadResources(props.repositoryUuid);
  }
}

function handleCopyResourceLink() {
  if (!previewResource.value && !contextMenu.currentResource) return;
  
  const resource = previewResource.value || contextMenu.currentResource;
  const link = `![[${resource.name}]]`;
  navigator.clipboard.writeText(link);
}

function handleInsertToEditor() {
  if (!previewResource.value && !contextMenu.currentResource) return;
  
  const resource = previewResource.value || contextMenu.currentResource;
  // TODO: 实现插入到当前活动编辑器的逻辑
  console.log('插入到编辑器:', resource.name);
  showPreviewDialog.value = false;
}

function handleRenameResource(resource: any) {
  const newName = prompt('请输入新名称:', resource.name);
  if (newName && newName !== resource.name) {
    // TODO: 实现重命名 API
    console.log('重命名资源:', resource.uuid, newName);
  }
}

async function handleDeleteResource() {
  const resource = previewResource.value || contextMenu.currentResource;
  if (!resource) return;
  
  if (!confirm(`确定要删除 "${resource.name}" 吗？`)) return;
  
  try {
    await resourceStore.deleteResource(resource.uuid);
    showPreviewDialog.value = false;
  } catch (error) {
    console.error('删除失败:', error);
  }
}

// Expose refresh
defineExpose({
  refresh: handleRefresh,
});
</script>

<style scoped>
.resources-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.resources-toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 4px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  flex-shrink: 0;
  min-height: 36px;
  overflow: visible;
}

.search-input {
  max-width: 180px;
  flex-shrink: 0;
}

.search-input :deep(.v-field) {
  font-size: 13px;
}

.search-input :deep(.v-field__input) {
  padding-top: 4px;
  padding-bottom: 4px;
  min-height: 28px;
}

.resources-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}

.resources-content.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  align-content: start;
}

.resources-empty,
.resources-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  flex: 1;
}

/* 网格视图卡片 */
.resource-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  position: relative;
}

.resource-card:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
}

.resource-preview {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resource-name {
  font-size: 12px;
  max-width: 100%;
  text-align: center;
}

.resource-type-chip {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px !important;
}

/* 列表视图 */
.list-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 预览对话框 */
.preview-dialog-image {
  width: 100%;
  max-height: 60vh;
  object-fit: contain;
}

.preview-dialog-audio {
  width: 100%;
  padding: 24px;
}

.preview-dialog-video {
  width: 100%;
  max-height: 60vh;
}

.preview-dialog-other {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
</style>
