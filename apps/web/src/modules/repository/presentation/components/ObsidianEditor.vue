<!--
  ObsidianEditor - Obsidian 风格笔记编辑器
  
  功能特性：
  1. Properties (YAML frontmatter) 专用区域
  2. 编辑模式 / 阅读模式切换
  3. 实时 Markdown 预览
  4. 自动保存 (500ms 防抖)
-->

<template>
  <div 
    class="obsidian-editor" 
    :class="{ 'reading-mode': isReadingMode, 'drag-over': isDragOver }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- 拖拽上传提示层 -->
    <Transition name="fade">
      <div v-if="isDragOver" class="drop-overlay">
        <div class="drop-content">
          <v-icon icon="mdi-cloud-upload" size="64" color="primary" />
          <p>释放以上传文件</p>
          <span class="drop-hint">支持图片、音频、视频、PDF 等</span>
        </div>
      </div>
    </Transition>

    <!-- 上传进度条 -->
    <Transition name="slide-down">
      <div v-if="isUploading" class="upload-progress-bar">
        <v-progress-linear 
          :model-value="uploadProgress" 
          color="primary" 
          height="3"
        />
        <span class="upload-status">{{ uploadStatusText }}</span>
      </div>
    </Transition>

    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <!-- 返回/前进按钮 -->
        <v-btn icon size="small" variant="text" disabled>
          <v-icon icon="mdi-arrow-left" size="18" />
        </v-btn>
        <v-btn icon size="small" variant="text" disabled>
          <v-icon icon="mdi-arrow-right" size="18" />
        </v-btn>
      </div>

      <div class="toolbar-center">
        <!-- 面包屑路径 -->
        <span class="breadcrumb">
          <span class="folder-name" v-if="folderPath">{{ folderPath }} /</span>
          <span class="file-name">{{ displayFileName }}</span>
        </span>
      </div>

      <div class="toolbar-right">
        <!-- 书签按钮 -->
        <v-btn icon size="small" variant="text" @click="toggleBookmark">
          <v-icon :icon="isBookmarked ? 'mdi-bookmark' : 'mdi-bookmark-outline'" size="18" />
          <v-tooltip activator="parent" location="bottom">
            {{ isBookmarked ? '取消书签' : '添加书签' }}
          </v-tooltip>
        </v-btn>

        <!-- 编辑/阅读模式切换 -->
        <v-btn icon size="small" variant="text" @click="toggleMode">
          <v-icon :icon="isReadingMode ? 'mdi-pencil-outline' : 'mdi-book-open-variant'" size="18" />
          <v-tooltip activator="parent" location="bottom">
            {{ isReadingMode ? '编辑模式' : '阅读模式' }}
          </v-tooltip>
        </v-btn>

        <!-- 更多操作 -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon size="small" variant="text" v-bind="props">
              <v-icon icon="mdi-dots-vertical" size="18" />
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="copyLink">
              <template #prepend>
                <v-icon icon="mdi-link" size="small" />
              </template>
              <v-list-item-title>复制链接</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openInNewTab">
              <template #prepend>
                <v-icon icon="mdi-open-in-new" size="small" />
              </template>
              <v-list-item-title>在新标签页打开</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item @click="showFileInfo">
              <template #prepend>
                <v-icon icon="mdi-information-outline" size="small" />
              </template>
              <v-list-item-title>文件信息</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- 编辑器内容区域 -->
    <div class="editor-content">
      <!-- 文章标题 -->
      <h1 class="note-title">{{ noteTitle }}</h1>

      <!-- Properties 区域 (Obsidian 风格) - 仅阅读模式显示 -->
      <div v-if="isReadingMode && hasProperties" class="properties-section">
        <div class="properties-header" @click="togglePropertiesExpanded">
          <span class="properties-label">Properties</span>
          <v-icon 
            :icon="propertiesExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'" 
            size="16" 
          />
        </div>
        
        <div v-show="propertiesExpanded" class="properties-content">
          <div 
            v-for="(value, key) in properties" 
            :key="key" 
            class="property-row"
          >
            <div class="property-icon">
              <v-icon :icon="getPropertyIcon(key as string)" size="16" />
            </div>
            <div class="property-key">{{ key }}</div>
            <div class="property-value">
              <!-- Tags 特殊处理 -->
              <template v-if="key === 'tags' && Array.isArray(value)">
                <v-chip
                  v-for="tag in value"
                  :key="tag"
                  size="small"
                  variant="tonal"
                  color="primary"
                  class="mr-1"
                >
                  {{ tag }}
                </v-chip>
              </template>
              <!-- 日期时间格式化 -->
              <template v-else-if="isDateField(key as string)">
                {{ formatDate(value) }}
              </template>
              <!-- 普通值 -->
              <template v-else>
                {{ value }}
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Markdown 内容区域 -->
      <div class="markdown-content">
        <!-- 阅读模式 - 渲染后的内容 -->
        <div v-if="isReadingMode" class="reading-view" v-html="renderedContent"></div>
        
        <!-- 编辑模式 - 完整源码（包含 frontmatter） -->
        <div v-else class="editing-view">
          <textarea
            ref="editorTextarea"
            v-model="fullContent"
            class="markdown-textarea"
            placeholder="开始写作..."
            @input="handleContentChange"
            @paste="handlePaste"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 状态栏 - 右下角浮动 -->
    <div class="editor-statusbar">
      <span v-if="isSaving" class="save-status saving">
        <v-icon icon="mdi-loading" size="12" class="rotating mr-1" />
        保存中...
      </span>
      <span v-else-if="isDirty" class="save-status dirty">
        未保存
      </span>
      <span v-else class="save-status saved">
        已保存
      </span>
      <span class="separator">|</span>
      <span class="word-count">{{ wordCount }} 字</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useResourceStore } from '../stores/resourceStore';
