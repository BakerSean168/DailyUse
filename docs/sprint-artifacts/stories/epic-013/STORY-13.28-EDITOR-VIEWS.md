# Story 13.28: Editor Views 和路由集成

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.28 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 3: 内容模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 3h |
| 前置依赖 | Story 13.27 (Editor UI) |
| 关联模块 | Editor |

## 目标

实现 Editor 模块的 Views 页面和路由集成，完成 Editor 模块的整体架构。

## 任务列表

### 1. 创建 EditorPage 视图 (1.5h)
- [ ] 整合所有 Editor 组件
- [ ] 实现侧边栏（文件树、最近文件）
- [ ] 实现搜索功能
- [ ] 集成快捷键

### 2. 创建 DraftRecoveryPage 视图 (0.5h)
- [ ] 草稿列表页面
- [ ] 草稿预览
- [ ] 恢复/删除操作

### 3. 路由集成 (0.5h)
- [ ] 配置 Editor 路由
- [ ] 深度链接支持（打开特定文档）

### 4. 模块索引和测试 (0.5h)
- [ ] 创建模块索引文件
- [ ] 编写集成测试

## 技术规范

### EditorPage 视图
```typescript
// renderer/modules/editor/presentation/views/EditorPage.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditorView } from '../components/EditorView';
import { TemplateSelector } from '../components/TemplateSelector';
import { useEditorStore } from '../stores';
import { RecentFiles } from './RecentFiles';
import { EditorSidebar } from './EditorSidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@dailyuse/ui';
import { Plus, FolderOpen } from 'lucide-react';

export const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { createDocument, openDocument, loadDrafts } = useEditorStore();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Handle deep link to open specific document
  useEffect(() => {
    const docUuid = searchParams.get('doc');
    if (docUuid) {
      openDocument(docUuid);
    }
  }, [searchParams, openDocument]);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            setShowTemplateSelector(true);
            break;
          case 'o':
            e.preventDefault();
            // Open file dialog handled by main process
            break;
          case 'b':
            if (!e.shiftKey) return;
            e.preventDefault();
            setShowSidebar((prev) => !prev);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateDocument = useCallback(
    async (templateUuid: string | null) => {
      setShowTemplateSelector(false);
      if (templateUuid) {
        await createDocument({ templateUuid });
      } else {
        await createDocument();
      }
    },
    [createDocument]
  );

  const handleOpenDocument = useCallback(
    (uuid: string) => {
      openDocument(uuid);
    },
    [openDocument]
  );

  return (
    <div className="editor-page h-full">
      <ResizablePanelGroup direction="horizontal">
        {/* Sidebar */}
        {showSidebar && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
              <EditorSidebar
                onNewDocument={() => setShowTemplateSelector(true)}
                onOpenDocument={handleOpenDocument}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Editor Area */}
        <ResizablePanel defaultSize={showSidebar ? 80 : 100}>
          <EditorView />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleCreateDocument}
      />
    </div>
  );
};
```

