# Epic 10 技术上下文 - Repository Module (Obsidian 风格)

> **文档类型**: Tech Context  
> **Epic**: Epic 10 - Repository Module  
> **创建日期**: 2025-11-09  
> **作者**: Scrum Master - Bob

---

## 🎯 技术目标

基于 BA 需求文档和 PM 审核报告，实现 Obsidian 风格的个人知识管理系统。

---

## 📐 架构概览

### 系统分层

```
┌─────────────────────────────────────────────┐
│  Frontend (Vue 3 + Vuetify 3)              │
│  ├── FileExplorer (VTreeView)              │
│  ├── ResourceEditor (Milkdown)             │
│  ├── KnowledgeGraphView (Cytoscape.js)     │
│  └── BacklinksPanel / VersionHistory       │
├─────────────────────────────────────────────┤
│  API Layer (NestJS Controllers)            │
│  ├── RepositoryController                  │
│  ├── FolderController                      │
│  ├── ResourceController                    │
│  └── ResourceLinkController                │
├─────────────────────────────────────────────┤
│  Application Services                      │
│  ├── RepositoryApplicationService          │
│  ├── FolderApplicationService              │
│  ├── ResourceApplicationService            │
│  └── KnowledgeGraphApplicationService      │
├─────────────────────────────────────────────┤
│  Domain Layer (DDD)                        │
│  ├── Repository (AggregateRoot)            │
│  ├── Folder (Entity)                       │
│  ├── Resource (Entity)                     │
│  ├── ResourceVersion (Entity)              │
│  ├── ResourceLink (Entity)                 │
│  ├── LinkParserService (DomainService)     │
│  └── FolderHierarchyService (DomainService)│
├─────────────────────────────────────────────┤
│  Infrastructure (Prisma + PostgreSQL)      │
│  ├── RepositoryEntity (TypeORM Entity)     │
│  ├── FolderEntity (TypeORM Entity)         │
│  ├── ResourceEntity (TypeORM Entity)       │
│  ├── ResourceVersionEntity                 │
│  └── ResourceLinkEntity                    │
└─────────────────────────────────────────────┘
```

---

## 🗄️ 数据库架构

### 核心表结构

#### 1. repositories 表（已存在，需扩展）

```sql
-- 已存在字段
uuid UUID PRIMARY KEY
account_uuid UUID NOT NULL
name VARCHAR(255)
type VARCHAR(50)  -- MARKDOWN, CODE, MIXED
path TEXT
description TEXT
status VARCHAR(50)  -- ACTIVE, ARCHIVED, DELETED
created_at TIMESTAMP
updated_at TIMESTAMP

-- 新增字段（通过 ALTER TABLE 添加）
config JSONB DEFAULT '{}'::jsonb  -- RepositoryConfig
stats JSONB DEFAULT '{}'::jsonb   -- RepositoryStats
git_info JSONB                    -- GitInfo (可选)
last_accessed_at TIMESTAMP
```

#### 2. folders 表（新建）

```sql
CREATE TABLE folders (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_uuid UUID NOT NULL REFERENCES repositories(uuid) ON DELETE CASCADE,
  parent_uuid UUID REFERENCES folders(uuid) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,  -- 例如：/frontend/vue3
  "order" INTEGER DEFAULT 0,
  is_expanded BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,  -- FolderMetadata {icon, color, description}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 索引
  CONSTRAINT unique_folder_name_per_parent UNIQUE(repository_uuid, parent_uuid, name)
);

CREATE INDEX idx_folders_repository ON folders(repository_uuid);
CREATE INDEX idx_folders_parent ON folders(parent_uuid);
CREATE INDEX idx_folders_path ON folders(path);
```

#### 3. resources 表（已存在，需扩展）

```sql
-- 已存在字段
uuid UUID PRIMARY KEY
repository_uuid UUID NOT NULL
name VARCHAR(255)
type VARCHAR(50)  -- markdown, image, video, audio, pdf, link, code, other
path TEXT
size BIGINT
description TEXT
tags TEXT[]
status VARCHAR(50)
created_at TIMESTAMP
updated_at TIMESTAMP

-- 新增字段
folder_uuid UUID REFERENCES folders(uuid) ON DELETE SET NULL
content TEXT  -- Markdown 内容（仅 type=markdown 时使用）
metadata JSONB DEFAULT '{}'::jsonb  -- ResourceMetadata {wordCount, readingTime, lastEditor, thumbnail}
stats JSONB DEFAULT '{}'::jsonb     -- ResourceStats {viewCount, editCount, linkCount}
modified_at TIMESTAMP  -- 内容最后修改时间
```

