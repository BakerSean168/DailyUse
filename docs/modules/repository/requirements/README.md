# 仓储模块（Repository）- BA 需求文档索引

> **文档类型**: 需求文档索引  
> **作者**: BA - Business Analyst  
> **日期**: 2025-11-09  
> **版本**: v1.0  
> **项目**: DailyUse - Repository Module (Obsidian-inspired Knowledge Management)

---

## 📚 文档概览

本目录包含仓储模块（Repository）的完整业务分析（BA）需求文档，基于用户提出的 **Obsidian 风格知识管理系统**愿景编写。

---

## 📋 文档清单

### 1. [数据库架构设计](./01-DATABASE_SCHEMA_DESIGN.md)

**内容**：
- ✅ 现有数据库表结构分析（Document、Repository 模块）
- ✅ Document → Resource 迁移映射关系
- ✅ 新增表设计：`folder`、`resource_version`、`resource_link`
- ✅ `resource` 表扩展设计
- ✅ 数据库索引优化建议
- ✅ SQL 迁移脚本

**关键决策**：
- 🔴 废弃 `document`、`document_version`、`document_link` 表
- 🔴 废弃 `repository_resource` 表（与 `resource` 重复）
- 🆕 新增 `folder` 表支持树形层级结构
- 🆕 `resource` 表添加 `content`、`metadata`、`stats` 字段
- 🆕 PostgreSQL 全文搜索索引 `@@fulltext([name, content])`

---

### 2. [领域模型设计](./02-DOMAIN_MODEL_DESIGN.md)

**内容**：
- ✅ Repository 聚合根设计（含 RepositoryConfig、RepositoryStats 值对象）
- ✅ Folder 实体设计（含 FolderMetadata 值对象）
- ✅ Resource 实体设计（含 ResourceMetadata、ResourceStats 值对象）
- ✅ ResourceVersion 实体设计（含 VersionMetadata 值对象）
- ✅ ResourceLink 实体设计（双向链接支持）
- ✅ 领域服务：LinkParserService、FolderHierarchyService
- ✅ 业务规则与不变式（15+ 条）

**DDD 组件统计**：
| 组件类型 | 数量 | 说明 |
|---------|------|------|
| 聚合根 | 1 | Repository |
| 实体 | 4 | Folder, Resource, ResourceVersion, ResourceLink |
| 值对象 | 7 | 配置、统计、元数据等 |
| 领域服务 | 2 | 链接解析、文件夹层级 |
| 业务规则 | 15+ | 验证、状态转换、引用完整性 |

---

### 3. [应用服务接口设计](./03-APPLICATION_SERVICE_DESIGN.md) ⏳

**计划内容**：
- ⏭️ RepositoryApplicationService 接口定义
- ⏭️ FolderApplicationService 接口定义
- ⏭️ ResourceApplicationService 接口定义
- ⏭️ ResourceVersionApplicationService 接口定义
- ⏭️ ResourceLinkApplicationService 接口定义（知识图谱）
- ⏭️ 用例（Use Case）定义

---

### 4. [RESTful API 端点设计](./04-API_ENDPOINT_DESIGN.md) ⏳

**计划内容**：
- ⏭️ Repository CRUD API
- ⏭️ Folder 树形结构 API
- ⏭️ Resource 管理 API（含内容更新、标签管理）
- ⏭️ ResourceVersion 版本管理 API（含 Diff、回滚）
- ⏭️ ResourceLink 链接管理 API（含反向链接查询）
- ⏭️ 知识图谱 API（图谱生成、遍历）
- ⏭️ 全文搜索 API

---

### 5. [前端交互设计](./05-FRONTEND_UX_DESIGN.md) ✅

**已完成内容**：
- ✅ Obsidian 风格三栏布局设计
- ✅ 文件夹树组件（Vuetify VTreeView）
- ✅ Markdown 编辑器集成（**Milkdown**）
- ✅ 双向链接 `[[]]` 自动补全实现
- ✅ 反向链接面板设计
- ✅ 版本历史面板（含 Diff 可视化）
- ✅ 知识图谱可视化（Cytoscape.js）
- ✅ 全局搜索框组件（含高亮）
- ✅ 快捷键支持（10+ 快捷键）
- ✅ 对话框和模态窗口设计

---

## 🎯 核心功能设计

### Obsidian 风格功能对标

| Obsidian 功能 | 本项目设计 | 状态 |
|--------------|-----------|------|
| 文件夹层级 | `folder` 表 + 树形结构 | ✅ 已设计 |
| Markdown 笔记 | `resource` 表 (type=markdown) | ✅ 已设计 |
| 双向链接 `[[]]` | `resource_link` 表 + LinkParserService | ✅ 已设计 |
| 反向链接面板 | 查询 `targetResourceUuid` | ✅ 已设计 |
| 嵌入 `![[]]` | `resource_link.linkType=EMBED` | ✅ 已设计 |
| 图片/视频/音频 | `resource.type` 支持多种类型 | ✅ 已设计 |
| 标签系统 | `resource.tags` JSON 数组 | ✅ 已设计 |
| 全文搜索 | PostgreSQL `@@fulltext` 索引 | ✅ 已设计 |
| 知识图谱 | ResourceLink 关系 + Cytoscape.js | ⏳ 前端待设计 |
| 版本历史 | `resource_version` 表 | ✅ 已设计 |
| Git 集成 | `repository.git` + GitInfo | ✅ 已设计 |

