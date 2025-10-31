# Epic 7: Repository Module - 高效重构方案

## 🎯 核心目标

**将现有 Document 模块重构为符合 Contracts 架构的 Repository + Resource 模式**

- ✅ **保留现有功能**: Markdown 编辑、版本管理、双向链接
- ✅ **扩展架构**: 支持多资源类型 (IMAGE, VIDEO, PDF, etc.)
- ✅ **统一管理**: Repository 作为聚合根，Resource 作为实体
- ✅ **资源链接**: 用户逻辑上管理资源的仓库归属和文件夹位置

---

## 📊 现状分析

### ✅ 已实现 (Document 模块)
- Document CRUD (5 API endpoints)
- Git-style 版本管理 (DocumentVersion)
- 双向链接 (DocumentLink)
- Markdown 编辑器 (基于 markdown-it)
- 前端组件 (13 files, 1,326 lines)

### 🆚 Contracts 定义的架构

```typescript
// packages/contracts/src/modules/repository/

Repository (聚合根)
├── uuid, name, type, path, description
├── config: RepositoryConfig
├── stats: RepositoryStats
├── syncStatus: SyncStatus
└── resources: Resource[]  ← 资源列表

Resource (实体)
├── uuid, name, type, path, size
├── type: ResourceType (MARKDOWN | IMAGE | VIDEO | AUDIO | PDF | LINK | CODE | OTHER)
├── metadata: ResourceMetadata
├── references: ResourceReference[]
└── linkedContents: LinkedContent[]
```

---

## 🚀 重构方案 (3 天完成)

### Phase 1: Domain 层重构 (6-8 hours)

#### 1.1 创建 Repository 聚合根
```typescript
// packages/domain-server/src/repository/Repository.ts

export class Repository {
  private constructor(
    public readonly uuid: string,
    public readonly accountUuid: string,
    public name: string,
    public readonly type: RepositoryType,
    public path: string,
    public description?: string,
    public config: RepositoryConfig,
    public stats: RepositoryStats,
    // ... 其他字段
  ) {}

  // 工厂方法
  static create(data: CreateRepositoryDTO): Repository { }
  static fromPersistence(data: RepositoryPersistenceDTO): Repository { }

  // 业务方法
  updateName(name: string): void { }
  updatePath(path: string): void { }
  addResource(resource: Resource): void { }
  removeResource(resourceUuid: string): void { }
  archive(): void { }
  activate(): void { }

  // DTO 转换
  toServerDTO(): RepositoryServerDTO { }
  toClientDTO(): RepositoryClientDTO { }
  toPersistence(): RepositoryPersistenceDTO { }
}
```

#### 1.2 重构 Document → Resource (Markdown)
```typescript
// packages/domain-server/src/repository/Resource.ts

export class Resource {
  private constructor(
    public readonly uuid: string,
    public readonly repositoryUuid: string,
    public name: string,
    public readonly type: ResourceType,  // MARKDOWN | IMAGE | VIDEO | ...
    public path: string,
    public size: number,
    public description?: string,
    public tags: string[],
    public metadata: ResourceMetadata,
    // ... 其他字段
  ) {}

  // Markdown 专用方法 (type === MARKDOWN 时可用)
  updateContent(content: string): void { }
  addBidirectionalLink(targetUuid: string): void { }
  createVersion(changeType: string): void { }

  // 通用方法
  moveTo(newPath: string): void { }
  addTag(tag: string): void { }
  updateMetadata(metadata: ResourceMetadata): void { }
}
```

#### 1.3 数据库迁移策略

