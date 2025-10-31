# Epic 7: 架构对比 - 当前实现 vs 目标架构

## 📊 当前实现 (Document 模块)

```
┌─────────────────────────────────────────────────┐
│              Account (聚合根)                    │
│  - uuid, email, profile                         │
└─────────────────────────────────────────────────┘
                      │
                      │ 1:N
                      ↓
┌─────────────────────────────────────────────────┐
│            Document (聚合根) ❌                  │
│  - uuid, title, content, folderPath             │
│  - status (DRAFT | PUBLISHED | ARCHIVED)        │
│  - tags[], summary                              │
│  ❌ 缺少：资源类型字段 (只支持 Markdown)          │
│  ❌ 缺少：Repository 归属关系                    │
│  ❌ 缺少：统一资源管理能力                        │
└─────────────────────────────────────────────────┘
        │                    │
        │ 1:N                │ 1:N
        ↓                    ↓
┌─────────────────┐  ┌─────────────────┐
│ DocumentVersion │  │  DocumentLink   │
│  - version      │  │  - sourceDocUuid │
│  - content      │  │  - targetDocUuid │
│  - changeType   │  │  - linkType     │
└─────────────────┘  └─────────────────┘
```

### ❌ 存在的问题

1. **架构不符合 Contracts 定义**
   - Document 应该是 Resource 实体，不是聚合根
   - 缺少 Repository 聚合根

2. **资源类型单一**
   - 只支持 Markdown 文档
   - 无法管理 IMAGE、VIDEO、PDF 等其他资源

3. **逻辑归属不明确**
   - Document 直接属于 Account
   - 用户无法逻辑上组织文档到不同仓库

4. **扩展性差**
   - 添加新资源类型需要创建新的聚合根
   - 无法复用版本管理、链接管理等功能

---

## 🎯 目标架构 (Repository + Resource 模式)

