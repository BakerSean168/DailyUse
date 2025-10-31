# Epic 7 Repository Module - 架构重构计划

**当前状态**: Document 模块已实现但架构不符合 contracts 定义  
**目标架构**: 基于 Repository 聚合根，支持多种资源类型  
**预计工作量**: 3-5天 (13-21 story points)

---

## 📊 问题诊断

### 当前架构问题

1. **Document 独立存在**
   - ❌ Document 作为独立聚合根（应该是 Resource 实体）
   - ❌ 没有 Repository 概念（仓库应该是顶层聚合根）
   - ❌ 资源类型单一（只支持 Markdown）

2. **与 Contracts 不匹配**
   ```typescript
   // Contracts 定义
   Repository (聚合根)
     └── Resource[] (实体，支持 8 种类型)
           └── ResourceReference[] (引用)
           └── LinkedContent[] (关联内容)
   
   // 当前实现
   Document (聚合根) ← 错误，应该是 Resource 实体
   ```

3. **缺少关键功能**
   - ❌ 图片资源管理
   - ❌ 视频/音频资源
   - ❌ PDF 文档支持
   - ❌ 资源引用关系
   - ❌ Git 版本控制集成

---

## 🎯 重构目标架构

### 核心概念

```
Repository (仓库)
├── 属性
│   ├── uuid: string
│   ├── name: string (仓库名称，如 "我的知识库")
│   ├── type: LOCAL | REMOTE | SYNCHRONIZED
│   ├── path: string (文件系统路径)
│   ├── status: ACTIVE | INACTIVE | ARCHIVED | SYNCING
│   ├── config: RepositoryConfig (配置)
│   ├── git?: GitInfo (Git 信息)
│   └── stats: RepositoryStats (统计信息)
│
├── 子实体
│   ├── Resource[] (资源列表)
│   │   ├── MARKDOWN (Markdown 文档) ← 原 Document
│   │   ├── IMAGE (图片：jpg, png, gif, webp)
│   │   ├── VIDEO (视频：mp4, webm)
│   │   ├── AUDIO (音频：mp3, wav)
│   │   ├── PDF (PDF 文档)
│   │   ├── LINK (外部链接)
│   │   ├── CODE (代码文件)
│   │   └── OTHER (其他类型)
│   │
│   └── RepositoryExplorer (浏览器配置)
│
└── 业务方法
    ├── createResource() - 创建资源
    ├── updateConfig() - 更新配置
    ├── enableGit() - 启用 Git
    ├── startSync() - 开始同步
    └── updateStats() - 更新统计
```

### Resource (资源实体)

```
Resource
├── 属性
│   ├── uuid: string
│   ├── repositoryUuid: string
│   ├── name: string (资源名称)
│   ├── type: ResourceType (8种类型)
│   ├── path: string (相对路径)
│   ├── size: number (文件大小)
│   ├── status: ACTIVE | ARCHIVED | DELETED | DRAFT
│   ├── tags: string[] (标签)
│   └── metadata: ResourceMetadata (元数据)
│
├── 子实体
│   ├── ResourceReference[] (资源引用)
│   └── LinkedContent[] (关联内容)
│
└── 业务方法
    ├── updateContent() - 更新内容
    ├── move() - 移动资源
    ├── addTag() - 添加标签
    ├── archive() - 归档
    └── toggleFavorite() - 切换收藏
```

---

## 🔄 重构步骤

### Phase 1: 基础架构重构 (2天)

**Step 1.1: 创建 Repository 聚合根** (4小时)
- [ ] `apps/api/src/modules/repository/domain/Repository.ts`
  - 实现 RepositoryServer 接口
  - 11个业务方法（配置、同步、统计、状态管理）
  - Factory 方法：create(), fromServerDTO(), fromPersistenceDTO()
  - 子实体管理：createResource(), addResource(), removeResource()

**Step 1.2: 重构 Document → Resource** (4小时)
- [ ] 将 `Document.ts` 重构为 `Resource.ts`
  - 添加 type: ResourceType 字段
  - 添加 repositoryUuid 外键
  - 支持 metadata: ResourceMetadata
  - 保留原有业务逻辑（updateTitle, updateContent, addTag 等）