**选项 A: 保留 document 表 (推荐 - 快速)**
```sql
-- 1. 创建 repository 表
CREATE TABLE repository (
  uuid UUID PRIMARY KEY,
  account_uuid UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- LOCAL | REMOTE | SYNCHRONIZED
  path VARCHAR(500) NOT NULL,
  config JSONB NOT NULL,
  stats JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 2. 创建 resource 表（视图方式兼容 document）
CREATE VIEW resource AS
SELECT
  uuid,
  'default-repo-uuid' AS repository_uuid,  -- 暂时关联到默认仓库
  title AS name,
  'markdown' AS type,
  COALESCE(folder_path || '/' || title, title) AS path,
  LENGTH(content) AS size,
  content AS description,  -- 临时映射
  tags,
  'ACTIVE' AS status,
  '{}' AS metadata,
  created_at,
  updated_at
FROM document
WHERE deleted_at IS NULL;

-- 3. 创建默认仓库 (数据迁移脚本)
INSERT INTO repository (uuid, account_uuid, name, type, path, config, stats, created_at, updated_at)
SELECT DISTINCT
  gen_random_uuid(),
  account_uuid,
  'My Documents',
  'LOCAL',
  '/documents',
  '{"defaultFolder": "/documents"}',
  '{"totalSize": 0, "resourceCount": 0}',
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
FROM document;
```

**选项 B: 完全重构表结构 (彻底 - 需要更多时间)**
- 删除 document 表
- 创建 resource 表
- 迁移所有数据

**推荐**: 选项 A，后续逐步迁移。

---

### Phase 2: Application 层重构 (4-6 hours)

#### 2.1 创建 RepositoryApplicationService
```typescript
// apps/api/src/modules/repository/application/RepositoryApplicationService.ts

export class RepositoryApplicationService {
  async createRepository(dto: CreateRepositoryDTO): Promise<RepositoryClientDTO> {
    const repository = Repository.create(dto);
    await this.repositoryRepo.save(repository);
    return repository.toClientDTO();
  }

  async listRepositories(accountUuid: string): Promise<RepositoryClientDTO[]> { }
  async getRepository(uuid: string): Promise<RepositoryClientDTO> { }
  async updateRepository(uuid: string, dto: UpdateRepositoryDTO): Promise<RepositoryClientDTO> { }
  async deleteRepository(uuid: string): Promise<void> { }
}
```

#### 2.2 重构 DocumentApplicationService → ResourceApplicationService
```typescript
// apps/api/src/modules/repository/application/ResourceApplicationService.ts

export class ResourceApplicationService {
  // 统一接口（支持所有资源类型）
  async createResource(dto: CreateResourceDTO): Promise<ResourceClientDTO> {
    const resource = Resource.create(dto);
    await this.resourceRepo.save(resource);
    return resource.toClientDTO();
  }

  // Markdown 专用方法
  async updateMarkdownContent(uuid: string, content: string): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepo.findByUuid(uuid);
    if (resource.type !== ResourceType.MARKDOWN) {
      throw new Error('Resource is not a Markdown document');
    }
    resource.updateContent(content);
    await this.resourceRepo.save(resource);
    return resource.toClientDTO();
  }

  // 通用方法
  async moveResource(uuid: string, newPath: string): Promise<void> { }
  async listResources(repositoryUuid: string): Promise<ResourceClientDTO[]> { }
}
```

---

### Phase 3: API 层重构 (3-4 hours)

#### 3.1 Repository CRUD API
```typescript
// apps/api/src/modules/repository/presentation/RepositoryController.ts

@Controller('/repositories')
export class RepositoryController {
  @Post()
  async createRepository(@Body() dto: CreateRepositoryDTO) { }

  @Get()
  async listRepositories(@Query('accountUuid') accountUuid: string) { }

  @Get(':uuid')
  async getRepository(@Param('uuid') uuid: string) { }

  @Put(':uuid')
  async updateRepository(@Param('uuid') uuid: string, @Body() dto: UpdateRepositoryDTO) { }

  @Delete(':uuid')
  async deleteRepository(@Param('uuid') uuid: string) { }
}
```

