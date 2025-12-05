/**
 * Get Folder Contents
 *
 * 获取文件夹内容用例
 */

import type { IRepositoryApiClient } from '@dailyuse/infrastructure-client';
import type { FolderClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Folder Contents Output
 */
export interface GetFolderContentsOutput {
  folders: FolderClientDTO[];
  resources: ResourceClientDTO[];
}

/**
 * Get Folder Contents
 */
export class GetFolderContents {
  private static instance: GetFolderContents;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): GetFolderContents {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetFolderContents.instance = new GetFolderContents(client);
    return GetFolderContents.instance;
  }

  static getInstance(): GetFolderContents {
    if (!GetFolderContents.instance) {
      GetFolderContents.instance = GetFolderContents.createInstance();
    }
    return GetFolderContents.instance;
  }

  static resetInstance(): void {
    GetFolderContents.instance = undefined as unknown as GetFolderContents;
  }

  async execute(folderUuid: string): Promise<GetFolderContentsOutput> {
    return this.apiClient.getFolderContents(folderUuid);
  }
}

export const getFolderContents = (folderUuid: string): Promise<GetFolderContentsOutput> =>
  GetFolderContents.getInstance().execute(folderUuid);
