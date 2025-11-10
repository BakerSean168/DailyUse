/**
 * Prisma Resource Repository Implementation
 * Resource 实体的 Prisma 仓储实现
 */
import { PrismaClient } from '@prisma/client';
import { Resource } from '@dailyuse/domain-server/repository/entities';
import { IResourceRepository } from '../../domain/repositories/IResourceRepository';
import type { RepositoryContracts } from '@dailyuse/contracts';

type ResourceServerDTO = RepositoryContracts.ResourceServerDTO;

export class PrismaResourceRepository implements IResourceRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(uuid: string): Promise<Resource | null> {
    const data = await this.prisma.resource.findUnique({
      where: { uuid },
    });

    if (!data) return null;

    return Resource.fromPersistenceDTO({
      uuid: data.uuid,
      repository_uuid: data.repositoryUuid,
      folder_uuid: data.folderUuid,
      name: data.name,
      type: data.type as any,
      path: data.path,
      size: data.size,
      content: data.content,
      metadata: JSON.stringify(data.metadata),
      stats: JSON.stringify(data.stats),
      status: data.status as any,
      created_at: new Date(Number(data.createdAt)),
      updated_at: new Date(Number(data.updatedAt)),
    });
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]> {
    const resources = await this.prisma.resource.findMany({
      where: { repositoryUuid },
      orderBy: { createdAt: 'desc' },
    });

    return resources.map((data) =>
      Resource.fromPersistenceDTO({
        uuid: data.uuid,
        repository_uuid: data.repositoryUuid,
        folder_uuid: data.folderUuid,
        name: data.name,
        type: data.type as any,
        path: data.path,
        size: data.size,
        content: data.content,
        metadata: JSON.stringify(data.metadata),
        stats: JSON.stringify(data.stats),
        status: data.status as any,
        created_at: new Date(Number(data.createdAt)),
        updated_at: new Date(Number(data.updatedAt)),
      }),
    );
  }

  async findByFolderUuid(folderUuid: string): Promise<Resource[]> {
    const resources = await this.prisma.resource.findMany({
      where: { folderUuid },
      orderBy: { name: 'asc' },
    });

    return resources.map((data) =>
      Resource.fromPersistenceDTO({
        uuid: data.uuid,
        repository_uuid: data.repositoryUuid,
        folder_uuid: data.folderUuid,
        name: data.name,
        type: data.type as any,
        path: data.path,
        size: data.size,
        content: data.content,
        metadata: JSON.stringify(data.metadata),
        stats: JSON.stringify(data.stats),
        status: data.status as any,
        created_at: new Date(Number(data.createdAt)),
        updated_at: new Date(Number(data.updatedAt)),
      }),
    );
  }

  async save(resource: Resource): Promise<void> {
    const persistenceDTO = resource.toPersistenceDTO();

    await this.prisma.resource.upsert({
      where: { uuid: persistenceDTO.uuid },
      create: {
        uuid: persistenceDTO.uuid,
        repositoryUuid: persistenceDTO.repository_uuid,
        folderUuid: persistenceDTO.folder_uuid,
        name: persistenceDTO.name,
        type: persistenceDTO.type,
        path: persistenceDTO.path,
        size: persistenceDTO.size,
        content: persistenceDTO.content,
        metadata: JSON.parse(persistenceDTO.metadata),
        stats: JSON.parse(persistenceDTO.stats),
        status: persistenceDTO.status,
        createdAt: BigInt(persistenceDTO.created_at.getTime()),
        updatedAt: BigInt(persistenceDTO.updated_at.getTime()),
      },
      update: {
        name: persistenceDTO.name,
        folderUuid: persistenceDTO.folder_uuid,
        path: persistenceDTO.path,
        size: persistenceDTO.size,
        content: persistenceDTO.content,
        metadata: JSON.parse(persistenceDTO.metadata),
        stats: JSON.parse(persistenceDTO.stats),
        status: persistenceDTO.status,
        updatedAt: BigInt(persistenceDTO.updated_at.getTime()),
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.resource.delete({
      where: { uuid },
    });
  }

  async existsByPath(repositoryUuid: string, path: string): Promise<boolean> {
    const count = await this.prisma.resource.count({
      where: {
        repositoryUuid,
        path,
      },
    });
    return count > 0;
  }
}
