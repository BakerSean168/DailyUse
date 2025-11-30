/**
 * Editor 模块导出
 */

// 组件
export { default as EditorContainer } from './components/EditorContainer.vue';
export { default as EditorTabBar } from './components/EditorTabBar.vue';
export { default as MarkdownEditor } from './components/MarkdownEditor.vue';
export { default as MediaViewer } from './components/MediaViewer.vue';

// Composable
export { useEditor } from './composables/useEditor';

// 类型（从 contracts 包重新导出）
export type { SimpleEditorTab as EditorTab } from '@dailyuse/contracts/shared';
