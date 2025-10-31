# Story 7-1: Document CRUD Basics (文档 CRUD 基础功能)

> **Story ID**: 7-1  
> **Epic**: Epic 7 - Repository Module (知识仓库)  
> **优先级**: P0  
> **Story Points**: 5  
> **创建日期**: 2025-10-30  
> **状态**: ✅ Ready for Dev

---

## 📋 Story 概述

**作为** 一名 DailyUse 用户  
**我想要** 创建、查看、编辑、删除 Markdown 文档  
**以便于** 管理我的知识库和笔记内容

---

## 🎯 验收标准

### Scenario 1: 创建文档
```gherkin
Given 用户已登录
And 用户在知识仓库页面
When 用户点击"新建文档"按钮
And 输入文档标题 "产品规划文档"
And 输入文档内容 "# 产品规划\n\n## Q4 目标\n..."
And 选择文件夹 "/工作/产品"
And 点击"保存"按钮
Then 文档创建成功
And 显示成功提示 "文档已保存"
And 返回文档详情页
And 文档 UUID 自动生成
And createdAt 和 updatedAt 时间戳自动设置
```

### Scenario 2: 查看文档列表
```gherkin
Given 用户已登录
And 用户有 10 篇文档
When 用户访问知识仓库页面
Then 显示文档列表
And 每个文档显示: 标题、摘要、创建时间、修改时间
And 支持按文件夹筛选
And 支持按标题搜索
And 支持分页 (默认每页 20 条)
And 默认按修改时间倒序排列
```

### Scenario 3: 查看文档详情
```gherkin
Given 用户已登录
And 文档 "产品规划文档" 存在
When 用户点击文档
Then 跳转到文档详情页
And 显示文档标题
And 显示文档内容 (Markdown 渲染)
And 显示创建时间、修改时间
And 显示所属文件夹
And 显示操作按钮: 编辑、删除、分享
```

### Scenario 4: 编辑文档
```gherkin
Given 用户在文档详情页
When 用户点击"编辑"按钮
Then 进入编辑模式
And 标题和内容可编辑
And 实时预览 Markdown 渲染效果
When 用户修改标题为 "产品规划 V2"
And 修改内容添加 "## Q1 目标\n..."
And 点击"保存"按钮
Then 文档更新成功
And 显示成功提示 "文档已更新"
And updatedAt 时间戳更新
And 返回文档详情页
```

### Scenario 5: 删除文档
```gherkin
Given 用户在文档详情页
When 用户点击"删除"按钮
And 确认删除操作
Then 文档被软删除
And deletedAt 时间戳设置
And 显示成功提示 "文档已删除"
And 返回文档列表页
And 文档不再显示在列表中
```

### Scenario 6: 文件夹组织
```gherkin
Given 用户已登录
When 用户创建文档
Then 可以选择文件夹路径
And 支持输入路径 "/工作/产品/规划"
And 自动创建不存在的文件夹
And 文件夹路径使用 "/" 分隔
And 最大深度支持 5 层
```

### Scenario 7: 数据隔离
```gherkin
Given 用户 A 创建了文档 "私密笔记"
When 用户 B 尝试访问该文档 UUID
Then 返回 403 Forbidden
And 显示错误提示 "您无权访问此文档"
```

---

## 🏗️ 技术实现

### Backend (NestJS + DDD)

#### 1. Domain Layer

**Document Aggregate Root** (`Document.ts`)
```typescript
interface DocumentProps {
  uuid: string;
  accountUuid: string;
  title: string;
  content: string;
  folderPath: string;
  tags: string[];
  status: DocumentStatus; // DRAFT | PUBLISHED | ARCHIVED
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

class Document {
  // Factory Methods
  static create(props: CreateDocumentProps): Result<Document>
  static fromPersistence(props: DocumentProps): Result<Document>
  
  // Business Methods
  updateTitle(newTitle: string): Result<void>
  updateContent(newContent: string): Result<void>
  moveTo(newFolderPath: string): Result<void>
  addTag(tag: string): Result<void>
  removeTag(tag: string): Result<void>
  publish(): Result<void>
  archive(): Result<void>
  softDelete(): Result<void>
  
  // Getters
  get uuid(): string
  get title(): string
  get content(): string
  get excerpt(): string // 前 200 字符
  get folderPath(): string
  get tags(): string[]
  get isDeleted(): boolean
  
  // DTO Conversions
  toServerDTO(): DocumentServerDTO
  toClientDTO(): DocumentClientDTO
  toPersistence(): DocumentPersistenceDTO
}
```

