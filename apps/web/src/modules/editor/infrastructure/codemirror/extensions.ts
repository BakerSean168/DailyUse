/**
 * CodeMirror 6 Extensions Configuration
 * 
 * Infrastructure Layer
 * 配置编辑器扩展、快捷键、行为等
 */

import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';

/**
 * 基础扩展配置
 */
export const basicSetup: Extension = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightActiveLine(),
  history(),
  foldGutter(),
  bracketMatching(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
];

/**
 * Markdown 语言支持
 */
export const markdownSetup: Extension = [
  markdown({ base: markdownLanguage }),
];

/**
 * 键盘快捷键
 */
export const keymapSetup: Extension = [
  keymap.of([
    ...defaultKeymap,
    ...historyKeymap,
    ...foldKeymap,
    indentWithTab,
  ]),
];

/**
 * 主题配置
 */
export const themeSetup = (dark = false): Extension => [
  dark ? oneDark : EditorView.theme({}),
];

/**
 * 编辑器更新监听器
 */
export function createUpdateListener(callback: (content: string) => void): Extension {
  return EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      callback(update.state.doc.toString());
    }
  });
}

/**
 * 创建完整的编辑器配置
 */
export function createEditorExtensions(
  onUpdate: (content: string) => void,
  darkMode = false
): Extension[] {
  return [
    basicSetup,
    markdownSetup,
    keymapSetup,
    themeSetup(darkMode),
    createUpdateListener(onUpdate),
    EditorView.lineWrapping, // 自动换行
  ];
}

/**
 * 创建编辑器状态
 */
export function createEditorState(
  initialContent: string,
  extensions: Extension[]
): EditorState {
  return EditorState.create({
    doc: initialContent,
    extensions,
  });
}
