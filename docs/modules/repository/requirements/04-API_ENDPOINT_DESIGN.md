# 仓储模块 - RESTful API 端点设计

> **文档类型**: BA 需求文档
> **作者**: BA - Business Analyst
> **日期**: 2025-11-09
> **版本**: v1.0
> **项目**: DailyUse - Repository Module (Obsidian-inspired)

---

## 🎯 文档目标

本文档定义仓储模块的 RESTful API 端点规范，包括：

1. API 路由设计
2. HTTP 方法和状态码
3. 请求/响应示例
4. 认证和权限
5. 错误处理规范

---

## 🏗️ API 架构设计

### 基础路径

```
Base URL: https://api.dailyuse.com/v1
Prefix: /repositories
```

### 认证方式

```http
Authorization: Bearer <JWT_TOKEN>
```

所有 API 端点均需要 JWT 认证，从 Token 中提取 `accountUuid`。

---

## 1️⃣ Repository API

### 1.1 创建仓储

```http
POST /repositories
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "我的知识库",
  "type": "markdown",
  "path": "/vault/knowledge-base",
  "description": "个人知识管理",
  "config": {
    "searchEngine": "postgres",
    "enableGit": false
  }
}
```

**响应** (201 Created):
```json
{
  "repository": {
    "uuid": "repo-123",
    "accountUuid": "acc-456",
    "name": "我的知识库",
    "type": "markdown",
    "status": "active",
    "path": "/vault/knowledge-base",
    "createdAt": "2025-11-09T10:00:00Z"
  }
}
```

---

### 1.2 查询仓储列表

```http
GET /repositories?page=1&pageSize=20&status=active&sortBy=createdAt&sortOrder=desc
```

**查询参数**:
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 20，最大 100）
- `status`: 状态筛选（active|archived）
- `type`: 类型筛选（markdown|code|mixed）
- `searchKeyword`: 搜索关键词
- `sortBy`: 排序字段（name|createdAt|updatedAt）
- `sortOrder`: 排序方向（asc|desc）