#### 4. resource_versions 表（新建）

```sql
CREATE TABLE resource_versions (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_uuid UUID NOT NULL REFERENCES resources(uuid) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_type VARCHAR(50) NOT NULL,  -- initial, major, minor, patch, restore
  change_description TEXT,  -- Commit message
  changed_by VARCHAR(255) NOT NULL,
  restored_from UUID REFERENCES resource_versions(uuid),
  metadata JSONB DEFAULT '{}'::jsonb,  -- VersionMetadata {addedChars, deletedChars, modifiedLines}
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_version_per_resource UNIQUE(resource_uuid, version_number)
);

CREATE INDEX idx_versions_resource ON resource_versions(resource_uuid);
CREATE INDEX idx_versions_created ON resource_versions(created_at DESC);
```

#### 5. resource_links 表（新建）

```sql
CREATE TABLE resource_links (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_resource_uuid UUID NOT NULL REFERENCES resources(uuid) ON DELETE CASCADE,
  target_resource_uuid UUID REFERENCES resources(uuid) ON DELETE SET NULL,  -- NULL = 断链
  link_type VARCHAR(50) NOT NULL,  -- BIDIRECTIONAL, EMBED, REFERENCE
  link_text VARCHAR(255) NOT NULL,  -- 例如："[[Vue3 笔记]]"
  line_number INTEGER,  -- 链接所在行号
  context TEXT,  -- 上下文片段（前后 50 字符）
  is_broken BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_links_source ON resource_links(source_resource_uuid);
CREATE INDEX idx_links_target ON resource_links(target_resource_uuid);
CREATE INDEX idx_links_broken ON resource_links(is_broken);
```

---

## 📦 包结构

### 1. Contracts (packages/contracts)

```
packages/contracts/src/modules/repository/
├── aggregates/
│   ├── Repository.ts          # Repository 聚合根接口
│   ├── RepositoryClient.ts    # 客户端实体
│   └── RepositoryServer.ts    # 服务端实体
├── entities/
│   ├── Folder.ts              # Folder 实体接口
│   ├── Resource.ts            # Resource 实体接口
│   ├── ResourceVersion.ts     # ResourceVersion 实体接口
│   └── ResourceLink.ts        # ResourceLink 实体接口
├── value-objects/
│   ├── RepositoryConfig.ts    # 仓储配置
│   ├── RepositoryStats.ts     # 仓储统计
│   ├── GitInfo.ts             # Git 信息
│   ├── FolderMetadata.ts      # 文件夹元数据
│   ├── ResourceMetadata.ts    # 资源元数据
│   ├── ResourceStats.ts       # 资源统计
│   └── VersionMetadata.ts     # 版本元数据
├── dtos/
│   ├── repository/            # Repository DTOs
│   ├── folder/                # Folder DTOs
│   ├── resource/              # Resource DTOs
│   └── link/                  # ResourceLink DTOs
├── enums/
│   ├── RepositoryType.ts      # MARKDOWN | CODE | MIXED
│   ├── RepositoryStatus.ts    # ACTIVE | ARCHIVED | DELETED
│   ├── ResourceType.ts        # markdown | image | video | ...
│   ├── ResourceStatus.ts      # ACTIVE | ARCHIVED | DELETED | DRAFT
│   ├── ResourceLinkType.ts    # BIDIRECTIONAL | EMBED | REFERENCE
│   └── VersionChangeType.ts   # initial | major | minor | patch | restore
└── index.ts
```

### 2. Domain Server (packages/domain-server)

