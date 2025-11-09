# Epic 10 实施指南 - Obsidian 风格知识管理系统

> **文档类型**: 实施指南  
> **最后更新**: 2025-11-09  
> **作者**: Scrum Master - Bob

---

## 📋 快速导航

| 文档 | 描述 | 链接 |
|------|------|------|
| **Epic 规划** | 完整 Epic 定义，10 个 Stories | [epic-10-repository-obsidian.md](../../epic-10-repository-obsidian.md) |
| **技术上下文** | 架构设计、技术栈、算法 | [epic-10-context.md](../../epic-10-context.md) |
| **BA 需求文档** | 数据库、领域模型、API、UI 设计 | [requirements/](./requirements/) |
| **PM 审核报告** | 91/100 分审核结果 | [requirements/PM_REVIEW_REPORT.md](./requirements/PM_REVIEW_REPORT.md) |
| **Sprint Status** | 项目进度追踪 | [sprint-status.yaml](../../sprint-status.yaml) |

---

## 🎯 当前状态

### Epic 10 概览

```yaml
Epic: Epic 10 - Repository Module (Obsidian 风格知识管理系统)
状态: contexted ✅
Story Points: 63 SP
预估工期: 6-8 周（2 名开发者）
优先级: High

Stories:
  - 10.1: Repository & Folder 基础管理 (8 SP) - backlog
  - 10.2: Resource CRUD + Markdown 编辑器 (13 SP) - backlog
  - 10.3: 双向链接解析与自动补全 (8 SP) - backlog
  - 10.4: 反向链接面板 (5 SP) - backlog
  - 10.5: 版本历史管理 (8 SP) - backlog
  - 10.6: 知识图谱可视化 (8 SP) - backlog
  - 10.7: 全文搜索 + 高亮 (5 SP) - backlog
  - 10.8: 大纲视图 (3 SP) - backlog
  - 10.9: 数据迁移与清理 (5 SP) - backlog
  - 10.10: Git 集成 - backlog (Phase 2 可选)
```

---

## 🚀 开始实施

### 方式 1: 使用 SM Agent (推荐)

```bash
# 1. 切换到 SM 角色
sm

# 2. 创建 Story 10.1 草稿
*create-story

# 按提示选择：
# - Epic: 10
# - Story: 10.1
# - 基于 epic-10-repository-obsidian.md 生成 Story
```

### 方式 2: 手动创建 Story 文件

```bash
# 创建第一个 Story
cat > docs/stories/10-1-repository-folder-basics.md << 'STORY_EOF'
# Story 10.1: Repository & Folder 基础管理

> **Epic**: Epic 10 - Repository Module  
> **Story Points**: 8  
> **优先级**: P0  
> **状态**: backlog

## 用户故事

作为用户，我希望能够创建仓储和文件夹层级，以便组织我的笔记。

## 验收标准

### 后端（Domain + API）

- [ ] 创建 Repository 聚合根（domain-server）
- [ ] 创建 Folder 实体（domain-server）
- [ ] 实现 FolderHierarchyService（路径生成、循环检测）
- [ ] Repository CRUD API（NestJS Controller）
- [ ] Folder Tree API（创建、移动、删除、查询）
- [ ] 数据库迁移脚本（新增 folders 表）

### 前端（Vue 3 + Vuetify 3）

- [ ] 前端 FileExplorer 组件（VTreeView）
- [ ] 拖拽移动文件夹功能（@vueuse/core）
- [ ] 右键菜单（新建、重命名、删除、移动）
- [ ] Pinia Store（repositoryStore, folderStore）

## 技术实现

参考：`docs/epic-10-context.md`

### 1. Contracts 接口定义

...（省略详细实现）

STORY_EOF
```

---

## 📐 实施路线图

### Phase 1: Sprint 0 - 数据迁移（3-5 天）

**目标**: 准备数据库和基础架构

#### Step 1: 数据库迁移脚本

