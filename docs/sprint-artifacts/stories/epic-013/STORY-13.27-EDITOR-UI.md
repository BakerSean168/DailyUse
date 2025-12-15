# Story 13.27: Editor UI 组件实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.27 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 3: 内容模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.26 (Editor Store) |
| 关联模块 | Editor |

## 目标

实现 Editor 模块的 UI 组件，包括文档编辑器、工具栏、标签页管理等。

## 任务列表

### 1. 创建 EditorView 主组件 (2h)
- [ ] 实现多标签页布局
- [ ] 文档标签切换
- [ ] 关闭未保存文档提示
- [ ] 空状态显示

### 2. 创建 DocumentEditor 组件 (2h)
- [ ] 集成 Markdown 编辑器
- [ ] 实时预览模式
- [ ] 快捷键支持
- [ ] 自动保存指示器

### 3. 创建 EditorToolbar 组件 (1h)
- [ ] 格式化工具按钮
- [ ] 保存/撤销/重做按钮
- [ ] 预览切换按钮
- [ ] 更多操作下拉菜单

### 4. 创建辅助组件 (1h)
- [ ] `DocumentTab` 组件
- [ ] `SaveIndicator` 组件
- [ ] `UnsavedDialog` 组件
- [ ] `TemplateSelector` 组件

## 技术规范

### EditorView 主组件
```typescript
// renderer/modules/editor/presentation/components/EditorView.tsx
import React, { useCallback, useState } from 'react';
import { useEditorStore } from '../stores';
import { DocumentTab } from './DocumentTab';
import { DocumentEditor } from './DocumentEditor';
import { UnsavedDialog } from './UnsavedDialog';
import { EmptyState } from '@dailyuse/ui';
import { FileText, Plus } from 'lucide-react';

export const EditorView: React.FC = () => {
  const {
    openDocuments,
    activeDocumentUuid,
    createDocument,
    closeDocument,
    setActiveDocument,
    getActiveDocument,
  } = useEditorStore();
  
  const [closingTab, setClosingTab] = useState<string | null>(null);
  const activeDoc = getActiveDocument();

  const handleNewDocument = useCallback(async () => {
    await createDocument();
  }, [createDocument]);

  const handleTabClose = useCallback(async (uuid: string) => {
    const doc = openDocuments.find((d) => d.uuid === uuid);
    if (doc?.isDirty) {
      setClosingTab(uuid);
      return;
    }
    await closeDocument(uuid);
  }, [openDocuments, closeDocument]);

  const handleConfirmClose = useCallback(async (save: boolean) => {
    if (!closingTab) return;
    
    if (save) {
      const store = useEditorStore.getState();
      await store.saveDocument(closingTab);
    }
    await closeDocument(closingTab, true);
    setClosingTab(null);
  }, [closingTab, closeDocument]);

  const handleCancelClose = useCallback(() => {
    setClosingTab(null);
  }, []);

  if (openDocuments.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="没有打开的文档"
        description="创建一个新文档或从最近文件中选择"
        action={{
          label: '新建文档',
          icon: Plus,
          onClick: handleNewDocument,
        }}
      />
    );
  }

  return (
    <div className="editor-view flex flex-col h-full">
      {/* Tab Bar */}
      <div className="editor-tabs flex items-center bg-muted/50 border-b">
        {openDocuments.map((doc) => (
          <DocumentTab
            key={doc.uuid}
            document={doc}
            isActive={doc.uuid === activeDocumentUuid}
            onSelect={() => setActiveDocument(doc.uuid)}
            onClose={() => handleTabClose(doc.uuid)}
          />
        ))}
        <button
          onClick={handleNewDocument}
          className="p-2 hover:bg-muted rounded-md ml-1"
          aria-label="新建文档"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {activeDoc && (
          <DocumentEditor document={activeDoc} key={activeDoc.uuid} />
        )}
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedDialog
        isOpen={!!closingTab}
        documentTitle={
          openDocuments.find((d) => d.uuid === closingTab)?.title ?? '未命名文档'
        }
        onSave={() => handleConfirmClose(true)}
        onDiscard={() => handleConfirmClose(false)}
        onCancel={handleCancelClose}
      />
    </div>
  );
};
```

