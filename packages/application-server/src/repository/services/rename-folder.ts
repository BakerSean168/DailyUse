/**
 * Rename Folder
 *
 * 重命名文件夹
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { FolderHierarchyService } from '@dailyuse/domain-server/repository';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Rename Folder Input
 */
export interface RenameFolderInput {
  uuid: string;
  newName: string;
}

/**
 * Rename Folder Output
 */
export interface RenameFolderOutput {
  folder: FolderClientDTO;
}

/**
 * Rename Folder
 */
export class RenameFolder {
  private static instance: RenameFolder;
  private hierarchyService: FolderHierarchyService;

  private constructor(private readonly folderRepository: IFolderRepository) {
    this.hierarchyService = new FolderHierarchyService();
  }

  static createInstance(folderRepository?: IFolderRepository): RenameFolder {
    const container = RepositoryContainer.getInstance();
    const repo = folderRepository || container.getFolderRepository();
    RenameFolder.instance = new RenameFolder(repo);
    return RenameFolder.instance;
  }

  static getInstance(): RenameFolder {
    if (!RenameFolder.instance) {
      RenameFolder.instance = RenameFolder.createInstance();
    }
    return RenameFolder.instance;
  }

  static resetInstance(): void {
    RenameFolder.instance = undefined as unknown as RenameFolder;
  }

  async execute(input: RenameFolderInput): Promise<RenameFolderOutput> {
    const folder = await this.folderRepository.findByUuid(input.uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${input.uuid}`);
    }

    folder.rename(input.newName);
    await this.folderRepository.save(folder);

    await this.hierarchyService.updateChildrenPaths(
      folder.uuid,
      folder.path,
      this.folderRepository,
    );

    return { folder: folder.toClientDTO() };
  }
}

export const renameFolder = (input: RenameFolderInput): Promise<RenameFolderOutput> =>
  RenameFolder.getInstance().execute(input);