#### 3.2 Resource API (扩展现有 Document API)
```typescript
// apps/api/src/modules/repository/presentation/ResourceController.ts

@Controller('/repositories/:repoUuid/resources')
export class ResourceController {
  // 统一资源 CRUD
  @Post()
  async createResource(@Param('repoUuid') repoUuid: string, @Body() dto: CreateResourceDTO) { }

  @Get()
  async listResources(@Param('repoUuid') repoUuid: string) { }

  @Get(':uuid')
  async getResource(@Param('uuid') uuid: string) { }

  @Put(':uuid')
  async updateResource(@Param('uuid') uuid: string, @Body() dto: UpdateResourceDTO) { }

  @Delete(':uuid')
  async deleteResource(@Param('uuid') uuid: string) { }

  // Markdown 专用端点
  @Put(':uuid/content')
  async updateMarkdownContent(@Param('uuid') uuid: string, @Body() dto: { content: string }) { }

  @Get(':uuid/versions')
  async getVersionHistory(@Param('uuid') uuid: string) { }

  @Post(':uuid/links')
  async createBidirectionalLink(@Param('uuid') uuid: string, @Body() dto: CreateLinkDTO) { }
}
```

---

### Phase 4: 前端层适配 (4-6 hours)

#### 4.1 创建 Repository API Client
```typescript
// apps/web/src/modules/repository/infrastructure/RepositoryApiClient.ts

export class RepositoryApiClient {
  async createRepository(dto: CreateRepositoryDTO): Promise<RepositoryClientDTO> { }
  async listRepositories(accountUuid: string): Promise<RepositoryClientDTO[]> { }
  async getRepository(uuid: string): Promise<RepositoryClientDTO> { }
  async updateRepository(uuid: string, dto: UpdateRepositoryDTO): Promise<RepositoryClientDTO> { }
  async deleteRepository(uuid: string): Promise<void> { }
}
```

#### 4.2 适配 Document 组件为 Resource (Markdown)
```vue
<!-- apps/web/src/modules/repository/presentation/components/MarkdownResourceEditor.vue -->

<template>
  <div class="markdown-editor">
    <!-- 保留现有编辑器组件 -->
    <MarkdownEditor v-model="content" />
    
    <!-- 添加 Repository 选择器 -->
    <v-select
      v-model="selectedRepositoryUuid"
      :items="repositories"
      label="归属仓库"
      item-title="name"
      item-value="uuid"
    />
    
    <!-- 添加文件夹路径选择器 -->
    <v-text-field
      v-model="folderPath"
      label="文件夹路径"
      prefix="/"
    />
  </div>
</template>
```

#### 4.3 创建 Repository 管理界面
```vue
<!-- apps/web/src/modules/repository/presentation/views/RepositoryList.vue -->

<template>
  <v-container>
    <v-row>
      <v-col v-for="repo in repositories" :key="repo.uuid">
        <v-card>
          <v-card-title>{{ repo.name }}</v-card-title>
          <v-card-subtitle>{{ repo.stats.resourceCount }} 个资源</v-card-subtitle>
          <v-card-actions>
            <v-btn @click="openRepository(repo.uuid)">打开</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
```

---

## 🎯 MVP 功能范围 (优先级排序)

### P0 - 核心功能 (必须实现)
- [x] Repository CRUD (创建、列表、详情、更新、删除)
- [x] Resource (Markdown) CRUD
- [x] Resource 逻辑归属到 Repository
- [x] Resource 文件夹路径管理
- [x] 保留现有 Markdown 编辑功能

### P1 - 重要功能 (第一版包含)
- [ ] 版本管理 (保留现有 DocumentVersion)
- [ ] 双向链接 (保留现有 DocumentLink)
- [ ] Resource 标签管理
- [ ] Resource 搜索 (按标签 + 内容)

### P2 - 增强功能 (后续迭代)
- [ ] IMAGE 资源支持 (上传、预览)
- [ ] VIDEO/AUDIO 资源支持
- [ ] PDF 资源支持
- [ ] 全文搜索 (Elasticsearch/MeiliSearch)

---

## 📚 现成库推荐

### 🎯 Markdown 编辑器 (Obsidian-like)

#### **推荐方案 1: Milkdown** ⭐⭐⭐⭐⭐
```bash
pnpm add @milkdown/core @milkdown/preset-commonmark @milkdown/vue
```

