# 仓储模块 - 应用服务接口设计

> **文档类型**: BA 需求文档  
> **作者**: BA - Business Analyst  
> **日期**: 2025-11-09  
> **版本**: v1.0  
> **项目**: DailyUse - Repository Module (Obsidian-inspired)

---

## �� 文档目标

本文档定义仓储模块（Repository）的应用服务层接口，基于 DDD 应用服务模式，包括：

1. 应用服务职责划分
2. 用例（Use Case）定义
3. DTO 接口定义
4. 服务方法签名
5. 事务边界与错误处理

---

## 🏗️ 应用服务架构

```
┌─────────────────────────────────────────────────┐
│          Presentation Layer (Controller)        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Application Service Layer               │
├─────────────────────────────────────────────────┤
│  RepositoryApplicationService                   │
│  FolderApplicationService                       │
│  ResourceApplicationService                     │
│  ResourceVersionApplicationService              │
│  ResourceLinkApplicationService                 │
│  KnowledgeGraphApplicationService (知识图谱)   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│            Domain Layer                          │
│  (Aggregates, Entities, Domain Services)        │
└─────────────────────────────────────────────────┘
```

---

## 1️⃣ RepositoryApplicationService

### 职责

管理仓储的生命周期，包括创建、配置、统计、状态管理等。

### 用例清单

| 用例 ID | 用例名称 | 优先级 | 说明 |
|---------|---------|--------|------|
| UC-REPO-001 | 创建仓储 | P0 | 用户创建新的知识仓储 |
| UC-REPO-002 | 查询仓储列表 | P0 | 分页查询用户的仓储列表 |
| UC-REPO-003 | 查询仓储详情 | P0 | 获取单个仓储的完整信息 |
| UC-REPO-004 | 更新仓储配置 | P1 | 修改仓储名称、描述、配置等 |
| UC-REPO-005 | 归档仓储 | P1 | 将仓储标记为归档状态 |
| UC-REPO-006 | 激活仓储 | P1 | 恢复归档的仓储 |
| UC-REPO-007 | 删除仓储 | P1 | 软删除仓储（级联删除所有资源） |
| UC-REPO-008 | 初始化 Git | P2 | 为仓储关联 Git 远程仓库 |
| UC-REPO-009 | 刷新统计 | P2 | 重新计算仓储统计数据 |

### TypeScript 接口定义

```typescript
// apps/api/src/modules/repository/application/repository.application-service.ts

export interface IRepositoryApplicationService {
  /**
   * UC-REPO-001: 创建仓储
   */
  createRepository(
    request: CreateRepositoryRequest
  ): Promise<CreateRepositoryResponse>;
  
  /**
   * UC-REPO-002: 查询仓储列表（分页）
   */
  findRepositories(
    request: FindRepositoriesRequest
  ): Promise<FindRepositoriesResponse>;
  
  /**
   * UC-REPO-003: 查询仓储详情
   */
  findRepositoryByUuid(
    uuid: string
  ): Promise<RepositoryDetailResponse>;
  
  /**
   * UC-REPO-004: 更新仓储配置
   */
  updateRepository(
    uuid: string,
    request: UpdateRepositoryRequest
  ): Promise<UpdateRepositoryResponse>;
  
  /**
   * UC-REPO-005: 归档仓储
   */
  archiveRepository(uuid: string): Promise<void>;
  
  /**
   * UC-REPO-006: 激活仓储
   */
  activateRepository(uuid: string): Promise<void>;
  
  /**
   * UC-REPO-007: 删除仓储（软删除）
   */
  deleteRepository(uuid: string): Promise<void>;
  
  /**
   * UC-REPO-008: 初始化 Git
   */
  initializeGit(
    uuid: string,
    gitUrl: string
  ): Promise<void>;
  
  /**
   * UC-REPO-009: 刷新统计
   */
  refreshStatistics(uuid: string): Promise<RepositoryStatsResponse>;
}
```

### DTO 定义

