import type { IFolderRepository } from '@dailyuse/domain-server';
import { Folder, FolderHierarchyService } from '@dailyuse/domain-server';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { PrismaClient } from '@prisma/client';
import { PrismaFolderRepository } from '../../infrastructure/repositories';

/**
 * Folder 应用服务
 * 负责文件夹（Folder）的 CRUD 操作
 *
 * 职责：
 * - 创建文件夹
 * - 重命名文件夹
 * - 移动文件夹
 * - 删除文件夹（级联）
 * - 查询文件夹树
 */
export class FolderApplicationService {
  private folderRepository: IFolderRepository;
  private hierarchyService: FolderHierarchyService;

  constructor(folderRepository?: IFolderRepository) {
    if (folderRepository) {
      this.folderRepository = folderRepository;
    } else {
      const prisma = new PrismaClient();
      this.folderRepository = new PrismaFolderRepository(prisma);
    }
    this.hierarchyService = new FolderHierarchyService();
  }

  /**
   * 创建文件夹
   */
  async createFolder(params: {
    repositoryUuid: string;
    parentUuid?: string | null;
    name: string;
    order?: number;
    metadata?: Partial<RepositoryContracts.FolderMetadataServerDTO>;
  }): Promise<RepositoryContracts.FolderClientDTO> {
    // 1. 如果有父文件夹，查询父路径
    let parentPath: string | null = null;
    if (params.parentUuid) {
      const parent = await this.folderRepository.findByUuid(params.parentUuid);
      if (!parent) {
        throw new Error(`Parent folder not found: ${params.parentUuid}`);
      }
      parentPath = parent.path;
    }

    // 2. 创建领域实体
    const folder = Folder.create({
      repositoryUuid: params.repositoryUuid,
      parentUuid: params.parentUuid,
      name: params.name,
      parentPath,
      order: params.order,
      metadata: params.metadata,
    });

    // 3. 持久化
    await this.folderRepository.save(folder);

    // 4. 返回 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * 获取文件夹详情
   */
  async getFolder(uuid: string): Promise<RepositoryContracts.FolderClientDTO | null> {
    const folder = await this.folderRepository.findByUuid(uuid);
    return folder ? folder.toClientDTO() : null;
  }

  /**
   * 获取文件夹树（指定仓储）
   */
  async getFolderTree(repositoryUuid: string): Promise<RepositoryContracts.FolderClientDTO[]> {
    // 1. 查询所有文件夹
    const allFolders = await this.folderRepository.findByRepositoryUuid(repositoryUuid);

    // 2. 构建树形结构
    const tree = this.hierarchyService.buildTree(allFolders);

    // 3. 返回 ClientDTO
    return tree.map((f) => f.toClientDTO(true)); // includeChildren=true
  }

  /**
   * 重命名文件夹
   */
  async renameFolder(uuid: string, newName: string): Promise<RepositoryContracts.FolderClientDTO> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 重命名（领域方法会自动更新 path）
    folder.rename(newName);

    // 3. 持久化
    await this.folderRepository.save(folder);

    // 4. 如果有子文件夹，级联更新子路径
    const allFolders = await this.folderRepository.findByRepositoryUuid(folder.repositoryUuid);
    const updatedFolders = this.hierarchyService.updateChildrenPaths(folder, allFolders);

    for (const updated of updatedFolders) {
      await this.folderRepository.save(updated);
    }

    // 5. 返回 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * 移动文件夹
   */
  async moveFolder(
    uuid: string,
    newParentUuid: string | null,
  ): Promise<RepositoryContracts.FolderClientDTO> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 查询所有同仓储的文件夹
    const allFolders = await this.folderRepository.findByRepositoryUuid(folder.repositoryUuid);

    // 3. 循环检测
    if (newParentUuid) {
      const hasCycle = this.hierarchyService.detectCycle(folder.uuid, newParentUuid, allFolders);
      if (hasCycle) {
        throw new Error('Circular reference detected');
      }
    }

    // 4. 获取新父路径
    let newParentPath: string | null = null;
    if (newParentUuid) {
      const newParent = await this.folderRepository.findByUuid(newParentUuid);
      if (!newParent) {
        throw new Error(`New parent folder not found: ${newParentUuid}`);
      }
      newParentPath = newParent.path;
    }

    // 5. 移动（领域方法）
    folder.moveTo(newParentUuid, newParentPath);

    // 6. 持久化
    await this.folderRepository.save(folder);

    // 7. 级联更新子路径
    const updatedFolders = this.hierarchyService.updateChildrenPaths(folder, allFolders);

    for (const updated of updatedFolders) {
      await this.folderRepository.save(updated);
    }

    // 8. 返回 ClientDTO
    return folder.toClientDTO();
  }

  /**
   * 删除文件夹（级联）
   */
  async deleteFolder(uuid: string): Promise<void> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findByUuid(uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${uuid}`);
    }

    // 2. 查询所有子文件夹
    const allFolders = await this.folderRepository.findByRepositoryUuid(folder.repositoryUuid);
    const tree = this.hierarchyService.buildTree(allFolders);

    // 3. 找到当前文件夹及其所有子文件夹
    const toDelete: Folder[] = [];
    const collectChildren = (f: Folder) => {
      toDelete.push(f);
      if (f.children) {
        for (const child of f.children) {
          collectChildren(child);
        }
      }
    };

    const targetInTree = this.findFolderInTree(tree, uuid);
    if (targetInTree) {
      collectChildren(targetInTree);
    } else {
      // 如果不在树中，只删除自己
      toDelete.push(folder);
    }

    // 4. 级联删除（从叶子节点开始）
    for (const f of toDelete.reverse()) {
      await this.folderRepository.delete(f.uuid);
    }
  }

  /**
   * 在树中查找文件夹
   */
  private findFolderInTree(tree: Folder[], uuid: string): Folder | null {
    for (const folder of tree) {
      if (folder.uuid === uuid) {
        return folder;
      }
      if (folder.children) {
        const found = this.findFolderInTree(folder.children, uuid);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}