```
┌─────────────────────────────────────────────────┐
│              Account (聚合根)                    │
│  - uuid, email, profile                         │
└─────────────────────────────────────────────────┘
                      │
                      │ 1:N
                      ↓
┌─────────────────────────────────────────────────┐
│          Repository (聚合根) ✅                  │
│  - uuid, name, type, path, description          │
│  - type: LOCAL | REMOTE | SYNCHRONIZED          │
│  - config: RepositoryConfig                     │
│  - stats: RepositoryStats (totalSize, count)    │
│  - syncStatus: SyncStatus (lastSync, status)    │
│  ✅ 统一管理多种资源类型                          │
│  ✅ 支持 Git 同步                                │
└─────────────────────────────────────────────────┘
                      │
                      │ 1:N
                      ↓
┌─────────────────────────────────────────────────┐
│            Resource (实体) ✅                    │
│  - uuid, name, type, path, size                 │
│  - type: ResourceType (枚举)                    │
│    • MARKDOWN (Markdown 文档) ✅ 已实现           │
│    • IMAGE (图片：jpg, png, gif)                 │
│    • VIDEO (视频：mp4, mov)                      │
│    • AUDIO (音频：mp3, wav)                      │
│    • PDF (PDF 文档)                              │
│    • LINK (外部链接)                              │
│    • CODE (代码文件)                              │
│    • OTHER (其他类型)                             │
│  - metadata: ResourceMetadata                   │
│    • mimeType, encoding, thumbnailPath          │
│    • isFavorite, accessCount, lastAccessedAt    │
│  - tags[], category, status                     │
│  ✅ 统一接口，类型专用方法                         │
└─────────────────────────────────────────────────┘
        │                    │                │
        │ 1:N                │ 1:N            │ 1:N
        ↓                    ↓                ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ ResourceVersion │  │ResourceReference│  │  LinkedContent  │
│  - version      │  │  - sourceUuid   │  │  - contentType  │
│  - content      │  │  - targetUuid   │  │  - url, title   │
│  - changeType   │  │  - referenceType│  │  - metadata     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### ✅ 架构优势

1. **符合 DDD 设计原则**
   - Repository 作为聚合根，管理生命周期
   - Resource 作为实体，属于 Repository

2. **支持多资源类型**
   - 统一的 Resource 接口
   - 8 种预定义资源类型
   - 类型专用方法 (如 Markdown 的 updateContent)

3. **逻辑归属明确**
   - 用户创建多个 Repository (如 "工作笔记"、"个人日记")
   - Resource 逻辑上归属到 Repository
   - 用户可以移动 Resource 到不同 Repository

4. **高度可扩展**
   - 版本管理、引用管理可复用到所有资源类型
   - 添加新资源类型只需扩展 ResourceType 枚举
   - 支持未来功能：全文搜索、知识图谱、协作编辑

---

## 🔄 重构映射关系

| 当前实现 (Document) | 目标架构 (Repository + Resource) |
|-------------------|--------------------------------|
| Document (聚合根) | Resource (实体) |
| accountUuid | repositoryUuid (归属到 Repository) |
| title | name |
| content | metadata.content (Markdown 专用) |
| folderPath | path (相对于 Repository) |
| status (DRAFT/PUBLISHED/ARCHIVED) | status (ACTIVE/ARCHIVED/DELETED/DRAFT) |
| tags[] | tags[] |
| summary | description |
| DocumentVersion | ResourceVersion |
| DocumentLink | ResourceReference (引用类型更丰富) |
| ❌ 无 | Repository (新增聚合根) |
| ❌ 无 | ResourceType (新增类型字段) |
| ❌ 无 | ResourceMetadata (新增元数据) |

---

## 📝 数据库迁移示例

### Phase 1: 创建 Repository 和默认仓库

```sql
-- 1. 创建 repository 表
CREATE TABLE repository (
  uuid UUID PRIMARY KEY,
  account_uuid UUID NOT NULL REFERENCES account(uuid),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  path VARCHAR(500) NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  stats JSONB NOT NULL DEFAULT '{"totalSize": 0, "resourceCount": 0}',
  sync_status JSONB,
  git_info JSONB,
  related_goals TEXT[],
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  last_accessed_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  
  INDEX idx_account_uuid (account_uuid),
  INDEX idx_status (status)
);

