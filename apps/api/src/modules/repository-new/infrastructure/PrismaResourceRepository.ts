/**
 * Prisma Resource Repository Implementation
 * 使用 Prisma 实现 Resource 仓储
 */

import { PrismaClient } from '@prisma/client';
import { Resource } from '@dailyuse/domain-server';
import type { IResourceRepository, FindResourceOptions } from '../domain/IResourceRepository';
import type { ResourcePersistenceDTO, ResourceType } from '@dailyuse/contracts';

export class PrismaResourceRepository implements IResourceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 保存资源（创建或更新）
   */
  async save(resource: Resource): Promise<void> {
    const persistenceDTO = resource.toPersistenceDTO();

    await this.prisma.resource.upsert({
      where: { uuid: persistenceDTO.uuid },
      create: this.toPrismaCreateInput(persistenceDTO),
      update: this.toPrismaUpdateInput(persistenceDTO),
    });
  }

  /**
   * 根据 UUID 查找资源
   */
  async findByUuid(uuid: string): Promise<Resource | null> {
    const record = await this.prisma.resource.findUnique({
      where: { uuid },
    });

    return record ? this.toDomain(record) : null;
  }

  /**
   * 根据仓库查找资源（分页 + 筛选）
   */
  async findByRepository(
    repositoryUuid: string,
    options: FindResourceOptions,
  ): Promise<{ resources: Resource[]; total: number }> {
    // 构建查询条件
    const where: any = {
      repositoryUuid,
      status: { not: 'DELETED' }, // 排除已删除
    };

    if (options.type) {
      where.type = options.type;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.category) {
      where.category = options.category;
    }

    if (options.tags && options.tags.length > 0) {
      // JSON 字符串查询：检查 tags JSON 是否包含任一标签
      // 例如: tags='["tag1","tag2"]' 包含 "tag1"
      where.OR = options.tags.map((tag) => ({
        tags: { contains: `"${tag}"` },
      }));
    }

    // 查询总数
    const total = await this.prisma.resource.count({ where });

    // 查询分页数据
    const records = await this.prisma.resource.findMany({
      where,
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
      orderBy: {
        [options.sortBy]: options.sortOrder,
      },
    });

    return {
      resources: records.map((record) => this.toDomain(record)),
      total,
    };
  }

  /**
   * 删除资源（物理删除）
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.resource.delete({
      where: { uuid },
    });
  }

  /**
   * 根据标签查找资源
   */
  async findByTags(tags: string[]): Promise<Resource[]> {
    const records = await this.prisma.resource.findMany({
      where: {
        AND: [
          { status: { not: 'DELETED' } },
          {
            OR: tags.map((tag) => ({
              tags: { contains: `"${tag}"` },
            })),
          },
        ],
      },
    });

    return records.map((record) => this.toDomain(record));
  }

  /**
   * 根据类型查找资源
   */
  async findByType(repositoryUuid: string, type: ResourceType): Promise<Resource[]> {
    const records = await this.prisma.resource.findMany({
      where: {
        repositoryUuid,
        type,
        status: { not: 'DELETED' },
      },
    });

    return records.map((record) => this.toDomain(record));
  }

  // ==================== Private Helpers ====================

  private toPrismaCreateInput(dto: ResourcePersistenceDTO): any {
    return {
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      size: BigInt(dto.size), // number → BigInt
      description: dto.description,
      author: dto.author,
      version: dto.version,
      tags: dto.tags,
      category: dto.category,
      status: dto.status,
      metadata: dto.metadata,
      createdAt: BigInt(dto.createdAt), // number → BigInt
      updatedAt: BigInt(dto.updatedAt), // number → BigInt
      modifiedAt: dto.modifiedAt ? BigInt(dto.modifiedAt) : null, // number → BigInt
    };
  }

  private toPrismaUpdateInput(dto: ResourcePersistenceDTO): any {
    return {
      name: dto.name,
      path: dto.path,
      size: BigInt(dto.size), // number → BigInt
      description: dto.description,
      author: dto.author,
      version: dto.version,
      tags: dto.tags,
      category: dto.category,
      status: dto.status,
      metadata: dto.metadata,
      updatedAt: BigInt(dto.updatedAt), // number → BigInt
      modifiedAt: dto.modifiedAt ? BigInt(dto.modifiedAt) : null, // number → BigInt
    };
  }

  private toDomain(record: any): Resource {
    const persistenceDTO: ResourcePersistenceDTO = {
      uuid: record.uuid,
      repositoryUuid: record.repositoryUuid,
      name: record.name,
      type: record.type,
      path: record.path,
      size: Number(record.size), // BigInt → number
      description: record.description,
      author: record.author,
      version: record.version,
      tags: record.tags,
      category: record.category,
      status: record.status,
      metadata: record.metadata,
      createdAt: Number(record.createdAt), // BigInt → number
      updatedAt: Number(record.updatedAt), // BigInt → number
      modifiedAt: record.modifiedAt ? Number(record.modifiedAt) : null, // BigInt → number
    };

    return Resource.fromPersistence(persistenceDTO);
  }
}