**Step 1.3: 创建数据库 Schema** (2小时)
- [ ] `apps/api/prisma/schema.prisma`
  ```prisma
  model repository {
    uuid            String   @id @default(uuid())
    accountUuid     String   @map("account_uuid")
    name            String
    type            String   // LOCAL, REMOTE, SYNCHRONIZED
    path            String
    description     String?
    config          String   @db.Text // JSON
    relatedGoals    String?  @db.Text // JSON array
    status          String   // ACTIVE, INACTIVE, ARCHIVED, SYNCING
    git             String?  @db.Text // JSON
    syncStatus      String?  @db.Text // JSON
    stats           String   @db.Text // JSON
    lastAccessedAt  BigInt?  @map("last_accessed_at")
    createdAt       BigInt   @map("created_at")
    updatedAt       BigInt   @map("updated_at")
    
    resources       resource[]
    explorer        repository_explorer?
    
    @@map("repository")
  }
  
  model resource {
    uuid            String   @id @default(uuid())
    repositoryUuid  String   @map("repository_uuid")
    name            String
    type            String   // MARKDOWN, IMAGE, VIDEO, AUDIO, PDF, LINK, CODE, OTHER
    path            String
    size            BigInt
    description     String?  @db.Text
    author          String?
    version         String?
    tags            String   @db.Text // JSON array
    category        String?
    status          String   // ACTIVE, ARCHIVED, DELETED, DRAFT
    metadata        String   @db.Text // JSON
    createdAt       BigInt   @map("created_at")
    updatedAt       BigInt   @map("updated_at")
    modifiedAt      BigInt?  @map("modified_at")
    
    repository      repository @relation(fields: [repositoryUuid], references: [uuid])
    references      resource_reference[]
    linkedContents  linked_content[]
    
    @@map("resource")
  }
  ```

**Step 1.4: 创建 Repository Pattern** (2小时)
- [ ] `RepositoryRepository.interface.ts` (Repository 的仓储接口)
- [ ] `PrismaRepositoryRepository.ts` (Prisma 实现)
- [ ] `ResourceRepository.interface.ts` (Resource 的仓储接口)
- [ ] `PrismaResourceRepository.ts` (Prisma 实现)

---

### Phase 2: 图片资源支持 (1天)

**Step 2.1: 图片上传服务** (3小时)
- [ ] `ImageUploadService.ts`
  - 支持格式：jpg, png, gif, webp, svg
  - 文件大小限制：10MB
  - 自动生成缩略图
  - 元数据提取（尺寸、EXIF 信息）

**Step 2.2: 图片存储策略** (2小时)
- [ ] 本地存储：`{repository.path}/images/{uuid}.{ext}`
- [ ] 缩略图存储：`{repository.path}/thumbnails/{uuid}_thumb.{ext}`
- [ ] 元数据存储：resource.metadata

**Step 2.3: 图片资源 API** (3小时)
- [ ] POST `/repositories/:repoId/resources/images` - 上传图片
- [ ] GET `/repositories/:repoId/resources/:resourceId/image` - 获取图片
- [ ] GET `/repositories/:repoId/resources/:resourceId/thumbnail` - 获取缩略图
- [ ] DELETE `/repositories/:repoId/resources/:resourceId` - 删除图片

---

### Phase 3: Repository CRUD API (1天)

**Step 3.1: Repository Application Service** (3小时)
- [ ] `RepositoryApplicationService.ts`
  - createRepository()
  - findRepositories() - 分页、排序、筛选
  - findRepositoryByUuid()
  - updateRepository()
  - deleteRepository()
  - syncRepository() - Git 同步

**Step 3.2: Repository HTTP Controller** (2小时)
- [ ] `repository.controller.ts`
  - POST `/repositories` - 创建仓库
  - GET `/repositories` - 查询仓库列表
  - GET `/repositories/:uuid` - 查询单个仓库
  - PUT `/repositories/:uuid` - 更新仓库
  - DELETE `/repositories/:uuid` - 删除仓库
  - POST `/repositories/:uuid/sync` - 同步仓库

**Step 3.3: Resource HTTP Controller** (3小时)
- [ ] `resource.controller.ts`
  - POST `/repositories/:repoId/resources` - 创建资源
  - GET `/repositories/:repoId/resources` - 查询资源列表
  - GET `/repositories/:repoId/resources/:uuid` - 查询单个资源
  - PUT `/repositories/:repoId/resources/:uuid` - 更新资源
  - DELETE `/repositories/:repoId/resources/:uuid` - 删除资源

---

### Phase 4: 迁移现有 Document 数据 (0.5天)

**Step 4.1: 数据迁移脚本** (2小时)
- [ ] 创建默认 Repository（每个用户一个默认仓库）
- [ ] 迁移 document 表数据到 resource 表
  - type = 'MARKDOWN'
  - repositoryUuid = 默认仓库 UUID
  - 保留所有原有字段

**Step 4.2: API 兼容层** (2小时)
- [ ] 保留原 `/documents` 端点（向后兼容）
- [ ] 内部调用新的 Repository/Resource 服务
- [ ] 添加 deprecation 警告

---

### Phase 5: 前端适配 (1天)

**Step 5.1: Repository API Client** (2小时)
- [ ] `RepositoryApiClient.ts`
- [ ] `ResourceApiClient.ts`
- [ ] `ImageUploadApiClient.ts`

**Step 5.2: Composables** (2小时)
- [ ] `useRepository.ts`
- [ ] `useResource.ts`
- [ ] `useImageUpload.ts`

**Step 5.3: 组件重构** (4小时)
- [ ] Repository 列表组件
- [ ] Resource 列表组件（支持图片预览）
- [ ] 图片上传组件（拖拽上传）
- [ ] 图片查看器组件

---

## 📦 数据库迁移计划

