/**
 * Prisma Repository Repository Implementation
 * 使用 Prisma 实现 Repository 仓储
 */

import { PrismaClient } from '@prisma/client';
import { Repository } from '@dailyuse/domain-server';
import type { IRepositoryRepository } from '../domain/IRepositoryRepository';
import type { RepositoryPersistenceDTO } from '@dailyuse/contracts';

export class PrismaRepositoryRepository implements IRepositoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 保存仓库（创建或更新）
   */
  async save(repository: Repository): Promise<void> {
    const data = repository.toPersistenceDTO();
    await this.prisma.repository.upsert({
      where: { uuid: data.uuid },
      create: this.toPrismaCreateInput(data),
      update: this.toPrismaUpdateInput(data),
    });
  }

  /**
   * 根据 UUID 查找仓库
   */
  async findByUuid(uuid: string): Promise<Repository | null> {
    const record = await this.prisma.repository.findUnique({
      where: { uuid },
    });

    return record ? this.toDomain(record) : null;
  }

  /**
   * 根据账户查找所有仓库
   */
  async findByAccount(accountUuid: string): Promise<Repository[]> {
    const records = await this.prisma.repository.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.toDomain(record));
  }

  /**
   * 根据名称和账户查找仓库（唯一性检查）
   */
  async findByNameAndAccount(name: string, accountUuid: string): Promise<Repository | null> {
    const record = await this.prisma.repository.findFirst({
      where: { name, accountUuid },
    });

    return record ? this.toDomain(record) : null;
  }

  /**
   * 删除仓库（物理删除）
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.repository.delete({
      where: { uuid },
    });
  }

  // ==================== Private Helpers ====================

  private toPrismaCreateInput(dto: RepositoryPersistenceDTO): any {
    return {
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: dto.config,
      relatedGoals: dto.relatedGoals,
      status: dto.status,
      git: dto.git,
      syncStatus: dto.syncStatus,
      stats: dto.stats,
      // 转换: number (epoch ms) → DateTime
      lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  private toPrismaUpdateInput(dto: RepositoryPersistenceDTO): any {
    return {
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: dto.config,
      relatedGoals: dto.relatedGoals,
      status: dto.status,
      git: dto.git,
      syncStatus: dto.syncStatus,
      stats: dto.stats,
      // 转换: number (epoch ms) → DateTime
      lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
      updatedAt: new Date(dto.updatedAt),
    };
  }

  private toDomain(record: any): Repository {
    const persistenceDTO: RepositoryPersistenceDTO = {
      uuid: record.uuid,
      accountUuid: record.accountUuid,
      name: record.name,
      type: record.type,
      path: record.path,
      description: record.description,
      config: record.config,
      relatedGoals: record.relatedGoals,
      status: record.status,
      git: record.git,
      syncStatus: record.syncStatus,
      stats: record.stats,
      // 转换: DateTime → number (epoch ms)
      lastAccessedAt: record.lastAccessedAt ? record.lastAccessedAt.getTime() : null,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
    };

    return Repository.fromPersistenceDTO(persistenceDTO);
  }
}