```typescript
// 创建仓储请求
export interface CreateRepositoryRequest {
  accountUuid: string;
  name: string;
  type: RepositoryType;  // MARKDOWN | CODE | MIXED
  path: string;
  description?: string;
  config?: {
    searchEngine?: 'postgres' | 'meilisearch' | 'elasticsearch';
    enableGit?: boolean;
    autoSync?: boolean;
    syncInterval?: number;
  };
}

// 创建仓储响应
export interface CreateRepositoryResponse {
  repository: RepositoryServerDTO;
}

// 查询仓储列表请求
export interface FindRepositoriesRequest {
  accountUuid: string;
  page?: number;          // 页码，默认 1
  pageSize?: number;      // 每页数量，默认 20
  status?: RepositoryStatus[];  // 筛选状态
  type?: RepositoryType[];      // 筛选类型
  searchKeyword?: string;       // 搜索关键词（名称、描述）
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastAccessedAt';
  sortOrder?: 'asc' | 'desc';
}

// 查询仓储列表响应
export interface FindRepositoriesResponse {
  repositories: RepositoryServerDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 仓储详情响应（含统计）
export interface RepositoryDetailResponse {
  repository: RepositoryServerDTO;
  statistics: {
    resourceCount: number;
    folderCount: number;
    totalSize: number;
    linkCount: number;
    recentResources: ResourceServerDTO[];  // 最近修改的 5 个资源
    topTags: Array<{ tag: string; count: number }>;  // 使用最多的标签
  };
}

// 更新仓储请求
export interface UpdateRepositoryRequest {
  name?: string;
  description?: string;
  config?: Partial<RepositoryConfigDTO>;
}

// 统计响应
export interface RepositoryStatsResponse {
  stats: RepositoryStatsDTO;
}
```

---

## 2️⃣ FolderApplicationService

### 职责

管理文件夹的树形层级结构，包括创建、移动、重命名、排序等。

### 用例清单

| 用例 ID | 用例名称 | 优先级 | 说明 |
|---------|---------|--------|------|
| UC-FOLDER-001 | 创建文件夹 | P0 | 在仓储中创建新文件夹 |
| UC-FOLDER-002 | 查询文件夹树 | P0 | 获取仓储的完整文件夹树 |
| UC-FOLDER-003 | 重命名文件夹 | P1 | 修改文件夹名称 |
| UC-FOLDER-004 | 移动文件夹 | P1 | 移动到新的父文件夹 |
| UC-FOLDER-005 | 删除文件夹 | P1 | 级联删除文件夹及所有子内容 |
| UC-FOLDER-006 | 更新排序 | P2 | 调整同级文件夹的排序 |
| UC-FOLDER-007 | 切换展开状态 | P2 | 记住用户的展开/折叠偏好 |

### TypeScript 接口定义

```typescript
export interface IFolderApplicationService {
  /**
   * UC-FOLDER-001: 创建文件夹
   */
  createFolder(
    request: CreateFolderRequest
  ): Promise<CreateFolderResponse>;
  
  /**
   * UC-FOLDER-002: 查询文件夹树
   */
  getFolderTree(
    repositoryUuid: string
  ): Promise<FolderTreeResponse>;
  
  /**
   * UC-FOLDER-003: 重命名文件夹
   */
  renameFolder(
    uuid: string,
    newName: string
  ): Promise<void>;
  
  /**
   * UC-FOLDER-004: 移动文件夹
   */
  moveFolder(
    uuid: string,
    newParentUuid: string | null
  ): Promise<void>;
  
  /**
   * UC-FOLDER-005: 删除文件夹
   */
  deleteFolder(uuid: string): Promise<void>;
  
  /**
   * UC-FOLDER-006: 更新排序
   */
  updateFolderOrder(
    uuid: string,
    newOrder: number
  ): Promise<void>;
  
  /**
   * UC-FOLDER-007: 批量更新排序
   */
  batchUpdateFolderOrder(
    updates: Array<{ uuid: string; order: number }>
  ): Promise<void>;
  
  /**
   * 切换展开状态
   */
  toggleExpanded(uuid: string): Promise<void>;
}
```

