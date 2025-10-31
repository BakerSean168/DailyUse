# Story 8-2: Bidirectional Links (双向链接)

**Epic**: Epic 8 - Editor Module (Markdown 编辑器)  
**Story Points**: 13 SP  
**Priority**: High  
**Status**: In Progress  
**Created**: 2025-10-31  

---

## 📋 Story Description

### User Story
**作为** 知识管理用户  
**我想要** 在 Markdown 文档中创建文档之间的双向链接  
**以便** 快速导航相关文档，并自动查看反向链接（backlinks）

### Business Value
- 构建知识图谱，连接相关文档
- 自动发现文档之间的关系（反向链接）
- 提升知识检索效率
- 支持 Zettelkasten 笔记方法

---

## �� Acceptance Criteria

### AC1: Link Syntax Parsing
**Given** 用户在编辑器中输入 `[[document-title]]`  
**When** 编辑器解析内容  
**Then** 系统识别为文档链接并创建 document_links 记录

### AC2: Link Auto-Complete
**Given** 用户输入 `[[`  
**When** 编辑器弹出文档标题建议列表  
**Then** 用户可以选择现有文档或创建新文档

### AC3: Link Preview on Hover
**Given** 文档预览模式显示链接  
**When** 用户鼠标悬停在链接上  
**Then** 显示目标文档的摘要预览

### AC4: Backlinks Display
**Given** 文档 A 链接到文档 B  
**When** 用户查看文档 B  
**Then** 侧边栏显示"被链接"列表，包含文档 A

### AC5: Link Navigation
**Given** 预览模式显示链接  
**When** 用户点击链接  
**Then** 跳转到目标文档编辑页面

### AC6: Broken Link Detection
**Given** 文档 A 链接到已删除的文档 B  
**When** 系统扫描链接  
**Then** 标记为失效链接，提示用户修复或删除

### AC7: Link Graph Visualization
**Given** 用户查看文档关系  
**When** 打开链接图谱视图  
**Then** 以节点-边图显示文档之间的链接关系

---

## 🏗️ Technical Design

### Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
├─────────────────────────────────────────────────────────┤
│ LinkSuggestion.vue    │ BacklinkPanel.vue               │
│ LinkPreviewPopup.vue  │ LinkGraphView.vue               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
├─────────────────────────────────────────────────────────┤
│ DocumentLinkApplicationService                           │
│  - createLink()                                          │
│  - getBacklinks()                                        │
│  - getLinkGraph()                                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     Domain Layer                         │
├─────────────────────────────────────────────────────────┤
│ DocumentLink (Aggregate)                                 │
│  - sourceDocumentUuid                                    │
│  - targetDocumentUuid                                    │
│  - linkText                                              │
│  - linkPosition                                          │
│  - isBroken                                              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                     │
├─────────────────────────────────────────────────────────┤
│ DocumentLinkRepository (PostgreSQL)                      │
│ LinkParser (Markdown 解析器)                              │
└─────────────────────────────────────────────────────────┘
```

### Link Syntax
- **Internal Link**: `[[document-title]]`
- **With Alias**: `[[document-title|display text]]`
- **With Anchor**: `[[document-title#section]]`

### Database Schema
```sql
CREATE TABLE document_links (
  uuid UUID PRIMARY KEY,
  source_document_uuid UUID NOT NULL REFERENCES documents(uuid),
  target_document_uuid UUID REFERENCES documents(uuid),
  link_text VARCHAR(200) NOT NULL,
  link_position INTEGER NOT NULL,  -- 链接在源文档中的字符位置
  is_broken BOOLEAN DEFAULT FALSE,  -- 目标文档被删除
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  
  INDEX idx_source_document (source_document_uuid),
  INDEX idx_target_document (target_document_uuid)
);
```

---

## 📝 Implementation Plan

### Phase 1: Backend Foundation (3 hours)

#### Step 1.1: Database Schema (0.5 hours)
- [ ] Create Prisma migration for `document_links` table
- [ ] Add indexes for efficient backlink queries

#### Step 1.2: Domain Layer (1 hour)
- [ ] Create `DocumentLink` aggregate
  - Properties: uuid, sourceDocumentUuid, targetDocumentUuid, linkText, linkPosition, isBroken
  - Methods: markAsBroken(), repair()
- [ ] Create `DocumentLinkRepository` interface

#### Step 1.3: Infrastructure Layer (0.5 hours)
- [ ] Implement `PrismaDocumentLinkRepository`
- [ ] Methods: save(), findBySourceDocument(), findByTargetDocument(), findBrokenLinks()

#### Step 1.4: Application Service (1 hour)
- [ ] Create `DocumentLinkApplicationService`
- [ ] Methods:
  - `createLink(sourceUuid, targetUuid, linkText, position)`
  - `getBacklinks(documentUuid)` - 获取反向链接
  - `getLinkGraph(documentUuid, depth)` - 获取链接图谱
  - `scanBrokenLinks()` - 扫描失效链接

#### Step 1.5: API Endpoints (0.5 hours)
- [ ] `POST /documents/:uuid/links` - 创建链接
- [ ] `GET /documents/:uuid/backlinks` - 获取反向链接
- [ ] `GET /documents/:uuid/link-graph` - 获取链接图谱
- [ ] `GET /documents/links/broken` - 获取失效链接

#### Step 1.6: Contracts (0.5 hours)
- [ ] DocumentLinkDTO interfaces
- [ ] BacklinkResponseDTO
- [ ] LinkGraphNodeDTO, LinkGraphEdgeDTO

---

### Phase 2: Link Parser (2 hours)

#### Step 2.1: Link Parser Service (1 hour)
- [ ] Create `LinkParser` class in infrastructure layer
- [ ] Method: `parseLinks(content: string): ParsedLink[]`
- [ ] Regex: `/\[\[([^\]|#]+)(\|[^\]]+)?(\#[^\]]+)?\]\]/g`
- [ ] Extract: document title, alias, anchor

#### Step 2.2: Link Extraction on Save (1 hour)
- [ ] Update `DocumentApplicationService.saveDocumentWithConflictCheck()`
- [ ] Extract links from content
- [ ] Compare with existing links (add new, remove deleted)
- [ ] Create/update DocumentLink records

---

### Phase 3: Frontend Components (5 hours)

#### Step 3.1: Link Auto-Complete Component (1.5 hours)
- [ ] Create `LinkSuggestion.vue`
- [ ] Detect `[[` input trigger
- [ ] Show dropdown with document title suggestions
- [ ] Filter by title (fuzzy search)
- [ ] Insert selected title on Enter/Click

#### Step 3.2: Link Preview Popup (1 hour)
- [ ] Create `LinkPreviewPopup.vue`
- [ ] Detect hover on `[[...]]` link in preview mode
- [ ] Fetch document excerpt via API
- [ ] Display in floating popup

#### Step 3.3: Backlink Panel (1.5 hours)
- [ ] Create `BacklinkPanel.vue`
- [ ] Display in document detail page sidebar
- [ ] Show list of documents linking to current document
- [ ] Include context snippet (surrounding text)
- [ ] Click to navigate

#### Step 3.4: Link Graph Visualization (1 hour)
- [ ] Create `LinkGraphView.vue`
- [ ] Use ECharts graph layout
- [ ] Nodes: Documents (size = link count)
- [ ] Edges: Links (direction arrows)
- [ ] Interactive: Click node to navigate

---

### Phase 4: Integration & Testing (3 hours)

#### Step 4.1: Editor Integration (1 hour)
- [ ] Integrate `LinkSuggestion` into `MarkdownEditor`
- [ ] Listen for `[[` input
- [ ] Show/hide suggestion dropdown

#### Step 4.2: Preview Integration (1 hour)
- [ ] Update `EditorPreview.vue` to render links as clickable
- [ ] Add hover event for preview popup
- [ ] Style links with distinct color

#### Step 4.3: Document Detail Integration (0.5 hours)
- [ ] Add `BacklinkPanel` to document detail page
- [ ] Add "Link Graph" button to toolbar

#### Step 4.4: Testing (0.5 hours)
- [ ] Manual testing: Create links, view backlinks
- [ ] Test broken link detection (delete target document)
- [ ] Test link graph rendering

---

## 🧪 Test Scenarios

### Scenario 1: Create Internal Link
```gherkin
Given 用户在编辑器中输入 "查看 [[项目计划]] 了解更多"
When 内容保存
Then 系统创建从当前文档到"项目计划"的链接记录
And "项目计划"文档的反向链接列表显示当前文档
```

### Scenario 2: Auto-Complete Link
```gherkin
Given 用户输入 "[[项"
When 编辑器显示建议列表
Then 列表包含标题匹配"项"的所有文档
And 用户选择"项目计划"
Then 编辑器插入 "[[项目计划]]"
```

### Scenario 3: Navigate via Link
```gherkin
Given 预览模式显示 "[[项目计划]]"
When 用户点击链接
Then 跳转到"项目计划"文档编辑页面
```

### Scenario 4: View Backlinks
```gherkin
Given 文档 A 链接到文档 B
And 文档 C 也链接到文档 B
When 用户打开文档 B
Then 侧边栏显示反向链接列表
And 列表包含文档 A 和文档 C
```

### Scenario 5: Broken Link Detection
```gherkin
Given 文档 A 链接到文档 B
When 文档 B 被删除
Then 系统标记该链接为失效
And 文档 A 预览中显示失效链接样式（删除线）
```

### Scenario 6: Link Graph Visualization
```gherkin
Given 文档 A 链接到 B、C
And 文档 B 链接到 D
When 用户查看文档 A 的链接图谱
Then 显示包含 A、B、C、D 的图谱
And 显示 A->B、A->C、B->D 的边
```

---

## 📦 Dependencies

### Backend
- Existing Prisma setup (PostgreSQL)
- No new packages required

### Frontend
- `@vueuse/core` - For hover detection
- `echarts` (already installed) - For link graph visualization

---

## 📊 Estimation Breakdown

| Phase | Task | Hours |
|-------|------|-------|
| **Phase 1** | Backend Foundation | 3.0 |
| - | Database Schema | 0.5 |
| - | Domain Layer | 1.0 |
| - | Infrastructure Layer | 0.5 |
| - | Application Service | 1.0 |
| - | API Endpoints | 0.5 |
| **Phase 2** | Link Parser | 2.0 |
| - | Parser Service | 1.0 |
| - | Integration on Save | 1.0 |
| **Phase 3** | Frontend Components | 5.0 |
| - | Link Auto-Complete | 1.5 |
| - | Link Preview Popup | 1.0 |
| - | Backlink Panel | 1.5 |
| - | Link Graph View | 1.0 |
| **Phase 4** | Integration & Testing | 3.0 |
| - | Editor Integration | 1.0 |
| - | Preview Integration | 1.0 |
| - | Document Detail Integration | 0.5 |
| - | Testing | 0.5 |
| **Total** | | **13 hours** |

---

## 🎨 UI/UX Design

### Link Auto-Complete Dropdown
```
┌───────────────────────────────────────┐
│ [[项                                   │
│   ┌─────────────────────────────────┐ │
│   │ 📄 项目计划 (3 backlinks)        │ │
│   │ 📄 项目回顾 (1 backlink)         │ │
│   │ 📄 新项目 (0 backlinks)          │ │
│   │ ─────────────────────────────── │ │
│   │ ➕ 创建新文档 "项目XX"           │ │
│   └─────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Backlink Panel (Sidebar)
```
┌──────────────────────────────────────┐
│ 🔗 反向链接 (3)                       │
├──────────────────────────────────────┤
│ 📄 项目计划                           │
│    "...查看 [[当前文档]] 了解..."      │
│                           2 天前      │
├──────────────────────────────────────┤
│ 📄 每周回顾                           │
│    "...参考 [[当前文档]] 中的..."      │
│                           5 天前      │
├──────────────────────────────────────┤
│ 📄 年度总结                           │
│    "...如 [[当前文档]] 所述..."        │
│                           1 周前      │
└──────────────────────────────────────┘
```

### Link Preview Popup (Hover)
```
           [[项目计划]]  ← hover here
           ┌────────────────────────────┐
           │ 📄 项目计划                 │
           │ ──────────────────────────│
           │ 本季度的主要项目包括...     │
           │ 1. 用户认证系统            │
           │ 2. 数据分析模块            │
           │                            │
           │ 创建于 2025-10-15          │
           │ 📎 5 个链接                │
           └────────────────────────────┘
```

### Link Graph View
```
┌──────────────────────────────────────────────┐
│  项目计划  ──────────→  用户认证              │
│     │                                         │
│     │                                         │
│     ↓                                         │
│  技术方案  ──────────→  数据库设计            │
│     │                                         │
│     │                                         │
│     ↓                                         │
│  API文档                                      │
│                                               │
│ [Center on Current] [Expand All] [Export]    │
└──────────────────────────────────────────────┘
```

---

## ⚠️ Technical Considerations

### Performance
- **Link Parsing**: 在保存时解析，避免实时解析性能损耗
- **Backlink Query**: 使用索引优化查询（`idx_target_document`）
- **Link Graph**: 限制深度（默认 2 层），避免图谱过大

### Edge Cases
- **Circular Links**: 文档 A 链接 B，B 链接 A（正常支持）
- **Self Links**: 文档链接自身（允许但提示）
- **Special Characters**: 标题包含 `]`、`|`、`#` 的处理
- **Duplicate Links**: 同一文档多次链接同一目标（保留多个位置）

### Security
- **Authorization**: 只能查看有权限的文档的反向链接
- **Broken Link Privacy**: 不泄露被删除文档的信息

---

## 📝 Notes

- Link parsing 使用正则表达式而非完整 Markdown AST（性能考虑）
- Link graph 使用 ECharts 而非 D3.js（与 Task Dependency Graph 保持一致）
- 反向链接按最近更新时间排序
- 失效链接保留 7 天后自动清理（可配置）

---

## 🔄 Future Enhancements (Post-Story)

- [ ] Block-level links (链接到文档的特定段落)
- [ ] Tag-based links (通过标签自动生成链接)
- [ ] Link strength visualization (基于链接频率显示权重)
- [ ] Orphan document detection (没有任何链接的孤立文档)
- [ ] Link analytics dashboard (链接统计面板)

---

**Story Status**: 🚧 In Progress  
**Dependencies**: Story 8-1 (Markdown Editor Basics) ✅  
**Assigned To**: Development Team  
**Target Sprint**: Current Sprint