### EditorSidebar 组件
```typescript
// renderer/modules/editor/presentation/views/EditorSidebar.tsx
import React, { useState } from 'react';
import { useEditorStore } from '../stores';
import { Button, Input, ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui';
import { Plus, Clock, FileText, Search, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface EditorSidebarProps {
  onNewDocument: () => void;
  onOpenDocument: (uuid: string) => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  onNewDocument,
  onOpenDocument,
}) => {
  const { drafts, recoverDraft, deleteDraft } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="editor-sidebar flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="p-3 border-b">
        <Button
          onClick={onNewDocument}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建文档
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文档..."
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="recent" className="flex-1">
            <Clock className="w-4 h-4 mr-1" />
            最近
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex-1">
            <FileText className="w-4 h-4 mr-1" />
            草稿
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Recent Files Tab */}
          <TabsContent value="recent" className="p-0 m-0">
            <RecentFilesList
              onOpen={onOpenDocument}
              searchQuery={searchQuery}
            />
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="p-0 m-0">
            <div className="p-2">
              {drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  没有草稿
                </p>
              ) : (
                <ul className="space-y-1">
                  {drafts.map((draft) => (
                    <li
                      key={draft.uuid}
                      className="p-2 rounded-md hover:bg-muted/50 group"
                    >
                      <div className="flex items-start justify-between">
                        <button
                          className="text-left flex-1"
                          onClick={() => recoverDraft(draft.uuid)}
                        >
                          <p className="text-sm font-medium truncate">
                            {draft.title || '未命名草稿'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(draft.savedAt, {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </p>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDraft(draft.uuid)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

// Recent Files List Component
const RecentFilesList: React.FC<{
  onOpen: (uuid: string) => void;
  searchQuery: string;
}> = ({ onOpen, searchQuery }) => {
  // This would come from an IPC call to get recent files
  const recentFiles: Array<{
    uuid: string;
    title: string;
    updatedAt: Date;
  }> = [];

  const filteredFiles = recentFiles.filter((file) =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-2">
      {filteredFiles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {searchQuery ? '没有匹配的文件' : '没有最近文件'}
        </p>
      ) : (
        <ul className="space-y-1">
          {filteredFiles.map((file) => (
            <li key={file.uuid}>
              <button
                onClick={() => onOpen(file.uuid)}
                className="w-full p-2 text-left rounded-md hover:bg-muted/50"
              >
                <p className="text-sm font-medium truncate">{file.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(file.updatedAt, {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### DraftRecoveryPage 视图
```typescript
// renderer/modules/editor/presentation/views/DraftRecoveryPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../stores';
import { Button, Card, CardContent, CardHeader, CardTitle, ScrollArea } from '@dailyuse/ui';
import { FileText, Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const DraftRecoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { drafts, loadDrafts, recoverDraft, deleteDraft } = useEditorStore();
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  useEffect(() => {
    if (selectedDraft) {
      const draft = drafts.find((d) => d.uuid === selectedDraft);
      if (draft) {
        // Load draft content for preview
        setPreviewContent(draft.content || '');
      }
    }
  }, [selectedDraft, drafts]);

  const handleRecover = async (draftUuid: string) => {
    await recoverDraft(draftUuid);
    navigate('/editor');
  };

  const handleDelete = async (draftUuid: string) => {
    await deleteDraft(draftUuid);
    if (selectedDraft === draftUuid) {
      setSelectedDraft(null);
      setPreviewContent('');
    }
  };

  return (
    <div className="draft-recovery-page h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-xl font-semibold">草稿恢复</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Draft List */}
        <div className="w-80 border-r">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {drafts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">没有保存的草稿</p>
                </div>
              ) : (
                drafts.map((draft) => (
                  <Card
                    key={draft.uuid}
                    className={`cursor-pointer transition-colors ${
                      selectedDraft === draft.uuid
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedDraft(draft.uuid)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm">
                            {draft.title || '未命名草稿'}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(draft.savedAt, {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col">
          {selectedDraft ? (
            <>
              {/* Preview Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="font-medium">
                    {drafts.find((d) => d.uuid === selectedDraft)?.title ||
                      '未命名草稿'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    保存于{' '}
                    {format(
                      drafts.find((d) => d.uuid === selectedDraft)?.savedAt ||
                        new Date(),
                      'yyyy-MM-dd HH:mm:ss',
                      { locale: zhCN }
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(selectedDraft)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </Button>
                  <Button onClick={() => handleRecover(selectedDraft)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    恢复
                  </Button>
                </div>
              </div>

              {/* Preview Content */}
              <ScrollArea className="flex-1 p-4">
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">
                    {previewContent}
                  </pre>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">选择一个草稿查看预览</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 路由配置
```typescript
// renderer/modules/editor/routes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { EditorPage } from './presentation/views/EditorPage';
import { DraftRecoveryPage } from './presentation/views/DraftRecoveryPage';

export const editorRoutes: RouteObject[] = [
  {
    path: '/editor',
    element: <EditorPage />,
  },
  {
    path: '/editor/drafts',
    element: <DraftRecoveryPage />,
  },
];
```

### 模块索引
```typescript
// renderer/modules/editor/index.ts
// Infrastructure
export { editorIPCClient, type EditorIPCClient } from './infrastructure/ipc';
export type {
  EditorDocument,
  CreateDocumentOptions,
  DraftInfo,
  DocumentTemplate,
  AutoSaveConfig,
} from './infrastructure/ipc';

// Presentation - Stores
export { useEditorStore } from './presentation/stores';

// Presentation - Components
export {
  EditorView,
  DocumentEditor,
  EditorToolbar,
  DocumentTab,
  SaveIndicator,
  UnsavedDialog,
  TemplateSelector,
} from './presentation/components';

// Presentation - Views
export { EditorPage } from './presentation/views/EditorPage';
export { DraftRecoveryPage } from './presentation/views/DraftRecoveryPage';

// Routes
export { editorRoutes } from './routes';
```

### Views 索引
```typescript
// renderer/modules/editor/presentation/views/index.ts
export { EditorPage } from './EditorPage';
export { EditorSidebar } from './EditorSidebar';
export { DraftRecoveryPage } from './DraftRecoveryPage';
```

### 集成测试
```typescript
// renderer/modules/editor/__tests__/integration.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EditorPage } from '../presentation/views/EditorPage';
import { useEditorStore } from '../presentation/stores';
import { editorIPCClient } from '../infrastructure/ipc';

vi.mock('../infrastructure/ipc');

const mockEditorIPCClient = vi.mocked(editorIPCClient);

const renderWithRouter = (ui: React.ReactElement, initialRoute = '/editor') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {ui}
    </MemoryRouter>
  );
};

describe('Editor Module Integration', () => {
  beforeEach(() => {
    useEditorStore.getState().reset?.();
    vi.clearAllMocks();
  });

  describe('EditorPage', () => {
    it('should show empty state when no documents open', async () => {
      mockEditorIPCClient.listDrafts.mockResolvedValue([]);
      
      renderWithRouter(<EditorPage />);

      await waitFor(() => {
        expect(screen.getByText('没有打开的文档')).toBeInTheDocument();
      });
    });

    it('should create new document when clicking new button', async () => {
      const user = userEvent.setup();
      const newDoc = {
        uuid: 'new-doc-uuid',
        title: '未命名文档',
        content: '',
        isDirty: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEditorIPCClient.listDrafts.mockResolvedValue([]);
      mockEditorIPCClient.createDocument.mockResolvedValue(newDoc);

      renderWithRouter(<EditorPage />);

      const newButton = await screen.findByText('新建文档');
      await user.click(newButton);

      // Template selector should appear
      await waitFor(() => {
        expect(screen.getByText('选择模板')).toBeInTheDocument();
      });
    });

    it('should open document from deep link', async () => {
      const doc = {
        uuid: 'test-doc-uuid',
        title: '测试文档',
        content: '# Hello',
        isDirty: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEditorIPCClient.listDrafts.mockResolvedValue([]);
      mockEditorIPCClient.openDocument.mockResolvedValue(doc);

      renderWithRouter(<EditorPage />, '/editor?doc=test-doc-uuid');

      await waitFor(() => {
        expect(mockEditorIPCClient.openDocument).toHaveBeenCalledWith('test-doc-uuid');
      });
    });
  });

  describe('Document Editing', () => {
    it('should save document with keyboard shortcut', async () => {
      const user = userEvent.setup();
      const doc = {
        uuid: 'doc-uuid',
        title: '测试文档',
        content: '内容',
        isDirty: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up initial state
      useEditorStore.setState({
        openDocuments: [doc],
        activeDocumentUuid: doc.uuid,
      });

      mockEditorIPCClient.saveDocument.mockResolvedValue(undefined);

      renderWithRouter(<EditorPage />);

      // Trigger Ctrl+S
      await user.keyboard('{Control>}s{/Control}');

      await waitFor(() => {
        expect(mockEditorIPCClient.saveDocument).toHaveBeenCalledWith('doc-uuid');
      });
    });
  });
});
```

## 验收标准

- [ ] EditorPage 正确渲染
- [ ] 侧边栏显示/隐藏切换正常
- [ ] 最近文件列表显示
- [ ] 草稿列表显示
- [ ] 搜索功能正常工作
- [ ] 深度链接打开文档正常
- [ ] DraftRecoveryPage 正常工作
- [ ] 路由配置正确
- [ ] 键盘快捷键正常工作
- [ ] 集成测试通过
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/editor/presentation/views/EditorPage.tsx`
- `renderer/modules/editor/presentation/views/EditorSidebar.tsx`
- `renderer/modules/editor/presentation/views/DraftRecoveryPage.tsx`
- `renderer/modules/editor/presentation/views/index.ts`
- `renderer/modules/editor/routes.tsx`
- `renderer/modules/editor/index.ts`
- `renderer/modules/editor/__tests__/integration.test.tsx`