```
packages/domain-server/src/repository/
├── aggregates/
│   └── Repository.ts          # Repository 聚合根实现
├── entities/
│   ├── Folder.ts              # Folder 实体实现
│   ├── Resource.ts            # Resource 实体实现
│   ├── ResourceVersion.ts     # ResourceVersion 实体实现
│   └── ResourceLink.ts        # ResourceLink 实体实现
├── value-objects/
│   ├── RepositoryConfig.ts
│   ├── RepositoryStats.ts
│   ├── GitInfo.ts
│   ├── FolderMetadata.ts
│   ├── ResourceMetadata.ts
│   ├── ResourceStats.ts
│   └── VersionMetadata.ts
├── domain-services/
│   ├── LinkParserService.ts   # 解析 [[]] 链接
│   └── FolderHierarchyService.ts  # 文件夹路径管理
├── repositories/
│   ├── IRepositoryRepository.ts
│   ├── IFolderRepository.ts
│   ├── IResourceRepository.ts
│   ├── IResourceVersionRepository.ts
│   └── IResourceLinkRepository.ts
└── index.ts
```

### 3. Domain Client (packages/domain-client)

```
packages/domain-client/src/repository/
├── aggregates/
│   └── Repository.ts          # 客户端 Repository 实体
├── entities/
│   ├── Folder.ts
│   ├── Resource.ts
│   ├── ResourceVersion.ts
│   └── ResourceLink.ts
└── index.ts
```

### 4. API (apps/api)

```
apps/api/src/modules/repository/
├── application/
│   ├── RepositoryApplicationService.ts
│   ├── FolderApplicationService.ts
│   ├── ResourceApplicationService.ts
│   ├── ResourceVersionApplicationService.ts
│   ├── ResourceLinkApplicationService.ts
│   └── KnowledgeGraphApplicationService.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── entities/
│   │   │   ├── RepositoryEntity.ts    # TypeORM Entity
│   │   │   ├── FolderEntity.ts
│   │   │   ├── ResourceEntity.ts
│   │   │   ├── ResourceVersionEntity.ts
│   │   │   └── ResourceLinkEntity.ts
│   │   └── repositories/
│   │       ├── RepositoryRepositoryImpl.ts
│   │       ├── FolderRepositoryImpl.ts
│   │       ├── ResourceRepositoryImpl.ts
│   │       ├── ResourceVersionRepositoryImpl.ts
│   │       └── ResourceLinkRepositoryImpl.ts
│   └── di/
│       └── RepositoryContainer.ts  # DI 容器
├── presentation/
│   ├── controllers/
│   │   ├── RepositoryController.ts
│   │   ├── FolderController.ts
│   │   ├── ResourceController.ts
│   │   ├── ResourceVersionController.ts
│   │   └── ResourceLinkController.ts
│   └── dtos/
│       └── [API Request/Response DTOs]
└── repository.module.ts
```

### 5. Web (apps/web)

```
apps/web/src/modules/repository/
├── application/
│   └── services/
│       ├── RepositoryWebApplicationService.ts
│       ├── FolderWebApplicationService.ts
│       └── ResourceWebApplicationService.ts
├── infrastructure/
│   └── api/
│       ├── repositoryApi.ts
│       ├── folderApi.ts
│       ├── resourceApi.ts
│       └── linkApi.ts
├── presentation/
│   ├── views/
│   │   └── RepositoryView.vue  # 主视图（三栏布局）
│   ├── components/
│   │   ├── FileExplorer.vue           # P0: 文件树
│   │   ├── ResourceEditor.vue         # P0: Milkdown 编辑器
│   │   ├── BacklinksPanel.vue         # P1: 反向链接
│   │   ├── OutlinePanel.vue           # P1: 大纲
│   │   ├── VersionHistory.vue         # P1: 版本历史
│   │   ├── KnowledgeGraphView.vue     # P2: 知识图谱
│   │   ├── SearchDialog.vue           # P2: 全局搜索
│   │   └── VersionDiffDialog.vue      # P2: 版本对比
│   ├── composables/
│   │   ├── useRepository.ts
│   │   ├── useFolder.ts
│   │   ├── useResource.ts
│   │   └── useKnowledgeGraph.ts
│   └── stores/
│       ├── repositoryStore.ts
│       ├── folderStore.ts
│       └── resourceStore.ts
└── index.ts
```

---

## 🔧 技术选型与依赖

### 前端依赖

```json
{
  "dependencies": {
    "@milkdown/core": "^7.x",
    "@milkdown/preset-commonmark": "^7.x",
    "@milkdown/plugin-listener": "^7.x",
    "@milkdown/plugin-history": "^7.x",
    "@milkdown/plugin-cursor": "^7.x",
    "@milkdown/plugin-prism": "^7.x",
    "@milkdown/utils": "^7.x",
    "cytoscape": "^3.x",
    "diff2html": "^3.x",
    "diff-match-patch": "^1.x",
    "@vueuse/core": "^10.x"
  }
}
```

