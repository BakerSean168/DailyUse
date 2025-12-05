/**
 * Create Folder
 *
 * 创建文件夹
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { Folder } from '@dailyuse/domain-server/repository';
import type { FolderClientDTO, FolderMetadataServerDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Create Folder Input
 */
export interface CreateFolderInput {
  repositoryUuid: string;
  parentUuid?: string | null;
  name: string;
  order?: number;
  metadata?: Partial<FolderMetadataServerDTO>;
}

/**
 * Create Folder Output
 */
export interface CreateFolderOutput {
  folder: FolderClientDTO;
}

/**
 * Create Folder
 */
export class CreateFolder {
  private static instance: CreateFolder;

  private constructor(private readonly folderRepository: IFolderRepository) {}

  static createInstance(folderRepository?: IFolderRepository): CreateFolder {
    const container = RepositoryContainer.getInstance();
    const repo = folderRepository || container.getFolderRepository();
    CreateFolder.instance = new CreateFolder(repo);
    return CreateFolder.instance;
  }

  static getInstance(): CreateFolder {
    if (!CreateFolder.instance) {
      CreateFolder.instance = CreateFolder.createInstance();
    }
    return CreateFolder.instance;
  }

  static resetInstance(): void {
    CreateFolder.instance = undefined as unknown as CreateFolder;
  }

  async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
    let parentPath: string | null = null;
    if (input.parentUuid) {
      const parent = await this.folderRepository.findByUuid(input.parentUuid);
      if (!parent) {
        throw new Error(`Parent folder not found: ${input.parentUuid}`);
      }
      parentPath = parent.path;
    }

    const folder = Folder.create({
      repositoryUuid: input.repositoryUuid,
      parentUuid: input.parentUuid,
      name: input.name,
      parentPath,
      order: input.order,
      metadata: input.metadata,
    });

    await this.folderRepository.save(folder);
    return { folder: folder.toClientDTO() };
  }
}

export const createFolder = (input: CreateFolderInput): Promise<CreateFolderOutput> =>
  CreateFolder.getInstance().execute(input);
