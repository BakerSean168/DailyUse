# Repository 文件树组件实现指南

**目标**: 实现Obsidian风格的文件树，将文件夹和文件统一展示在一棵树中

## 📋 核心需求

### 当前问题
1. ✅ 文件夹和文件分离展示（FileExplorer + ResourceList）
2. ❌ 无法在文件夹下直接看到文件
3. ❌ 无法拖拽移动文件到文件夹
4. ❌ 不符合Obsidian的统一树形交互

### 目标状态
```
📁 Repository Root
  📁 Folder A
    📝 Note 1.md
    📝 Note 2.md
    📁 Subfolder A1
      📝 Note 3.md
  📁 Folder B
    📝 Note 4.md
  📝 Root Note.md
```

---

## 🏗️ 后端API设计

### 1. 数据结构设计

#### 统一树节点类型
```typescript
// apps/api/src/modules/repository/application/dto/FileTreeNodeDTO.ts

export interface FileTreeNodeDTO {
  uuid: string;
  type: 'folder' | 'resource';
  name: string;
  path: string;
  
  // 文件夹特有
  children?: FileTreeNodeDTO[];
  isExpanded?: boolean;
  
  // 资源特有
  resourceType?: 'MARKDOWN' | 'IMAGE' | 'VIDEO' | 'PDF' | 'LINK' | 'CODE' | 'OTHER';
  size?: number;
  wordCount?: number;
  
  // 通用元数据
  createdAt: string;
  updatedAt: string;
  order?: number;
  
  // 父级信息
  parentUuid?: string | null;
  parentPath?: string;
}
```

### 2. API端点设计

#### 获取完整文件树
```typescript
GET /api/v1/repositories/:repositoryUuid/file-tree
```

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "uuid": "folder-1",
      "type": "folder",
      "name": "Projects",
      "path": "/Projects",
      "children": [
        {
          "uuid": "folder-2",
          "type": "folder",
          "name": "Project A",
          "path": "/Projects/Project A",
          "children": [
            {
              "uuid": "resource-1",
              "type": "resource",
              "name": "README.md",
              "path": "/Projects/Project A/README.md",
              "resourceType": "MARKDOWN",
              "wordCount": 350,
              "parentUuid": "folder-2",
              "createdAt": "2025-11-11T10:00:00Z",
              "updatedAt": "2025-11-11T15:30:00Z"
            }
          ],
          "parentUuid": "folder-1",
          "createdAt": "2025-11-10T10:00:00Z",
          "updatedAt": "2025-11-10T10:00:00Z"
        }
      ],
      "createdAt": "2025-11-09T10:00:00Z",
      "updatedAt": "2025-11-09T10:00:00Z"
    },
    {
      "uuid": "resource-2",
      "type": "resource",
      "name": "Quick Notes.md",
      "path": "/Quick Notes.md",
      "resourceType": "MARKDOWN",
      "wordCount": 120,
      "parentUuid": null,
      "createdAt": "2025-11-11T08:00:00Z",
      "updatedAt": "2025-11-11T14:00:00Z"
    }
  ],
  "message": "File tree retrieved successfully"
}
```

### 3. 后端服务实现

#### FileTreeService
```typescript
// apps/api/src/modules/repository/application/services/FileTreeService.ts

export class FileTreeService {
  constructor(
    private folderRepository: IFolderRepository,
    private resourceRepository: IResourceRepository
  ) {}
  
  /**
   * 获取完整文件树（文件夹 + 资源）
   */
  async getFileTree(repositoryUuid: string): Promise<FileTreeNodeDTO[]> {
    // 1. 查询所有文件夹
    const folders = await this.folderRepository.findByRepositoryUuid(repositoryUuid);
    
    // 2. 查询所有资源
    const resources = await this.resourceRepository.findByRepositoryUuid(repositoryUuid);
    
    // 3. 构建统一树形结构
    return this.buildUnifiedTree(folders, resources);
  }
  
