<template>
  <div class="markdown-editor">
    <div class="editor-container">
      <template v-if="isPreviewMode">
        <div class="preview-area">
          <div class="markdown-body" v-html="renderedContent"></div>
        </div>
      </template>
      <template v-else>
        <div class="edit-area">
          <MonacoEditor v-model:value="content" :options="editorOptions" :theme="editorTheme" language="markdown"
            @keydown.ctrl.s.prevent="saveContent" @keydown.meta.s.prevent="saveContent" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import MonacoEditor from 'monaco-editor-vue3'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css'
import { fileSystem } from '@/shared/utils/fileSystem'
import { useThemeStore } from '@/modules/Theme/themeStroe'
import { useSettingStore } from '@/modules/Setting/settingStore'

const props = defineProps<{
  path: string
  initialContent?: string
  isPreview?: boolean
}>()

const emit = defineEmits<{
  'contentChanged': [isDirty: boolean]
}>()

const themeStore = useThemeStore()
const settingStore = useSettingStore()
const editorTheme = computed(() => `vs-${themeStore.currentThemeStyle}`)
let autoSaveTimer: NodeJS.Timeout | null = null

const autoSaveDelay = ref(1000) // 1 second delay
// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 状态管理
const isPreviewMode = computed(() => props.isPreview)
const content = ref('')
let originalContent = '';

const autoSaveEnabled = computed(() => settingStore.editor.autoSave)

// 编辑器配置
const editorOptions = computed(() => ({
  ...settingStore.getMonacoOptions(),
  maxEditorWidth: Number.MAX_SAFE_INTEGER,
  automaticLayout: true,
  links: true,
  mouseWheelZoom: true,
  // 添加链接检测配置
  quickSuggestions: true,
  wordBasedSuggestions: true,
  // 配置链接选项
  linkDetector: {
    enabled: true,
    preferredProtocols: ['http', 'https']
  },
  // 修改链接处理器
  'editor.action.openLink': {
    enabled: true,
    callback: (url: string) => {
      window.shared.ipcRenderer.invoke('open-external-url', url);
    }
  }
}))
// const editorOptions = {
//   minimap: { enabled: true },
//   wordWrap: 'on',
//   lineNumbers: 'on',
//   renderWhitespace: 'boundary',
//   scrollBeyondLastLine: false,
//   automaticLayout: true,
//   fontSize: 14,
//   padding: { top: 16 }
// }

// 计算属性
const renderedContent = computed(() => {
  return md.render(content.value || '')
  
})

// 加载文件内容
const loadFileContent = async () => {
  try {
    const fileContent = await fileSystem.readFile(props.path)
    content.value = fileContent
    originalContent = fileContent
  } catch (error) {
    console.error('读取文件失败:', error)
    content.value = ''
    originalContent = ''
  }
}

// 检查内容是否有更改
const checkDirtyState = () => {
  const isDirty = content.value !== originalContent
  emit('contentChanged', isDirty)
}
// 保存内容
const saveContent = async () => {
  if (!props.path) return

  try {
    await fileSystem.writeFile(props.path, content.value)
    originalContent = content.value
    emit('contentChanged', false)
  } catch (error) {
    console.error('保存文件失败:', error)
    alert('保存失败')
  }
}
// 监听内容变化
watch(content, () => {
  checkDirtyState()

  if (autoSaveEnabled.value) {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
    
    autoSaveTimer = setTimeout(async () => {
      if (content.value !== originalContent) {
        await saveContent()
        originalContent = content.value // Update original content after save
      }
    }, autoSaveDelay.value)
  }
})


// 监听路径变化重新加载内容
watch(() => props.path, () => {
  loadFileContent()
}, { immediate: true })

onMounted(async () => {
  if (props.path && !props.initialContent) {
    try {
      const fileContent = await fileSystem.readFile(props.path)
      content.value = fileContent
    } catch (error) {
      console.error('读取文件失败:', error)
      content.value = ''
    }
  }
})

onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})
</script>

<style scoped>
.markdown-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #3b3a8d;
  overflow: hidden; /* 添加这行 */

}

.toolbar {
  padding: 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  flex-shrink: 0;
}

.editor-container {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.editor-container.split .edit-area,
.editor-container.split .preview-area {
  width: 50%;
}

.edit-area,
.preview-area {
  flex: 1;
  overflow: auto;
}

.preview-area {

  background-color: var(--vscode-editor-background);

  /* 添加滚动条样式 */
  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgb(var(--v-theme-surface));
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--vscode-scrollbarSlider-background);
    border-radius: 3px;
    border: 3px solid var(--vscode-editor-background);

    &:hover {
      background-color: var(--vscode-scrollbarSlider-hoverBackground);
    }

    &:active {
      background-color: var(--vscode-scrollbarSlider-activeBackground);
    }
  }
}

:deep(.markdown-body) {
  box-sizing: border-box;
  min-width: 200px;
  /* max-width: 980px; */
  margin: 0 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  /* 编辑器字体颜色 */
  color: rgb(var(--v-theme-font));
  
}

:deep(.markdown-body h1) {
  font-size: 2em;
  margin: 0.67em 0;
}

:deep(.markdown-body h2) {
  font-size: 1.5em;
  margin: 0.83em 0;
}

:deep(.markdown-body p) {
  margin: 1em 0;
}

:deep(.markdown-body code) {
  background-color: #2d2d2d;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

:deep(.markdown-body pre) {
  background-color: #2d2d2d;
  padding: 16px;
  overflow: auto;
  border-radius: 3px;
}

:deep(.monaco-editor) {
  height: 100% !important;
}

:deep(.markdown-body a) {
  color: #5b91ce;
}

:deep(.markdown-body blockquote) {
  color: #8b949e;
  border-left: 0.25em solid #30363d;
}

:deep(.markdown-body hr) {
  background-color: #30363d;
}

:deep(.markdown-body table) {
  border-color: #30363d;
}

:deep(.markdown-body tr) {
  background-color: #1e1e1e;
  border-color: #30363d;
}

:deep(.markdown-body th, .markdown-body td) {
  border-color: #30363d;
  padding: 6px 13px;
}
</style>