### Migration 1: 创建 repository 表
```sql
CREATE TABLE repository (
  uuid UUID PRIMARY KEY,
  account_uuid UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  config TEXT NOT NULL,
  related_goals TEXT,
  status VARCHAR(50) NOT NULL,
  git TEXT,
  sync_status TEXT,
  stats TEXT NOT NULL,
  last_accessed_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
```

### Migration 2: 创建 resource 表
```sql
CREATE TABLE resource (
  uuid UUID PRIMARY KEY,
  repository_uuid UUID NOT NULL REFERENCES repository(uuid),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  description TEXT,
  author VARCHAR(200),
  version VARCHAR(50),
  tags TEXT NOT NULL,
  category VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  metadata TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  modified_at BIGINT
);

CREATE INDEX idx_resource_repository ON resource(repository_uuid);
CREATE INDEX idx_resource_type ON resource(type);
CREATE INDEX idx_resource_status ON resource(status);
```

### Migration 3: 迁移 document 数据
```sql
-- 1. 为每个用户创建默认仓库
INSERT INTO repository (uuid, account_uuid, name, type, path, ...)
SELECT 
  gen_random_uuid(),
  account_uuid,
  '我的知识库',
  'LOCAL',
  '/default',
  ...
FROM (SELECT DISTINCT account_uuid FROM document) AS users;

-- 2. 迁移 document 到 resource
INSERT INTO resource (uuid, repository_uuid, name, type, path, ...)
SELECT 
  d.uuid,
  r.uuid as repository_uuid,
  d.title as name,
  'MARKDOWN' as type,
  d.folder_path as path,
  ...
FROM document d
JOIN repository r ON r.account_uuid = d.account_uuid;

-- 3. (可选) 保留 document 表一段时间作为备份
-- ALTER TABLE document RENAME TO document_backup;
```

---

## 🧪 测试计划

### Unit Tests
- [ ] Repository 聚合根测试 (8个测试用例)
- [ ] Resource 实体测试 (8个测试用例)
- [ ] ImageUploadService 测试 (6个测试用例)

### Integration Tests
- [ ] Repository CRUD 测试
- [ ] Resource CRUD 测试
- [ ] 图片上传/下载测试
- [ ] 数据迁移测试

### E2E Tests
- [ ] 创建仓库 → 上传图片 → 查看图片 → 删除图片
- [ ] 迁移 Document → 验证数据完整性

---

## 📝 风险评估

### 高风险项
1. **数据迁移风险** (P0)
   - 风险：现有 Document 数据丢失
   - 缓解：备份 document 表，分步迁移，验证数据完整性

2. **API 兼容性** (P1)
   - 风险：前端依赖现有 `/documents` API
   - 缓解：保留兼容层，逐步迁移前端

3. **文件存储路径变更** (P1)
   - 风险：现有文档路径失效
   - 缓解：软链接或路径映射

### 中风险项
1. **性能问题** (P2)
   - 风险：Repository → Resource 两层查询可能变慢
   - 缓解：添加数据库索引，使用懒加载

2. **Git 集成复杂度** (P2)
   - 风险：Git 同步逻辑复杂
   - 缓解：分阶段实现，先实现基础功能

---

## 📅 时间估算

| Phase | 任务 | 时间 | Story Points |
|-------|------|------|--------------|
| Phase 1 | 基础架构重构 | 2天 | 8 |
| Phase 2 | 图片资源支持 | 1天 | 5 |
| Phase 3 | Repository CRUD API | 1天 | 3 |
| Phase 4 | 数据迁移 | 0.5天 | 2 |
| Phase 5 | 前端适配 | 1天 | 3 |
| **总计** | | **5.5天** | **21** |

---

## ✅ 验收标准

### 功能性验收
- [ ] Repository CRUD API 全部实现并测试通过
- [ ] Resource 支持 MARKDOWN 和 IMAGE 类型
- [ ] 图片上传/下载/缩略图功能正常
- [ ] 现有 Document 数据成功迁移
- [ ] 原 `/documents` API 保持兼容

### 非功能性验收
- [ ] 单元测试覆盖率 > 80%
- [ ] 所有 API 有 Swagger 文档
- [ ] 数据库查询性能 < 100ms (P95)
- [ ] 图片上传支持 < 10MB 文件

---

## 🚀 建议实施顺序

**Option 1: 渐进式重构（推荐）**
1. Phase 1 → Phase 3 → Phase 4 → Phase 2 → Phase 5
   - 先完成基础架构和数据迁移
   - 确保兼容性后再添加图片功能

**Option 2: 新功能优先**
1. Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 4
   - 先实现图片功能（新建 Repository）
   - 最后迁移旧数据

**Option 3: 最小化风险**
1. 创建新 Repository 模块（不动 Document）
2. 并行运行两套系统
3. 逐步迁移用户到新系统
4. 最后下线 Document 模块

---

**建议**: 选择 **Option 1 (渐进式重构)**，这样可以：
- ✅ 最小化对现有功能的影响
- ✅ 及早发现数据迁移问题
- ✅ 保持系统稳定性
- ✅ 分阶段交付价值