import { useRepositoryViewStore } from '../stores/repositoryViewStore';
import { marked } from 'marked';
import { 
  processImageForEmbed, 
  uploadResource, 
  generateEmbedSyntax, 
  getFileType 
} from '../../application/services/ResourceUploadService';

// Props
interface Props {
  resourceUuid: string;
}

const props = defineProps<Props>();

// Store
const resourceStore = useResourceStore();
const viewStore = useRepositoryViewStore();

// State
const isReadingMode = ref(true); // 默认阅读模式
const propertiesExpanded = ref(true);
const isBookmarked = ref(false);
const editorTextarea = ref<HTMLTextAreaElement | null>(null);
const fullContent = ref(''); // 完整内容（包含 frontmatter）

// 拖拽上传状态
const isDragOver = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadStatusText = ref('');
let dragCounter = 0; // 用于处理嵌套拖拽事件

// Computed
const resource = computed(() => resourceStore.selectedResource);
const isLoading = computed(() => resourceStore.isLoading);
const isSaving = computed(() => resourceStore.isSaving);
const isDirty = computed(() => {
  const tab = resourceStore.openTabs.find((t) => t.uuid === props.resourceUuid);
  return tab?.isDirty || false;
});

// 解析 frontmatter 和内容
const parsedContent = computed(() => {
  const content = fullContent.value || '';
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    const frontmatterStr = match[1];
    const body = content.slice(match[0].length);
    const properties = parseFrontmatter(frontmatterStr);
    return { properties, body };
  }
  
  return { properties: {}, body: content };
});

const properties = computed(() => parsedContent.value.properties);
const hasProperties = computed(() => Object.keys(properties.value).length > 0);
const markdownBody = computed(() => parsedContent.value.body);

// 笔记标题
const noteTitle = computed(() => {
  return properties.value.title || resource.value?.name?.replace(/\.md$/, '') || '无标题';
});

// 文件名显示
const displayFileName = computed(() => {
  const name = resource.value?.name || '';
  return name.endsWith('.md') ? name.slice(0, -3) : name;
});

// 文件夹路径
const folderPath = computed(() => {
  // TODO: 从资源中获取文件夹路径
  return '';
});