---

## 📊 架构决策记录（ADR）

### ADR-001: 废弃 Document 模块，迁移到 Repository

**背景**: Document 模块功能与 Repository 重叠，且 Repository 更符合 Obsidian 的知识库理念。

**决策**: 
- 废弃 `document`、`document_version`、`document_link` 表
- 迁移现有数据到 `resource`、`resource_version`、`resource_link`
- 复用 Document 的版本管理逻辑

**影响**: 
- ✅ 统一知识管理入口
- ✅ 支持更多资源类型（不仅限于文档）
- ⚠️ 需要数据迁移脚本

---

### ADR-002: 使用 PostgreSQL 全文搜索（而非 MeiliSearch）

**背景**: 需要全文搜索功能，有 3 个选项：PostgreSQL、MeiliSearch、Elasticsearch。

**决策**: 
- 第一阶段使用 PostgreSQL `@@fulltext` 索引
- 第二阶段（如需要）迁移到 MeiliSearch

**理由**:
- ✅ 无需额外部署服务
- ✅ 减少运维复杂度
- ✅ PostgreSQL 全文搜索对中文支持足够
- ⚠️ 性能可能不如专业搜索引擎（但对小型知识库足够）

---

### ADR-003: 文件夹路径自动生成（而非用户手动输入）

**背景**: 文件夹 `path` 字段应该自动生成还是手动维护？

**决策**: 
- 自动生成，格式：`/parent/child/grandchild`
- 用户只需维护 `name` 和 `parentUuid`

**理由**:
- ✅ 保证路径一致性
- ✅ 重命名/移动时自动更新路径

---

### ADR-004: 使用 Milkdown 作为 Markdown 编辑器

**背景**: 前端需要集成 Markdown 编辑器，有多个选项：Tiptap、Milkdown、Monaco Editor。

**决策**: 
- 使用 **Milkdown** 作为核心编辑器框架
- 扩展自定义双向链接插件

**理由**:
- ✅ **专注于 Markdown**（而非通用富文本编辑器）
- ✅ 插件化架构，易于扩展 `[[]]` 双向链接功能
- ✅ 完整支持 CommonMark 标准
- ✅ 内置 Prism 代码高亮、KaTeX 数学公式
- ✅ 轻量级，性能优秀
- 🔗 参考：[epic-7-architecture-comparison.md](../../epic-7-architecture-comparison.md)
- ✅ 减少用户输入错误

---

## 🔄 数据迁移计划

### Phase 1: 新增表结构

```sql
-- 1. 创建 folder 表
CREATE TABLE folders (...);

-- 2. 扩展 resource 表
ALTER TABLE resources ADD COLUMN folder_uuid UUID;
ALTER TABLE resources ADD COLUMN content TEXT;
ALTER TABLE resources ADD COLUMN metadata JSONB DEFAULT '{}';
ALTER TABLE resources ADD COLUMN stats JSONB DEFAULT '{}';

-- 3. 创建 resource_version 表
CREATE TABLE resource_versions (...);

-- 4. 创建 resource_link 表
CREATE TABLE resource_links (...);
```

### Phase 2: 迁移现有数据

```sql
-- 1. 为每个用户创建默认仓储
INSERT INTO repositories ...;

-- 2. 根据 document.folderPath 创建 folder 记录
INSERT INTO folders ...;

-- 3. 迁移 document 到 resource
INSERT INTO resources SELECT ... FROM documents;

-- 4. 迁移 document_version 到 resource_version
INSERT INTO resource_versions SELECT ... FROM document_versions;

-- 5. 迁移 document_link 到 resource_link
INSERT INTO resource_links SELECT ... FROM document_links;
```

### Phase 3: 清理旧表

```sql
-- 备份后删除
DROP TABLE document_links;
DROP TABLE document_versions;
DROP TABLE documents;
DROP TABLE repository_resources;
```

---

## 📈 实施优先级

### P0 - 核心基础（2 周）

1. **数据库迁移**：执行 Phase 1-3 迁移脚本
2. **领域模型实现**：实现 5 个实体类 + 7 个值对象
3. **基础 CRUD API**：Repository、Folder、Resource 的增删改查

### P1 - 双向链接（2 周）

4. **LinkParserService**：解析 Markdown `[[]]` 语法
5. **ResourceLink API**：创建、查询、验证链接
6. **反向链接查询**：查询所有指向当前资源的链接
7. **断链检测**：标记已删除资源的链接

### P2 - 版本管理（1 周）

8. **ResourceVersion API**：版本列表、详情、Diff、回滚
9. **自动版本创建**：资源内容更新时触发
10. **Diff 可视化**：前端使用 diff2html 组件

### P3 - 知识图谱（2 周）

11. **图谱生成 API**：基于 ResourceLink 构建图数据
12. **图谱可视化**：前端使用 Cytoscape.js
13. **相似内容推荐**：基于 TF-IDF 或 NLP

### P4 - 全文搜索（1 周）

14. **PostgreSQL 全文搜索**：激活 `@@fulltext` 索引
15. **搜索 API**：关键词、筛选、分页
16. **搜索高亮**：前端高亮匹配文本

---

## 📞 联系与反馈

- **BA 文档作者**: Business Analyst
- **PM 审核**: PM - John
- **技术实现负责人**: （待指定）

如有疑问或建议，请在项目 Issue 中提出。

---

**最后更新**: 2025-11-09  
**文档版本**: v1.0
