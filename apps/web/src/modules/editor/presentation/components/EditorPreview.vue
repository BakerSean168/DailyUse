<template>
  <div class="editor-preview">
    <div v-html="renderedHtml" class="preview-content" @click="handleClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import MarkdownIt from 'markdown-it';

// ==================== Props ====================
interface Props {
  content: string;
  onLinkClick?: (title: string) => void;
}

const props = defineProps<Props>();

// ==================== Emits ====================
const emit = defineEmits<{
  linkClick: [title: string];
}>();

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

  // 添加自定义插件：渲染双向链接 [[title]]
  md.core.ruler.after('inline', 'bidirectional-links', (state) => {
    const blockTokens = state.tokens;

    for (let i = 0; i < blockTokens.length; i++) {
      if (blockTokens[i].type !== 'inline') continue;

      const inlineTokens = blockTokens[i].children || [];
      const newTokens = [];

      for (let j = 0; j < inlineTokens.length; j++) {
        const token = inlineTokens[j];

        if (token.type === 'text') {
          // 匹配 [[title]], [[title|alias]], [[title#section]]
          const linkPattern = /\[\[([^\]|#]+)(?:\|([^\]#]+))?(?:#([^\]]+))?\]\]/g;
          const text = token.content;
          let lastIndex = 0;
          let match;

          while ((match = linkPattern.exec(text)) !== null) {
            const fullMatch = match[0];
            const title = match[1].trim();
            const alias = match[2]?.trim();
            const section = match[3]?.trim();
            const displayText = alias || (section ? `${title}#${section}` : title);

            // 添加匹配前的文本
            if (match.index > lastIndex) {
              const textToken = new state.Token('text', '', 0);
              textToken.content = text.slice(lastIndex, match.index);
              newTokens.push(textToken);
            }

            // 创建链接 token
            const linkOpen = new state.Token('link_open', 'a', 1);
            linkOpen.attrSet('href', `#${title}`);
            linkOpen.attrSet('class', 'internal-link');
            linkOpen.attrSet('data-title', title);
            if (section) {
              linkOpen.attrSet('data-section', section);
            }

            const linkText = new state.Token('text', '', 0);
            linkText.content = displayText;

            const linkClose = new state.Token('link_close', 'a', -1);

            newTokens.push(linkOpen, linkText, linkClose);
            lastIndex = match.index + fullMatch.length;
          }

          // 添加剩余文本
          if (lastIndex < text.length) {
            const textToken = new state.Token('text', '', 0);
            textToken.content = text.slice(lastIndex);
            newTokens.push(textToken);
          }

          // 如果有链接，替换原 token
          if (lastIndex > 0) {
            inlineTokens.splice(j, 1, ...newTokens);
            j += newTokens.length - 1;
          }
        } else {
          newTokens.push(token);
        }
      }
    }

    return true;
  });
}

function renderMarkdown() {
  if (!md) return;
  
  try {
    let content = props.content;
    
    // 渲染 markdown
    renderedHtml.value = md.render(content);
  } catch (error) {
    console.error('Markdown render error:', error);
    renderedHtml.value = '<p>渲染错误</p>';
  }
}

function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  
  // 检查是否点击了内部链接
  if (target.tagName === 'A' && target.classList.contains('internal-link')) {
    event.preventDefault();
    const title = target.getAttribute('data-title');
    if (title) {
      emit('linkClick', title);
      props.onLinkClick?.(title);
    }
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

/* 内部链接样式 */
.preview-content :deep(a.internal-link) {
  color: #1976d2;
  background-color: rgba(25, 118, 210, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-content :deep(a.internal-link:hover) {
  background-color: rgba(25, 118, 210, 0.16);
  text-decoration: none;
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