**Repository Interface** (`DocumentRepository.interface.ts`)
```typescript
interface DocumentRepository {
  save(document: Document): Promise<void>;
  findByUuid(uuid: string): Promise<Document | null>;
  findByAccountUuid(
    accountUuid: string,
    options: FindOptions
  ): Promise<PaginatedResult<Document>>;
  findByFolderPath(
    accountUuid: string,
    folderPath: string
  ): Promise<Document[]>;
  searchByTitle(
    accountUuid: string,
    keyword: string
  ): Promise<Document[]>;
  delete(uuid: string): Promise<void>;
}

interface FindOptions {
  page: number;
  pageSize: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  folderPath?: string;
}
```

#### 2. Infrastructure Layer

**PrismaDocumentRepository** (`PrismaDocumentRepository.ts`)
```typescript
@Injectable()
class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}
  
  async save(document: Document): Promise<void> {
    const data = document.toPersistence();
    await this.prisma.document.upsert({
      where: { uuid: data.uuid },
      create: data,
      update: data,
    });
  }
  
  async findByUuid(uuid: string): Promise<Document | null> {
    const raw = await this.prisma.document.findUnique({ where: { uuid } });
    return raw ? Document.fromPersistence(raw).getValue() : null;
  }
  
  async findByAccountUuid(
    accountUuid: string,
    options: FindOptions
  ): Promise<PaginatedResult<Document>> {
    const { page, pageSize, sortBy = 'updatedAt', sortOrder = 'desc' } = options;
    const where = {
      accountUuid,
      deletedAt: null,
      ...(options.folderPath && { folderPath: options.folderPath }),
    };
    
    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.document.count({ where }),
    ]);
    
    return {
      items: items.map(item => Document.fromPersistence(item).getValue()),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  
  // ... other methods
}
```

#### 3. Application Layer

**DocumentApplicationService** (`DocumentApplicationService.ts`)
```typescript
@Injectable()
class DocumentApplicationService {
  constructor(private readonly repository: DocumentRepository) {}
  
  async createDocument(dto: CreateDocumentDTO): Promise<DocumentClientDTO> {
    const document = Document.create({
      accountUuid: dto.accountUuid,
      title: dto.title,
      content: dto.content,
      folderPath: dto.folderPath || '/',
      tags: dto.tags || [],
    });
    
    if (document.isFailure) {
      throw new BadRequestException(document.error);
    }
    
    await this.repository.save(document.getValue());
    return document.getValue().toClientDTO();
  }
  
  async findDocuments(
    accountUuid: string,
    options: FindDocumentsQueryDTO
  ): Promise<PaginatedResult<DocumentClientDTO>> {
    const result = await this.repository.findByAccountUuid(accountUuid, options);
    return {
      ...result,
      items: result.items.map(doc => doc.toClientDTO()),
    };
  }
  
  async findDocumentByUuid(
    accountUuid: string,
    uuid: string
  ): Promise<DocumentClientDTO> {
    const document = await this.repository.findByUuid(uuid);
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    if (document.accountUuid !== accountUuid) {
      throw new ForbiddenException('You do not have access to this document');
    }
    
    return document.toClientDTO();
  }
  
  async updateDocument(
    accountUuid: string,
    uuid: string,
    dto: UpdateDocumentDTO
  ): Promise<DocumentClientDTO> {
    const document = await this.repository.findByUuid(uuid);
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    if (document.accountUuid !== accountUuid) {
      throw new ForbiddenException('You do not have access to this document');
    }
    
    if (dto.title) {
      const result = document.updateTitle(dto.title);
      if (result.isFailure) throw new BadRequestException(result.error);
    }
    
    if (dto.content) {
      const result = document.updateContent(dto.content);
      if (result.isFailure) throw new BadRequestException(result.error);
    }
    
    if (dto.folderPath) {
      const result = document.moveTo(dto.folderPath);
      if (result.isFailure) throw new BadRequestException(result.error);
    }
    
    await this.repository.save(document);
    return document.toClientDTO();
  }
  
  async deleteDocument(accountUuid: string, uuid: string): Promise<void> {
    const document = await this.repository.findByUuid(uuid);
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    if (document.accountUuid !== accountUuid) {
      throw new ForbiddenException('You do not have access to this document');
    }
    
    document.softDelete();
    await this.repository.save(document);
  }
}
```

#### 4. Presentation Layer