  /**
   * 构建统一树形结构
   */
  private buildUnifiedTree(
    folders: Folder[],
    resources: Resource[]
  ): FileTreeNodeDTO[] {
    // 创建节点映射
    const nodeMap = new Map<string, FileTreeNodeDTO>();
    
    // 1. 先处理文件夹
    folders.forEach(folder => {
      nodeMap.set(folder.uuid, {
        uuid: folder.uuid,
        type: 'folder',
        name: folder.name,
        path: folder.path,
        children: [],
        parentUuid: folder.parentUuid,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        order: folder.order
      });
    });
    
    // 2. 再处理资源
    resources.forEach(resource => {
      const node: FileTreeNodeDTO = {
        uuid: resource.uuid,
        type: 'resource',
        name: resource.name,
        path: resource.path,
        resourceType: resource.type,
        size: resource.size,
        wordCount: resource.metadata?.wordCount,
        parentUuid: resource.folderUuid,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
        order: resource.order
      };
      
      // 如果资源属于某个文件夹，添加到children
      if (resource.folderUuid && nodeMap.has(resource.folderUuid)) {
        nodeMap.get(resource.folderUuid)!.children!.push(node);
      } else {
        // 根级资源
        nodeMap.set(resource.uuid, node);
      }
    });
    
    // 3. 构建树形结构
    const roots: FileTreeNodeDTO[] = [];
    
    nodeMap.forEach(node => {
      if (!node.parentUuid) {
        // 根节点
        roots.push(node);
      } else if (nodeMap.has(node.parentUuid)) {
        // 添加到父节点
        const parent = nodeMap.get(node.parentUuid)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    });
    
    // 4. 按order排序
    this.sortTree(roots);
    
    return roots;
  }
  
  /**
   * 递归排序树节点
   */
  private sortTree(nodes: FileTreeNodeDTO[]): void {
    // 文件夹优先，然后按order排序
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return (a.order || 0) - (b.order || 0);
    });
    
    nodes.forEach(node => {
      if (node.children) {
        this.sortTree(node.children);
      }
    });
  }
}
```

#### FileTreeController
```typescript
// apps/api/src/modules/repository/interface/http/controllers/FileTreeController.ts

export class FileTreeController {
  private static responseBuilder = createResponseBuilder();
  
  static async getFileTree(req: Request, res: Response): Promise<Response> {
    try {
      const { repositoryUuid } = req.params;
      const service = FileTreeService.getInstance();
      
      const tree = await service.getFileTree(repositoryUuid);
      
      return FileTreeController.responseBuilder.sendSuccess(
        res,
        tree,
        'File tree retrieved successfully'
      );
    } catch (error) {
      logger.error('Error getting file tree', { error });
      return FileTreeController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: error.message
      });
    }
  }
}
```

---

## 🎨 前端实现

### 1. 类型定义
```typescript
// apps/web/src/modules/repository/types/FileTreeNode.ts

export interface FileTreeNode {
  uuid: string;
  type: 'folder' | 'resource';
  name: string;
  path: string;
  
  // Vuetify Treeview需要的字段
  id: string;
  title: string;
  children?: FileTreeNode[];
  
  // 原始数据
  raw: FileTreeNodeDTO;
  
  // UI状态
  isExpanded?: boolean;
  isSelected?: boolean;
}
```

### 2. API Client
```typescript
// apps/web/src/modules/repository/api/FileTreeApiClient.ts

export class FileTreeApiClient {
  /**
   * 获取文件树
   */
  static async getFileTree(repositoryUuid: string): Promise<FileTreeNodeDTO[]> {
    return await apiClient.get(`/repositories/${repositoryUuid}/file-tree`);
  }
}
```

### 3. Store管理
```typescript
// apps/web/src/modules/repository/presentation/stores/fileTreeStore.ts

export const useFileTreeStore = defineStore('fileTree', {
  state: () => ({
    treeData: [] as FileTreeNodeDTO[],
    expandedNodes: [] as string[],
    selectedNode: null as FileTreeNodeDTO | null,
    isLoading: false,
    error: null as string | null,
  }),
  
  actions: {
    async loadFileTree(repositoryUuid: string) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const data = await FileTreeApiClient.getFileTree(repositoryUuid);
        this.treeData = data;
      } catch (error: any) {
        this.error = error.message;
        console.error('Failed to load file tree:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    selectNode(node: FileTreeNodeDTO | null) {
      this.selectedNode = node;
    },
    
    toggleExpand(nodeUuid: string) {
      const index = this.expandedNodes.indexOf(nodeUuid);
      if (index > -1) {
        this.expandedNodes.splice(index, 1);
      } else {
        this.expandedNodes.push(nodeUuid);
      }
    }
  }
});
```

### 4. 组件实现
```vue
<!-- apps/web/src/modules/repository/presentation/components/UnifiedFileTree.vue -->