/**
 * 处理 Obsidian 风格的媒体嵌入语法
 * 支持: ![[filename.ext]] 和标准 markdown 图片
 */
function processMediaEmbeds(content: string): string {
  if (!viewStore.editorSettings.enableMediaEmbed) {
    return content;
  }

  // 处理 Obsidian 风格嵌入: ![[filename]]
  let processed = content.replace(
    /!\[\[([^\]]+)\]\]/g,
    (match, filename) => {
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const resourceUrl = getResourceUrl(filename);
      
      // 图片
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        return `<div class="embedded-media embedded-image"><img src="${resourceUrl}" alt="${filename}" loading="lazy" /></div>`;
      }
      // 音频
      if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
        return `<div class="embedded-media embedded-audio"><audio controls src="${resourceUrl}"><a href="${resourceUrl}">${filename}</a></audio></div>`;
      }
      // 视频
      if (['mp4', 'webm', 'ogv', 'mov', 'avi'].includes(ext)) {
        return `<div class="embedded-media embedded-video"><video controls src="${resourceUrl}"><a href="${resourceUrl}">${filename}</a></video></div>`;
      }
      // PDF
      if (ext === 'pdf') {
        return `<div class="embedded-media embedded-pdf"><iframe src="${resourceUrl}" title="${filename}"></iframe><a href="${resourceUrl}" target="_blank">📄 ${filename}</a></div>`;
      }
      // 其他文件 - 显示链接
      return `<a href="${resourceUrl}" class="embedded-link" target="_blank">📎 ${filename}</a>`;
    }
  );

  // 处理网页视频嵌入 (YouTube, Bilibili 等)
  processed = processVideoEmbeds(processed);

  return processed;
}

/**
 * 处理视频网站嵌入
 */
function processVideoEmbeds(content: string): string {
  const supportedSites = viewStore.editorSettings.supportedVideoSites;
  
  // YouTube
  if (supportedSites.includes('youtube.com')) {
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)?/g,
      '<div class="embedded-media embedded-video-iframe"><iframe src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe></div>'
    );
  }
  
  // Bilibili
  if (supportedSites.includes('bilibili.com')) {
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV[a-zA-Z0-9]+)(?:[^\s]*)?/g,
      '<div class="embedded-media embedded-video-iframe"><iframe src="//player.bilibili.com/player.html?bvid=$1" frameborder="0" allowfullscreen></iframe></div>'
    );
  }

  return content;
}

/**
 * 获取资源 URL
 */
function getResourceUrl(filename: string): string {
  // TODO: 根据当前仓储和文件名获取实际 URL
  // 暂时返回相对路径，后续需要对接 API
  const repoUuid = resource.value?.repositoryUuid || '';
  return `/api/repositories/${repoUuid}/assets/${encodeURIComponent(filename)}`;
}

// 渲染后的 HTML 内容
const renderedContent = computed(() => {
  try {
    const markdown = markdownBody.value || '';
    // 先处理媒体嵌入，再用 marked 渲染
    const processedMarkdown = processMediaEmbeds(markdown);
    return marked(processedMarkdown);
  } catch (e) {
    return '<p>渲染错误</p>';
  }
});

// 字数统计
const wordCount = computed(() => {
  const text = markdownBody.value || '';
  // 中文字符计数
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  // 英文单词计数
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
});

// 阅读时间（假设每分钟 300 字）
const readingTime = computed(() => {
  return Math.max(1, Math.ceil(wordCount.value / 300));
});

// 解析 YAML frontmatter
function parseFrontmatter(str: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = str.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      
      // 解析数组 (tags: [a, b, c])
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1);
        result[key] = value.split(',').map(v => v.trim()).filter(Boolean);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

// 获取属性图标
function getPropertyIcon(key: string): string {
  const iconMap: Record<string, string> = {
    tags: 'mdi-tag-outline',
    created: 'mdi-calendar-plus',
    updated: 'mdi-calendar-edit',
    title: 'mdi-format-title',
    author: 'mdi-account-outline',
    status: 'mdi-flag-outline',
    priority: 'mdi-priority-high',
  };
  return iconMap[key] || 'mdi-text';
}

