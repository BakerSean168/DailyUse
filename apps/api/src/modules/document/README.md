# Document Module - Backend Implementation

## 📋 概述

Document Module 实现了基于 DDD 架构的 Markdown 文档管理系统。

## 🏗️ 架构设计

### 目录结构
```
document/
├── domain/
│   ├── Document.ts                      # 聚合根
│   └── DocumentRepository.interface.ts  # 仓储接口
├── infrastructure/
│   └── PrismaDocumentRepository.ts      # Prisma 实现
├── application/
│   └── DocumentApplicationService.ts    # 应用服务
├── presentation/
│   └── document.controller.ts           # HTTP 控制器
├── __tests__/
│   └── Document.spec.ts                 # 单元测试
├── document.module.ts                   # NestJS 模块
└── README.md                            # 本文档
```

## ✨ 核心功能

### Domain Layer - Document Aggregate Root

**文件**: `domain/Document.ts` (290 lines)

**Factory Methods**:
- `Document.create()` - 创建新文档
- `Document.fromPersistence()` - 从持久化数据重建聚合

**Business Methods** (11个):
- `updateTitle(newTitle: string)` - 更新标题
- `updateContent(newContent: string)` - 更新内容
- `moveTo(newFolderPath: string)` - 移动到新文件夹
- `addTag(tag: string)` - 添加标签
- `removeTag(tag: string)` - 移除标签
- `publish()` - 发布文档
- `archive()` - 归档文档
- `softDelete()` - 软删除

**DTO Conversions**:
- `toServerDTO()` - 服务端 DTO (包含敏感数据)
- `toClientDTO()` - 客户端 DTO (公开数据)
- `toPersistence()` - 持久化 DTO

**Computed Properties**:
- `excerpt` - 自动生成前 200 字符摘要

### Repository Layer

**文件**: `domain/DocumentRepository.interface.ts` (35 lines)

**Methods**:
- `save(document: Document): Promise<void>`
- `findByUuid(uuid: string): Promise<Document | null>`
- `findByAccountUuid(accountUuid, options): Promise<PaginatedResult<Document>>`
- `delete(uuid: string): Promise<void>`

**Implementation**: `infrastructure/PrismaDocumentRepository.ts` (110 lines)
- Pagination support
- Sorting (createdAt, updatedAt, title)
- Filtering by folderPath
- User data isolation

### Application Layer

**文件**: `application/DocumentApplicationService.ts` (130 lines)

**Methods** (5个):
- `createDocument(dto)` - 创建文档
- `findDocuments(accountUuid, query)` - 查询文档列表 (分页)
- `findDocumentByUuid(accountUuid, uuid)` - 查询单个文档
- `updateDocument(accountUuid, uuid, dto)` - 更新文档
- `deleteDocument(accountUuid, uuid)` - 删除文档

**Business Rules**:
- User data isolation (accountUuid validation)
- Input validation (title, content length)
- Authorization check (403 Forbidden if access denied)

### Presentation Layer

**文件**: `presentation/document.controller.ts` (60 lines)

**HTTP APIs** (5个):

| Method | Path | 功能 | 权限 |
|--------|------|------|------|
| POST | /documents | 创建文档 | JWT |
| GET | /documents | 查询文档列表 (分页) | JWT |
| GET | /documents/:uuid | 查询单个文档 | JWT |
| PUT | /documents/:uuid | 更新文档 | JWT |
| DELETE | /documents/:uuid | 删除文档 (软删除) | JWT |

**Security**:
- JwtAuthGuard on all routes
- User data isolation
- 403 Forbidden if access denied

## 📊 数据模型

### Database Schema (Prisma)

```prisma
model document {
  uuid         String   @id
  accountUuid  String   @map("account_uuid")
  title        String
  content      String   @db.Text
  folderPath   String   @map("folder_path")
  tags         String[] // PostgreSQL array
  status       String   @default("DRAFT")
  createdAt    Int      @default(dbgenerated("...")) @map("created_at")
  updatedAt    Int      @default(dbgenerated("...")) @map("updated_at")
  deletedAt    Int?     @map("deleted_at")
  
  account      account  @relation(...)
  
  @@index([accountUuid, deletedAt])
  @@index([accountUuid, folderPath])
  @@index([accountUuid, status])
  @@map("documents")
}
```

## 🧪 测试

### Unit Tests

**文件**: `__tests__/Document.spec.ts`

**Test Suites** (8个):
- ✅ Document.create() - 创建文档
- ✅ Document.updateTitle() - 更新标题
- ✅ Document.updateContent() - 更新内容
- ✅ Document.moveTo() - 移动文件夹
- ✅ Document.addTag() - 添加标签
- ✅ Document.softDelete() - 软删除
- ✅ Document.toClientDTO() - 客户端 DTO 转换
- ✅ Document.excerpt - 摘要生成

## 📦 使用示例

### Creating a Document

```typescript
const dto = {
  accountUuid: 'user-uuid',
  title: 'My First Document',
  content: '# Hello World\n\nThis is my first document.',
  folderPath: '/personal/notes',
  tags: ['note', 'draft'],
};

const document = await documentService.createDocument(dto);
```

### Finding Documents

```typescript
const result = await documentService.findDocuments('user-uuid', {
  page: 1,
  pageSize: 20,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  folderPath: '/personal',
});

console.log(result.items); // Document[]
console.log(result.total); // 总数
```

### Updating a Document

```typescript
await documentService.updateDocument('user-uuid', 'doc-uuid', {
  title: 'Updated Title',
  content: '# Updated Content',
});
```

## 🔒 Security

- **Authentication**: JWT required for all endpoints
- **Authorization**: User can only access their own documents
- **Data Isolation**: accountUuid filter in all queries
- **Soft Delete**: Documents are soft-deleted (deletedAt timestamp)

## 📈 Performance

- **Indexes**: 3 composite indexes for fast queries
  - `(accountUuid, deletedAt)`
  - `(accountUuid, folderPath)`
  - `(accountUuid, status)`
- **Pagination**: Default 20 items per page
- **Content Limit**: Max 100KB per document

## 🚀 Next Steps

- [ ] Integration Tests
- [ ] E2E Tests
- [ ] Full-text search (PostgreSQL tsvector)
- [ ] Document tagging system
- [ ] Version history (Story 7-2)

---

**Created**: 2025-10-30  
**Author**: BMad Master Agent  
**Module**: Document (Story 7-1)