### 后端依赖

```json
{
  "dependencies": {
    "diff-match-patch": "^1.x"  # Diff 算法
  }
}
```

### 数据库扩展

```sql
-- PostgreSQL 中文分词扩展
CREATE EXTENSION IF NOT EXISTS pg_jieba;

-- 全文搜索配置
CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION chinese
  ALTER MAPPING FOR word, asciiword WITH jieba;
```

---

## 🎨 前端 UI 设计关键点

### 1. Milkdown 编辑器集成

```typescript
// apps/web/src/modules/repository/presentation/components/ResourceEditor.vue

import { Editor, rootCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';

const editor = Editor.make()
  .config((ctx) => {
    ctx.set(rootCtx, editorContainer.value);
    ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
      // 防抖保存
      debouncedSave(markdown);
    });
  })
  .use(commonmark)
  .use(listener)
  .use(history)
  .use(cursor)
  .use(prism)
  .use(bidirectionalLinkPlugin);  // 自定义双向链接插件
```

### 2. 双向链接插件

```typescript
// 自定义 Milkdown 插件
const bidirectionalLinkPlugin = $node('bidirectionalLink', () => ({
  group: 'inline',
  inline: true,
  atom: true,
  attrs: {
    title: { default: '' },
    href: { default: '' },
  },
  parseMarkdown: {
    match: (node) => node.type === 'bidirectionalLink',
    runner: (state, node, type) => {
      state.addNode(type, { title: node.title, href: node.href });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'bidirectionalLink',
    runner: (state, node) => {
      state.addNode('text', undefined, `[[${node.attrs.title}]]`);
    },
  },
}));
```

### 3. Cytoscape 知识图谱

```typescript
// apps/web/src/modules/repository/presentation/components/KnowledgeGraphView.vue

import cytoscape from 'cytoscape';

const cy = cytoscape({
  container: graphContainer.value,
  elements: graphData.value,  // { nodes: [...], edges: [...] }
  style: [
    {
      selector: 'node',
      style: {
        'background-color': '#4CAF50',
        'label': 'data(label)',
        'width': (node) => 40 + node.data('linkCount') * 2,  # 节点大小反映链接数
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#90A4AE',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ],
  layout: { name: 'cose' }  // 力导向布局
});
```

---

## 🔍 关键算法与逻辑

### 1. 链接解析算法（LinkParserService）

```typescript
export class LinkParserService {
  parseLinks(content: string): ParsedLink[] {
    const links: ParsedLink[] = [];
    const lines = content.split('\n');
    
    // 正则匹配：!?[[xxx]]
    const linkRegex = /(!?)\[\[([^\]]+)\]\]/g;
    
    lines.forEach((line, index) => {
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        const isEmbed = match[1] === '!';
        const linkText = match[2];
        const position = match.index;
        const context = this.extractContext(line, position, 50);
        
        links.push({
          linkType: isEmbed ? 'EMBED' : 'BIDIRECTIONAL',
          linkText,
          lineNumber: index + 1,
          context,
        });
      }
    });
    
    return links;
  }
  
  private extractContext(line: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(line.length, position + radius);
    return line.substring(start, end);
  }
}
```

### 2. 文件夹路径生成（FolderHierarchyService）

```typescript
export class FolderHierarchyService {
  async getFullPath(
    folderUuid: string,
    folderRepository: IFolderRepository
  ): Promise<string> {
    const pathSegments: string[] = [];
    let currentUuid: string | undefined = folderUuid;
    
    while (currentUuid) {
      const folder = await folderRepository.findByUuid(currentUuid);
      if (!folder) break;
      
      pathSegments.unshift(folder.name);
      currentUuid = folder.parentUuid;
    }
    
    return '/' + pathSegments.join('/');
  }
  
  async detectCycle(
    folderUuid: string,
    newParentUuid: string,
    folderRepository: IFolderRepository
  ): Promise<boolean> {
    let currentUuid: string | undefined = newParentUuid;
    
    while (currentUuid) {
      if (currentUuid === folderUuid) {
        return true;  // 检测到循环引用
      }
      
      const folder = await folderRepository.findByUuid(currentUuid);
      currentUuid = folder?.parentUuid;
    }
    
    return false;
  }
}
```

