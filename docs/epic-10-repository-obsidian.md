# Epic 10: Repository Module - Obsidian 风格知识管理系统

> **Epic 类型**: 全新功能开发  
> **优先级**: High  
> **预估工期**: 6-8 周（2 名开发者）  
> **状态**: Backlog  
> **创建日期**: 2025-11-09

---

## 📋 Epic 概述

基于 Obsidian 的知识管理理念，实现一个完整的个人知识库系统，支持：
- 📁 文件夹树形层级管理
- 📝 Markdown 笔记编辑（Milkdown）
- 🔗 双向链接 `[[]]` 语法
- 🔄 版本历史管理
- 🕸️ 知识图谱可视化
- 🔍 全文搜索（PostgreSQL + pg_jieba）

---

## 🎯 业务价值

### 用户痛点
1. ❌ 现有 Document 模块功能单一，仅支持文档 CRUD
2. ❌ 缺乏笔记间的关联关系（双向链接）
3. ❌ 无法可视化知识网络
4. ❌ 版本管理不够直观
5. ❌ 搜索功能薄弱

### 解决方案
1. ✅ 参考 Obsidian，实现完整知识管理系统
2. ✅ 支持 `[[笔记名]]` 语法自动建立链接
3. ✅ 反向链接面板显示引用关系
4. ✅ Cytoscape.js 知识图谱可视化
5. ✅ Git 风格版本历史 + Diff 对比
6. ✅ PostgreSQL 全文搜索 + 高亮

---

## 📐 架构设计

### DDD 领域模型

```
Repository (聚合根)
├── config: RepositoryConfig (值对象)
├── stats: RepositoryStats (值对象)
├── git?: GitInfo (值对象)
└── folders: Folder[] (子实体集合)

Folder (实体)
├── metadata: FolderMetadata (值对象)
└── resources: Resource[] (引用)

Resource (实体)
├── metadata: ResourceMetadata (值对象)
├── stats: ResourceStats (值对象)
├── versions: ResourceVersion[] (子实体)
└── links: ResourceLink[] (子实体)

ResourceVersion (实体)
└── metadata: VersionMetadata (值对象)

ResourceLink (实体)
├── sourceResourceUuid: string
├── targetResourceUuid: string
├── linkType: BIDIRECTIONAL | EMBED | REFERENCE
└── isBroken: boolean
```

### 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **前端框架** | Vue 3 + Vuetify 3 | 组件库 |
| **编辑器** | Milkdown | Markdown 专用编辑器 |
| **图谱可视化** | Cytoscape.js | 力导向布局 |
| **状态管理** | Pinia | Store |
| **后端框架** | NestJS | DDD 架构 |
| **数据库** | PostgreSQL | 全文搜索 + JSONB |
| **ORM** | Prisma | TypeORM 迁移 |
| **搜索** | PostgreSQL `@@fulltext` | Phase 1（中文分词：pg_jieba） |

---

## 📊 数据库设计

### 新增表

```sql
-- 1. 文件夹表
CREATE TABLE folders (
  uuid UUID PRIMARY KEY,
  repository_uuid UUID NOT NULL REFERENCES repositories(uuid),
  parent_uuid UUID REFERENCES folders(uuid),
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,  -- 自动生成：/parent/child
  "order" INTEGER DEFAULT 0,
  is_expanded BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 资源版本表
CREATE TABLE resource_versions (
  uuid UUID PRIMARY KEY,
  resource_uuid UUID NOT NULL REFERENCES resources(uuid),
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_type VARCHAR(50) NOT NULL,  -- initial, major, minor, patch, restore
  change_description TEXT,
  changed_by VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 资源链接表（双向链接）
CREATE TABLE resource_links (
  uuid UUID PRIMARY KEY,
  source_resource_uuid UUID NOT NULL REFERENCES resources(uuid),
  target_resource_uuid UUID REFERENCES resources(uuid),  -- NULL = 断链
  link_type VARCHAR(50) NOT NULL,  -- BIDIRECTIONAL, EMBED, REFERENCE
  link_text VARCHAR(255) NOT NULL,  -- "[[目标笔记]]"
  line_number INTEGER,
  context TEXT,  -- 上下文片段
  is_broken BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 扩展 resources 表

```sql
ALTER TABLE resources 
  ADD COLUMN folder_uuid UUID REFERENCES folders(uuid),
  ADD COLUMN content TEXT,  -- Markdown 内容
  ADD COLUMN metadata JSONB DEFAULT '{}',  -- ResourceMetadata
  ADD COLUMN stats JSONB DEFAULT '{}';     -- ResourceStats