// 是否是日期字段
function isDateField(key: string): boolean {
  return ['created', 'updated', 'date'].includes(key);
}

// 格式化日期
function formatDate(value: any): string {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

// 切换模式
function toggleMode() {
  isReadingMode.value = !isReadingMode.value;
}

// 切换 Properties 展开
function togglePropertiesExpanded() {
  propertiesExpanded.value = !propertiesExpanded.value;
}

// 切换书签
function toggleBookmark() {
  isBookmarked.value = !isBookmarked.value;
  // TODO: 实际保存书签状态
}

// 复制链接
function copyLink() {
  const link = `obsidian://open?vault=dailyuse&file=${encodeURIComponent(resource.value?.path || '')}`;
  navigator.clipboard.writeText(link);
}

// 在新标签页打开
function openInNewTab() {
  // TODO: 实现新标签页打开
}

// 显示文件信息
function showFileInfo() {
  // TODO: 显示文件详细信息弹窗
}

// 更新 frontmatter 中的 updated 时间戳
function updateFrontmatterTimestamp(content: string): string {
  const now = new Date().toISOString().slice(0, 19); // 格式: 2025-12-01T21:30:00
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    // 如果没有 frontmatter，不添加（保持原样）
    return content;
  }
  
  let frontmatter = match[1];
  if (frontmatter.includes('updated:')) {
    // 更新已有的 updated 字段
    frontmatter = frontmatter.replace(/updated:.*/, `updated: ${now}`);
  } else {
    // 添加 updated 字段
    frontmatter = frontmatter.trimEnd() + `\nupdated: ${now}`;
  }
  
  return content.replace(frontmatterRegex, `---\n${frontmatter}\n---`);
}

// 内容变化处理（防抖保存）
const debouncedSave = useDebounceFn((content: string) => {
  resourceStore.saveContent(props.resourceUuid, content);
}, 500);

// 记录原始内容用于比较
let originalContent = '';

function handleContentChange() {
  // 只有内容实际变化时才更新时间戳
  if (fullContent.value !== originalContent) {
    const updatedContent = updateFrontmatterTimestamp(fullContent.value);
    fullContent.value = updatedContent;
    debouncedSave(updatedContent);
  }
}

// ========== 拖拽上传处理 ==========

/**
 * 处理拖拽进入
 */
function handleDragEnter(e: DragEvent) {
  dragCounter++;
  if (e.dataTransfer?.types.includes('Files')) {
    isDragOver.value = true;
  }
}

/**
 * 处理拖拽悬停
 */
function handleDragOver(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
}

/**
 * 处理拖拽离开
 */
function handleDragLeave() {
  dragCounter--;
  if (dragCounter === 0) {
    isDragOver.value = false;
  }
}

/**
 * 处理文件拖放
 */
async function handleDrop(e: DragEvent) {
  dragCounter = 0;
  isDragOver.value = false;

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  await uploadFiles(Array.from(files));
}

/**
 * 处理粘贴事件
 */
async function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;

  const files: File[] = [];
  
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        files.push(file);
      }
    }
  }

  if (files.length > 0) {
    e.preventDefault(); // 阻止默认粘贴行为
    await uploadFiles(files);
  }
}

/**
 * 上传文件并插入到编辑器
 */
