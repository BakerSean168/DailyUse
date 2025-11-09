# 仓储模块 - 数据库架构设计

> **文档类型**: BA 需求文档  
> **作者**: BA - Business Analyst  
> **日期**: 2025-11-09  
> **版本**: v1.0  
> **项目**: DailyUse - Repository Module (Obsidian-inspired)

---

## 📋 文档目标

基于用户提出的 **Obsidian 风格知识管理系统**愿景，本文档定义仓储模块（Repository）的数据库架构设计，包括：

1. 现有数据库表结构分析
2. Document 模块迁移到 Repository 的映射关系
3. 新增表结构设计（Folder、ResourceVersion、ResourceLink）
4. 数据库索引优化建议
5. 迁移脚本规划

---

## �� 现有数据库分析

### 1. Document 模块（需要废弃并迁移）

根据现有 Prisma Schema，Document 模块包含以下表：

```prisma
✅ document          - 文档主表（需迁移到 resource）
✅ document_version  - 版本历史（可复用逻辑到 resource_version）
✅ document_link     - 文档链接关系（可复用到 resource_link）
```

**关键字段分析**：

| 表名 | 关键字段 | 说明 | 迁移目标 |
|------|---------|------|---------|
| `document` | `uuid`, `accountUuid`, `title`, `content`, `folderPath`, `tags[]`, `status`, `currentVersion` | 已支持文件夹路径和标签 | → `resource` 表 |
| `document_version` | `uuid`, `documentUuid`, `versionNumber`, `content`, `changeType`, `changeDescription` | 完整的版本管理机制 | → `resource_version` 表 |
| `document_link` | `uuid`, `sourceDocumentUuid`, `targetDocumentUuid`, `linkText`, `linkPosition`, `isBroken` | 双向链接支持 | → `resource_link` 表 |

**迁移决策**：
- ✅ **保留版本管理逻辑**：`document_version` 的设计很好，直接复用
- ✅ **保留双向链接机制**：`document_link` 支持反向链接，符合 Obsidian 理念
- ✅ **扩展资源类型**：从纯文档扩展到支持图片、视频、音频等多媒体

---

### 2. Repository 模块（现有表）

```prisma
✅ repository          - 仓储主表（保留）
⚠️ repository_resource - 资源表（字段不完整，需扩展）
⚠️ resource            - 新的 Epic 7 资源表（与 repository_resource 重复）
✅ resource_reference  - 资源引用关系（保留，但需与 resource_link 合并）
✅ linked_content      - 外部链接内容（保留）
✅ repository_explorer - 浏览器状态（保留）
```

**问题识别**：

| 问题 | 描述 | 解决方案 |
|------|------|---------|
| 🔴 **表结构重复** | `repository_resource` 和 `resource` 同时存在 | 废弃 `repository_resource`，统一使用 `resource` |
| 🔴 **缺少 Folder 表** | 只有 `folderPath: string`，不支持树形层级 | 新增 `folder` 表 |
| 🔴 **Resource 表缺少 content** | Markdown 内容存在 `metadata` JSON 中 | 添加 `content` 字段（TEXT 类型） |
| 🟡 **引用关系重复** | `resource_reference` 与即将新增的 `resource_link` 功能重叠 | 合并或废弃 `resource_reference` |

---

## 🆕 新增表结构设计

### 1. Folder 表（文件夹层级）

**设计目标**：支持 Obsidian 风格的文件夹树形结构

```prisma
model folder {
  uuid           String   @id
  repositoryUuid String   @map("repository_uuid")
  parentUuid     String?  @map("parent_uuid")  // 支持树形结构
  name           String
  path           String   // 完整路径 /docs/tech/vue
  order          Int      @default(0)
  isExpanded     Boolean  @default(true) @map("is_expanded")
  metadata       Json?    // { icon, color, description }
  createdAt      BigInt   @map("created_at")
  updatedAt      BigInt   @map("updated_at")
  
  repository repository @relation(fields: [repositoryUuid], references: [uuid], onDelete: Cascade)
  parent     folder?    @relation("FolderHierarchy", fields: [parentUuid], references: [uuid], onDelete: Cascade)
  children   folder[]   @relation("FolderHierarchy")
  resources  resource[]
  
  @@unique([repositoryUuid, path])
  @@index([repositoryUuid, parentUuid])
  @@index([repositoryUuid, order])
  @@map("folders")
}
```

**业务规则**：
- ✅ `path` 字段自动生成，格式：`/parent/child/grandchild`
- ✅ 根文件夹的 `parentUuid` 为 `null`
- ✅ 同一父文件夹下，`name` 必须唯一
- ✅ 删除文件夹时级联删除所有子文件夹和资源

