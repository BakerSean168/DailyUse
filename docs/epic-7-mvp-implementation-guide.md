# Epic 7 MVP 实施指南

**状态**: 🚧 IN PROGRESS (Phase 2 完成 100%)  
**下一步**: 数据库 Schema → Prisma Migration → Controller → 测试

---

## ✅ 已完成工作 (Phase 1-2: 100%)

### Phase 1: Domain 层 (✅ 100%)
- Repository.ts (~419 lines)
- Resource.ts (~515 lines)
- index.ts (~30 lines)

### Phase 2: Application 层 (✅ 100%)
- RepositoryApplicationService.ts (~170 lines)
- ResourceApplicationService.ts (~380 lines)
- IRepositoryRepository.ts (~30 lines)
- IResourceRepository.ts (~50 lines)
- **PrismaRepositoryRepository.ts** (~130 lines) ⭐ NEW
- **PrismaResourceRepository.ts** (~180 lines) ⭐ NEW

**总计**: 9 files, ~1,874 lines ✅

---

## 🚧 下一步: 数据库 Schema + Migration

### Step 1: 创建 Prisma Schema

需要在 `apps/api/prisma/schema.prisma` 中添加以下表：

```prisma
// ==================== Repository 表 ====================

model repository {
  uuid            String   @id
  accountUuid     String   @map("account_uuid")
  name            String   @db.VarChar(200)
  type            String   @db.VarChar(50)  // LOCAL | REMOTE | SYNCHRONIZED
  path            String   @db.VarChar(500)
  description     String?  @db.Text
  config          String   @db.Text  // JSON
  relatedGoals    String?  @map("related_goals") @db.Text  // JSON array
  status          String   @db.VarChar(50)  // ACTIVE | INACTIVE | ARCHIVED | SYNCING
  git             String?  @db.Text  // JSON
  syncStatus      String?  @map("sync_status") @db.Text  // JSON
  stats           String   @db.Text  // JSON
  lastAccessedAt  BigInt?  @map("last_accessed_at")
  createdAt       BigInt   @map("created_at")
  updatedAt       BigInt   @map("updated_at")

  // Relations
  resources       resource[]
  account         account   @relation(fields: [accountUuid], references: [uuid])

  @@unique([accountUuid, name])  // 用户内仓库名称唯一
  @@index([accountUuid])
  @@index([status])
  @@map("repository")
}

// ==================== Resource 表 ====================

model resource {
  uuid           String   @id
  repositoryUuid String   @map("repository_uuid")
  name           String   @db.VarChar(500)
  type           String   @db.VarChar(50)  // markdown | image | video | audio | pdf | link | code | other
  path           String   @db.VarChar(1000)
  size           Int
  description    String?  @db.Text
  author         String?  @db.VarChar(200)
  version        String?  @db.VarChar(50)
  tags           String   @db.Text  // JSON array
  category       String?  @db.VarChar(100)
  status         String   @db.VarChar(50)  // ACTIVE | ARCHIVED | DELETED | DRAFT
  metadata       String   @db.Text  // JSON (包含 content 字段用于 Markdown)
  createdAt      BigInt   @map("created_at")
  updatedAt      BigInt   @map("updated_at")
  modifiedAt     BigInt?  @map("modified_at")

  // Relations
  repository     repository @relation(fields: [repositoryUuid], references: [uuid], onDelete: Cascade)

  @@index([repositoryUuid])
  @@index([type])
  @@index([status])
  @@index([category])
  @@index([createdAt])
  @@map("resource")
}
```

### Step 2: 运行 Prisma Migration

```bash
cd apps/api
pnpm prisma migrate dev --name=epic7-repository-resource
```

### Step 3: 生成 Prisma Client

```bash
pnpm prisma generate
```

---

## 📝 Step 4: 创建简单的 Controller (MVP)

### 4.1 RepositoryController (最小实现)

创建 `apps/api/src/modules/repository-new/presentation/RepositoryController.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaRepositoryRepository } from '../infrastructure/PrismaRepositoryRepository';
import { RepositoryApplicationService } from '../application/RepositoryApplicationService';
import { authenticateToken } from '../../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const repositoryRepo = new PrismaRepositoryRepository(prisma);
const repositoryService = new RepositoryApplicationService(repositoryRepo);

// MVP: 创建仓库
router.post('/repositories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = req.user!.accountUuid;
    const { name, type, path, description, config } = req.body;

    const repository = await repositoryService.createRepository({
      accountUuid,
      name,
      type: type || 'LOCAL',
      path: path || '/documents',
      description,
      config,
    });

    res.status(201).json(repository);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// MVP: 查询所有仓库
router.get('/repositories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = req.user!.accountUuid;
    const repositories = await repositoryService.listRepositories(accountUuid);

    res.json(repositories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 4.2 ResourceController (最小实现)

创建 `apps/api/src/modules/repository-new/presentation/ResourceController.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaResourceRepository } from '../infrastructure/PrismaResourceRepository';
import { PrismaRepositoryRepository } from '../infrastructure/PrismaRepositoryRepository';
import { ResourceApplicationService } from '../application/ResourceApplicationService';
import { authenticateToken } from '../../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const resourceRepo = new PrismaResourceRepository(prisma);
const repositoryRepo = new PrismaRepositoryRepository(prisma);
const resourceService = new ResourceApplicationService(resourceRepo, repositoryRepo);