<template>
  <div class="unified-file-tree">
    <!-- 工具栏 -->
    <div class="tree-toolbar">
      <v-btn
        icon="mdi-note-plus-outline"
        size="small"
        variant="text"
        title="新建笔记"
        @click="$emit('create-resource')"
      />
      <v-btn
        icon="mdi-folder-plus-outline"
        size="small"
        variant="text"
        title="新建文件夹"
        @click="$emit('create-folder')"
      />
      <v-spacer />
      <v-btn
        icon="mdi-refresh"
        size="small"
        variant="text"
        title="刷新"
        @click="refresh"
      />
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>
    
    <!-- 树形视图 -->
    <div v-else class="tree-container">
      <v-treeview
        v-model:opened="expandedNodes"
        v-model:selected="selectedNodes"
        :items="treeItems"
        item-value="id"
        item-title="title"
        activatable
        open-on-click
        density="compact"
        class="file-tree"
      >
        <!-- 节点图标 -->
        <template #prepend="{ item }">
          <v-icon :icon="getNodeIcon(item)" size="small" :color="getNodeColor(item)" />
        </template>
        
        <!-- 右键菜单 -->
        <template #append="{ item }">
          <v-menu location="end">
            <template #activator="{ props: menuProps }">
              <v-btn
                icon="mdi-dots-vertical"
                size="x-small"
                variant="text"
                v-bind="menuProps"
                @click.stop
              />
            </template>
            
            <v-list density="compact">
              <!-- 文件夹菜单 -->
              <template v-if="item.raw.type === 'folder'">
                <v-list-item @click="handleCreateResourceInFolder(item.raw)">
                  <template #prepend>
                    <v-icon icon="mdi-note-plus-outline" size="small" />
                  </template>
                  <v-list-item-title>新建笔记</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="handleCreateSubfolder(item.raw)">
                  <template #prepend>
                    <v-icon icon="mdi-folder-plus-outline" size="small" />
                  </template>
                  <v-list-item-title>新建子文件夹</v-list-item-title>
                </v-list-item>
                
                <v-divider />
                
                <v-list-item @click="handleRename(item.raw)">
                  <template #prepend>
                    <v-icon icon="mdi-pencil-outline" size="small" />
                  </template>
                  <v-list-item-title>重命名</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="handleDelete(item.raw)" class="text-error">
                  <template #prepend>
                    <v-icon icon="mdi-delete-outline" size="small" color="error" />
                  </template>
                  <v-list-item-title>删除</v-list-item-title>
                </v-list-item>
              </template>
              
              <!-- 资源菜单 -->
              <template v-else>
                <v-list-item @click="handleOpenInNewTab(item.raw)">
                  <template #prepend>
                    <v-icon icon="mdi-open-in-new" size="small" />
                  </template>
                  <v-list-item-title>在新标签页打开</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="handleRename(item.raw)">
                  <template #prepend>
                    <v-icon icon="mdi-pencil-outline" size="small" />
                  </template>
                  <v-list-item-title>重命名</v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="handleMove(item.raw)">
                  <template #prepend>
                    <v-icon icon="mdi-folder-move" size="small" />
                  </template>
                  <v-list-item-title>移动</v-list-item-title>
                </v-list-item>
                
                <v-divider />
                
                <v-list-item @click="handleDelete(item.raw)" class="text-error">
                  <template #prepend>
                    <v-icon icon="mdi-delete-outline" size="small" color="error" />
                  </template>
                  <v-list-item-title>删除</v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
          </v-menu>
        </template>
      </v-treeview>
      
      <!-- 空状态 -->
      <div v-if="treeItems.length === 0" class="empty-state">
        <v-icon icon="mdi-folder-off-outline" size="48" class="mb-2 text-disabled" />
        <p class="text-disabled">暂无文件或文件夹</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useFileTreeStore } from '../stores/fileTreeStore';