**响应** (200 OK):
```json
{
  "repositories": [...],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

### 1.3 查询仓储详情

```http
GET /repositories/:uuid
```

**响应** (200 OK):
```json
{
  "repository": {...},
  "statistics": {
    "resourceCount": 128,
    "folderCount": 24,
    "totalSize": 5242880,
    "linkCount": 67,
    "recentResources": [...],
    "topTags": [
      { "tag": "vue3", "count": 15 },
      { "tag": "typescript", "count": 12 }
    ]
  }
}
```

---

### 1.4 更新仓储

```http
PATCH /repositories/:uuid
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "新的知识库名称",
  "description": "更新后的描述",
  "config": {
    "searchEngine": "meilisearch"
  }
}
```

**响应** (200 OK):
```json
{
  "repository": {...}
}
```

---

### 1.5 仓储状态管理

```http
POST /repositories/:uuid/archive   # 归档仓储
POST /repositories/:uuid/activate  # 激活仓储
DELETE /repositories/:uuid         # 删除仓储（软删除）
```

**响应** (204 No Content)

---

### 1.6 Git 集成

```http
POST /repositories/:uuid/git/init
Content-Type: application/json
```

**请求体**:
```json
{
  "gitUrl": "https://github.com/user/repo.git"
}
```

**响应** (200 OK):
```json
{
  "gitInfo": {
    "url": "https://github.com/user/repo.git",
    "branch": "main",
    "lastSyncAt": "2025-11-09T10:00:00Z"
  }
}
```

---

## 2️⃣ Folder API

### 2.1 创建文件夹

```http
POST /repositories/:repoUuid/folders
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "前端笔记",
  "parentUuid": "folder-456",
  "order": 1,
  "metadata": {
    "icon": "📁",
    "color": "#4CAF50"
  }
}
```

**响应** (201 Created):
```json
{
  "folder": {
    "uuid": "folder-789",
    "repositoryUuid": "repo-123",
    "name": "前端笔记",
    "parentUuid": "folder-456",
    "path": "/前端笔记",
    "order": 1,
    "expanded": true
  }
}
```

---

### 2.2 查询文件夹树

```http
GET /repositories/:repoUuid/folders/tree
```

**响应** (200 OK):
```json
{
  "tree": [
    {
      "folder": {...},
      "children": [
        {
          "folder": {...},
          "children": [],
          "resourceCount": 5
        }
      ],
      "resourceCount": 12
    }
  ]
}
```

---

### 2.3 文件夹操作

```http
PATCH /folders/:uuid/rename        # 重命名
PATCH /folders/:uuid/move          # 移动
PATCH /folders/:uuid/order         # 更新排序
POST /folders/:uuid/toggle         # 切换展开/折叠
DELETE /folders/:uuid              # 删除（级联）
```

**重命名请求**:
```json
{
  "newName": "Vue3 笔记"
}
```

**移动请求**:
```json
{
  "newParentUuid": "folder-999"
}
```

---

## 3️⃣ Resource API

### 3.1 创建资源

```http
POST /repositories/:repoUuid/resources
Content-Type: application/json
```

**请求体**:
```json
{
  "folderUuid": "folder-456",
  "name": "Vue3 组合式 API",
  "type": "markdown",
  "content": "# Vue3 Composition API\n\n## 响应式基础...",
  "tags": ["vue3", "frontend"],
  "description": "Vue3 组合式 API 学习笔记"
}
```

**响应** (201 Created):
```json
{
  "resource": {
    "uuid": "res-123",
    "repositoryUuid": "repo-123",
    "folderUuid": "folder-456",
    "name": "Vue3 组合式 API",
    "type": "markdown",
    "status": "active",
    "tags": ["vue3", "frontend"],
    "createdAt": "2025-11-09T10:00:00Z"
  }
}
```

---

### 3.2 查询资源列表

```http
GET /repositories/:repoUuid/resources?folderUuid=folder-456&tags=vue3,typescript&page=1
```

**查询参数**:
- `folderUuid`: 文件夹筛选
- `type`: 类型筛选（markdown|image|video...）
- `status`: 状态筛选
- `tags`: 标签筛选（逗号分隔）
- `searchKeyword`: 关键词搜索
- `page`, `pageSize`, `sortBy`, `sortOrder`

**响应** (200 OK):
```json
{
  "resources": [...],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

### 3.3 查询资源详情

```http
GET /resources/:uuid
```

**响应** (200 OK):
```json
{
  "resource": {
    "uuid": "res-123",
    "name": "Vue3 组合式 API",
    "content": "# Vue3 Composition API\n\n...",
    "tags": ["vue3", "frontend"],
    ...
  },
  "metadata": {
    "wordCount": 1234,
    "charCount": 5678,
    "linkCount": 5,
    "codeBlockCount": 3
  },
  "stats": {
    "viewCount": 42,
    "lastViewedAt": "2025-11-09T09:00:00Z"
  },
  "backlinks": [
    {
      "link": {...},
      "sourceResource": {
        "uuid": "res-456",
        "name": "Vue3 入门"
      }
    }
  ],
  "relatedResources": [...]
}
```

---

### 3.4 更新资源内容

```http
PATCH /resources/:uuid/content
Content-Type: application/json
```

**请求体**:
```json
{
  "content": "# Vue3 Composition API\n\n## 更新后的内容...",
  "changedBy": "user-123",
  "changeType": "minor",
  "changeDescription": "添加了 watchEffect 示例"
}
```

**响应** (200 OK):
```json
{
  "version": {
    "uuid": "ver-789",
    "versionNumber": 2,
    "changeType": "minor",
    "createdAt": "2025-11-09T10:00:00Z"
  }
}
```

---

### 3.5 资源操作

```http
PATCH /resources/:uuid/rename      # 重命名
PATCH /resources/:uuid/move        # 移动
POST /resources/:uuid/tags         # 添加标签
DELETE /resources/:uuid/tags/:tag  # 删除标签
POST /resources/:uuid/archive      # 归档
POST /resources/:uuid/activate     # 激活
POST /resources/:uuid/view         # 记录访问
DELETE /resources/:uuid            # 删除
```

---

### 3.6 全文搜索

```http
GET /repositories/:repoUuid/search?keyword=vue3&type=markdown&tags=frontend
```

**响应** (200 OK):
```json
{
  "results": [
    {
      "resource": {...},
      "highlights": [
        "...学习 <mark>Vue3</mark> 组合式 API...",
        "...<mark>Vue3</mark> 提供了响应式系统..."
      ],
      "score": 0.95
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 20
}
```

---

## 4️⃣ Version API

### 4.1 查询版本列表

```http
GET /resources/:uuid/versions?page=1&pageSize=10
```

**响应** (200 OK):
```json
{
  "versions": [
    {
      "uuid": "ver-123",
      "versionNumber": 3,
      "changeType": "major",
      "changeDescription": "重构整个文档结构",
      "changedBy": "user-123",
      "createdAt": "2025-11-09T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "pageSize": 10
}
```

---

### 4.2 查询版本详情

```http
GET /versions/:versionUuid
```

**响应** (200 OK):
```json
{
  "uuid": "ver-123",
  "resourceUuid": "res-456",
  "versionNumber": 3,
  "content": "# Vue3 Composition API\n\n...",
  "changeType": "major",
  "contentHash": "abc123...",
  "size": 5120,
  "createdAt": "2025-11-09T10:00:00Z"
}
```

---

### 4.3 版本对比

```http
GET /versions/compare?v1=ver-123&v2=ver-456
```

**响应** (200 OK):
```json
{
  "version1": {...},
  "version2": {...},
  "diff": {
    "added": ["+  新增的内容行"],
    "deleted": ["-  删除的内容行"],
    "modified": ["~  修改的内容行"],
    "htmlDiff": "<div class='diff'>...</div>"
  },
  "statistics": {
    "addedChars": 120,
    "deletedChars": 45,
    "modifiedLines": 8
  }
}
```

---

### 4.4 恢复版本

```http
POST /versions/:versionUuid/restore
Content-Type: application/json
```

**请求体**:
```json
{
  "restoredBy": "user-123"
}
```

**响应** (200 OK):
```json
{
  "newVersion": {
    "uuid": "ver-999",
    "versionNumber": 5,
    "changeType": "patch",
    "changeDescription": "恢复到版本 3"
  }
}
```

---

## 5️⃣ Link API

### 5.1 查询正向链接

```http
GET /resources/:uuid/links/outgoing
```

**响应** (200 OK):
```json
{
  "links": [
    {
      "link": {
        "uuid": "link-123",
        "type": "wikilink",
        "anchorText": "Vue3 响应式原理"
      },
      "targetResource": {
        "uuid": "res-789",
        "name": "Vue3 响应式原理",
        "type": "markdown"
      }
    }
  ],
  "total": 5
}
```

---

### 5.2 查询反向链接

```http
GET /resources/:uuid/links/incoming
```

**响应** (200 OK):
```json
{
  "links": [
    {
      "link": {...},
      "sourceResource": {
        "uuid": "res-456",
        "name": "Vue3 入门指南"
      }
    }
  ],
  "total": 12
}
```

---

### 5.3 检测断链

```http
GET /repositories/:repoUuid/links/broken
```

**响应** (200 OK):
```json
{
  "brokenLinks": [
    {
      "link": {
        "uuid": "link-123",
        "anchorText": "已删除的笔记",
        "targetResourceUuid": "res-deleted"
      },
      "sourceResource": {...},
      "suggestions": [
        {
          "uuid": "res-999",
          "name": "类似的笔记",
          "similarity": 0.85
        }
      ]
    }
  ],
  "total": 3
}
```

---

### 5.4 修复断链

```http
POST /links/:linkUuid/repair
Content-Type: application/json
```

**请求体**:
```json
{
  "targetResourceUuid": "res-999"
}
```

**响应** (200 OK)

---

## 6️⃣ Knowledge Graph API

### 6.1 生成知识图谱

```http
GET /repositories/:repoUuid/graph?maxNodes=100&maxDepth=3&includeTypes=markdown
```

**响应** (200 OK):
```json
{
  "nodes": [
    {
      "id": "res-123",
      "label": "Vue3 组合式 API",
      "type": "markdown",
      "data": {...}
    }
  ],
  "edges": [
    {
      "id": "link-456",
      "source": "res-123",
      "target": "res-789",
      "type": "wikilink",
      "data": {...}
    }
  ],
  "statistics": {
    "nodeCount": 45,
    "edgeCount": 67,
    "avgDegree": 2.98,
    "clusters": 5
  }
}
```

---

### 6.2 查询邻居节点

```http
GET /resources/:uuid/neighbors?depth=2
```

**响应** (200 OK):
```json
{
  "center": {...},
  "neighbors": [
    {
      "resource": {...},
      "distance": 1,
      "path": ["res-123", "res-456"]
    }
  ]
}
```

---

### 6.3 路径查询

```http
GET /graph/path?source=res-123&target=res-789
```

**响应** (200 OK):
```json
{
  "path": [
    { "uuid": "res-123", "name": "Vue3 入门" },
    { "uuid": "res-456", "name": "Vue3 响应式" },
    { "uuid": "res-789", "name": "Vue3 组件" }
  ],
  "distance": 2
}
```

---

### 6.4 推荐相似资源

```http
GET /resources/:uuid/similar?limit=5
```

**响应** (200 OK):
```json
{
  "similar": [
    {
      "resource": {...},
      "similarity": 0.92,
      "reason": "共同标签: vue3, typescript, composition-api"
    }
  ]
}
```

---

## 📊 HTTP 状态码规范

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 200 OK | 成功 | GET, PATCH 成功 |
| 201 Created | 已创建 | POST 成功创建资源 |
| 204 No Content | 无内容 | DELETE 成功 |
| 400 Bad Request | 请求错误 | 参数验证失败 |
| 401 Unauthorized | 未认证 | JWT Token 无效或缺失 |
| 403 Forbidden | 无权限 | 访问非本账户资源 |
| 404 Not Found | 未找到 | 资源不存在 |
| 409 Conflict | 冲突 | 名称重复、循环引用等 |
| 422 Unprocessable Entity | 无法处理 | 业务规则验证失败 |
| 500 Internal Server Error | 服务器错误 | 未预期的错误 |

---

## 🚨 错误响应格式

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "资源未找到",
    "details": {
      "resourceUuid": "res-123"
    },
    "timestamp": "2025-11-09T10:00:00Z"
  }
}
```

### 错误代码清单

| 错误代码 | HTTP 状态 | 说明 |
|---------|----------|------|
| `REPOSITORY_NOT_FOUND` | 404 | 仓储不存在 |
| `FOLDER_NOT_FOUND` | 404 | 文件夹不存在 |
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 |
| `DUPLICATE_NAME` | 409 | 名称重复 |
| `CYCLIC_REFERENCE` | 409 | 循环引用 |
| `INVALID_PATH` | 400 | 路径格式错误 |
| `UNAUTHORIZED` | 401 | 未认证 |
| `FORBIDDEN` | 403 | 无权限 |

---

## 📝 总结

### API 统计

| API 分组 | 端点数量 | 优先级分布 |
|---------|---------|-----------|
| Repository API | 6 | P0: 3, P1: 3 |
| Folder API | 6 | P0: 2, P1: 4 |
| Resource API | 10 | P0: 4, P1: 6 |
| Version API | 4 | P1: 4 |
| Link API | 4 | P1: 4 |
| Knowledge Graph API | 4 | P2: 4 |
| **总计** | **34** | - |

### 下一步

1. ✅ 数据库架构设计
2. ✅ 领域模型设计
3. ✅ 应用服务接口设计
4. ✅ RESTful API 设计（本文档）
5. ⏭️ 前端交互设计（见 05-FRONTEND_UX_DESIGN.md）

---

**文档作者**: BA - Business Analyst  
**审核人员**: PM - John  
**最后更新**: 2025-11-09