**示例数据**：
```json
{
  "uuid": "f1",
  "repositoryUuid": "r1",
  "parentUuid": null,
  "name": "技术文档",
  "path": "/技术文档",
  "order": 0,
  "isExpanded": true,
  "metadata": { "icon": "📚", "color": "#3B82F6" }
}
```

---

### 2. Resource 表（扩展现有表）

**设计目标**：支持多种资源类型（Markdown、图片、视频等）

```prisma
model resource {
  uuid           String  @id
  repositoryUuid String  @map("repository_uuid")
  folderUuid     String? @map("folder_uuid")  // 🆕 关联到 folder 表
  name           String
  type           String  // markdown | image | video | audio | pdf | link | code
  path           String  // 相对路径
  size           Int     @default(0)
  content        String? @db.Text  // 🆕 Markdown 内容直接存储
  description    String?
  author         String?
  version        String? // 语义化版本号
  tags           String  @default("[]")  // JSON array
  category       String?
  status         String  @default("ACTIVE")
  
  // 🆕 资源元数据（Value Object）
  metadata       Json    @default("{}")  // { wordCount, readingTime, lastEditor, ... }
  
  // 🆕 资源统计（Value Object）
  stats          Json    @default("{}")  // { viewCount, editCount, linkCount, ... }
  
  // 时间戳
  createdAt      BigInt  @map("created_at")
  updatedAt      BigInt  @map("updated_at")
  modifiedAt     BigInt? @map("modified_at")
  
  // 关系
  repository     repository         @relation(fields: [repositoryUuid], references: [uuid], onDelete: Cascade)
  folder         folder?            @relation(fields: [folderUuid], references: [uuid], onDelete: SetNull)
  versions       resource_version[]
  sourceLinks    resource_link[]    @relation("source_links")
  targetLinks    resource_link[]    @relation("target_links")
  
  @@unique([repositoryUuid, path])
  @@index([repositoryUuid, folderUuid])
  @@index([repositoryUuid, type])
  @@index([repositoryUuid, status])
  @@index([repositoryUuid, createdAt])
  @@fulltext([name, content])  // 🆕 PostgreSQL 全文搜索索引
  @@map("resources")
}
```

**关键变更**：
- 🆕 `folderUuid`：关联到 `folder` 表（取代 `folderPath` 字符串）
- 🆕 `content`：TEXT 类型，直接存储 Markdown 内容（便于全文搜索）
- 🆕 `metadata` JSON：存储自动计算的元数据（字数、阅读时间等）
- 🆕 `stats` JSON：存储统计数据（查看次数、编辑次数等）
- 🆕 `@@fulltext`：PostgreSQL 全文搜索索引

**示例数据**：
```json
{
  "uuid": "res1",
  "repositoryUuid": "r1",
  "folderUuid": "f1",
  "name": "Vue3 组件设计",
  "type": "markdown",
  "content": "# Vue3 组件设计\n\n本文介绍...",
  "tags": ["Vue3", "前端", "组件化"],
  "metadata": {
    "wordCount": 1500,
    "readingTime": 8,
    "lastEditor": "user1"
  },
  "stats": {
    "viewCount": 42,
    "editCount": 5,
    "linkCount": 3
  }
}
```

---

### 3. ResourceVersion 表（版本历史）

**设计目标**：复用 `document_version` 的版本管理逻辑

```prisma
model resource_version {
  uuid              String  @id
  resourceUuid      String  @map("resource_uuid")
  versionNumber     Int     @map("version_number")
  content           String  @db.Text
  changeType        String  @map("change_type") // initial | major | minor | restore
  changeDescription String? @map("change_description")
  changedBy         String  @map("changed_by")
  restoredFrom      String? @map("restored_from")
  metadata          Json?   // { addedChars, deletedChars, modifiedLines }
  createdAt         BigInt  @map("created_at")
  
  resource resource @relation(fields: [resourceUuid], references: [uuid], onDelete: Cascade)
  account  account  @relation(fields: [changedBy], references: [uuid])
  
  @@index([resourceUuid, versionNumber])
  @@index([resourceUuid, createdAt])
  @@index([changedBy])
  @@map("resource_versions")
}
```

**业务规则**：
- ✅ 每次更新 `resource.content` 时自动创建新版本
- ✅ `versionNumber` 自动递增
- ✅ `changeType` 由用户选择（major/minor）或系统判断
- ✅ `metadata` 存储 Diff 统计（新增字符数、删除字符数等）

---

### 4. ResourceLink 表（资源链接关系）

**设计目标**：支持 Obsidian 的 `[[]]` 双向链接语法