async function uploadFiles(files: File[]) {
  if (!resource.value?.repositoryUuid) {
    console.error('No repository UUID');
    return;
  }

  const repositoryUuid = resource.value.repositoryUuid;
  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    const embedSyntaxList: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadStatusText.value = `上传中: ${file.name} (${i + 1}/${files.length})`;
      uploadProgress.value = Math.round((i / files.length) * 100);

      const fileType = getFileType(file.name);
      
      // 处理图片 - 根据设置决定嵌入方式
      if (fileType === 'image') {
        const result = await processImageForEmbed(file, repositoryUuid);
        if (result.type === 'base64') {
          // Base64 嵌入 - 直接插入 markdown 图片语法
          embedSyntaxList.push(`![${file.name}](${result.content})`);
        } else {
          // 链接引用
          embedSyntaxList.push(result.content);
        }
      } else {
        // 非图片文件 - 上传后链接引用
        const uploadResult = await uploadResource(file, repositoryUuid);
        const embedType = fileType === 'pdf' ? 'other' : fileType;
        embedSyntaxList.push(generateEmbedSyntax(uploadResult.name, embedType as 'image' | 'audio' | 'video' | 'link' | 'other'));
      }
    }

    uploadProgress.value = 100;
    uploadStatusText.value = '上传完成';

    // 插入到编辑器
    if (embedSyntaxList.length > 0) {
      insertAtCursor(embedSyntaxList.join('\n\n'));
    }

    // 延迟隐藏进度条
    setTimeout(() => {
      isUploading.value = false;
      uploadProgress.value = 0;
      uploadStatusText.value = '';
    }, 1000);

  } catch (error) {
    console.error('Upload failed:', error);
    uploadStatusText.value = '上传失败';
    setTimeout(() => {
      isUploading.value = false;
    }, 2000);
  }
}

/**
 * 在光标位置插入文本
 */
function insertAtCursor(text: string) {
  const textarea = editorTextarea.value;
  if (!textarea) {
    // 如果在阅读模式，追加到内容末尾
    fullContent.value += '\n\n' + text;
    handleContentChange();
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = fullContent.value.substring(0, start);
  const after = fullContent.value.substring(end);

  // 确保前后有换行
  const prefix = before.endsWith('\n') || before === '' ? '' : '\n';
  const suffix = after.startsWith('\n') || after === '' ? '' : '\n';

  fullContent.value = before + prefix + text + suffix + after;
  
  // 触发保存
  handleContentChange();

  // 恢复光标位置
  nextTick(() => {
    const newPos = start + prefix.length + text.length + suffix.length;
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;
    textarea.focus();
  });
}

// 监听资源变化
watch(
  () => resource.value?.content,
  (newContent) => {
    if (newContent != null && newContent !== fullContent.value) {
      fullContent.value = newContent;
      originalContent = newContent; // 记录原始内容
    }
  },
  { immediate: true }
);

// 初始化
onMounted(() => {
  if (resource.value?.content) {
    fullContent.value = resource.value.content;
    originalContent = resource.value.content;
  }
});
</script>

<style scoped>
.obsidian-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
  position: relative;
}