### DTO 定义

```typescript
// 创建文件夹请求
export interface CreateFolderRequest {
  repositoryUuid: string;
  name: string;
  parentUuid?: string;  // null = 根文件夹
  order?: number;
  metadata?: {
    icon?: string;
    color?: string;
    description?: string;
  };
}

// 文件夹树响应
export interface FolderTreeResponse {
  tree: FolderTreeNode[];
}

// 文件夹树节点
export interface FolderTreeNode {
  folder: FolderServerDTO;
  children: FolderTreeNode[];
  resourceCount: number;  // 该文件夹下的资源数量
}
```

---

## 3️⃣ ResourceApplicationService

### 职责

管理资源的完整生命周期，包括 Markdown 内容编辑、标签管理、移动、版本控制触发等。

### 用例清单

| 用例 ID | 用例名称 | 优先级 | 说明 |
|---------|---------|--------|------|
| UC-RES-001 | 创建资源 | P0 | 创建新的 Markdown/图片/视频等资源 |
| UC-RES-002 | 查询资源列表 | P0 | 分页查询文件夹下的资源 |
| UC-RES-003 | 查询资源详情 | P0 | 获取资源完整内容和元数据 |
| UC-RES-004 | 更新资源内容 | P0 | 更新 Markdown 内容（触发版本创建） |
| UC-RES-005 | 重命名资源 | P1 | 修改资源名称 |
| UC-RES-006 | 移动资源 | P1 | 移动到另一个文件夹 |
| UC-RES-007 | 删除资源 | P1 | 软删除资源（检测断链） |
| UC-RES-008 | 添加/删除标签 | P1 | 管理资源标签 |
| UC-RES-009 | 归档/激活资源 | P2 | 状态管理 |
| UC-RES-010 | 记录访问 | P2 | 更新查看统计 |
| UC-RES-011 | 全文搜索 | P2 | 基于内容搜索资源 |

### TypeScript 接口定义

```typescript
export interface IResourceApplicationService {
  /**
   * UC-RES-001: 创建资源
   */
  createResource(
    request: CreateResourceRequest
  ): Promise<CreateResourceResponse>;
  
  /**
   * UC-RES-002: 查询资源列表（分页）
   */
  findResources(
    request: FindResourcesRequest
  ): Promise<FindResourcesResponse>;
  
  /**
   * UC-RES-003: 查询资源详情
   */
  findResourceByUuid(
    uuid: string
  ): Promise<ResourceDetailResponse>;
  
  /**
   * UC-RES-004: 更新资源内容（触发版本创建）
   */
  updateResourceContent(
    uuid: string,
    request: UpdateResourceContentRequest
  ): Promise<void>;
  
  /**
   * UC-RES-005: 重命名资源
   */
  renameResource(
    uuid: string,
    newName: string
  ): Promise<void>;
  
  /**
   * UC-RES-006: 移动资源
   */
  moveResource(
    uuid: string,
    targetFolderUuid: string | null
  ): Promise<void>;
  
  /**
   * UC-RES-007: 删除资源
   */
  deleteResource(uuid: string): Promise<void>;
  
  /**
   * UC-RES-008: 添加/删除标签
   */
  addTag(uuid: string, tag: string): Promise<void>;
  removeTag(uuid: string, tag: string): Promise<void>;
  
  /**
   * UC-RES-009: 归档/激活
   */
  archiveResource(uuid: string): Promise<void>;
  activateResource(uuid: string): Promise<void>;
  
  /**
   * UC-RES-010: 记录访问
   */
  recordView(uuid: string): Promise<void>;
  
  /**
   * UC-RES-011: 全文搜索
   */
  searchResources(
    request: SearchResourcesRequest
  ): Promise<SearchResourcesResponse>;
}
```

### DTO 定义

