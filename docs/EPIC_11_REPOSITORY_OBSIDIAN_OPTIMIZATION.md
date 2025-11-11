# Epic 11: Repository & Editor 模块 Obsidian 风格优化

**作者**: BMad Master + Team  
**日期**: 2025-11-11  
**优先级**: P0  
**状态**: 待实施

---

## 📋 Epic 概述

### 目标

将 Repository 和 Editor 模块全面升级为 Obsidian 风格的知识管理系统，实现统一的文件树渲染、强大的搜索功能和精致的视觉体验。

### 业务价值

- **用户体验**: 提升知识管理效率，降低学习成本（Obsidian 用户无缝迁移）
- **功能完整性**: 补齐搜索、标签、书签等核心功能
- **视觉一致性**: 统一的设计语言，提升产品专业度
- **技术债务**: 解决文件/文件夹分离渲染的架构问题

### 成功标准

- ✅ 文件树统一渲染（文件夹+文件混合显示）
- ✅ 搜索功能支持 6 种搜索类型（file/tag/line/section/path/all）
- ✅ 样式完全符合 Obsidian 风格（间距/圆角/动画/交互）
- ✅ 所有组件通过单元测试和 E2E 测试
- ✅ 性能指标：文件树加载 <500ms，搜索响应 <300ms

---

## 🎯 Story 分解

### Story 11.1: 文件树统一渲染（TreeNode 架构）

**优先级**: P0 - 必须有  
**故事点**: 8  
**预计时间**: 2-3 天

#### 用户故事

作为知识工作者，我希望在一个统一的文件树中浏览所有文件和文件夹，这样我可以快速定位和组织我的笔记，而不需要在多个视图之间切换。

#### 验收标准

**AC #1**: 后端 API 实现
- **Given** 仓储包含文件夹和文件
- **When** 调用 `GET /api/repositories/:uuid/tree` 
- **Then** 返回统一的 TreeNode 数组，包含 type/uuid/name/parentUuid/children 等字段
- **And** 文件夹在前，文件在后，同类按名称排序
- **And** 响应时间 <500ms（100个节点以内）

**AC #2**: TreeNode 类型定义
- **Given** 需要统一的节点接口
- **When** 定义 `packages/domain-client/src/repository/types/TreeNode.ts`
- **Then** 包含 folder 和 file 两种类型
- **And** 文件夹有 children 属性，文件有 extension/size/metadata 属性
- **And** 类型完整，支持 TypeScript 严格模式

**AC #3**: TreeNodeItem 递归组件
- **Given** TreeNode 数据结构
- **When** 创建 TreeNodeItem.vue 组件
- **Then** 支持递归渲染（嵌套文件夹）
- **And** 文件夹显示展开/折叠图标
- **And** 文件根据扩展名显示不同图标（md/pdf/png/jpg/mp4/txt）
- **And** 支持悬停/选中/活动三种状态样式

**AC #4**: FileTreeStore 状态管理
- **Given** 需要管理文件树状态
- **When** 创建 fileTreeStore.ts
- **Then** 管理 treeNodes/expandedNodes/selectedNodeUuid
- **And** 提供 loadTree/toggleNode/selectNode 方法
- **And** 支持按需加载子节点（为未来扩展预留）

**AC #5**: 集成到 FilesPanel
- **Given** FilesPanel 组件
- **When** 替换现有 FileExplorer + ResourceList
- **Then** 使用新的 TreeNodeItem 渲染文件树
- **And** 保留所有现有功能（创建/重命名/删除/右键菜单）
- **And** 双击文件打开编辑器

**AC #6**: 右键菜单功能
- **Given** 用户在文件树节点上右键点击
- **When** 显示上下文菜单
- **Then** 文件夹显示：新建子文件夹/重命名/删除
- **And** 文件显示：重命名/删除/添加到书签
- **And** 菜单样式符合 Obsidian 风格

#### 技术要点

- **后端**: NestJS Controller + Service 层实现树形数据聚合
- **前端**: Pinia Store + Vue 3 递归组件
- **性能**: 虚拟滚动（未来优化项，当前 <100 节点无需）
- **测试**: 单元测试（Store + 组件），E2E 测试（交互流程）

#### 依赖

- 无前置依赖

#### 参考文档

- `docs/REPOSITORY_FILE_TREE_DESIGN.md`

---

### Story 11.2: Obsidian 风格搜索功能

