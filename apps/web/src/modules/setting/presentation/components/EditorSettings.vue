<!--
  EditorSettings - 编辑器设置组件
  
  配置编辑器相关的设置：
  - 默认模式（阅读/编辑）
  - 自动保存
  - 媒体嵌入支持
  - 字体和显示选项
-->

<template>
  <v-card flat>
    <v-card-text class="pa-0">
      <!-- 编辑模式设置 -->
      <div class="setting-section">
        <div class="setting-header">
          <v-icon icon="mdi-pencil-outline" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">编辑模式</span>
        </div>
        
        <div class="setting-content">
          <!-- 默认模式 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">默认打开模式</div>
              <div class="setting-item-description">
                打开笔记时的默认显示模式
              </div>
            </div>
            <v-btn-toggle
              v-model="defaultMode"
              mandatory
              density="compact"
              variant="outlined"
              divided
              @update:model-value="handleDefaultModeChange"
            >
              <v-btn value="reading" size="small">
                <v-icon size="16" class="mr-1">mdi-book-open-variant</v-icon>
                阅读
              </v-btn>
              <v-btn value="editing" size="small">
                <v-icon size="16" class="mr-1">mdi-pencil</v-icon>
                编辑
              </v-btn>
            </v-btn-toggle>
          </div>

          <!-- 自动保存延迟 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">自动保存延迟</div>
              <div class="setting-item-description">
                停止输入后多久自动保存内容
              </div>
            </div>
            <v-select
              v-model="autoSaveDelay"
              :items="autoSaveDelayOptions"
              item-title="label"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              class="setting-select"
              @update:model-value="handleAutoSaveDelayChange"
            />
          </div>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- 媒体嵌入设置 -->
      <div class="setting-section">
        <div class="setting-header">
          <v-icon icon="mdi-multimedia" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">媒体嵌入</span>
        </div>
        
        <div class="setting-content">
          <!-- 启用链接预览 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">链接悬浮预览</div>
              <div class="setting-item-description">
                鼠标悬停在链接上时显示预览卡片
              </div>
            </div>
            <v-switch
              v-model="enableLinkPreview"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="handleLinkPreviewChange"
            />
          </div>

          <!-- 启用媒体嵌入 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">启用媒体嵌入</div>
              <div class="setting-item-description">
                在笔记中直接显示图片、音频、视频播放器
              </div>
            </div>
            <v-switch
              v-model="enableMediaEmbed"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="handleMediaEmbedChange"
            />
          </div>

          <!-- 支持的视频网站 -->
          <div v-if="enableMediaEmbed" class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">支持的视频网站</div>
              <div class="setting-item-description">
                这些网站的链接将自动转换为嵌入式播放器
              </div>
            </div>
            <v-select
              v-model="supportedVideoSites"
              :items="videoSiteOptions"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              hide-details
              class="setting-select-wide"
              @update:model-value="handleVideoSitesChange"
            />
          </div>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- 显示设置 -->
      <div class="setting-section">
        <div class="setting-header">
          <v-icon icon="mdi-format-font" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">显示</span>
        </div>
        
        <div class="setting-content">
          <!-- 字体大小 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">字体大小</div>
              <div class="setting-item-description">
                编辑器中的文字大小
              </div>
            </div>
            <div class="d-flex align-center" style="width: 180px;">
              <v-slider
                v-model="fontSize"
                :min="12"
                :max="24"
                :step="1"
                thumb-label
                hide-details
                density="compact"
                @update:model-value="handleFontSizeChange"
              />
              <span class="text-caption ml-2" style="min-width: 40px;">{{ fontSize }}px</span>
            </div>
          </div>

          <!-- 显示行号 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">显示行号</div>
              <div class="setting-item-description">
                在编辑模式下显示行号
              </div>
            </div>
            <v-switch
              v-model="showLineNumbers"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="handleLineNumbersChange"
            />
          </div>

          <!-- 显示字数统计 -->
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-title">显示字数统计</div>
              <div class="setting-item-description">
                在状态栏显示当前文档的字数
              </div>
            </div>
            <v-switch
              v-model="showWordCount"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="handleWordCountChange"
            />
          </div>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Markdown 语法参考 -->
      <div class="setting-section">
        <div class="setting-header">
          <v-icon icon="mdi-language-markdown" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">媒体嵌入语法</span>
        </div>
        
        <div class="setting-content">
          <v-alert type="info" variant="tonal" density="compact">
            <div class="syntax-help">
              <div class="syntax-item">
                <code>![[image.png]]</code>
                <span>嵌入仓储中的图片</span>
              </div>
              <div class="syntax-item">
                <code>![[audio.mp3]]</code>
                <span>嵌入音频播放器</span>
              </div>
              <div class="syntax-item">
                <code>![[video.mp4]]</code>
                <span>嵌入视频播放器</span>
              </div>
              <div class="syntax-item">
                <code>![](https://...)</code>
                <span>嵌入外部图片</span>
              </div>
              <div class="syntax-item">
                <code>&lt;iframe src="..."&gt;</code>
                <span>嵌入网页视频</span>
              </div>
            </div>
          </v-alert>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRepositoryViewStore } from '@/modules/repository/presentation/stores/repositoryViewStore';