```typescript
// 创建资源请求
export interface CreateResourceRequest {
  repositoryUuid: string;
  folderUuid?: string;
  name: string;
  type: ResourceType;  // markdown | image | video | audio | pdf | link | code
  content?: string;    // Markdown 内容
  tags?: string[];
  description?: string;
}

// 查询资源列表请求
export interface FindResourcesRequest {
  repositoryUuid: string;
  folderUuid?: string;  // 筛选文件夹
  type?: ResourceType[];
  status?: ResourceStatus[];
  tags?: string[];      // 标签筛选（OR 逻辑）
  searchKeyword?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'modifiedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
}

// 资源详情响应
export interface ResourceDetailResponse {
  resource: ResourceServerDTO;
  metadata: ResourceMetadataDTO;
  stats: ResourceStatsDTO;
  backlinks: ResourceLinkServerDTO[];  // 反向链接列表
  relatedResources: ResourceServerDTO[];  // 相似内容推荐
}

// 更新资源内容请求
export interface UpdateResourceContentRequest {
  content: string;
  changedBy: string;  // 编辑者 UUID
  changeType: 'major' | 'minor' | 'patch';
  changeDescription?: string;  // Commit Message
}

// 全文搜索请求
export interface SearchResourcesRequest {
  repositoryUuid: string;
  keyword: string;
  type?: ResourceType[];
  tags?: string[];
  folderUuid?: string;
  page?: number;
  pageSize?: number;
}

// 全文搜索响应
export interface SearchResourcesResponse {
  results: Array<{
    resource: ResourceServerDTO;
    highlights: string[];  // 匹配片段（高亮）
    score: number;         // 相关性分数
  }>;
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 4️⃣ ResourceVersionApplicationService

### 职责

管理资源的版本历史，支持 Git 风格的版本控制。

### 用例清单

| 用例 ID | 用例名称 | 优先级 | 说明 |
|---------|---------|--------|------|
| UC-VER-001 | 查询版本列表 | P1 | 获取资源的所有历史版本 |
| UC-VER-002 | 查询版本详情 | P1 | 获取特定版本的完整内容 |
| UC-VER-003 | 对比两个版本 | P1 | 生成 Diff |
| UC-VER-004 | 恢复到历史版本 | P1 | 回滚操作 |
| UC-VER-005 | 删除版本 | P3 | 清理历史版本 |

### TypeScript 接口定义

```typescript
export interface IResourceVersionApplicationService {
  /**
   * UC-VER-001: 查询版本列表
   */
  findVersions(
    resourceUuid: string,
    page?: number,
    pageSize?: number
  ): Promise<FindVersionsResponse>;
  
  /**
   * UC-VER-002: 查询版本详情
   */
  findVersionByUuid(
    versionUuid: string
  ): Promise<ResourceVersionServerDTO>;
  
  /**
   * UC-VER-003: 对比两个版本
   */
  compareVersions(
    versionUuid1: string,
    versionUuid2: string
  ): Promise<VersionDiffResponse>;
  
  /**
   * UC-VER-004: 恢复到历史版本
   */
  restoreVersion(
    versionUuid: string,
    restoredBy: string
  ): Promise<void>;
}
```

### DTO 定义

```typescript
// 版本列表响应
export interface FindVersionsResponse {
  versions: ResourceVersionServerDTO[];
  total: number;
  page: number;
  pageSize: number;
}