```sql
-- 文件：prisma/migrations/XXX_epic10_repository_obsidian/migration.sql

-- 1. 新增 folders 表
CREATE TABLE folders (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_uuid UUID NOT NULL REFERENCES repositories(uuid) ON DELETE CASCADE,
  parent_uuid UUID REFERENCES folders(uuid) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  is_expanded BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_folder_name_per_parent UNIQUE(repository_uuid, parent_uuid, name)
);

-- 2. 新增 resource_versions 表
CREATE TABLE resource_versions (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_uuid UUID NOT NULL REFERENCES resources(uuid) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  change_description TEXT,
  changed_by VARCHAR(255) NOT NULL,
  restored_from UUID REFERENCES resource_versions(uuid),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_version_per_resource UNIQUE(resource_uuid, version_number)
);

-- 3. 新增 resource_links 表
CREATE TABLE resource_links (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_resource_uuid UUID NOT NULL REFERENCES resources(uuid) ON DELETE CASCADE,
  target_resource_uuid UUID REFERENCES resources(uuid) ON DELETE SET NULL,
  link_type VARCHAR(50) NOT NULL,
  link_text VARCHAR(255) NOT NULL,
  line_number INTEGER,
  context TEXT,
  is_broken BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 扩展 resources 表
ALTER TABLE resources 
  ADD COLUMN folder_uuid UUID REFERENCES folders(uuid) ON DELETE SET NULL,
  ADD COLUMN content TEXT,
  ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN stats JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN modified_at TIMESTAMP;

-- 5. 创建索引
CREATE INDEX idx_folders_repository ON folders(repository_uuid);
CREATE INDEX idx_folders_parent ON folders(parent_uuid);
CREATE INDEX idx_folders_path ON folders(path);
CREATE INDEX idx_versions_resource ON resource_versions(resource_uuid);
CREATE INDEX idx_versions_created ON resource_versions(created_at DESC);
CREATE INDEX idx_links_source ON resource_links(source_resource_uuid);
CREATE INDEX idx_links_target ON resource_links(target_resource_uuid);
CREATE INDEX idx_links_broken ON resource_links(is_broken);
```

#### Step 2: 数据迁移

```sql
-- 1. 为每个用户创建默认 Repository
INSERT INTO repositories (uuid, account_uuid, name, type, path, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  account.uuid,
  '我的知识库',
  'MARKDOWN',
  '/default',
  'ACTIVE',
  NOW(),
  NOW()
FROM accounts account
WHERE NOT EXISTS (
  SELECT 1 FROM repositories WHERE account_uuid = account.uuid
);

-- 2. 迁移 documents → resources（如果需要）
-- （如果已有 documents 数据）
INSERT INTO resources (uuid, repository_uuid, name, type, path, size, content, description, tags, status, created_at, updated_at)
SELECT 
  d.uuid,
  (SELECT uuid FROM repositories WHERE account_uuid = d.account_uuid LIMIT 1),
  d.name,
  'markdown',
  d.path,
  LENGTH(d.content),
  d.content,
  d.description,
  d.tags,
  'ACTIVE',
  d.created_at,
  d.updated_at
FROM documents d
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE uuid = d.uuid);
```

#### Step 3: 验证

```bash
# 运行迁移
pnpm prisma migrate dev --name epic10_repository_obsidian

# 验证数据
psql -d dailyuse -c "SELECT COUNT(*) FROM folders;"
psql -d dailyuse -c "SELECT COUNT(*) FROM resource_versions;"
psql -d dailyuse -c "SELECT COUNT(*) FROM resource_links;"
```

---

### Phase 2: Sprint 1 - 核心 CRUD（1 周）

**目标**: Repository + Folder + Resource 基础功能

#### Story 10.1: Repository & Folder 基础管理 (8 SP)

**后端开发顺序**：

1. **Contracts 定义** (`packages/contracts`)
   ```typescript
   // packages/contracts/src/modules/repository/aggregates/Repository.ts
   export interface RepositoryServer {
     uuid: string;
     accountUuid: string;
     name: string;
     type: RepositoryType;
     // ... 其他字段
   }
   ```

2. **Domain 实体** (`packages/domain-server`)
   ```typescript
   // packages/domain-server/src/repository/aggregates/Repository.ts
   export class Repository extends AggregateRoot implements RepositoryServer {
     static create(params: CreateRepositoryDTO): Repository { }
     archive(): void { }
     activate(): void { }
   }
   ```

3. **Infrastructure** (`apps/api`)
   ```typescript
   // apps/api/src/modules/repository/infrastructure/persistence/entities/RepositoryEntity.ts
   @Entity('repositories')
   export class RepositoryEntity {
     @PrimaryColumn('uuid')
     uuid!: string;
     // ...
   }
   ```

4. **Application Service**
   ```typescript
   // apps/api/src/modules/repository/application/RepositoryApplicationService.ts
   export class RepositoryApplicationService {
     async create(dto: CreateRepositoryDTO): Promise<RepositoryDTO> { }
     async findAll(accountUuid: string): Promise<RepositoryDTO[]> { }
   }
   ```

5. **Controller**
   ```typescript
   // apps/api/src/modules/repository/presentation/controllers/RepositoryController.ts
   @Controller('repositories')
   export class RepositoryController {
     @Post()
     async create(@Body() dto: CreateRepositoryDTO) { }
   }
   ```

**前端开发顺序**：

