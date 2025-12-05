/**
 * Get Folder Tree
 *
 * 获取文件夹树（指定仓储）
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { Folder, FolderHierarchyService } from '@dailyuse/domain-server/repository';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Folder Tree Input
 */
export interface GetFolderTreeInput {
  repositoryUuid: string;
}

/**
 * Get Folder Tree Output
 */
export interface GetFolderTreeOutput {
  folders: FolderClientDTO[];
}

/**
 * Get Folder Tree
 */
export class GetFolderTree {
  private static instance: GetFolderTree;
  private hierarchyService: FolderHierarchyService;

  private constructor(private readonly folderRepository: IFolderRepository) {
    this.hierarchyService = new FolderHierarchyService();
  }

  static createInstance(folderRepository?: IFolderRepository): GetFolderTree {
    const container = RepositoryContainer.getInstance();
    const repo = folderRepository || container.getFolderRepository();
    GetFolderTree.instance = new GetFolderTree(repo);
    return GetFolderTree.instance;
  }

  static getInstance(): GetFolderTree {
    if (!GetFolderTree.instance) {
      GetFolderTree.instance = GetFolderTree.createInstance();
    }
    return GetFolderTree.instance;
  }

  static resetInstance(): void {
    GetFolderTree.instance = undefined as unknown as GetFolderTree;
  }

  async execute(input: GetFolderTreeInput): Promise<GetFolderTreeOutput> {
    const allFolders = await this.folderRepository.findByRepositoryUuid(input.repositoryUuid);
    const tree = this.hierarchyService.buildTree(allFolders);

    const convertTreeNode = (node: any): FolderClientDTO => {
      const folder = node.folder as Folder;
      const clientDTO = folder.toClientDTO(false);

      if (node.children && node.children.length > 0) {
        clientDTO.children = node.children.map((child: any) => convertTreeNode(child));
      }

      return clientDTO;
    };

    return { folders: tree.map((node) => convertTreeNode(node)) };
  }
}

export const getFolderTree = (input: GetFolderTreeInput): Promise<GetFolderTreeOutput> =>
  GetFolderTree.getInstance().execute(input);
