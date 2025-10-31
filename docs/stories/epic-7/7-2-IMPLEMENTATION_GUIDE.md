# Story 7-2 Implementation Guide
## Git-style Version Management - 实施指南

**Created**: 2025-10-31  
**Story Points**: 8  
**Estimated Time**: 6-8 hours (1 Sprint)

---

## 📋 快速概览

### 核心功能
1. ✅ 自动版本快照 - 每次保存文档自动创建版本
2. ✅ 版本历史列表 - 时间线展示所有历史版本
3. ✅ 版本快照查看 - 查看任意历史版本内容
4. ✅ 版本 Diff 对比 - 并排对比两个版本的差异
5. ✅ 版本回滚恢复 - 一键恢复到历史版本

### 技术栈
- **Backend**: NestJS + Prisma + DDD
- **Frontend**: Vue 3 + Vuetify 3
- **Diff Library**: `diff` (npm package)
- **Database**: PostgreSQL (新增 document_version 表)

---

## 🚀 实施步骤

### Phase 1: Database Schema (30 分钟)

#### 1.1 更新 Prisma Schema

**文件**: `apps/api/prisma/schema.prisma`

```prisma
// 新增 document_version 表
model document_version {
  uuid               String   @id @default(uuid())
  documentUuid       String   @map("document_uuid")
  versionNumber      Int      @map("version_number")
  title              String
  content            String   @db.Text
  changeType         String   @map("change_type")  // initial | major | minor | patch | restore
  changeDescription  String?  @map("change_description")
  changedBy          String   @map("changed_by")
  restoredFrom       String?  @map("restored_from")
  metadata           Json?
  createdAt          Int      @map("created_at")
  
  document           document @relation(fields: [documentUuid], references: [uuid], onDelete: Cascade)
  account            account  @relation(fields: [changedBy], references: [uuid])
  
  @@index([documentUuid, versionNumber])
  @@index([documentUuid, createdAt])
  @@index([changedBy])
  @@map("document_versions")
}

// 更新 document 表
model document {
  // ...existing fields...
  currentVersion     Int      @default(0) @map("current_version")
  lastVersionedAt    Int?     @map("last_versioned_at")
  
  versions           document_version[]
  
  // ...existing relations...
}
```

#### 1.2 创建 Migration

```bash
cd /workspaces/DailyUse
npx prisma migrate dev --name add_document_version
npx prisma generate
```

---

### Phase 2: Backend Domain Layer (2 小时)

#### 2.1 创建 DocumentVersion 聚合根

**文件**: `apps/api/src/modules/document/domain/DocumentVersion.ts`

**核心功能**:
- 版本创建 (`create()`)
- 版本类型判断 (`detectChangeType()`)
- DTO 转换 (`toServerDTO()`, `toClientDTO()`, `toPersistence()`)

**关键字段**:
```typescript
- uuid: string
- documentUuid: string
- versionNumber: number
- title: string
- content: string
- changeType: 'initial' | 'major' | 'minor' | 'patch' | 'restore'
- changeDescription?: string
- changedBy: string (accountUuid)
- restoredFrom?: string (source version uuid)
- metadata?: { addedChars, deletedChars, modifiedSections }
- createdAt: number
```

#### 2.2 创建 DocumentVersionRepository 接口

**文件**: `apps/api/src/modules/document/domain/DocumentVersionRepository.interface.ts`

**Methods**:
```typescript
- save(version: DocumentVersion): Promise<DocumentVersion>
- findByDocumentUuid(docUuid, options?: FindOptions): Promise<PaginatedResult<DocumentVersion>>
- findByUuid(uuid: string): Promise<DocumentVersion | null>
- findByVersionNumber(docUuid: string, versionNum: number): Promise<DocumentVersion | null>
- countByDocumentUuid(docUuid: string): Promise<number>
```

#### 2.3 更新 Document 聚合根

**文件**: `apps/api/src/modules/document/domain/Document.ts`

**新增字段**:
```typescript
- currentVersion: number
- lastVersionedAt?: number
```

**新增方法**:
```typescript
- createVersion(accountUuid: string, previousContent?: string): DocumentVersion
- getCurrentVersionNumber(): number
- incrementVersion(): void
```

---

### Phase 3: Backend Infrastructure (1 小时)

#### 3.1 实现 PrismaDocumentVersionRepository

**文件**: `apps/api/src/modules/document/infrastructure/PrismaDocumentVersionRepository.ts`

**核心实现**:
- 分页查询 (默认 20 条/页)
- 按版本号倒序排列
- 支持按时间范围筛选

#### 3.2 更新 PrismaDocumentRepository