### 3. 版本 Diff 算法

```typescript
import DiffMatchPatch from 'diff-match-patch';

export class VersionDiffService {
  private dmp = new DiffMatchPatch();
  
  generateDiff(oldContent: string, newContent: string): string {
    const diffs = this.dmp.diff_main(oldContent, newContent);
    this.dmp.diff_cleanupSemantic(diffs);
    
    return this.dmp.diff_prettyHtml(diffs);
  }
  
  calculateMetadata(oldContent: string, newContent: string): VersionMetadata {
    const diffs = this.dmp.diff_main(oldContent, newContent);
    
    let addedChars = 0;
    let deletedChars = 0;
    
    diffs.forEach(([operation, text]) => {
      if (operation === 1) addedChars += text.length;
      if (operation === -1) deletedChars += text.length;
    });
    
    return new VersionMetadata({
      addedChars,
      deletedChars,
      modifiedLines: diffs.length,
    });
  }
}
```

---

## 🚀 开发流程建议

### Sprint 0: 数据迁移（3-5 天）

1. **数据库迁移脚本**：
   ```sql
   -- 1. 新增表
   CREATE TABLE folders (...);
   CREATE TABLE resource_versions (...);
   CREATE TABLE resource_links (...);
   
   -- 2. 扩展 resources 表
   ALTER TABLE resources ADD COLUMN folder_uuid UUID;
   ALTER TABLE resources ADD COLUMN content TEXT;
   
   -- 3. 迁移数据
   -- 为每个用户创建默认 Repository
   INSERT INTO repositories (...) VALUES (...);
   
   -- 迁移 documents → resources
   INSERT INTO resources (...) SELECT ... FROM documents;
   
   -- 4. 备份旧表
   CREATE TABLE documents_backup AS SELECT * FROM documents;
   
   -- 5. 删除旧表
   DROP TABLE document_links;
   DROP TABLE document_versions;
   DROP TABLE documents;
   ```

2. **验证脚本**：
   ```sql
   SELECT COUNT(*) FROM resources WHERE repository_uuid IS NULL;  -- 应该为 0
   SELECT COUNT(*) FROM resource_versions WHERE resource_uuid NOT IN (SELECT uuid FROM resources);  -- 应该为 0
   ```

### Sprint 1: 核心 CRUD（1 周）

1. **后端开发顺序**：
   - Contracts 定义（接口 + DTO）
   - Domain 实体实现
   - Infrastructure 持久化
   - Application Service
   - Controller API

2. **前端开发顺序**：
   - API Client
   - Pinia Store
   - FileExplorer 组件
   - ResourceEditor 组件（基础版，不含 Milkdown）

### Sprint 2-4: 功能开发

按照 Epic 文档中的 Story 顺序逐个实现。

---

## 📊 性能优化建议

1. **大文件处理**：
   - Markdown 内容 > 10MB：分块加载
   - 图片：缩略图 + 懒加载

2. **知识图谱**：
   - 节点数 > 100：启用虚拟化渲染
   - 节点数 > 1000：分页加载或聚合显示

3. **全文搜索**：
   - PostgreSQL 索引优化：`CREATE INDEX CONCURRENTLY`
   - 中文分词缓存

4. **版本 Diff**：
   - 大文件 Diff：后台任务队列
   - 缓存 Diff 结果

---

## 🧪 测试策略

1. **单元测试**：
   - Domain 实体业务逻辑
   - LinkParserService 链接解析
   - FolderHierarchyService 路径生成

2. **集成测试**：
   - API 端点测试（Supertest）
   - 数据库操作测试

3. **E2E 测试**（Playwright）：
   - 创建文件夹和笔记
   - 编辑 Markdown 内容
   - 插入双向链接
   - 查看反向链接
   - 版本历史操作

---

## 📝 下一步行动

1. ✅ Epic 10 文档已创建
2. ✅ Sprint Status 已更新
3. ⏭️ 创建 Story 10.1 详细设计
4. ⏭️ 数据库迁移脚本编写
5. ⏭️ Contracts 接口定义

---

**文档作者**: Scrum Master - Bob  
**最后更新**: 2025-11-09
