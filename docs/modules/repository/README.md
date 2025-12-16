---
tags:
  - module
  - repository
  - knowledge
  - resources
description: 知识库模块 - 资源管理和知识组织系统
created: 2025-12-16T10:00:00
updated: 2025-12-16T10:00:00
---

# 📚 Repository Module - 知识库模块

> 类 Obsidian 的知识管理系统，支持资源组织、双向链接和智能浏览

## 📋 目录

- [模块概述](#模块概述)
- [核心功能](#核心功能)
- [架构设计](#架构设计)
- [数据模型](#数据模型)
- [API 参考](#api-参考)
- [使用示例](#使用示例)

---

## 🎯 模块概述

### 功能简介

Repository 模块是 DailyUse 的知识管理中心：

- 📁 **资源管理**: 创建和组织各类知识资源
- 🗂 **文件夹系统**: 层级结构、批量操作
- 🔗 **双向链接**: Obsidian 风格的知识关联
- 🏷 **标签系统**: 多维度分类和快速筛选
- 📊 **分类管理**: 预设类别，灵活扩展
- 🔍 **智能搜索**: 全文搜索和高级筛选

### 技术特性

- **无限层级**: 树状文件夹结构
- **软删除**: 回收站功能
- **排序自定义**: 拖拽排序、自定义顺序
- **批量操作**: 批量移动、删除、标签
- **版本历史**: 资源变更追溯 (计划中)

---

## 💡 核心功能

### 1. 资源 (Resource)

支持多种资源类型：

| 类型 | 说明 | 用途 |
|------|------|------|
| `NOTE` | 笔记 | Markdown 格式知识记录 |
| `LINK` | 链接 | 外部资源收藏 |
| `FILE` | 文件 | 附件管理 |
| `SNIPPET` | 代码片段 | 代码收藏 |
| `IMAGE` | 图片 | 图库管理 |

```typescript
// 创建资源
POST /api/v1/resources
{
  "title": "TypeScript 泛型详解",
  "type": "NOTE",
  "content": "# TypeScript 泛型\n\n泛型是...",
  "folderUuid": "xxx",
  "categoryUuid": "yyy",
  "tags": ["typescript", "programming"]
}
```

### 2. 文件夹 (Folder)

层级结构组织资源：

```typescript
// 创建文件夹
POST /api/v1/folders
{
  "name": "前端学习",
  "parentUuid": null,  // 根文件夹
  "description": "前端技术相关资料"
}

// 文件夹结构
Root
├── 前端学习/
│   ├── TypeScript/
│   ├── Vue/
│   └── React/
├── 后端学习/
└── 项目笔记/
```

### 3. 分类 (Category)

资源预设分类：

```typescript
// 默认分类
- 📖 学习资料
- 💼 工作文档  
- 💡 灵感记录
- 🔧 技术笔记
- 📌 收藏资源

// 自定义分类
POST /api/v1/categories
{
  "name": "阅读笔记",
  "icon": "📚",
  "color": "#4CAF50"
}
```

### 4. 标签 (Tags)

多维度标记：

```typescript
// 添加标签
PUT /api/v1/resources/:uuid/tags
{
  "tags": ["重要", "待复习", "typescript"]
}

// 按标签筛选
GET /api/v1/resources?tags=typescript,重要
```

---

## 🏗 架构设计

### 分层结构

```
apps/api/src/modules/repository/
├── application/              # 应用服务层
│   └── services/
│       ├── ResourceApplicationService.ts
│       ├── FolderApplicationService.ts
│       └── CategoryApplicationService.ts
├── domain/                   # 领域层
│   ├── entities/
│   │   ├── Resource.ts
│   │   ├── Folder.ts
│   │   └── Category.ts
│   ├── services/
│   │   └── ResourceDomainService.ts
│   └── repositories/
│       ├── IResourceRepository.ts
│       └── IFolderRepository.ts
├── infrastructure/           # 基础设施层
│   └── repositories/
│       ├── PrismaResourceRepository.ts
│       └── PrismaFolderRepository.ts
└── interface/               # 接口层
    └── http/
        ├── resourceRoutes.ts
        ├── folderRoutes.ts
        └── controllers/
```

### Web 端结构

```
apps/web/src/modules/repository/
├── domain/
│   └── models/
│       └── Resource.ts
├── application/
│   ├── ports/
│   │   └── IRepositoryApi.ts
│   └── usecases/
│       ├── GetResourcesUseCase.ts
│       └── SaveResourceUseCase.ts
├── infrastructure/
│   └── api/
│       └── RepositoryApiAdapter.ts
└── presentation/
    ├── composables/
    │   ├── useResources.ts
    │   └── useFolders.ts
    ├── views/
    │   └── RepositoryView.vue
    └── components/
        ├── ResourceList.vue
        ├── FolderTree.vue
        └── ResourceEditor.vue
```

---

## 📊 数据模型

### Prisma Schema

```prisma
model resource {
  uuid          String      @id
  accountUuid   String
  title         String
  type          String      // NOTE, LINK, FILE, SNIPPET, IMAGE
  content       String?     @db.Text
  url           String?
  metadata      String?     // JSON - 扩展字段
  folderUuid    String?
  categoryUuid  String?
  tags          String?     // JSON array
  status        String      @default("ACTIVE")
  sortOrder     Int         @default(0)
  
  folder        folder?     @relation(...)
  category      category?   @relation(...)
  
  createdAt     DateTime
  updatedAt     DateTime
  deletedAt     DateTime?
  
  @@index([accountUuid, status])
  @@index([folderUuid])
  @@index([categoryUuid])
}

model folder {
  uuid          String      @id
  accountUuid   String
  name          String
  description   String?
  parentUuid    String?
  path          String      // /parent/child 完整路径
  depth         Int         @default(0)
  sortOrder     Int         @default(0)
  status        String      @default("ACTIVE")
  
  parent        folder?     @relation("FolderHierarchy", ...)
  children      folder[]    @relation("FolderHierarchy")
  resources     resource[]
  
  @@unique([accountUuid, path])
}

model category {
  uuid          String      @id
  accountUuid   String
  name          String
  icon          String?
  color         String?
  description   String?
  sortOrder     Int         @default(0)
  isDefault     Boolean     @default(false)
  
  resources     resource[]
  
  @@unique([accountUuid, name])
}
```

---

## 📚 API 参考

### 资源接口

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/resources` | 获取资源列表 |
| `POST` | `/resources` | 创建资源 |
| `GET` | `/resources/:uuid` | 获取资源详情 |
| `PUT` | `/resources/:uuid` | 更新资源 |
| `DELETE` | `/resources/:uuid` | 删除资源 |
| `PUT` | `/resources/:uuid/move` | 移动资源 |
| `PUT` | `/resources/:uuid/tags` | 更新标签 |
| `POST` | `/resources/batch/delete` | 批量删除 |
| `POST` | `/resources/batch/move` | 批量移动 |

### 文件夹接口

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/folders` | 获取文件夹树 |
| `POST` | `/folders` | 创建文件夹 |
| `GET` | `/folders/:uuid` | 获取文件夹详情 |
| `PUT` | `/folders/:uuid` | 更新文件夹 |
| `DELETE` | `/folders/:uuid` | 删除文件夹 |
| `PUT` | `/folders/:uuid/move` | 移动文件夹 |
| `GET` | `/folders/:uuid/resources` | 获取文件夹下资源 |

### 分类接口

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/categories` | 获取分类列表 |
| `POST` | `/categories` | 创建分类 |
| `PUT` | `/categories/:uuid` | 更新分类 |
| `DELETE` | `/categories/:uuid` | 删除分类 |

### 查询参数

```typescript
GET /api/v1/resources?
  folderUuid=xxx&           // 按文件夹筛选
  categoryUuid=yyy&         // 按分类筛选
  type=NOTE&                // 按类型筛选
  tags=tag1,tag2&           // 按标签筛选
  search=keyword&           // 全文搜索
  status=ACTIVE&            // 状态筛选
  sortBy=updatedAt&         // 排序字段
  sortOrder=desc&           // 排序方向
  page=1&                   // 分页
  pageSize=20               // 每页数量
```

---

## 💻 使用示例

### Web 端使用

```vue
<template>
  <div class="repository-layout">
    <!-- 侧边栏 - 文件夹树 -->
    <FolderTree 
      :folders="folders"
      :selected="currentFolder"
      @select="handleFolderSelect"
    />
    
    <!-- 主内容 - 资源列表 -->
    <ResourceList 
      :resources="resources"
      :loading="isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />
    
    <!-- 编辑器 -->
    <ResourceEditor 
      v-if="editingResource"
      :resource="editingResource"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { useResources } from '@/modules/repository/presentation/composables/useResources';
import { useFolders } from '@/modules/repository/presentation/composables/useFolders';

const { resources, isLoading, fetchResources } = useResources();
const { folders, currentFolder } = useFolders();

const handleFolderSelect = async (folderUuid) => {
  await fetchResources({ folderUuid });
};
</script>
```

### Composable 实现

```typescript
// useResources.ts
export function useResources() {
  const resources = ref<Resource[]>([]);
  const isLoading = ref(false);
  
  const fetchResources = async (params: ResourceQuery) => {
    isLoading.value = true;
    try {
      const result = await repositoryApi.getResources(params);
      resources.value = result.data;
    } finally {
      isLoading.value = false;
    }
  };
  
  const createResource = async (data: CreateResourceDTO) => {
    const resource = await repositoryApi.createResource(data);
    resources.value.unshift(resource);
    return resource;
  };
  
  return {
    resources: readonly(resources),
    isLoading: readonly(isLoading),
    fetchResources,
    createResource,
  };
}
```

---

## 🎨 UI 组件

### FolderTree

```vue
<!-- 树状文件夹选择器 -->
<FolderTree
  :folders="folders"
  :selected="selectedUuid"
  :expandedKeys="expandedKeys"
  @select="onSelect"
  @expand="onExpand"
  @create="onCreate"
  @rename="onRename"
  @delete="onDelete"
/>
```

### ResourceCard

```vue
<!-- 资源卡片 -->
<ResourceCard
  :resource="resource"
  :showCategory="true"
  :showTags="true"
  @click="onOpen"
  @edit="onEdit"
  @delete="onDelete"
/>
```

---

## 🔗 相关文档

- [系统架构概览](../../architecture/system-overview.md)
- [Web 架构文档](../../architecture/web-architecture.md)
- [数据模型文档](../../data-models.md)
- [目标模块](../goal/README.md)

---

*文档由 BMAD Analyst Agent 生成*