1. **API Client**
   ```typescript
   // apps/web/src/modules/repository/infrastructure/api/repositoryApi.ts
   export async function createRepository(dto: CreateRepositoryDTO) {
     return apiClient.post('/repositories', dto);
   }
   ```

2. **Pinia Store**
   ```typescript
   // apps/web/src/modules/repository/presentation/stores/repositoryStore.ts
   export const useRepositoryStore = defineStore('repository', () => {
     const repositories = ref<Repository[]>([]);
     async function loadRepositories() { }
   });
   ```

3. **FileExplorer 组件**
   ```vue
   <!-- apps/web/src/modules/repository/presentation/components/FileExplorer.vue -->
   <template>
     <v-navigation-drawer>
       <v-treeview :items="folderTree" />
     </v-navigation-drawer>
   </template>
   ```

#### Story 10.2: Resource CRUD + Markdown 编辑器 (13 SP)

**前端重点**：

1. **安装 Milkdown 依赖**
   ```bash
   cd apps/web
   pnpm add @milkdown/core @milkdown/preset-commonmark @milkdown/plugin-listener @milkdown/plugin-history @milkdown/plugin-cursor @milkdown/plugin-prism @milkdown/utils
   ```

2. **ResourceEditor 组件**
   ```vue
   <script setup lang="ts">
   import { Editor, rootCtx } from '@milkdown/core';
   
   const initEditor = () => {
     const editor = Editor.make()
       .config((ctx) => {
         ctx.set(rootCtx, editorContainer.value);
       })
       .use(commonmark)
       .use(listener);
     
     editor.create();
   };
   </script>
   ```

---

### Phase 3: Sprint 2 - 双向链接（1 周）

**目标**: 链接解析 + 反向链接

#### Story 10.3: 双向链接解析与自动补全 (8 SP)

**核心实现**：

1. **LinkParserService**（domain-server）
2. **Milkdown 双向链接插件**（web）
3. **自动补全面板**（web）

#### Story 10.4: 反向链接面板 (5 SP)

**核心实现**：

1. **Backlinks 查询 API**
2. **BacklinksPanel 组件**

---

### Phase 4: Sprint 3 - 版本管理（1 周）

#### Story 10.5: 版本历史管理 (8 SP)

**核心实现**：

1. **ResourceVersion 实体**
2. **自动版本创建触发器**
3. **VersionHistory 组件**
4. **VersionDiffDialog 组件**（使用 diff2html）

---

### Phase 5: Sprint 4 - 可视化与搜索（1.5 周）

#### Story 10.6: 知识图谱可视化 (8 SP)

**前端依赖**：
```bash
cd apps/web
pnpm add cytoscape
```

#### Story 10.7: 全文搜索 + 高亮 (5 SP)

**数据库配置**：
```sql
-- PostgreSQL 全文搜索
CREATE EXTENSION IF NOT EXISTS pg_jieba;
CREATE INDEX idx_resources_fulltext ON resources USING GIN(to_tsvector('chinese', name || ' ' || COALESCE(content, '')));
```

#### Story 10.8: 大纲视图 (3 SP)

**纯前端实现**，解析 Markdown 标题。

---

## 🧪 测试计划

### 单元测试

```bash
# Domain 实体测试
pnpm test packages/domain-server/src/repository

# Application Service 测试
pnpm test apps/api/src/modules/repository/application
```

### E2E 测试

```bash
# Repository 模块 E2E 测试
pnpm test:e2e apps/web/src/modules/repository
```

**测试场景**：
1. 创建文件夹和笔记
2. 编辑 Markdown 内容并自动保存
3. 插入双向链接 `[[]]`
4. 查看反向链接
5. 版本历史操作

---

## 📊 进度追踪

### 使用 Sprint Status

```bash
# 查看当前状态
cat docs/sprint-status.yaml | grep epic-10

# 更新 Story 状态
# 编辑 docs/sprint-status.yaml
10-1-repository-folder-basics: drafted  # 从 backlog 改为 drafted
```

### 使用 SM Agent

```bash
# 检查工作流状态
sm
*workflow-status

# 创建 Story Context
*story-context
```

---

## 🔗 相关资源

- [Milkdown 官方文档](https://milkdown.dev/)
- [Cytoscape.js 官方文档](https://js.cytoscape.org/)
- [PostgreSQL 全文搜索](https://www.postgresql.org/docs/current/textsearch.html)
- [diff2html](https://github.com/rtfpessoa/diff2html)

---

## 📞 遇到问题？

1. **技术问题**: 参考 `docs/epic-10-context.md` 技术上下文
2. **需求不明确**: 查看 BA 需求文档 `docs/modules/repository/requirements/`
3. **进度规划**: 联系 Scrum Master - Bob

---

**文档作者**: Scrum Master - Bob  
**最后更新**: 2025-11-09
