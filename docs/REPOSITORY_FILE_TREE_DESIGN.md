# Repository 文件树组件 - 前后端设计方案

**作者**: Winston (Architect) + Amelia (Developer)  
**日期**: 2025-11-11  
**状态**: 设计方案

---

## 🎯 目标

将文件夹（Folder）和资源（Resource）统一在一个树形组件中渲染，实现 Obsidian 风格的文件树体验。

---

## 📊 核心设计原则

### 1. 统一节点类型（TreeNode）

前端需要一个统一的树节点接口，能够同时表示文件夹和文件：

```typescript
// packages/domain-client/src/repository/types/TreeNode.ts
export type TreeNodeType = 'folder' | 'file';

export interface TreeNode {
  uuid: string;
  name: string;
  type: TreeNodeType;
  parentUuid: string | null;
  repositoryUuid: string;
  path: string;  // 完整路径 (e.g., "/docs/project/notes.md")
  
  // 文件夹特有属性
  children?: TreeNode[];
  isExpanded?: boolean;
  
  // 文件特有属性
  extension?: string;  // .md, .pdf, .png
  size?: number;
  updatedAt?: Date;
  
  // YAML frontmatter (仅文件)
  metadata?: {
    title?: string;
    tags?: string[];
    created?: Date;
    updated?: Date;
  };
}
```

### 2. 后端 API 设计

#### 方案 A：单一端点返回完整树（推荐用于小型仓储）

```typescript
// GET /api/repositories/:uuid/tree
// 返回完整的树形结构

{
  "success": true,
  "data": {
    "repositoryUuid": "repo-123",
    "tree": [
      {
        "uuid": "folder-1",
        "name": "docs",
        "type": "folder",
        "parentUuid": null,
        "path": "/docs",
        "children": [
          {
            "uuid": "folder-2",
            "name": "project",
            "type": "folder",
            "parentUuid": "folder-1",
            "path": "/docs/project",
            "children": [
              {
                "uuid": "file-1",
                "name": "README.md",
                "type": "file",
                "parentUuid": "folder-2",
                "path": "/docs/project/README.md",
                "extension": "md",
                "size": 2048,
                "updatedAt": "2025-11-11T10:30:00Z",
                "metadata": {
                  "title": "项目文档",
                  "tags": ["project", "documentation"],
                  "created": "2025-11-01T10:00:00Z",
                  "updated": "2025-11-11T10:30:00Z"
                }
              }
            ]
          },
          {
            "uuid": "file-2",
            "name": "index.md",
            "type": "file",
            "parentUuid": "folder-1",
            "path": "/docs/index.md",
            "extension": "md",
            "size": 1024,
            "updatedAt": "2025-11-10T15:20:00Z"
          }
        ]
      }
    ]
  }
}
```

**优点**：
- 前端一次性获取完整结构
- 无需额外请求
- 适合小型仓储（<1000个节点）

**缺点**：
- 大型仓储首次加载慢
- 数据冗余

---

#### 方案 B：按需加载（推荐用于大型仓储）

```typescript
// GET /api/repositories/:uuid/tree?parentUuid=null
// 返回根级节点

// GET /api/repositories/:uuid/tree?parentUuid=folder-1
// 返回指定文件夹下的子节点

{
  "success": true,
  "data": {
    "parentUuid": "folder-1",
    "nodes": [
      {
        "uuid": "folder-2",
        "name": "project",
        "type": "folder",
        "parentUuid": "folder-1",
        "path": "/docs/project",
        "childCount": 5  // 子节点数量（用于显示badge）
      },
      {
        "uuid": "file-2",
        "name": "index.md",
        "type": "file",
        "parentUuid": "folder-1",
        "path": "/docs/index.md",
        "extension": "md",
        "size": 1024,
        "updatedAt": "2025-11-10T15:20:00Z"
      }
    ]
  }
}
```

**优点**：
- 按需加载，性能优秀
- 适合大型仓储（>1000个节点）

**缺点**：
- 需要管理加载状态
- 实现复杂度高

---

### 3. 后端实现要点

#### Controller 层