**文件**: `apps/api/src/modules/document/infrastructure/PrismaDocumentRepository.ts`

**修改点**:
- `save()` 方法更新 `currentVersion` 和 `lastVersionedAt`
- 查询时可选包含版本关联

---

### Phase 4: Backend Application Service (2 小时)

#### 4.1 创建 DocumentVersionApplicationService

**文件**: `apps/api/src/modules/document/application/DocumentVersionApplicationService.ts`

**Methods**:
1. `getVersionHistory(documentUuid, page, pageSize)` - 获取版本列表
2. `getVersionByUuid(uuid)` - 获取单个版本
3. `getVersionByNumber(documentUuid, versionNumber)` - 按版本号获取
4. `compareVersions(version1Uuid, version2Uuid)` - 版本 Diff 对比
5. `restoreVersion(documentUuid, versionUuid, accountUuid, reason?)` - 恢复版本

**Diff 对比实现**:
```typescript
import { diffLines } from 'diff';

async compareVersions(uuid1: string, uuid2: string) {
  const v1 = await this.versionRepo.findByUuid(uuid1);
  const v2 = await this.versionRepo.findByUuid(uuid2);
  
  const diff = diffLines(v1.content, v2.content);
  
  return {
    version1: v1.toClientDTO(),
    version2: v2.toClientDTO(),
    diff: diff.map(part => ({
      type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
      value: part.value,
      count: part.count,
    })),
    stats: {
      added: diff.filter(p => p.added).length,
      removed: diff.filter(p => p.removed).length,
      unchanged: diff.filter(p => !p.added && !p.removed).length,
    },
  };
}
```

#### 4.2 更新 DocumentApplicationService

**文件**: `apps/api/src/modules/document/application/DocumentApplicationService.ts`

**修改方法**:

**1. `createDocument()` - 创建初始版本**
```typescript
async createDocument(dto: CreateDocumentDTO, accountUuid: string) {
  // ...existing code...
  
  // 创建初始版本 v1
  const initialVersion = document.createVersion(accountUuid);
  initialVersion.changeType = 'initial';
  initialVersion.changeDescription = 'Initial version';
  await this.versionRepo.save(initialVersion);
  
  return document;
}
```

**2. `updateDocument()` - 自动创建版本**
```typescript
async updateDocument(uuid: string, dto: UpdateDocumentDTO, accountUuid: string) {
  const document = await this.repo.findByUuid(uuid);
  // ...security check...
  
  const previousContent = document.content;
  
  // 更新文档
  if (dto.title) document.updateTitle(dto.title);
  if (dto.content) document.updateContent(dto.content);
  // ...other updates...
  
  // 创建新版本
  const newVersion = document.createVersion(accountUuid, previousContent);
  await this.versionRepo.save(newVersion);
  
  // 保存文档
  document.incrementVersion();
  return await this.repo.save(document);
}
```

---

### Phase 5: Backend API (1 小时)

#### 5.1 创建 DocumentVersionController

**文件**: `apps/api/src/modules/document/presentation/document-version.controller.ts`

**API Endpoints**:

```typescript
@Controller('api/documents')
@UseGuards(JwtAuthGuard)
export class DocumentVersionController {
  
  // 获取版本列表 (分页)
  @Get(':uuid/versions')
  async getVersionHistory(
    @Param('uuid') uuid: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) { }
  
  // 获取指定版本号
  @Get(':uuid/versions/:versionNumber')
  async getVersionByNumber(
    @Param('uuid') uuid: string,
    @Param('versionNumber') versionNumber: number,
  ) { }
  
  // 查看版本快照
  @Get(':uuid/versions/:versionUuid/snapshot')
  async getVersionSnapshot(
    @Param('versionUuid') versionUuid: string,
  ) { }
  
  // 对比两个版本
  @Post(':uuid/versions/compare')
  async compareVersions(
    @Param('uuid') uuid: string,
    @Body() body: { version1Uuid: string; version2Uuid: string },
  ) { }
  
  // 恢复版本
  @Post(':uuid/versions/:versionUuid/restore')
  async restoreVersion(
    @Param('uuid') uuid: string,
    @Param('versionUuid') versionUuid: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) { }
}
```

#### 5.2 更新 document.module.ts

```typescript
@Module({
  imports: [PrismaModule],
  providers: [
    DocumentApplicationService,
    DocumentVersionApplicationService,  // NEW
    // ...repositories...
  ],
  controllers: [
    DocumentController,
    DocumentVersionController,  // NEW
  ],
  exports: [DocumentApplicationService, DocumentVersionApplicationService],
})
export class DocumentModule {}
```

---

### Phase 6: Contracts (30 分钟)

**文件**: `packages/contracts/src/document.contracts.ts`

