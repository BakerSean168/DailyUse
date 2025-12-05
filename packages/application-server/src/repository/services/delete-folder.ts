/**
 * Delete Folder
 *
 * 删除文件夹（级联）
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Delete Folder Input
 */
export interface DeleteFolderInput {
  uuid: string;
}

/**
 * Delete Folder
 */
export class DeleteFolder {
  private static instance: DeleteFolder;

  private constructor(private readonly folderRepository: IFolderRepository) {}

  static createInstance(folderRepository?: IFolderRepository): DeleteFolder {
    const container = RepositoryContainer.getInstance();
    const repo = folderRepository || container.getFolderRepository();
    DeleteFolder.instance = new DeleteFolder(repo);
    return DeleteFolder.instance;
  }

  static getInstance(): DeleteFolder {
    if (!DeleteFolder.instance) {
      DeleteFolder.instance = DeleteFolder.createInstance();
    }
    return DeleteFolder.instance;
  }

  static resetInstance(): void {
    DeleteFolder.instance = undefined as unknown as DeleteFolder;
  }

  async execute(input: DeleteFolderInput): Promise<void> {
    const folder = await this.folderRepository.findByUuid(input.uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${input.uuid}`);
    }

    const collectChildrenUuids = async (folderUuid: string): Promise<string[]> => {
      const uuids = [folderUuid];
      const children = await this.folderRepository.findByParentUuid(folderUuid);

      for (const child of children) {
        const childUuids = await collectChildrenUuids(child.uuid);
        uuids.push(...childUuids);
      }

      return uuids;
    };

    const uuidsToDelete = await collectChildrenUuids(input.uuid);

    for (const folderUuid of uuidsToDelete.reverse()) {
      await this.folderRepository.delete(folderUuid);
    }
  }
}

export const deleteFolder = (input: DeleteFolderInput): Promise<void> =>
  DeleteFolder.getInstance().execute(input);
