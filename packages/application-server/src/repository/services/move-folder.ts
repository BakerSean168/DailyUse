/**
 * Move Folder
 *
 * 移动文件夹
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { FolderHierarchyService } from '@dailyuse/domain-server/repository';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Move Folder Input
 */
export interface MoveFolderInput {
  uuid: string;
  newParentUuid: string | null;
}

/**
 * Move Folder Output
 */
export interface MoveFolderOutput {
  folder: FolderClientDTO;
}

/**
 * Move Folder
 */
export class MoveFolder {
  private static instance: MoveFolder;
  private hierarchyService: FolderHierarchyService;

  private constructor(private readonly folderRepository: IFolderRepository) {
    this.hierarchyService = new FolderHierarchyService();
  }

  static createInstance(folderRepository?: IFolderRepository): MoveFolder {
    const container = RepositoryContainer.getInstance();
    const repo = folderRepository || container.getFolderRepository();
    MoveFolder.instance = new MoveFolder(repo);
    return MoveFolder.instance;
  }

  static getInstance(): MoveFolder {
    if (!MoveFolder.instance) {
      MoveFolder.instance = MoveFolder.createInstance();
    }
    return MoveFolder.instance;
  }

  static resetInstance(): void {
    MoveFolder.instance = undefined as unknown as MoveFolder;
  }

  async execute(input: MoveFolderInput): Promise<MoveFolderOutput> {
    const folder = await this.folderRepository.findByUuid(input.uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${input.uuid}`);
    }

    if (input.newParentUuid) {
      const hasCycle = await this.hierarchyService.detectCycle(
        folder.uuid,
        input.newParentUuid,
        this.folderRepository,
      );
      if (hasCycle) {
        throw new Error('Circular reference detected');
      }
    }

    let newParentPath: string | null = null;
    if (input.newParentUuid) {
      const newParent = await this.folderRepository.findByUuid(input.newParentUuid);
      if (!newParent) {
        throw new Error(`New parent folder not found: ${input.newParentUuid}`);
      }
      newParentPath = newParent.path;
    }

    folder.moveTo(input.newParentUuid, newParentPath ?? undefined);
    await this.folderRepository.save(folder);

    await this.hierarchyService.updateChildrenPaths(
      folder.uuid,
      folder.path,
      this.folderRepository,
    );

    return { folder: folder.toClientDTO() };
  }
}

export const moveFolder = (input: MoveFolderInput): Promise<MoveFolderOutput> =>
  MoveFolder.getInstance().execute(input);