### DocumentEditor 组件
```typescript
// renderer/modules/editor/presentation/components/DocumentEditor.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { SaveIndicator } from './SaveIndicator';
import { useEditorStore, type EditorDocument } from '../stores';
import { useDebounce } from '@dailyuse/ui';

interface DocumentEditorProps {
  document: EditorDocument;
}

type EditorMode = 'edit' | 'preview' | 'split';

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ document }) => {
  const [mode, setMode] = useState<EditorMode>('edit');
  const [localContent, setLocalContent] = useState(document.content);
  const { updateContent, saveDocument, autoSaveConfig } = useEditorStore();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  // Debounce content updates
  const debouncedContent = useDebounce(localContent, 300);

  // Update store when debounced content changes
  useEffect(() => {
    if (debouncedContent !== document.content) {
      updateContent(document.uuid, debouncedContent);
    }
  }, [debouncedContent, document.uuid, document.content, updateContent]);

  // Auto-save timer
  useEffect(() => {
    if (!autoSaveConfig.enabled || !document.isDirty) return;

    const timer = setInterval(() => {
      if (document.isDirty) {
        saveDocument(document.uuid);
      }
    }, autoSaveConfig.intervalMs);

    return () => clearInterval(timer);
  }, [autoSaveConfig, document.isDirty, document.uuid, saveDocument]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveDocument(document.uuid);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document.uuid, saveDocument]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalContent(e.target.value);
    },
    []
  );

  const handleFormat = useCallback((format: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    let newText = '';
    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'code':
        newText = `\`${selectedText}\``;
        break;
      case 'heading':
        newText = `## ${selectedText}`;
        break;
      case 'link':
        newText = `[${selectedText}](url)`;
        break;
      case 'list':
        newText = selectedText
          .split('\n')
          .map((line) => `- ${line}`)
          .join('\n');
        break;
      default:
        return;
    }

    const newContent = value.substring(0, selectionStart) + newText + value.substring(selectionEnd);
    setLocalContent(newContent);
    
    // Restore cursor position
    requestAnimationFrame(() => {
      textarea.setSelectionRange(selectionStart + newText.length, selectionStart + newText.length);
      textarea.focus();
    });
  }, []);

  return (
    <div className="document-editor flex flex-col h-full">
      <EditorToolbar
        mode={mode}
        onModeChange={setMode}
        onFormat={handleFormat}
        onSave={() => saveDocument(document.uuid)}
        isSaving={false}
        isDirty={document.isDirty}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Edit Pane */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`flex-1 ${mode === 'split' ? 'border-r' : ''}`}>
            <textarea
              ref={editorRef}
              value={localContent}
              onChange={handleContentChange}
              className="w-full h-full p-4 resize-none focus:outline-none font-mono text-sm bg-background"
              placeholder="开始输入..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview Pane */}
        {(mode === 'preview' || mode === 'split') && (
          <div className="flex-1 p-4 overflow-auto prose dark:prose-invert max-w-none">
            <MarkdownPreview content={localContent} />
          </div>
        )}
      </div>

      <SaveIndicator
        isDirty={document.isDirty}
        lastSaved={document.updatedAt}
        autoSaveEnabled={autoSaveConfig.enabled}
      />
    </div>
  );
};