**优先级**: P0 - 必须有  
**故事点**: 8  
**预计时间**: 2-3 天

#### 用户故事

作为知识工作者，我希望使用强大的搜索功能快速找到我的笔记内容，支持按文件名、标签、内容、路径等多种方式搜索，这样我可以在大量笔记中快速定位信息。

#### 验收标准

**AC #1**: SearchPanel 组件 UI
- **Given** 用户切换到搜索标签
- **When** 渲染 SearchPanel 组件
- **Then** 显示搜索输入框（带放大镜图标）
- **And** 点击输入框自动弹出搜索类型选择菜单
- **And** 显示搜索历史记录（最多 10 条）
- **And** 样式符合 Obsidian 风格（outlined input + 圆角）

**AC #2**: 搜索类型选择
- **Given** 用户点击搜索框
- **When** 弹出搜索选项菜单
- **Then** 显示 6 种搜索类型：
  - all: search all content
  - file: match file name
  - tag: search for tags
  - line: keywords on same line
  - section: under same heading
  - path: match path
- **And** 选中类型后显示在输入框右侧（chip）
- **And** chip 可以关闭（重置为 all）

**AC #3**: 实时搜索功能
- **Given** 用户输入搜索关键词
- **When** 输入停止 300ms 后
- **Then** 自动触发搜索
- **And** 显示加载状态（spinner）
- **And** 搜索结果按文件分组显示
- **And** 每个文件显示匹配数量

**AC #4**: 搜索结果展示
- **Given** 搜索返回结果
- **When** 渲染结果列表
- **Then** 按文件分组（文件名 + 匹配数量）
- **And** 每个匹配项显示：匹配文本（高亮）+ 行号 + 所在标题
- **And** 点击文件头可展开/折叠匹配项
- **And** 点击匹配项打开文件并跳转到指定行

**AC #5**: 搜索历史记录
- **Given** 用户完成搜索
- **When** 按 Enter 键或点击搜索按钮
- **Then** 搜索记录添加到历史列表
- **And** 历史记录格式：`[type:]query`（例如 `file:README` 或 `obsidian`）
- **And** 历史记录保存到 localStorage
- **And** 点击历史记录可重新搜索

**AC #6**: 高级搜索设置
- **Given** 用户点击设置按钮（gear icon）
- **When** 打开高级设置对话框
- **Then** 提供选项：大小写敏感/全词匹配/正则表达式
- **And** 设置项影响搜索结果
- **And** 设置保存到 localStorage

**AC #7**: 后端搜索 API
- **Given** 前端发送搜索请求
- **When** 调用 `POST /api/search`
- **Then** 根据搜索类型执行对应搜索逻辑
- **And** 返回格式：`{ results: [{fileUuid, fileName, filePath, matches: [{text, lineNumber, section, startIndex, endIndex}]}], totalMatches }`
- **And** 搜索响应时间 <300ms（100个文件以内）

**AC #8**: 搜索高亮显示
- **Given** 搜索结果包含匹配文本
- **When** 渲染匹配项
- **Then** 使用 `<mark>` 标签高亮显示关键词
- **And** 高亮颜色：`rgba(var(--v-theme-warning), 0.3)`
- **And** 高亮文字加粗

#### 技术要点

- **前端**: Vue 3 + TypeScript + debounce（lodash-es）
- **后端**: 全文搜索算法（正则匹配，未来可升级为 Elasticsearch）
- **性能**: debounce 300ms，结果分页（未来优化项）
- **存储**: localStorage 保存搜索历史和设置

#### 依赖

- Story 11.1（文件树 API，用于获取文件列表）

#### 参考文档

- `docs/REPOSITORY_SEARCH_DESIGN.md`

---

### Story 11.3: 整体样式优化（Obsidian 风格）

**优先级**: P0 - 必须有  
**故事点**: 5  
**预计时间**: 1-2 天

#### 用户故事

作为 Obsidian 用户，我希望 DailyUse 的 Repository 模块拥有与 Obsidian 一致的视觉风格和交互体验，这样我可以无缝切换工具，不需要重新适应新的界面。

#### 验收标准

**AC #1**: 颜色系统统一
- **Given** 样式指南定义的颜色变量
- **When** 应用到所有组件
- **Then** 使用 CSS 变量（`rgb(var(--v-theme-surface))`）
- **And** 透明度层级统一：hover(0.05) / selected(0.12) / pressed(0.16)
- **And** 主题色正确应用：primary（文件夹/选中）/ accent（md文件）/ error（删除）