**DocumentController** (`document.controller.ts`)
```typescript
@Controller('documents')
@UseGuards(JwtAuthGuard)
class DocumentController {
  constructor(private readonly service: DocumentApplicationService) {}
  
  @Post()
  async createDocument(
    @Req() req: AuthRequest,
    @Body() dto: CreateDocumentDTO
  ): Promise<ApiResponse<DocumentClientDTO>> {
    const result = await this.service.createDocument({
      ...dto,
      accountUuid: req.user.accountUuid,
    });
    return { success: true, data: result };
  }
  
  @Get()
  async findDocuments(
    @Req() req: AuthRequest,
    @Query() query: FindDocumentsQueryDTO
  ): Promise<ApiResponse<PaginatedResult<DocumentClientDTO>>> {
    const result = await this.service.findDocuments(req.user.accountUuid, query);
    return { success: true, data: result };
  }
  
  @Get(':uuid')
  async findDocumentByUuid(
    @Req() req: AuthRequest,
    @Param('uuid') uuid: string
  ): Promise<ApiResponse<DocumentClientDTO>> {
    const result = await this.service.findDocumentByUuid(req.user.accountUuid, uuid);
    return { success: true, data: result };
  }
  
  @Put(':uuid')
  async updateDocument(
    @Req() req: AuthRequest,
    @Param('uuid') uuid: string,
    @Body() dto: UpdateDocumentDTO
  ): Promise<ApiResponse<DocumentClientDTO>> {
    const result = await this.service.updateDocument(req.user.accountUuid, uuid, dto);
    return { success: true, data: result };
  }
  
  @Delete(':uuid')
  async deleteDocument(
    @Req() req: AuthRequest,
    @Param('uuid') uuid: string
  ): Promise<ApiResponse<void>> {
    await this.service.deleteDocument(req.user.accountUuid, uuid);
    return { success: true, message: 'Document deleted successfully' };
  }
}
```

### Database Schema (Prisma)

```prisma
model document {
  uuid         String   @id
  accountUuid  String   @map("account_uuid")
  title        String
  content      String   @db.Text
  folderPath   String   @map("folder_path")
  tags         String[] // PostgreSQL array
  status       String   @default("DRAFT") // DRAFT | PUBLISHED | ARCHIVED
  createdAt    Int      @default(dbgenerated("extract(epoch from now())::integer")) @map("created_at")
  updatedAt    Int      @default(dbgenerated("extract(epoch from now())::integer")) @map("updated_at")
  deletedAt    Int?     @map("deleted_at")
  
  account      account  @relation(fields: [accountUuid], references: [uuid], onDelete: Cascade)
  
  @@index([accountUuid, deletedAt])
  @@index([accountUuid, folderPath])
  @@index([accountUuid, status])
  @@map("documents")
}
```

### Frontend (Vue 3 + Vuetify)

#### 1. API Client

**DocumentApiClient.ts**
```typescript
class DocumentApiClient {
  private readonly baseUrl = '/api/documents';
  
  async createDocument(dto: CreateDocumentDTO): Promise<DocumentClientDTO> {
    const response = await apiClient.post(this.baseUrl, dto);
    return response.data.data;
  }
  
  async findDocuments(query: FindDocumentsQueryDTO): Promise<PaginatedResult<DocumentClientDTO>> {
    const response = await apiClient.get(this.baseUrl, { params: query });
    return response.data.data;
  }
  
  async findDocumentByUuid(uuid: string): Promise<DocumentClientDTO> {
    const response = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return response.data.data;
  }
  
  async updateDocument(uuid: string, dto: UpdateDocumentDTO): Promise<DocumentClientDTO> {
    const response = await apiClient.put(`${this.baseUrl}/${uuid}`, dto);
    return response.data.data;
  }
  
  async deleteDocument(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }
}

export const documentApiClient = new DocumentApiClient();
```

#### 2. Composables

**useDocument.ts**
```typescript
export function useDocument() {
  const documents = ref<DocumentClientDTO[]>([]);
  const currentDocument = ref<DocumentClientDTO | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  
  const loadDocuments = async (options?: FindDocumentsQueryDTO) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await documentApiClient.findDocuments({
        page: options?.page || 1,
        pageSize: options?.pageSize || 20,
        ...options,
      });
      
      documents.value = result.items;
      pagination.value = {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      };
    } catch (e: any) {
      error.value = e.response?.data?.message || '加载文档列表失败';
    } finally {
      loading.value = false;
    }
  };
  
  const loadDocument = async (uuid: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      currentDocument.value = await documentApiClient.findDocumentByUuid(uuid);
    } catch (e: any) {
      error.value = e.response?.data?.message || '加载文档详情失败';
    } finally {
      loading.value = false;
    }
  };
  
  const createDocument = async (dto: CreateDocumentDTO) => {
    loading.value = true;
    error.value = null;
    
    try {
      const newDocument = await documentApiClient.createDocument(dto);
      documents.value.unshift(newDocument);
      return newDocument;
    } catch (e: any) {
      error.value = e.response?.data?.message || '创建文档失败';
      throw e;
    } finally {
      loading.value = false;
    }
  };
  
  const updateDocument = async (uuid: string, dto: UpdateDocumentDTO) => {
    loading.value = true;
    error.value = null;
    
    try {
      const updated = await documentApiClient.updateDocument(uuid, dto);
      const index = documents.value.findIndex(d => d.uuid === uuid);
      if (index !== -1) {
        documents.value[index] = updated;
      }
      if (currentDocument.value?.uuid === uuid) {
        currentDocument.value = updated;
      }
      return updated;
    } catch (e: any) {
      error.value = e.response?.data?.message || '更新文档失败';
      throw e;
    } finally {
      loading.value = false;
    }
  };
  
  const deleteDocument = async (uuid: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      await documentApiClient.deleteDocument(uuid);
      documents.value = documents.value.filter(d => d.uuid !== uuid);
      if (currentDocument.value?.uuid === uuid) {
        currentDocument.value = null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || '删除文档失败';
      throw e;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    documents,
    currentDocument,
    loading,
    error,
    pagination,
    loadDocuments,
    loadDocument,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
```