```typescript
// apps/api/src/modules/repository/presentation/controllers/RepositoryController.ts

@Get(':uuid/tree')
async getRepositoryTree(
  @Param('uuid') repositoryUuid: string,
  @Query('parentUuid') parentUuid?: string
): Promise<ApiResponse<TreeNode[]>> {
  try {
    // 1. 获取文件夹列表
    const folders = await this.folderService.getFoldersByRepository(
      repositoryUuid,
      parentUuid
    );
    
    // 2. 获取资源列表
    const resources = await this.resourceService.getResourcesByRepository(
      repositoryUuid,
      parentUuid
    );
    
    // 3. 合并为统一的树节点数组
    const nodes: TreeNode[] = [
      ...folders.map(f => this.toTreeNode(f, 'folder')),
      ...resources.map(r => this.toTreeNode(r, 'file'))
    ];
    
    // 4. 排序：文件夹在前，文件在后，同类按名称排序
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    return {
      success: true,
      data: nodes,
      message: 'Repository tree loaded successfully'
    };
  } catch (error) {
    throw new HttpException(
      'Failed to load repository tree',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

private toTreeNode(entity: Folder | Resource, type: TreeNodeType): TreeNode {
  const baseNode = {
    uuid: entity.uuid,
    name: entity.name,
    type,
    parentUuid: entity.parentUuid || null,
    repositoryUuid: entity.repositoryUuid,
    path: entity.path
  };
  
  if (type === 'folder') {
    return {
      ...baseNode,
      children: [],
      isExpanded: false
    };
  } else {
    const resource = entity as Resource;
    return {
      ...baseNode,
      extension: resource.extension,
      size: resource.size,
      updatedAt: resource.updatedAt,
      metadata: resource.metadata  // YAML frontmatter
    };
  }
}
```

#### Service 层

```typescript
// apps/api/src/modules/repository/application/services/FolderService.ts

async getFoldersByRepository(
  repositoryUuid: string,
  parentUuid?: string
): Promise<Folder[]> {
  const whereClause: any = { repositoryUuid };
  
  if (parentUuid === undefined) {
    // 根级文件夹
    whereClause.parentUuid = null;
  } else {
    // 指定父文件夹的子文件夹
    whereClause.parentUuid = parentUuid;
  }
  
  return this.folderRepository.findMany({
    where: whereClause,
    orderBy: { name: 'asc' }
  });
}
```

```typescript
// apps/api/src/modules/repository/application/services/ResourceService.ts

async getResourcesByRepository(
  repositoryUuid: string,
  parentUuid?: string
): Promise<Resource[]> {
  const whereClause: any = { repositoryUuid };
  
  if (parentUuid === undefined) {
    whereClause.folderUuid = null;  // 根级文件
  } else {
    whereClause.folderUuid = parentUuid;
  }
  
  return this.resourceRepository.findMany({
    where: whereClause,
    orderBy: { name: 'asc' }
  });
}
```

---

### 4. 前端实现要点

#### Store 设计

```typescript
// apps/web/src/modules/repository/presentation/stores/fileTreeStore.ts

import { defineStore } from 'pinia';
import type { TreeNode } from '@dailyuse/domain-client';

export const useFileTreeStore = defineStore('fileTree', {
  state: () => ({
    treeNodes: [] as TreeNode[],
    expandedNodes: new Set<string>(),
    selectedNodeUuid: null as string | null,
    loading: false
  }),
  
  actions: {
    async loadTree(repositoryUuid: string, parentUuid?: string) {
      this.loading = true;
      try {
        const nodes = await FileTreeApiClient.getTree(repositoryUuid, parentUuid);
        
        if (!parentUuid) {
          // 根级加载
          this.treeNodes = nodes;
        } else {
          // 子级加载 - 找到父节点并添加children
          this.insertChildren(this.treeNodes, parentUuid, nodes);
        }
      } finally {
        this.loading = false;
      }
    },
    
    toggleNode(uuid: string) {
      if (this.expandedNodes.has(uuid)) {
        this.expandedNodes.delete(uuid);
      } else {
        this.expandedNodes.add(uuid);
      }
    },
    
    selectNode(uuid: string) {
      this.selectedNodeUuid = uuid;
    },
    
    insertChildren(nodes: TreeNode[], parentUuid: string, children: TreeNode[]) {
      for (const node of nodes) {
        if (node.uuid === parentUuid) {
          node.children = children;
          return;
        }
        if (node.children) {
          this.insertChildren(node.children, parentUuid, children);
        }
      }
    }
  }
});
```

#### 组件实现

```vue
<!-- FileTreeView.vue -->
<template>
  <div class="file-tree">
    <v-progress-linear v-if="loading" indeterminate />
    
    <TreeNodeItem
      v-for="node in treeNodes"
      :key="node.uuid"
      :node="node"
      :level="0"
      @toggle="handleToggle"
      @select="handleSelect"
      @context-menu="handleContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useFileTreeStore } from '../stores/fileTreeStore';
import TreeNodeItem from './TreeNodeItem.vue';

const props = defineProps<{
  repositoryUuid: string;
}>();

const fileTreeStore = useFileTreeStore();

onMounted(() => {
  fileTreeStore.loadTree(props.repositoryUuid);
});

async function handleToggle(node: TreeNode) {
  fileTreeStore.toggleNode(node.uuid);
  
  // 按需加载子节点
  if (node.type === 'folder' && !node.children?.length) {
    await fileTreeStore.loadTree(props.repositoryUuid, node.uuid);
  }
}

function handleSelect(node: TreeNode) {
  fileTreeStore.selectNode(node.uuid);
  
  if (node.type === 'file') {
    // 打开文件编辑器
    emit('open-file', node);
  }
}

function handleContextMenu(event: MouseEvent, node: TreeNode) {
  // 显示右键菜单
  emit('context-menu', { event, node });
}
</script>
```