**优势**:
- ✅ 基于 ProseMirror (Obsidian 同款内核)
- ✅ 官方 Vue 3 支持
- ✅ 插件系统完善
- ✅ 双向链接插件: `@milkdown/plugin-cursor`
- ✅ 协作编辑: `@milkdown/plugin-collab`
- ✅ 代码高亮: `@milkdown/plugin-prism`

**使用示例**:
```vue
<template>
  <Milkdown />
</template>

<script setup lang="ts">
import { Milkdown, useEditor } from '@milkdown/vue';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';

useEditor((root) =>
  Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
        console.log('Content updated:', markdown);
      });
    })
    .use(commonmark)
    .use(listener)
);
</script>
```

#### **推荐方案 2: TipTap** ⭐⭐⭐⭐
```bash
pnpm add @tiptap/vue-3 @tiptap/starter-kit
```

**优势**:
- ✅ Vue 3 友好
- ✅ 文档完善
- ✅ 扩展丰富
- ✅ 性能优秀

**双向链接实现**:
```typescript
import { Node, mergeAttributes } from '@tiptap/core';

const BidirectionalLink = Node.create({
  name: 'bidirectionalLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      title: { default: null },
      href: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-type="bidirectional-link"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['a', mergeAttributes(HTMLAttributes, { 'data-type': 'bidirectional-link' }), 0];
  },

  addInputRules() {
    return [
      {
        find: /\[\[([^\]]+)\]\]$/,
        handler: ({ state, range, match }) => {
          const title = match[1];
          this.editor.chain().insertContent({ type: 'bidirectionalLink', attrs: { title } }).run();
        },
      },
    ];
  },
});
```

### 🔍 全文搜索

#### **推荐: MeiliSearch** ⭐⭐⭐⭐⭐
```bash
pnpm add meilisearch
```

**优势**:
- ✅ 开箱即用
- ✅ 中文分词支持
- ✅ 高亮匹配
- ✅ 性能优秀 (Rust 编写)
- ✅ Docker 部署简单

**使用示例**:
```typescript
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({ host: 'http://localhost:7700' });

// 索引文档
await client.index('resources').addDocuments([
  { id: 1, title: 'OKR 方法论', content: '...', tags: ['管理', '目标'] },
]);

// 搜索
const results = await client.index('resources').search('OKR', {
  attributesToHighlight: ['content'],
  highlightPreTag: '<mark>',
  highlightPostTag: '</mark>',
});
```

---

## ⏱️ 时间估算

| Phase | 任务 | 时间 |
|-------|------|------|
| Phase 1 | Domain 层重构 | 6-8 hours |
| Phase 2 | Application 层重构 | 4-6 hours |
| Phase 3 | API 层重构 | 3-4 hours |
| Phase 4 | 前端适配 | 4-6 hours |
| **总计** | | **17-24 hours (2-3 天)** |

---

## �� 下一步行动

### 立即开始 (选择 1 个):

**选项 A: 高效重构 (推荐)** ⭐⭐⭐⭐⭐
1. 创建 Repository 聚合根 (2 hours)
2. 重构 Document → Resource (Markdown) (3 hours)
3. 数据库迁移 (使用视图方式，1 hour)
4. API 层适配 (2 hours)
5. 前端组件复用 + Repository 管理界面 (3 hours)
**总计**: 11 hours (1.5 天)

**选项 B: 引入 Milkdown 编辑器** ⭐⭐⭐⭐
1. 安装 Milkdown (0.5 hours)
2. 替换现有 MarkdownEditor (2 hours)
3. 实现双向链接插件 (3 hours)
4. 测试和调试 (1.5 hours)
**总计**: 7 hours (1 天)

**选项 C: 完整重构 (如果时间充裕)**
- 按照 Phase 1-4 完整执行
**总计**: 17-24 hours (2-3 天)

---

**BMad Master 建议**: 
- 先执行 **选项 A** (1.5 天完成架构重构)
- 再执行 **选项 B** (1 天完成编辑器升级)
- 最后根据需要添加 IMAGE/VIDEO 支持

总时间: **2.5 天完成 MVP**