// Simple Markdown Preview (can be replaced with a richer renderer)
const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  // Use marked or similar library for real implementation
  return (
    <div
      className="markdown-preview"
      dangerouslySetInnerHTML={{
        __html: content
          .replace(/^### (.+)/gm, '<h3>$1</h3>')
          .replace(/^## (.+)/gm, '<h2>$1</h2>')
          .replace(/^# (.+)/gm, '<h1>$1</h1>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code>$1</code>')
          .replace(/\n/g, '<br />'),
      }}
    />
  );
};
```

### EditorToolbar 组件
```typescript
// renderer/modules/editor/presentation/components/EditorToolbar.tsx
import React from 'react';
import { Button, Tooltip } from '@dailyuse/ui';
import {
  Bold,
  Italic,
  Code,
  Heading,
  Link,
  List,
  Save,
  Eye,
  Edit3,
  Columns,
  MoreHorizontal,
} from 'lucide-react';

type EditorMode = 'edit' | 'preview' | 'split';

interface EditorToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onFormat: (format: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  mode,
  onModeChange,
  onFormat,
  onSave,
  isSaving,
  isDirty,
}) => {
  const formatButtons = [
    { icon: Bold, format: 'bold', tooltip: '粗体 (Ctrl+B)' },
    { icon: Italic, format: 'italic', tooltip: '斜体 (Ctrl+I)' },
    { icon: Code, format: 'code', tooltip: '代码' },
    { icon: Heading, format: 'heading', tooltip: '标题' },
    { icon: Link, format: 'link', tooltip: '链接' },
    { icon: List, format: 'list', tooltip: '列表' },
  ];

  const modeButtons = [
    { icon: Edit3, mode: 'edit' as EditorMode, tooltip: '编辑' },
    { icon: Columns, mode: 'split' as EditorMode, tooltip: '分屏' },
    { icon: Eye, mode: 'preview' as EditorMode, tooltip: '预览' },
  ];

  return (
    <div className="editor-toolbar flex items-center gap-2 p-2 border-b bg-muted/30">
      {/* Format Buttons */}
      <div className="flex items-center gap-1">
        {formatButtons.map(({ icon: Icon, format, tooltip }) => (
          <Tooltip key={format} content={tooltip}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormat(format)}
              disabled={mode === 'preview'}
            >
              <Icon className="w-4 h-4" />
            </Button>
          </Tooltip>
        ))}
      </div>

      <div className="h-4 w-px bg-border mx-2" />

      {/* Mode Toggle */}
      <div className="flex items-center gap-1">
        {modeButtons.map(({ icon: Icon, mode: m, tooltip }) => (
          <Tooltip key={m} content={tooltip}>
            <Button
              variant={mode === m ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange(m)}
            >
              <Icon className="w-4 h-4" />
            </Button>
          </Tooltip>
        ))}
      </div>

      <div className="flex-1" />

      {/* Save Button */}
      <Tooltip content="保存 (Ctrl+S)">
        <Button
          variant={isDirty ? 'default' : 'ghost'}
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
        >
          <Save className="w-4 h-4 mr-1" />
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </Tooltip>

      {/* More Actions */}
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </div>
  );
};
```

### DocumentTab 组件
```typescript
// renderer/modules/editor/presentation/components/DocumentTab.tsx
import React from 'react';
import { X, Circle } from 'lucide-react';
import type { EditorDocument } from '../stores';