**AC #2**: 间距系统统一
- **Given** 样式指南定义的间距变量
- **When** 应用到所有组件
- **Then** 使用统一单位：4px/8px/12px/16px/24px/32px
- **And** 侧边栏 padding：8px
- **And** 组件内边距：compact(4px 8px) / normal(8px 12px) / comfortable(12px 16px)

**AC #3**: 圆角规范
- **Given** 样式指南定义的圆角变量
- **When** 应用到所有组件
- **Then** chip/badge: 4px
- **And** button/input: 6px
- **And** card/dialog: 8px
- **And** panel: 12px

**AC #4**: 微交互优化
- **Given** 所有可交互元素
- **When** 用户悬停/点击
- **Then** 悬停：背景色变化 + 150ms 过渡
- **And** 按下：背景色更深 + transform: translateY(0)
- **And** 选中：背景色高亮 + 文字加粗
- **And** 展开/折叠：图标旋转 90° + 150ms 过渡

**AC #5**: 滚动条样式
- **Given** 侧边栏内容区
- **When** 内容超出视口
- **Then** 显示自定义滚动条（宽度 8px）
- **And** 滚动条颜色：`rgba(var(--v-theme-on-surface), 0.2)`
- **And** 悬停时加深：`rgba(var(--v-theme-on-surface), 0.3)`
- **And** track 背景透明

**AC #6**: Tab 标签栏优化
- **Given** 侧边栏顶部 Tab 区域
- **When** 渲染 Tab 按钮
- **Then** 背景色：`surface-variant`
- **And** 按钮 padding：6px
- **And** 活动 Tab：背景色 `primary(0.12)` + 文字色 `primary`
- **And** 悬停 Tab：背景色 `on-surface(0.05)`

**AC #7**: 空状态优化
- **Given** 编辑器未打开文件
- **When** 显示空状态
- **Then** 图标大小：64px，颜色：`grey-lighten-1`
- **And** 标题：text-h6，颜色：`grey`
- **And** 描述：text-caption，颜色：`grey-lighten-1`
- **And** 垂直居中，padding: 32px

**AC #8**: 响应式设计
- **Given** 不同设备尺寸
- **When** 渲染 Repository 模块
- **Then** 桌面端（>1024px）：侧边栏 300px
- **And** 平板端（768-1024px）：侧边栏 250px
- **And** 移动端（<768px）：侧边栏折叠，fixed 定位

#### 技术要点

- **CSS 变量**: 使用 Vuetify 3 主题系统
- **SCSS**: 定义复用变量和 mixin
- **动画**: 使用 CSS transitions，避免 JavaScript 动画
- **响应式**: CSS Grid + Media Queries

#### 依赖

- Story 11.1, Story 11.2（需要先实现功能，再优化样式）

#### 参考文档

- `docs/REPOSITORY_STYLE_GUIDE.md`

---

### Story 11.4: 书签功能实现（Phase 2）

**优先级**: P1 - 应该有  
**故事点**: 5  
**预计时间**: 1-2 天

#### 用户故事

作为知识工作者，我希望能够收藏常用的笔记，并在书签面板中快速访问它们，这样我可以避免重复查找，提升工作效率。

#### 验收标准

**AC #1**: Bookmark 数据模型
- **Given** 需要存储书签数据
- **When** 定义 Bookmark 实体
- **Then** 包含字段：uuid/userUuid/resourceUuid/repositoryUuid/displayName/createdAt/sortOrder
- **And** 支持自定义排序（sortOrder）
- **And** Prisma schema 定义完整

**AC #2**: 书签 CRUD API
- **Given** 前端需要管理书签
- **When** 实现以下端点：
  - `POST /api/bookmarks` - 创建书签
  - `GET /api/bookmarks/:repositoryUuid` - 获取仓储书签
  - `DELETE /api/bookmarks/:uuid` - 删除书签
  - `PATCH /api/bookmarks/:uuid/order` - 更新排序
- **Then** 所有端点返回标准响应格式
- **And** 响应时间 <200ms

**AC #3**: BookmarksPanel UI
- **Given** 用户切换到书签标签
- **When** 渲染 BookmarksPanel 组件
- **Then** 显示书签列表（图标 + 名称）
- **And** 点击书签打开对应文件
- **And** 右键菜单：重命名/删除
- **And** 底部显示"添加当前笔记"按钮

