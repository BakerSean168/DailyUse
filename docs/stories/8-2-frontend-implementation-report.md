# Story 8-2: Bidirectional Links - Frontend Implementation Report

**Date**: 2025-10-31  
**Status**: 🚧 Frontend Implementation Complete (Phase 1)  
**Progress**: ~75% Total (Backend 100% + Frontend API & Components 75%)

---

## 📊 Implementation Summary

### Phase 1: API Client Extension ✅ COMPLETE

**File**: `apps/web/src/modules/document/api/DocumentApiClient.ts` (+60 lines)

**Added Methods**:
- ✅ `getBacklinks(documentUuid)` - 获取反向引用
- ✅ `getLinkGraph(documentUuid, depth)` - 获取链接图谱
- ✅ `getBrokenLinks()` - 获取断裂链接
- ✅ `repairLink(linkUuid, dto)` - 修复断裂链接
- ✅ `searchDocuments(query, limit)` - 搜索文档标题

**Type Imports**:
```typescript
import { DocumentContracts } from '@dailyuse/contracts';

type BacklinksResponseDTO = DocumentContracts.BacklinksResponseDTO;
type LinkGraphResponseDTO = DocumentContracts.LinkGraphResponseDTO;
type BrokenLinksResponseDTO = DocumentContracts.BrokenLinksResponseDTO;
type RepairLinkRequestDTO = DocumentContracts.RepairLinkRequestDTO;
```

---

### Phase 2: Vue Components ✅ COMPLETE

#### 1. LinkSuggestion.vue (220 lines)
**Purpose**: 链接自动补全下拉框  
**Location**: `apps/web/src/modules/editor/presentation/components/LinkSuggestion.vue`

**Features**:
- ✅ 输入 `[[` 后触发自动补全
- ✅ 模糊搜索文档标题
- ✅ 键盘导航 (↑↓ 选择, Enter 确认, Esc 取消)
- ✅ 显示文档路径和标签
- ✅ 支持创建新文档提示
- ✅ 实时搜索 API 集成

**Props**:
```typescript
interface Props {
  visible: boolean;
  searchQuery: string;
  position: { x: number; y: number };
}
```

**Emits**:
```typescript
emit('select', document);   // 选择文档
emit('close');               // 关闭下拉框
emit('createNew', title);    // 创建新文档
```

**UI Features**:
- Vuetify v-menu 浮动定位
- 加载状态指示器
- 空状态提示
- 键盘快捷键提示

---

#### 2. BacklinkPanel.vue (240 lines)
**Purpose**: 反向引用侧边栏面板  
**Location**: `apps/web/src/modules/editor/presentation/components/BacklinkPanel.vue`

**Features**:
- ✅ 显示所有引用当前文档的文档列表
- ✅ 显示引用上下文（周边文本）
- ✅ 相对时间显示（今天、昨天、X 天前）
- ✅ 点击跳转到源文档
- ✅ 刷新按钮重新加载
- ✅ 空状态提示
- ✅ 断裂链接标记

**Props**:
```typescript
interface Props {
  documentUuid: string;
  autoLoad?: boolean;
}
```

**Emits**:
```typescript
emit('navigate', sourceDocumentUuid);
```

**UI Components**:
- v-card 容器
- v-list 反向引用列表
- v-avatar 文档图标
- v-chip 时间标签和状态标签
- 空状态插画

**Exposed Methods**:
```typescript
defineExpose({
  refresh: loadBacklinks,
});
```

---

#### 3. LinkGraphView.vue (280 lines)
**Purpose**: ECharts 链接图谱可视化  
**Location**: `apps/web/src/modules/editor/presentation/components/LinkGraphView.vue`

**Features**:
- ✅ ECharts 力导向图可视化
- ✅ 深度选择器 (1/2/3 层)
- ✅ 节点大小根据链接数动态调整
- ✅ 当前文档高亮显示
- ✅ 交互式拖拽和缩放
- ✅ 点击节点跳转
- ✅ 图例说明
- ✅ 自动响应窗口大小

**Props**:
```typescript
interface Props {
  documentUuid: string;
  initialDepth?: number;
}
```

**Emits**:
```typescript
emit('close');
emit('nodeClick', nodeUuid);
```

**Graph Config**:
```typescript
{
  type: 'graph',
  layout: 'force',
  roam: true,           // 缩放和平移
  draggable: true,      // 拖拽节点
  force: {
    repulsion: 200,     // 斥力
    gravity: 0.1,       // 引力
    edgeLength: 150,    // 边长
    layoutAnimation: true
  }
}
```