// 版本对比响应
export interface VersionDiffResponse {
  version1: ResourceVersionServerDTO;
  version2: ResourceVersionServerDTO;
  diff: {
    added: string[];      // 新增行
    deleted: string[];    // 删除行
    modified: string[];   // 修改行
    htmlDiff: string;     // HTML 格式的 Diff（供前端渲染）
  };
  statistics: {
    addedChars: number;
    deletedChars: number;
    modifiedLines: number;
  };
}
```

---

## 5️⃣ ResourceLinkApplicationService

### 职责

管理资源之间的链接关系，支持 Obsidian 的 `[[]]` 双向链接。

### 用例清单

| 用例 ID | 用例名称 | 优先级 | 说明 |
|---------|---------|--------|------|
| UC-LINK-001 | 解析并创建链接 | P1 | 解析 Markdown 内容中的 `[[]]` |
| UC-LINK-002 | 查询正向链接 | P1 | 获取资源链接到的其他资源 |
| UC-LINK-003 | 查询反向链接 | P1 | 获取链接到当前资源的所有资源 |
| UC-LINK-004 | 检测断链 | P1 | 查找所有断链 |
| UC-LINK-005 | 修复断链 | P2 | 提供修复建议并执行修复 |
| UC-LINK-006 | 删除链接 | P2 | 移除特定链接 |

### TypeScript 接口定义

```typescript
export interface IResourceLinkApplicationService {
  /**
   * UC-LINK-001: 解析并创建链接（内部调用）
   */
  parseAndCreateLinks(
    resourceUuid: string,
    content: string
  ): Promise<void>;
  
  /**
   * UC-LINK-002: 查询正向链接
   */
  findOutgoingLinks(
    resourceUuid: string
  ): Promise<FindLinksResponse>;
  
  /**
   * UC-LINK-003: 查询反向链接（Backlinks）
   */
  findIncomingLinks(
    resourceUuid: string
  ): Promise<FindLinksResponse>;
  
  /**
   * UC-LINK-004: 检测断链
   */
  findBrokenLinks(
    repositoryUuid: string
  ): Promise<FindBrokenLinksResponse>;
  
  /**
   * UC-LINK-005: 修复断链
   */
  repairLink(
    linkUuid: string,
    targetResourceUuid: string
  ): Promise<void>;
  
  /**
   * UC-LINK-006: 删除链接
   */
  deleteLink(linkUuid: string): Promise<void>;
}
```

### DTO 定义

```typescript
// 链接列表响应
export interface FindLinksResponse {
  links: Array<{
    link: ResourceLinkServerDTO;
    sourceResource?: ResourceServerDTO;
    targetResource?: ResourceServerDTO;
  }>;
  total: number;
}

// 断链列表响应
export interface FindBrokenLinksResponse {
  brokenLinks: Array<{
    link: ResourceLinkServerDTO;
    sourceResource: ResourceServerDTO;
    suggestions: ResourceServerDTO[];  // 修复建议（相似名称的资源）
  }>;
  total: number;
}
```

---

## 6️⃣ KnowledgeGraphApplicationService

### 职责

基于资源链接关系构建知识图谱，提供图数据查询和可视化支持。

### 用例清单

| 用例 ID | 用例名称 | 优先级 | 说明 |
|---------|---------|--------|------|
| UC-GRAPH-001 | 生成知识图谱 | P2 | 基于链接关系构建图数据 |
| UC-GRAPH-002 | 查询邻居节点 | P2 | 获取资源的直接相关资源 |
| UC-GRAPH-003 | 路径查询 | P3 | 查找两个资源之间的最短路径 |
| UC-GRAPH-004 | 推荐相似资源 | P3 | 基于内容相似度推荐 |

### TypeScript 接口定义

```typescript
export interface IKnowledgeGraphApplicationService {
  /**
   * UC-GRAPH-001: 生成知识图谱
   */
  generateGraph(
    repositoryUuid: string,
    options?: GraphOptions
  ): Promise<KnowledgeGraphResponse>;
  
  /**
   * UC-GRAPH-002: 查询邻居节点
   */
  findNeighbors(
    resourceUuid: string,
    depth?: number
  ): Promise<NeighborsResponse>;
  
  /**
   * UC-GRAPH-003: 路径查询
   */
  findPath(
    sourceUuid: string,
    targetUuid: string
  ): Promise<PathResponse>;
  
  /**
   * UC-GRAPH-004: 推荐相似资源
   */
  findSimilarResources(
    resourceUuid: string,
    limit?: number
  ): Promise<SimilarResourcesResponse>;
}
```

### DTO 定义

```typescript
// 图谱配置
export interface GraphOptions {
  maxNodes?: number;     // 最大节点数
  maxDepth?: number;     // 最大深度
  includeTypes?: ResourceType[];
  excludeTags?: string[];
}

