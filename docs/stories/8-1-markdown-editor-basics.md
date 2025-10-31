# Story 8-1: Markdown 编辑器基础功能

**Story ID**: 8-1  
**Story 标题**: Markdown Editor Basics  
**Epic**: Epic 8 - Editor Module  
**优先级**: P0  
**Story Points**: 8 SP  
**预估时间**: 6-8 小时  
**创建日期**: 2025-10-31  
**状态**: 🚧 In Progress

---

## 📋 Story 描述

实现基于 Monaco Editor 或 CodeMirror 的 Markdown 编辑器，支持实时预览、语法高亮、自动保存等核心功能。

### User Story

```gherkin
作为一个 用户
我想要 使用富文本 Markdown 编辑器编辑文档
以便 获得更好的编辑体验和实时预览
```

---

## 🎯 验收标准

### 功能性验收标准

```gherkin
Scenario: 打开编辑器
  Given 用户已登录系统
  And 用户选择一个文档
  When 用户点击"编辑"按钮
  Then 系统应打开 Markdown 编辑器
  And 编辑器应加载文档内容
  And 编辑器应显示工具栏
  And 编辑器应显示预览面板

Scenario: Markdown 语法高亮
  Given 编辑器已打开
  When 用户输入 Markdown 语法
  Then 系统应实时高亮显示语法元素
  And 支持标题、粗体、斜体、代码块等常见语法

Scenario: 实时预览
  Given 编辑器已打开
  And 预览面板已显示
  When 用户输入或修改 Markdown 内容
  Then 预览面板应实时更新渲染结果
  And 预览应支持滚动同步

Scenario: 自动保存
  Given 编辑器已打开
  And 用户已修改内容
  When 30 秒过去
  Then 系统应自动保存文档
  And 显示"已自动保存"提示

Scenario: 手动保存
  Given 编辑器已打开
  And 用户已修改内容
  When 用户按下 Ctrl+S (或 Cmd+S)
  Then 系统应立即保存文档
  And 显示"保存成功"提示

Scenario: 保存冲突检测
  Given 编辑器已打开
  And 文档已被其他用户或会话修改
  When 用户尝试保存
  Then 系统应检测到冲突
  And 提示用户选择保存策略（覆盖/合并/取消）

Scenario: 插入工具栏
  Given 编辑器已打开
  When 用户点击工具栏按钮（如"标题"、"粗体"、"链接"）
  Then 系统应在光标位置插入对应的 Markdown 语法
  And 如果有选中文本，应包裹选中文本

Scenario: 键盘快捷键
  Given 编辑器已打开
  When 用户按下快捷键（如 Ctrl+B 加粗）
  Then 系统应执行对应的编辑操作
  And 支持常见快捷键（加粗、斜体、代码、链接等）
```

---

## 🏗️ 技术实施方案

### Phase 1: Frontend - 编辑器组件 (4 hours)

#### 1.1 选择编辑器库

**选项对比**:

| 特性 | Monaco Editor | CodeMirror 6 | Recommendation |
|------|---------------|--------------|----------------|
| **体积** | ~2MB | ~500KB | CodeMirror 更轻量 |
| **功能** | VS Code 级别 | 灵活扩展 | Monaco 更强大 |
| **Markdown** | 需要自定义 | 官方支持 | CodeMirror 更适合 |
| **性能** | 大文件优秀 | 轻量快速 | 都很好 |
| **社区** | Microsoft | 活跃社区 | 都成熟 |

**决策**: 使用 **CodeMirror 6** (轻量、专为 Markdown 优化)

#### 1.2 安装依赖

```bash
pnpm add @codemirror/view @codemirror/state @codemirror/commands
pnpm add @codemirror/language @codemirror/lang-markdown
pnpm add @codemirror/theme-one-dark
pnpm add markdown-it
```

#### 1.3 目录结构 (DDD)