```typescript
// 新增 DTOs
export interface DocumentVersionServerDTO {
  readonly uuid: string;
  readonly documentUuid: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly content: string;
  readonly changeType: 'initial' | 'major' | 'minor' | 'patch' | 'restore';
  readonly changeDescription?: string;
  readonly changedBy: string;
  readonly restoredFrom?: string;
  readonly metadata?: {
    readonly addedChars: number;
    readonly deletedChars: number;
    readonly modifiedSections: number;
  };
  readonly createdAt: number;
}

export interface DocumentVersionClientDTO {
  readonly uuid: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly changeType: string;
  readonly changeDescription?: string;
  readonly changedBy: string;
  readonly createdAt: number;
  readonly excerpt: string; // 前 200 字符
}

export interface VersionDiffResultDTO {
  readonly version1: DocumentVersionClientDTO;
  readonly version2: DocumentVersionClientDTO;
  readonly diff: Array<{
    readonly type: 'added' | 'removed' | 'unchanged';
    readonly value: string;
    readonly count?: number;
  }>;
  readonly stats: {
    readonly added: number;
    readonly removed: number;
    readonly unchanged: number;
  };
}

export interface RestoreVersionRequestDTO {
  readonly reason?: string;
}

// 更新现有 DTO
export interface DocumentServerDTO {
  // ...existing fields...
  readonly currentVersion: number;
  readonly lastVersionedAt?: number;
}
```

---

### Phase 7: Frontend Implementation (后续实施)

Frontend 实施将在完成 Backend 后进行，包括:

1. **API Client** - `DocumentVersionApiClient.ts`
2. **Composable** - `useDocumentVersion.ts`
3. **Components**:
   - `VersionTimeline.vue` - 版本时间线
   - `VersionSnapshotDialog.vue` - 版本快照
   - `VersionDiffViewer.vue` - Diff 对比
   - `VersionRestoreDialog.vue` - 恢复确认
4. **Views** - 更新 `RepositoryPage.vue`

---

## ✅ Backend 完成清单

### Domain Layer
- [ ] `DocumentVersion.ts` 聚合根 (~200 lines)
- [ ] `DocumentVersionRepository.interface.ts` (~30 lines)
- [ ] 更新 `Document.ts` (+50 lines)

### Infrastructure Layer
- [ ] `PrismaDocumentVersionRepository.ts` (~120 lines)
- [ ] 更新 `PrismaDocumentRepository.ts` (+30 lines)

### Application Layer
- [ ] `DocumentVersionApplicationService.ts` (~180 lines)
- [ ] 更新 `DocumentApplicationService.ts` (+60 lines)

### Presentation Layer
- [ ] `DocumentVersionController.ts` (~80 lines)
- [ ] 更新 `document.module.ts` (+5 lines)

### Contracts
- [ ] 更新 `document.contracts.ts` (+80 lines)

### Database
- [ ] Prisma migration 创建
- [ ] `document_version` 表创建
- [ ] `document` 表更新

**Total Estimated Lines**: ~835 lines (Backend only)

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] `DocumentVersion.spec.ts` - 聚合根测试
- [ ] `DocumentVersionApplicationService.spec.ts` - 服务测试

### Integration Tests
- [ ] API Endpoints 测试 (5 个端点)
- [ ] Version 创建测试
- [ ] Diff 对比测试
- [ ] 版本恢复测试

---

## 📚 参考文档

- **Story 文档**: `7-2-git-style-version-management.md`
- **Feature Spec**: `docs/modules/repository/features/02-version-management.md`
- **Story 7-1**: `7-1-document-crud-basics.md` (依赖)

---

## 🚀 开始实施

### 立即开始

```bash
# 1. 切换到项目根目录
cd /workspaces/DailyUse

# 2. 更新 Prisma Schema
# 编辑 apps/api/prisma/schema.prisma
# 添加 document_version 模型

# 3. 创建 Migration
npx prisma migrate dev --name add_document_version
npx prisma generate

# 4. 开始编写 Domain Layer
# 创建 DocumentVersion.ts
# 创建 DocumentVersionRepository.interface.ts
# 更新 Document.ts
```

### 预估时间分配

| Phase | 任务 | 预估时间 |
|-------|------|---------|
| 1 | Database Schema | 30 分钟 |
| 2 | Domain Layer | 2 小时 |
| 3 | Infrastructure | 1 小时 |
| 4 | Application Service | 2 小时 |
| 5 | API Controller | 1 小时 |
| 6 | Contracts | 30 分钟 |
| **Total** | **Backend** | **7 小时** |

---

**Ready to Start!** 🚀

开始 Phase 1: Database Schema 实施
