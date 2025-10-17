import { PrismaClient } from '@prisma/client';
import type { IRepositoryRepository } from '@dailyuse/domain-server';
import {
  RepositoryAggregate as Repository,
  ResourceEntity as Resource,
  RepositoryExplorerEntity,
  ResourceReferenceEntity,
  LinkedContentEntity,
} from '@dailyuse/domain-server';

/**
 * Repository 聚合根 Prisma 仓储实现
 * 负责 Repository 及其所有子实体的完整持久化
 */
export class PrismaRepositoryAggregateRepository implements IRepositoryRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 Repository 聚合根实体
   */
  private mapRepositoryToEntity(repo: any): Repository {
    // 使用领域实体的 fromPersistenceDTO 方法创建实体
    const repositoryEntity = Repository.fromPersistenceDTO({
      uuid: repo.uuid,
      accountUuid: repo.accountUuid,
      name: repo.name,
      type: repo.type,
      path: repo.path,
      description: repo.description,
      config: repo.config,
      relatedGoals: repo.relatedGoals,
      status: repo.status,
      git: repo.git,
      syncStatus: repo.syncStatus,
      stats: repo.stats,
      lastAccessedAt: repo.lastAccessedAt,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
    });

    // 加载 Resource 子实体
    if (repo.resources) {
      repo.resources.forEach((res: any) => {
        const resourceEntity = Resource.fromPersistenceDTO({
          uuid: res.uuid,
          repositoryUuid: res.repositoryUuid,
          name: res.name,
          type: res.type,
          path: res.path,
          size: res.size,
          description: res.description,
          author: res.author,
          version: res.version,
          tags: res.tags,
          category: res.category,
          status: res.status,
          metadata: res.metadata,
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
          modifiedAt: res.modifiedAt,
        });

        // 加载 ResourceReference
        if (res.sourceReferences) {
          res.sourceReferences.forEach((ref: any) => {
            const refEntity = ResourceReferenceEntity.fromPersistenceDTO({
              uuid: ref.uuid,
              sourceResourceUuid: ref.sourceResourceUuid,
              targetResourceUuid: ref.targetResourceUuid,
              referenceType: ref.referenceType,
              description: ref.description,
              createdAt: ref.createdAt,
              updatedAt: ref.updatedAt,
              lastVerifiedAt: ref.lastVerifiedAt,
            });
            resourceEntity.addReference(refEntity);
          });
        }

        // 加载 LinkedContent
        if (res.linkedContents) {
          res.linkedContents.forEach((content: any) => {
            const contentEntity = LinkedContentEntity.fromPersistenceDTO({
              uuid: content.uuid,
              resourceUuid: content.resourceUuid,
              title: content.title,
              url: content.url,
              contentType: content.contentType,
              description: content.description,
              thumbnail: content.thumbnail,
              author: content.author,
              publishedAt: content.publishedAt,
              isAccessible: content.isAccessible,
              lastCheckedAt: content.lastCheckedAt,
              cachedAt: content.cachedAt,
              createdAt: content.createdAt,
              updatedAt: content.updatedAt,
            });
            resourceEntity.addLinkedContent(contentEntity);
          });
        }

        repositoryEntity.addResource(resourceEntity);
      });
    }

    // 加载 RepositoryExplorer 子实体
    if (repo.explorers && repo.explorers.length > 0) {
      // 取第一个 explorer（每个用户对每个仓库应该只有一个 explorer）
      const explorer = repo.explorers[0];
      const explorerEntity = RepositoryExplorerEntity.fromPersistenceDTO({
        uuid: explorer.uuid,
        repositoryUuid: explorer.repositoryUuid,
        accountUuid: explorer.accountUuid,
        name: explorer.name,
        description: explorer.description,
        currentPath: explorer.currentPath,
        filters: explorer.filters,
        viewConfig: explorer.viewConfig,
        pinnedPaths: explorer.pinnedPaths,
        recentPaths: explorer.recentPaths,
        lastScanAt: explorer.lastScanAt,
        createdAt: explorer.createdAt,
        updatedAt: explorer.updatedAt,
      });
      repositoryEntity.setExplorer(explorerEntity);
    }

    return repositoryEntity;
  }

  // ===== IRepositoryRepository 接口实现 =====

  async save(repository: Repository): Promise<void> {
    // 使用实体的 toPersistenceDTO 方法转换为持久化数据
    const repoPersistence = repository.toPersistenceDTO();

    // 转换时间戳为 Date 对象
    const toDate = (timestamp: number | null | undefined): Date | null | undefined => {
      if (timestamp == null) return timestamp as null | undefined;
      return new Date(timestamp);
    };

    // 使用事务保存 Repository 及其所有子实体
    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert Repository 主实体
      await tx.repository.upsert({
        where: { uuid: repoPersistence.uuid },
        create: {
          uuid: repoPersistence.uuid,
          accountUuid: repoPersistence.account_uuid,
          name: repoPersistence.name,
          type: repoPersistence.type,
          path: repoPersistence.path,
          description: repoPersistence.description,
          config: repoPersistence.config,
          relatedGoals: repoPersistence.related_goals,
          status: repoPersistence.status,
          git: repoPersistence.git,
          syncStatus: repoPersistence.sync_status,
          stats: repoPersistence.stats,
          lastAccessedAt: toDate(repoPersistence.last_accessed_at),
          createdAt: toDate(repoPersistence.created_at) ?? new Date(),
          updatedAt: toDate(repoPersistence.updated_at) ?? new Date(),
        },
        update: {
          name: repoPersistence.name,
          type: repoPersistence.type,
          path: repoPersistence.path,
          description: repoPersistence.description,
          config: repoPersistence.config,
          relatedGoals: repoPersistence.related_goals,
          status: repoPersistence.status,
          git: repoPersistence.git,
          syncStatus: repoPersistence.sync_status,
          stats: repoPersistence.stats,
          lastAccessedAt: toDate(repoPersistence.last_accessed_at),
          updatedAt: toDate(repoPersistence.updated_at) ?? new Date(),
        },
      });

      // 2. Upsert Resources 及其子实体
      const resources = repository.getAllResources();
      for (const resource of resources) {
        const resourcePersistence = resource.toPersistenceDTO();
        await tx.repositoryResource.upsert({
          where: { uuid: resourcePersistence.uuid },
          create: {
            uuid: resourcePersistence.uuid,
            repositoryUuid: repoPersistence.uuid,
            name: resourcePersistence.name,
            type: resourcePersistence.type,
            path: resourcePersistence.path,
            size: resourcePersistence.size,
            description: resourcePersistence.description,
            author: resourcePersistence.author,
            version: resourcePersistence.version,
            tags: resourcePersistence.tags,
            category: resourcePersistence.category,
            status: resourcePersistence.status,
            metadata: resourcePersistence.metadata,
            createdAt: toDate(resourcePersistence.created_at) ?? new Date(),
            updatedAt: toDate(resourcePersistence.updated_at) ?? new Date(),
            modifiedAt: toDate(resourcePersistence.modified_at),
          },
          update: {
            name: resourcePersistence.name,
            type: resourcePersistence.type,
            path: resourcePersistence.path,
            size: resourcePersistence.size,
            description: resourcePersistence.description,
            author: resourcePersistence.author,
            version: resourcePersistence.version,
            tags: resourcePersistence.tags,
            category: resourcePersistence.category,
            status: resourcePersistence.status,
            metadata: resourcePersistence.metadata,
            updatedAt: toDate(resourcePersistence.updated_at) ?? new Date(),
            modifiedAt: toDate(resourcePersistence.modified_at),
          },
        });

        // 3. Upsert ResourceReferences for this resource
        const references = resource.getAllReferences();
        for (const ref of references) {
          const refPersistence = ref.toPersistenceDTO();
          await tx.resourceReference.upsert({
            where: { uuid: refPersistence.uuid },
            create: {
              uuid: refPersistence.uuid,
              sourceResourceUuid: refPersistence.source_resource_uuid,
              targetResourceUuid: refPersistence.target_resource_uuid,
              referenceType: refPersistence.reference_type,
              description: refPersistence.description,
              createdAt: toDate(refPersistence.created_at) ?? new Date(),
              updatedAt: toDate(refPersistence.updated_at) ?? new Date(),
              lastVerifiedAt: toDate(refPersistence.last_verified_at),
            },
            update: {
              targetResourceUuid: refPersistence.target_resource_uuid,
              referenceType: refPersistence.reference_type,
              description: refPersistence.description,
              updatedAt: toDate(refPersistence.updated_at) ?? new Date(),
              lastVerifiedAt: toDate(refPersistence.last_verified_at),
            },
          });
        }

        // 4. Upsert LinkedContents for this resource
        const linkedContents = resource.getAllLinkedContents();
        for (const content of linkedContents) {
          const contentPersistence = content.toPersistenceDTO();
          await tx.linkedContent.upsert({
            where: { uuid: contentPersistence.uuid },
            create: {
              uuid: contentPersistence.uuid,
              resourceUuid: contentPersistence.resource_uuid,
              title: contentPersistence.title,
              url: contentPersistence.url,
              contentType: contentPersistence.content_type,
              description: contentPersistence.description,
              thumbnail: contentPersistence.thumbnail,
              author: contentPersistence.author,
              publishedAt: toDate(contentPersistence.published_at),
              isAccessible: contentPersistence.is_accessible === 1,
              lastCheckedAt: toDate(contentPersistence.last_checked_at),
              cachedAt: toDate(contentPersistence.cached_at),
              createdAt: toDate(contentPersistence.created_at) ?? new Date(),
              updatedAt: toDate(contentPersistence.updated_at) ?? new Date(),
            },
            update: {
              title: contentPersistence.title,
              url: contentPersistence.url,
              contentType: contentPersistence.content_type,
              description: contentPersistence.description,
              thumbnail: contentPersistence.thumbnail,
              author: contentPersistence.author,
              publishedAt: toDate(contentPersistence.published_at),
              isAccessible: contentPersistence.is_accessible === 1,
              lastCheckedAt: toDate(contentPersistence.last_checked_at),
              cachedAt: toDate(contentPersistence.cached_at),
              updatedAt: toDate(contentPersistence.updated_at) ?? new Date(),
            },
          });
        }
      }

      // 5. Upsert RepositoryExplorer
      const explorer = repository.getExplorer();
      if (explorer) {
        const explorerPersistence = explorer.toPersistenceDTO();
        await tx.repositoryExplorer.upsert({
          where: { uuid: explorerPersistence.uuid },
          create: {
            uuid: explorerPersistence.uuid,
            repositoryUuid: repoPersistence.uuid,
            accountUuid: explorerPersistence.account_uuid,
            name: explorerPersistence.name,
            description: explorerPersistence.description,
            currentPath: explorerPersistence.current_path,
            filters: explorerPersistence.filters,
            viewConfig: explorerPersistence.view_config,
            pinnedPaths: explorerPersistence.pinned_paths,
            recentPaths: explorerPersistence.recent_paths,
            lastScanAt: toDate(explorerPersistence.last_scan_at),
            createdAt: toDate(explorerPersistence.created_at) ?? new Date(),
            updatedAt: toDate(explorerPersistence.updated_at) ?? new Date(),
          },
          update: {
            name: explorerPersistence.name,
            description: explorerPersistence.description,
            currentPath: explorerPersistence.current_path,
            filters: explorerPersistence.filters,
            viewConfig: explorerPersistence.view_config,
            pinnedPaths: explorerPersistence.pinned_paths,
            recentPaths: explorerPersistence.recent_paths,
            lastScanAt: toDate(explorerPersistence.last_scan_at),
            updatedAt: toDate(explorerPersistence.updated_at) ?? new Date(),
          },
        });
      }
    });
  }

  async findById(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Repository | null> {
    const repo = await this.prisma.repository.findUnique({
      where: { uuid },
      include: options?.includeChildren
        ? {
            resources: {
              include: {
                sourceReferences: true,
                linkedContents: true,
              },
            },
            explorers: true,
          }
        : undefined,
    });

    if (!repo) {
      return null;
    }

    return this.mapRepositoryToEntity(repo);
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Repository[]> {
    const repos = await this.prisma.repository.findMany({
      where: { accountUuid },
      include: options?.includeChildren
        ? {
            resources: {
              include: {
                sourceReferences: true,
                linkedContents: true,
              },
            },
            explorers: true,
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return repos.map((repo) => this.mapRepositoryToEntity(repo));
  }

  async findByPath(path: string): Promise<Repository | null> {
    const repo = await this.prisma.repository.findFirst({
      where: { path },
      include: {
        resources: {
          include: {
            sourceReferences: true,
            linkedContents: true,
          },
        },
        explorers: true,
      },
    });

    if (!repo) {
      return null;
    }

    return this.mapRepositoryToEntity(repo);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Prisma 会自动级联删除相关的子实体（onDelete: Cascade）
      // 但为了明确，我们手动删除

      // 1. 删除所有 LinkedContent
      await tx.linkedContent.deleteMany({
        where: {
          resource: {
            repositoryUuid: uuid,
          },
        },
      });

      // 2. 删除所有 ResourceReference
      await tx.resourceReference.deleteMany({
        where: {
          OR: [
            { sourceResource: { repositoryUuid: uuid } },
            { targetResource: { repositoryUuid: uuid } },
          ],
        },
      });

      // 3. 删除所有 Resource
      await tx.repositoryResource.deleteMany({
        where: { repositoryUuid: uuid },
      });

      // 4. 删除 RepositoryExplorer
      await tx.repositoryExplorer.deleteMany({
        where: { repositoryUuid: uuid },
      });

      // 5. 删除 Repository 主实体
      await tx.repository.delete({
        where: { uuid },
      });
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.repository.count({
      where: { uuid },
    });
    return count > 0;
  }

  async isPathUsed(path: string, excludeUuid?: string): Promise<boolean> {
    const count = await this.prisma.repository.count({
      where: {
        path,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
    return count > 0;
  }
}
