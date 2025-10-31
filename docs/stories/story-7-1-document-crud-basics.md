# Story 7-1: 文档 CRUD 基础功能

**Story ID**: STORY-7.1  
**Epic**: Epic 7 - Repository Module  
**优先级**: P0  
**Story Points**: 5  
**状态**: In Progress  
**开始时间**: 2025-10-31

---

## 📋 Story 概述

实现 Repository 模块的核心 CRUD 功能,包括文档的创建、查询、更新和删除操作,支持文件夹组织和标签管理。

---

## 🎯 验收标准 (Gherkin)

```gherkin
Feature: 文档 CRUD 基础功能

Scenario: 创建新文档
  Given 用户已登录
  When 用户创建文档 "新文档.md"
    And 设置标题为 "我的第一篇文档"
    And 设置内容为 "# Hello World"
    And 选择文件夹为 "/projects"
    And 添加标签 ["技术", "笔记"]
  Then 文档创建成功
    And 返回文档 UUID
    And 文档状态为 "DRAFT"

Scenario: 查看文档列表
  Given 用户已创建3篇文档
  When 用户请求文档列表
  Then 返回3篇文档
    And 按更新时间倒序排列
    And 包含标题、状态、标签等信息

Scenario: 按文件夹筛选
  Given 用户有文档在 "/projects" 和 "/notes" 文件夹
  When 用户筛选文件夹 "/projects"
  Then 只返回 "/projects" 下的文档

Scenario: 按标签筛选
  Given 用户有标签为 "技术" 和 "生活" 的文档
  When 用户筛选标签 "技术"
  Then 只返回带 "技术" 标签的文档

Scenario: 搜索文档
  Given 用户有文档标题包含 "Vue" 和 "React"
  When 用户搜索 "Vue"
  Then 返回标题或内容包含 "Vue" 的文档

Scenario: 更新文档
  Given 用户有文档 "doc-001"
  When 用户更新标题为 "新标题"
    And 更新内容为 "# 新内容"
  Then 文档更新成功
    And updatedAt 时间戳更新

Scenario: 删除文档 (软删除)
  Given 用户有文档 "doc-001"
  When 用户删除文档
  Then 文档标记为已删除 (deletedAt 不为 null)
    And 文档不再出现在列表中

Scenario: 发布文档
  Given 用户有草稿文档 "doc-001"
  When 用户发布文档
  Then 文档状态变为 "PUBLISHED"
    And publishedAt 时间戳设置

Scenario: 归档文档
  Given 用户有已发布文档 "doc-001"
  When 用户归档文档
  Then 文档状态变为 "ARCHIVED"
    And archivedAt 时间戳设置
```

---

## 🏗️ 技术实现

### 数据模型 (Prisma Schema)

```prisma
model document {
  uuid            String   @id
  accountUuid     String   @map("account_uuid")
  title           String
  content         String   @db.Text
  folderPath      String   @map("folder_path")
  tags            String[] // PostgreSQL array
  status          String   @default("DRAFT") // DRAFT | PUBLISHED | ARCHIVED
  currentVersion  Int      @default(0) @map("current_version")
  publishedAt     BigInt?  @map("published_at")
  archivedAt      BigInt?  @map("archived_at")
  createdAt       BigInt   @map("created_at")
  updatedAt       BigInt   @map("updated_at")
  deletedAt       BigInt?  @map("deleted_at")

  account      account            @relation(fields: [accountUuid], references: [uuid], onDelete: Cascade)
  versions     document_version[] // 版本历史关联

  @@map("documents")
  @@index([accountUuid])
  @@index([folderPath])
  @@index([status])
  @@index([createdAt])
  @@index([updatedAt])
}

model document_version {
  uuid         String @id
  documentUuid String @map("document_uuid")
  version      Int
  title        String
  content      String @db.Text
  changeType   String @map("change_type") // CREATE | UPDATE | PUBLISH | ARCHIVE
  changedBy    String @map("changed_by")
  changeNote   String? @map("change_note")
  createdAt    BigInt @map("created_at")

  document document @relation(fields: [documentUuid], references: [uuid], onDelete: Cascade)
  account  account  @relation(fields: [changedBy], references: [uuid])

  @@unique([documentUuid, version])
  @@map("document_versions")
  @@index([documentUuid])
  @@index([createdAt])
}
```

### Domain Layer (DDD)

**Aggregate Root**: `Document`
- 管理文档生命周期 (Draft → Published → Archived)
- 支持软删除
- 版本号自增

**Value Objects**:
- `DocumentStatus` (DRAFT | PUBLISHED | ARCHIVED)
- `DocumentMetadata` (title, tags, folderPath)

**Domain Service**:
- `DocumentDomainService` - 文档创建工厂方法

### API Endpoints

```
POST   /api/documents              创建文档
GET    /api/documents              查询文档列表
GET    /api/documents/:uuid        获取文档详情
PATCH  /api/documents/:uuid        更新文档
DELETE /api/documents/:uuid        删除文档 (软删除)
POST   /api/documents/:uuid/publish   发布文档
POST   /api/documents/:uuid/archive   归档文档
GET    /api/documents/search       搜索文档
```

---

## 📦 实施计划

### Phase 1: Contracts (30 min)
- [ ] 定义 Document 接口 (Server/Client DTO)
- [ ] 定义 DocumentStatus 枚举
- [ ] 定义 API 请求/响应类型

### Phase 2: Domain Layer (2 hours)
- [ ] Document 聚合根
- [ ] DocumentVersion 实体
- [ ] DocumentDomainService
- [ ] Repository 接口

### Phase 3: Infrastructure Layer (1.5 hours)
- [ ] PrismaDocumentRepository
- [ ] Prisma Schema 更新
- [ ] Database Migration

### Phase 4: Application Layer (1 hour)
- [ ] DocumentService (业务逻辑)
- [ ] DTO 映射

### Phase 5: API Layer (1.5 hours)
- [ ] DocumentController
- [ ] Routes 配置
- [ ] Swagger 文档

### Phase 6: Frontend (待定)
- [ ] Document list view
- [ ] Document detail view
- [ ] Create/Edit form

---

## 🧪 测试策略

- **Unit Tests**: Document aggregate, Domain service
- **Integration Tests**: Repository, API endpoints
- **E2E Tests**: Complete user journey

---

## 📝 Notes

- Document 使用软删除,保留数据以便恢复
- 版本历史在 Story 7-2 实现
- 全文搜索功能在后续 Story 实现

---

**Created**: 2025-10-31  
**Last Updated**: 2025-10-31  
**Status**: In Progress
