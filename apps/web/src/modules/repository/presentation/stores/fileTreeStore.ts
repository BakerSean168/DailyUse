/**
 * File Tree Store
 * Story 11.1: 统一文件树状态管理
 * 合并 folders 和 resources 为统一的树形结构
 */

import { defineStore } from 'pinia';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';

/**
 * 文件树 Store
 */
export const useFileTreeStore = defineStore('fileTree', {
  state: () => ({
    // ===== 核心数据 =====
    treeNodesByRepository: {} as Record<string, RepositoryContracts.TreeNode[]>, // 按仓储UUID索引的树节点
    
    // ===== 状态管理 =====
    isLoading: false,
    error: null as string | null,
    
    // ===== UI 状态 =====
    selectedNodeUuid: null as string | null, // 当前选中的节点
    expandedNodes: new Set<string>(), // 已展开的文件夹节点UUID
  }),

  getters: {
    /**
     * 获取指定仓储的文件树
     */
    getTreeByRepository: (state) => (repositoryUuid: string): RepositoryContracts.TreeNode[] => {
      return state.treeNodesByRepository[repositoryUuid] || [];
    },

    /**
     * 根据UUID获取树节点
     */
    getNodeByUuid: (state) => (uuid: string, repositoryUuid: string): RepositoryContracts.TreeNode | null => {
      const tree = state.treeNodesByRepository[repositoryUuid] || [];
      return findNodeInTree(tree, uuid);
    },

    /**
     * 获取当前选中的节点
     */
    getSelectedNode(state): RepositoryContracts.TreeNode | null {
      if (!state.selectedNodeUuid) return null;
      
      // 在所有仓储中查找
      for (const repositoryUuid in state.treeNodesByRepository) {
        const node = findNodeInTree(
          state.treeNodesByRepository[repositoryUuid],
          state.selectedNodeUuid
        );
        if (node) return node;
      }
      
      return null;
    },

    /**
     * 检查节点是否已展开
     */
    isNodeExpanded: (state) => (uuid: string): boolean => {
      return state.expandedNodes.has(uuid);
    },

    /**
     * 获取文件夹节点（type === 'folder'）
     */
    getFolderNodes: (state) => (repositoryUuid: string): RepositoryContracts.TreeNode[] => {
      const tree = state.treeNodesByRepository[repositoryUuid] || [];
      return filterNodesByType(tree, 'folder');
    },

    /**
     * 获取文件节点（type === 'file'）
     */
    getFileNodes: (state) => (repositoryUuid: string): RepositoryContracts.TreeNode[] => {
      const tree = state.treeNodesByRepository[repositoryUuid] || [];
      return filterNodesByType(tree, 'file');
    },
  },

  actions: {
    // ===== API 调用 =====

    /**
     * 加载仓储的文件树
     * @param repositoryUuid 仓储UUID
     */
    async loadTree(repositoryUuid: string): Promise<void> {
      this.isLoading = true;
      this.error = null;

      try {
        console.log(`📦 [FileTreeStore] 加载文件树: ${repositoryUuid}`);
        
        const response = await repositoryApiClient.getFileTree(repositoryUuid);
        
        if (response.success && response.data) {
          this.setTreeForRepository(repositoryUuid, response.data.tree);
          console.log(`✅ [FileTreeStore] 文件树加载成功: ${response.data.tree.length} 个节点`);
        } else {
          throw new Error(response.message || '加载文件树失败');
        }
      } catch (error: any) {
        this.error = error.message || '加载文件树失败';
        console.error('❌ [FileTreeStore] 加载失败:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 刷新文件树
     */
    async refreshTree(repositoryUuid: string): Promise<void> {
      await this.loadTree(repositoryUuid);
    },

    // ===== 数据管理 =====

    /**
     * 设置仓储的文件树
     */
    setTreeForRepository(repositoryUuid: string, tree: RepositoryContracts.TreeNode[]) {
      this.treeNodesByRepository[repositoryUuid] = tree;
      console.log(`✅ [FileTreeStore] 已设置文件树: ${tree.length} 个节点 (仓储: ${repositoryUuid})`);
    },

    /**
     * 添加节点到树中
     */
    addNode(repositoryUuid: string, node: RepositoryContracts.TreeNode) {
      if (!this.treeNodesByRepository[repositoryUuid]) {
        this.treeNodesByRepository[repositoryUuid] = [];
      }
      
      // 检查节点是否已存在
      const existingIndex = this.treeNodesByRepository[repositoryUuid].findIndex(
        n => n.uuid === node.uuid
      );
      
      if (existingIndex >= 0) {
        // 更新现有节点
        this.treeNodesByRepository[repositoryUuid][existingIndex] = node;
      } else {
        // 添加新节点
        this.treeNodesByRepository[repositoryUuid].push(node);
      }
    },

    /**
     * 更新节点
     */
    updateNode(repositoryUuid: string, uuid: string, updates: Partial<RepositoryContracts.TreeNode>) {
      const tree = this.treeNodesByRepository[repositoryUuid];
      if (!tree) return;

      const node = findNodeInTree(tree, uuid);
      if (node) {
        Object.assign(node, updates);
      }
    },

    /**
     * 删除节点
     */
    removeNode(repositoryUuid: string, uuid: string) {
      const tree = this.treeNodesByRepository[repositoryUuid];
      if (!tree) return;

      this.treeNodesByRepository[repositoryUuid] = removeNodeFromTree(tree, uuid);
      
      // 清除相关UI状态
      if (this.selectedNodeUuid === uuid) {
        this.selectedNodeUuid = null;
      }
      this.expandedNodes.delete(uuid);
    },

    /**
     * 移除仓储的所有节点
     */
    removeTreeByRepository(repositoryUuid: string) {
      delete this.treeNodesByRepository[repositoryUuid];
      
      // 清除选中状态
      if (this.selectedNodeUuid) {
        const node = this.getSelectedNode;
        if (node && node.repositoryUuid === repositoryUuid) {
          this.selectedNodeUuid = null;
        }
      }
    },

    // ===== UI 状态管理 =====

    /**
     * 选中节点
     */
    selectNode(uuid: string | null) {
      this.selectedNodeUuid = uuid;
    },

    /**
     * 切换节点展开状态（仅适用于文件夹）
     */
    toggleNode(uuid: string) {
      if (this.expandedNodes.has(uuid)) {
        this.expandedNodes.delete(uuid);
      } else {
        this.expandedNodes.add(uuid);
      }
    },

    /**
     * 展开节点
     */
    expandNode(uuid: string) {
      this.expandedNodes.add(uuid);
    },

    /**
     * 折叠节点
     */
    collapseNode(uuid: string) {
      this.expandedNodes.delete(uuid);
    },

    /**
     * 展开所有文件夹节点
     */
    expandAll(repositoryUuid: string) {
      const folders = this.getFolderNodes(repositoryUuid);
      folders.forEach(folder => {
        this.expandedNodes.add(folder.uuid);
      });
    },

    /**
     * 折叠所有文件夹节点
     */
    collapseAll() {
      this.expandedNodes.clear();
    },

    // ===== 清理 =====

    /**
     * 清除所有数据
     */
    clearAll() {
      this.treeNodesByRepository = {};
      this.selectedNodeUuid = null;
      this.expandedNodes.clear();
      this.error = null;
      console.log('🧹 [FileTreeStore] 已清除所有数据');
    },
  },

  persist: {
    key: 'file-tree-store',
    storage: localStorage,
    pick: ['treeNodesByRepository', 'selectedNodeUuid', 'expandedNodes'],
    
    serializer: {
      serialize: (value: any) => {
        return JSON.stringify({
          ...value,
          expandedNodes: Array.from(value.expandedNodes || []),
        });
      },
      
      deserialize: (value: string) => {
        const parsed = JSON.parse(value);
        return {
          ...parsed,
          expandedNodes: new Set(parsed.expandedNodes || []),
        };
      },
    },
  },
});

// ===== 辅助函数 =====

/**
 * 在树中查找节点
 */
function findNodeInTree(tree: RepositoryContracts.TreeNode[], uuid: string): RepositoryContracts.TreeNode | null {
  for (const node of tree) {
    if (node.uuid === uuid) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeInTree(node.children, uuid);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 从树中移除节点
 */
function removeNodeFromTree(tree: RepositoryContracts.TreeNode[], uuid: string): RepositoryContracts.TreeNode[] {
  return tree
    .filter(node => node.uuid !== uuid)
    .map(node => ({
      ...node,
      children: node.children ? removeNodeFromTree(node.children, uuid) : undefined,
    }));
}

/**
 * 按类型过滤节点
 */
function filterNodesByType(tree: RepositoryContracts.TreeNode[], type: 'folder' | 'file'): RepositoryContracts.TreeNode[] {
  const result: RepositoryContracts.TreeNode[] = [];
  
  for (const node of tree) {
    if (node.type === type) {
      result.push(node);
    }
    if (node.children) {
      result.push(...filterNodesByType(node.children, type));
    }
  }
  
  return result;
}

export type FileTreeStore = ReturnType<typeof useFileTreeStore>;
