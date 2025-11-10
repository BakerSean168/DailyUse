/**
 * Milkdown Editor Composable
 * Epic 10 Story 10-2: Resource CRUD + Markdown 编辑器
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { prism } from '@milkdown/plugin-prism';
import { nord } from '@milkdown/theme-nord';

export interface UseMilkdownOptions {
  content?: string;
  onChange?: (markdown: string) => void;
  onSave?: () => void;
}

export function useMilkdown(options: UseMilkdownOptions = {}) {
  const editorRef = ref<HTMLDivElement | null>(null);
  const editor = ref<Editor | null>(null);
  const isReady = ref(false);

  /**
   * 初始化 Milkdown 编辑器
   */
  async function initEditor() {
    if (!editorRef.value) {
      console.warn('Editor container not found');
      return;
    }

    try {
      const editorInstance = await Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, editorRef.value);
          ctx.set(defaultValueCtx, options.content || '');

          // 监听内容变化
          ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
            if (options.onChange) {
              options.onChange(markdown);
            }
          });
        })
        .use(nord) // 主题
        .use(commonmark) // CommonMark 规范
        .use(listener) // 事件监听
        .use(history) // 撤销/重做
        .use(cursor) // 光标样式
        .use(prism) // 代码高亮
        .create();

      editor.value = editorInstance;
      isReady.value = true;

      console.log('✅ Milkdown editor initialized');
    } catch (error) {
      console.error('Failed to initialize Milkdown:', error);
    }
  }

  /**
   * 更新编辑器内容
   */
  function setContent(markdown: string) {
    if (editor.value && isReady.value) {
      editor.value.action((ctx) => {
        const view = ctx.get(rootCtx);
        const doc = ctx.get(defaultValueCtx);
        // TODO: 实现内容更新逻辑
        console.log('Set content:', markdown);
      });
    }
  }

  /**
   * 获取编辑器内容
   */
  function getContent(): string {
    if (editor.value && isReady.value) {
      // TODO: 实现内容获取逻辑
      return '';
    }
    return '';
  }

  /**
   * 销毁编辑器
   */
  function destroyEditor() {
    if (editor.value) {
      editor.value.destroy();
      editor.value = null;
      isReady.value = false;
      console.log('✅ Milkdown editor destroyed');
    }
  }

  // 监听 content 变化
  watch(
    () => options.content,
    (newContent) => {
      if (newContent !== undefined) {
        setContent(newContent);
      }
    }
  );

  onMounted(() => {
    initEditor();
  });

  onBeforeUnmount(() => {
    destroyEditor();
  });

  return {
    editorRef,
    editor,
    isReady,
    setContent,
    getContent,
    destroyEditor,
  };
}