#### 3. Components

需要创建的组件:
1. **DocumentList.vue** - 文档列表
2. **DocumentCard.vue** - 文档卡片
3. **DocumentEditor.vue** - 文档编辑器
4. **DocumentViewer.vue** - 文档查看器
5. **FolderTree.vue** - 文件夹树

#### 4. Views

需要创建的页面:
1. **RepositoryPage.vue** - 知识仓库主页 (`/repository`)
2. **DocumentDetailPage.vue** - 文档详情页 (`/repository/:uuid`)
3. **DocumentEditorPage.vue** - 文档编辑页 (`/repository/:uuid/edit`)

---

## 📋 数据模型

### Document (文档)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| uuid | String | ✅ | 主键 |
| accountUuid | String | ✅ | 所属账户 UUID |
| title | String | ✅ | 文档标题 (最多 200 字符) |
| content | String | ✅ | Markdown 内容 (最多 100KB) |
| folderPath | String | ✅ | 文件夹路径 (例: /工作/产品) |
| tags | String[] | ❌ | 标签数组 |
| status | Enum | ✅ | 状态 (DRAFT/PUBLISHED/ARCHIVED) |
| createdAt | Int | ✅ | 创建时间 (Unix 时间戳) |
| updatedAt | Int | ✅ | 更新时间 (Unix 时间戳) |
| deletedAt | Int | ❌ | 删除时间 (软删除) |

---

## 🧪 测试清单

### Unit Tests (8 个测试套件)
- ✅ Document.create() - 创建文档
- ✅ Document.updateTitle() - 更新标题
- ✅ Document.updateContent() - 更新内容
- ✅ Document.moveTo() - 移动文件夹
- ✅ Document.addTag() - 添加标签
- ✅ Document.softDelete() - 软删除
- ✅ Document.toClientDTO() - 客户端 DTO 转换
- ✅ Document.excerpt - 摘要生成

### Integration Tests (6 个测试)
- ✅ POST /documents - 创建文档
- ✅ GET /documents - 查询文档列表
- ✅ GET /documents/:uuid - 查询文档详情
- ✅ PUT /documents/:uuid - 更新文档
- ✅ DELETE /documents/:uuid - 删除文档
- ✅ 数据隔离验证

### E2E Tests (5 个场景)
- ✅ 用户创建文档流程
- ✅ 用户编辑文档流程
- ✅ 用户删除文档流程
- ✅ 文件夹筛选功能
- ✅ 搜索功能

---

## 📦 交付物

### Backend
- ✅ Document.ts (350 lines)
- ✅ DocumentRepository.interface.ts (60 lines)
- ✅ PrismaDocumentRepository.ts (200 lines)
- ✅ DocumentApplicationService.ts (180 lines)
- ✅ DocumentController.ts (120 lines)
- ✅ document.module.ts (40 lines)
- ✅ Document.spec.ts (200 lines)

### Frontend
- ✅ DocumentApiClient.ts (100 lines)
- ✅ useDocument.ts (200 lines)
- ✅ DocumentList.vue (150 lines)
- ✅ DocumentCard.vue (80 lines)
- ✅ DocumentEditor.vue (200 lines)
- ✅ RepositoryPage.vue (120 lines)

### Database
- ✅ Prisma Schema 更新
- ✅ Migration 文件

### Documentation
- ✅ Story 文档 (本文档)
- ✅ Backend README
- ✅ Frontend README

---

## ✅ Definition of Done

- [ ] Backend 代码实现完成
- [ ] Frontend 代码实现完成
- [ ] 数据库 Schema 更新
- [ ] Unit Tests 通过 (覆盖率 > 80%)
- [ ] Integration Tests 通过
- [ ] E2E Tests 通过 (关键路径)
- [ ] 代码 Review 通过
- [ ] 文档完整
- [ ] sprint-status.yaml 更新为 done

---

**Created**: 2025-10-30  
**Author**: BMad Master Agent  
**Epic**: Epic 7 - Repository Module  
**Story Points**: 5