-- 2. 为每个用户创建默认仓库
INSERT INTO repository (uuid, account_uuid, name, type, path, config, stats, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  uuid AS account_uuid,
  'My Documents' AS name,
  'LOCAL' AS type,
  '/documents' AS path,
  '{"defaultFolder": "/documents", "autoVersion": true}' AS config,
  jsonb_build_object(
    'totalSize', COALESCE((SELECT SUM(LENGTH(content)) FROM document WHERE account_uuid = account.uuid AND deleted_at IS NULL), 0),
    'resourceCount', COALESCE((SELECT COUNT(*) FROM document WHERE account_uuid = account.uuid AND deleted_at IS NULL), 0)
  ) AS stats,
  'ACTIVE' AS status,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 AS created_at,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 AS updated_at
FROM account;
```

### Phase 2: 迁移 Document → Resource (使用视图)

```sql
-- 创建 resource 视图 (兼容现有 document 表)
CREATE VIEW resource_view AS
SELECT
  d.uuid,
  r.uuid AS repository_uuid,
  d.title AS name,
  'MARKDOWN' AS type,
  COALESCE(d.folder_path || '/' || d.title, d.title) AS path,
  LENGTH(d.content) AS size,
  d.summary AS description,
  d.author,
  NULL AS version,
  d.tags,
  d.category,
  CASE
    WHEN d.status = 'DRAFT' THEN 'DRAFT'
    WHEN d.status = 'PUBLISHED' THEN 'ACTIVE'
    WHEN d.status = 'ARCHIVED' THEN 'ARCHIVED'
  END AS status,
  jsonb_build_object(
    'content', d.content,
    'mimeType', 'text/markdown',
    'encoding', 'utf-8',
    'isFavorite', COALESCE(d.is_favorite, false),
    'accessCount', 0
  ) AS metadata,
  d.created_at,
  d.updated_at,
  d.modified_at
FROM document d
JOIN repository r ON r.account_uuid = d.account_uuid AND r.name = 'My Documents'
WHERE d.deleted_at IS NULL;
```

### Phase 3: 迁移 Version 和 Link

```sql
-- 迁移 document_version → resource_version
INSERT INTO resource_version (uuid, resource_uuid, version, name, content, change_type, changed_by, change_note, created_at)
SELECT
  dv.uuid,
  dv.document_uuid AS resource_uuid,
  dv.version,
  d.title AS name,
  dv.content,
  dv.change_type,
  dv.changed_by,
  dv.change_note,
  dv.created_at
FROM document_version dv
JOIN document d ON d.uuid = dv.document_uuid
WHERE d.deleted_at IS NULL;

-- 迁移 document_link → resource_reference
INSERT INTO resource_reference (uuid, source_resource_uuid, target_resource_uuid, reference_type, anchor_text, position, is_broken, created_by, created_at, updated_at)
SELECT
  dl.uuid,
  dl.source_document_uuid AS source_resource_uuid,
  dl.target_document_uuid AS target_resource_uuid,
  'LINK' AS reference_type,
  dl.link_text AS anchor_text,
  jsonb_build_object('line', dl.link_position, 'column', 0, 'length', LENGTH(dl.link_text)) AS position,
  dl.is_broken,
  '' AS created_by,  -- 需要从其他表获取
  dl.created_at,
  dl.updated_at
FROM document_link dl
JOIN document sd ON sd.uuid = dl.source_document_uuid
JOIN document td ON td.uuid = dl.target_document_uuid
WHERE sd.deleted_at IS NULL AND td.deleted_at IS NULL;
```

---

## 🚀 Milkdown 编辑器示例

### 基础配置

```typescript
// apps/web/src/modules/repository/presentation/components/MilkdownEditor.vue

import { Editor, rootCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { prism } from '@milkdown/plugin-prism';

export function useMilkdownEditor(initialContent: string) {
  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, document.querySelector('#editor'));
      
      // 监听内容变化
      ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
        emit('update:content', markdown);
      });
    })
    .use(commonmark)      // 基础 Markdown 支持
    .use(listener)        // 事件监听
    .use(history)         // 撤销/重做
    .use(cursor)          // 光标管理
    .use(prism)           // 代码高亮
    .use(bidirectionalLinkPlugin);  // 自定义双向链接插件

  return { editor };
}
```

### 双向链接插件

```typescript
// 自定义双向链接插件
import { $command, $node } from '@milkdown/utils';

const bidirectionalLinkPlugin = $node('bidirectionalLink', () => ({
  group: 'inline',
  inline: true,
  atom: true,
  
  attrs: {
    title: { default: '' },
    href: { default: '' },
  },
  
  parseDOM: [
    {
      tag: 'a[data-type="bidirectional-link"]',
      getAttrs: (dom) => ({
        title: dom.getAttribute('data-title'),
        href: dom.getAttribute('href'),
      }),
    },
  ],
  
  toDOM: (node) => {
    return [
      'a',
      {
        'data-type': 'bidirectional-link',
        'data-title': node.attrs.title,
        href: node.attrs.href,
        class: 'internal-link',
      },
      node.attrs.title,
    ];
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

// 添加输入规则 (输入 [[ 自动触发)
const bidirectionalLinkInputRule = $command('insertBidirectionalLink', () => ({
  rule: /\[\[([^\]]+)\]\]$/,
  handler: ({ state, dispatch, match }) => {
    const title = match[1];
    const { tr } = state;
    const node = state.schema.nodes.bidirectionalLink.create({ title, href: `#${title}` });
    tr.replaceWith(match.index, match.index + match[0].length, node);
    dispatch(tr);
    return true;
  },
}));
```

---

**总结**: 重构后架构更加清晰、可扩展，符合 DDD 设计原则和 Contracts 定义。