```prisma
model resource_link {
  uuid               String  @id
  sourceResourceUuid String  @map("source_resource_uuid")
  targetResourceUuid String? @map("target_resource_uuid")  // Nullable for broken links
  linkType           String  @map("link_type")  // BIDIRECTIONAL | EMBED | REFERENCE
  linkText           String  @map("link_text")  // 原始文本 "[[项目计划]]"
  lineNumber         Int?    @map("line_number")  // 所在行号
  context            String? @db.Text  // 上下文片段
  isBroken           Boolean @default(false) @map("is_broken")
  createdAt          BigInt  @map("created_at")
  updatedAt          BigInt  @map("updated_at")
  
  sourceResource resource  @relation("source_links", fields: [sourceResourceUuid], references: [uuid], onDelete: Cascade)
  targetResource resource? @relation("target_links", fields: [targetResourceUuid], references: [uuid], onDelete: SetNull)
  
  @@index([sourceResourceUuid])
  @@index([targetResourceUuid])
  @@index([isBroken])
  @@map("resource_links")
}
```

**链接类型**：
- `BIDIRECTIONAL`：双向链接 `[[目标资源]]`
- `EMBED`：嵌入链接 `![[图片.png]]`
- `REFERENCE`：普通引用 `[链接文本](url)`

**业务规则**：
- ✅ 解析 Markdown 内容时自动创建 `resource_link` 记录
- ✅ 目标资源被删除时，`isBroken` 标记为 `true`
- ✅ 提供断链修复建议（基于相似名称）

---

## 📊 数据库迁移方案

### Document → Resource 迁移映射

```sql
-- 1. 迁移 document 到 resource
INSERT INTO resources (
  uuid, 
  repository_uuid, 
  folder_uuid,  -- 需要先创建对应的 folder 记录
  name, 
  type, 
  content, 
  tags, 
  status,
  created_at, 
  updated_at
)
SELECT 
  uuid,
  '默认仓储UUID',  -- 需要为每个用户创建默认仓储
  (SELECT uuid FROM folders WHERE path = d.folder_path),  -- 根据路径查找 folder
  title,
  'markdown',
  content,
  tags::text,
  status,
  created_at,
  updated_at
FROM documents d;

-- 2. 迁移 document_version 到 resource_version
INSERT INTO resource_versions (
  uuid,
  resource_uuid,
  version_number,
  content,
  change_type,
  change_description,
  changed_by,
  restored_from,
  metadata,
  created_at
)
SELECT 
  uuid,
  document_uuid,
  version_number,
  content,
  change_type,
  change_description,
  changed_by,
  restored_from,
  metadata,
  created_at
FROM document_versions;

-- 3. 迁移 document_link 到 resource_link
INSERT INTO resource_links (
  uuid,
  source_resource_uuid,
  target_resource_uuid,
  link_type,
  link_text,
  line_number,
  is_broken,
  created_at,
  updated_at
)
SELECT 
  uuid,
  source_document_uuid,
  target_document_uuid,
  'BIDIRECTIONAL',
  link_text,
  link_position,
  is_broken,
  created_at,
  updated_at
FROM document_links;
```

---

## 🔧 索引优化建议

### 高频查询索引

```prisma
// 1. Repository 表
model repository {
  @@index([accountUuid, status])
  @@index([accountUuid, type])
  @@index([path])
  @@index([createdAt])
}

// 2. Folder 表
model folder {
  @@index([repositoryUuid, parentUuid])
  @@index([repositoryUuid, order])  // 排序查询
}

// 3. Resource 表
model resource {
  @@index([repositoryUuid, folderUuid])
  @@index([repositoryUuid, type])
  @@index([repositoryUuid, status])
  @@index([repositoryUuid, createdAt])
  @@fulltext([name, content])  // 全文搜索
}

// 4. ResourceLink 表
model resource_link {
  @@index([sourceResourceUuid])
  @@index([targetResourceUuid])
  @@index([isBroken])
}
```

---

## 📝 总结

### 核心变更

| 变更类型 | 内容 | 影响 |
|---------|------|------|
| �� 新增表 | `folder`, `resource_version`, `resource_link` | 支持文件夹树、版本管理、双向链接 |
| ♻️ 扩展表 | `resource` 添加 `content`, `metadata`, `stats` | 支持全文搜索和统计 |
| 🗑️ 废弃表 | `document`, `document_version`, `document_link`, `repository_resource` | 迁移到新架构 |
| 🔍 索引优化 | 添加复合索引和全文索引 | 提升查询性能 |

### 下一步

1. ✅ 完成领域模型设计（见 02-DOMAIN_MODEL_DESIGN.md）
2. ⏭️ 设计应用服务接口（见 03-APPLICATION_SERVICE_DESIGN.md）
3. ⏭️ 设计 RESTful API（见 04-API_ENDPOINT_DESIGN.md）
4. ⏭️ 设计前端交互流程（见 05-FRONTEND_UX_DESIGN.md）

---

**文档作者**: BA - Business Analyst  
**审核人员**: PM - John  
**最后更新**: 2025-11-09