import { useResourceStore } from '../stores/resourceStore';
import type { FileTreeNodeDTO } from '@dailyuse/contracts';

// Props
interface Props {
  repositoryUuid: string | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'create-folder', parentUuid?: string): void;
  (e: 'create-resource', parentFolderUuid?: string): void;
  (e: 'rename', node: FileTreeNodeDTO): void;
  (e: 'delete', node: FileTreeNodeDTO): void;
  (e: 'move', node: FileTreeNodeDTO): void;
}>();

// Stores
const fileTreeStore = useFileTreeStore();
const resourceStore = useResourceStore();

// Computed
const isLoading = computed(() => fileTreeStore.isLoading);
const expandedNodes = computed({
  get: () => fileTreeStore.expandedNodes,
  set: (value) => { fileTreeStore.expandedNodes = value; }
});
const selectedNodes = ref<string[]>([]);

// 转换为Vuetify Treeview格式
const treeItems = computed(() => {
  return convertToTreeItems(fileTreeStore.treeData);
});

// Methods
function convertToTreeItems(nodes: FileTreeNodeDTO[]): any[] {
  return nodes.map(node => ({
    id: node.uuid,
    title: node.name,
    children: node.children ? convertToTreeItems(node.children) : undefined,
    raw: node
  }));
}

function getNodeIcon(item: any): string {
  const node = item.raw as FileTreeNodeDTO;
  
  if (node.type === 'folder') {
    return expandedNodes.value.includes(node.uuid)
      ? 'mdi-folder-open-outline'
      : 'mdi-folder-outline';
  }
  
  // 资源图标映射
  const iconMap: Record<string, string> = {
    MARKDOWN: 'mdi-language-markdown',
    IMAGE: 'mdi-image',
    VIDEO: 'mdi-video',
    PDF: 'mdi-file-pdf-box',
    LINK: 'mdi-link',
    CODE: 'mdi-code-braces',
    OTHER: 'mdi-file'
  };
  
  return iconMap[node.resourceType || 'OTHER'] || 'mdi-file';
}

function getNodeColor(item: any): string | undefined {
  const node = item.raw as FileTreeNodeDTO;
  return node.type === 'folder' ? 'primary' : undefined;
}

async function refresh() {
  if (props.repositoryUuid) {
    await fileTreeStore.loadFileTree(props.repositoryUuid);
  }
}

function handleCreateResourceInFolder(folder: FileTreeNodeDTO) {
  emit('create-resource', folder.uuid);
}

function handleCreateSubfolder(folder: FileTreeNodeDTO) {
  emit('create-folder', folder.uuid);
}

function handleRename(node: FileTreeNodeDTO) {
  emit('rename', node);
}

function handleDelete(node: FileTreeNodeDTO) {
  emit('delete', node);
}

function handleMove(node: FileTreeNodeDTO) {
  emit('move', node);
}

async function handleOpenInNewTab(resource: FileTreeNodeDTO) {
  await resourceStore.openInTab(resource as any);
}

// Watchers
watch(() => props.repositoryUuid, async (newValue) => {
  if (newValue) {
    await refresh();
  }
}, { immediate: true });

watch(selectedNodes, (newValue) => {
  if (newValue.length > 0) {
    const nodeId = newValue[0];
    const node = findNodeById(fileTreeStore.treeData, nodeId);
    if (node) {
      fileTreeStore.selectNode(node);
      
      // 如果是资源，打开编辑器
      if (node.type === 'resource') {
        resourceStore.openInTab(node as any);
      }
    }
  }
});