```

---

## 🎨 前端 UI 设计

### Obsidian 风格三栏布局

```
┌─────────────────────────────────────────────────────┐
│  TopBar: [仓储选择] [搜索] [新建] [设置]              │
├──────────┬──────────────────────┬───────────────────┤
│ 左侧边栏  │     中央编辑区        │    右侧边栏        │
│ 文件树    │  [Tab栏]             │  大纲              │
│ (250px)  │  Milkdown 编辑器      │  反向链接          │
│          │                      │  知识图谱          │
│ 📁 前端   │  # 标题               │  版本历史          │
│   📄笔记 │  内容...             │  (300px)          │
│ 📁 后端   │                      │                   │
└──────────┴──────────────────────┴───────────────────┘
```

### 核心组件清单

| 组件 | 优先级 | 功能 |
|------|--------|------|
| FileExplorer.vue | P0 | 文件树（VTreeView + 拖拽） |
| ResourceEditor.vue | P0 | Milkdown 编辑器 + 双向链接插件 |
| BacklinksPanel.vue | P1 | 反向链接列表 |
| OutlinePanel.vue | P1 | 大纲导航 |
| VersionHistory.vue | P1 | 版本时间线 |
| KnowledgeGraphView.vue | P2 | Cytoscape 图谱 |
| SearchDialog.vue | P2 | 全局搜索 + 高亮 |
| VersionDiffDialog.vue | P2 | 版本对比（diff2html） |

---

## 📝 Stories 分解

### Story 10.1: Repository & Folder 基础管理 (P0, 8 Story Points)

**用户故事**：作为用户，我希望能够创建仓储和文件夹层级，以便组织我的笔记。

**验收标准**：
- [ ] 创建 Repository 聚合根（domain-server）
- [ ] 创建 Folder 实体（domain-server）
- [ ] 实现 FolderHierarchyService（路径生成、循环检测）
- [ ] Repository CRUD API（NestJS Controller）
- [ ] Folder Tree API（创建、移动、删除、查询）
- [ ] 数据库迁移脚本（新增 folders 表）
- [ ] 前端 FileExplorer 组件（VTreeView）
- [ ] 拖拽移动文件夹功能（@vueuse/core）

**技术债务**：无

---

### Story 10.2: Resource CRUD + Markdown 编辑器 (P0, 13 Story Points)

**用户故事**：作为用户，我希望能够在文件夹中创建 Markdown 笔记并编辑内容。

**验收标准**：
- [ ] 扩展 Resource 实体（添加 content、metadata、stats 字段）
- [ ] Resource CRUD API（创建、查询、更新、删除）
- [ ] 数据库迁移脚本（扩展 resources 表）
- [ ] 前端集成 Milkdown 编辑器
- [ ] 实时内容保存（防抖 500ms）
- [ ] Tab 多标签页管理（固定、关闭、拖拽排序）
- [ ] 文件类型图标显示（Markdown, Image, PDF 等）
- [ ] 自动保存提示 UI

**技术债务**：
- Milkdown 性能优化（大文件 > 10MB）

---

### Story 10.3: 双向链接解析与自动补全 (P1, 8 Story Points)

**用户故事**：作为用户，我希望输入 `[[` 时能够自动搜索笔记并插入链接。

**验收标准**：
- [ ] 创建 ResourceLink 实体（domain-server）
- [ ] 实现 LinkParserService（解析 `[[]]` 语法）
- [ ] ResourceLink CRUD API
- [ ] 数据库迁移脚本（新增 resource_links 表）
- [ ] Milkdown 双向链接插件（自定义 Node）
- [ ] 输入 `[[` 触发自动补全面板
- [ ] 搜索资源名称（模糊匹配）
- [ ] 插入链接后自动创建 ResourceLink 记录

**技术债务**：无

---

### Story 10.4: 反向链接面板 (P1, 5 Story Points)

**用户故事**：作为用户，我希望看到所有引用了当前笔记的其他笔记。

**验收标准**：
- [ ] Backlinks 查询 API（WHERE target_resource_uuid = ?）
- [ ] 返回上下文片段（context 字段）
- [ ] 前端 BacklinksPanel 组件
- [ ] 点击反向链接跳转到源笔记
- [ ] 上下文高亮显示（高亮引用文本）
- [ ] 实时更新（链接创建/删除时刷新）

**技术债务**：无

---

### Story 10.5: 版本历史管理 (P1, 8 Story Points)

**用户故事**：作为用户，我希望查看笔记的历史版本并能够恢复。

**验收标准**：
- [ ] 创建 ResourceVersion 实体（domain-server）
- [ ] 自动版本创建（Resource.updateContent 时触发）
- [ ] 版本号自动递增
- [ ] ResourceVersion CRUD API
- [ ] 数据库迁移脚本（新增 resource_versions 表）
- [ ] 前端 VersionHistory 组件（Timeline）
- [ ] 版本对比 API（Diff 算法）
- [ ] VersionDiffDialog 组件（diff2html）
- [ ] 版本恢复功能

**技术债务**：
- Diff 算法性能优化（diff-match-patch）

---

### Story 10.6: 知识图谱可视化 (P2, 8 Story Points)

**用户故事**：作为用户，我希望看到我的笔记网络的图谱可视化。

**验收标准**：
- [ ] 知识图谱生成 API（基于 ResourceLink）
- [ ] 返回 Cytoscape 数据格式（nodes + edges）
- [ ] 前端 KnowledgeGraphView 组件
- [ ] 力导向布局（cose 算法）
- [ ] 节点点击跳转
- [ ] 缩放、平移、重置视图
- [ ] 全屏模式
- [ ] 节点大小反映链接数量

**技术债务**：
- 大规模图谱性能优化（> 1000 节点）

---

### Story 10.7: 全文搜索 + 高亮 (P2, 5 Story Points)

**用户故事**：作为用户，我希望能够全文搜索我的笔记内容。

**验收标准**：
- [ ] PostgreSQL 全文搜索索引（`@@fulltext([name, content])`）
- [ ] 中文分词支持（pg_jieba 扩展）
- [ ] 搜索 API（关键词、筛选、分页）
- [ ] 返回匹配片段 + 评分
- [ ] 前端 SearchDialog 组件
- [ ] 搜索结果高亮（v-html + 高亮标签）
- [ ] 快捷键 Ctrl+K 触发搜索
- [ ] 搜索历史记录

**技术债务**：
- Phase 2 可选迁移到 MeiliSearch

---

### Story 10.8: 大纲视图 (P1, 3 Story Points)

**用户故事**：作为用户，我希望看到当前笔记的大纲导航。

**验收标准**：
- [ ] 前端解析 Markdown 标题（h1-h6）
- [ ] OutlinePanel 组件（嵌套列表）
- [ ] 点击标题滚动到对应位置
- [ ] 实时更新（内容变化时刷新）
- [ ] 缩进层级显示（h2 缩进 12px，h3 缩进 24px）

**技术债务**：无

---

### Story 10.9: 数据迁移与清理 (P0, 5 Story Points)

**用户故事**：作为系统管理员，我希望将旧的 Document 数据迁移到新的 Repository 模块。

**验收标准**：
- [ ] 为每个用户创建默认 Repository
- [ ] 迁移 documents → resources
- [ ] 迁移 document_versions → resource_versions
- [ ] 迁移 document_links → resource_links
- [ ] 备份旧表数据
- [ ] 删除废弃表（document, document_version, document_link）
- [ ] 迁移脚本验证（数据完整性检查）
- [ ] 回滚脚本（如迁移失败）

**技术债务**：
- 大数据量迁移性能优化（批量插入）

---

### Story 10.10: Git 集成（可选，未来 Phase 2）

**用户故事**：作为用户，我希望能够将仓储同步到 Git 远程仓库。

**状态**: Backlog（暂不实施）

---

## 📈 实施计划

### Sprint 0: 基础设施准备（3-5 天）

**目标**: 数据迁移 + 基础架构

- Story 10.9: 数据迁移与清理 (5 SP)
- 环境准备：PostgreSQL pg_jieba 扩展安装

---

### Sprint 1: 核心 CRUD（1 周）

**目标**: Repository + Folder + Resource 基础功能

- Story 10.1: Repository & Folder 基础管理 (8 SP)
- Story 10.2: Resource CRUD + Markdown 编辑器 (13 SP)

**里程碑**: 用户能够创建文件夹和笔记，并编辑 Markdown 内容

---

### Sprint 2: 双向链接（1 周）

**目标**: 链接解析 + 反向链接

- Story 10.3: 双向链接解析与自动补全 (8 SP)
- Story 10.4: 反向链接面板 (5 SP)

**里程碑**: 用户能够使用 `[[]]` 语法建立笔记间链接

---

### Sprint 3: 版本管理（1 周）

**目标**: 版本历史 + Diff

- Story 10.5: 版本历史管理 (8 SP)

**里程碑**: 用户能够查看版本历史并恢复旧版本

---

### Sprint 4: 可视化与搜索（1.5 周）

**目标**: 知识图谱 + 全文搜索

- Story 10.6: 知识图谱可视化 (8 SP)
- Story 10.7: 全文搜索 + 高亮 (5 SP)
- Story 10.8: 大纲视图 (3 SP)

**里程碑**: 用户能够看到知识网络并快速搜索笔记

---

### Sprint 5: 测试与优化（1 周）

**目标**: E2E 测试 + 性能优化

- E2E 测试覆盖（Playwright）
- 性能优化（大文件、大图谱）
- Bug 修复

---

## 📊 工作量评估

| 阶段 | Story Points | 预估工时（2 人） | 日历天数 |
|------|-------------|----------------|----------|
| Sprint 0 | 5 | 20 小时 | 3-5 天 |
| Sprint 1 | 21 | 84 小时 | 5 天 |
| Sprint 2 | 13 | 52 小时 | 5 天 |
| Sprint 3 | 8 | 32 小时 | 4 天 |
| Sprint 4 | 16 | 64 小时 | 7 天 |
| Sprint 5 | - | 40 小时 | 5 天 |
| **总计** | **63 SP** | **292 小时** | **6-8 周** |

---

## 🎯 成功指标

### 功能完整性
- [ ] 所有 10 个 Stories 完成
- [ ] E2E 测试覆盖率 > 80%
- [ ] PM 审核通过

### 性能指标
- [ ] Markdown 编辑器响应 < 100ms
- [ ] 全文搜索响应 < 500ms
- [ ] 知识图谱渲染（100 节点）< 3s
- [ ] 版本 Diff 计算 < 1s

### 用户体验
- [ ] 快捷键支持（10+ 快捷键）
- [ ] 自动保存（防抖 500ms）
- [ ] 断链检测并标记

---

## 🔗 参考文档

1. [BA 需求文档 - 数据库设计](./modules/repository/requirements/01-DATABASE_SCHEMA_DESIGN.md)
2. [BA 需求文档 - 领域模型](./modules/repository/requirements/02-DOMAIN_MODEL_DESIGN.md)
3. [BA 需求文档 - 应用服务](./modules/repository/requirements/03-APPLICATION_SERVICE_DESIGN.md)
4. [BA 需求文档 - API 设计](./modules/repository/requirements/04-API_ENDPOINT_DESIGN.md)
5. [BA 需求文档 - 前端 UX](./modules/repository/requirements/05-FRONTEND_UX_DESIGN.md)
6. [PM 审核报告](./modules/repository/requirements/PM_REVIEW_REPORT.md)

---

**Epic 创建者**: Scrum Master - Bob  
**创建日期**: 2025-11-09  
**预计开始**: 待定  
**预计完成**: 开始后 6-8 周