**Node Styling**:
- Current document: 60px, #1976d2 (primary blue)
- Related documents: 40-80px (based on link count), #90caf9 (light blue)
- Label: Show document title

**Statistics Display**:
- Total nodes count
- Total edges count
- Current depth level

---

### Phase 3: Editor Integration (Partial) ⚠️

#### EditorPreview.vue Enhancement (+90 lines)
**Status**: ✅ Link Rendering Complete

**Added Features**:
- ✅ 自定义 Markdown-it 插件解析 `[[title]]` 语法
- ✅ 支持三种链接格式:
  - `[[title]]` - 简单链接
  - `[[title|alias]]` - 别名链接
  - `[[title#section]]` - 锚点链接
- ✅ 渲染为可点击的 `<a>` 标签
- ✅ 特殊样式（蓝色背景高亮）
- ✅ 点击事件触发导航

**New Props**:
```typescript
interface Props {
  content: string;
  onLinkClick?: (title: string) => void;
}
```

**New Emits**:
```typescript
emit('linkClick', title);
```

**Link Styling**:
```css
.internal-link {
  color: #1976d2;
  background-color: rgba(25, 118, 210, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
}

.internal-link:hover {
  background-color: rgba(25, 118, 210, 0.16);
}
```

---

## 🎯 Integration Points

### How to Use in EditorView

```vue
<template>
  <div class="editor-view">
    <!-- Left: Editor with LinkSuggestion -->
    <div class="editor-section">
      <MarkdownEditor
        v-model="content"
        @keydown="handleKeyDown"
      />
      
      <LinkSuggestion
        :visible="showSuggestion"
        :search-query="searchQuery"
        :position="suggestionPosition"
        @select="handleLinkSelect"
        @create-new="handleCreateNew"
        @close="showSuggestion = false"
      />
    </div>

    <!-- Middle: Preview with Link Click -->
    <EditorPreview
      :content="content"
      @link-click="handleLinkClick"
    />

    <!-- Right: Backlink Panel -->
    <BacklinkPanel
      :document-uuid="currentDocumentUuid"
      @navigate="navigateToDocument"
    />

    <!-- Link Graph Dialog -->
    <v-dialog v-model="showGraph" fullscreen>
      <LinkGraphView
        :document-uuid="currentDocumentUuid"
        @close="showGraph = false"
        @node-click="navigateToDocument"
      />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  MarkdownEditor,
  EditorPreview,
  LinkSuggestion,
  BacklinkPanel,
  LinkGraphView,
} from '@/modules/editor/presentation/components';

const content = ref('');
const currentDocumentUuid = ref('');
const showSuggestion = ref(false);
const searchQuery = ref('');
const suggestionPosition = ref({ x: 0, y: 0 });
const showGraph = ref(false);

function handleKeyDown(event: KeyboardEvent) {
  // Detect [[ input pattern
  if (event.key === '[' && content.value.endsWith('[')) {
    showSuggestion.value = true;
    // Calculate cursor position
    suggestionPosition.value = getCursorPosition();
  }
}

function handleLinkSelect(doc: DocumentClientDTO) {
  // Insert [[title]] at cursor
  const linkText = `${doc.title}]]`;
  insertTextAtCursor(linkText);
  showSuggestion.value = false;
}

function handleLinkClick(title: string) {
  // Navigate to document with matching title
  navigateByTitle(title);
}
</script>
```

---

## 📈 Code Statistics

| Component | Lines | Status |
|-----------|-------|--------|
| **API Client Extension** | 60 | ✅ |
| **LinkSuggestion.vue** | 220 | ✅ |
| **BacklinkPanel.vue** | 240 | ✅ |
| **LinkGraphView.vue** | 280 | ✅ |
| **EditorPreview Enhancement** | 90 | ✅ |
| **Component Exports** | 20 | ✅ |
| **Total Frontend** | **910 lines** | **✅** |

---

## ⏸️ Pending Work

### Phase 3: Editor Integration (Remaining)

1. **MarkdownEditor.vue Enhancement** (⏸️ Not Started)
   - Add `[[` input detection
   - Calculate cursor position for LinkSuggestion
   - Insert selected link text at cursor

2. **EditorView Integration** (⏸️ Not Started)
   - Import all new components
   - Setup state management for link suggestion
   - Connect LinkSuggestion to editor keydown events
   - Add BacklinkPanel to sidebar
   - Add "Link Graph" toolbar button

### Phase 4: Testing & Polish (⏸️ Not Started)

1. **Manual Testing**
   - Test `[[` trigger in editor
   - Test link suggestion keyboard navigation
   - Test backlink panel loading
   - Test link graph visualization
   - Test link click navigation in preview