function findNodeById(nodes: FileTreeNodeDTO[], id: string): FileTreeNodeDTO | null {
  for (const node of nodes) {
    if (node.uuid === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Expose
defineExpose({
  refresh
});
</script>

<style scoped>
.unified-file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.file-tree {
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
}

.text-disabled {
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.text-error {
  color: rgb(var(--v-theme-error));
}
</style>
```

---

## 🎯 实施步骤

### Phase 1: 后端API实现
1. ✅ 创建 `FileTreeNodeDTO` 类型
2. ✅ 实现 `FileTreeService.getFileTree()`
3. ✅ 实现 `FileTreeController.getFileTree()`
4. ✅ 注册路由 `/api/v1/repositories/:repositoryUuid/file-tree`
5. ✅ 测试API响应格式

### Phase 2: 前端实现
1. ✅ 创建 `FileTreeApiClient`
2. ✅ 创建 `fileTreeStore`
3. ✅ 实现 `UnifiedFileTree.vue` 组件
4. ✅ 替换 `FilesPanel` 中的 `FileExplorer` + `ResourceList`

### Phase 3: 交互优化
1. ⏳ 支持拖拽移动文件/文件夹
2. ⏳ 支持键盘导航（上下箭头、Enter打开）
3. ⏳ 支持多选（Ctrl/Cmd + Click）
4. ⏳ 添加过渡动画

### Phase 4: 性能优化
1. ⏳ 虚拟滚动（大量节点时）
2. ⏳ 懒加载子节点（深层次结构）
3. ⏳ 缓存展开状态到localStorage

---

## 📊 数据流示意图

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │       UnifiedFileTree.vue                     │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  v-treeview                            │  │  │
│  │  │  ├─ 📁 Folder A                       │  │  │
│  │  │  │  ├─ 📝 Note 1.md                   │  │  │
│  │  │  │  └─ 📝 Note 2.md                   │  │  │
│  │  │  ├─ 📁 Folder B                       │  │  │
│  │  │  └─ 📝 Root Note.md                   │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                      ▲                               │
│                      │                               │
│           ┌──────────┴──────────┐                   │
│           │  fileTreeStore      │                   │
│           │  ├─ treeData       │                   │
│           │  ├─ expandedNodes  │                   │
│           │  └─ selectedNode   │                   │
│           └──────────┬──────────┘                   │
│                      │                               │
│           ┌──────────┴──────────┐                   │
│           │ FileTreeApiClient   │                   │
│           └──────────┬──────────┘                   │
└───────────────────────┼──────────────────────────────┘
                        │ HTTP GET /api/v1/repositories/:uuid/file-tree
                        ▼
┌─────────────────────────────────────────────────────┐
│                    Backend                           │
│                                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │       FileTreeController                      │  │
│  └──────────────────┬───────────────────────────┘  │
│                     │                                │
│  ┌──────────────────┴───────────────────────────┐  │
│  │       FileTreeService                         │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  getFileTree()                         │  │  │
│  │  │  ├─ 查询 Folders                       │  │  │
│  │  │  ├─ 查询 Resources                     │  │  │
│  │  │  └─ buildUnifiedTree()                 │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────┬───────────────────────────┘  │
│                     │                                │
│         ┌───────────┴──────────┐                    │
│         │                      │                     │
│  ┌──────┴──────┐      ┌───────┴────────┐           │
│  │FolderRepo   │      │ ResourceRepo   │           │
│  └─────────────┘      └────────────────┘           │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 关键要点总结

### 后端关键点
1. **统一节点类型**: 使用 `FileTreeNodeDTO` 统一表示文件夹和文件
2. **递归构建树**: 先创建所有节点，再根据 `parentUuid` 建立父子关系
3. **排序规则**: 文件夹优先，同类型按 `order` 字段排序
4. **性能考虑**: 一次查询返回完整树，避免N+1问题

### 前端关键点
1. **数据转换**: 后端DTO → 前端TreeNode → Vuetify Treeview格式
2. **状态管理**: Store统一管理树数据、展开状态、选中状态
3. **懒加载**: 可选的增量加载策略（深层次树）
4. **拖拽支持**: 使用 `draggable` 属性启用拖拽排序

### 交互细节
1. **单击**: 选中节点（文件夹展开/收起，文件预览）
2. **双击**: 文件夹展开/收起，文件在新标签打开
3. **右键**: 显示上下文菜单
4. **拖拽**: 移动文件/文件夹到新位置

---

## 📝 下一步行动

1. **创建后端实现**:
   - FileTreeNodeDTO
   - FileTreeService
   - FileTreeController
   - 路由注册

2. **创建前端实现**:
   - FileTreeApiClient
   - fileTreeStore
   - UnifiedFileTree.vue

3. **集成到RepositoryView**:
   - 替换现有的 FilesPanel
   - 更新事件处理逻辑

4. **测试验证**:
   - 功能测试
   - 性能测试
   - 边界情况测试
