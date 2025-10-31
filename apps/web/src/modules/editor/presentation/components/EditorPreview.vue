<template>
  <div class="editor-preview">
    <div v-html="renderedHtml" class="preview-content" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import MarkdownIt from 'markdown-it';

// ==================== Props ====================
interface Props {
  content: string;
}

const props = defineProps<Props>();

// ==================== State ====================
const renderedHtml = ref('');
let md: MarkdownIt;

// ==================== Methods ====================
function initializeMarkdownIt() {
  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  });
}

function renderMarkdown() {
  if (!md) return;
  
  try {
    renderedHtml.value = md.render(props.content);
  } catch (error) {
    console.error('Markdown render error:', error);
    renderedHtml.value = '<p>渲染错误</p>';
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  initializeMarkdownIt();
  renderMarkdown();
});

// ==================== Watchers ====================
watch(() => props.content, () => {
  renderMarkdown();
}, { immediate: false });
</script>

<style scoped>
.editor-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: #fff;
}

.preview-content {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
  color: #333;
}

/* Markdown 样式 */
.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.preview-content :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.preview-content :deep(h3) {
  font-size: 1.25em;
}

.preview-content :deep(p) {
  margin-bottom: 16px;
}

.preview-content :deep(a) {
  color: #1976d2;
  text-decoration: none;
}

.preview-content :deep(a:hover) {
  text-decoration: underline;
}

.preview-content :deep(code) {
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: 'Courier New', Consolas, monospace;
  font-size: 85%;
  padding: 0.2em 0.4em;
}

.preview-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin-bottom: 16px;
}

.preview-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 100%;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
  padding: 0 1em;
  margin: 0 0 16px 0;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin-bottom: 16px;
  padding-left: 2em;
}

.preview-content :deep(li) {
  margin-bottom: 4px;
}

.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.preview-content :deep(table th),
.preview-content :deep(table td) {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.preview-content :deep(table th) {
  background-color: #f6f8fa;
  font-weight: 600;
}

.preview-content :deep(table tr:nth-child(even)) {
  background-color: #f6f8fa;
}

.preview-content :deep(hr) {
  border: 0;
  border-top: 1px solid #eaecef;
  height: 0;
  margin: 24px 0;
}

.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.preview-content :deep(strong) {
  font-weight: 600;
}

.preview-content :deep(em) {
  font-style: italic;
}
</style>
