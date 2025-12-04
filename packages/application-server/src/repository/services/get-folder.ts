/**
 * Get Folder
 *
 * 获取文件夹详情
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '../RepositoryContainer';

/**
 * Get Folder Input
 */
export interface GetFolderInput {
  uuid: string;
}

/**
 * Get Folder Output
 */
export interface GetFolderOutput {
  folder: FolderClientDTO | null;
}

/**
 * Get Folder
 */
export class GetFolder {
  private static instance: GetFolder;

  private constructor(private readonly folderRepository: IFolderRepository) {}

  static createInstance(folderRepository?: IFolderRepository): GetFolder {
    const container = RepositoryContainer.getInstance();
    const repo = folderRepository || container.getFolderRepository();
    GetFolder.instance = new GetFolder(repo);
    return GetFolder.instance;
  }

  static getInstance(): GetFolder {
    if (!GetFolder.instance) {
      GetFolder.instance = GetFolder.createInstance();
    }
    return GetFolder.instance;
  }

  static resetInstance(): void {
    GetFolder.instance = undefined as unknown as GetFolder;
  }

  async execute(input: GetFolderInput): Promise<GetFolderOutput> {
    const folder = await this.folderRepository.findByUuid(input.uuid);
    return { folder: folder ? folder.toClientDTO() : null };
  }
}

export const getFolder = (input: GetFolderInput): Promise<GetFolderOutput> =>
  GetFolder.getInstance().execute(input);