**AC #4**: 添加书签功能
- **Given** 用户正在编辑笔记
- **When** 点击"添加到书签"按钮
- **Then** 弹出确认对话框（可自定义名称）
- **And** 创建书签后显示 toast 提示
- **And** 书签列表自动刷新

**AC #5**: 书签排序功能
- **Given** 用户在书签列表
- **When** 拖拽书签项
- **Then** 支持拖拽排序
- **And** 释放后自动保存新顺序
- **And** 使用 optimistic UI 更新

#### 技术要点

- **拖拽**: VueDraggable 或原生 Drag API
- **存储**: PostgreSQL + Prisma
- **状态管理**: bookmarkStore (Pinia)

#### 依赖

- Story 11.1（需要文件树 API）

---

### Story 11.5: 标签统计与过滤（Phase 2）

**优先级**: P1 - 应该有  
**故事点**: 5  
**预计时间**: 1-2 天

#### 用户故事

作为知识工作者，我希望看到仓储中所有使用的标签及其数量，并能点击标签查看相关笔记，这样我可以按主题组织和浏览我的知识库。

#### 验收标准

**AC #1**: Tag 统计 API
- **Given** 仓储中多个笔记包含 YAML frontmatter tags
- **When** 调用 `GET /api/tags/statistics/:repositoryUuid`
- **Then** 返回 tag 统计：`[{tag, count, resources: [{uuid, title, path}]}]`
- **And** 按使用频率降序排序
- **And** 响应时间 <500ms

**AC #2**: TagsPanel UI
- **Given** 用户切换到标签标签
- **When** 渲染 TagsPanel 组件
- **Then** 显示标签云（chip 形式）
- **And** 每个 tag 显示使用次数 badge
- **And** 点击 tag 过滤显示相关笔记
- **And** 支持搜索标签（filter input）

**AC #3**: Tag 过滤功能
- **Given** 用户点击某个标签
- **When** 触发过滤
- **Then** 在右侧编辑器区域显示笔记列表
- **And** 列表显示：标题 + 路径 + 更新时间
- **And** 点击笔记打开编辑器

**AC #4**: Tag 高亮显示
- **Given** 笔记的 YAML frontmatter 包含 tags
- **When** 在文件树中显示笔记
- **Then** 笔记名称右侧显示 tag 数量 badge
- **And** badge 颜色：primary，大小：x-small

#### 技术要点

- **解析**: YAML frontmatter 解析（yaml 库）
- **聚合**: 后端聚合计算（避免前端大量计算）
- **缓存**: Redis 缓存 tag 统计（未来优化项）

#### 依赖

- Story 11.1（需要 YAML frontmatter 支持）

---

### Story 11.6: 高级搜索功能（Phase 3）

**优先级**: P2 - 可以有  
**故事点**: 5  
**预计时间**: 1-2 天

#### 用户故事

作为高级用户，我希望使用更精准的搜索功能（line/section/property），这样我可以在复杂的知识库中快速定位特定信息。

#### 验收标准

**AC #1**: line: 同行关键词搜索
- **Given** 用户选择 `line:` 搜索类型
- **When** 输入多个关键词（空格分隔）
- **Then** 返回所有关键词都在同一行的匹配项
- **And** 示例：`line:(obsidian plugin)` 匹配包含这两个词的行

**AC #2**: section: 同标题下搜索
- **Given** 用户选择 `section:` 搜索类型
- **When** 输入关键词
- **Then** 返回在同一 Markdown 标题下的匹配项
- **And** 结果显示所在标题名称

**AC #3**: [property]: YAML 属性搜索
- **Given** 用户输入 `[author]:sean` 格式
- **When** 执行搜索
- **Then** 返回 YAML frontmatter 中 author 字段为 sean 的笔记
- **And** 支持任意自定义属性

**AC #4**: 搜索性能优化
- **Given** 仓储包含 1000+ 笔记
- **When** 执行搜索
- **Then** 响应时间 <1s
- **And** 支持搜索结果分页（每页 50 条）
- **And** 考虑引入全文索引（Elasticsearch）

#### 技术要点

- **算法**: 正则表达式 + 标题追踪
- **性能**: 索引优化 or Elasticsearch
- **UI**: 分页加载 + 虚拟滚动