// MVP: 创建资源 (Markdown)
router.post('/resources', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = req.user!.accountUuid;
    const { repositoryUuid, name, path, content } = req.body;

    const resource = await resourceService.createResource(
      {
        repositoryUuid,
        name,
        type: 'markdown',
        path: path || '/',
        size: new Blob([content || '']).size,
        metadata: { content: content || '' },
      },
      accountUuid,
    );

    res.status(201).json(resource);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// MVP: 更新 Markdown 内容
router.put('/resources/:uuid/content', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = req.user!.accountUuid;
    const { uuid } = req.params;
    const { content } = req.body;

    const resource = await resourceService.updateMarkdownContent(uuid, accountUuid, content);

    res.json(resource);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// MVP: 获取 Markdown 内容
router.get('/resources/:uuid/content', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = req.user!.accountUuid;
    const { uuid } = req.params;

    const content = await resourceService.getMarkdownContent(uuid, accountUuid);

    res.json({ content });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
```

### 4.3 注册路由

在 `apps/api/src/app.ts` 中注册路由：

```typescript
import repositoryRoutes from './modules/repository-new/presentation/RepositoryController';
import resourceRoutes from './modules/repository-new/presentation/ResourceController';

// ... existing code ...

app.use('/api/v1', repositoryRoutes);
app.use('/api/v1', resourceRoutes);
```

---

## 🧪 Step 5: 测试核心流程

### 5.1 获取 JWT Token

```bash
# 登录获取 token
curl -X POST http://localhost:3888/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# 保存 token
export TOKEN="your-jwt-token-here"
```

### 5.2 创建仓库

```bash
curl -X POST http://localhost:3888/api/v1/repositories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Notes",
    "type": "LOCAL",
    "path": "/notes",
    "description": "Personal knowledge base"
  }'

# 保存 repositoryUuid
export REPO_UUID="returned-uuid-here"
```

### 5.3 创建 Markdown 资源

```bash
curl -X POST http://localhost:3888/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "repositoryUuid": "'$REPO_UUID'",
    "name": "Getting Started",
    "path": "/notes/getting-started.md",
    "content": "# Getting Started\n\nThis is my first note in the new repository system!"
  }'

# 保存 resourceUuid
export RESOURCE_UUID="returned-uuid-here"
```

### 5.4 更新 Markdown 内容

```bash
curl -X PUT http://localhost:3888/api/v1/resources/$RESOURCE_UUID/content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "# Getting Started\n\n## Updated Content\n\nThis content has been updated!"
  }'
```

### 5.5 获取 Markdown 内容

```bash
curl -X GET http://localhost:3888/api/v1/resources/$RESOURCE_UUID/content \
  -H "Authorization: Bearer $TOKEN"
```

### 5.6 查询所有仓库

```bash
curl -X GET http://localhost:3888/api/v1/repositories \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ MVP 验证成功标准

1. ✅ 可以创建仓库
2. ✅ 可以创建 Markdown 资源
3. ✅ 可以更新 Markdown 内容
4. ✅ 可以获取 Markdown 内容
5. ✅ 自动生成摘要（description）
6. ✅ 自动计算文件大小（size）
7. ✅ 仓库统计信息自动更新
8. ✅ 权限验证正常（用户隔离）

---

## 📊 MVP 完成后代码统计

| Layer | Files | Lines | 状态 |
|-------|-------|-------|------|
| Domain | 3 | ~964 | ✅ |
| Application | 4 | ~700 | ✅ |
| Infrastructure | 2 | ~310 | ✅ |
| Presentation | 2 | ~150 | ⏸️ |
| **Total** | **11** | **~2,124** | **🚧** |

---

## �� 下一步选择

### 选项 A: 继续完整实施 (推荐)
- 完成所有 Controller 端点
- 实现前端适配
- 添加 Swagger 文档
- 迁移现有 Document 数据

### 选项 B: 暂停，先完成其他 Story
- Epic 5 Story 5-2 (Smart Reminder Frequency)
- Epic 9 Story 9-1 (User Preference Settings)

---

**当前状态**: Phase 2 完成 100%，等待数据库 Schema + MVP Controller 实现