interface DocumentTabProps {
  document: EditorDocument;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export const DocumentTab: React.FC<DocumentTabProps> = ({
  document,
  isActive,
  onSelect,
  onClose,
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className={`
        document-tab flex items-center gap-2 px-3 py-2 cursor-pointer
        border-r border-b-2 transition-colors
        ${isActive
          ? 'bg-background border-b-primary'
          : 'bg-muted/30 border-b-transparent hover:bg-muted/50'
        }
      `}
      onClick={onSelect}
    >
      {/* Dirty Indicator */}
      {document.isDirty && (
        <Circle className="w-2 h-2 fill-orange-500 text-orange-500" />
      )}
      
      {/* Title */}
      <span className="text-sm truncate max-w-[150px]">
        {document.title || '未命名文档'}
      </span>
      
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="p-0.5 rounded hover:bg-muted-foreground/20"
        aria-label="关闭文档"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
```

### SaveIndicator 组件
```typescript
// renderer/modules/editor/presentation/components/SaveIndicator.tsx
import React from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface SaveIndicatorProps {
  isDirty: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  isDirty,
  lastSaved,
  autoSaveEnabled,
}) => {
  return (
    <div className="save-indicator flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground border-t bg-muted/30">
      {isDirty ? (
        <>
          <CloudOff className="w-3 h-3" />
          <span>有未保存的更改</span>
        </>
      ) : (
        <>
          <Cloud className="w-3 h-3 text-green-500" />
          <span>
            {lastSaved
              ? `上次保存: ${formatDistanceToNow(lastSaved, { addSuffix: true, locale: zhCN })}`
              : '已保存'}
          </span>
        </>
      )}
      
      {autoSaveEnabled && (
        <span className="ml-auto">自动保存已启用</span>
      )}
    </div>
  );
};
```

### UnsavedDialog 组件
```typescript
// renderer/modules/editor/presentation/components/UnsavedDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui';
import { Button } from '@dailyuse/ui';

interface UnsavedDialogProps {
  isOpen: boolean;
  documentTitle: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedDialog: React.FC<UnsavedDialogProps> = ({
  isOpen,
  documentTitle,
  onSave,
  onDiscard,
  onCancel,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>未保存的更改</DialogTitle>
          <DialogDescription>
            文档 "{documentTitle}" 有未保存的更改。你想要保存吗？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            不保存
          </Button>
          <Button onClick={onSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### TemplateSelector 组件
```typescript
// renderer/modules/editor/presentation/components/TemplateSelector.tsx
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui';
import { useEditorStore } from '../stores';
import { FileText, FileCode, ListTodo, BookOpen } from 'lucide-react';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateUuid: string | null) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { templates, loadTemplates } = useEditorStore();

  useEffect(() => {
    if (isOpen && templates.length === 0) {
      loadTemplates();
    }
  }, [isOpen, templates.length, loadTemplates]);

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'note':
        return FileText;
      case 'code':
        return FileCode;
      case 'todo':
        return ListTodo;
      case 'journal':
        return BookOpen;
      default:
        return FileText;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>选择模板</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Blank Document */}
          <button
            onClick={() => onSelect(null)}
            className="p-4 border rounded-lg hover:bg-muted/50 text-left"
          >
            <FileText className="w-8 h-8 mb-2 text-muted-foreground" />
            <h4 className="font-medium">空白文档</h4>
            <p className="text-sm text-muted-foreground">从头开始创建</p>
          </button>

          {/* Templates */}
          {templates.map((template) => {
            const Icon = getTemplateIcon(template.type);
            return (
              <button
                key={template.uuid}
                onClick={() => onSelect(template.uuid)}
                className="p-4 border rounded-lg hover:bg-muted/50 text-left"
              >
                <Icon className="w-8 h-8 mb-2 text-muted-foreground" />
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 索引文件
```typescript
// renderer/modules/editor/presentation/components/index.ts
export { EditorView } from './EditorView';
export { DocumentEditor } from './DocumentEditor';
export { EditorToolbar } from './EditorToolbar';
export { DocumentTab } from './DocumentTab';
export { SaveIndicator } from './SaveIndicator';
export { UnsavedDialog } from './UnsavedDialog';
export { TemplateSelector } from './TemplateSelector';
```

## 验收标准

- [ ] 多标签页文档管理正常
- [ ] 文档编辑实时响应
- [ ] 格式化工具按钮正常工作
- [ ] 预览模式正确渲染 Markdown
- [ ] 分屏模式同步滚动
- [ ] 未保存提示对话框正常工作
- [ ] 快捷键正常工作 (Ctrl+S)
- [ ] 自动保存指示器显示正确
- [ ] 模板选择器功能正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/editor/presentation/components/EditorView.tsx`
- `renderer/modules/editor/presentation/components/DocumentEditor.tsx`
- `renderer/modules/editor/presentation/components/EditorToolbar.tsx`
- `renderer/modules/editor/presentation/components/DocumentTab.tsx`
- `renderer/modules/editor/presentation/components/SaveIndicator.tsx`
- `renderer/modules/editor/presentation/components/UnsavedDialog.tsx`
- `renderer/modules/editor/presentation/components/TemplateSelector.tsx`
- `renderer/modules/editor/presentation/components/index.ts`