```vue
<!-- TreeNodeItem.vue -->
<template>
  <div class="tree-node-item">
    <div
      class="node-content"
      :class="{ 
        'is-selected': isSelected,
        'is-folder': node.type === 'folder',
        'is-file': node.type === 'file'
      }"
      :style="{ paddingLeft: `${level * 16}px` }"
      @click="handleClick"
      @contextmenu.prevent="handleContextMenu"
    >
      <!-- 展开/折叠图标 -->
      <v-icon
        v-if="node.type === 'folder'"
        :icon="isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
        size="small"
        class="expand-icon"
        @click.stop="handleToggle"
      />
      
      <!-- 文件/文件夹图标 -->
      <v-icon
        :icon="getIcon(node)"
        size="small"
        :color="getIconColor(node)"
        class="node-icon"
      />
      
      <!-- 名称 -->
      <span class="node-name">{{ node.name }}</span>
      
      <!-- 标签数量badge（仅文件） -->
      <v-chip
        v-if="node.type === 'file' && node.metadata?.tags?.length"
        size="x-small"
        variant="text"
        class="ml-auto"
      >
        {{ node.metadata.tags.length }}
      </v-chip>
    </div>
    
    <!-- 子节点（递归渲染） -->
    <div v-if="isExpanded && node.children" class="children">
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.uuid"
        :node="child"
        :level="level + 1"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
        @context-menu="$emit('context-menu', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TreeNode } from '@dailyuse/domain-client';

const props = defineProps<{
  node: TreeNode;
  level: number;
}>();

const emit = defineEmits<{
  toggle: [node: TreeNode];
  select: [node: TreeNode];
  contextMenu: [event: MouseEvent, node: TreeNode];
}>();

const isExpanded = computed(() => props.node.isExpanded);
const isSelected = computed(() => {
  // 从store获取选中状态
  return false; // TODO: 实现
});

function getIcon(node: TreeNode): string {
  if (node.type === 'folder') {
    return isExpanded.value ? 'mdi-folder-open' : 'mdi-folder';
  }
  
  // 根据扩展名返回不同图标
  const iconMap: Record<string, string> = {
    md: 'mdi-language-markdown',
    pdf: 'mdi-file-pdf-box',
    png: 'mdi-file-image',
    jpg: 'mdi-file-image',
    mp4: 'mdi-file-video',
    txt: 'mdi-file-document-outline'
  };
  
  return iconMap[node.extension || ''] || 'mdi-file-outline';
}

function getIconColor(node: TreeNode): string {
  if (node.type === 'folder') return 'primary';
  if (node.extension === 'md') return 'accent';
  return 'grey';
}

function handleToggle() {
  emit('toggle', props.node);
}

function handleClick() {
  emit('select', props.node);
}

function handleContextMenu(event: MouseEvent) {
  emit('context-menu', event, props.node);
}
</script>

<style scoped>
.tree-node-item {
  user-select: none;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.node-content:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
}

.node-content.is-selected {
  background-color: rgba(var(--v-theme-primary), 0.12);
}

.expand-icon {
  flex-shrink: 0;
  cursor: pointer;
}

.node-icon {
  flex-shrink: 0;
}

.node-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.children {
  margin-left: 0;
}
</style>
```

---

## 🎯 推荐方案

**Winston推荐：方案 A（单一端点完整树）**

**理由**：
1. 当前仓储规模较小（<100个文件）
2. 实现简单，前端状态管理容易
3. 用户体验流畅（无加载等待）
4. 后续可以升级到方案B（无需大改）

---

## 📋 实施步骤

1. **后端** (Amelia)：
   - [ ] 创建 TreeNode DTO
   - [ ] 实现 `GET /api/repositories/:uuid/tree` 端点
   - [ ] 更新 FolderService 和 ResourceService
   - [ ] 添加单元测试

2. **前端** (Amelia + Sally)：
   - [ ] 创建 TreeNode 类型定义
   - [ ] 实现 FileTreeStore
   - [ ] 创建 TreeNodeItem 组件
   - [ ] 替换 FileExplorer 中的旧实现
   - [ ] 样式优化（Obsidian风格）

3. **测试** (Murat)：
   - [ ] 大量文件测试（性能）
   - [ ] 嵌套层级测试（深度10+）
   - [ ] 展开/折叠交互测试
   - [ ] 右键菜单测试

---

## 🚀 性能优化建议

1. **虚拟滚动**：超过100个节点时启用虚拟列表
2. **懒加载图标**：异步加载文件预览缩略图
3. **缓存策略**：缓存已加载的树结构
4. **批量操作**：多选文件进行批量操作

---

**文档结束**