// Props
interface Props {
  autoSave?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoSave: true,
});

// Store
const viewStore = useRepositoryViewStore();

// Local state
const defaultMode = ref<'reading' | 'editing'>('reading');
const autoSaveDelay = ref(500);
const enableLinkPreview = ref(true);
const enableMediaEmbed = ref(true);
const supportedVideoSites = ref<string[]>([]);
const showLineNumbers = ref(false);
const fontSize = ref(16);
const showWordCount = ref(true);

// Options
const autoSaveDelayOptions = [
  { value: 300, label: '300ms (快)' },
  { value: 500, label: '500ms (推荐)' },
  { value: 1000, label: '1秒' },
  { value: 2000, label: '2秒' },
  { value: 5000, label: '5秒' },
];

const videoSiteOptions = [
  'youtube.com',
  'bilibili.com',
  'youku.com',
  'vimeo.com',
  'dailymotion.com',
];

// Computed
const settings = computed(() => viewStore.editorSettings);

// Methods
function syncFromStore() {
  defaultMode.value = settings.value.defaultMode;
  autoSaveDelay.value = settings.value.autoSaveDelay;
  enableLinkPreview.value = settings.value.enableLinkPreview;
  enableMediaEmbed.value = settings.value.enableMediaEmbed;
  supportedVideoSites.value = settings.value.supportedVideoSites;
  showLineNumbers.value = settings.value.showLineNumbers;
  fontSize.value = settings.value.fontSize;
  showWordCount.value = settings.value.showWordCount;
}

function handleDefaultModeChange(value: 'reading' | 'editing') {
  if (props.autoSave) {
    viewStore.updateEditorSettings({ defaultMode: value });
  }
}

function handleAutoSaveDelayChange(value: number) {
  if (props.autoSave) {
    viewStore.updateEditorSettings({ autoSaveDelay: value });
  }
}

function handleLinkPreviewChange(value: boolean) {
  if (props.autoSave) {
    viewStore.updateEditorSettings({ enableLinkPreview: value });
  }
}

function handleMediaEmbedChange(value: boolean) {
  if (props.autoSave) {
    viewStore.updateEditorSettings({ enableMediaEmbed: value });
  }
}

function handleVideoSitesChange(value: string[]) {
  if (props.autoSave) {
    viewStore.updateEditorSettings({ supportedVideoSites: value });
  }
}

function handleLineNumbersChange(value: boolean) {
  if (props.autoSave) {
    viewStore.updateEditorSettings({ showLineNumbers: value });
  }
}

function handleFontSizeChange(value: number) {
  if (props.autoSave) {
    viewStore.updateEditorSettings({ fontSize: value });
  }
}

function handleWordCountChange(value: boolean) {
  if (props.autoSave) {
    viewStore.updateEditorSettings({ showWordCount: value });
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
  max-width: 180px;
}

.setting-select-wide {
  max-width: 280px;
}

code {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Fira Code', monospace;
}

.syntax-help {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.syntax-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.syntax-item code {
  min-width: 180px;
}

.syntax-item span {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
