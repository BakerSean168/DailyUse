<!--
  RepositorySettings - 仓储设置组件
  
  配置仓储相关的设置：
  - 图片嵌入模式（链接/Base64/自动）
  - 图片压缩选项
  - 资源管理偏好
-->

<template>
  <v-card flat>
    <v-card-text class="pa-0">
      <!-- 图片嵌入设置 -->
      <div class="setting-section">
        <div class="setting-header">
          <v-icon icon="mdi-image-outline" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">图片嵌入</span>
        </div>
        
        <div class="setting-content">
          <!-- 嵌入模式 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">嵌入模式</div>
              <div class="setting-item-description">
                设置在笔记中插入图片时的默认处理方式
              </div>
            </div>
            <v-select
              v-model="imageEmbedMode"
              :items="embedModeOptions"
              item-title="label"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              class="setting-select"
            />
          </div>

          <!-- 自动嵌入阈值 -->
          <div v-if="imageEmbedMode === 'auto'" class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">自动嵌入阈值</div>
              <div class="setting-item-description">
                小于此大小的图片将自动转换为 Base64 嵌入
              </div>
            </div>
            <v-text-field
              v-model.number="autoEmbedThreshold"
              type="number"
              suffix="KB"
              density="compact"
              variant="outlined"
              hide-details
              class="setting-input-small"
              @blur="handleAutoEmbedThresholdChange"
            />
          </div>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- 图片压缩设置 -->
      <div class="setting-section">
        <div class="setting-header">
          <v-icon icon="mdi-image-size-select-large" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">图片压缩</span>
        </div>
        
        <div class="setting-content">
          <!-- 启用压缩 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">启用图片压缩</div>
              <div class="setting-item-description">
                在嵌入或上传图片时自动压缩以减小文件大小
              </div>
            </div>
            <v-switch
              v-model="imageCompression"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="handleCompressionChange"
            />
          </div>

          <!-- 压缩质量 -->
          <div v-if="imageCompression" class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">压缩质量</div>
              <div class="setting-item-description">
                较低的值会产生更小的文件，但图片质量会下降
              </div>
            </div>
            <div class="d-flex align-center" style="width: 200px;">
              <v-slider
                v-model="compressionQuality"
                :min="10"
                :max="100"
                :step="5"
                thumb-label
                hide-details
                density="compact"
                @update:model-value="handleQualityChange"
              />
              <span class="text-caption ml-2" style="min-width: 40px;">{{ compressionQuality }}%</span>
            </div>
          </div>

          <!-- 自动转换 WebP -->
          <div v-if="imageCompression" class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">自动转换为 WebP</div>
              <div class="setting-item-description">
                WebP 格式通常比 PNG/JPEG 更小，且支持透明度
              </div>
            </div>
            <v-switch
              v-model="autoConvertToWebP"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="handleWebPChange"
            />
          </div>

          <!-- 最大宽度 -->
          <div v-if="imageCompression" class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">最大图片宽度</div>
              <div class="setting-item-description">
                超过此宽度的图片将自动缩放
              </div>
            </div>
            <v-select
              v-model="maxImageWidth"
              :items="maxWidthOptions"
              item-title="label"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              class="setting-select"
              @update:model-value="handleMaxWidthChange"
            />
          </div>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- 资源管理设置 -->
      <div class="setting-section">
        <div class="setting-header">
          <v-icon icon="mdi-folder-cog-outline" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">资源管理</span>
        </div>
        
        <div class="setting-content">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            资源（图片、音频、视频等）存储在仓储的 <code>assets/</code> 目录下
          </v-alert>

          <!-- 默认视图模式 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">默认视图模式</div>
              <div class="setting-item-description">
                打开仓储时的默认显示模式
              </div>
            </div>
            <v-btn-toggle
              v-model="defaultViewMode"
              mandatory
              density="compact"
              variant="outlined"
              divided
              @update:model-value="handleViewModeChange"
            >
              <v-btn value="notes" size="small">
                <v-icon size="16" class="mr-1">mdi-note-text-outline</v-icon>
                笔记
              </v-btn>
              <v-btn value="resources" size="small">
                <v-icon size="16" class="mr-1">mdi-image-multiple-outline</v-icon>
                资源
              </v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRepositoryViewStore, type ImageEmbedMode, type ViewMode } from '@/modules/repository/presentation/stores/repositoryViewStore';

// Props
interface Props {
  autoSave?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoSave: true,
});

// Store
const viewStore = useRepositoryViewStore();

// Local state (synced with store)
const imageEmbedMode = ref<ImageEmbedMode>('link');
const imageCompression = ref(false);
const compressionQuality = ref(80);
const autoConvertToWebP = ref(false);
const maxImageWidth = ref(1920);
const autoEmbedThreshold = ref(100);
const defaultViewMode = ref<ViewMode>('notes');

// Options
const embedModeOptions = [
  { value: 'link', label: '链接引用 (推荐)' },
  { value: 'base64', label: 'Base64 嵌入' },
  { value: 'auto', label: '自动 (小图片嵌入)' },
];

const maxWidthOptions = [
  { value: 800, label: '800px (小)' },
  { value: 1280, label: '1280px (中)' },
  { value: 1920, label: '1920px (大)' },
  { value: 2560, label: '2560px (超大)' },
  { value: 0, label: '不限制' },
];

// Computed
const settings = computed(() => viewStore.repositorySettings);

// Methods
function syncFromStore() {
  imageEmbedMode.value = settings.value.imageEmbedMode;
  imageCompression.value = settings.value.imageCompression;
  compressionQuality.value = settings.value.compressionQuality;
  autoConvertToWebP.value = settings.value.autoConvertToWebP;
  maxImageWidth.value = settings.value.maxImageWidth;
  autoEmbedThreshold.value = settings.value.autoEmbedThreshold;
  defaultViewMode.value = viewStore.viewMode;
}

function handleAutoEmbedThresholdChange() {
  if (props.autoSave) {
    viewStore.updateRepositorySettings({
      autoEmbedThreshold: autoEmbedThreshold.value,
    });
  }
}

function handleCompressionChange(value: boolean | null) {
  const enabled = value ?? false;
  imageCompression.value = enabled;
  if (props.autoSave) {
    viewStore.updateRepositorySettings({
      imageCompression: enabled,
    });
  }
}

function handleQualityChange(value: number) {
  if (props.autoSave) {
    viewStore.updateRepositorySettings({
      compressionQuality: value,
    });
  }
}

function handleWebPChange(value: boolean | null) {
  if (props.autoSave) {
    viewStore.updateRepositorySettings({
      autoConvertToWebP: value ?? false,
    });
  }
}

function handleMaxWidthChange(value: number) {
  if (props.autoSave) {
    viewStore.updateRepositorySettings({
      maxImageWidth: value,
    });
  }
}

function handleViewModeChange(value: ViewMode) {
  // 这里只是设置默认视图模式
  // 实际切换由 RepositoryView 中的 Tab 控制
}

// Watch embed mode changes
function handleEmbedModeChange() {
  if (props.autoSave) {
    viewStore.updateRepositorySettings({
      imageEmbedMode: imageEmbedMode.value,
    });
  }
}

// Lifecycle
onMounted(() => {
  syncFromStore();
});
</script>

<style scoped>
.setting-section {
  padding: 16px;
}

.setting-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.setting-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-item-info {
  flex: 1;
  min-width: 0;
}

.setting-item-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.setting-item-description {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.setting-select {
  max-width: 200px;
}

.setting-input-small {
  max-width: 120px;
}

code {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
