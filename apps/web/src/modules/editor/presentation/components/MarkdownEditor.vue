<template>
  <div class="markdown-editor">
    <div ref="editorRef" class="editor-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorView } from '@codemirror/view';
import { createEditorExtensions, createEditorState } from '../../infrastructure/codemirror/extensions';

// ==================== Props ====================
interface Props {
  modelValue: string;
  darkMode?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  darkMode: false,
  readonly: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  keydown: [event: KeyboardEvent];
  'trigger-suggestion': [position: { x: number; y: number; query: string }];
}>();

// ==================== State ====================
const editorRef = ref<HTMLElement | null>(null);
let editorView: EditorView | null = null;

// ==================== Methods ====================
function handleUpdate(content: string) {
  emit('update:modelValue', content);
  emit('change', content);
}

function getCursorPosition(): { x: number; y: number } | null {
  if (!editorView) return null;

  const { state } = editorView;
  const { from } = state.selection.main;

  // Get cursor coordinates from CodeMirror
  const coords = editorView.coordsAtPos(from);
  if (!coords) return null;

  return {
    x: coords.left,
    y: coords.bottom, // Use bottom position for dropdown below cursor
  };
}

function getTextBeforeCursor(length: number = 50): string {
  if (!editorView) return '';

  const { state } = editorView;
  const { from } = state.selection.main;
  const startPos = Math.max(0, from - length);

  return state.doc.sliceString(startPos, from);
}

function handleKeyDown(event: KeyboardEvent) {
  emit('keydown', event);

  // Check for [[ trigger
  if (event.key === '[') {
    const textBefore = getTextBeforeCursor(2);
    if (textBefore.endsWith('[')) {
      // User just typed the second [
      const position = getCursorPosition();
      if (position) {
        // Extract any partial query after [[
        setTimeout(() => {
          const textAfter = getTextBeforeCursor(50);
          const match = textAfter.match(/\[\[([^\]]*?)$/);
          const query = match ? match[1] : '';
          emit('trigger-suggestion', { ...position, query });
        }, 0);
      }
    }
  }
}

function initializeEditor() {
  if (!editorRef.value) return;

  const extensions = createEditorExtensions(handleUpdate, props.darkMode);
  const state = createEditorState(props.modelValue, extensions);

  editorView = new EditorView({
    state,
    parent: editorRef.value,
  });

  // Add keydown listener
  editorView.contentDOM.addEventListener('keydown', handleKeyDown);

  // 只读模式
  if (props.readonly) {
    editorView.contentDOM.setAttribute('contenteditable', 'false');
  }
}

function destroyEditor() {
  if (editorView) {
    editorView.contentDOM.removeEventListener('keydown', handleKeyDown);
    editorView.destroy();
    editorView = null;
  }
}

// ==================== Public Methods ====================
function insertText(text: string) {
  if (!editorView) return;
  
  const { state } = editorView;
  const { from, to } = state.selection.main;
  
  editorView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  
  editorView.focus();
}

function insertTextAtCursor(text: string) {
  if (!editorView) return;
  
  const { state } = editorView;
  const { from } = state.selection.main;
  
  // Find the [[ before cursor and replace from there
  const textBefore = getTextBeforeCursor(100);
  const lastBracketIndex = textBefore.lastIndexOf('[[');
  
  if (lastBracketIndex !== -1) {
    // Calculate actual position in document
    const deleteFrom = from - (textBefore.length - lastBracketIndex);
    
    editorView.dispatch({
      changes: { from: deleteFrom, to: from, insert: text },
      selection: { anchor: deleteFrom + text.length },
    });
  } else {
    // Fallback: just insert at cursor
    editorView.dispatch({
      changes: { from, insert: text },
      selection: { anchor: from + text.length },
    });
  }
  
  editorView.focus();
}

function wrapSelection(prefix: string, suffix: string) {
  if (!editorView) return;
  
  const { state } = editorView;
  const { from, to } = state.selection.main;
  const selectedText = state.doc.sliceString(from, to);
  const wrappedText = `${prefix}${selectedText}${suffix}`;
  
  editorView.dispatch({
    changes: { from, to, insert: wrappedText },
    selection: { 
      anchor: from + prefix.length, 
      head: from + prefix.length + selectedText.length 
    },
  });
  
  editorView.focus();
}

function replaceSelection(text: string) {
  if (!editorView) return;
  
  const { state } = editorView;
  const { from, to } = state.selection.main;
  
  editorView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  
  editorView.focus();
}

function getSelection(): string {
  if (!editorView) return '';
  
  const { state } = editorView;
  const { from, to } = state.selection.main;
  return state.doc.sliceString(from, to);
}

function focus() {
  if (editorView) {
    editorView.focus();
  }
}

// ==================== Expose ====================
defineExpose({
  insertText,
  insertTextAtCursor,
  wrapSelection,
  replaceSelection,
  getSelection,
  focus,
  editorView,
});

// ==================== Lifecycle ====================
onMounted(() => {
  initializeEditor();
});

onBeforeUnmount(() => {
  destroyEditor();
});

// ==================== Watchers ====================
watch(() => props.modelValue, (newValue) => {
  if (!editorView) return;
  
  const currentValue = editorView.state.doc.toString();
  if (newValue !== currentValue) {
    editorView.dispatch({
      changes: { from: 0, to: currentValue.length, insert: newValue },
    });
  }
});

watch(() => props.darkMode, () => {
  // 主题切换需要重新初始化编辑器
  destroyEditor();
  initializeEditor();
});
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container {
  flex: 1;
  overflow: auto;
}

/* CodeMirror 样式覆盖 */
.editor-container :deep(.cm-editor) {
  height: 100%;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.editor-container :deep(.cm-scroller) {
  overflow: auto;
}

.editor-container :deep(.cm-content) {
  padding: 16px;
}

.editor-container :deep(.cm-line) {
  line-height: 1.6;
}

/* Markdown 语法高亮增强 */
.editor-container :deep(.cm-line .tok-heading) {
  font-weight: bold;
  color: #1976d2;
}

.editor-container :deep(.cm-line .tok-strong) {
  font-weight: bold;
}

.editor-container :deep(.cm-line .tok-emphasis) {
  font-style: italic;
}

.editor-container :deep(.cm-line .tok-link) {
  color: #1976d2;
  text-decoration: underline;
}

.editor-container :deep(.cm-line .tok-monospace) {
  font-family: 'Courier New', monospace;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 3px;
}
</style>