/* 拖拽状态 */
.obsidian-editor.drag-over {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

/* 拖拽上传遮罩 */
.drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(var(--v-theme-surface), 0.95);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drop-content {
  text-align: center;
}

.drop-content p {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
}

.drop-hint {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* 上传进度条 */
.upload-progress-bar {
  position: absolute;
  top: 40px; /* 工具栏下方 */
  left: 0;
  right: 0;
  z-index: 50;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

.upload-status {
  display: block;
  padding: 4px 12px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  background: rgb(var(--v-theme-surface));
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.breadcrumb {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.breadcrumb .folder-name {
  opacity: 0.6;
}

.breadcrumb .file-name {
  font-weight: 500;
}

/* 内容区域 */
.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 64px;
  padding-bottom: 60px; /* 给状态栏留空间 */
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 笔记标题 */
.note-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: rgb(var(--v-theme-on-background));
  line-height: 1.3;
  max-width: 900px;
}

/* Properties 区域 */
.properties-section {
  margin-bottom: 24px;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
  overflow: hidden;
  max-width: 900px;
}

.properties-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  cursor: pointer;
  user-select: none;
}

.properties-header:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.properties-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.properties-content {
  padding: 8px 0;
}

.property-row {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 8px;
}

.property-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.property-icon {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.property-key {
  width: 80px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.property-value {
  flex: 1;
  font-size: 13px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.property-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  padding: 4px 8px;
  border-radius: 4px;
}

.property-input:focus {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.add-property {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  cursor: pointer;
}

.add-property:hover {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

/* Markdown 内容区域 - 填满容器 */
.markdown-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-width: 900px;
}

.reading-view {
  flex: 1;
  line-height: 1.8;
  font-size: 16px;
}

.reading-view :deep(h1) {
  font-size: 1.75rem;
  margin-top: 24px;
  margin-bottom: 16px;
}

.reading-view :deep(h2) {
  font-size: 1.5rem;
  margin-top: 20px;
  margin-bottom: 12px;
}

.reading-view :deep(h3) {
  font-size: 1.25rem;
  margin-top: 16px;
  margin-bottom: 8px;
}

.reading-view :deep(p) {
  margin-bottom: 16px;
}

.reading-view :deep(ul),
.reading-view :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
}

.reading-view :deep(li) {
  margin-bottom: 4px;
}

.reading-view :deep(code) {
  background: rgba(var(--v-theme-on-surface), 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}

.reading-view :deep(pre) {
  background: rgba(var(--v-theme-on-surface), 0.05);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.reading-view :deep(pre code) {
  background: none;
  padding: 0;
}

.reading-view :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  padding-left: 16px;
  margin: 16px 0;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.reading-view :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.reading-view :deep(a:hover) {
  text-decoration: underline;
}

.reading-view :deep(strong) {
  font-weight: 600;
}

/* 编辑模式 - 填满容器 */
.editing-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.markdown-textarea {
  flex: 1;
  width: 100%;
  min-height: 300px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Fira Code', 'Source Code Pro', monospace;
  font-size: 15px;
  line-height: 1.8;
  color: rgb(var(--v-theme-on-background));
}

.markdown-textarea::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

/* 状态栏 - 右下角浮动 */
.editor-statusbar {
  position: absolute;
  bottom: 16px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  background: rgba(var(--v-theme-surface), 0.9);
  padding: 4px 12px;
  border-radius: 4px;
}

.separator {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.save-status {
  display: flex;
  align-items: center;
}

.save-status.saving {
  color: rgb(var(--v-theme-warning));
}

.save-status.dirty {
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.save-status.saved {
  color: rgb(var(--v-theme-success));
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 阅读模式特殊样式 - 同样填满容器 */
.reading-mode .editor-content {
  padding: 32px 64px;
}

/* ===== 媒体嵌入样式 ===== */

.reading-view :deep(.embedded-media) {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
}

/* 嵌入图片 */
.reading-view :deep(.embedded-image) {
  text-align: center;
}

.reading-view :deep(.embedded-image img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 嵌入音频 */
.reading-view :deep(.embedded-audio) {
  background: rgba(var(--v-theme-on-surface), 0.03);
  padding: 16px;
  border-radius: 8px;
}

.reading-view :deep(.embedded-audio audio) {
  width: 100%;
}

/* 嵌入视频 */
.reading-view :deep(.embedded-video) {
  background: #000;
  border-radius: 8px;
}

.reading-view :deep(.embedded-video video) {
  width: 100%;
  max-height: 480px;
  display: block;
}

/* 嵌入 iframe 视频 (YouTube, Bilibili) */
.reading-view :deep(.embedded-video-iframe) {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 比例 */
  height: 0;
  overflow: hidden;
  border-radius: 8px;
  background: #000;
}

.reading-view :deep(.embedded-video-iframe iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* 嵌入 PDF */
.reading-view :deep(.embedded-pdf) {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.reading-view :deep(.embedded-pdf iframe) {
  width: 100%;
  height: 500px;
  border: none;
}

.reading-view :deep(.embedded-pdf a) {
  display: block;
  padding: 8px 16px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  text-align: center;
  font-size: 14px;
}

/* 嵌入链接 */
.reading-view :deep(.embedded-link) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 4px;
  font-size: 14px;
}

.reading-view :deep(.embedded-link:hover) {
  background: rgba(var(--v-theme-on-surface), 0.1);
  text-decoration: none;
}
</style>