2. **Edge Cases**
   - Empty search results
   - Broken links display
   - Graph with many nodes (performance)
   - Long document titles truncation

3. **Documentation**
   - Component usage examples
   - Integration guide
   - API documentation

---

## 🔧 Technical Highlights

### 1. Markdown-it Custom Plugin
```typescript
md.core.ruler.after('inline', 'bidirectional-links', (state) => {
  // Parse [[title]], [[title|alias]], [[title#section]]
  const linkPattern = /\[\[([^\]|#]+)(?:\|([^\]#]+))?(?:#([^\]]+))?\]\]/g;
  
  // Replace with <a class="internal-link" data-title="...">...</a>
});
```

### 2. ECharts Force Graph Configuration
```typescript
{
  type: 'graph',
  layout: 'force',
  symbolSize: dynamic based on link count,
  force: {
    repulsion: 200,
    edgeLength: 150,
  },
  emphasis: {
    focus: 'adjacency',  // Highlight connected nodes
  }
}
```

### 3. Keyboard Navigation
```typescript
handleKeyDown(event) {
  switch (event.key) {
    case 'ArrowDown': selectedIndex++;
    case 'ArrowUp': selectedIndex--;
    case 'Enter': selectCurrent();
    case 'Escape': close();
  }
}
```

---

## 🎨 UI/UX Features

### LinkSuggestion
- ✅ Floating menu positioned near cursor
- ✅ Max height 400px with scroll
- ✅ Hover highlight
- ✅ Keyboard navigation visual feedback
- ✅ Loading spinner during search
- ✅ Empty state with "Create new" hint

### BacklinkPanel
- ✅ Fixed sidebar layout
- ✅ Scroll for long lists
- ✅ Context preview (2-line clamp)
- ✅ Relative time format (今天, 昨天, X 天前)
- ✅ Empty state illustration
- ✅ Refresh button

### LinkGraphView
- ✅ Fullscreen dialog
- ✅ Depth selector (1/2/3 layers)
- ✅ Interactive graph (zoom, pan, drag)
- ✅ Tooltip on hover
- ✅ Legend for node types
- ✅ Statistics display

### EditorPreview
- ✅ Internal links highlighted with blue background
- ✅ Hover effect
- ✅ Clickable with cursor pointer
- ✅ Smooth transitions

---

## 🐛 Known Issues

1. ⚠️ **Link Resolution**: Current API uses title-based resolution (placeholder implementation)
   - Need to implement `findByTitle()` in DocumentRepository
   - Consider caching for performance

2. ⚠️ **Editor Integration**: MarkdownEditor `[[` detection not yet implemented
   - Need to add keydown event listener
   - Need cursor position calculation

3. ⚠️ **Navigation**: Link click doesn't navigate yet
   - Need to implement `navigateByTitle()` function
   - Need to connect to Vue Router

---

## 📝 Next Steps

### Immediate Priority (2-3 hours)

1. **Complete MarkdownEditor Integration**
   - Add `[[` input detection logic
   - Calculate cursor position for LinkSuggestion placement
   - Implement insertTextAtCursor() method

2. **Complete EditorView Integration**
   - Import all new components
   - Setup state management
   - Connect all event handlers
   - Add toolbar button for Link Graph

3. **Testing**
   - Manual end-to-end testing
   - Fix any UI issues
   - Test on different screen sizes

### Future Enhancements

- 🔄 Real-time collaboration on links
- 🤖 AI-powered link suggestions
- 📊 Link analytics (most referenced docs)
- 🎯 Smart link creation (auto-detect mentions)
- 📱 Mobile-optimized UI

---

## 🎓 Lessons Learned

### Successes
1. ✅ Markdown-it plugin approach is clean and extensible
2. ✅ ECharts provides powerful graph visualization out-of-the-box
3. ✅ Component composition makes features modular and reusable
4. ✅ TypeScript types from contracts ensure type safety

### Challenges
1. ⚠️ Markdown-it custom plugin requires deep understanding of token structure
2. ⚠️ ECharts force graph layout needs tuning for optimal visualization
3. ⚠️ Cursor position calculation in CodeMirror can be complex

### Improvements for Next Session
1. Consider using CodeMirror decorations instead of separate LinkSuggestion component
2. Add debouncing to search API calls
3. Implement link caching to reduce API calls
4. Add E2E tests for critical flows

---

**End of Frontend Implementation Report**  
**Next Session Goal**: Complete Editor Integration + Testing (2-3 hours)  
**Total Progress**: ~75% (Backend 100%, Frontend Components 75%, Integration 25%)