// 知识图谱响应
export interface KnowledgeGraphResponse {
  nodes: Array<{
    id: string;
    label: string;
    type: ResourceType;
    data: ResourceServerDTO;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: ResourceLinkType;
    data: ResourceLinkServerDTO;
  }>;
  statistics: {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    clusters: number;
  };
}

// 邻居节点响应
export interface NeighborsResponse {
  center: ResourceServerDTO;
  neighbors: Array<{
    resource: ResourceServerDTO;
    distance: number;  // 距离中心节点的跳数
    path: string[];    // UUID 路径
  }>;
}

// 路径响应
export interface PathResponse {
  path: ResourceServerDTO[];
  distance: number;
}

// 相似资源响应
export interface SimilarResourcesResponse {
  similar: Array<{
    resource: ResourceServerDTO;
    similarity: number;  // 0-1 相似度分数
    reason: string;      // 相似原因（如 "共同标签: Vue3, TypeScript"）
  }>;
}
```

---

## 📝 事务边界与错误处理

### 事务边界

| 操作 | 事务范围 | 说明 |
|------|---------|------|
| 创建资源 | 单事务 | Resource + 解析链接 + 创建 ResourceLink |
| 更新资源内容 | 单事务 | Resource + 创建 ResourceVersion + 解析链接 |
| 删除文件夹 | 单事务 | 级联删除 Folder + Resource + ResourceLink |
| 移动资源 | 单事务 | Resource + 更新路径 + 检测循环引用 |

### 错误处理

```typescript
// 自定义业务异常
export class RepositoryNotFoundException extends Error {
  constructor(uuid: string) {
    super(`仓储未找到: ${uuid}`);
    this.name = 'RepositoryNotFoundException';
  }
}

export class FolderCyclicReferenceException extends Error {
  constructor(folderUuid: string, parentUuid: string) {
    super(`检测到循环引用: ${folderUuid} -> ${parentUuid}`);
    this.name = 'FolderCyclicReferenceException';
  }
}

export class ResourceNotFoundException extends Error {
  constructor(uuid: string) {
    super(`资源未找到: ${uuid}`);
    this.name = 'ResourceNotFoundException';
  }
}

export class DuplicateResourceNameException extends Error {
  constructor(name: string, folderUuid: string) {
    super(`文件夹中已存在同名资源: ${name}`);
    this.name = 'DuplicateResourceNameException';
  }
}
```

---

## 📊 总结

### 应用服务统计

| 应用服务 | 用例数量 | 方法数量 | 优先级分布 |
|---------|---------|---------|-----------|
| RepositoryApplicationService | 9 | 9 | P0: 3, P1: 4, P2: 2 |
| FolderApplicationService | 7 | 8 | P0: 2, P1: 3, P2: 2 |
| ResourceApplicationService | 11 | 13 | P0: 4, P1: 5, P2: 2 |
| ResourceVersionApplicationService | 4 | 4 | P1: 4, P3: 1 |
| ResourceLinkApplicationService | 6 | 6 | P1: 4, P2: 2 |
| KnowledgeGraphApplicationService | 4 | 4 | P2: 2, P3: 2 |
| **总计** | **41** | **44** | - |

### 下一步

1. ✅ 数据库架构设计（见 01-DATABASE_SCHEMA_DESIGN.md）
2. ✅ 领域模型设计（见 02-DOMAIN_MODEL_DESIGN.md）
3. ✅ 应用服务接口设计（本文档）
4. ⏭️ RESTful API 设计（见 04-API_ENDPOINT_DESIGN.md）
5. ⏭️ 前端交互设计（见 05-FRONTEND_UX_DESIGN.md）

---

**文档作者**: BA - Business Analyst  
**审核人员**: PM - John  
**最后更新**: 2025-11-09