#### 依赖

- Story 11.2（基础搜索功能）

---

## 📊 实施计划

### Phase 1: 核心功能（Week 1）

| Story | 优先级 | 故事点 | 天数 | 负责人 |
|-------|--------|--------|------|--------|
| 11.1 文件树统一渲染 | P0 | 8 | 2-3 | Amelia + Winston |
| 11.2 搜索功能 | P0 | 8 | 2-3 | Amelia + Sally |
| 11.3 样式优化 | P0 | 5 | 1-2 | Sally + Amelia |

**Total**: 21 Story Points, 5-8 天

### Phase 2: 增强功能（Week 2）

| Story | 优先级 | 故事点 | 天数 | 负责人 |
|-------|--------|--------|------|--------|
| 11.4 书签功能 | P1 | 5 | 1-2 | Amelia |
| 11.5 标签统计 | P1 | 5 | 1-2 | Amelia |

**Total**: 10 Story Points, 2-4 天

### Phase 3: 高级功能（Week 3）

| Story | 优先级 | 故事点 | 天数 | 负责人 |
|-------|--------|--------|------|--------|
| 11.6 高级搜索 | P2 | 5 | 1-2 | Amelia + Winston |

**Total**: 5 Story Points, 1-2 天

---

## 🧪 测试策略

### 单元测试

- **Store 测试**: fileTreeStore, bookmarkStore, tagStore
- **组件测试**: TreeNodeItem, SearchPanel, BookmarksPanel, TagsPanel
- **API 测试**: 所有 Controller 和 Service 层
- **覆盖率目标**: >85%

### E2E 测试

- **文件树**: 展开/折叠、选中、右键菜单、双击打开
- **搜索**: 输入搜索、类型切换、结果点击、历史记录
- **书签**: 添加、删除、排序、点击打开
- **标签**: 统计显示、点击过滤、搜索标签

### 性能测试

- **文件树加载**: <500ms（100 节点）
- **搜索响应**: <300ms（100 文件）
- **书签操作**: <200ms
- **标签统计**: <500ms

---

## 📦 技术栈

### 前端

- **框架**: Vue 3 + TypeScript + Vite
- **UI库**: Vuetify 3
- **状态管理**: Pinia
- **工具库**: lodash-es, yaml

### 后端

- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma
- **性能**: (未来) Redis 缓存 + Elasticsearch

---

## 📚 参考文档

1. **设计文档**:
   - `docs/REPOSITORY_FILE_TREE_DESIGN.md` - 文件树设计
   - `docs/REPOSITORY_SEARCH_DESIGN.md` - 搜索功能设计
   - `docs/REPOSITORY_STYLE_GUIDE.md` - 样式指南

2. **外部参考**:
   - Obsidian 官方文档: https://obsidian.md/
   - Vuetify 3 文档: https://vuetifyjs.com/
   - Material Design 3: https://m3.material.io/

---

## 🎯 验收标准（Epic 级别）

### 功能完整性

- [x] 文件树统一渲染
- [x] 多类型搜索功能
- [x] Obsidian 风格样式
- [ ] 书签功能（Phase 2）
- [ ] 标签统计（Phase 2）
- [ ] 高级搜索（Phase 3）

### 质量标准

- [ ] 单元测试覆盖率 >85%
- [ ] E2E 测试通过率 100%
- [ ] 性能指标达标
- [ ] 无严重 Bug

### 用户体验

- [ ] Obsidian 用户测试反馈良好
- [ ] 操作流畅，无明显卡顿
- [ ] 视觉一致，符合设计规范

---

## 🚀 发布计划

### v1.0 (Phase 1 完成后)

- **发布日期**: Week 1 结束
- **包含**: 文件树 + 搜索 + 样式
- **目标**: 核心功能可用

### v1.1 (Phase 2 完成后)

- **发布日期**: Week 2 结束
- **包含**: 书签 + 标签
- **目标**: 增强用户体验

### v1.2 (Phase 3 完成后)

- **发布日期**: Week 3 结束
- **包含**: 高级搜索
- **目标**: 功能完整

---

**Epic 负责人**: Winston (Architect) + Amelia (Developer Lead)  
**Review**: Sally (UX), Murat (QA), John (PM)  
**Sprint**: 3 weeks (3 x 1-week sprints)

---

**Epic 状态**: �� 待实施  
**下一步**: 开始 Story 11.1 实施