```
apps/web/src/modules/editor/
├── infrastructure/
│   └── codemirror/
│       ├── extensions.ts           # CodeMirror 扩展配置
│       └── theme.ts                # 自定义主题
├── presentation/
│   ├── components/
│   │   ├── MarkdownEditor.vue      # 编辑器主组件
│   │   ├── EditorToolbar.vue       # 工具栏
│   │   ├── EditorPreview.vue       # 预览面板
│   │   └── EditorSplitView.vue     # 分屏布局
│   ├── composables/
│   │   ├── useMarkdownEditor.ts    # 编辑器状态管理
│   │   └── useAutoSave.ts          # 自动保存逻辑
│   └── views/
│       └── EditorView.vue          # 编辑器页面
└── README.md
```

#### 1.4 核心组件实现

**MarkdownEditor.vue** (~200 lines):
- CodeMirror 6 集成
- Markdown 语法高亮
- 键盘快捷键
- 扩展配置（行号、折叠、自动补全等）

**EditorToolbar.vue** (~150 lines):
- 格式化按钮（标题、粗体、斜体、代码等）
- 插入操作（链接、图片、表格、代码块）
- 保存按钮
- 全屏切换

**EditorPreview.vue** (~120 lines):
- Markdown-it 渲染
- 实时更新
- 滚动同步
- 代码高亮（highlight.js）

**EditorSplitView.vue** (~100 lines):
- 左右分屏布局
- 可调整分割线
- 预览/编辑/分屏模式切换

### Phase 2: Frontend - Composables (2 hours)

#### 2.1 useMarkdownEditor Composable (~180 lines)

**功能**:
- 编辑器实例管理
- 内容状态管理
- 工具栏操作方法
- 快捷键绑定

**API**:
```typescript
const {
  // 编辑器实例
  editorView,
  editorState,
  
  // 内容状态
  content,
  hasUnsavedChanges,
  
  // 操作方法
  insertText,
  wrapSelection,
  formatText,
  undo,
  redo,
  
  // 工具栏操作
  insertHeading,
  insertBold,
  insertItalic,
  insertCode,
  insertLink,
  insertImage,
  insertTable,
  insertCodeBlock,
} = useMarkdownEditor(initialContent);
```

#### 2.2 useAutoSave Composable (~100 lines)

**功能**:
- 自动保存定时器
- 保存状态管理
- 冲突检测
- 保存策略选择

**API**:
```typescript
const {
  // 保存状态
  isSaving,
  lastSaved,
  saveStatus, // 'idle' | 'saving' | 'saved' | 'error' | 'conflict'
  
  // 操作方法
  save,
  enableAutoSave,
  disableAutoSave,
  
  // 冲突处理
  conflictData,
  resolveConflict,
} = useAutoSave(documentUuid, content);
```

### Phase 3: Backend - 保存冲突检测 (2 hours)

#### 3.1 Document Entity 扩展

**文件**: `apps/api/src/domain/document/Document.ts`

```typescript
// 新增字段
private lastEditedAt: Date;
private editSessionId: string;

// 新增方法
public checkEditConflict(editSessionId: string, lastEditedAt: Date): boolean {
  return this.editSessionId !== editSessionId && 
         this.lastEditedAt > lastEditedAt;
}

public updateWithConflictCheck(
  content: string,
  editSessionId: string,
  lastEditedAt: Date
): void {
  if (this.checkEditConflict(editSessionId, lastEditedAt)) {
    throw new DomainException('EDIT_CONFLICT', '文档已被其他用户修改');
  }
  this.content = content;
  this.lastEditedAt = new Date();
  this.editSessionId = editSessionId;
}
```

#### 3.2 API Endpoint 扩展

**文件**: `apps/api/src/presentation/http/document/DocumentController.ts`

```typescript
@Patch(':uuid/save')
@UseGuards(JwtAuthGuard)
async saveDocument(
  @Param('uuid') uuid: string,
  @Body() dto: SaveDocumentDTO,
  @CurrentUser() user: UserPayload,
) {
  try {
    await this.documentApplicationService.saveWithConflictCheck(
      uuid,
      dto.content,
      dto.editSessionId,
      dto.lastEditedAt,
      user.accountUuid,
    );
    return { success: true, message: '保存成功' };
  } catch (error) {
    if (error.code === 'EDIT_CONFLICT') {
      return {
        success: false,
        conflict: true,
        currentVersion: error.data,
        message: '文档已被其他用户修改',
      };
    }
    throw error;
  }
}
```

#### 3.3 Contracts

**文件**: `packages/contracts/src/modules/document.contracts.ts`

```typescript
export interface SaveDocumentDTO {
  content: string;
  editSessionId: string;
  lastEditedAt: string; // ISO date
}

export interface SaveDocumentResponseDTO {
  success: boolean;
  conflict?: boolean;
  currentVersion?: {
    content: string;
    lastEditedAt: string;
    editedBy: string;
  };
  message: string;
}
```

---

## 📦 依赖管理

### Frontend 新增依赖

```json
{
  "dependencies": {
    "@codemirror/view": "^6.23.0",
    "@codemirror/state": "^6.4.0",
    "@codemirror/commands": "^6.3.3",
    "@codemirror/language": "^6.10.0",
    "@codemirror/lang-markdown": "^6.2.4",
    "@codemirror/theme-one-dark": "^6.1.2",
    "markdown-it": "^14.0.0",
    "highlight.js": "^11.9.0"
  }
}
```

### Backend 无新增依赖

---

## 📊 工作量估算

| Phase | 任务 | 预估时间 |
|-------|------|----------|
| **Phase 1** | 编辑器组件实现 | 4 hours |
| - | MarkdownEditor.vue | 1.5 hours |
| - | EditorToolbar.vue | 1 hour |
| - | EditorPreview.vue | 0.5 hours |
| - | EditorSplitView.vue | 0.5 hours |
| - | 路由与集成 | 0.5 hours |
| **Phase 2** | Composables 实现 | 2 hours |
| - | useMarkdownEditor | 1 hour |
| - | useAutoSave | 1 hour |
| **Phase 3** | Backend 冲突检测 | 2 hours |
| - | Document Entity 扩展 | 0.5 hours |
| - | API Endpoint | 1 hour |
| - | Contracts | 0.5 hours |
| **总计** | | **8 hours** |

---

## 🧪 测试策略

### Unit Tests
- [ ] useMarkdownEditor composable tests
- [ ] useAutoSave composable tests
- [ ] Toolbar 操作测试

### Integration Tests
- [ ] 保存冲突检测 API 测试
- [ ] 自动保存流程测试

### E2E Tests
- [ ] 编辑器打开与关闭
- [ ] 内容编辑与保存
- [ ] 冲突检测与解决

---

## 📝 相关文档

- [PRD - Editor 模块](../PRD-PRODUCT-REQUIREMENTS.md#9-editor-编辑器模块)
- [Epic 8 Context](../epic-8-context.md)
- [CodeMirror 6 文档](https://codemirror.net/docs/)
- [Markdown-it 文档](https://markdown-it.github.io/)

---

## 🚀 实施顺序

1. ✅ 创建 Story 文档
2. ⏸️ 安装 CodeMirror 依赖
3. ⏸️ 实现 MarkdownEditor 组件
4. ⏸️ 实现 EditorToolbar 组件
5. ⏸️ 实现 EditorPreview 组件
6. ⏸️ 实现 useMarkdownEditor composable
7. ⏸️ 实现 useAutoSave composable
8. ⏸️ Backend 冲突检测实现
9. ⏸️ 集成测试
10. ⏸️ E2E 测试

---

**创建时间**: 2025-10-31  
**最后更新**: 2025-10-31  
**负责人**: Development Team
